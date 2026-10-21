"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="panel" id="contenido">
      <h1>Esta estación no respondió.</h1>
      <p className="lead">Puedes intentar de nuevo.</p>
      <button className="solid" type="button" onClick={() => reset()}>
        Reintentar
      </button>
    </main>
  );
}
