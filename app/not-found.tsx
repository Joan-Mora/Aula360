import Link from "next/link";

export default function NotFound() {
  return (
    <main className="panel" id="contenido">
      <h1>No está en el aula.</h1>
      <p>
        <Link href="/orbita">Volver a la órbita</Link>
      </p>
    </main>
  );
}
