import Link from "next/link";

export default function Home() {
  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "60px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🌾</div>
      <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--color-indigo-deep)", marginBottom: 14 }}>
        Prédiction des besoins en irrigation agricole au Sénégal
      </h1>
      <p style={{ fontSize: 16, color: "#555", lineHeight: 1.7, marginBottom: 28 }}>
        Un système intelligent qui aide les techniciens et agriculteurs à savoir quand et
        combien irriguer — sans capteur coûteux, à partir de données climatiques et
        pédologiques ouvertes (NASA POWER, SoilGrids) et d&apos;un modèle XGBoost entraîné
        sur les 14 régions du Sénégal.
      </p>

      <div style={{ display: "flex", gap: 14, justifyContent: "center", marginBottom: 44 }}>
        <Link
          href="/register"
          style={{
            background: "linear-gradient(90deg,var(--color-indigo),var(--color-indigo-deep))",
            color: "#fff",
            padding: "13px 26px",
            borderRadius: 10,
            fontWeight: 700,
          }}
        >
          Créer un compte
        </Link>
        <Link
          href="/login"
          style={{
            background: "#fff",
            color: "var(--color-indigo)",
            padding: "13px 26px",
            borderRadius: 10,
            fontWeight: 700,
            border: "1.5px solid var(--color-indigo)",
          }}
        >
          Se connecter
        </Link>
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
        {[
          { icon: "🤖", label: "Modèle", value: "XGBoost" },
          { icon: "📡", label: "Données", value: "NASA POWER + SoilGrids" },
          { icon: "🌍", label: "Couverture", value: "14 régions du Sénégal" },
          { icon: "🌿", label: "Cultures", value: "Arachide, Riz, Mil, Pomme de terre" },
        ].map((x, i) => (
          <div
            key={i}
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "14px 18px",
              border: "1px solid var(--color-line)",
              fontSize: 13,
              minWidth: 150,
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 6 }}>{x.icon}</div>
            <div style={{ color: "#888", fontSize: 11, textTransform: "uppercase" }}>{x.label}</div>
            <div style={{ fontWeight: 700, color: "var(--color-indigo)" }}>{x.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
