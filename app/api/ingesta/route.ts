import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ingestWorkbook } from "@/lib/excel/ingest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ ok: false, errors: [{ fila: null, columna: null, mensaje: "Origen no permitido." }] }, { status: 403 });
  }
  const user = await getCurrentUser();
  if (!user || user.role !== "BIENESTAR") {
    return NextResponse.json({ ok: false, errors: [{ fila: null, columna: null, mensaje: "No autorizado." }] }, { status: 401 });
  }
  const form = await request.formData();
  const file = form.get("archivo");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, errors: [{ fila: null, columna: null, mensaje: "Falta el archivo." }] }, { status: 400 });
  }
  const name = file.name.toLowerCase();
  if (!name.endsWith(".xlsx")) {
    return NextResponse.json({ ok: false, errors: [{ fila: null, columna: null, mensaje: "Solo se acepta .xlsx." }] }, { status: 400 });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await ingestWorkbook(buffer, file.name, user.id);
  return NextResponse.json(result, { status: result.ok ? 200 : 422 });
}
