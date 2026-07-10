"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import GestionCita from "@/app/cita/[token]/GestionCita";
import { MESES } from "./Calendario";
import { politicaCancelacion } from "@/app/lib/servicios";
import PlusIcon from "@/app/components/PlusIcon";

type CitaResumen = {
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

type Props = {
  nombre: string;
  fechaNacimiento: string | null;
  reservas: CitaResumen[];
};

function cumpleTexto(f: string | null): string {
  if (!f) return "";
  const [, m, d] = f.split("-");
  return `${Number(d)} de ${MESES[Number(m) - 1]}`;
}

export default function PanelCliente({
  nombre,
  fechaNacimiento,
  reservas,
}: Props) {
  const router = useRouter();

  async function salir() {
    await fetch("/api/cuenta/salir", { method: "POST" });
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Hola, {nombre.split(" ")[0]}
          </h1>
          {fechaNacimiento && (
            <p className="mt-1 text-sm text-muted">
              Tu cumpleaños: {cumpleTexto(fechaNacimiento)}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={salir}
          className="rounded-full border border-line px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-beige"
        >
          Cerrar sesión
        </button>
      </div>

      <Link
        href="/reservar/nueva"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-wine px-6 py-3 font-semibold text-white transition-colors hover:bg-wine-light"
      >
        <PlusIcon className="h-4 w-4" />
        Agendar nueva cita
      </Link>

      <h2 className="mt-10 font-display text-xl font-bold text-ink">Mis citas</h2>
      {reservas.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-line bg-beige/50 p-6 text-center text-muted">
          Aún no tienes citas. ¡Agenda la primera!
        </p>
      ) : (
        <div className="mt-4 space-y-10">
          {reservas.map((c) => (
            <GestionCita key={c.id} reserva={c} />
          ))}
        </div>
      )}

      <p className="mt-8 rounded-xl border border-line bg-white p-4 text-xs text-muted">
        {politicaCancelacion}
      </p>
    </div>
  );
}
