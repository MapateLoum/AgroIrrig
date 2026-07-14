"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <div
      style={{
        background: "linear-gradient(135deg,var(--color-indigo) 0%,var(--color-indigo-deep) 100%)",
        padding: "14px 20px",
        color: "#fff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 10,
      }}
    >
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 22 }}>🌱</span>
        <span className="font-display" style={{ fontWeight: 700, fontSize: 17 }}>AgroIrrig Sénégal</span>
      </Link>

      <div style={{ display: "flex", gap: 14, alignItems: "center", fontSize: 13, flexWrap: "wrap", rowGap: 8 }}>
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
            <span className="navbar-username" style={{ opacity: 0.7 }}>
              {session.user.name}
            </span>
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
                whiteSpace: "nowrap",
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

      <style>{`
        @media (max-width: 640px) {
          .navbar-username { display: none; }
        }
      `}</style>
    </div>
  );
}