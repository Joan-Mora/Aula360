import Link from "next/link";
import { RiskCharts } from "@/components/charts/RiskCharts";
import { requireSession } from "@/lib/auth";
import { latestCohort, riskTrend } from "@/lib/cohort";
import { bandLabel, fullName } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function ObservatorioPage() {
  const user = await requireSession();
  const cohort = await latestCohort(user);
  const trend = await riskTrend(user);
  const enRiesgo = cohort.filter(
    (item) => item.snapshot.riskBand === "ALTO" || item.snapshot.riskBand === "CRITICO",
  ).length;
  const bands = ["Bajo", "Medio", "Alto", "Crítico"].map((banda) => ({
    banda,
    total: cohort.filter((item) => bandLabel[item.snapshot.riskBand] === banda).length,
  }));
  const programsMap = new Map<string, number>();
  for (const item of cohort) {
    if (item.snapshot.riskBand === "ALTO" || item.snapshot.riskBand === "CRITICO") {
      programsMap.set(item.student.programa, (programsMap.get(item.student.programa) || 0) + 1);
    }
  }
  const programs = Array.from(programsMap.entries()).map(([programa, enRiesgoPrograma]) => ({
    programa,
    enRiesgo: enRiesgoPrograma,
  }));

  return (
    <main className="panel" id="contenido">
      <p className="kicker">Observatorio</p>
      <h1>{user.role === "ESTUDIANTE" ? "Tu permanencia" : "Lectura de la cohorte"}</h1>
      <p className="lead">
        El puntaje sale solo de la última fotografía Excel. La actividad del aula se mira en el
        expediente y no mueve la banda.
      </p>
      <section className="metrics">
        <article className="metric">
          <span>Estudiantes registrados</span>
          <b>{cohort.length}</b>
        </article>
        <article className="metric alert">
          <span>En riesgo</span>
          <b>{enRiesgo}</b>
        </article>
        <article className="metric">
          <span>Cargas comparadas</span>
          <b>{trend.length}</b>
        </article>
      </section>
      {cohort.length > 0 && programs.length > 0 ? <RiskCharts bands={bands} programs={programs} /> : null}
      {trend.length > 1 ? (
        <p className="note">
          Tendencia entre cargas:{" "}
          {trend.map((item) => `${item.carga}: ${item.enRiesgo} en riesgo de ${item.registrados}`).join(" · ")}
        </p>
      ) : null}
      <section className="roster">
        {cohort.length === 0 ? (
          <p>
            Aún no hay una fotografía académica.{" "}
            {user.role === "BIENESTAR" ? <Link href="/ingesta">Cargar el Excel</Link> : "Bienestar debe cargar el Excel."}
          </p>
        ) : (
          cohort.map((item) => (
            <Link key={item.student.id} href={`/observatorio/${item.student.codigo}`} className="person">
              <div className="score">{item.snapshot.riskScore}</div>
              <div>
                <strong>{fullName(item.student.nombres, item.student.apellidos)}</strong>
                <div className="muted">
                  {item.student.codigo} · {item.student.programa}
                </div>
              </div>
              <span className={`band band-${item.snapshot.riskBand}`}>{bandLabel[item.snapshot.riskBand]}</span>
            </Link>
          ))
        )}
      </section>
    </main>
  );
}
