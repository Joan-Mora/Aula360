import Link from "next/link";
import { destroySession } from "@/lib/auth";
import { roleLabel } from "@/lib/labels";
import type { Role } from "@prisma/client";
import { redirect } from "next/navigation";

async function logout() {
  "use server";
  await destroySession();
  redirect("/ingreso");
}

export function Topbar({ name, role }: { name: string; role: Role }) {
  return (
    <header className="topbar">
      <Link href="/orbita" className="brand">
        <img src="/brand/logo.jpg" alt="" />
        <strong>Aula 360</strong>
      </Link>
      <div className="top-actions">
        <span className="muted">
          {name} · {roleLabel[role]}
        </span>
        <Link className="ghost" href="/orbita">
          Órbita
        </Link>
        <form action={logout}>
          <button className="text-button" type="submit">
            Salir
          </button>
        </form>
      </div>
    </header>
  );
}
