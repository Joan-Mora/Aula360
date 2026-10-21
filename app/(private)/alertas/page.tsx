import { markAlertsRead } from "./actions";
import { requireSession } from "@/lib/auth";
import { formatWhen } from "@/lib/labels";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AlertasPage() {
  const user = await requireSession();
  const alerts = await prisma.alert.findMany({
    where: { recipientId: user.id, channel: "in_app" },
    orderBy: { createdAt: "desc" },
    include: { student: true },
    take: 50,
  });
  return (
    <main className="panel" id="contenido">
      <p className="kicker">Alertas</p>
      <h1>Lo que pide una respuesta.</h1>
      <form action={markAlertsRead}>
        <button className="ghost" type="submit">Marcar como leídas</button>
      </form>
      <section className="roster">
        {alerts.map((alert) => (
          <a key={alert.id} className="person" href={`/observatorio/${alert.student.codigo}`}>
            <div className="score">{alert.readAt ? "" : "Nueva"}</div>
            <div>
              <strong>{alert.title}</strong>
              <div className="muted">{formatWhen(alert.createdAt)}</div>
              <p>{alert.body}</p>
            </div>
            <span>{alert.status}</span>
          </a>
        ))}
        {alerts.length === 0 ? <p>No hay alertas en tu bandeja.</p> : null}
      </section>
    </main>
  );
}
