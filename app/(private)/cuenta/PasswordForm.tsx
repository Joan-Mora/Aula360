"use client";

import { useActionState } from "react";
import { changePassword } from "./actions";

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, { error: "" });
  return (
    <form action={action}>
      {state.error ? <p className="error">{state.error}</p> : null}
      <label>
        Nueva clave
        <input name="password" type="password" required minLength={10} maxLength={80} autoComplete="new-password" />
      </label>
      <label>
        Confirmación
        <input name="confirm" type="password" required minLength={10} maxLength={80} autoComplete="new-password" />
      </label>
      <button className="solid" type="submit" disabled={pending}>
        Guardar clave
      </button>
    </form>
  );
}
