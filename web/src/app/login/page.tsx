"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/Toast";

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [loading, setLoading] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 8,
    border: "1.5px solid var(--color-line)",
    fontSize: 14,
    background: "var(--color-sand)",
    outline: "none",
    marginBottom: 14,
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNeedsVerification(false);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      if (res.error === "EMAIL_NOT_VERIFIED") {
        setNeedsVerification(true);
        setError("Ton email n'est pas encore vérifié.");
      } else {
        setError("Email ou mot de passe incorrect");
      }
      return;
    }

    showToast("Connexion réussie.", "success");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 400, margin: "60px auto", padding: "0 20px" }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: 32, boxShadow: "0 2px 14px rgba(44,79,124,0.09)" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--color-indigo)", marginBottom: 22 }}>
          Connexion
        </h1>

        <form onSubmit={handleSubmit}>
          <label style={{ fontSize: 12, color: "var(--color-ink-soft)", fontWeight: 600 }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
            placeholder="toi@exemple.com"
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label style={{ fontSize: 12, color: "var(--color-ink-soft)", fontWeight: 600 }}>Mot de passe</label>
            <Link href="/forgot-password" style={{ fontSize: 12, color: "var(--color-indigo)" }}>
              Oublié ?
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
            placeholder="••••••••"
          />

          {error && (
            <div style={{ color: "var(--color-clay)", fontSize: 13, marginBottom: 8 }}>{error}</div>
          )}

          {needsVerification && (
            <div style={{ marginBottom: 14 }}>
              <Link
                href={`/verify-email?email=${encodeURIComponent(email)}`}
                style={{ fontSize: 13, color: "var(--color-indigo)", fontWeight: 600 }}
              >
                Vérifier mon email maintenant →
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: 13,
              background: loading ? "#aaa" : "linear-gradient(90deg,var(--color-indigo),var(--color-indigo-deep))",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 15,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <div style={{ marginTop: 18, textAlign: "center", fontSize: 13, color: "var(--color-ink-soft)" }}>
          Pas encore de compte ?{" "}
          <Link href="/register" style={{ color: "var(--color-indigo)", fontWeight: 600 }}>
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
}
