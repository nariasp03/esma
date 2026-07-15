"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import GestionCita from "@/app/cita/[token]/GestionCita";
import { MESES } from "./Calendario";
import PlusIcon from "@/app/components/PlusIcon";
import CakeIcon from "@/app/components/CakeIcon";
import GiftIcon from "@/app/components/GiftIcon";
import PoliticaCancelacion from "@/app/components/PoliticaCancelacion";

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
  tiene_comprobante: boolean;
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

function hoyStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
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

  const hoy = hoyStr();
  // ¿Estamos en el mes de cumpleaños de la clienta?
  const esMesCumple =
    !!fechaNacimiento && fechaNacimiento.split("-")[1] === hoy.split("-")[1];
  // Grupo: 0 = próximas activas, 1 = pasadas activas, 2 = canceladas (al fondo).
  const grupo = (r: CitaResumen) =>
    r.estado === "Cancelada" ? 2 : r.fecha_cita >= hoy ? 0 : 1;
  const ordenadas = [...reservas].sort((a, b) => {
    const ga = grupo(a);
    const gb = grupo(b);
    if (ga !== gb) return ga - gb;
    // Próximas: por fecha ascendente. Pasadas/canceladas: más recientes primero.
    if (ga === 0)
      return (
        a.fecha_cita.localeCompare(b.fecha_cita) ||
        a.hora_cita.localeCompare(b.hora_cita)
      );
    return (
      b.fecha_cita.localeCompare(a.fecha_cita) ||
      b.hora_cita.localeCompare(a.hora_cita)
    );
  });
  const proxima =
    ordenadas.length > 0 && grupo(ordenadas[0]) === 0 ? ordenadas[0] : null;
  const restantes = proxima ? ordenadas.slice(1) : ordenadas;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Hola, {nombre.split(" ")[0]}
          </h1>
          {fechaNacimiento && (
            <p className="mt-2 flex items-center gap-2 text-base font-medium text-wine">
              <CakeIcon className="h-5 w-5 shrink-0" />
              Tu cumpleaños: {cumpleTexto(fechaNacimiento)}
            </p>
          )}
          {esMesCumple && (
            <p className="mt-2 flex items-center gap-2 rounded-lg bg-wine/10 px-3 py-2 text-sm font-semibold text-wine">
              ¡Feliz cumpleaños! Este mes es tuyo, ven a consentirte con
              nosotras.
              <GiftIcon className="h-4 w-4 shrink-0" />
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
        <>
          {proxima && (
            <div>
              <h3 className="mt-4 font-display text-lg font-bold text-wine">
                Próxima cita
              </h3>
              <div className="mt-3 space-y-10">
                <GestionCita reserva={proxima} />
              </div>
            </div>
          )}
          {restantes.length > 0 && (
            <div>
              {proxima && (
                <h3 className="mt-8 font-display text-lg font-bold text-ink">
                  Otras citas
                </h3>
              )}
              <div className={`${proxima ? "mt-3" : "mt-4"} space-y-10`}>
                {restantes.map((c) => (
                  <GestionCita key={c.id} reserva={c} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <PoliticaCancelacion className="mt-8" />
    </div>
  );
}
