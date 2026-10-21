import Link from "next/link";
import { notFound } from "next/navigation";
import { reenviarClave } from "../actions";
import { requireSession } from "@/lib/auth";
import { bandLabel, formatWhen, fullName } from "@/lib/labels";
import { factorLabel, type RiskFactors } from "@/lib/risk/engine";
import { prisma } from "@/lib/prisma";
import { canSeeStudent } from "@/lib/scope";

export const dynamic = "force-dynamic";

export default async function ExpedientePage({ params }: { params: Promise<{ codigo: string }> }) {
  const user = await requireSession();
  const { codigo } = await params;
  const student = await prisma.student.findUnique({
    where: { codigo },
    include: {
      snapshots: { orderBy: { createdAt: "desc" } },
      marks: true,
      submissions: true,
      alerts: { orderBy: { createdAt: "desc" }, take: 6 },
    },
  });
  if (!student || !canSeeStudent(user, student)) notFound();
  const snapshot = student.snapshots[0];
  if (!snapshot) notFound();
  const factors = snapshot.factors as RiskFactors;
  const actions = (Array.isArray(snapshot.aiActions) && snapshot.aiActions.length
    ? snapshot.aiActions
    : snapshot.baseActions) as string[];
  const attended = student.marks.filter((mark) => mark.present).length;

  return (
    <main className="panel dossier" id="contenido">
      <p className="kicker">Expediente</p>
      <h1>{fullName(student.nombres, student.apellidos)}</h1>
      <p className="lead">
        {student.codigo} · {student.programa} · semestre {student.semestre}
        <br />
        Docente {student.docenteNombre}
      </p>
      <div className="dossier-grid">
        <section className="card">
          <p className={`band band-${snapshot.riskBand}`}>{bandLabel[snapshot.riskBand]}</p>
          <h2 className="section-title">{snapshot.riskScore}</h2>
          <p>{snapshot.aiNarrative || "Lectura calculada con las acciones base. La IA no añadió narrativa."}</p>
          {(Object.keys(factorLabel) as (keyof RiskFactors)[]).map((key) => (
            <div className="factor" key={key}>
              <span>
                {factorLabel[key]} <b>{Math.round((factors[key] || 0) * 100)}%</b>
              </span>
              <div className="bar">
                <i style={{ width: `${Math.round((factors[key] || 0) * 100)}%` }} />
              </div>
            </div>
          ))}
          <h2 className="section-title">Acciones</h2>
          <ul className="actions">
            {actions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
          {user.role !== "ESTUDIANTE" && snapshot.aiNotifyReason ? (
            <p className="note">Motivo del aviso: {snapshot.aiNotifyReason}</p>
          ) : null}
        </section>
        <aside className="stack">
          <article className="card">
            <h2>Indicadores oficiales</h2>
            <p>Asistencia {snapshot.porcentajeAsistencia}%</p>
            <p>
              Evaluaciones {snapshot.evaluacionesPresentadas} presentadas, {snapshot.evaluacionesPerdidas} perdidas, de{" "}
              {snapshot.evaluacionesProgramadas}
            </p>
            <p>Promedio {snapshot.promedioAcumulado}</p>
            <p>Semanas sin asistir {snapshot.semanasSinAsistencia}</p>
            <p>Materias reprobadas {snapshot.materiasReprobadas}</p>
          </article>
          <article className="card">
            <h2>Actividad de aula</h2>
            <p className="note">No modifica el puntaje oficial.</p>
            <p>
              Asistió a {attended} de {student.marks.length} listas. Entregas: {student.submissions.length}.
            </p>
          </article>
          <p className="links">
            <a className="solid" href={`/api/reportes/expediente/${student.codigo}`}>
              PDF del expediente
            </a>
            {user.role === "DOCENTE" ? (
              <Link className="ghost" href="/mensajes">
                Abrir WhatsApp
              </Link>
            ) : null}
          </p>
          {user.role === "BIENESTAR" ? (
            <form action={reenviarClave} className="card">
              <h2>Clave temporal</h2>
              <input type="hidden" name="email" value={student.correo} />
              <button className="ghost" type="submit">
                Reenviar al estudiante
              </button>
            </form>
          ) : null}
        </aside>
      </div>
      <section className="card" style={{ marginTop: 16 }}>
        <h2>Fotografías</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Banda</th>
              <th>Puntaje</th>
            </tr>
          </thead>
          <tbody>
            {student.snapshots.map((item) => (
              <tr key={item.id}>
                <td>{formatWhen(item.createdAt)}</td>
                <td>{bandLabel[item.riskBand]}</td>
                <td>{item.riskScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
