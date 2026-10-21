import { openConversation } from "./actions";
import { requireRole } from "@/lib/auth";
import { fullName } from "@/lib/labels";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MensajesPage() {
  const user = await requireRole(["DOCENTE"]);
  const students = await prisma.student.findMany({
    where: { docenteUserId: user.id },
    orderBy: { apellidos: "asc" },
    include: { conversations: { orderBy: { updatedAt: "desc" }, take: 1 } },
  });
  return (
    <main className="panel" id="contenido">
      <p className="kicker">Mensajes</p>
      <h1>La plantilla abre la conversación.</h1>
      <p className="lead">
        El texto libre queda disponible cuando el estudiante responde, durante 24 horas. Si escribe sin un docente en turno, responde Gemini.
      </p>
      <section className="roster">
        {students.map((student) => {
          const conversation = student.conversations[0];
          return (
            <article key={student.id} className="person">
              <img src="/brand/icon-mensajes.jpg" alt="" width={72} height={72} />
              <div>
                <strong>{fullName(student.nombres, student.apellidos)}</strong>
                <div className="muted">{student.telefono}</div>
              </div>
              {conversation ? (
                <a href={`/mensajes/${conversation.id}`}>Ver hilo</a>
              ) : (
                <form action={openConversation}>
                  <input type="hidden" name="studentId" value={student.id} />
                  <button className="solid" type="submit">Enviar plantilla</button>
                </form>
              )}
            </article>
          );
        })}
        {students.length === 0 ? <p>No tienes estudiantes asignados en el Excel.</p> : null}
      </section>
    </main>
  );
}
