import { notFound } from "next/navigation";
import { createAssignment, createSession, submitAssignment } from "../actions";
import { requireSession } from "@/lib/auth";
import { formatWhen, fullName } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { readCourseSlug } from "@/lib/stations";

export const dynamic = "force-dynamic";

export default async function CursoPage({ params }: { params: Promise<{ curso: string }> }) {
  const user = await requireSession();
  const { curso: slug } = await params;
  let curso = "";
  let grupo = "";
  try {
    ({ curso, grupo } = readCourseSlug(slug));
  } catch {
    notFound();
  }
  const roster = await prisma.student.findMany({
    where: {
      curso: curso || null,
      grupo,
      ...(user.role === "DOCENTE" ? { docenteUserId: user.id } : {}),
      ...(user.role === "ESTUDIANTE" ? { userId: user.id } : {}),
    },
    orderBy: { apellidos: "asc" },
  });
  if (!roster.length && user.role !== "BIENESTAR") notFound();
  const courseName = curso || "Acompañamiento";
  const sessions = await prisma.classSession.findMany({
    where: { curso: courseName, grupo },
    orderBy: { heldOn: "desc" },
    include: { marks: true },
  });
  const assignments = await prisma.assignment.findMany({
    where: { curso: courseName, grupo },
    orderBy: { createdAt: "desc" },
    include: { submissions: true },
  });
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="panel" id="contenido">
      <p className="kicker">Aula</p>
      <h1>{courseName}</h1>
      <p className="lead">{grupo ? `Grupo ${grupo}` : "Sin grupo"} · {roster.length} estudiantes</p>
      <div className="split">
        <section>
          <h2 className="section-title">Lista</h2>
          {user.role === "DOCENTE" ? (
            <form action={createSession} className="card">
              <input type="hidden" name="slug" value={slug} />
              <label>
                Sesión
                <input name="title" required minLength={3} maxLength={120} placeholder="Encuentro de permanencia" />
              </label>
              <label>
                Fecha
                <input name="heldOn" type="date" required defaultValue={today} />
              </label>
              <div className="checks">
                {roster.map((student) => (
                  <label className="check" key={student.id}>
                    <input type="checkbox" name="present" value={student.id} />
                    {fullName(student.nombres, student.apellidos)}
                  </label>
                ))}
              </div>
              <button className="solid" type="submit">Guardar lista</button>
            </form>
          ) : (
            <ul className="actions">
              {roster.map((student) => (
                <li key={student.id}>{fullName(student.nombres, student.apellidos)}</li>
              ))}
            </ul>
          )}
          {sessions.map((session) => (
            <p key={session.id}>
              {session.title} · {formatWhen(session.heldOn)} · {session.marks.filter((mark) => mark.present).length} presentes
            </p>
          ))}
        </section>
        <section>
          <h2 className="section-title">Entregas</h2>
          {user.role === "DOCENTE" ? (
            <form action={createAssignment} className="card">
              <input type="hidden" name="slug" value={slug} />
              <label>
                Título
                <input name="title" required minLength={3} maxLength={140} />
              </label>
              <label>
                Descripción
                <textarea name="description" required minLength={3} maxLength={800} />
              </label>
              <button className="solid" type="submit">Publicar entrega</button>
            </form>
          ) : null}
          {assignments.map((assignment) => (
            <article key={assignment.id} className="card">
              <h2>{assignment.title}</h2>
              <p>{assignment.description}</p>
              <ul>
                {assignment.submissions.map((submission) => (
                  <li key={submission.id}>
                    <a href={submission.cloudinaryUrl}>{submission.filename}</a>
                  </li>
                ))}
              </ul>
              {user.role === "ESTUDIANTE" ? (
                <form action={submitAssignment}>
                  <input type="hidden" name="assignmentId" value={assignment.id} />
                  <input name="archivo" type="file" required accept=".pdf,.png,.jpg,.jpeg,.docx" />
                  <button className="ghost" type="submit">Subir a Cloudinary</button>
                </form>
              ) : null}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
