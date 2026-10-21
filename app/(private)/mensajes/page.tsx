import { StudentSearch } from "@/components/mensajes/StudentSearch";
import { RefreshEvery } from "@/components/mensajes/RefreshEvery";
import { requireRole } from "@/lib/auth";
import { fullName } from "@/lib/labels";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MensajesPage() {
  const user = await requireRole(["BIENESTAR", "DOCENTE"]);
  const students = await prisma.student.findMany({
    where: user.role === "DOCENTE" ? { docenteUserId: user.id } : {},
    orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
    include: { conversations: { orderBy: { updatedAt: "desc" }, take: 1 } },
  });
  return (
    <main className="panel" id="contenido">
      <p className="kicker">Mensajes</p>
      <h1>La plantilla abre la conversación.</h1>
      <p className="lead">
        Entra al hilo para escribir. El texto libre sale por WhatsApp cuando la persona ya respondió. Si todavía no responde, reenvía la plantilla.
      </p>
      <RefreshEvery />
      <StudentSearch
        students={students.map((student) => ({
          id: student.id,
          nombre: fullName(student.nombres, student.apellidos),
          telefono: student.telefono,
          codigo: student.codigo,
          conversationId: student.conversations[0]?.id ?? null,
        }))}
      />
    </main>
  );
}
