import { getCurrentUser } from "@/lib/auth";
import { latestCohort } from "@/lib/cohort";
import { statusWorkbook } from "@/lib/excel/export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role === "ESTUDIANTE") return new Response("No autorizado", { status: 401 });
  const cohort = await latestCohort(user);
  const workbook = await statusWorkbook(
    cohort.map((item) => ({
      student: item.student,
      snapshot: item.snapshot,
      lastAlert: item.lastAlert,
    })),
  );
  return new Response(new Uint8Array(workbook), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=\"estado-aula360.xlsx\"",
    },
  });
}
