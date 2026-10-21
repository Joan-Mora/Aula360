import PDFDocument from "pdfkit";
import path from "path";
import { bandLabel, formatWhen, fullName } from "@/lib/labels";
import type { AcademicSnapshot, Student } from "@prisma/client";

type Snapshot = AcademicSnapshot;
type Person = Student & { snapshots?: Snapshot[] };

function actionsOf(snapshot: Snapshot) {
  const ai = Array.isArray(snapshot.aiActions) ? snapshot.aiActions.map(String) : [];
  const base = Array.isArray(snapshot.baseActions) ? snapshot.baseActions.map(String) : [];
  return ai.length ? ai : base;
}

export function renderPdf(draw: (doc: PDFKit.PDFDocument) => void) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    draw(doc);
    doc.end();
  });
}

function header(doc: PDFKit.PDFDocument, title: string) {
  const logo = path.join(process.cwd(), "public", "brand", "logo.jpg");
  try {
    doc.image(logo, 48, 42, { width: 46, height: 46 });
  } catch {
    // El informe sigue siendo legible si el archivo de marca no está.
  }
  doc.fillColor("#1C7C74").font("Helvetica").fontSize(10).text("AULA 360", 104, 48);
  doc.fillColor("#102027").fontSize(20).text(title, 104, 64, { width: 420 });
  doc.moveDown(2);
  doc.fillColor("#102027");
}

export function riskListPdf(
  rows: { student: Student; snapshot: Snapshot }[],
) {
  return renderPdf((doc) => {
    header(doc, "Estudiantes en riesgo");
    doc.fontSize(11).text(`Generado ${formatWhen(new Date())}. Incluye bandas alto y crítico.`);
    doc.moveDown();
    if (!rows.length) {
      doc.text("No hay estudiantes en riesgo con la fotografía actual.");
      return;
    }
    for (const row of rows) {
      if (doc.y > 720) doc.addPage();
      doc.font("Helvetica-Bold").fontSize(13).text(
        `${fullName(row.student.nombres, row.student.apellidos)} · ${row.student.codigo}`,
      );
      doc.font("Helvetica").fontSize(11).text(
        `${row.student.programa} · Semestre ${row.student.semestre} · ${bandLabel[row.snapshot.riskBand]} · Puntaje ${row.snapshot.riskScore}`,
      );
      doc.text(`Docente: ${row.student.docenteNombre}`);
      const narrative = row.snapshot.aiNarrative || "Sin narrativa de IA. Se usan las acciones base.";
      doc.text(narrative, { width: 500 });
      for (const action of actionsOf(row.snapshot)) doc.text(`- ${action}`, { width: 500 });
      doc.moveDown();
    }
  });
}

export function dossierPdf(student: Person, snapshot: Snapshot, history: Snapshot[]) {
  return renderPdf((doc) => {
    header(doc, "Expediente de permanencia");
    doc.fontSize(12).text(fullName(student.nombres, student.apellidos));
    doc.fontSize(11).text(`${student.codigo} · ${student.programa} · Semestre ${student.semestre}`);
    doc.text(`Docente: ${student.docenteNombre} · ${student.docenteCorreo}`);
    doc.moveDown();
    doc.font("Helvetica-Bold").text(
      `${bandLabel[snapshot.riskBand]} · puntaje ${snapshot.riskScore}`,
    );
    doc.font("Helvetica").text(snapshot.aiNarrative || "Lectura calculada solo con el Excel oficial.");
    doc.moveDown(0.5);
    doc.text(
      `Asistencia ${snapshot.porcentajeAsistencia}% · Evaluaciones perdidas ${snapshot.evaluacionesPerdidas} de ${snapshot.evaluacionesProgramadas} · Promedio ${snapshot.promedioAcumulado} · Semanas sin asistir ${snapshot.semanasSinAsistencia} · Materias reprobadas ${snapshot.materiasReprobadas}`,
    );
    doc.moveDown();
    doc.font("Helvetica-Bold").text("Acciones");
    doc.font("Helvetica");
    for (const action of actionsOf(snapshot)) doc.text(`- ${action}`);
    doc.moveDown();
    doc.font("Helvetica-Bold").text("Fotografías anteriores");
    doc.font("Helvetica");
    for (const item of history) {
      doc.text(`${formatWhen(item.createdAt)} · ${bandLabel[item.riskBand]} · ${item.riskScore}`);
    }
    doc.moveDown();
    doc.fontSize(9).fillColor("#5d6a72").text(
      "El puntaje oficial sale únicamente del archivo Excel. La actividad del aula no lo modifica.",
    );
  });
}
