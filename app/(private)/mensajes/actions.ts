"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendTemplate, sendText } from "@/lib/whatsapp/client";
import { fullName } from "@/lib/labels";

async function loadStudent(userId: string, role: string, studentId: string) {
  if (role === "BIENESTAR") return prisma.student.findUnique({ where: { id: studentId } });
  return prisma.student.findFirst({ where: { id: studentId, docenteUserId: userId } });
}

export async function openConversation(formData: FormData) {
  const user = await requireRole(["BIENESTAR", "DOCENTE"]);
  const student = await loadStudent(user.id, user.role, String(formData.get("studentId") || ""));
  if (!student) return;
  const sent = await sendTemplate(student.telefono, fullName(student.nombres, student.apellidos), user.name);
  const conversation = await prisma.whatsAppConversation.create({
    data: {
      studentId: student.id,
      phone: student.telefono,
      humanHandoff: true,
      handoffUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      docenteUserId: user.role === "DOCENTE" ? user.id : student.docenteUserId,
    },
  });
  await prisma.whatsAppMessage.create({
    data: {
      conversationId: conversation.id,
      direction: "outbound",
      author: user.role === "BIENESTAR" ? "bienestar" : "docente",
      body: "Plantilla de acompañamiento enviada.",
      waMessageId: sent.id || null,
    },
  });
  revalidatePath("/mensajes");
  redirect(`/mensajes/${conversation.id}`);
}

export async function renewTemplate(formData: FormData) {
  const user = await requireRole(["BIENESTAR", "DOCENTE"]);
  const conversationId = String(formData.get("conversationId") || "");
  const conversation = await prisma.whatsAppConversation.findFirst({
    where: user.role === "DOCENTE" ? { id: conversationId, docenteUserId: user.id } : { id: conversationId },
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
      author: user.role === "BIENESTAR" ? "bienestar" : "docente",
      body: "Plantilla de acompañamiento enviada de nuevo.",
      waMessageId: sent.id || null,
    },
  });
  revalidatePath(`/mensajes/${conversation.id}`);
}

export async function sendFreeText(_previous: { error: string }, formData: FormData) {
  const user = await requireRole(["BIENESTAR", "DOCENTE"]);
  const parsed = z
    .object({
      conversationId: z.string().min(5),
      body: z.string().trim().min(1).max(4000),
    })
    .safeParse({
      conversationId: formData.get("conversationId"),
      body: formData.get("body"),
    });
  if (!parsed.success) return { error: "Escribe un mensaje." };
  const conversation = await prisma.whatsAppConversation.findFirst({
    where:
      user.role === "DOCENTE"
        ? { id: parsed.data.conversationId, docenteUserId: user.id }
        : { id: parsed.data.conversationId },
    include: { student: true },
  });
  if (!conversation) return { error: "No encontramos esa conversación." };
  try {
    const sent = await sendText(conversation.student.telefono, parsed.data.body);
    await prisma.whatsAppMessage.create({
      data: {
        conversationId: conversation.id,
        direction: "outbound",
        author: user.role === "BIENESTAR" ? "bienestar" : "docente",
        body: parsed.data.body,
        waMessageId: sent.id || null,
      },
    });
    await prisma.whatsAppConversation.update({
      where: { id: conversation.id },
      data: { humanHandoff: true, handoffUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    });
    revalidatePath(`/mensajes/${conversation.id}`);
    return { error: "" };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "WhatsApp rechazó el mensaje.";
    return {
      error: `No se pudo enviar. ${detail} Si la persona todavía no responde, WhatsApp solo acepta la plantilla.`,
    };
  }
}
