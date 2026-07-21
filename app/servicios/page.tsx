import type { Metadata } from "next";
import Link from "next/link";
import { servicios, categorias, type Servicio } from "@/app/lib/servicios";
import ClockIcon from "@/app/components/ClockIcon";
import ChevronIcon from "@/app/components/ChevronIcon";
import AlertIcon from "@/app/components/AlertIcon";

export const metadata: Metadata = {
  title: "Servicios y precios · esma",
  description:
    "Lista de servicios y precios de esma: gelish, nivelaciones, acrílicas y retiros.",
};

// Detalle de un servicio (o variante): nombre, duración, precio, reservar.
function FilaServicio({
  s,
  usarEtiqueta,
}: {
  s: Servicio;
  usarEtiqueta?: boolean;
}) {
  return (
    <div className="px-5 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="font-medium text-ink">
            {usarEtiqueta ? s.etiqueta : s.nombre}
            {s.nota ? (
              <span className="ml-2 text-xs text-muted">({s.nota})</span>
            ) : null}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted">
            <ClockIcon className="h-4 w-4 shrink-0 text-wine" />
            {s.duracion}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right text-base font-bold text-wine">
            {s.precioTexto ?? `$${s.precio}`}
          </div>
          <Link
            href={`/reservar?servicio=${encodeURIComponent(s.nombre)}`}
            className="rounded-full bg-wine px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-wine-light"
          >
            Reservar
          </Link>
        </div>
      </div>
      {s.aviso && (
        <p className="mt-2 flex items-start gap-2 rounded-lg bg-white px-3 py-2 text-xs text-ink">
          <AlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-wine" />
          <span>{s.aviso}</span>
        </p>
      )}
    </div>
  );
}

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
        // Armamos las entradas: servicios sueltos y grupos (ej. Gelish).
        const entradas: (
          | { tipo: "simple"; s: Servicio }
          | { tipo: "grupo"; grupo: string; items: Servicio[] }
        )[] = [];
        const gruposVistos = new Map<string, Servicio[]>();
        for (const s of items) {
          if (s.grupo) {
            if (!gruposVistos.has(s.grupo)) {
              const arr: Servicio[] = [];
              gruposVistos.set(s.grupo, arr);
              entradas.push({ tipo: "grupo", grupo: s.grupo, items: arr });
            }
            gruposVistos.get(s.grupo)!.push(s);
          } else {
            entradas.push({ tipo: "simple", s });
          }
        }

        return (
          <details
            key={cat}
            name="categoria-servicios"
            className="group mt-6 overflow-hidden rounded-2xl border border-line"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 bg-beige/60 px-5 py-4 font-display text-2xl font-bold text-wine transition-colors hover:bg-beige [&::-webkit-details-marker]:hidden">
              {cat}
              <ChevronIcon className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <div className="divide-y divide-line border-t border-line">
              {entradas.map((e) =>
                e.tipo === "simple" ? (
                  <FilaServicio key={e.s.nombre} s={e.s} />
                ) : (
                  <details
                    key={e.grupo}
                    name="grupo-servicios"
                    className="group/sub"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-medium text-ink transition-colors hover:bg-beige/40 [&::-webkit-details-marker]:hidden">
                      {e.grupo}
                      <ChevronIcon className="h-4 w-4 shrink-0 text-wine transition-transform group-open/sub:rotate-180" />
                    </summary>
                    <div className="divide-y divide-line border-t border-line bg-beige/30">
                      {e.items.map((s) => (
                        <FilaServicio key={s.nombre} s={s} usarEtiqueta />
                      ))}
                    </div>
                  </details>
                ),
              )}
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
