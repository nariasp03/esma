import type { Metadata } from "next";
import { sesionClienteId } from "@/app/lib/clienteAuth";
import { getClientePorId, reservasPorCliente } from "@/app/lib/db";
import AccesoCuenta from "./AccesoCuenta";
import PanelCliente from "./PanelCliente";

export const metadata: Metadata = {
  title: "Reservar cita · esma",
  description: "Reserva tu cita en esma y aparta tu lugar con tu anticipo.",
};

export const dynamic = "force-dynamic";

export default async function ReservarPage() {
  const id = await sesionClienteId();
  const cliente = id ? await getClientePorId(id) : null;

  if (!cliente) {
    return (
      <div className="mx-auto max-w-lg px-6 py-12 sm:py-16">
        <AccesoCuenta />
      </div>
    );
  }

  const reservas = (await reservasPorCliente(cliente.id)).map((r) => ({
    token: r.token ?? "",
    id: r.id,
    nombre: r.nombre,
    servicios: r.servicios,
    fecha_cita: r.fecha_cita,
    hora_cita: r.hora_cita,
    duracion_min: r.duracion_min,
    anticipo: r.anticipo,
    estado: r.estado,
  }));

  return (
    <div className="mx-auto max-w-lg px-6 py-12 sm:py-16">
      <PanelCliente
        nombre={cliente.nombre}
        fechaNacimiento={cliente.fecha_nacimiento}
        reservas={reservas}
      />
    </div>
  );
}
