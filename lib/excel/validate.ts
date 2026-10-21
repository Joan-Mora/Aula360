import ExcelJS from "exceljs";
import { canonicalHeader, OPTIONAL_COLUMNS, REQUIRED_COLUMNS } from "./columns";

export type SheetError = {
  fila: number | null;
  columna: string | null;
  mensaje: string;
};

export type AcademicRow = {
  fila: number;
  codigo: string;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  programa: string;
  semestre: number;
  porcentajeAsistencia: number;
  evaluacionesProgramadas: number;
  evaluacionesPresentadas: number;
  evaluacionesPerdidas: number;
  promedioAcumulado: number;
  materiasReprobadas: number;
  semanasSinAsistencia: number;
  docenteNombre: string;
  docenteCorreo: string;
  curso: string | null;
  grupo: string;
};

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 2000;

function cellRaw(value: ExcelJS.CellValue): unknown {
  if (value && typeof value === "object") {
    if ("result" in value) return value.result;
    if ("text" in value && typeof value.text === "string") return value.text;
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join("");
    }
    if ("hyperlink" in value && "text" in value) return value.text;
  }
  return value;
}

function isEmpty(value: unknown) {
  return value === null || value === undefined || (typeof value === "string" && value.trim() === "");
}

function text(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string") return value.trim();
  return null;
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value.trim())) return Number(value.trim());
  return null;
}

export function assertXlsxBuffer(buffer: Buffer): SheetError | null {
  if (buffer.length === 0) {
    return { fila: null, columna: null, mensaje: "El archivo está vacío." };
  }
  if (buffer.length > MAX_BYTES) {
    return { fila: null, columna: null, mensaje: "El archivo supera el máximo de 5 MB." };
  }
  const zip = buffer[0] === 0x50 && buffer[1] === 0x4b;
  if (!zip) {
    return {
      fila: null,
      columna: null,
      mensaje: "El archivo no es un Excel .xlsx válido.",
    };
  }
  return null;
}

export async function parseAcademicSheet(buffer: Buffer): Promise<{
  rows: AcademicRow[];
  errors: SheetError[];
}> {
  const errors: SheetError[] = [];
  const signature = assertXlsxBuffer(buffer);
  if (signature) return { rows: [], errors: [signature] };

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  } catch {
    return {
      rows: [],
      errors: [{ fila: null, columna: null, mensaje: "No se pudo leer el archivo Excel." }],
    };
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    return {
      rows: [],
      errors: [{ fila: null, columna: null, mensaje: "El archivo no tiene hojas." }],
    };
  }

  const headerRow = sheet.getRow(1);
  const index = new Map<string, number>();
  headerRow.eachCell({ includeEmpty: false }, (cell, col) => {
    const raw = text(cellRaw(cell.value));
    if (!raw) return;
    index.set(canonicalHeader(raw), col);
  });

  for (const column of REQUIRED_COLUMNS) {
    if (!index.has(column)) {
      errors.push({
        fila: 1,
        columna: column,
        mensaje: `Falta la columna obligatoria ${column}.`,
      });
    }
  }
  if (errors.length) return { rows: [], errors };

  const rows: AcademicRow[] = [];
  const seen = new Map<string, number>();
  let occupied = 0;

  for (let fila = 2; fila <= sheet.rowCount; fila += 1) {
    const row = sheet.getRow(fila);
    const values = new Map<string, unknown>();
    let any = false;
    for (const column of [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS]) {
      const col = index.get(column);
      if (!col) continue;
      const value = cellRaw(row.getCell(col).value);
      values.set(column, value);
      if (!isEmpty(value)) any = true;
    }
    if (!any) continue;
    occupied += 1;
    if (occupied > MAX_ROWS) {
      errors.push({
        fila,
        columna: null,
        mensaje: `El archivo supera el máximo de ${MAX_ROWS} estudiantes.`,
      });
      break;
    }

    const readText = (column: string) => {
      const value = values.get(column);
      if (isEmpty(value)) {
        errors.push({ fila, columna: column, mensaje: "La celda está vacía." });
        return null;
      }
      const parsed = text(value);
      if (!parsed) {
        errors.push({ fila, columna: column, mensaje: "Se esperaba texto." });
        return null;
      }
      return parsed;
    };

    const readNumber = (column: string, integer: boolean, min: number, max: number) => {
      const value = values.get(column);
      if (isEmpty(value)) {
        errors.push({ fila, columna: column, mensaje: "La celda está vacía." });
        return null;
      }
      const parsed = numberValue(value);
      if (parsed === null) {
        errors.push({
          fila,
          columna: column,
          mensaje: "Se esperaba un número y el valor no es numérico.",
        });
        return null;
      }
      if (integer && !Number.isInteger(parsed)) {
        errors.push({ fila, columna: column, mensaje: "Se esperaba un número entero." });
        return null;
      }
      if (parsed < min || parsed > max) {
        errors.push({
          fila,
          columna: column,
          mensaje: `El valor debe estar entre ${min} y ${max}.`,
        });
        return null;
      }
      return parsed;
    };

    const codigo = readText("codigo_estudiante");
    const nombres = readText("nombres");
    const apellidos = readText("apellidos");
    const correo = readText("correo");
    const telefono = readText("telefono");
    const programa = readText("programa");
    const docenteNombre = readText("docente_nombre");
    const docenteCorreo = readText("docente_correo");
    const semestre = readNumber("semestre", true, 1, 12);
    const porcentajeAsistencia = readNumber("porcentaje_asistencia", false, 0, 100);
    const evaluacionesProgramadas = readNumber("evaluaciones_programadas", true, 1, 40);
    const evaluacionesPresentadas = readNumber("evaluaciones_presentadas", true, 0, 40);
    const evaluacionesPerdidas = readNumber("evaluaciones_perdidas", true, 0, 40);
    const promedioAcumulado = readNumber("promedio_acumulado", false, 0, 5);
    const materiasReprobadas = readNumber("materias_reprobadas", true, 0, 40);
    const semanasSinAsistencia = readNumber("semanas_sin_asistencia", true, 0, 24);

    if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      errors.push({ fila, columna: "correo", mensaje: "El correo no tiene un formato válido." });
    }
    if (docenteCorreo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(docenteCorreo)) {
      errors.push({
        fila,
        columna: "docente_correo",
        mensaje: "El correo del docente no tiene un formato válido.",
      });
    }
    if (telefono && !/^\+?[0-9][0-9\s-]{8,18}$/.test(telefono)) {
      errors.push({
        fila,
        columna: "telefono",
        mensaje: "El teléfono debe tener entre 10 y 15 dígitos.",
      });
    }
    if (
      evaluacionesProgramadas !== null &&
      evaluacionesPresentadas !== null &&
      evaluacionesPerdidas !== null &&
      evaluacionesPresentadas + evaluacionesPerdidas !== evaluacionesProgramadas
    ) {
      errors.push({
        fila,
        columna: "evaluaciones_perdidas",
        mensaje: "Presentadas más perdidas debe ser igual a las evaluaciones programadas.",
      });
    }
    if (codigo) {
      const key = codigo.toLowerCase();
      const previous = seen.get(key);
      if (previous) {
        errors.push({
          fila,
          columna: "codigo_estudiante",
          mensaje: `El código ya aparece en la fila ${previous}. Corrige el archivo antes de cargarlo.`,
        });
      } else {
        seen.set(key, fila);
      }
    }

    const cursoRaw = values.get("curso");
    const grupoRaw = values.get("grupo");
    const curso = isEmpty(cursoRaw) ? null : text(cursoRaw);
    const grupo = isEmpty(grupoRaw) ? "" : text(grupoRaw) || "";

    if (
      codigo &&
      nombres &&
      apellidos &&
      correo &&
      telefono &&
      programa &&
      docenteNombre &&
      docenteCorreo &&
      semestre !== null &&
      porcentajeAsistencia !== null &&
      evaluacionesProgramadas !== null &&
      evaluacionesPresentadas !== null &&
      evaluacionesPerdidas !== null &&
      promedioAcumulado !== null &&
      materiasReprobadas !== null &&
      semanasSinAsistencia !== null
    ) {
      rows.push({
        fila,
        codigo,
        nombres,
        apellidos,
        correo: correo.toLowerCase(),
        telefono,
        programa,
        semestre,
        porcentajeAsistencia,
        evaluacionesProgramadas,
        evaluacionesPresentadas,
        evaluacionesPerdidas,
        promedioAcumulado,
        materiasReprobadas,
        semanasSinAsistencia,
        docenteNombre,
        docenteCorreo: docenteCorreo.toLowerCase(),
        curso,
        grupo,
      });
    }
  }

  if (!occupied && errors.length === 0) {
    errors.push({
      fila: null,
      columna: null,
      mensaje: "El archivo no contiene estudiantes.",
    });
  }

  return { rows: errors.length ? [] : rows, errors };
}
