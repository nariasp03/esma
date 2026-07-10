import { NextResponse } from "next/server";
import { buscarClientePorTelefono } from "@/app/lib/db";
import { iniciarSesionCliente } from "@/app/lib/clienteAuth";

export async function POST(request: Request) {
  const b = await request.json().catch(() => ({}));
  const telefono = typeof b.telefono === "string" ? b.telefono : "";

  if (telefono.replace(/\D/g, "").length !== 10) {
    return NextResponse.json(
      { ok: false, error: "Escribe tu WhatsApp de 10 dígitos." },
      { status: 400 },
    );
  }

  const cliente = await buscarClientePorTelefono(telefono);
  if (!cliente) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "No encontramos una cuenta con ese teléfono. Crea una cuenta nueva.",
      },
      { status: 404 },
    );
  }

  await iniciarSesionCliente(cliente.id);
  return NextResponse.json({ ok: true });
}
