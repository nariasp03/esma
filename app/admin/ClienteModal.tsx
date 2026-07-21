"use client";

import { useEffect, useMemo, useState } from "react";
import { servicios, categorias } from "@/app/lib/servicios";
import {
  nombreDia,
  formatearFecha,
  rangoFechas,
} from "@/app/lib/disponibilidad";
import Calendario, { MESES } from "@/app/reservar/Calendario";
import CalendarIcon from "@/app/components/CalendarIcon";
import ClockIcon from "@/app/components/ClockIcon";
import CloseIcon from "@/app/components/CloseIcon";
import AlertIcon from "@/app/components/AlertIcon";
import PlusIcon from "@/app/components/PlusIcon";
import WhatsAppIcon from "@/app/components/WhatsAppIcon";

type Cliente = {
  id: number;
  nombre: string;
  telefono: string;
  fecha_nacimiento: string | null;
};

type Cita = {
  id: number;
  servicios: string;
  fecha_cita: string;
  hora_cita: string;
  duracion_min: number;
  anticipo: number;
  estado: string;
  reagendada: boolean;
  nota: string | null;
  motivo_cancelacion: string | null;
  nota_reagenda: string | null;
};

const colorEstado: Record<string, string> = {
  Pendiente: "bg-amber-100 text-amber-800",
  Aprobada: "bg-green-100 text-green-800",
  Cancelada: "bg-red-100 text-red-700",
  Completada: "bg-blue-100 text-blue-700",
};

function hoyStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function cumpleTexto(f: string | null): string {
  if (!f) return "—";
  const [, m, d] = f.split("-");
  return `${Number(d)} de ${MESES[Number(m) - 1]}`;
}

function waLink(tel: string): string {
  let n = tel.replace(/\D/g, "");
  if (n.length === 10) n = "52" + n;
  return `https://wa.me/${n}`;
}

function archivoABase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ClienteModal({
  clienteId,
  onClose,
  onCitaCreada,
}: {
  clienteId: number;
  onClose: () => void;
  onCitaCreada: () => void;
}) {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [agendando, setAgendando] = useState(false);
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [nombreEdit, setNombreEdit] = useState("");
  const [guardandoNombre, setGuardandoNombre] = useState(false);

  async function guardarNombre() {
    setGuardandoNombre(true);
    setError("");
    try {
      const r = await fetch(`/api/admin/cliente/${clienteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombreEdit }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) throw new Error(d.error || "No se pudo actualizar.");
      setCliente(d.cliente);
      setEditandoNombre(false);
      onCitaCreada(); // refresca el panel
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hubo un problema.");
    } finally {
      setGuardandoNombre(false);
    }
  }

  async function cargar() {
    setCargando(true);
    setError("");
    try {
      const r = await fetch(`/api/admin/cliente/${clienteId}`);
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) throw new Error(d.error || "No se pudo cargar.");
      setCliente(d.cliente);
      setCitas(d.citas);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hubo un problema.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  // Tras cancelar/reagendar una cita: recargar el perfil y refrescar el panel.
  function onCambio() {
    cargar();
    onCitaCreada();
  }

  const hoy = hoyStr();
  const proximas = citas
    .filter((c) => c.fecha_cita >= hoy && c.estado !== "Cancelada")
    .sort((a, b) => a.fecha_cita.localeCompare(b.fecha_cita));
  const pasadas = citas
    .filter((c) => c.fecha_cita < hoy && c.estado !== "Cancelada")
    .sort((a, b) => b.fecha_cita.localeCompare(a.fecha_cita));
  const canceladas = citas
    .filter((c) => c.estado === "Cancelada")
    .sort((a, b) => b.fecha_cita.localeCompare(a.fecha_cita));
  const nReagendadas = citas.filter((c) => c.reagendada).length;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-lg overflow-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl"
      >
        {/* Encabezado */}
        <div className="flex items-start justify-between gap-3">
          {editandoNombre ? (
            <div className="flex-1">
              <input
                value={nombreEdit}
                onChange={(e) => setNombreEdit(e.target.value)}
                autoFocus
                className="w-full rounded-lg border border-line px-3 py-2 text-ink outline-none focus:border-wine"
              />
              <div className="mt-2 flex gap-2">
                <button
                  disabled={guardandoNombre}
                  onClick={guardarNombre}
                  className="rounded-full bg-wine px-4 py-1.5 text-sm font-semibold text-white hover:bg-wine-light disabled:opacity-50"
                >
                  {guardandoNombre ? "Guardando…" : "Guardar"}
                </button>
                <button
                  onClick={() => setEditandoNombre(false)}
                  className="rounded-full border border-line px-4 py-1.5 text-sm font-medium text-ink hover:bg-beige"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl font-bold text-wine">
                {cliente ? cliente.nombre : "Clienta"}
              </h2>
              {cliente && (
                <button
                  onClick={() => {
                    setNombreEdit(cliente.nombre);
                    setEditandoNombre(true);
                  }}
                  className="text-xs font-medium text-wine underline hover:text-wine-light"
                >
                  Editar
                </button>
              )}
            </div>
          )}
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line text-ink hover:bg-beige"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {cargando ? (
          <p className="mt-6 text-sm text-muted">Cargando…</p>
        ) : error ? (
          <p className="mt-6 flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </p>
        ) : cliente ? (
          <>
            {/* Datos */}
            <div className="mt-3 space-y-1 text-sm text-ink">
              <div>
                <span className="text-muted">WhatsApp:</span> {cliente.telefono}
              </div>
              <div>
                <span className="text-muted">Cumpleaños:</span>{" "}
                {cumpleTexto(cliente.fecha_nacimiento)}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={waLink(cliente.telefono)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                <WhatsAppIcon className="h-4 w-4" />
                WhatsApp
              </a>
              <a
                href={`tel:${cliente.telefono}`}
                className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-beige"
              >
                Llamar
              </a>
            </div>

            {/* Resumen */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-beige/60 py-2">
                <div className="text-lg font-bold text-wine">
                  {proximas.length}
                </div>
                <div className="text-xs text-muted">Próximas</div>
              </div>
              <div className="rounded-xl bg-beige/60 py-2">
                <div className="text-lg font-bold text-wine">{nReagendadas}</div>
                <div className="text-xs text-muted">Reagendadas</div>
              </div>
              <div className="rounded-xl bg-beige/60 py-2">
                <div className="text-lg font-bold text-wine">
                  {canceladas.length}
                </div>
                <div className="text-xs text-muted">Canceladas</div>
              </div>
            </div>

            {/* Botón agendar */}
            {!agendando && (
              <button
                onClick={() => setAgendando(true)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-wine px-6 py-3 font-semibold text-white transition-colors hover:bg-wine-light"
              >
                <PlusIcon className="h-4 w-4" />
                Agendarle una cita
              </button>
            )}

            {agendando && (
              <AgendarManual
                clienteId={clienteId}
                onCancel={() => setAgendando(false)}
                onDone={() => {
                  setAgendando(false);
                  cargar();
                  onCitaCreada();
                }}
              />
            )}

            {/* Listas de citas */}
            <Seccion
              titulo="Próximas citas"
              citas={proximas}
              vacia="Sin próximas citas."
              hoy={hoy}
              onCambio={onCambio}
            />
            <Seccion
              titulo="Pasadas"
              citas={pasadas}
              vacia="Sin citas pasadas."
              hoy={hoy}
              onCambio={onCambio}
            />
            <Seccion
              titulo="Canceladas"
              citas={canceladas}
              vacia="Sin citas canceladas."
              hoy={hoy}
              onCambio={onCambio}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}

function Seccion({
  titulo,
  citas,
  vacia,
  hoy,
  onCambio,
}: {
  titulo: string;
  citas: Cita[];
  vacia: string;
  hoy: string;
  onCambio: () => void;
}) {
  return (
    <div className="mt-6">
      <h3 className="font-display text-base font-bold text-ink">{titulo}</h3>
      {citas.length === 0 ? (
        <p className="mt-2 text-sm text-muted">{vacia}</p>
      ) : (
        <div className="mt-2 space-y-3">
          {citas.map((c) => (
            <CitaRow key={c.id} c={c} hoy={hoy} onCambio={onCambio} />
          ))}
        </div>
      )}
    </div>
  );
}

// Una cita en el perfil, con acciones (reagendar / cancelar) para el admin.
function CitaRow({
  c,
  hoy,
  onCambio,
}: {
  c: Cita;
  hoy: string;
  onCambio: () => void;
}) {
  const [modo, setModo] = useState<"ver" | "reagendar">("ver");
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [nuevaHora, setNuevaHora] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [cargandoSlots, setCargandoSlots] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const { min, max } = useMemo(() => rangoFechas(), []);

  const esPasada = c.fecha_cita < hoy;
  const activa = c.estado !== "Cancelada" && c.estado !== "Completada";

  useEffect(() => {
    if (!nuevaFecha) return;
    let cancelado = false;
    setCargandoSlots(true);
    fetch(
      `/api/disponibilidad?fecha=${nuevaFecha}&duracion=${c.duracion_min}&excluir=${c.id}`,
    )
      .then((r) => r.json())
      .then((d) => !cancelado && setSlots(Array.isArray(d.slots) ? d.slots : []))
      .catch(() => !cancelado && setSlots([]))
      .finally(() => !cancelado && setCargandoSlots(false));
    return () => {
      cancelado = true;
    };
  }, [nuevaFecha, c.duracion_min, c.id]);

  async function accion(cuerpo: object, confirmar?: string) {
    if (confirmar && !confirm(confirmar)) return;
    setError("");
    setProcesando(true);
    try {
      const r = await fetch(`/api/admin/reserva/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) throw new Error(d.error || "No se pudo procesar.");
      onCambio();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hubo un problema.");
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="rounded-xl border border-line bg-white p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium text-ink">{c.servicios}</span>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
            colorEstado[c.estado] ?? "bg-line text-ink"
          }`}
        >
          {c.estado}
        </span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-ink">
        <span className="flex items-center gap-1.5">
          <CalendarIcon className="h-4 w-4 text-wine" />
          {nombreDia(c.fecha_cita)} {formatearFecha(c.fecha_cita)}
        </span>
        <span className="flex items-center gap-1.5">
          <ClockIcon className="h-4 w-4 text-wine" />
          {c.hora_cita}
        </span>
        {c.reagendada && (
          <span className="rounded-full bg-wine/10 px-2 py-0.5 text-xs font-medium text-wine">
            Reagendada
          </span>
        )}
      </div>
      {c.nota && <p className="mt-1 text-xs text-muted">Nota: {c.nota}</p>}
      {c.motivo_cancelacion && (
        <p className="mt-1 text-xs text-muted">Motivo: {c.motivo_cancelacion}</p>
      )}

      {error && (
        <p className="mt-2 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs font-medium text-danger">
          <AlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {activa && !esPasada && modo === "ver" && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            disabled={procesando}
            onClick={() => setModo("reagendar")}
            className="rounded-full bg-wine px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-wine-light disabled:opacity-50"
          >
            Reagendar
          </button>
          <button
            disabled={procesando}
            onClick={() =>
              accion({ accion: "cancelar" }, "¿Cancelar esta cita?")
            }
            className="rounded-full border border-danger/40 px-4 py-2 text-xs font-medium text-danger transition-colors hover:bg-danger hover:text-white disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      )}

      {modo === "reagendar" && (
        <div className="mt-3 space-y-3">
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
                  No hay horarios disponibles ese día.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {slots.map((s) => (
                    <button
                      key={s}
                      onClick={() => setNuevaHora(s)}
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                        nuevaHora === s
                          ? "border-wine bg-wine text-white"
                          : "border-line bg-white text-ink"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              disabled={procesando || !nuevaFecha || !nuevaHora}
              onClick={() =>
                accion({ accion: "reagendar", fecha: nuevaFecha, hora: nuevaHora })
              }
              className="rounded-full bg-wine px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-wine-light disabled:opacity-50"
            >
              {procesando ? "Guardando…" : "Guardar nueva fecha"}
            </button>
            <button
              onClick={() => {
                setModo("ver");
                setNuevaFecha("");
                setNuevaHora("");
                setError("");
              }}
              className="rounded-full border border-line px-4 py-2 text-xs font-medium text-ink hover:bg-beige"
            >
              Volver
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Formulario para que el admin agende una cita manualmente.
function AgendarManual({
  clienteId,
  onCancel,
  onDone,
}: {
  clienteId: number;
  onCancel: () => void;
  onDone: () => void;
}) {
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [abiertas, setAbiertas] = useState<string[]>([]);
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [nota, setNota] = useState("");
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [cargandoSlots, setCargandoSlots] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const elegidos = servicios.filter((s) => seleccion.includes(s.nombre));
  const total = elegidos.reduce((a, s) => a + s.precio, 0);
  const totalMin = elegidos.reduce((a, s) => a + s.duracionMin, 0);
  const { min, max } = useMemo(() => rangoFechas(), []);

  useEffect(() => {
    if (!fecha || totalMin <= 0) return;
    let cancelado = false;
    setCargandoSlots(true);
    fetch(`/api/disponibilidad?fecha=${fecha}&duracion=${totalMin}`)
      .then((r) => r.json())
      .then((d) => !cancelado && setSlots(Array.isArray(d.slots) ? d.slots : []))
      .catch(() => !cancelado && setSlots([]))
      .finally(() => !cancelado && setCargandoSlots(false));
    return () => {
      cancelado = true;
    };
  }, [fecha, totalMin]);

  function toggleServicio(nombre: string) {
    setHora("");
    setSeleccion((prev) =>
      prev.includes(nombre) ? prev.filter((n) => n !== nombre) : [...prev, nombre],
    );
  }

  async function guardar() {
    setError("");
    if (elegidos.length === 0 || !fecha || !hora) {
      setError("Elige servicios, día y hora.");
      return;
    }
    if (!comprobante) {
      setError("Sube el comprobante del anticipo.");
      return;
    }
    setEnviando(true);
    try {
      const comprobanteData = await archivoABase64(comprobante);
      const r = await fetch(`/api/admin/cliente/${clienteId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          servicios: elegidos.map((s) => s.nombre).join(" + "),
          total,
          fecha_cita: fecha,
          hora_cita: hora,
          duracion_min: totalMin,
          nota,
          comprobante: comprobanteData,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) throw new Error(d.error || "No se pudo agendar.");
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hubo un problema.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mt-4 space-y-4 rounded-2xl border border-line bg-beige/40 p-4">
      <h3 className="font-display text-lg font-bold text-wine">
        Nueva cita para la clienta
      </h3>

      {/* Servicios */}
      <div className="space-y-2">
        {categorias.map((cat) => {
          const abierta = abiertas.includes(cat);
          const items = servicios.filter((s) => s.categoria === cat);
          const nSel = items.filter((s) => seleccion.includes(s.nombre)).length;
          return (
            <div key={cat} className="overflow-hidden rounded-xl border border-line">
              <button
                type="button"
                onClick={() =>
                  setAbiertas((prev) => (prev.includes(cat) ? [] : [cat]))
                }
                className="flex w-full items-center justify-between gap-2 bg-white px-3 py-2 text-left text-sm"
              >
                <span className="font-medium text-ink">
                  {cat}
                  {nSel > 0 && (
                    <span className="ml-2 text-xs text-wine">({nSel})</span>
                  )}
                </span>
                <span className="text-wine">{abierta ? "▲" : "▼"}</span>
              </button>
              {abierta && (
                <div className="space-y-1 border-t border-line p-2">
                  {items.map((s) => {
                    const activo = seleccion.includes(s.nombre);
                    return (
                      <label
                        key={s.nombre}
                        className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${
                          activo
                            ? "border-wine bg-beige/60"
                            : "border-line bg-white"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={activo}
                            onChange={() => toggleServicio(s.nombre)}
                            className="h-4 w-4 accent-wine"
                          />
                          <span className="text-ink">{s.nombre}</span>
                        </span>
                        <span className="font-bold text-wine">${s.precio}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {elegidos.length > 0 && (
        <>
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
                      type="button"
                      onClick={() => setHora(s)}
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                        hora === s
                          ? "border-wine bg-wine text-white"
                          : "border-line bg-white text-ink"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-ink">
              Nota <span className="font-normal text-muted">(opcional)</span>
            </label>
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              rows={2}
              maxLength={300}
              className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-wine"
            />
          </div>

          <div className="text-sm text-muted">
            Total: ${total} · Anticipo: ${Math.round(total / 2)}
          </div>

          <div>
            <label className="text-sm font-medium text-ink">
              Comprobante del anticipo
            </label>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <label className="cursor-pointer rounded-full bg-wine px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-wine-light">
                Elegir archivo
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setComprobante(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
              </label>
              <span className="text-xs text-muted">
                {comprobante ? comprobante.name : "Ningún archivo seleccionado"}
              </span>
            </div>
          </div>
        </>
      )}

      {error && (
        <p className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={enviando || elegidos.length === 0 || !fecha || !hora}
          onClick={guardar}
          className="flex-1 rounded-full bg-wine px-6 py-3 font-semibold text-white transition-colors hover:bg-wine-light disabled:opacity-50"
        >
          {enviando ? "Agendando…" : "Agendar cita"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-line px-6 py-3 font-semibold text-ink hover:bg-beige"
        >
          Volver
        </button>
      </div>
    </div>
  );
}
