import type { Role } from "@prisma/client";

export type Station = {
  href: string;
  label: string;
  hint: string;
  icon: string | null;
};

export function stationsFor(role: Role): Station[] {
  if (role === "BIENESTAR") {
    return [
      { href: "/observatorio", label: "Observatorio", hint: "Riesgo de toda la cohorte", icon: "/brand/icon-observatorio.jpg" },
      { href: "/ingesta", label: "Ingesta", hint: "La única puerta del Excel", icon: null },
      { href: "/reportes", label: "Reportes", hint: "PDF y Excel", icon: "/brand/icon-reportes.jpg" },
      { href: "/mensajes", label: "Mensajes", hint: "WhatsApp y la bandeja", icon: "/brand/icon-mensajes.jpg" },
      { href: "/alertas", label: "Alertas", hint: "Avisos de alto y crítico", icon: null },
    ];
  }
  if (role === "DOCENTE") {
    return [
      { href: "/observatorio", label: "Observatorio", hint: "Tus estudiantes", icon: "/brand/icon-observatorio.jpg" },
      { href: "/aula", label: "Aula", hint: "Lista y entregas", icon: "/brand/icon-aula.jpg" },
      { href: "/mensajes", label: "Mensajes", hint: "WhatsApp con plantilla", icon: "/brand/icon-mensajes.jpg" },
      { href: "/alertas", label: "Alertas", hint: "Casos de tu grupo", icon: null },
    ];
  }
  return [
    { href: "/observatorio", label: "Expediente", hint: "Tu lectura de permanencia", icon: "/brand/icon-observatorio.jpg" },
    { href: "/aula", label: "Aula", hint: "Sesiones y entregas", icon: "/brand/icon-aula.jpg" },
  ];
}

export function courseSlug(curso: string, grupo: string) {
  return Buffer.from(`${curso}\n${grupo}`, "utf8").toString("base64url");
}

export function hrefFor(curso: string | null, grupo: string) {
  return `/aula/${courseSlug(curso || "", grupo)}`;
}

export function readCourseSlug(slug: string) {
  const raw = Buffer.from(slug, "base64url").toString("utf8");
  const [curso, grupo = ""] = raw.split("\n");
  return { curso, grupo };
}
