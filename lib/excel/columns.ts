export const REQUIRED_COLUMNS = [
  "codigo_estudiante",
  "nombres",
  "apellidos",
  "correo",
  "telefono",
  "programa",
  "semestre",
  "porcentaje_asistencia",
  "evaluaciones_programadas",
  "evaluaciones_presentadas",
  "evaluaciones_perdidas",
  "promedio_acumulado",
  "materias_reprobadas",
  "semanas_sin_asistencia",
  "docente_nombre",
  "docente_correo",
] as const;

export const OPTIONAL_COLUMNS = ["curso", "grupo"] as const;

export type ColumnName = (typeof REQUIRED_COLUMNS)[number];

export function canonicalHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_");
}
