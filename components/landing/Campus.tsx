"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Component, useEffect, useState, type ReactNode } from "react";

const CampusScene = dynamic(() => import("./CampusScene"), { ssr: false });

class Guard extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function Campus() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  const still = (
    <div className="stage-canvas" style={{ background: "#102027 url(/brand/banner.jpg) center/cover" }} />
  );
  return (
    <section className="stage">
      {reduce ? (
        still
      ) : (
        <Guard fallback={still}>
          <div className="stage-canvas">
            <CampusScene />
          </div>
        </Guard>
      )}
      <header className="landing-bar">
        <Link href="/" className="brand">
          <img src="/brand/logo.jpg" alt="" />
          <strong>Aula 360</strong>
        </Link>
        <Link className="ghost" href="/ingreso" style={{ color: "#f3eee6", borderColor: "rgba(243,238,230,0.4)" }}>
          Ingresar
        </Link>
      </header>
      <div className="stage-copy" id="contenido">
        <p className="kicker">Permanencia estudiantil</p>
        <h1>Antes de que el silencio se vuelva deserción.</h1>
        <p>
          El observatorio lee la fotografía académica, ordena el riesgo y deja listo el
          acompañamiento. El aula vive alrededor de esa lectura.
        </p>
        <p>
          <Link className="solid" href="/ingreso">
            Entrar al aula
          </Link>
        </p>
      </div>
      <footer className="landing-bar">
        <span>Excel como única fuente del riesgo oficial.</span>
      </footer>
    </section>
  );
}
