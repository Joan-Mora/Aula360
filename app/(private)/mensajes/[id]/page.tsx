import { notFound } from "next/navigation";
import { renewTemplate, sendFreeText } from "../actions";
import { requireRole } from "@/lib/auth";
import { formatWhen, fullName } from "@/lib/labels";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HiloPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole(["DOCENTE"]);
  const { id } = await params;
  const conversation = await prisma.whatsAppConversation.findFirst({
    where: { id, docenteUserId: user.id },
    include: {
      student: true,
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!conversation) notFound();
  const open = Boolean(conversation.windowExpiresAt && conversation.windowExpiresAt > new Date());
  return (
    <main className="panel" id="contenido">
      <p className="kicker">WhatsApp</p>
      <h1>{fullName(conversation.student.nombres, conversation.student.apellidos)}</h1>
      <p className="lead">
        {open
          ? `Ventana abierta hasta ${formatWhen(conversation.windowExpiresAt as Date)}.`
          : "La ventana se abre cuando el estudiante responde a la plantilla."}
      </p>
      <section className="thread">
        {conversation.messages.map((message) => (
          <article key={message.id} className={`bubble ${message.direction === "outbound" ? "out" : ""}`}>
            <strong>{message.author}</strong>
            <p>{message.body}</p>
            <small>{formatWhen(message.createdAt)}</small>
          </article>
        ))}
      </section>
      {open ? (
        <form action={sendFreeText} className="card">
          <input type="hidden" name="conversationId" value={conversation.id} />
          <label>
            Mensaje libre
            <textarea name="body" required minLength={1} maxLength={1000} />
          </label>
          <button className="solid" type="submit">Enviar</button>
        </form>
      ) : (
        <form action={renewTemplate}>
          <input type="hidden" name="conversationId" value={conversation.id} />
          <button className="solid" type="submit">Enviar plantilla otra vez</button>
        </form>
      )}
    </main>
  );
}
