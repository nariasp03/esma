"use client";

import { useState } from "react";

export const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const DIAS_SEMANA = ["D", "L", "M", "M", "J", "V", "S"];

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function soloFecha(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parse(str?: string): Date | null {
  if (!str) return null;
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

type Props = {
  value: string; // "YYYY-MM-DD" o ""
  onChange: (v: string) => void;
  minDate?: string;
  maxDate?: string;
  diasCerrados?: number[]; // días de la semana deshabilitados (0=Domingo)
};

export default function Calendario({
  value,
  onChange,
  minDate,
  maxDate,
  diasCerrados = [],
}: Props) {
  const min = parse(minDate);
  const max = parse(maxDate);
  const inicial = parse(value) ?? min ?? new Date();
  const [mes, setMes] = useState(
    new Date(inicial.getFullYear(), inicial.getMonth(), 1),
  );

  const anio = mes.getFullYear();
  const nMes = mes.getMonth();
  const diasEnMes = new Date(anio, nMes + 1, 0).getDate();
  const offset = new Date(anio, nMes, 1).getDay();

  const celdas: (Date | null)[] = [];
  for (let i = 0; i < offset; i++) celdas.push(null);
  for (let d = 1; d <= diasEnMes; d++) celdas.push(new Date(anio, nMes, d));

  function deshabilitado(d: Date): boolean {
    const f = soloFecha(d);
    if (min && f < soloFecha(min)) return true;
    if (max && f > soloFecha(max)) return true;
    if (diasCerrados.includes(f.getDay())) return true;
    return false;
  }

  const ultimoDiaMesAnterior = new Date(anio, nMes, 0);
  const primerDiaMesSiguiente = new Date(anio, nMes + 1, 1);
  const puedeAnterior = !min || ultimoDiaMesAnterior >= soloFecha(min);
  const puedeSiguiente = !max || primerDiaMesSiguiente <= soloFecha(max);

  const navCls =
    "grid h-8 w-8 place-items-center rounded-full text-wine transition-colors hover:bg-beige disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <div className="w-full max-w-xs rounded-2xl border border-line bg-white p-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Mes anterior"
          disabled={!puedeAnterior}
          onClick={() => setMes(new Date(anio, nMes - 1, 1))}
          className={navCls}
        >
          ‹
        </button>
        <span className="font-display font-bold text-ink">
          {MESES[nMes]} {anio}
        </span>
        <button
          type="button"
          aria-label="Mes siguiente"
          disabled={!puedeSiguiente}
          onClick={() => setMes(new Date(anio, nMes + 1, 1))}
          className={navCls}
        >
          ›
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted">
        {DIAS_SEMANA.map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {celdas.map((d, i) => {
          if (!d) return <div key={i} />;
          const dis = deshabilitado(d);
          const sel = value === ymd(d);
          return (
            <button
              key={i}
              type="button"
              disabled={dis}
              onClick={() => onChange(ymd(d))}
              className={`aspect-square rounded-full text-sm transition-colors ${
                sel
                  ? "bg-wine font-bold text-white"
                  : dis
                    ? "cursor-not-allowed text-muted/30"
                    : "text-ink hover:bg-beige"
              }`}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
