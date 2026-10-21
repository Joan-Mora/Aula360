import { appUrl, mailFrom } from "@/lib/env";

function shell(title: string, body: string) {
  const logo = `${appUrl()}/brand/logo.jpg`;
  return `<!doctype html>
<html lang="es">
  <body style="margin:0;background:#F3EEE6;color:#102027;font-family:Georgia,serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F3EEE6;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="background:#fffdf8;border:1px solid #d9d1c4;">
            <tr>
              <td style="background:#102027;padding:22px 28px;">
                <img src="${logo}" width="54" height="54" alt="Aula 360" style="display:block;border-radius:27px;" />
                <p style="margin:14px 0 0;font-family:Arial,sans-serif;letter-spacing:0.16em;text-transform:uppercase;font-size:12px;color:#1C7C74;">Aula 360</p>
                <h1 style="margin:8px 0 0;font-weight:500;font-size:28px;line-height:1.15;color:#F3EEE6;">${title}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;font-family:Arial,sans-serif;font-size:16px;line-height:1.55;">
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 24px;font-family:Arial,sans-serif;font-size:12px;color:#5d6a72;">
                Permanencia estudiantil. Este mensaje sale de Aula 360 y no pide contraseñas.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function riskEmail(input: {
  destinatario: string;
  estudiante: string;
  codigo: string;
  programa: string;
  banda: string;
  puntaje: number;
  narrativa: string;
  acciones: string[];
}) {
  const actions = input.acciones.map((item) => `<li style="margin:0 0 8px;">${escapeHtml(item)}</li>`).join("");
  return {
    subject: `Aula 360: ${input.estudiante} está en riesgo de deserción`,
    html: shell(
      "Un estudiante necesita acompañamiento",
      `<p style="margin:0 0 12px;">Hola ${escapeHtml(input.destinatario)},</p>
       <p style="margin:0 0 12px;"><strong>${escapeHtml(input.estudiante)}</strong> (${escapeHtml(input.codigo)}), de ${escapeHtml(input.programa)}, quedó en banda <strong style="color:#E08A2C;">${escapeHtml(input.banda)}</strong> con puntaje ${input.puntaje}.</p>
       <p style="margin:0 0 12px;">${escapeHtml(input.narrativa)}</p>
       <p style="margin:0 0 8px;">Acciones sugeridas</p>
       <ul style="padding-left:18px;margin:0;">${actions}</ul>`,
    ),
  };
}

export function passwordEmail(input: { nombre: string; correo: string; clave: string }) {
  return {
    subject: "Aula 360: tu clave de ingreso",
    html: shell(
      "Tu ingreso al aula",
      `<p style="margin:0 0 12px;">Hola ${escapeHtml(input.nombre)},</p>
       <p style="margin:0 0 12px;">Tu cuenta quedó lista. Entra con el correo ${escapeHtml(input.correo)} y esta clave temporal:</p>
       <p style="margin:0 0 12px;font-size:22px;letter-spacing:0.04em;"><strong>${escapeHtml(input.clave)}</strong></p>
       <p style="margin:0;">Al entrar, el sistema te pedirá elegir una clave propia.</p>`,
    ),
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
