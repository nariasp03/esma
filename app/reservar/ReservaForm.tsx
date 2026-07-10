"use client";

import { useEffect, useMemo, useState } from "react";
import {
  servicios,
  categorias,
  pago,
  politicaCancelacion,
} from "@/app/lib/servicios";
import { estaAbierto, nombreDia, rangoFechas } from "@/app/lib/disponibilidad";

function duracionTexto(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return [h > 0 ? `${h} h` : "", m > 0 ? `${m} min` : ""].filter(Boolean).join(" ");
}

function archivoABase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ReservaForm() {
  // Paso 1: selección
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [abiertas, setAbiertas] = useState<string[]>([]); // categorías desplegadas
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [cargandoSlots, setCargandoSlots] = useState(false);

  // Paso 2: datos y pago
  const [paso, setPaso] = useState<1 | 2>(1);
  const [nombre, setNombre] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [primeraVez, setPrimeraVez] = useState(false);
  const [nacimiento, setNacimiento] = useState("");
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const elegidos = servicios.filter((s) => seleccion.includes(s.nombre));
  const totalPrecio = elegidos.reduce((a, s) => a + s.precio, 0);
  const totalMin = elegidos.reduce((a, s) => a + s.duracionMin, 0);
  const anticipo = Math.round(totalPrecio / 2);

  const { min, max } = useMemo(() => rangoFechas(), []);
  const abierto = fecha ? estaAbierto(fecha) : true;

  // Consultamos al servidor las horas disponibles (excluye citas ya ocupadas).
  useEffect(() => {
    if (!fecha || totalMin <= 0 || !estaAbierto(fecha)) {
      setSlots([]);
      return;
    }
    let cancelado = false;
    setCargandoSlots(true);
    fetch(`/api/disponibilidad?fecha=${fecha}&duracion=${totalMin}`)
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
  }, [fecha, totalMin]);

  function toggleServicio(nombre: string) {
    setHora("");
    setSeleccion((prev) =>
      prev.includes(nombre) ? prev.filter((n) => n !== nombre) : [...prev, nombre],
    );
  }

  function toggleCategoria(cat: string) {
    setAbiertas((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  }

  const listoSeleccion = elegidos.length > 0 && !!fecha && abierto && !!hora;

  async function confirmar() {
    setError("");
    if (!nombre.trim()) return setError("Escribe tu nombre.");
    if (whatsapp.replace(/\D/g, "").length !== 10)
      return setError("Escribe un WhatsApp válido de 10 dígitos.");
    if (primeraVez && !nacimiento)
      return setError("Escribe tu fecha de nacimiento.");
    if (!comprobante) return setError("Sube tu comprobante de transferencia.");

    setEnviando(true);
    try {
      const comprobanteData = await archivoABase64(comprobante);
      const r = await fetch("/api/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          whatsapp,
          primera_vez: primeraVez,
          fecha_nacimiento: primeraVez ? nacimiento : null,
          servicios: elegidos.map((s) => s.nombre).join(" + "),
          total: totalPrecio,
          anticipo,
          fecha_cita: fecha,
          hora_cita: hora,
          duracion_min: totalMin,
          comprobante: comprobanteData,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.ok) throw new Error(data.error || "No se pudo guardar.");
      setEnviado(true);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Hubo un problema. Intenta de nuevo.",
      );
    } finally {
      setEnviando(false);
    }
  }

  // ===== Pantalla de éxito =====
  if (enviado) {
    return (
      <div className="mt-8 rounded-2xl border border-line bg-beige/50 p-8 text-center">
        <div className="text-5xl">💖</div>
        <h2 className="mt-4 font-display text-2xl font-bold text-ink">
          ¡Reserva recibida!
        </h2>
        <p className="mt-2 text-muted">
          Gracias, {nombre.split(" ")[0]}. Recibimos tu solicitud para el{" "}
          <strong>
            {nombreDia(fecha)} {fecha}
          </strong>{" "}
          a las <strong>{hora}</strong>.
        </p>
        <p className="mt-3 text-sm text-muted">
          Revisaremos tu comprobante y te confirmaremos por WhatsApp. 💅
        </p>
        <p className="mt-4 rounded-xl border border-line bg-white p-4 text-xs text-muted">
          {politicaCancelacion}
        </p>
      </div>
    );
  }

  // ===== PASO 2: datos y pago =====
  if (paso === 2) {
    return (
      <div className="mt-8 space-y-6">
        <button
          type="button"
          onClick={() => setPaso(1)}
          className="text-sm text-wine hover:underline"
        >
          ← Editar servicios / fecha
        </button>

        <div className="rounded-2xl border border-line bg-beige/50 p-5 text-sm">
          <div className="font-medium text-ink">
            {elegidos.map((s) => s.nombre).join(" + ")}
          </div>
          <div className="mt-1 text-muted">
            📅 {nombreDia(fecha)} {fecha} · 🕒 {hora}
          </div>
          <div className="mt-2 font-display text-lg font-bold text-wine">
            Anticipo: ${anticipo}{" "}
            <span className="text-sm font-normal text-muted">
              (de ${totalPrecio} total)
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-wine"
            />
          </div>
          <div>
            <label className="text-sm font-medium">WhatsApp</label>
            <input
              type="tel"
              inputMode="numeric"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value.replace(/[^\d\s-]/g, ""))}
              placeholder="449 123 4567"
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-wine"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={primeraVez}
              onChange={(e) => setPrimeraVez(e.target.checked)}
              className="h-4 w-4 accent-wine"
            />
            Es mi primera vez en esma
          </label>
          {primeraVez && (
            <div>
              <label className="text-sm font-medium">Fecha de nacimiento</label>
              <input
                type="date"
                value={nacimiento}
                onChange={(e) => setNacimiento(e.target.value)}
                className="mt-1 rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-wine"
              />
            </div>
          )}
        </div>

        <div>
          <h3 className="font-display text-lg font-bold text-wine">
            Tu anticipo: ${anticipo}
          </h3>
          <p className="mt-1 text-sm text-muted">
            Aparta tu lugar con el 50% por transferencia.
          </p>
          <div className="mt-3 rounded-xl bg-beige/60 p-4 text-sm">
            <p className="text-ink">Haz tu transferencia a:</p>
            <p className="mt-2">
              <span className="text-muted">CLABE:</span>{" "}
              <strong>{pago.clabe}</strong>
            </p>
            <p>
              <span className="text-muted">Beneficiario:</span> {pago.beneficiario}
            </p>
            <p>
              <span className="text-muted">Banco:</span> {pago.banco}
            </p>
            <label className="mt-3 block text-sm font-medium">
              Sube tu comprobante:
            </label>
            <div className="mt-2 flex flex-wrap items-center gap-3">
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
        </div>

        <p className="rounded-xl border border-line bg-white p-4 text-xs text-muted">
          {politicaCancelacion}
        </p>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="button"
          onClick={confirmar}
          disabled={enviando}
          className="w-full rounded-full bg-wine px-6 py-3 font-semibold text-white transition-colors hover:bg-wine-light disabled:opacity-60"
        >
          {enviando ? "Enviando..." : "Confirmar reserva"}
        </button>
      </div>
    );
  }

  // ===== PASO 1: selección =====
  return (
    <div className="mt-8 space-y-8">
      {/* Servicios */}
      <section>
        <h2 className="font-display text-xl font-bold text-wine">
          1. Elige tus servicios
        </h2>
        <p className="mt-1 text-sm text-muted">
          Puedes elegir varios (por ejemplo, retiro + gelish).
        </p>
        <div className="mt-4 space-y-3">
          {categorias.map((cat) => {
            const abierta = abiertas.includes(cat);
            const items = servicios.filter((s) => s.categoria === cat);
            const nSel = items.filter((s) => seleccion.includes(s.nombre)).length;
            return (
              <div
                key={cat}
                className="overflow-hidden rounded-xl border border-line"
              >
                <button
                  type="button"
                  onClick={() => toggleCategoria(cat)}
                  className="flex w-full items-center justify-between gap-3 bg-white px-4 py-3 text-left transition-colors hover:bg-beige/40"
                >
                  <span className="font-display font-bold text-ink">
                    {cat}
                    {nSel > 0 && (
                      <span className="ml-2 text-xs font-medium text-wine">
                        ({nSel} elegido{nSel > 1 ? "s" : ""})
                      </span>
                    )}
                  </span>
                  <span className="text-wine">{abierta ? "▲" : "▼"}</span>
                </button>
                {abierta && (
                  <div className="space-y-2 border-t border-line p-3">
                    {items.map((s) => {
                      const activo = seleccion.includes(s.nombre);
                      return (
                        <label
                          key={s.nombre}
                          className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors ${
                            activo
                              ? "border-wine bg-beige/60"
                              : "border-line bg-white hover:border-wine/40"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={activo}
                              onChange={() => toggleServicio(s.nombre)}
                              className="h-4 w-4 accent-wine"
                            />
                            <div>
                              <div className="text-sm font-medium text-ink">
                                {s.nombre}
                              </div>
                              <div className="text-xs text-muted">{s.duracion}</div>
                            </div>
                          </div>
                          <div className="font-display font-bold text-wine">
                            ${s.precio}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Día */}
      {elegidos.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-bold text-wine">
            2. Elige el día
          </h2>
          <p className="mt-1 text-sm text-muted">
            Puedes reservar desde 1 semana y hasta 1 mes adelante. Cerrado los
            domingos.
          </p>
          <input
            type="date"
            value={fecha}
            min={min}
            max={max}
            onChange={(e) => {
              setFecha(e.target.value);
              setHora("");
            }}
            className="mt-3 rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-wine"
          />
          {fecha && !abierto && (
            <p className="mt-2 text-sm text-danger">
              El {nombreDia(fecha)} está cerrado. Por favor elige otro día.
            </p>
          )}
        </section>
      )}

      {/* Hora */}
      {elegidos.length > 0 && fecha && abierto && (
        <section>
          <h2 className="font-display text-xl font-bold text-wine">
            3. Elige la hora
          </h2>
          {cargandoSlots ? (
            <p className="mt-2 text-sm text-muted">Buscando horarios…</p>
          ) : slots.length === 0 ? (
            <p className="mt-2 text-sm text-muted">
              No hay horarios disponibles ese día para los servicios elegidos.
              Prueba con otro día o menos servicios.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {slots.map((s) => (
                <button
                  key={s}
                  type="button"
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
        </section>
      )}

      {/* Resumen */}
      {elegidos.length > 0 && (
        <section className="rounded-2xl border border-line bg-beige/50 p-6">
          <h2 className="font-display text-lg font-bold text-ink">Resumen</h2>
          <ul className="mt-3 space-y-1 text-sm text-ink">
            {elegidos.map((s) => (
              <li key={s.nombre} className="flex justify-between">
                <span>{s.nombre}</span>
                <span>${s.precio}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
            <div className="flex justify-between text-muted">
              <span>Duración total</span>
              <span>{duracionTexto(totalMin)}</span>
            </div>
            <div className="flex justify-between font-medium text-ink">
              <span>Total</span>
              <span>${totalPrecio}</span>
            </div>
            <div className="flex justify-between font-display text-lg font-bold text-wine">
              <span>Anticipo (50%)</span>
              <span>${anticipo}</span>
            </div>
          </div>
          {fecha && abierto && hora && (
            <p className="mt-3 text-sm text-ink">
              📅 {nombreDia(fecha)} {fecha} · 🕒 {hora}
            </p>
          )}

          <button
            type="button"
            disabled={!listoSeleccion}
            onClick={() => setPaso(2)}
            className="mt-5 w-full rounded-full bg-wine px-6 py-3 font-semibold text-white transition-colors hover:bg-wine-light disabled:opacity-50"
          >
            {listoSeleccion ? "Continuar" : "Elige servicios, día y hora"}
          </button>
        </section>
      )}
    </div>
  );
}
