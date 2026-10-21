"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().trim().email().max(160),
  password: z.string().min(8).max(200),
});

let dummyHash: string | null = null;

export async function login(_state: { error: string }, formData: FormData) {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Revisa el correo y la clave." };
  const email = parsed.data.email.toLowerCase();
  const since = new Date(Date.now() - 15 * 60 * 1000);
  const fails = await prisma.loginAttempt.count({
    where: { email, success: false, createdAt: { gte: since } },
  });
  if (fails >= 8) return { error: "Demasiados intentos. Espera quince minutos." };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!dummyHash) dummyHash = await hashPassword("aula360-tiempo-constante");
  const valid = user
    ? await verifyPassword(user.passwordHash, parsed.data.password)
    : await verifyPassword(dummyHash, parsed.data.password).then(() => false);

  const success = Boolean(user && valid && user.active);
  await prisma.loginAttempt.create({ data: { email, success } });
  if (!success || !user) return { error: "Correo o clave incorrectos." };
  await createSession(user.id);
  if (user.mustChangePassword) redirect("/cuenta");
  redirect("/orbita");
}
