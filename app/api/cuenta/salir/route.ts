import { NextResponse } from "next/server";
import { cerrarSesionCliente } from "@/app/lib/clienteAuth";

export async function POST() {
  await cerrarSesionCliente();
  return NextResponse.json({ ok: true });
}
