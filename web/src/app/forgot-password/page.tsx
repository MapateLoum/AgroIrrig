"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
      setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(email)}`);
      }, 1200);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "60px auto", padding: "0 20px" }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: 32, boxShadow: "0 2px 14px rgba(44,79,124,0.09)" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--color-indigo)", marginBottom: 10 }}>
          Mot de passe oublié
        </h1>
        <p style={{ fontSize: 13, color: "var(--color-ink-soft)", marginBottom: 22, lineHeight: 1.6 }}>
          Entre ton email, on t&apos;envoie un code pour réinitialiser ton mot de passe.
        </p>

        {sent ? (
          <div style={{ fontSize: 14, color: "var(--color-olive)", fontWeight: 600 }}>
            Si un compte existe avec cet email, un code a été envoyé. Redirection…
          </div>
        ) : (
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
              {loading ? "Envoi…" : "Envoyer le code"}
            </button>
          </form>
        )}

        <div style={{ marginTop: 18, textAlign: "center", fontSize: 13 }}>
          <Link href="/login" style={{ color: "var(--color-indigo)", fontWeight: 600 }}>
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
