"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function markAlertsRead() {
  const user = await requireSession();
  await prisma.alert.updateMany({
    where: { recipientId: user.id, channel: "in_app", readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/alertas");
  revalidatePath("/orbita");
}
