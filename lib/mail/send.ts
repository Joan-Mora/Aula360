import { mailFrom } from "@/lib/env";

export async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY no está configurada.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: mailFrom(),
      to: [to],
      subject,
      html,
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend rechazó el correo (${response.status}): ${detail.slice(0, 240)}`);
  }
}
