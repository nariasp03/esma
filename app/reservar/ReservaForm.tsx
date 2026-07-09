"use client";

import { useMemo, useState } from "react";
import { servicios, categorias } from "@/app/lib/servicios";
import {
  generarSlots,
  estaAbierto,
  nombreDia,
  rangoFechas,
} from "@/app/lib/disponibilidad";

function duracionTexto(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return [h > 0 ? `${h} h` : "", m > 0 ? `${m} min` : ""].filter(Boolean).join(" ");
}

export default function ReservaForm() {
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");

  const elegidos = servicios.filter((s) => seleccion.includes(s.nombre));
  const totalPrecio = elegidos.reduce((a, s) => a + s.precio, 0);
  const totalMin = elegidos.reduce((a, s) => a + s.duracionMin, 0);
  const anticipo = Math.round(totalPrecio / 2);

  const { min, max } = useMemo(() => rangoFechas(), []);
  const abierto = fecha ? estaAbierto(fecha) : true;

  const slots = useMemo(() => {
    if (!fecha || totalMin <= 0 || !estaAbierto(fecha)) return [];
    return generarSlots(fecha, totalMin);
  }, [fecha, totalMin]);

  function toggleServicio(nombre: string) {
    setHora("");
    setSeleccion((prev) =>
      prev.includes(nombre)
        ? prev.filter((n) => n !== nombre)
        : [...prev, nombre],
    );
  }

  const listo = elegidos.length > 0 && !!fecha && abierto && !!hora;

  return (
    <div className="mt-8 space-y-8">
      {/* Paso 1: Servicios */}
      <section>
        <h2 className="font-display text-xl font-bold text-wine">
          1. Elige tus servicios
        </h2>
        <p className="mt-1 text-sm text-muted">
          Puedes elegir varios (por ejemplo, retiro + gelish).
        </p>
        <div className="mt-4 space-y-5">
          {categorias.map((cat) => (
            <div key={cat}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                {cat}
              </h3>
              <div className="mt-2 space-y-2">
                {servicios
                  .filter((s) => s.categoria === cat)
                  .map((s) => {
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
            </div>
          ))}
        </div>
      </section>

      {/* Paso 2: Día */}
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

      {/* Paso 3: Hora */}
      {elegidos.length > 0 && fecha && abierto && (
        <section>
          <h2 className="font-display text-xl font-bold text-wine">
            3. Elige la hora
          </h2>
          {slots.length === 0 ? (
            <p className="mt-2 text-sm text-muted">
              No hay horarios disponibles ese día para los servicios elegidos
              (no alcanza el tiempo). Prueba con otro día o menos servicios.
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
            disabled={!listo}
            onClick={() =>
              alert(
                "¡Siguiente paso en construcción! Aquí pedirás tus datos y verás cómo pagar tu anticipo.",
              )
            }
            className="mt-5 w-full rounded-full bg-wine px-6 py-3 font-semibold text-white transition-colors hover:bg-wine-light disabled:opacity-50"
          >
            {listo ? "Continuar" : "Elige servicios, día y hora"}
          </button>
        </section>
      )}
    </div>
  );
}
