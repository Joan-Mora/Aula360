"use client";

import { useActionState } from "react";
import { login } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, { error: "" });
  return (
    <form action={action}>
      {state.error ? <p className="error">{state.error}</p> : null}
      <label>
        Correo
        <input name="email" type="email" autoComplete="username" required maxLength={160} />
      </label>
      <label>
        Clave
        <input name="password" type="password" autoComplete="current-password" required minLength={8} maxLength={200} />
      </label>
      <button className="solid" type="submit" disabled={pending}>
        {pending ? "Comprobando" : "Entrar"}
      </button>
    </form>
  );
}
