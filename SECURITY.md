# Seguridad

## Acceso

- Contraseñas con Argon2id (`memoryCost` 19456, `timeCost` 2).
- Sesión aleatoria de 32 bytes. En la base solo se guarda el SHA-256 del secreto de sesión más el token.
- Cookie `aula_session`: httpOnly, SameSite=Lax y Secure en producción. Dura 7 días.
- Ocho intentos fallidos por correo en quince minutos bloquean el ingreso.
- Si el correo no existe, igual se verifica un hash de relleno para no responder más rápido.
- El mensaje de error de ingreso no dice si falló el correo o la clave.
- La clave temporal obliga a pasar por `/cuenta`.

## Autorización

Cada consulta de estudiantes usa el alcance del rol:

- Bienestar ve toda la cohorte.
- Docente ve solo `docenteUserId` propio.
- Estudiante ve solo su ficha.

Las rutas de PDF, Excel, aula, mensajes y reenvío de clave repiten esa comprobación. No basta con conocer un código.

## Entrada

- Zod en ingreso, clave nueva, sesiones, entregas y mensajes.
- El Excel se rechaza si no empieza con la firma ZIP de un `.xlsx`, si supera 5 MB o si no cumple columnas, tipos, rangos, suma de evaluaciones o códigos únicos.
- Una carga inválida no abre transacción de escritura.
- Las entregas aceptan pdf, png, jpg y docx, hasta 8 MB, y solo del curso del estudiante.
- Prisma es la única vía a PostgreSQL. No hay SQL concatenado ni `$queryRaw`.

## Navegador

En producción las respuestas llevan `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` y una política de contenido. La carga de Excel exige el mismo `Origin` que el `Host`. Las server actions de Next.js comprueban el origen.

## WhatsApp

`POST /api/webhooks/whatsapp` exige `X-Hub-Signature-256` con `WHATSAPP_APP_SECRET`, comparado en tiempo constante. La verificación `GET` exige `WHATSAPP_VERIFY_TOKEN`. Un número que no coincide con un teléfono del Excel se ignora. El bot no pide contraseñas ni inventa notas o puntaje.

## Secretos

`.env` está en `.gitignore`. `.env.example` solo tiene nombres. Los valores de Render se cargan en el panel (`sync: false`). El correo recorta espacios de `MAIL_FROM`.

## Límites que conviene conocer

El límite de intentos vive en Postgres, así que sobrevive a un reinicio de la instancia única. No hay un segundo factor. La plantilla de WhatsApp debe existir y estar aprobada en Meta; si no, el envío falla y el hilo no se finge como entregado.
