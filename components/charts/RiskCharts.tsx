"use client";

import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const colors: Record<string, string> = {
  Bajo: "#1C7C74",
  Medio: "#C6A15B",
  Alto: "#E08A2C",
  "Crítico": "#9E2B25",
};

export function RiskCharts({
  bands,
  programs,
}: {
  bands: { banda: string; total: number }[];
  programs: { programa: string; enRiesgo: number }[];
}) {
  return (
    <div className="charts">
      <article className="card">
        <h2>Bandas</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={bands}>
            <XAxis dataKey="banda" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="total" radius={[8, 8, 0, 0]}>
              {bands.map((entry) => (
                <Cell key={entry.banda} fill={colors[entry.banda] || "#102027"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </article>
      <article className="card">
        <h2>Riesgo por programa</h2>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={programs} dataKey="enRiesgo" nameKey="programa" outerRadius={90}>
              {programs.map((entry, index) => (
                <Cell key={entry.programa} fill={index % 2 ? "#E08A2C" : "#1C7C74"} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </article>
    </div>
  );
}
