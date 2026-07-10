import { NextResponse } from "next/server";
import { buscarCliente } from "@/app/lib/db";
import { iniciarSesionCliente } from "@/app/lib/clienteAuth";

export async function POST(request: Request) {
  const b = await request.json().catch(() => ({}));
  const nombre = typeof b.nombre === "string" ? b.nombre.trim() : "";
  const telefono = typeof b.telefono === "string" ? b.telefono : "";

  if (!nombre || telefono.replace(/\D/g, "").length !== 10) {
    return NextResponse.json(
      { ok: false, error: "Escribe tu nombre completo y tu WhatsApp." },
      { status: 400 },
    );
  }

  const cliente = await buscarCliente(nombre, telefono);
  if (!cliente) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "No encontramos tu cuenta. Revisa tus datos o crea una cuenta nueva.",
      },
      { status: 404 },
    );
  }

  await iniciarSesionCliente(cliente.id);
  return NextResponse.json({ ok: true });
}
