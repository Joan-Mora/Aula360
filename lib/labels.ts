import type { RiskBand, Role } from "@prisma/client";

export const bandLabel: Record<RiskBand, string> = {
  BAJO: "Bajo",
  MEDIO: "Medio",
  ALTO: "Alto",
  CRITICO: "Crítico",
};

export const roleLabel: Record<Role, string> = {
  BIENESTAR: "Bienestar",
  DOCENTE: "Docente",
  ESTUDIANTE: "Estudiante",
};

export function fullName(nombres: string, apellidos: string) {
  return `${nombres} ${apellidos}`.trim();
}

export function formatWhen(value: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}
