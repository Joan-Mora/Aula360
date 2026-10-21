import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ReportesPage() {
  const user = await requireSession();
  return (
    <main className="panel" id="contenido">
      <p className="kicker">Reportes</p>
      <h1>La cohorte, en papel y en hoja.</h1>
      <p className="lead">
        El PDF lista a quienes están en alto o crítico. El Excel lleva el estado de cada estudiante de tu alcance.
      </p>
      {user.role === "ESTUDIANTE" ? (
        <p>Tu expediente se descarga desde tu ficha en el observatorio.</p>
      ) : (
        <div className="links">
          <a className="solid" href="/api/reportes/riesgo">PDF de estudiantes en riesgo</a>
          <a className="ghost" href="/api/reportes/estado">Excel de estado</a>
        </div>
      )}
      <img src="/brand/icon-reportes.jpg" alt="" width={120} height={120} />
    </main>
  );
}
