import type { Metadata } from "next";
import ReservaForm from "./ReservaForm";

export const metadata: Metadata = {
  title: "Reservar cita · esma",
  description: "Reserva tu cita en esma y aparta tu lugar con tu anticipo.",
};

export default function ReservarPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
      <ReservaForm />
    </div>
  );
}
