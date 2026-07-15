import { NextResponse } from "next/server";
import { crearCliente, buscarClientePorTelefono } from "@/app/lib/db";
import { iniciarSesionCliente } from "@/app/lib/clienteAuth";

export async function POST(request: Request) {
  const b = await request.json().catch(() => ({}));
  const nombre = typeof b.nombre === "string" ? b.nombre.trim() : "";
  const telefono = typeof b.telefono === "string" ? b.telefono : "";
  const nacimiento =
    typeof b.fecha_nacimiento === "string" ? b.fecha_nacimiento : "";

  if (nombre.length < 3 || telefono.replace(/\D/g, "").length !== 10) {
    return NextResponse.json(
      {
        ok: false,
        error: "Escribe tu nombre completo y un WhatsApp de 10 dígitos.",
      },
      { status: 400 },
    );
  }
  if (!nacimiento) {
    return NextResponse.json(
      { ok: false, error: "Elige tu fecha de nacimiento." },
      { status: 400 },
    );
  }

  // El WhatsApp es la identidad de la cuenta: no puede repetirse.
  const existente = await buscarClientePorTelefono(telefono);
  if (existente) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Este número de WhatsApp ya está registrado. Si ya tienes cuenta, entra con "Ya tengo cuenta". Si no, usa otro número.',
      },
      { status: 409 },
    );
  }

  try {
    const cliente = await crearCliente(nombre, telefono, nacimiento);
    await iniciarSesionCliente(cliente.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "No se pudo crear tu cuenta." },
      { status: 500 },
    );
  }
}
