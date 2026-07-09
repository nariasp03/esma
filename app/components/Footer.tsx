import Link from "next/link";
import { negocio } from "@/app/lib/servicios";

export default function Footer() {
  return (
    <footer className="mt-auto bg-wine-dark text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-3">
        <div>
          <div className="font-display text-2xl font-bold">esma</div>
          <p className="mt-2 text-sm text-white/75">
            Estudio de uñas en {negocio.ciudad}. Calidad y detalle en cada servicio.
          </p>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-wide text-beige-dark">
            Ubicación
          </h3>
          <p className="mt-3 text-sm text-white/80">{negocio.direccion}</p>
          <p className="text-sm text-white/80">{negocio.ciudad}</p>
          <p className="mt-2 text-sm text-white/70">Solo con cita en el local.</p>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-wide text-beige-dark">
            Síguenos
          </h3>
          <a
            href={negocio.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm text-white/85 hover:text-white"
          >
            📸 Instagram {negocio.instagramUser}
          </a>
        </div>
      </div>
      <div className="border-t border-white/15 py-4 text-center text-xs text-white/60">
        © {new Date().getFullYear()} esma · {negocio.ciudad}. Todos los derechos reservados.
      </div>
    </footer>
  );
}
