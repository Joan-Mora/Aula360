import ExcelJS from "exceljs";
import { bandLabel, fullName } from "@/lib/labels";
import type { AcademicSnapshot, Student } from "@prisma/client";

export async function statusWorkbook(
  rows: {
    student: Student;
    snapshot: AcademicSnapshot;
    lastAlert: string;
  }[],
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Aula 360";
  const sheet = workbook.addWorksheet("Estado");
  sheet.columns = [
    { header: "codigo_estudiante", key: "codigo", width: 22 },
    { header: "estudiante", key: "estudiante", width: 32 },
    { header: "programa", key: "programa", width: 28 },
    { header: "semestre", key: "semestre", width: 12 },
    { header: "docente", key: "docente", width: 28 },
    { header: "puntaje", key: "puntaje", width: 12 },
    { header: "banda", key: "banda", width: 12 },
    { header: "porcentaje_asistencia", key: "asistencia", width: 22 },
    { header: "evaluaciones_perdidas", key: "perdidas", width: 22 },
    { header: "promedio_acumulado", key: "promedio", width: 20 },
    { header: "semanas_sin_asistencia", key: "semanas", width: 24 },
    { header: "materias_reprobadas", key: "materias", width: 20 },
    { header: "recomendacion", key: "recomendacion", width: 60 },
    { header: "ultima_alerta", key: "alerta", width: 28 },
  ];
  sheet.getRow(1).font = { bold: true };
  for (const row of rows) {
    const actions = Array.isArray(row.snapshot.aiActions)
      ? row.snapshot.aiActions.map(String).join(" | ")
      : "";
    sheet.addRow({
      codigo: row.student.codigo,
      estudiante: fullName(row.student.nombres, row.student.apellidos),
      programa: row.student.programa,
      semestre: row.student.semestre,
      docente: row.student.docenteNombre,
      puntaje: row.snapshot.riskScore,
      banda: bandLabel[row.snapshot.riskBand],
      asistencia: row.snapshot.porcentajeAsistencia,
      perdidas: row.snapshot.evaluacionesPerdidas,
      promedio: row.snapshot.promedioAcumulado,
      semanas: row.snapshot.semanasSinAsistencia,
      materias: row.snapshot.materiasReprobadas,
      recomendacion: row.snapshot.aiNarrative || actions,
      alerta: row.lastAlert,
    });
  }
  const data = await workbook.xlsx.writeBuffer();
  return Buffer.from(data);
}
