"use client";

import { usePathname } from "next/navigation";
import { negocio } from "@/app/lib/servicios";
import InstagramIcon from "./InstagramIcon";

export default function Footer() {
  const pathname = usePathname();
  // En la página de reservas el footer va en tinto (vino); en el resto, blanco.
  const dark = pathname?.startsWith("/reservar") ?? false;

  return (
    <footer
      className={`mt-auto ${
        dark ? "bg-wine-dark text-white" : "border-t border-line bg-white text-ink"
      }`}
    >
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-3">
        <div>
          <div
            className={`font-display text-2xl font-bold ${dark ? "text-white" : "text-wine"}`}
          >
            esma
          </div>
          <p className={`mt-2 text-sm ${dark ? "text-white/75" : "text-muted"}`}>
            Estudio de uñas en {negocio.ciudad}. Calidad y detalle en cada servicio.
          </p>
        </div>

        <div>
          <h3
            className={`font-display text-sm font-bold uppercase tracking-wide ${
              dark ? "text-beige-dark" : "text-wine"
            }`}
          >
            Ubicación
          </h3>
          <p className={`mt-3 text-sm ${dark ? "text-white/80" : "text-ink"}`}>
            {negocio.direccion}
          </p>
          <p className={`text-sm ${dark ? "text-white/80" : "text-ink"}`}>
            {negocio.ciudad}
          </p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${negocio.direccion}, ${negocio.ciudad}`,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-2 inline-block text-sm font-medium hover:underline ${
              dark ? "text-beige-dark hover:text-white" : "text-wine"
            }`}
          >
            Ver en el mapa →
          </a>
          <p className={`mt-2 text-sm ${dark ? "text-white/80" : "text-ink"}`}>
            Tel:{" "}
            <a
              href={`tel:${negocio.telefono}`}
              className={`font-medium hover:underline ${
                dark ? "text-beige-dark hover:text-white" : "text-wine"
              }`}
            >
              {negocio.telefonoTexto}
            </a>
          </p>
          <p className={`mt-2 text-sm ${dark ? "text-white/70" : "text-muted"}`}>
            Solo con cita en el local.
          </p>
        </div>

        <div>
          <h3
            className={`font-display text-sm font-bold uppercase tracking-wide ${
              dark ? "text-beige-dark" : "text-wine"
            }`}
          >
            Síguenos
          </h3>
          <a
            href={negocio.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              dark
                ? "bg-white/10 text-white hover:bg-white/20"
                : "border border-wine/30 text-wine hover:bg-wine hover:text-white"
            }`}
          >
            <InstagramIcon className="h-5 w-5" />
            {negocio.instagramUser}
          </a>
        </div>
      </div>
      <div
        className={`border-t py-4 text-center text-xs ${
          dark ? "border-white/15 text-white/60" : "border-line text-muted"
        }`}
      >
        © {new Date().getFullYear()} esma · {negocio.ciudad}. Todos los derechos reservados.
      </div>
    </footer>
  );
}
