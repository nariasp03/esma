import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { sesionClienteId } from "@/app/lib/clienteAuth";
import { getClientePorId } from "@/app/lib/db";
import ReservaForm from "../ReservaForm";

export const metadata: Metadata = {
  title: "Nueva cita · esma",
};

export const dynamic = "force-dynamic";

export default async function NuevaCitaPage({
  searchParams,
}: {
  searchParams: Promise<{ servicio?: string }>;
}) {
  const { servicio } = await searchParams;
  const id = await sesionClienteId();
  const cliente = id ? await getClientePorId(id) : null;
  if (!cliente) redirect("/reservar");

  return (
    <div className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
      <Link href="/reservar" className="text-sm text-wine hover:underline">
        ← Volver a mi cuenta
      </Link>
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        Agendar nueva cita
      </h1>
      <ReservaForm
        cliente={{
          id: cliente.id,
          nombre: cliente.nombre,
          telefono: cliente.telefono,
          fecha_nacimiento: cliente.fecha_nacimiento,
        }}
        servicioInicial={servicio}
      />
    </div>
  );
}
