import { PasswordForm } from "./PasswordForm";
import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CuentaPage() {
  await requireSession();
  return (
    <main className="panel" id="contenido">
      <p className="kicker">Cuenta</p>
      <h1>Elige tu propia clave.</h1>
      <p className="lead">Diez caracteres, con letras y números. La clave temporal deja de servir.</p>
      <PasswordForm />
    </main>
  );
}
