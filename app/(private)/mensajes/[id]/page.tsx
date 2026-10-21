import { notFound } from "next/navigation";
import { Composer } from "@/components/mensajes/Composer";
import { RefreshEvery } from "@/components/mensajes/RefreshEvery";
import { requireRole } from "@/lib/auth";
import { formatWhen, fullName } from "@/lib/labels";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HiloPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole(["BIENESTAR", "DOCENTE"]);
  const { id } = await params;
  const conversation = await prisma.whatsAppConversation.findFirst({
    where: user.role === "DOCENTE" ? { id, docenteUserId: user.id } : { id },
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
          ? `Puedes escribir libremente hasta ${formatWhen(conversation.windowExpiresAt as Date)}.`
          : "Puedes escribir aquí. Si la persona todavía no responde, WhatsApp solo deja salir la plantilla."}
      </p>
      <RefreshEvery />
      <section className="thread">
        {conversation.messages.map((message) => (
          <article key={message.id} className={`bubble ${message.direction === "outbound" ? "out" : ""}`}>
            <strong>{message.author}</strong>
            <p>{message.body}</p>
            <small>{formatWhen(message.createdAt)}</small>
          </article>
        ))}
        {conversation.messages.length === 0 ? <p className="muted">Todavía no hay mensajes en este hilo.</p> : null}
      </section>
      <Composer conversationId={conversation.id} />
    </main>
  );
}
