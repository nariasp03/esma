"use client";

import { useState } from "react";
import GestionCita from "@/app/cita/[token]/GestionCita";

type Cita = {
  token: string;
  id: number;
  nombre: string;
  servicios: string;
  fecha_cita: string;
  hora_cita: string;
  duracion_min: number;
  anticipo: number;
  estado: string;
};

export default function ConsultarCita() {
  const [nombre, setNombre] = useState("");
  const [citas, setCitas] = useState<Cita[] | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function buscar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (nombre.trim().length < 3) {
      setError("Escribe tu nombre completo.");
      return;
    }
    setCargando(true);
    setCitas(null);
    try {
      const r = await fetch(
        `/api/reservas/buscar?nombre=${encodeURIComponent(nombre.trim())}`,
      );
      const d = await r.json();
      setCitas(Array.isArray(d.citas) ? d.citas : []);
    } catch {
      setError("Hubo un problema. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        Consultar mi cita
      </h1>
      <p className="mt-3 text-muted">
        Escribe tu nombre completo (tal como lo pusiste al reservar) para ver
        todas tus citas —pasadas y próximas— y reagendar o cancelar las próximas.
      </p>

      <form onSubmit={buscar} className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Tu nombre completo"
          className="flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-wine"
        />
        <button
          type="submit"
          disabled={cargando}
          className="rounded-full bg-wine px-6 py-2 font-semibold text-white transition-colors hover:bg-wine-light disabled:opacity-60"
        >
          {cargando ? "Buscando..." : "Consultar"}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      {citas !== null && citas.length === 0 && !cargando && (
        <p className="mt-8 rounded-2xl border border-line bg-beige/50 p-6 text-center text-muted">
          No encontramos citas próximas a ese nombre. Revisa que esté escrito
          igual que al reservar.
        </p>
      )}

      {citas && citas.length > 0 && (
        <div className="mt-8 space-y-10">
          {citas.map((c) => (
            <GestionCita key={c.token} reserva={c} />
          ))}
        </div>
      )}
    </div>
  );
}
