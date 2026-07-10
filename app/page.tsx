import Link from "next/link";
import { negocio } from "@/app/lib/servicios";

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-wine-dark to-wine text-white">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center sm:py-32">
          <p className="text-sm uppercase tracking-[0.3em] text-beige-dark">
            Estudio de uñas · {negocio.ciudad}
          </p>
          <h1 className="mt-6 font-display text-6xl font-bold tracking-tight sm:text-7xl">
            esma
          </h1>
          <p className="mx-auto mt-6 max-w-md text-lg text-white/85">
            Manicure, acrílicas y nivelaciones con calidad y detalle. Reserva tu
            cita en línea y aparta tu lugar.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/reservar"
              className="rounded-full bg-white px-8 py-3 font-semibold text-wine transition-colors hover:bg-beige"
            >
              Reservar cita
            </Link>
            <Link
              href="/servicios"
              className="rounded-full border border-white/40 px-8 py-3 font-semibold text-white transition-colors hover:bg-white/10"
            >
              Ver servicios
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
