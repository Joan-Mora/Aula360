"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Component, useEffect, useState, type ReactNode } from "react";
import type { Station } from "@/lib/stations";

const OrbitScene = dynamic(() => import("./OrbitScene"), { ssr: false });

class Guard extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function Orbit({
  name,
  stations,
}: {
  name: string;
  stations: (Station & { badge?: number })[];
}) {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const tape = (
    <nav className="tape" aria-label="Estaciones">
      {stations.map((station) => (
        <Link key={station.href} href={station.href} className="plate">
          {station.icon ? (
            <img src={station.icon} alt="" />
          ) : (
            <div className="monogram">{station.label.slice(0, 1)}</div>
          )}
          <strong>{station.label}</strong>
          <em>
            {station.hint}
            {station.badge ? ` · ${station.badge} sin leer` : ""}
          </em>
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="orbit-wrap" id="contenido">
      <div className="orbit-copy">
        <p className="kicker">Órbita</p>
        <h1>Elige una estación.</h1>
        <p className="lead">{name}. Gira el anillo o recorre las estaciones. No hay menú lateral.</p>
      </div>
      {reduce ? null : (
        <Guard fallback={null}>
          <div className="canvas-host" aria-hidden="true">
            <OrbitScene stations={stations} />
          </div>
        </Guard>
      )}
      {tape}
    </div>
  );
}
