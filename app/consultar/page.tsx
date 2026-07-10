import type { Metadata } from "next";
import ConsultarCita from "./ConsultarCita";

export const metadata: Metadata = {
  title: "Consultar mi cita · esma",
  description: "Consulta, reagenda o cancela tu cita en esma.",
};

export default function ConsultarPage() {
  return (
    <div className="mx-auto max-w-lg px-6 py-12 sm:py-16">
      <ConsultarCita />
    </div>
  );
}
