export function appUrl() {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function mailFrom() {
  return (process.env.MAIL_FROM || "Aula360 <aula360@abacore.co>").trim();
}

export function sessionSecret() {
  const value = process.env.SESSION_SECRET?.trim();
  if (!value || value.length < 16) {
    throw new Error("SESSION_SECRET debe tener al menos 16 caracteres.");
  }
  return value;
}
