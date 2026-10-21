# Aula 360

Aula virtual con un observatorio de permanencia. El reto **Antes que sea tarde** vive en el centro: un Excel es la única fuente de los datos académicos, el sistema calcula el riesgo de deserción, clasifica, recomienda y deja listo el aviso a Bienestar y al docente.

## Qué hace

- Landing e ingreso con sesión httpOnly.
- Órbita de estaciones, sin menú lateral.
- Carga `.xlsx` con validación estricta y recarga sin duplicar estudiantes.
- Puntaje determinista y bandas bajo, medio, alto y crítico.
- Narrativa y decisión de aviso con Gemini. Crítico siempre avisa. Bajo nunca avisa.
- Correos con diseño propio vía Resend.
- Observatorio, expediente, PDF y Excel.
- Aula con lista y entregas en Cloudinary. Esa actividad no mueve el puntaje oficial.
- WhatsApp: el docente envía una plantilla y, dentro de la ventana de 24 horas, conversa libre. Si el estudiante escribe sin docente en turno, responde Gemini.

## Requisitos locales

- Node.js 22
- PostgreSQL 16

```bash
npm install
npx prisma migrate deploy
npm run samples
npm run seed
npm run dev
```

Copia [`.env.example`](.env.example) a `.env` y completa los valores. No subas `.env`.

El usuario de semilla sale de `SEED_BIENESTAR_EMAIL` y `SEED_BIENESTAR_PASSWORD`. En este entorno local de demostración esos valores están en tu `.env` (correo `bienestar@aula360.local`).

## Prueba del reto

1. Entra como Bienestar y abre Ingesta.
2. Carga `public/plantillas/ejemplo_invalido.xlsx`. Debes ver errores y la base no cambia.
3. Carga `public/plantillas/ejemplo_valido.xlsx`.
4. Revisa el observatorio, un expediente, el PDF de riesgo y el Excel de estado.
5. Carga `public/plantillas/ejemplo_actualizacion.xlsx`. El código `A360-004` se actualiza y no se duplica.

## Render, solo plan gratis

[`render.yaml`](render.yaml) crea el servicio web `aula360` y la base `aula360-db`, ambos con `plan: free`. No hay discos, workers, cron ni Key Value.

- El servicio escucha en `0.0.0.0` y el puerto `PORT`.
- Salud: `GET /api/health` (responde 200 sin consultar la base).
- El plan gratis se suspende tras 15 minutos sin tráfico. Para evitarlo, configura UptimeRobot por tu cuenta contra `https://<servicio>.onrender.com/api/health` cada 5 minutos. Este repositorio no guarda credenciales de UptimeRobot.
- Un servicio free encendido todo el mes usa cerca de 750 horas. Si la cuenta tiene otro servicio free, el cupo se comparte.
- La base gratis caduca a los 30 días. Hay que crear otra y volver a cargar el Excel: el archivo sigue siendo la fuente de verdad.
- Los secretos van en el panel de Render (`sync: false`). Después del primer despliegue define `APP_URL` con la URL pública `https://...onrender.com` para que los correos muestren el logo.
- El build ejecuta `prisma migrate deploy`. El predeploy ejecuta `npm run seed`.

Webhook de WhatsApp, cuando el servicio esté público:

`https://<servicio>.onrender.com/api/webhooks/whatsapp`

Plantilla de Meta, idioma `es`, nombre en `WHATSAPP_TEMPLATE_NAME` (por defecto `aula360_acompanamiento`), con dos variables de cuerpo: nombre del estudiante y nombre del docente.

## Scripts

- `npm run dev` — desarrollo
- `npm test` — motor de riesgo y validador de Excel
- `npm run samples` — regenera las plantillas
- `npm run seed` — crea o actualiza a Bienestar
- `npm run build` — build standalone
- `npm start` — sirve el standalone

## Documentación

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [SECURITY.md](SECURITY.md)
- [CHANGELOG.md](CHANGELOG.md)
- [docs/MANUAL_TECNICO.md](docs/MANUAL_TECNICO.md)
- [docs/MANUAL_USUARIO.md](docs/MANUAL_USUARIO.md)
