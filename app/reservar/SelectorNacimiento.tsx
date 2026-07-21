"use client";

import { useState } from "react";
import { MESES } from "./Calendario";

// Días que tiene un mes (considera años bisiestos para febrero).
function diasDelMes(mes: string, anio: string): number {
  if (!mes) return 31;
  const y = anio ? Number(anio) : 2024; // bisiesto por defecto para permitir 29 feb
  return new Date(y, Number(mes), 0).getDate();
}

// Selector de fecha de nacimiento con menús (día / mes / año).
export default function SelectorNacimiento({
  onChange,
  valorInicial,
}: {
  onChange: (v: string) => void;
  valorInicial?: string | null; // "YYYY-MM-DD" para pre-cargar (al editar)
}) {
  const [ai, mi, di] = valorInicial ? valorInicial.split("-") : ["", "", ""];
  const [dia, setDia] = useState(di || "");
  const [mes, setMes] = useState(mi || "");
  const [anio, setAnio] = useState(ai || "");
  const anioActual = new Date().getFullYear();
  const anios: number[] = [];
  for (let a = anioActual; a >= 1940; a--) anios.push(a);

  const maxDia = diasDelMes(mes, anio);

  function actualizar(nd: string, nm: string, na: string) {
    if (nd && Number(nd) > diasDelMes(nm, na)) nd = "";
    setDia(nd);
    setMes(nm);
    setAnio(na);
    onChange(nd && nm && na ? `${na}-${nm}-${nd}` : "");
  }

  const cls =
    "rounded-lg border border-line bg-white px-2 py-2 text-sm outline-none focus:border-wine";
  return (
    <div className="mt-1 flex flex-wrap gap-2">
      <select
        aria-label="Día"
        value={dia}
        onChange={(e) => actualizar(e.target.value, mes, anio)}
        className={cls}
      >
        <option value="">Día</option>
        {Array.from({ length: maxDia }, (_, i) =>
          String(i + 1).padStart(2, "0"),
        ).map((d) => (
          <option key={d} value={d}>
            {Number(d)}
          </option>
        ))}
      </select>
      <select
        aria-label="Mes"
        value={mes}
        onChange={(e) => actualizar(dia, e.target.value, anio)}
        className={cls}
      >
        <option value="">Mes</option>
        {MESES.map((mn, i) => (
          <option key={i} value={String(i + 1).padStart(2, "0")}>
            {mn}
          </option>
        ))}
      </select>
      <select
        aria-label="Año"
        value={anio}
        onChange={(e) => actualizar(dia, mes, e.target.value)}
        className={cls}
      >
        <option value="">Año</option>
        {anios.map((a) => (
          <option key={a} value={String(a)}>
            {a}
          </option>
        ))}
      </select>
    </div>
  );
}
