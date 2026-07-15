import type { Metadata } from "next";
import Link from "next/link";
import { servicios, categorias } from "@/app/lib/servicios";
import ClockIcon from "@/app/components/ClockIcon";

export const metadata: Metadata = {
  title: "Servicios y precios · esma",
  description:
    "Lista de servicios y precios de esma: gelish, nivelaciones, acrílicas y retiros.",
};

export default function ServiciosPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
      <h1 className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
        Servicios y precios
      </h1>
      <p className="mt-4 max-w-2xl text-muted">
        Estos son nuestros servicios. Al reservar, apartas tu cita con un{" "}
        <strong className="text-wine">anticipo del 50%</strong> del servicio.
      </p>

      {categorias.map((cat) => {
        const items = servicios.filter((s) => s.categoria === cat);
        return (
          <details
            key={cat}
            className="group mt-6 overflow-hidden rounded-2xl border border-line"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 bg-beige/60 px-5 py-4 font-display text-2xl font-bold text-wine transition-colors hover:bg-beige [&::-webkit-details-marker]:hidden">
              {cat}
              <svg
                className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </summary>
            <div className="border-t border-line">
              {items.map((s, i) => (
                <div
                  key={s.nombre}
                  className={`flex items-center justify-between gap-4 px-5 py-4 ${
                    i % 2 === 0 ? "bg-white" : "bg-beige/40"
                  }`}
                >
                  <div>
                    <div className="font-medium text-ink">
                      {s.nombre}
                      {s.nota ? (
                        <span className="ml-2 text-xs text-muted">({s.nota})</span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted">
                      <ClockIcon className="h-4 w-4 shrink-0 text-wine" />
                      {s.duracion}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <div className="text-xl font-bold text-wine">
                      ${s.precio}
                    </div>
                    <Link
                      href={`/reservar?servicio=${encodeURIComponent(s.nombre)}`}
                      className="rounded-full bg-wine px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-wine-light"
                    >
                      Reservar
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </details>
        );
      })}

      <div className="mt-12 rounded-2xl bg-beige p-8 text-center">
        <h2 className="font-display text-2xl font-bold text-ink">
          ¿Lista para tu cita?
        </h2>
        <p className="mt-2 text-muted">
          Reserva en línea y aparta tu lugar. Puedes combinar varios servicios.
        </p>
        <Link
          href="/reservar"
          className="mt-6 inline-block rounded-full bg-wine px-8 py-3 font-semibold text-white transition-colors hover:bg-wine-light"
        >
          Reservar cita
        </Link>
      </div>
    </div>
  );
}
