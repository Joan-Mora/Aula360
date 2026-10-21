"use client";

import { useActionState } from "react";
import { renewTemplate, sendFreeText } from "@/app/(private)/mensajes/actions";

export function Composer({ conversationId }: { conversationId: string }) {
  const [state, action, pending] = useActionState(sendFreeText, { error: "" });

  return (
    <div className="stack">
      <form action={action} className="card">
        <input type="hidden" name="conversationId" value={conversationId} />
        <label htmlFor="mensaje-libre">
          Mensaje
          <textarea id="mensaje-libre" name="body" required minLength={1} maxLength={4000} placeholder="Escribe el mensaje" />
        </label>
        {state.error ? <p className="error">{state.error}</p> : null}
        <button className="solid" type="submit" disabled={pending}>
          {pending ? "Enviando…" : "Enviar"}
        </button>
      </form>
      <form action={renewTemplate}>
        <input type="hidden" name="conversationId" value={conversationId} />
        <button className="ghost" type="submit">
          Enviar plantilla otra vez
        </button>
      </form>
    </div>
  );
}
