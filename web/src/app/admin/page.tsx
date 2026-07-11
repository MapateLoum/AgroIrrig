"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { REGIONS } from "@/lib/regions";

interface Stats {
  totalUsers: number;
  totalPredictions: number;
  byRegion: Record<string, number>;
  byCrop: Record<string, number>;
  byNeed: Record<string, number>;
}

const NEED_COLORS: Record<string, string> = {
  High: "#a6432d",
  Medium: "#d9a441",
  Low: "#5f7a45",
};

function toChartData(obj: Record<string, number>, labelFn?: (k: string) => string) {
  return Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .map(([key, value]) => ({ name: labelFn ? labelFn(key) : key, value, key }));
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Erreur de chargement");
          return;
        }
        setStats(data);
      })
      .catch(() => setError("Impossible de contacter le serveur"));
  }, []);

  if (error) {
    return <div style={{ padding: 40, textAlign: "center", color: "var(--color-clay)" }}>{error}</div>;
  }

  if (!stats) {
    return <div style={{ padding: 40, textAlign: "center", color: "var(--color-ink-soft)" }}>Chargement…</div>;
  }

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: 12,
    padding: 20,
    border: "1px solid var(--color-line)",
    flex: 1,
    minWidth: 280,
  };

  const regionData = toChartData(stats.byRegion, (k) => REGIONS[k as keyof typeof REGIONS]?.label ?? k);
  const cropData = toChartData(stats.byCrop);
  const needData = toChartData(stats.byNeed);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 18px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--color-indigo-deep)", marginBottom: 20 }}>
        Vue d&apos;ensemble
      </h1>

      <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 11, color: "var(--color-ink-soft)", textTransform: "uppercase" }}>Utilisateurs</div>
          <div className="data-value" style={{ fontSize: 30, fontWeight: 600, color: "var(--color-indigo)" }}>
            {stats.totalUsers}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 11, color: "var(--color-ink-soft)", textTransform: "uppercase" }}>Prédictions</div>
          <div className="data-value" style={{ fontSize: 30, fontWeight: 600, color: "var(--color-indigo)" }}>
            {stats.totalPredictions}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
        <div style={cardStyle}>
          <div className="font-display" style={{ fontWeight: 700, color: "var(--color-indigo)", marginBottom: 12, fontSize: 15 }}>
            Par région
          </div>
          <ResponsiveContainer width="100%" height={Math.max(180, regionData.length * 28)}>
            <BarChart data={regionData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="var(--color-indigo)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={cardStyle}>
          <div className="font-display" style={{ fontWeight: 700, color: "var(--color-indigo)", marginBottom: 12, fontSize: 15 }}>
            Par culture
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={cropData} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="var(--color-gold)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={cardStyle}>
          <div className="font-display" style={{ fontWeight: 700, color: "var(--color-indigo)", marginBottom: 12, fontSize: 15 }}>
            Par besoin d&apos;irrigation
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={needData} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {needData.map((entry, i) => (
                  <Cell key={i} fill={NEED_COLORS[entry.key] || "var(--color-indigo)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
