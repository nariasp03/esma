"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ReservaAdmin } from "@/app/lib/db";
import Calendario from "@/app/reservar/Calendario";
import CalendarIcon from "@/app/components/CalendarIcon";
import ClockIcon from "@/app/components/ClockIcon";
import AlertIcon from "@/app/components/AlertIcon";
import CloseIcon from "@/app/components/CloseIcon";
import { nombreDia, rangoFechas, formatearFecha } from "@/app/lib/disponibilidad";

const colorEstado: Record<string, string> = {
  Pendiente: "bg-amber-100 text-amber-800",
  Aprobada: "bg-green-100 text-green-800",
  Cancelada: "bg-red-100 text-red-700",
  Completada: "bg-blue-100 text-blue-700",
};

const FILTROS = [
  "Citas de hoy",
  "Solicitudes",
  "Reagendadas",
  "Aprobada",
  "Completada",
  "Cancelada",
  "Todas",
] as const;
type Filtro = (typeof FILTROS)[number];

function hoyStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Arma el link de WhatsApp (México: 52 si son 10 dígitos).
function waLink(whatsapp: string): string {
  let n = whatsapp.replace(/\D/g, "");
  if (n.length === 10) n = "52" + n;
  return `https://wa.me/${n}`;
}

export default function AdminPanel({
  reservasIniciales,
}: {
  reservasIniciales: ReservaAdmin[];
}) {
  const router = useRouter();
  const [reservas, setReservas] = useState(reservasIniciales);
  const [filtro, setFiltro] = useState<Filtro>("Solicitudes");
  const [busqueda, setBusqueda] = useState("");
  const [comprobanteId, setComprobanteId] = useState<number | null>(null);
  const [reagendarId, setReagendarId] = useState<number | null>(null);

  const hoy = hoyStr();

  const conteos = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of reservas) c[r.estado] = (c[r.estado] ?? 0) + 1;
    return c;
  }, [reservas]);

  function contar(f: Filtro): number {
    if (f === "Todas") return reservas.length;
    if (f === "Citas de hoy")
      return reservas.filter(
        (r) => r.fecha_cita === hoy && r.estado !== "Cancelada",
      ).length;
    if (f === "Solicitudes") return conteos["Pendiente"] ?? 0;
    if (f === "Reagendadas") return reservas.filter((r) => r.reagendada).length;
    return conteos[f] ?? 0;
  }

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return reservas
      .filter((r) => {
        if (filtro === "Todas") return true;
        if (filtro === "Citas de hoy")
          return r.fecha_cita === hoy && r.estado !== "Cancelada";
        if (filtro === "Solicitudes") return r.estado === "Pendiente";
        if (filtro === "Reagendadas") return r.reagendada;
        return r.estado === filtro;
      })
      .filter((r) => (q ? r.nombre.toLowerCase().includes(q) : true))
      .sort((a, b) => {
        const aFut = a.fecha_cita >= hoy;
        const bFut = b.fecha_cita >= hoy;
        if (aFut && bFut)
          return (
            a.fecha_cita.localeCompare(b.fecha_cita) ||
            a.hora_cita.localeCompare(b.hora_cita)
          );
        if (!aFut && !bFut)
          return (
            b.fecha_cita.localeCompare(a.fecha_cita) ||
            b.hora_cita.localeCompare(a.hora_cita)
          );
        return aFut ? -1 : 1; // próximas primero
      });
  }, [reservas, filtro, busqueda, hoy]);

  function actualizarLocal(id: number, cambios: Partial<ReservaAdmin>) {
    setReservas((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...cambios } : r)),
    );
  }

  async function salir() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-wine">Citas</h1>
          <p className="text-sm text-muted">Panel de administración de esma</p>
        </div>
        <button
          onClick={salir}
          className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-beige"
        >
          Cerrar sesión
        </button>
      </div>

      {/* Filtros: menú desplegable en celular, botones en pantalla grande */}
      <div className="mt-6 sm:hidden">
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value as Filtro)}
          className="w-full rounded-xl border border-line bg-white px-4 py-3 text-ink outline-none focus:border-wine"
        >
          {FILTROS.map((f) => (
            <option key={f} value={f}>
              {f} ({contar(f)})
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 hidden flex-wrap gap-2 sm:flex">
        {FILTROS.map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filtro === f
                ? "bg-wine text-white"
                : "border border-line bg-white text-ink hover:bg-beige"
            }`}
          >
            {f} <span className="opacity-70">({contar(f)})</span>
          </button>
        ))}
      </div>

      {/* Búsqueda */}
      <input
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar por nombre…"
        className="mt-4 w-full rounded-xl border border-line px-4 py-3 text-ink outline-none focus:border-wine"
      />

      {/* Lista */}
      <div className="mt-6 space-y-4">
        {visibles.length === 0 ? (
          <p className="rounded-2xl border border-line bg-beige/40 p-6 text-center text-sm text-muted">
            No hay citas para mostrar.
          </p>
        ) : (
          visibles.map((r) => (
            <CitaCard
              key={r.id}
              r={r}
              hoy={hoy}
              onActualizar={actualizarLocal}
              onVerComprobante={() => setComprobanteId(r.id)}
              onReagendar={() => setReagendarId(r.id)}
            />
          ))
        )}
      </div>

      {comprobanteId !== null && (
        <ComprobanteModal
          id={comprobanteId}
          onClose={() => setComprobanteId(null)}
        />
      )}

      {reagendarId !== null && (
        <ReagendarModal
          reserva={reservas.find((r) => r.id === reagendarId)!}
          onClose={() => setReagendarId(null)}
          onDone={(fecha, hora) => {
            actualizarLocal(reagendarId, { fecha_cita: fecha, hora_cita: hora });
            setReagendarId(null);
          }}
        />
      )}
    </div>
  );
}

function CitaCard({
  r,
  hoy,
  onActualizar,
  onVerComprobante,
  onReagendar,
}: {
  r: ReservaAdmin;
  hoy: string;
  onActualizar: (id: number, cambios: Partial<ReservaAdmin>) => void;
  onVerComprobante: () => void;
  onReagendar: () => void;
}) {
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const esPasada = r.fecha_cita < hoy;
  const activa = r.estado !== "Cancelada" && r.estado !== "Completada";

  async function accion(cuerpo: object, cambios: Partial<ReservaAdmin>, confirmar?: string) {
    if (confirmar && !confirm(confirmar)) return;
    setError("");
    setProcesando(true);
    try {
      const res = await fetch(`/api/admin/reserva/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "No se pudo procesar.");
      onActualizar(r.id, cambios);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hubo un problema.");
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-bold text-ink">{r.nombre}</span>
            {r.primera_vez && (
              <span className="rounded-full bg-beige px-2 py-0.5 text-xs font-medium text-wine">
                1ª vez
              </span>
            )}
            {r.reagendada && (
              <span className="rounded-full bg-wine/10 px-2 py-0.5 text-xs font-medium text-wine">
                Reagendada
              </span>
            )}
          </div>
          <a
            href={waLink(r.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-wine hover:underline"
          >
            WhatsApp: {r.whatsapp}
          </a>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
            colorEstado[r.estado] ?? "bg-line text-ink"
          }`}
        >
          {r.estado}
        </span>
      </div>

      <div className="mt-3 text-sm text-ink">{r.servicios}</div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink">
        <span className="flex items-center gap-1.5">
          <CalendarIcon className="h-4 w-4 text-wine" />
          <strong>{nombreDia(r.fecha_cita)}</strong> {formatearFecha(r.fecha_cita)}
        </span>
        <span className="flex items-center gap-1.5">
          <ClockIcon className="h-4 w-4 text-wine" />
          {r.hora_cita}
        </span>
      </div>

      <div className="mt-2 text-sm text-muted">
        Total: ${r.total} · Anticipo: ${r.anticipo} ·{" "}
        {r.metodo_pago === "efectivo" ? "Efectivo" : "Transferencia"}
      </div>

      {error && (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {/* Acciones */}
      <div className="mt-4 flex flex-wrap gap-2">
        {r.tiene_comprobante && (
          <button
            onClick={onVerComprobante}
            className="rounded-full border border-wine/40 px-4 py-2 text-sm font-medium text-wine transition-colors hover:bg-wine hover:text-white"
          >
            Ver comprobante
          </button>
        )}

        {r.estado === "Pendiente" && (
          <>
            <button
              disabled={procesando}
              onClick={() => accion({ accion: "aprobar" }, { estado: "Aprobada" })}
              className="rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              Aprobar
            </button>
            <button
              disabled={procesando}
              onClick={() =>
                accion(
                  { accion: "efectivo" },
                  { estado: "Aprobada", metodo_pago: "efectivo" },
                )
              }
              className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-beige disabled:opacity-50"
            >
              Registrar efectivo
            </button>
          </>
        )}

        {r.estado === "Aprobada" && (
          <button
            disabled={procesando}
            onClick={() => accion({ accion: "completar" }, { estado: "Completada" })}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            Marcar completada
          </button>
        )}

        {activa && !esPasada && (
          <button
            disabled={procesando}
            onClick={onReagendar}
            className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-beige disabled:opacity-50"
          >
            Reagendar
          </button>
        )}

        {activa && (
          <button
            disabled={procesando}
            onClick={() =>
              accion(
                { accion: "cancelar" },
                { estado: "Cancelada" },
                "¿Cancelar esta cita?",
              )
            }
            className="rounded-full border border-danger/40 px-4 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger hover:text-white disabled:opacity-50"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}

function ComprobanteModal({ id, onClose }: { id: number; onClose: () => void }) {
  const [src, setSrc] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;
    fetch(`/api/admin/reserva/${id}/comprobante`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelado) return;
        if (d.ok && d.comprobante) setSrc(d.comprobante);
        else setError("No se pudo cargar el comprobante.");
      })
      .catch(() => !cancelado && setError("No se pudo cargar el comprobante."));
    return () => {
      cancelado = true;
    };
  }, [id]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-wine">Comprobante</h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg border border-line text-ink hover:bg-beige"
            aria-label="Cerrar"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4">
          {error ? (
            <p className="text-sm text-danger">{error}</p>
          ) : src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="Comprobante de pago" className="w-full rounded-xl" />
          ) : (
            <p className="text-sm text-muted">Cargando…</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ReagendarModal({
  reserva,
  onClose,
  onDone,
}: {
  reserva: ReservaAdmin;
  onClose: () => void;
  onDone: (fecha: string, hora: string) => void;
}) {
  const { min, max } = useMemo(() => rangoFechas(), []);
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [cargandoSlots, setCargandoSlots] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!fecha) return;
    let cancelado = false;
    setCargandoSlots(true);
    fetch(
      `/api/disponibilidad?fecha=${fecha}&duracion=${reserva.duracion_min}&excluir=${reserva.id}`,
    )
      .then((r) => r.json())
      .then((d) => !cancelado && setSlots(Array.isArray(d.slots) ? d.slots : []))
      .catch(() => !cancelado && setSlots([]))
      .finally(() => !cancelado && setCargandoSlots(false));
    return () => {
      cancelado = true;
    };
  }, [fecha, reserva.duracion_min, reserva.id]);

  async function guardar() {
    if (!fecha || !hora) {
      setError("Elige la nueva fecha y hora.");
      return;
    }
    setError("");
    setProcesando(true);
    try {
      const res = await fetch(`/api/admin/reserva/${reserva.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "reagendar", fecha, hora }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "No se pudo reagendar.");
      onDone(fecha, hora);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hubo un problema.");
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-5"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-wine">
            Reagendar cita de {reserva.nombre}
          </h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg border border-line text-ink hover:bg-beige"
            aria-label="Cerrar"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <Calendario
            value={fecha}
            onChange={(v) => {
              setFecha(v);
              setHora("");
            }}
            minDate={min}
            maxDate={max}
            diasCerrados={[0]}
          />

          {fecha && (
            <div>
              {cargandoSlots ? (
                <p className="text-sm text-muted">Buscando horarios…</p>
              ) : slots.length === 0 ? (
                <p className="text-sm text-muted">
                  No hay horarios disponibles ese día.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {slots.map((s) => (
                    <button
                      key={s}
                      onClick={() => setHora(s)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                        hora === s
                          ? "border-wine bg-wine text-white"
                          : "border-line bg-white text-ink hover:border-wine"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </p>
          )}

          <button
            disabled={procesando || !fecha || !hora}
            onClick={guardar}
            className="w-full rounded-full bg-wine px-6 py-3 font-semibold text-white transition-colors hover:bg-wine-light disabled:opacity-50"
          >
            {procesando ? "Guardando…" : "Guardar nueva fecha"}
          </button>
        </div>
      </div>
    </div>
  );
}
