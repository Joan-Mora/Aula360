import { describe, expect, it } from "vitest";
import { bandFor, computeRisk, decideNotify } from "./engine";

const quiet = {
  porcentajeAsistencia: 100,
  evaluacionesProgramadas: 4,
  evaluacionesPerdidas: 0,
  semanasSinAsistencia: 0,
  materiasReprobadas: 0,
  promedioAcumulado: 4.5,
};

describe("computeRisk", () => {
  it("deja en bajo a quien cumple asistencia, evaluaciones y promedio", () => {
    const result = computeRisk(quiet);
    expect(result.score).toBe(0);
    expect(result.band).toBe("BAJO");
  });

  it("clasifica un caso crítico con el peso publicado", () => {
    const result = computeRisk({
      porcentajeAsistencia: 40,
      evaluacionesProgramadas: 4,
      evaluacionesPerdidas: 3,
      semanasSinAsistencia: 4,
      materiasReprobadas: 4,
      promedioAcumulado: 2,
    });
    expect(result.score).toBe(75);
    expect(result.band).toBe("CRITICO");
  });

  it("respeta los cortes de banda", () => {
    expect(bandFor(24)).toBe("BAJO");
    expect(bandFor(25)).toBe("MEDIO");
    expect(bandFor(49)).toBe("MEDIO");
    expect(bandFor(50)).toBe("ALTO");
    expect(bandFor(74)).toBe("ALTO");
    expect(bandFor(75)).toBe("CRITICO");
  });
});

describe("decideNotify", () => {
  it("nunca avisa en bajo y siempre avisa en crítico", () => {
    expect(decideNotify("BAJO", true, false)).toBe(false);
    expect(decideNotify("CRITICO", false, false)).toBe(true);
  });

  it("deja decidir a la IA en medio y alto, y avisa alto si la IA falla", () => {
    expect(decideNotify("MEDIO", false, false)).toBe(false);
    expect(decideNotify("MEDIO", true, false)).toBe(true);
    expect(decideNotify("ALTO", false, false)).toBe(false);
    expect(decideNotify("ALTO", null, true)).toBe(true);
    expect(decideNotify("MEDIO", null, true)).toBe(false);
  });
});
