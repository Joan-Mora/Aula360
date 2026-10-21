import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { parseAcademicSheet } from "./validate";

const headers = [
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
  "curso",
  "grupo",
];

function validRow(codigo = "A360-001") {
  return [
    codigo,
    "Ana",
    "López",
    "ana.lopez@aula360.local",
    "573001110001",
    "Ingeniería de Sistemas",
    4,
    96,
    4,
    4,
    0,
    4.2,
    0,
    0,
    "Marta Rincón",
    "marta.rincon@aula360.local",
    "Permanencia",
    "A",
  ];
}

async function workbookBuffer(setup: (sheet: ExcelJS.Worksheet) => void) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Estudiantes");
  setup(sheet);
  const data = await workbook.xlsx.writeBuffer();
  return Buffer.from(data);
}

describe("parseAcademicSheet", () => {
  it("acepta una fila válida", async () => {
    const buffer = await workbookBuffer((sheet) => {
      sheet.addRow(headers);
      sheet.addRow(validRow());
    });
    const result = await parseAcademicSheet(buffer);
    expect(result.errors).toEqual([]);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.codigo).toBe("A360-001");
    expect(result.rows[0]?.promedioAcumulado).toBe(4.2);
  });

  it("rechaza columna faltante, celda vacía, texto numérico, rango, suma y duplicado sin devolver filas", async () => {
    const buffer = await workbookBuffer((sheet) => {
      sheet.addRow(headers.filter((header) => header !== "docente_correo"));
      sheet.addRow(validRow());
    });
    const missing = await parseAcademicSheet(buffer);
    expect(missing.rows).toEqual([]);
    expect(missing.errors.some((error) => error.columna === "docente_correo")).toBe(true);

    const dirty = await workbookBuffer((sheet) => {
      sheet.addRow(headers);
      const emptyMail = validRow("A360-010");
      emptyMail[3] = "";
      sheet.addRow(emptyMail);
      const textGrade = validRow("A360-011");
      textGrade[11] = "alto";
      sheet.addRow(textGrade);
      const badSum = validRow("A360-012");
      badSum[8] = 4;
      badSum[9] = 1;
      badSum[10] = 1;
      sheet.addRow(badSum);
      const outOfRange = validRow("A360-013");
      outOfRange[7] = 140;
      sheet.addRow(outOfRange);
      sheet.addRow(validRow("A360-014"));
      sheet.addRow(validRow("A360-014"));
    });
    const result = await parseAcademicSheet(dirty);
    expect(result.rows).toEqual([]);
    expect(result.errors.some((error) => error.mensaje.includes("vacía"))).toBe(true);
    expect(result.errors.some((error) => error.mensaje.includes("no es numérico"))).toBe(true);
    expect(result.errors.some((error) => error.mensaje.includes("Presentadas más perdidas"))).toBe(true);
    expect(result.errors.some((error) => error.mensaje.includes("entre 0 y 100"))).toBe(true);
    expect(result.errors.some((error) => error.mensaje.includes("ya aparece"))).toBe(true);
  });
});
