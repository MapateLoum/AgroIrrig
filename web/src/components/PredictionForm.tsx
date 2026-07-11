"use client";

import { useState } from "react";
import { REGION_KEYS, REGIONS, CROP_TYPES, CROP_STAGES, RegionKey } from "@/lib/regions";
import DeficitGauge from "@/components/DeficitGauge";

const CROP_LABELS: Record<string, string> = {
  Arachide: "Arachide",
  Riz: "Riz",
  Mil: "Mil",
  Pomme_de_terre: "Pomme de terre",
};

const STAGE_LABELS: Record<string, string> = {
  Semis: "Semis",
  Vegetatif: "Végétatif",
  Floraison: "Floraison",
  Recolte: "Récolte",
};

interface PredictionResult {
  irrigationNeed: "Low" | "Medium" | "High";
  confidence: number;
  probabilities: Record<string, number>;
}

interface PredictionContext {
  region: string;
  climateDate: string;
  season: string;
  Temperature_C: number;
  Humidity: number;
  Rainfall_mm: number;
  Soil_Type: string;
  Soil_pH: number;
}

const selStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 13px",
  borderRadius: 8,
  border: "1.5px solid var(--color-line)",
  fontSize: 14,
  background: "var(--color-sand)",
  color: "var(--color-ink)",
  outline: "none",
  cursor: "pointer",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#666",
  display: "block",
  marginBottom: 5,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 0.8,
};

export default function PredictionForm() {
const [region, setRegion] = useState<RegionKey>("Kaolack");
const [cropType, setCropType] = useState<(typeof CROP_TYPES)[number]>(CROP_TYPES[0]);
const [cropGrowthStage, setCropGrowthStage] = useState<(typeof CROP_STAGES)[number]>(CROP_STAGES[0]);
const [fieldAreaHectare, setFieldAreaHectare] = useState(1.5);
const [mulchingUsed, setMulchingUsed] = useState<"Yes" | "No">("No");
const [previousIrrigationMm, setPreviousIrrigationMm] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [context, setContext] = useState<PredictionContext | null>(null);

  async function handlePredict() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region,
          cropType,
          cropGrowthStage,
          fieldAreaHectare,
          mulchingUsed,
          previousIrrigationMm,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue");
        setLoading(false);
        return;
      }

      setResult(data.prediction);
      setContext(data.context);
    } catch {
      setError("Impossible de contacter le serveur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 18px" }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 14px rgba(44,79,124,0.09)", marginBottom: 22 }}>
        <div style={{ fontWeight: 600, color: "var(--color-indigo)", fontSize: 12, marginBottom: 18, textTransform: "uppercase", letterSpacing: 1.2 }}>
          Paramètres de la parcelle
        </div>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={labelStyle}>Région</label>
            <select value={region} onChange={(e) => setRegion(e.target.value as RegionKey)} style={selStyle}>
              {REGION_KEYS.map((r) => (
                <option key={r} value={r}>
                  {REGIONS[r].label}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={labelStyle}>Culture</label>
            <select value={cropType} onChange={(e) => setCropType(e.target.value as (typeof CROP_TYPES)[number] )} style={selStyle}>
              {CROP_TYPES.map((c) => (
                <option key={c} value={c}>
                  {CROP_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={labelStyle}>Stade de croissance</label>
            <select value={cropGrowthStage} onChange={(e) => setCropGrowthStage(e.target.value as (typeof CROP_STAGES)[number] )} style={selStyle}>
              {CROP_STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={labelStyle}>Surface (hectares)</label>
            <input
              type="number"
              min={0.1}
              step={0.1}
              value={fieldAreaHectare}
              onChange={(e) => setFieldAreaHectare(Number(e.target.value))}
              style={selStyle}
            />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={labelStyle}>Paillage utilisé</label>
            <select value={mulchingUsed} onChange={(e) => setMulchingUsed(e.target.value as "Yes" | "No")} style={selStyle}>
              <option value="No">Non</option>
              <option value="Yes">Oui</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={labelStyle}>Dernière irrigation (mm)</label>
            <input
              type="number"
              min={0}
              step={1}
              value={previousIrrigationMm}
              onChange={(e) => setPreviousIrrigationMm(Number(e.target.value))}
              style={selStyle}
            />
          </div>
        </div>

        <div style={{ fontSize: 12, color: "#999", marginTop: 14 }}>
          Le climat et le type de sol de la région sont récupérés automatiquement (NASA POWER + SoilGrids) au moment de la prédiction.
        </div>

        <button
          onClick={handlePredict}
          disabled={loading}
          style={{
            marginTop: 18,
            width: "100%",
            padding: 13,
            background: loading ? "#aaa" : "linear-gradient(90deg,var(--color-indigo),var(--color-indigo-deep))",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Analyse en cours…" : "Lancer la prédiction"}
        </button>

        {error && (
          <div style={{ marginTop: 14, color: "#dc3545", fontSize: 13 }}>{error}</div>
        )}
      </div>

      {result && (
        <div>
          <div
            style={{
              textAlign: "center",
              padding: "12px 20px",
              borderRadius: 10,
              marginBottom: 18,
              background:
                result.irrigationNeed === "High"
                  ? "#f7e9e5"
                  : result.irrigationNeed === "Medium"
                  ? "#faf1de"
                  : "#eef4e7",
              border: `1.5px solid ${
                result.irrigationNeed === "High"
                  ? "var(--color-clay)"
                  : result.irrigationNeed === "Medium"
                  ? "var(--color-gold)"
                  : "var(--color-olive)"
              }`,
              fontWeight: 600,
              fontSize: 15,
              color: "var(--color-ink)",
            }}
          >
            {result.irrigationNeed === "High" && "Irriguer dans les 24h — déficit hydrique important."}
            {result.irrigationNeed === "Medium" && "Irrigation à prévoir dans les prochains jours."}
            {result.irrigationNeed === "Low" && "Pas d'irrigation nécessaire pour le moment."}
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
            {["High", "Medium", "Low"].map((cls) => (
              <div
                key={cls}
                style={{
                  flex: 1,
                  minWidth: 120,
                  background: "#fff",
                  borderRadius: 12,
                  padding: "14px 16px",
                  border: "1px solid var(--color-line)",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 11, color: "var(--color-ink-soft)", textTransform: "uppercase", letterSpacing: 0.6 }}>
                  {cls}
                </div>
                <div className="data-value" style={{ fontSize: 22, fontWeight: 600, color: "var(--color-indigo)" }}>
                  {(result.probabilities[cls] ?? 0).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>

          {context && (
            <div style={{ background: "#fff", borderRadius: 12, padding: 18, border: "1px solid var(--color-line)", fontSize: 13, color: "var(--color-ink-soft)" }}>
              <div className="font-display" style={{ fontWeight: 700, color: "var(--color-indigo)", marginBottom: 10, fontSize: 15 }}>
                Données utilisées — {context.region}, {context.climateDate}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }} className="data-value">
                <div>Température : {context.Temperature_C.toFixed(1)}°C</div>
                <div>Humidité : {context.Humidity.toFixed(1)}%</div>
                <div>Pluie récente : {context.Rainfall_mm.toFixed(1)} mm</div>
                <div>Sol : {context.Soil_Type} (pH {context.Soil_pH.toFixed(1)})</div>
                <div>Saison : {context.season === "Hivernage" ? "Hivernage" : "Saison sèche"}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
