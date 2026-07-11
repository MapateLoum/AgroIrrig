"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/Toast";

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

function VerifyEmailForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { showToast } = useToast();

  const [email, setEmail] = useState(params.get("email") || "");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue");
        return;
      }

      showToast("Email vérifié avec succès — connecte-toi maintenant.", "success");
      router.push("/login");
    } catch {
      setError("Impossible de contacter le serveur");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError(null);
    setResending(true);
    try {
      const res = await fetch("/api/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Une erreur est survenue");
        return;
      }
      showToast("Un nouveau code a été envoyé.", "success");
    } catch {
      setError("Impossible de contacter le serveur");
    } finally {
      setResending(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "60px auto", padding: "0 20px" }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: 32, boxShadow: "0 2px 14px rgba(44,79,124,0.09)" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--color-indigo)", marginBottom: 10 }}>
          Vérifie ton email
        </h1>
        <p style={{ fontSize: 13, color: "var(--color-ink-soft)", marginBottom: 22, lineHeight: 1.6 }}>
          Un code à 6 chiffres a été envoyé à ton adresse email. Il expire dans 10 minutes.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={{ fontSize: 12, color: "var(--color-ink-soft)", fontWeight: 600 }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />

          <label style={{ fontSize: 12, color: "var(--color-ink-soft)", fontWeight: 600 }}>Code à 6 chiffres</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            required
            style={{ ...inputStyle, letterSpacing: 6, fontFamily: "var(--font-mono)", fontSize: 18, textAlign: "center" }}
            placeholder="••••••"
          />

          {error && <div style={{ color: "var(--color-clay)", fontSize: 13, marginBottom: 14 }}>{error}</div>}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            style={{
              width: "100%",
              padding: 13,
              background: loading || code.length !== 6 ? "#aaa" : "linear-gradient(90deg,var(--color-indigo),var(--color-indigo-deep))",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 15,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Vérification…" : "Vérifier"}
          </button>
        </form>

        <div style={{ marginTop: 18, textAlign: "center", fontSize: 13, color: "var(--color-ink-soft)" }}>
          Pas reçu de code ?{" "}
          <button
            onClick={handleResend}
            disabled={resending}
            style={{ background: "none", border: "none", color: "var(--color-indigo)", fontWeight: 600, cursor: "pointer", padding: 0 }}
          >
            {resending ? "Envoi…" : "Renvoyer le code"}
          </button>
        </div>

        <div style={{ marginTop: 10, textAlign: "center", fontSize: 13 }}>
          <Link href="/login" style={{ color: "var(--color-indigo)", fontWeight: 600 }}>
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailForm />
    </Suspense>
  );
}
