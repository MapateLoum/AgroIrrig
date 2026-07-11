"use client";

/**
 * Jauge circulaire évoquant un pluviomètre / instrument de mesure agronomique.
 * Élément signature de l'app : le résultat (Low/Medium/High) n'est pas affiché
 * comme une simple pastille de couleur, mais comme la lecture d'un instrument —
 * cohérent avec le fait que la prédiction vient de vraies mesures satellite.
 */

const NEEDS = ["Low", "Medium", "High"] as const;
type Need = (typeof NEEDS)[number];

const NEED_META: Record<Need, { color: string; label: string; angle: number }> = {
  Low: { color: "var(--color-olive)", label: "Faible", angle: 30 },
  Medium: { color: "var(--color-gold)", label: "Modéré", angle: 90 },
  High: { color: "var(--color-clay)", label: "Élevé", angle: 150 },
};

interface DeficitGaugeProps {
  need: Need;
  confidence: number; // 0-100
}

// Arc de 180° (demi-cercle), de 180° (gauche) à 0° (droite)
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((180 - angleDeg) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export default function DeficitGauge({ need, confidence }: DeficitGaugeProps) {
  const cx = 110;
  const cy = 110;
  const r = 82;

  const meta = NEED_META[need];
  // L'aiguille dévie légèrement selon la confiance à l'intérieur de son tiers de zone
  const spread = 24;
  const confAdj = (confidence - 70) / 30; // ~ -1..1 pour confiance 40-100%
  const needleAngle = Math.min(174, Math.max(6, meta.angle + confAdj * spread * 0.4));
  const needleTip = polarToCartesian(cx, cy, r - 14, needleAngle);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={220} height={140} viewBox="0 0 220 140">
        {/* Zones de l'instrument */}
        <path d={describeArc(cx, cy, r, 0, 60)} stroke="var(--color-olive-soft)" strokeWidth={16} fill="none" strokeLinecap="round" />
        <path d={describeArc(cx, cy, r, 60, 120)} stroke="var(--color-gold-soft)" strokeWidth={16} fill="none" />
        <path d={describeArc(cx, cy, r, 120, 180)} stroke="var(--color-clay-soft)" strokeWidth={16} fill="none" strokeLinecap="round" />

        {/* Graduations */}
        {[0, 30, 60, 90, 120, 150, 180].map((a) => {
          const p1 = polarToCartesian(cx, cy, r - 12, a);
          const p2 = polarToCartesian(cx, cy, r + 4, a);
          return (
            <line key={a} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="var(--color-white)" strokeWidth={2} />
          );
        })}

        {/* Aiguille */}
        <line
          x1={cx}
          y1={cy}
          x2={needleTip.x}
          y2={needleTip.y}
          stroke="var(--color-ink)"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={7} fill="var(--color-ink)" />
        <circle cx={cx} cy={cy} r={3} fill="var(--color-sand-light)" />

        {/* Labels de zone */}
        <text x={polarToCartesian(cx, cy, r + 22, 20).x} y={polarToCartesian(cx, cy, r + 22, 20).y} fontSize={11} fill="var(--color-ink-soft)" textAnchor="middle" fontFamily="var(--font-body)">Faible</text>
        <text x={cx} y={cy - r - 12} fontSize={11} fill="var(--color-ink-soft)" textAnchor="middle" fontFamily="var(--font-body)">Modéré</text>
        <text x={polarToCartesian(cx, cy, r + 22, 160).x} y={polarToCartesian(cx, cy, r + 22, 160).y} fontSize={11} fill="var(--color-ink-soft)" textAnchor="middle" fontFamily="var(--font-body)">Élevé</text>
      </svg>

      <div
        className="font-display"
        style={{ fontSize: 26, fontWeight: 700, color: meta.color, marginTop: -6 }}
      >
        {meta.label}
      </div>
      <div className="data-value" style={{ fontSize: 13, color: "var(--color-ink-soft)" }}>
        confiance {confidence.toFixed(1)}%
      </div>
    </div>
  );
}
