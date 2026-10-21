import { readFileSync } from "fs";
import { ingestWorkbook } from "../lib/excel/ingest";
import { prisma } from "../lib/prisma";

async function main() {
  const bienestar = await prisma.user.findFirstOrThrow({ where: { role: "BIENESTAR" } });
  const before = await prisma.student.count();
  const invalid = await ingestWorkbook(
    readFileSync("public/plantillas/ejemplo_invalido.xlsx"),
    "ejemplo_invalido.xlsx",
    bienestar.id,
  );
  if (invalid.ok) throw new Error("El archivo inválido no debía aceptarse.");
  const afterInvalid = await prisma.student.count();
  if (afterInvalid !== before) throw new Error("El archivo inválido escribió estudiantes.");

  const valid = await ingestWorkbook(
    readFileSync("public/plantillas/ejemplo_valido.xlsx"),
    "ejemplo_valido.xlsx",
    bienestar.id,
  );
  if (!valid.ok) throw new Error(`La carga válida falló: ${valid.errors.map((error) => error.mensaje).join(" | ")}`);

  const updated = await ingestWorkbook(
    readFileSync("public/plantillas/ejemplo_actualizacion.xlsx"),
    "ejemplo_actualizacion.xlsx",
    bienestar.id,
  );
  if (!updated.ok) throw new Error("La actualización falló.");
  const pedro = await prisma.student.count({ where: { codigo: "A360-004" } });
  const photos = await prisma.academicSnapshot.count({ where: { student: { codigo: "A360-004" } } });
  if (pedro !== 1 || photos < 2) throw new Error(`Upsert incorrecto: fichas ${pedro}, fotos ${photos}`);
  console.log(
    JSON.stringify({
      erroresInvalidos: invalid.errors.length,
      creados: valid.creados,
      actualizados: updated.actualizados,
      avisos: valid.avisos,
      pedro,
      photos,
    }),
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
