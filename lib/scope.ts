import type { Prisma, User } from "@prisma/client";

export function studentWhere(user: Pick<User, "id" | "role">): Prisma.StudentWhereInput {
  if (user.role === "BIENESTAR") return {};
  if (user.role === "DOCENTE") return { docenteUserId: user.id };
  return { userId: user.id };
}

export function canSeeStudent(
  user: Pick<User, "id" | "role">,
  student: { userId: string | null; docenteUserId: string | null },
) {
  if (user.role === "BIENESTAR") return true;
  if (user.role === "DOCENTE") return student.docenteUserId === user.id;
  return student.userId === user.id;
}
