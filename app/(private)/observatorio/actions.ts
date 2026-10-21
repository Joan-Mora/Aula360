"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { passwordEmail } from "@/lib/mail/templates";
import { sendEmail } from "@/lib/mail/send";
import { hashPassword, temporaryPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export async function reenviarClave(formData: FormData) {
  await requireRole(["BIENESTAR"]);
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const account = await prisma.user.findUnique({ where: { email } });
  if (!account || account.role === "BIENESTAR") return;
  const clave = temporaryPassword();
  await prisma.user.update({
    where: { id: account.id },
    data: { passwordHash: await hashPassword(clave), mustChangePassword: true },
  });
  const message = passwordEmail({ nombre: account.name, correo: account.email, clave });
  await sendEmail(account.email, message.subject, message.html);
  revalidatePath("/observatorio");
}
