"use client";

import { useState } from "react";
import type { SheetError } from "@/lib/excel/validate";

type Success = {
  ok: true;
  creados: number;
  actualizados: number;
  avisos: number;
  avisosFallidos: number;
  notas: string[];
};
type Failure = { ok: false; errors: SheetError[] };

export function IngestForm() {
  const [pending, setPending] = useState(false);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<Success | Failure | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    const response = await fetch("/api/ingesta", { method: "POST", body: form });
    const payload = (await response.json()) as Success | Failure;
    setResult(payload);
    setPending(false);
  }

  function downloadErrors() {
    if (!result || result.ok) return;
    const lines = ["fila,columna,mensaje", ...result.errors.map((error) =>
      [error.fila ?? "", error.columna ?? "", `"${error.mensaje.replaceAll('"', "'")}"`].join(","),
    )];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "errores-aula360.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <form className="drop" onSubmit={onSubmit}>
      <label className="file-picker">
        <span className="ghost">Elegir documento</span>
        <span className="file-name">{fileName || "Ningún documento seleccionado"}</span>
        <input
          name="archivo"
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          required
          onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
        />
      </label>
      <button className="solid" type="submit" disabled={pending}>
        {pending ? "Validando" : "Subir documento"}
      </button>
      {result && !result.ok ? (
        <div className="error" style={{ marginTop: 16 }}>
          <p>No se escribió nada en la base. Corrige el archivo y vuelve a cargarlo.</p>
          <table className="table">
            <tbody>
              {result.errors.map((error, index) => (
                <tr key={`${error.fila}-${error.columna}-${index}`}>
                  <td>{error.fila ?? "Archivo"}</td>
                  <td>{error.columna ?? ""}</td>
                  <td>{error.mensaje}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="ghost" type="button" onClick={downloadErrors}>
            Descargar informe de errores
          </button>
        </div>
      ) : null}
      {result?.ok ? (
        <p className="ok">
          {result.creados} fichas nuevas, {result.actualizados} actualizadas, {result.avisos} correos de alerta enviados
          {result.avisosFallidos ? `, ${result.avisosFallidos} fallidos` : ""}.
          {result.notas.length ? ` ${result.notas.join(" ")}` : ""}
        </p>
      ) : null}
    </form>
  );
}
