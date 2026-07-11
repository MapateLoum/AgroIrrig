"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/Toast";

export default function RegisterPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
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
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue");
        setLoading(false);
        return;
      }

      showToast("Compte créé — un code de vérification a été envoyé par email.", "success");
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch {
      setError("Impossible de contacter le serveur");
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "60px auto", padding: "0 20px" }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: 32, boxShadow: "0 2px 14px rgba(44,79,124,0.09)" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--color-indigo)", marginBottom: 22 }}>
          Créer un compte
        </h1>

        <form onSubmit={handleSubmit}>
          <label style={{ fontSize: 12, color: "var(--color-ink-soft)", fontWeight: 600 }}>Nom complet</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={inputStyle}
            placeholder="Ton nom"
          />

          <label style={{ fontSize: 12, color: "var(--color-ink-soft)", fontWeight: 600 }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
            placeholder="toi@exemple.com"
          />

          <label style={{ fontSize: 12, color: "var(--color-ink-soft)", fontWeight: 600 }}>Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={inputStyle}
            placeholder="Au moins 6 caractères"
          />

          {error && (
            <div style={{ color: "var(--color-clay)", fontSize: 13, marginBottom: 14 }}>{error}</div>
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
            {loading ? "Création…" : "Créer mon compte"}
          </button>
        </form>

        <div style={{ marginTop: 18, textAlign: "center", fontSize: 13, color: "var(--color-ink-soft)" }}>
          Déjà un compte ?{" "}
          <Link href="/login" style={{ color: "var(--color-indigo)", fontWeight: 600 }}>
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
