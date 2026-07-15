"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SelectorNacimiento from "./SelectorNacimiento";
import AlertIcon from "@/app/components/AlertIcon";
import CakeIcon from "@/app/components/CakeIcon";

export default function AccesoCuenta() {
  const router = useRouter();
  const [modo, setModo] = useState<"entrar" | "crear">("entrar");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [nacimiento, setNacimiento] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const url = modo === "crear" ? "/api/cuenta/crear" : "/api/cuenta/entrar";
      const body =
        modo === "crear"
          ? { nombre, telefono, fecha_nacimiento: nacimiento }
          : { telefono };
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.ok) throw new Error(data.error || "No se pudo continuar.");
      router.refresh(); // recarga → ya con sesión → muestra el panel
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hubo un problema.");
    } finally {
      setCargando(false);
    }
  }

  const cls =
    "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-wine";

  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        Reserva tu cita
      </h1>
      <p className="mt-3 text-muted">
        Entra a tu cuenta o crea una para reservar y ver todas tus citas.
      </p>

      <div className="mt-6 flex rounded-full border border-line p-1">
        {(["entrar", "crear"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setModo(m);
              setError("");
            }}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              modo === m ? "bg-wine text-white" : "text-ink hover:bg-beige"
            }`}
          >
            {m === "entrar" ? "Ya tengo cuenta" : "Primera vez"}
          </button>
        ))}
      </div>

      <form onSubmit={enviar} className="mt-6 space-y-4">
        {modo === "crear" && (
          <div>
            <label className="text-sm font-medium">Nombre completo</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className={cls}
            />
          </div>
        )}
        <div>
          <label className="text-sm font-medium">WhatsApp</label>
          <input
            type="tel"
            inputMode="numeric"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value.replace(/[^\d\s-]/g, ""))}
            placeholder="449 123 4567"
            className={cls}
          />
        </div>
        {modo === "crear" && (
          <div>
            <label className="text-sm font-medium">Fecha de nacimiento</label>
            <SelectorNacimiento onChange={setNacimiento} />
            <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-beige/60 px-3 py-2 text-sm font-medium text-wine">
              <CakeIcon className="h-4 w-4 shrink-0" />
              ¡En el mes de tu cumpleaños tienes un descuento especial!
            </p>
          </div>
        )}

        {error && (
          <p className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </p>
        )}

        <button
          type="submit"
          disabled={cargando}
          className="w-full rounded-full bg-wine px-6 py-3 font-semibold text-white transition-colors hover:bg-wine-light disabled:opacity-60"
        >
          {cargando
            ? "Un momento..."
            : modo === "crear"
              ? "Crear cuenta y entrar"
              : "Entrar"}
        </button>
      </form>
    </div>
  );
}
