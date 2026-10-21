import { createHmac, timingSafeEqual } from "crypto";
import { whatsappTo } from "@/lib/phone";

export function verifyWhatsAppSignature(rawBody: string, header: string | null) {
  const secret = process.env.WHATSAPP_APP_SECRET || "";
  if (!header || !secret) return false;
  const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  const left = Buffer.from(header);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function graphUrl() {
  const version = process.env.WHATSAPP_GRAPH_VERSION || "v24.0";
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneId || !token) throw new Error("WhatsApp no está configurado.");
  return {
    url: `https://graph.facebook.com/${version}/${phoneId}/messages`,
    token,
  };
}

async function postMessage(body: unknown) {
  if (process.env.WHATSAPP_SIMULATION === "true") {
    return { simulated: true as const, id: `sim-${Date.now()}` };
  }
  const { url, token } = graphUrl();
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as {
    messages?: { id: string }[];
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(payload.error?.message || "WhatsApp rechazó el mensaje.");
  }
  return { simulated: false as const, id: payload.messages?.[0]?.id ?? "" };
}

export async function sendTemplate(to: string, studentName: string, teacherName: string) {
  const template = process.env.WHATSAPP_TEMPLATE_NAME || "aula360_acompanamiento";
  const language = process.env.WHATSAPP_TEMPLATE_LANG || "es";
  return postMessage({
    messaging_product: "whatsapp",
    to: whatsappTo(to),
    type: "template",
    template: {
      name: template,
      language: { code: language },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: studentName },
            { type: "text", text: teacherName },
          ],
        },
      ],
    },
  });
}

export async function sendText(to: string, body: string) {
  return postMessage({
    messaging_product: "whatsapp",
    to: whatsappTo(to),
    type: "text",
    text: { body: body.slice(0, 4000) },
  });
}
