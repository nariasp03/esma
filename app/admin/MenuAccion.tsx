"use client";

import { useEffect, useRef, useState } from "react";
import ChevronIcon from "@/app/components/ChevronIcon";

export type OpcionAccion = {
  label: string;
  onClick: () => void;
  danger?: boolean;
};

// Menú desplegable "Acción" con las opciones que el admin puede hacer con una
// cita. Se cierra al elegir una opción o al hacer clic afuera.
export default function MenuAccion({
  opciones,
  disabled,
}: {
  opciones: OpcionAccion[];
  disabled?: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (opciones.length === 0) return null;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setAbierto((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full bg-wine px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-wine-light disabled:opacity-50"
      >
        Acción
        <ChevronIcon
          className={`h-4 w-4 transition-transform ${abierto ? "rotate-180" : ""}`}
        />
      </button>
      {abierto && (
        <div className="absolute right-0 z-20 mt-1 min-w-44 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-lg">
          {opciones.map((o, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setAbierto(false);
                o.onClick();
              }}
              className={`block w-full px-4 py-2 text-left text-sm hover:bg-beige ${
                o.danger ? "text-danger" : "text-ink"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
