"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { uploadBuffer } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { readCourseSlug } from "@/lib/stations";

async function studentsOf(userId: string, role: string, curso: string, grupo: string) {
  return prisma.student.findMany({
    where: {
      curso: curso || null,
      grupo,
      ...(role === "DOCENTE" ? { docenteUserId: userId } : {}),
      ...(role === "ESTUDIANTE" ? { userId } : {}),
    },
    orderBy: { apellidos: "asc" },
  });
}

export async function createSession(formData: FormData) {
  const user = await requireSession();
  if (user.role !== "DOCENTE") redirect("/orbita");
  const parsed = z
    .object({
      slug: z.string().min(1),
      title: z.string().trim().min(3).max(120),
      heldOn: z.string().min(8),
    })
    .safeParse({
      slug: formData.get("slug"),
      title: formData.get("title"),
      heldOn: formData.get("heldOn"),
    });
  if (!parsed.success) return;
  const { curso, grupo } = readCourseSlug(parsed.data.slug);
  const roster = await studentsOf(user.id, user.role, curso, grupo);
  if (!roster.length) return;
  const session = await prisma.classSession.create({
    data: {
      curso: curso || "Acompañamiento",
      grupo,
      title: parsed.data.title,
      heldOn: new Date(parsed.data.heldOn),
      docenteUserId: user.id,
    },
  });
  const present = new Set(formData.getAll("present").map(String));
  await prisma.attendanceMark.createMany({
    data: roster.map((student) => ({
      sessionId: session.id,
      studentId: student.id,
      present: present.has(student.id),
    })),
  });
  revalidatePath("/aula");
}

export async function createAssignment(formData: FormData) {
  const user = await requireSession();
  if (user.role !== "DOCENTE") redirect("/orbita");
  const parsed = z
    .object({
      slug: z.string().min(1),
      title: z.string().trim().min(3).max(140),
      description: z.string().trim().min(3).max(800),
    })
    .safeParse({
      slug: formData.get("slug"),
      title: formData.get("title"),
      description: formData.get("description"),
    });
  if (!parsed.success) return;
  const { curso, grupo } = readCourseSlug(parsed.data.slug);
  const roster = await studentsOf(user.id, user.role, curso, grupo);
  if (!roster.length) return;
  await prisma.assignment.create({
    data: {
      curso: curso || "Acompañamiento",
      grupo,
      title: parsed.data.title,
      description: parsed.data.description,
      docenteUserId: user.id,
    },
  });
  revalidatePath("/aula");
}

const allowed = new Map<string, string>([
  ["pdf", "application/pdf"],
  ["png", "image/png"],
  ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"],
  ["docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
]);

export async function submitAssignment(formData: FormData) {
  const user = await requireSession();
  if (user.role !== "ESTUDIANTE") redirect("/orbita");
  const assignmentId = String(formData.get("assignmentId") || "");
  const file = formData.get("archivo");
  if (!(file instanceof File) || file.size === 0 || file.size > 8 * 1024 * 1024) return;
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  if (!allowed.has(extension)) return;
  const profile = await prisma.student.findUnique({ where: { userId: user.id } });
  if (!profile) return;
  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) return;
  const sameCourse = (profile.curso || "Acompañamiento") === assignment.curso && profile.grupo === assignment.grupo;
  if (!sameCourse) return;
  const uploaded = await uploadBuffer(Buffer.from(await file.arrayBuffer()), "aula360/entregas", file.name);
  await prisma.submission.create({
    data: {
      assignmentId,
      studentId: profile.id,
      cloudinaryUrl: uploaded.secureUrl,
      publicId: uploaded.publicId,
      filename: file.name.slice(0, 180),
    },
  });
  revalidatePath("/aula");
}
