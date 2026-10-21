import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function IngresoPage() {
  const user = await getCurrentUser();
  if (user?.mustChangePassword) redirect("/cuenta");
  if (user) redirect("/orbita");
  return (
    <main className="auth" id="contenido">
      <Link href="/" className="brand">
        <img src="/brand/logo.jpg" alt="" />
        <strong>Aula 360</strong>
      </Link>
      <h1>Ingreso</h1>
      <p className="lead">La sesión queda en una cookie httpOnly. El Excel sigue siendo la fuente del riesgo.</p>
      <LoginForm />
    </main>
  );
}
