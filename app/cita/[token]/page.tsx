import type { Metadata } from "next";
import Link from "next/link";
import { getReservaPorToken } from "@/app/lib/db";
import { politicaCancelacion } from "@/app/lib/servicios";
import GestionCita from "./GestionCita";

export const metadata: Metadata = {
  title: "Tu cita · esma",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CitaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const reserva = await getReservaPorToken(token);

  if (!reserva) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <div className="text-4xl">🔎</div>
        <h1 className="mt-4 font-display text-2xl font-bold text-ink">
          No encontramos esta cita
        </h1>
        <p className="mt-2 text-muted">
          Revisa que el enlace esté completo, o contáctanos.
        </p>
        <Link href="/" className="mt-6 inline-block text-sm text-wine hover:underline">
          Ir al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-12 sm:py-16">
      <h1 className="mb-6 font-display text-3xl font-bold text-ink sm:text-4xl">
        Tu cita en esma
      </h1>
      <GestionCita
        reserva={{
          token,
          id: reserva.id,
          nombre: reserva.nombre,
          servicios: reserva.servicios,
          fecha_cita: reserva.fecha_cita,
          hora_cita: reserva.hora_cita,
          duracion_min: reserva.duracion_min,
          anticipo: reserva.anticipo,
          estado: reserva.estado,
        }}
      />
      <p className="mt-8 rounded-xl border border-line bg-white p-4 text-xs text-muted">
        {politicaCancelacion}
      </p>
    </div>
  );
}
