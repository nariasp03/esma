import { negocio } from "@/app/lib/servicios";
import InstagramIcon from "./InstagramIcon";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-white text-ink">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-3">
        <div>
          <div className="font-display text-2xl font-bold text-wine">esma</div>
          <p className="mt-2 text-sm text-muted">
            Estudio de uñas en {negocio.ciudad}. Calidad y detalle en cada servicio.
          </p>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-wide text-wine">
            Ubicación
          </h3>
          <p className="mt-3 text-sm text-ink">{negocio.direccion}</p>
          <p className="text-sm text-ink">{negocio.ciudad}</p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${negocio.direccion}, ${negocio.ciudad}`,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm font-medium text-wine hover:underline"
          >
            Ver en el mapa →
          </a>
          <p className="mt-2 text-sm text-muted">Sólo con cita en el local.</p>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-wide text-wine">
            Síguenos
          </h3>
          <a
            href={negocio.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-wine/30 px-4 py-2 text-sm font-medium text-wine transition-colors hover:bg-wine hover:text-white"
          >
            <InstagramIcon className="h-5 w-5" />
            {negocio.instagramUser}
          </a>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} esma · {negocio.ciudad}. Todos los derechos reservados.
      </div>
    </footer>
  );
}
