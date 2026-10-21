"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

const schema = z
  .object({
    password: z.string().min(10).max(80).regex(/[A-Za-z]/).regex(/[0-9]/),
    confirm: z.string(),
  })
  .refine((value) => value.password === value.confirm, { message: "Las claves no coinciden." });

export async function changePassword(_state: { error: string }, formData: FormData) {
  const user = await requireSession();
  const parsed = schema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "La clave debe tener 10 caracteres, letras y números." };
  }
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(parsed.data.password),
      mustChangePassword: false,
    },
  });
  redirect("/orbita");
}
