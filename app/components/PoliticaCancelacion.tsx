import { politicaCancelacion } from "@/app/lib/servicios";
import InfoIcon from "./InfoIcon";

// Caja llamativa con la política de cancelación (se usa en varias pantallas).
export default function PoliticaCancelacion({
  className = "",
}: {
  className?: string;
}) {
  const texto = politicaCancelacion.replace(/^Política de cancelación:\s*/, "");
  return (
    <div
      className={`rounded-2xl border border-wine/25 bg-beige/70 p-5 ${className}`}
    >
      <div className="flex items-center gap-2 font-display text-base font-bold text-wine">
        <InfoIcon className="h-5 w-5 shrink-0" />
        Política de cancelación
      </div>
      <p className="mt-2 text-sm text-ink">{texto}</p>
    </div>
  );
}
