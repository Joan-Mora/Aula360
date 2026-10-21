import { prisma } from "@/lib/prisma";
import { phonesMatch } from "@/lib/phone";
import { replyToStudent } from "@/lib/ai/gemini";
import { sendText } from "./client";

type Inbound = {
  from: string;
  body: string;
  waMessageId?: string;
};

export function readInboundMessages(payload: unknown): Inbound[] {
  const root = payload as {
    entry?: {
      changes?: {
        value?: {
          messages?: { from?: string; id?: string; type?: string; text?: { body?: string } }[];
        };
      }[];
    }[];
  };
  const found: Inbound[] = [];
  for (const entry of root.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const message of change.value?.messages ?? []) {
        if (message.type !== "text" || !message.from || !message.text?.body) continue;
        found.push({
          from: message.from,
          body: message.text.body,
          waMessageId: message.id,
        });
      }
    }
  }
  return found;
}

export async function receiveStudentMessage(message: Inbound) {
  const students = await prisma.student.findMany({
    select: {
      id: true,
      nombres: true,
      telefono: true,
      marks: { select: { present: true } },
      submissions: { select: { id: true } },
    },
  });
  const student = students.find((item) => phonesMatch(item.telefono, message.from));
  if (!student) return { ignored: true as const };

  let conversation = await prisma.whatsAppConversation.findFirst({
    where: { studentId: student.id },
    orderBy: { updatedAt: "desc" },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 8 } },
  });
  if (!conversation) {
    conversation = await prisma.whatsAppConversation.create({
      data: { studentId: student.id, phone: message.from },
      include: { messages: true },
    });
  }

  if (message.waMessageId) {
    const duplicate = await prisma.whatsAppMessage.findFirst({
      where: { waMessageId: message.waMessageId },
    });
    if (duplicate) return { ignored: false as const, duplicate: true as const };
  }

  await prisma.whatsAppMessage.create({
    data: {
      conversationId: conversation.id,
      direction: "inbound",
      author: "estudiante",
      body: message.body.slice(0, 4000),
      waMessageId: message.waMessageId,
    },
  });

  const windowExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const handoffActive = Boolean(
    conversation.humanHandoff && conversation.handoffUntil && conversation.handoffUntil > new Date(),
  );

  await prisma.whatsAppConversation.update({
    where: { id: conversation.id },
    data: { windowExpiresAt, phone: message.from },
  });

  if (handoffActive) return { ignored: false as const, replied: false as const };

  const attended = student.marks.filter((mark) => mark.present).length;
  const actividadAula = `Sesiones con asistencia marcada: ${attended} de ${student.marks.length}. Entregas registradas: ${student.submissions.length}. Esta actividad no cambia el puntaje oficial.`;
  const reply = await replyToStudent({
    nombre: student.nombres,
    mensaje: message.body,
    actividadAula,
    historial: conversation.messages
      .slice()
      .reverse()
      .map((item) => `${item.author}: ${item.body}`),
  });

  const sent = await sendText(message.from, reply);
  await prisma.whatsAppMessage.create({
    data: {
      conversationId: conversation.id,
      direction: "outbound",
      author: "gemini",
      body: reply,
      waMessageId: sent.id || null,
    },
  });
  return { ignored: false as const, replied: true as const };
}
