"use client";

import { useMemo, useState } from "react";
import { openConversation } from "@/app/(private)/mensajes/actions";

export type StudentRow = {
  id: string;
  nombre: string;
  telefono: string;
  codigo: string;
  conversationId: string | null;
};

export function StudentSearch({ students }: { students: StudentRow[] }) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const visible = useMemo(() => {
    if (!needle) return students;
    return students.filter((student) =>
      `${student.nombre} ${student.telefono} ${student.codigo}`.toLowerCase().includes(needle),
    );
  }, [needle, students]);

  return (
    <>
      <label className="finder" htmlFor="buscar-estudiante">
        Buscar estudiante
        <input
          id="buscar-estudiante"
          type="search"
          value={query}
          placeholder="Nombre, código o teléfono"
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <section className="roster">
        {visible.map((student) => (
          <article key={student.id} className="person">
            <img src="/brand/icon-mensajes.jpg" alt="" width={72} height={72} />
            <div>
              <strong>{student.nombre}</strong>
              <div className="muted">
                {student.codigo} · {student.telefono}
              </div>
            </div>
            {student.conversationId ? (
              <a className="solid" href={`/mensajes/${student.conversationId}`}>
                Ver hilo
              </a>
            ) : (
              <form action={openConversation}>
                <input type="hidden" name="studentId" value={student.id} />
                <button className="solid" type="submit">
                  Enviar plantilla
                </button>
              </form>
            )}
          </article>
        ))}
        {students.length === 0 ? <p>No hay estudiantes para escribir. La ingesta del Excel es la fuente.</p> : null}
        {students.length > 0 && visible.length === 0 ? <p>Ningún estudiante coincide con esa búsqueda.</p> : null}
      </section>
    </>
  );
}
