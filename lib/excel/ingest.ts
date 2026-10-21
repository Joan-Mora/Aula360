import type { Prisma, Role } from "@prisma/client";
import { narrateRisk } from "@/lib/ai/gemini";
import { bandLabel, fullName } from "@/lib/labels";
import { passwordEmail, riskEmail } from "@/lib/mail/templates";
import { sendEmail } from "@/lib/mail/send";
import { hashPassword, temporaryPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { baseActions, computeRisk, decideNotify, type RiskBandName } from "@/lib/risk/engine";
import { parseAcademicSheet, type AcademicRow, type SheetError } from "./validate";

type PendingUser = {
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  clave: string;
  passwordHash: string;
};

type Tx = Prisma.TransactionClient;

export async function ingestWorkbook(buffer: Buffer, filename: string, uploadedById: string) {
  const parsed = await parseAcademicSheet(buffer);
  if (parsed.errors.length || parsed.rows.length === 0) {
    return { ok: false as const, errors: parsed.errors };
  }

  const prepared = parsed.rows.map((row) => {
    const risk = computeRisk({
      porcentajeAsistencia: row.porcentajeAsistencia,
      evaluacionesProgramadas: row.evaluacionesProgramadas,
      evaluacionesPerdidas: row.evaluacionesPerdidas,
      semanasSinAsistencia: row.semanasSinAsistencia,
      materiasReprobadas: row.materiasReprobadas,
      promedioAcumulado: row.promedioAcumulado,
    });
    return { row, risk, actions: baseActions(risk.band) };
  });

  const emails = Array.from(
    new Set(prepared.flatMap((item) => [item.row.correo, item.row.docenteCorreo])),
  );
  const existing = await prisma.user.findMany({ where: { email: { in: emails } } });
  const known = new Map(existing.map((user) => [user.email, user]));
  const pending: PendingUser[] = [];

  const planAccount = (email: string, name: string, phone: string | null, role: Role) => {
    const current = known.get(email);
    if (current) return current.role === role ? current.id : null;
    const planned = pending.find((item) => item.email === email);
    if (!planned) {
      pending.push({
        email,
        name,
        phone,
        role,
        clave: temporaryPassword(),
        passwordHash: "",
      });
      return email;
    }
    return planned.role === role ? email : null;
  };

  const links = prepared.map((item) => ({
    docente: planAccount(item.row.docenteCorreo, item.row.docenteNombre, null, "DOCENTE"),
    estudiante: planAccount(
      item.row.correo,
      fullName(item.row.nombres, item.row.apellidos),
      item.row.telefono,
      "ESTUDIANTE",
    ),
  }));

  for (const account of pending) {
    account.passwordHash = await hashPassword(account.clave);
  }

  const saved = await prisma.$transaction(
    async (tx) => {
      const createdUsers = new Map<string, string>();
      for (const account of pending) {
        const user = await tx.user.create({
          data: {
            email: account.email,
            name: account.name,
            phone: account.phone,
            role: account.role,
            passwordHash: account.passwordHash,
            mustChangePassword: true,
          },
        });
        createdUsers.set(account.email, user.id);
      }

      const resolveId = async (link: string | null) => {
        if (!link) return null;
        if (createdUsers.has(link)) return createdUsers.get(link) ?? null;
        return link;
      };

      const upload = await tx.uploadBatch.create({
        data: {
          filename: filename.slice(0, 180),
          uploadedById,
          rowCount: prepared.length,
          createdCount: 0,
          updatedCount: 0,
        },
      });

      let created = 0;
      let updated = 0;
      const snapshots: {
        id: string;
        studentId: string;
        index: number;
        docenteUserId: string | null;
      }[] = [];

      for (let index = 0; index < prepared.length; index += 1) {
        const item = prepared[index];
        const docenteUserId = await resolveId(links[index].docente);
        let studentUserId = await resolveId(links[index].estudiante);
        const result = await upsertStudent(tx, item.row, docenteUserId, studentUserId);
        studentUserId = result.userId;
        if (result.created) created += 1;
        else updated += 1;
        const snapshot = await tx.academicSnapshot.create({
          data: {
            studentId: result.id,
            uploadId: upload.id,
            porcentajeAsistencia: item.row.porcentajeAsistencia,
            evaluacionesProgramadas: item.row.evaluacionesProgramadas,
            evaluacionesPresentadas: item.row.evaluacionesPresentadas,
            evaluacionesPerdidas: item.row.evaluacionesPerdidas,
            promedioAcumulado: item.row.promedioAcumulado,
            materiasReprobadas: item.row.materiasReprobadas,
            semanasSinAsistencia: item.row.semanasSinAsistencia,
            riskScore: item.risk.score,
            riskBand: item.risk.band,
            factors: item.risk.factors,
            baseActions: item.actions,
          },
        });
        snapshots.push({
          id: snapshot.id,
          studentId: result.id,
          index,
          docenteUserId,
        });
      }

      await tx.uploadBatch.update({
        where: { id: upload.id },
        data: { createdCount: created, updatedCount: updated },
      });
      return { created, updated, snapshots };
    },
    { timeout: 60_000 },
  );

  const mailNotes: string[] = [];
  for (const account of pending) {
    try {
      const message = passwordEmail({
        nombre: account.name,
        correo: account.email,
        clave: account.clave,
      });
      await sendEmail(account.email, message.subject, message.html);
    } catch {
      mailNotes.push(`No se pudo enviar la clave temporal a ${account.email}.`);
      if (process.env.NODE_ENV !== "production") {
        console.info(`Clave temporal de ${account.email}: ${account.clave}`);
      }
    }
  }

  let avisos = 0;
  let avisosFallidos = 0;
  for (const snapshot of saved.snapshots) {
    const item = prepared[snapshot.index];
    const outcome = await enrichAndAlert({
      snapshotId: snapshot.id,
      studentId: snapshot.studentId,
      docenteUserId: snapshot.docenteUserId,
      row: item.row,
      band: item.risk.band,
      score: item.risk.score,
      factors: item.risk.factors,
      actions: item.actions,
    });
    avisos += outcome.sent;
    avisosFallidos += outcome.failed;
  }

  return {
    ok: true as const,
    creados: saved.created,
    actualizados: saved.updated,
    avisos,
    avisosFallidos,
    notas: mailNotes,
  };
}

async function upsertStudent(
  tx: Tx,
  row: AcademicRow,
  docenteUserId: string | null,
  studentUserId: string | null,
) {
  const existing = await tx.student.findUnique({ where: { codigo: row.codigo } });
  let userId = studentUserId;
  if (userId) {
    const owner = await tx.student.findUnique({ where: { userId } });
    if (owner && owner.codigo !== row.codigo) userId = existing?.userId ?? null;
  }
  const data = {
    nombres: row.nombres,
    apellidos: row.apellidos,
    correo: row.correo,
    telefono: row.telefono,
    programa: row.programa,
    semestre: row.semestre,
    curso: row.curso,
    grupo: row.grupo,
    docenteNombre: row.docenteNombre,
    docenteCorreo: row.docenteCorreo,
    docenteUserId,
    userId,
  };
  if (!existing) {
    const created = await tx.student.create({ data: { codigo: row.codigo, ...data } });
    return { id: created.id, created: true, userId: created.userId };
  }
  const updated = await tx.student.update({ where: { id: existing.id }, data });
  return { id: updated.id, created: false, userId: updated.userId };
}

async function enrichAndAlert(input: {
  snapshotId: string;
  studentId: string;
  docenteUserId: string | null;
  row: AcademicRow;
  band: RiskBandName;
  score: number;
  factors: Record<string, number>;
  actions: string[];
}) {
  let narrative = input.actions.join(" ");
  let aiFactors: string[] = [];
  let aiActions = input.actions;
  let aiWants: boolean | null = null;
  let motivo = "";
  let aiFailed = false;
  try {
    const ai = await narrateRisk({
      nombre: fullName(input.row.nombres, input.row.apellidos),
      programa: input.row.programa,
      banda: input.band,
      puntaje: input.score,
      factores: input.factors,
      accionesBase: input.actions,
      actividadAula: "Sin efecto sobre el puntaje oficial.",
    });
    narrative = ai.narrativa;
    aiFactors = ai.factores;
    aiActions = ai.acciones.length ? ai.acciones : input.actions;
    aiWants = ai.notificar;
    motivo = ai.motivo;
  } catch {
    aiFailed = true;
  }

  const notify = decideNotify(input.band, aiWants, aiFailed);
  await prisma.academicSnapshot.update({
    where: { id: input.snapshotId },
    data: {
      aiNarrative: narrative,
      aiFactors,
      aiActions,
      aiShouldNotify: notify,
      aiNotifyReason: motivo || null,
      aiFailed,
    },
  });

  if (!notify) return { sent: 0, failed: 0 };

  const recipients = new Map<string, { id: string; email: string; name: string; role: Role }>();
  if (input.band === "ALTO" || input.band === "CRITICO") {
    const team = await prisma.user.findMany({ where: { role: "BIENESTAR", active: true } });
    for (const user of team) {
      recipients.set(user.id, { id: user.id, email: user.email, name: user.name, role: user.role });
    }
  }
  if (input.docenteUserId) {
    const teacher = await prisma.user.findUnique({ where: { id: input.docenteUserId } });
    if (teacher) {
      recipients.set(teacher.id, {
        id: teacher.id,
        email: teacher.email,
        name: teacher.name,
        role: "DOCENTE",
      });
    }
  }

  let sent = 0;
  let failed = 0;
  const estudiante = fullName(input.row.nombres, input.row.apellidos);
  for (const recipient of recipients.values()) {
    const message = riskEmail({
      destinatario: recipient.name,
      estudiante,
      codigo: input.row.codigo,
      programa: input.row.programa,
      banda: bandLabel[input.band],
      puntaje: input.score,
      narrativa: narrative,
      acciones: aiActions,
    });
    let status = "sent";
    try {
      await sendEmail(recipient.email, message.subject, message.html);
      sent += 1;
    } catch {
      status = "failed";
      failed += 1;
    }
    await prisma.alert.create({
      data: {
        studentId: input.studentId,
        snapshotId: input.snapshotId,
        recipientId: recipient.id,
        roleTarget: recipient.role,
        channel: "email",
        title: `${estudiante} en banda ${bandLabel[input.band]}`,
        body: narrative,
        status,
      },
    });
    await prisma.alert.create({
      data: {
        studentId: input.studentId,
        snapshotId: input.snapshotId,
        recipientId: recipient.id,
        roleTarget: recipient.role,
        channel: "in_app",
        title: `${estudiante} en banda ${bandLabel[input.band]}`,
        body: narrative,
        status: "sent",
      },
    });
  }

  if (sent > 0) {
    await prisma.academicSnapshot.update({
      where: { id: input.snapshotId },
      data: { notified: true },
    });
  }
  return { sent, failed };
}

export type IngestFailure = { ok: false; errors: SheetError[] };
