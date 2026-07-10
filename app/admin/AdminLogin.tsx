"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.ok) throw new Error(data.error || "No se pudo entrar.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hubo un problema.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-6 py-20">
      <h1 className="font-display text-3xl font-bold text-wine">Panel de esma</h1>
      <p className="mt-2 text-sm text-muted">
        Área privada. Ingresa tu contraseña para administrar las citas.
      </p>

      <form onSubmit={entrar} className="mt-8 space-y-4">
        <div>
          <label className="text-sm font-medium text-ink">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className="mt-1 w-full rounded-xl border border-line px-4 py-3 text-ink outline-none focus:border-wine"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
            ⚠️ {error}
          </p>
        )}

        <button
          type="submit"
          disabled={cargando || !password}
          className="w-full rounded-full bg-wine px-6 py-3 font-semibold text-white transition-colors hover:bg-wine-light disabled:opacity-50"
        >
          {cargando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
