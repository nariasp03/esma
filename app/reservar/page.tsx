import type { Metadata } from "next";
import Link from "next/link";
import { negocio } from "@/app/lib/servicios";

export const metadata: Metadata = {
  title: "Reservar cita · esma",
  description: "Reserva tu cita en esma.",
};

export default function ReservarPage() {
  return (
    <div className="mx-auto max-w-xl px-6 py-16 text-center sm:py-24">
      <div className="text-5xl">💅</div>
      <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-ink">
        Reservas en línea
      </h1>
      <p className="mt-4 text-muted">
        Estamos afinando el sistema de reservas en línea para que puedas apartar
        tu cita y tu anticipo desde aquí. <strong>¡Muy pronto disponible!</strong>
      </p>
      <p className="mt-4 text-muted">
        Por ahora, escríbenos por Instagram para agendar tu cita:
      </p>
      <a
        href={negocio.instagram}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-block rounded-full bg-wine px-8 py-3 font-semibold text-white transition-colors hover:bg-wine-light"
      >
        📸 Escríbenos por Instagram
      </a>
      <div className="mt-8">
        <Link href="/servicios" className="text-sm text-wine hover:underline">
          Ver servicios y precios
        </Link>
      </div>
    </div>
  );
}
