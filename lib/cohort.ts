import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { studentWhere } from "@/lib/scope";

export async function latestCohort(user: Pick<User, "id" | "role">) {
  const students = await prisma.student.findMany({
    where: studentWhere(user),
    include: {
      snapshots: { orderBy: { createdAt: "desc" }, take: 1 },
      alerts: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  return students
    .filter((student) => student.snapshots[0])
    .map((student) => ({
      student,
      snapshot: student.snapshots[0],
      lastAlert: student.alerts[0]
        ? `${student.alerts[0].channel} ${student.alerts[0].status}`
        : "sin alerta",
    }))
    .sort((left, right) => right.snapshot.riskScore - left.snapshot.riskScore);
}

export async function riskTrend(user: Pick<User, "id" | "role">) {
  const uploads = await prisma.uploadBatch.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      snapshots: {
        where: { student: studentWhere(user) },
        select: { riskBand: true },
      },
    },
  });
  return uploads
    .filter((upload) => upload.snapshots.length > 0)
    .map((upload) => ({
      carga: upload.createdAt.toLocaleDateString("es-CO"),
      registrados: upload.snapshots.length,
      enRiesgo: upload.snapshots.filter((item) => item.riskBand === "ALTO" || item.riskBand === "CRITICO")
        .length,
    }));
}
