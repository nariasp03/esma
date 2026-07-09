import type { Metadata } from "next";
import ReservaForm from "./ReservaForm";

export const metadata: Metadata = {
  title: "Reservar cita · esma",
  description: "Reserva tu cita en esma y aparta tu lugar con tu anticipo.",
};

export default function ReservarPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
      <h1 className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
        Reserva tu cita
      </h1>
      <p className="mt-4 text-muted">
        Elige tus servicios, el día y la hora. Apartas tu lugar con el 50% de
        anticipo.
      </p>
      <ReservaForm />
    </div>
  );
}
