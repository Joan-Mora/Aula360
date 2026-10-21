import ExcelJS from "exceljs";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

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

type Row = (string | number)[];

function row(
  codigo: string,
  nombres: string,
  apellidos: string,
  programa: string,
  asistencia: number,
  programadas: number,
  presentadas: number,
  perdidas: number,
  promedio: number,
  materias: number,
  semanas: number,
  docente: "marta" | "julian",
): Row {
  const teachers = {
    marta: ["Marta Rincón", "marta.rincon@aula360.local"],
    julian: ["Julián Paz", "julian.paz@aula360.local"],
  } as const;
  const [docenteNombre, docenteCorreo] = teachers[docente];
  const slug = `${nombres}.${apellidos}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, "");
  return [
    codigo,
    nombres,
    apellidos,
    `${slug}@aula360.local`,
    `57300${codigo.replace(/\D/g, "").padStart(7, "0").slice(-7)}`,
    programa,
    4,
    asistencia,
    programadas,
    presentadas,
    perdidas,
    promedio,
    materias,
    semanas,
    docenteNombre,
    docenteCorreo,
    "Permanencia",
    docente === "marta" ? "A" : "B",
  ];
}

const validRows: Row[] = [
  row("A360-001", "Ana", "López", "Ingeniería de Sistemas", 96, 4, 4, 0, 4.2, 0, 0, "marta"),
  row("A360-002", "Luis", "Cárdenas", "Ingeniería de Sistemas", 70, 4, 2, 2, 3.1, 1, 2, "marta"),
  row("A360-003", "Marta", "Quintero", "Psicología", 45, 4, 1, 3, 2.6, 2, 3, "marta"),
  row("A360-004", "Pedro", "Salamanca", "Derecho", 30, 4, 0, 4, 2.1, 4, 4, "julian"),
  row("A360-005", "Elena", "Vargas", "Psicología", 88, 4, 4, 0, 3.8, 0, 0, "julian"),
  row("A360-006", "Sofía", "Nieto", "Derecho", 62, 4, 2, 2, 2.9, 2, 2, "julian"),
];

async function save(name: string, setup: (sheet: ExcelJS.Worksheet) => void) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Estudiantes");
  setup(sheet);
  const data = await workbook.xlsx.writeBuffer();
  await writeFile(path.join("public", "plantillas", name), Buffer.from(data));
}

async function main() {
  await mkdir(path.join("public", "plantillas"), { recursive: true });
  await save("plantilla_aula360.xlsx", (sheet) => {
    sheet.addRow(headers);
  });
  await save("ejemplo_valido.xlsx", (sheet) => {
    sheet.addRow(headers);
    for (const item of validRows) sheet.addRow(item);
  });
  await save("ejemplo_actualizacion.xlsx", (sheet) => {
    sheet.addRow(headers);
    const updated = row("A360-004", "Pedro", "Salamanca", "Derecho", 92, 4, 4, 0, 3.6, 1, 0, "julian");
    sheet.addRow(updated);
  });
  await save("ejemplo_invalido.xlsx", (sheet) => {
    sheet.addRow(headers);
    const emptyMail = [...validRows[0]];
    emptyMail[0] = "A360-010";
    emptyMail[3] = "";
    sheet.addRow(emptyMail);
    const textGrade = [...validRows[1]];
    textGrade[0] = "A360-011";
    textGrade[11] = "alto";
    sheet.addRow(textGrade);
    const badSum = [...validRows[2]];
    badSum[0] = "A360-012";
    badSum[8] = 4;
    badSum[9] = 1;
    badSum[10] = 1;
    sheet.addRow(badSum);
    const outOfRange = [...validRows[3]];
    outOfRange[0] = "A360-013";
    outOfRange[7] = 140;
    sheet.addRow(outOfRange);
    const duplicate = [...validRows[4]];
    duplicate[0] = "A360-014";
    sheet.addRow(duplicate);
    sheet.addRow(duplicate);
  });
  await save("ejemplo_columna_faltante.xlsx", (sheet) => {
    sheet.addRow(headers.filter((header) => header !== "docente_correo"));
    sheet.addRow(validRows[0]);
  });
  console.log("Plantillas listas en public/plantillas");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
