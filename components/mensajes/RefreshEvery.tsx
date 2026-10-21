"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function RefreshEvery() {
  const router = useRouter();
  useEffect(() => {
    const id = window.setInterval(() => router.refresh(), 15_000);
    return () => window.clearInterval(id);
  }, [router]);
  return <p className="muted">La bandeja se lee cada 15 segundos.</p>;
}
