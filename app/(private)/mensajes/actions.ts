"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendTemplate, sendText } from "@/lib/whatsapp/client";
import { fullName } from "@/lib/labels";

export async function openConversation(formData: FormData) {
  const user = await requireRole(["DOCENTE"]);
  const studentId = String(formData.get("studentId") || "");
  const student = await prisma.student.findFirst({
    where: { id: studentId, docenteUserId: user.id },
  });
  if (!student) return;
  const sent = await sendTemplate(student.telefono, fullName(student.nombres, student.apellidos), user.name);
  const conversation = await prisma.whatsAppConversation.create({
    data: {
      studentId: student.id,
      phone: student.telefono,
      humanHandoff: true,
      handoffUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      docenteUserId: user.id,
    },
  });
  await prisma.whatsAppMessage.create({
    data: {
      conversationId: conversation.id,
      direction: "outbound",
      author: "docente",
      body: "Plantilla de acompañamiento enviada.",
      waMessageId: sent.id || null,
    },
  });
  revalidatePath("/mensajes");
  redirect(`/mensajes/${conversation.id}`);
}

export async function renewTemplate(formData: FormData) {
  const user = await requireRole(["DOCENTE"]);
  const conversationId = String(formData.get("conversationId") || "");
  const conversation = await prisma.whatsAppConversation.findFirst({
    where: { id: conversationId, docenteUserId: user.id },
    include: { student: true },
  });
  if (!conversation) return;
  const sent = await sendTemplate(
    conversation.student.telefono,
    fullName(conversation.student.nombres, conversation.student.apellidos),
    user.name,
  );
  await prisma.whatsAppConversation.update({
    where: { id: conversation.id },
    data: {
      humanHandoff: true,
      handoffUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  await prisma.whatsAppMessage.create({
    data: {
      conversationId: conversation.id,
      direction: "outbound",
      author: "docente",
      body: "Plantilla de acompañamiento enviada de nuevo.",
      waMessageId: sent.id || null,
    },
  });
  revalidatePath(`/mensajes/${conversation.id}`);
}

export async function sendFreeText(formData: FormData) {
  const user = await requireRole(["DOCENTE"]);
  const parsed = z
    .object({
      conversationId: z.string().min(5),
      body: z.string().trim().min(1).max(1000),
    })
    .safeParse({
      conversationId: formData.get("conversationId"),
      body: formData.get("body"),
    });
  if (!parsed.success) return;
  const conversation = await prisma.whatsAppConversation.findFirst({
    where: { id: parsed.data.conversationId, docenteUserId: user.id },
    include: { student: true },
  });
  if (!conversation?.windowExpiresAt || conversation.windowExpiresAt < new Date()) return;
  const sent = await sendText(conversation.student.telefono, parsed.data.body);
  await prisma.whatsAppMessage.create({
    data: {
      conversationId: conversation.id,
      direction: "outbound",
      author: "docente",
      body: parsed.data.body,
      waMessageId: sent.id || null,
    },
  });
  await prisma.whatsAppConversation.update({
    where: { id: conversation.id },
    data: { humanHandoff: true, handoffUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  });
  revalidatePath(`/mensajes/${conversation.id}`);
}
