"use client";

import { useEffect, useMemo, useState } from "react";
import Calendario from "@/app/reservar/Calendario";
import CalendarIcon from "@/app/components/CalendarIcon";
import ClockIcon from "@/app/components/ClockIcon";
import AlertIcon from "@/app/components/AlertIcon";
import { nombreDia, rangoFechas, formatearFecha } from "@/app/lib/disponibilidad";

type Datos = {
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

const colorEstado: Record<string, string> = {
  Pendiente: "bg-amber-100 text-amber-800",
  Aprobada: "bg-green-100 text-green-800",
  Cancelada: "bg-red-100 text-red-700",
  Completada: "bg-blue-100 text-blue-700",
};

export default function GestionCita({ reserva }: { reserva: Datos }) {
  const [estado, setEstado] = useState(reserva.estado);
  const [fecha, setFecha] = useState(reserva.fecha_cita);
  const [hora, setHora] = useState(reserva.hora_cita);
  const [modo, setModo] = useState<"ver" | "reagendar">("ver");

  const [nuevaFecha, setNuevaFecha] = useState("");
  const [nuevaHora, setNuevaHora] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [cargandoSlots, setCargandoSlots] = useState(false);

  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const { min, max } = useMemo(() => rangoFechas(), []);

  const hoyD = new Date();
  const hoyStr = `${hoyD.getFullYear()}-${String(hoyD.getMonth() + 1).padStart(2, "0")}-${String(hoyD.getDate()).padStart(2, "0")}`;
  const esPasada = fecha < hoyStr;

  useEffect(() => {
    if (!nuevaFecha) return;
    let cancelado = false;
    setCargandoSlots(true);
    fetch(
      `/api/disponibilidad?fecha=${nuevaFecha}&duracion=${reserva.duracion_min}&excluir=${reserva.id}`,
    )
      .then((r) => r.json())
      .then((d) => {
        if (!cancelado) setSlots(Array.isArray(d.slots) ? d.slots : []);
      })
      .catch(() => {
        if (!cancelado) setSlots([]);
      })
      .finally(() => {
        if (!cancelado) setCargandoSlots(false);
      });
    return () => {
      cancelado = true;
    };
  }, [nuevaFecha, reserva.duracion_min, reserva.id]);

  async function accion(cuerpo: object): Promise<boolean> {
    setError("");
    setProcesando(true);
    try {
      const r = await fetch(`/api/cita/${reserva.token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.ok) throw new Error(data.error || "No se pudo procesar.");
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hubo un problema.");
      return false;
    } finally {
      setProcesando(false);
    }
  }

  async function cancelar() {
    if (!confirm("¿Segura que quieres cancelar tu cita?")) return;
    if (await accion({ accion: "cancelar" })) {
      setEstado("Cancelada");
      // ¿Se canceló con al menos 24 horas de anticipación?
      const cita = new Date(`${fecha}T${hora}:00`);
      const horasFaltan = (cita.getTime() - Date.now()) / (1000 * 60 * 60);
      if (horasFaltan >= 24) {
        setMensaje(
          "Tu cita fue cancelada. Como la cancelaste con más de 24 horas de anticipación, se te reembolsará tu anticipo.",
        );
      } else {
        setMensaje(
          "Tu cita fue cancelada. Como fue con menos de 24 horas de anticipación, el anticipo no es reembolsable.",
        );
      }
    }
  }

  async function guardarReagenda() {
    if (!nuevaFecha || !nuevaHora) {
      setError("Elige la nueva fecha y hora.");
      return;
    }
    if (await accion({ accion: "reagendar", fecha: nuevaFecha, hora: nuevaHora })) {
      setFecha(nuevaFecha);
      setHora(nuevaHora);
      setModo("ver");
      setNuevaFecha("");
      setNuevaHora("");
      setMensaje("¡Tu cita fue reagendada!");
    }
  }

  return (
    <div className="space-y-6">
      {/* Detalle de la cita */}
      <div className="rounded-2xl border border-line bg-beige/50 p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="font-medium text-ink">{reserva.servicios}</div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
              colorEstado[estado] ?? "bg-line text-ink"
            }`}
          >
            {estado}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2 text-sm text-ink">
          <CalendarIcon className="h-4 w-4 shrink-0 text-wine" />
          <span>
            <strong>{nombreDia(fecha)}</strong> {formatearFecha(fecha)}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-sm text-ink">
          <ClockIcon className="h-4 w-4 shrink-0 text-wine" />
          <span>{hora}</span>
        </div>
        <div className="mt-2 text-sm text-muted">Anticipo: ${reserva.anticipo}</div>
      </div>

      {mensaje && (
        <p className="rounded-xl bg-green-50 p-4 text-sm text-green-800">
          {mensaje}
        </p>
      )}
      {error && (
        <p className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {estado === "Cancelada" ? (
        <p className="rounded-xl border border-line bg-white p-4 text-sm text-muted">
          Esta cita está cancelada. Si quieres agendar otra, con gusto te
          esperamos.
        </p>
      ) : esPasada ? (
        <p className="rounded-xl border border-line bg-white p-4 text-sm text-muted">
          Esta cita ya pasó. ¡Gracias por tu visita!
        </p>
      ) : modo === "ver" ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => setModo("reagendar")}
            className="flex-1 rounded-full bg-wine px-6 py-3 font-semibold text-white transition-colors hover:bg-wine-light"
          >
            Reagendar cita
          </button>
          <button
            type="button"
            disabled={procesando}
            onClick={cancelar}
            className="flex-1 rounded-full border border-line px-6 py-3 font-semibold text-ink transition-colors hover:bg-beige disabled:opacity-60"
          >
            Cancelar cita
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold text-wine">
            Elige la nueva fecha y hora
          </h2>
          <Calendario
            value={nuevaFecha}
            onChange={(v) => {
              setNuevaFecha(v);
              setNuevaHora("");
            }}
            minDate={min}
            maxDate={max}
            diasCerrados={[0]}
          />
          {nuevaFecha && (
            <div>
              {cargandoSlots ? (
                <p className="text-sm text-muted">Buscando horarios…</p>
              ) : slots.length === 0 ? (
                <p className="text-sm text-muted">
                  No hay horarios disponibles ese día. Prueba con otro.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {slots.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNuevaHora(s)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                        nuevaHora === s
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

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={procesando || !nuevaFecha || !nuevaHora}
              onClick={guardarReagenda}
              className="flex-1 rounded-full bg-wine px-6 py-3 font-semibold text-white transition-colors hover:bg-wine-light disabled:opacity-50"
            >
              {procesando ? "Guardando..." : "Guardar nueva fecha"}
            </button>
            <button
              type="button"
              onClick={() => {
                setModo("ver");
                setNuevaFecha("");
                setNuevaHora("");
                setError("");
              }}
              className="rounded-full border border-line px-6 py-3 font-semibold text-ink transition-colors hover:bg-beige"
            >
              Volver
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
