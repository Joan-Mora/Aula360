# Manual técnico

## Entorno

Variables en `.env.example`. Las obligatorias para arrancar son `DATABASE_URL` y `SESSION_SECRET` (16 caracteres o más). Sin Resend, la ingesta guarda datos y marca el correo como fallido. Sin Gemini, el alto y el crítico avisan con las acciones base. Sin Cloudinary, las entregas no se pueden subir. Sin WhatsApp, el webhook rechaza la firma y el envío de plantilla falla con el mensaje de la API.

`MAIL_FROM` se recorta al leerlo. El valor esperado tiene la forma `Aula360 <aula360@abacore.co>`.

## Base de datos

```bash
npx prisma migrate deploy
npm run seed
```

La migración inicial está en `prisma/migrations`. No se edita a mano después de aplicarla: un cambio de esquema crea otra migración.

Modelos principales: `User`, `Session`, `LoginAttempt`, `Student`, `UploadBatch`, `AcademicSnapshot`, `Alert`, `ClassSession`, `AttendanceMark`, `Assignment`, `Submission`, `WhatsAppConversation`, `WhatsAppMessage`.

## Motor y pruebas

`lib/risk/engine.ts` es puro. `lib/excel/validate.ts` no escribe en la base. `npm test` cubre bandas, la decisión de aviso y los rechazos del Excel (columna ausente, celda vacía, texto en un número, suma de evaluaciones, rango y código repetido).

La ingesta vive en `lib/excel/ingest.ts`: valida, prepara cuentas, abre una transacción, y solo después llama a la IA y al correo. Si la transacción falla, no hay fotografías a medias.

## Procesos HTTP

- `POST /api/ingesta` — multipart `archivo`, rol Bienestar, mismo origen.
- `GET /api/reportes/riesgo` — PDF alto y crítico del alcance.
- `GET /api/reportes/estado` — Excel del alcance.
- `GET /api/reportes/expediente/[codigo]` — PDF de una ficha visible para el rol.
- `GET /api/health` — `{ "ok": true, "service": "aula360" }` sin base de datos.
- `GET|POST /api/webhooks/whatsapp` — verificación y recepción.

El resto de las mutaciones son server actions con la cookie de sesión.

## Standalone

`npm run build` genera `.next/standalone` y copia `public` y los estáticos. `npm start` ejecuta `node .next/standalone/server.js`. En Render, `HOSTNAME=0.0.0.0` y `PORT` los aporta la plataforma.

El build evita mapas de fuente del navegador. Si la memoria del plan gratis no alcanza, se reduce el empaquetado antes de pensar en otro plan. No se sube de plan.

## UptimeRobot

No forma parte del código. El monitor externo debe pedir `GET /api/health` cada 5 minutos. Un intervalo mayor de 15 minutos deja que el servicio gratis se duerma.

## WhatsApp

En el administrador de Meta, la URL de devolución de llamada es la ruta pública `/api/webhooks/whatsapp` y el token es `WHATSAPP_VERIFY_TOKEN`. La plantilla de cuerpo, en español, lleva dos parámetros de texto: el nombre del estudiante y el nombre del docente. El código los envía en ese orden.

Firma: HMAC SHA-256 del cuerpo crudo con `WHATSAPP_APP_SECRET`, cabecera `X-Hub-Signature-256`.

## Correo

`lib/mail/templates.ts` arma HTML con tabla, colores de la marca y el logo servido desde `APP_URL`. En producción `APP_URL` tiene que ser la URL https del servicio.

## Caducidad de la base gratis

A los 30 días Render retira la base gratuita. Se crea otra base free, se actualiza `DATABASE_URL`, se corre `prisma migrate deploy`, `npm run seed` y se vuelve a cargar el Excel oficial. Las entregas siguen en Cloudinary si no se borra la cuenta.

## Identidad visual

Archivos en `public/brand`: logo, banner e iconos de observatorio, aula, mensajes y reportes. Paleta: tinta `#102027`, papel `#F3EEE6`, mineral `#1C7C74`, ámbar `#E08A2C`, crítico `#9E2B25`. Tipografías Fraunces y Outfit.
