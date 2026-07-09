import Link from "next/link";
import { servicios, negocio } from "@/app/lib/servicios";

export default function Home() {
  // Unos cuantos servicios para mostrar en el inicio.
  const destacados = servicios.filter((s) =>
    ["Gelish", "Nivelación con rubber", "Extensión de uña acrílica (largo #1 o #2)"].includes(
      s.nombre,
    ),
  );

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

      {/* Servicios destacados */}
      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">
            Nuestros servicios
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            Algunos de nuestros favoritos. Consulta la lista completa con precios.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {destacados.map((s) => (
            <div
              key={s.nombre}
              className="rounded-2xl border border-line bg-beige/40 p-6 text-center"
            >
              <div className="text-3xl">💅</div>
              <h3 className="mt-4 font-display text-xl font-bold text-ink">
                {s.nombre}
              </h3>
              <p className="mt-1 text-sm text-muted">{s.duracion}</p>
              <p className="mt-3 font-display text-2xl font-bold text-wine">
                ${s.precio}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/servicios"
            className="rounded-full bg-wine px-8 py-3 font-semibold text-white transition-colors hover:bg-wine-light"
          >
            Ver todos los servicios
          </Link>
        </div>
      </section>

      {/* Info */}
      <section className="border-t border-line bg-beige">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 sm:grid-cols-3">
          <div>
            <h3 className="font-display text-lg font-bold text-wine">📍 Ubicación</h3>
            <p className="mt-2 text-sm text-ink">{negocio.direccion}</p>
            <p className="text-sm text-ink">{negocio.ciudad}</p>
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-wine">🗓️ Solo con cita</h3>
            <p className="mt-2 text-sm text-ink">
              Reserva en línea y aparta tu lugar con tu anticipo.
            </p>
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-wine">📸 Instagram</h3>
            <a
              href={negocio.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm text-ink hover:text-wine"
            >
              {negocio.instagramUser}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
