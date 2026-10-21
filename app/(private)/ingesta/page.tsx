import Link from "next/link";
import { IngestForm } from "./IngestForm";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function IngestaPage() {
  await requireRole(["BIENESTAR"]);
  return (
    <main className="panel" id="contenido">
      <p className="kicker">Ingesta</p>
      <h1>Una sola puerta: el Excel.</h1>
      <p className="lead">
        Si falta una columna, hay una celda vacía, un texto donde va un número o un código repetido,
        la carga se rechaza completa. Una nueva carga del mismo código actualiza la ficha y guarda otra fotografía.
      </p>
      <div className="links">
        <a className="ghost" href="/plantillas/plantilla_aula360.xlsx">Plantilla</a>
        <a className="ghost" href="/plantillas/ejemplo_valido.xlsx">Ejemplo válido</a>
        <a className="ghost" href="/plantillas/ejemplo_invalido.xlsx">Ejemplo inválido</a>
        <a className="ghost" href="/plantillas/ejemplo_actualizacion.xlsx">Ejemplo de actualización</a>
        <Link className="ghost" href="/plantillas/ejemplo_columna_faltante.xlsx">Columna faltante</Link>
      </div>
      <IngestForm />
    </main>
  );
}
