import { verifyWhatsAppSignature } from "@/lib/whatsapp/client";
import { readInboundMessages, receiveStudentMessage } from "@/lib/whatsapp/handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token && token === process.env.WHATSAPP_VERIFY_TOKEN && challenge) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Verificación rechazada", { status: 403 });
}

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  if (!verifyWhatsAppSignature(raw, signature)) {
    return new Response("Firma inválida", { status: 401 });
  }
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response("JSON inválido", { status: 400 });
  }
  try {
    for (const message of readInboundMessages(payload)) {
      await receiveStudentMessage(message);
    }
  } catch (error) {
    console.error(error);
    return new Response("No se pudo procesar", { status: 500 });
  }
  return new Response("ok", { status: 200 });
}
