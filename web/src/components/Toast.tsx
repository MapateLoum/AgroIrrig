"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";

type ToastKind = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ToastContextValue {
  showToast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const KIND_STYLES: Record<ToastKind, { bg: string; border: string }> = {
  success: { bg: "#eef4e7", border: "var(--color-olive)" },
  error: { bg: "#f7e9e5", border: "var(--color-clay)" },
  info: { bg: "#eef1f6", border: "var(--color-indigo)" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, kind: ToastKind = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          zIndex: 1000,
          maxWidth: 340,
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              background: KIND_STYLES[t.kind].bg,
              border: `1.5px solid ${KIND_STYLES[t.kind].border}`,
              borderRadius: 10,
              padding: "12px 16px",
              fontSize: 13,
              color: "var(--color-ink)",
              boxShadow: "0 4px 16px rgba(30,51,80,0.12)",
              animation: "toast-in 0.25s ease",
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast doit être utilisé à l'intérieur de <ToastProvider>");
  return ctx;
}
