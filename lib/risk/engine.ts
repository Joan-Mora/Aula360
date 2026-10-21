export type RiskBandName = "BAJO" | "MEDIO" | "ALTO" | "CRITICO";

export type RiskInput = {
  porcentajeAsistencia: number;
  evaluacionesProgramadas: number;
  evaluacionesPerdidas: number;
  semanasSinAsistencia: number;
  materiasReprobadas: number;
  promedioAcumulado: number;
};

export type RiskFactors = {
  inasistencia: number;
  evaluaciones: number;
  semanas: number;
  materias: number;
  promedio: number;
};

function round4(value: number) {
  return Math.round(value * 10000) / 10000;
}

export function bandFor(score: number): RiskBandName {
  if (score >= 75) return "CRITICO";
  if (score >= 50) return "ALTO";
  if (score >= 25) return "MEDIO";
  return "BAJO";
}

export function computeRisk(input: RiskInput) {
  const inasistencia = (100 - input.porcentajeAsistencia) / 100;
  const evaluaciones = input.evaluacionesPerdidas / input.evaluacionesProgramadas;
  const semanas = Math.min(input.semanasSinAsistencia / 4, 1);
  const materias = Math.min(input.materiasReprobadas / 4, 1);
  const promedio =
    input.promedioAcumulado >= 3 ? 0 : (3 - input.promedioAcumulado) / 3;
  const raw =
    0.3 * inasistencia +
    0.25 * evaluaciones +
    0.2 * semanas +
    0.15 * materias +
    0.1 * promedio;
  const score = Math.max(0, Math.min(100, Math.round(raw * 100)));
  const factors: RiskFactors = {
    inasistencia: round4(inasistencia),
    evaluaciones: round4(evaluaciones),
    semanas: round4(semanas),
    materias: round4(materias),
    promedio: round4(promedio),
  };
  return { score, band: bandFor(score), factors };
}

export function baseActions(band: RiskBandName): string[] {
  if (band === "BAJO") return ["Mantener el monitoreo ordinario del periodo."];
  if (band === "MEDIO") {
    return [
      "El docente contacta al estudiante dentro de cinco días.",
      "Revisar con el estudiante las evaluaciones que aún puede recuperar.",
    ];
  }
  if (band === "ALTO") {
    return [
      "Bienestar abre un caso de permanencia.",
      "El docente escribe por WhatsApp en un plazo de 48 horas.",
      "Definir un plan breve de recuperación de evaluaciones.",
    ];
  }
  return [
    "Contacto inmediato de Bienestar y del docente.",
    "Abrir tutoría de permanencia esta misma semana.",
    "Priorizar el caso en el observatorio hasta el siguiente contacto.",
  ];
}

export function decideNotify(band: RiskBandName, aiWants: boolean | null, aiFailed: boolean) {
  if (band === "BAJO") return false;
  if (band === "CRITICO") return true;
  if (aiFailed || aiWants === null) return band === "ALTO";
  return aiWants;
}

export const factorLabel: Record<keyof RiskFactors, string> = {
  inasistencia: "Inasistencia",
  evaluaciones: "Evaluaciones perdidas",
  semanas: "Semanas sin asistir",
  materias: "Materias reprobadas",
  promedio: "Promedio bajo 3.0",
};
