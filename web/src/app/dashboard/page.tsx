import PredictionForm from "@/components/PredictionForm";

export default function DashboardPage() {
  return (
    <div>
      <div style={{ maxWidth: 700, margin: "24px auto 0", padding: "0 18px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--color-indigo-deep)" }}>Nouvelle prédiction</h1>
        <p style={{ fontSize: 13, color: "#777", marginTop: 4 }}>
          Choisis ta région et renseigne ta parcelle pour obtenir une recommandation d&apos;irrigation.
        </p>
      </div>
      <PredictionForm />
    </div>
  );
}
