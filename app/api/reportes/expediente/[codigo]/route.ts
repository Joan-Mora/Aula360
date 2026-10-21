import { getCurrentUser } from "@/lib/auth";
import { dossierPdf } from "@/lib/pdf/report";
import { prisma } from "@/lib/prisma";
import { canSeeStudent } from "@/lib/scope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ codigo: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("No autorizado", { status: 401 });
  const { codigo } = await context.params;
  const student = await prisma.student.findUnique({
    where: { codigo },
    include: { snapshots: { orderBy: { createdAt: "desc" } } },
  });
  if (!student || !canSeeStudent(user, student) || !student.snapshots[0]) {
    return new Response("No encontrado", { status: 404 });
  }
  const pdf = await dossierPdf(student, student.snapshots[0], student.snapshots);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="expediente-${student.codigo}.pdf"`,
    },
  });
}
