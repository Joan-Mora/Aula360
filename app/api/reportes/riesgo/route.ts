import { getCurrentUser } from "@/lib/auth";
import { latestCohort } from "@/lib/cohort";
import { riskListPdf } from "@/lib/pdf/report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role === "ESTUDIANTE") return new Response("No autorizado", { status: 401 });
  const cohort = await latestCohort(user);
  const rows = cohort
    .filter((item) => item.snapshot.riskBand === "ALTO" || item.snapshot.riskBand === "CRITICO")
    .map((item) => ({ student: item.student, snapshot: item.snapshot }));
  const pdf = await riskListPdf(rows);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=\"riesgo-aula360.pdf\"",
    },
  });
}
