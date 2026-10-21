import Link from "next/link";
import { hrefFor } from "@/lib/stations";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { studentWhere } from "@/lib/scope";

export const dynamic = "force-dynamic";

export default async function AulaPage() {
  const user = await requireSession();
  const students = await prisma.student.findMany({
    where: studentWhere(user),
    orderBy: { programa: "asc" },
  });
  const groups = new Map<string, { curso: string | null; grupo: string; total: number }>();
  for (const student of students) {
    const key = `${student.curso || ""}\n${student.grupo}`;
    const current = groups.get(key);
    if (current) current.total += 1;
    else groups.set(key, { curso: student.curso, grupo: student.grupo, total: 1 });
  }
  return (
    <main className="panel" id="contenido">
      <p className="kicker">Aula</p>
      <h1>El patio de cada grupo.</h1>
      <p className="lead">
        La lista y las entregas quedan como actividad viva. No cambian la asistencia oficial ni el puntaje de riesgo.
      </p>
      <section className="roster">
        {Array.from(groups.values()).map((group) => (
          <Link key={`${group.curso}-${group.grupo}`} href={hrefFor(group.curso, group.grupo)} className="person">
            <img src="/brand/icon-aula.jpg" alt="" width={72} height={72} />
            <div>
              <strong>{group.curso || "Acompañamiento"}</strong>
              <div className="muted">{group.grupo ? `Grupo ${group.grupo}` : "Sin grupo"} · {group.total} estudiantes</div>
            </div>
            <span>Entrar</span>
          </Link>
        ))}
        {groups.size === 0 ? <p>Todavía no hay estudiantes en tu alcance.</p> : null}
      </section>
    </main>
  );
}
