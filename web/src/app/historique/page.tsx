"use client";

import { useEffect, useState, useCallback } from "react";
import { REGION_KEYS, REGIONS, CROP_TYPES } from "@/lib/regions";

interface HistoryItem {
  id: string;
  region: string;
  cropType: string;
  cropGrowthStage: string;
  irrigationNeed: string;
  confidence: number;
  createdAt: string;
}

const NEED_COLORS: Record<string, string> = {
  High: "#F0A500",
  Medium: "#FF9800",
  Low: "#28A745",
};

export default function HistoriquePage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [region, setRegion] = useState("");
  const [cropType, setCropType] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (region) params.set("region", region);
    if (cropType) params.set("cropType", cropType);

    try {
      const res = await fetch(`/api/history?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur de chargement");
        return;
      }
      setItems(data.items);
      setTotalPages(data.pagination.totalPages);
    } catch {
      setError("Impossible de contacter le serveur");
    } finally {
      setLoading(false);
    }
  }, [region, cropType, page]);

  useEffect(() => {
    load();
  }, [load]);

  const selStyle: React.CSSProperties = {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1.5px solid var(--color-line)",
    fontSize: 13,
    background: "var(--color-sand)",
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 18px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--color-indigo-deep)", marginBottom: 18 }}>
        Historique des prédictions
      </h1>

      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <select
          value={region}
          onChange={(e) => {
            setRegion(e.target.value);
            setPage(1);
          }}
          style={selStyle}
        >
          <option value="">Toutes les régions</option>
          {REGION_KEYS.map((r) => (
            <option key={r} value={r}>
              {REGIONS[r].label}
            </option>
          ))}
        </select>

        <select
          value={cropType}
          onChange={(e) => {
            setCropType(e.target.value);
            setPage(1);
          }}
          style={selStyle}
        >
          <option value="">Toutes les cultures</option>
          {CROP_TYPES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          <a
            href={`/api/history/export?format=csv${region ? `&region=${region}` : ""}${cropType ? `&cropType=${cropType}` : ""}`}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1.5px solid var(--color-indigo)",
              color: "var(--color-indigo)",
              fontSize: 13,
              fontWeight: 600,
              background: "#fff",
            }}
          >
            Export CSV
          </a>
          <a
            href={`/api/history/export?format=pdf${region ? `&region=${region}` : ""}${cropType ? `&cropType=${cropType}` : ""}`}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "none",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              background: "linear-gradient(90deg,var(--color-indigo),var(--color-indigo-deep))",
            }}
          >
            Export PDF
          </a>
        </div>
      </div>

      {loading && <div style={{ color: "#888" }}>Chargement…</div>}
      {error && <div style={{ color: "#dc3545" }}>{error}</div>}

      {!loading && !error && items.length === 0 && (
        <div style={{ color: "#999", padding: 30, textAlign: "center" }}>
          Aucune prédiction pour l&apos;instant.
        </div>
      )}

      {!loading && items.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid var(--color-line)", overflow: "hidden" }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 18px",
                borderBottom: "1px solid #F0F8FA",
                fontSize: 13,
              }}
            >
              <div>
                <strong>{REGIONS[item.region as keyof typeof REGIONS]?.label ?? item.region}</strong>
                {" — "}
                {item.cropType} ({item.cropGrowthStage})
                <div style={{ color: "#999", fontSize: 11, marginTop: 2 }}>
                  {new Date(item.createdAt).toLocaleString("fr-FR")}
                </div>
              </div>
              <div
                style={{
                  color: NEED_COLORS[item.irrigationNeed] || "#666",
                  fontWeight: 700,
                }}
              >
                {item.irrigationNeed} ({item.confidence.toFixed(0)}%)
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 18 }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid var(--color-line)", background: "#fff" }}
          >
            Précédent
          </button>
          <span style={{ alignSelf: "center", fontSize: 13, color: "#777" }}>
            Page {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid var(--color-line)", background: "#fff" }}
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
