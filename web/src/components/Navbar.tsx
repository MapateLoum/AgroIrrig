"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <div
      style={{
        background: "linear-gradient(135deg,var(--color-indigo) 0%,var(--color-indigo-deep) 100%)",
        padding: "16px 28px",
        color: "#fff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 24 }}>🌱</span>
        <span className="font-display" style={{ fontWeight: 700, fontSize: 18 }}>AgroIrrig Sénégal</span>
      </Link>

      <div style={{ display: "flex", gap: 18, alignItems: "center", fontSize: 14 }}>
        {session?.user ? (
          <>
            <Link href="/dashboard" style={{ opacity: 0.9 }}>
              Dashboard
            </Link>
            <Link href="/historique" style={{ opacity: 0.9 }}>
              Historique
            </Link>
            {session.user.role === "ADMIN" && (
              <Link href="/admin" style={{ opacity: 0.9 }}>
                Admin
              </Link>
            )}
            <span style={{ opacity: 0.7 }}>{session.user.name}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "none",
                color: "#fff",
                padding: "7px 14px",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Déconnexion
            </button>
          </>
        ) : (
          <>
            <Link href="/login" style={{ opacity: 0.9 }}>
              Connexion
            </Link>
            <Link
              href="/register"
              style={{
                background: "rgba(255,255,255,0.15)",
                padding: "7px 14px",
                borderRadius: 8,
              }}
            >
              Créer un compte
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
