import { NextResponse } from "next/server";
import { sesionClienteId } from "@/app/lib/clienteAuth";
import { getClientePorId, yaUsoDescuentoCumple } from "@/app/lib/db";
import { DESCUENTO_CUMPLE } from "@/app/lib/servicios";

// GET /api/cuenta/descuento?fecha=YYYY-MM-DD
// Dice si a la clienta (con sesión) le aplica el descuento de cumpleaños para
// una cita en esa fecha (mes de cumpleaños y no lo ha usado ya ese mes).
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const id = await sesionClienteId();
  if (!id) {
    return NextResponse.json({ ok: true, aplica: false });
  }
  const { searchParams } = new URL(request.url);
  const fecha = searchParams.get("fecha") || "";
  const partes = fecha.split("-").map(Number);
  if (partes.length !== 3) {
    return NextResponse.json({ ok: true, aplica: false });
  }
  const [anioCita, mesCita] = partes;

  const cliente = await getClientePorId(id);
  if (!cliente?.fecha_nacimiento) {
    return NextResponse.json({ ok: true, aplica: false });
  }
  const mesCumple = Number(cliente.fecha_nacimiento.split("-")[1]);
  if (mesCumple !== mesCita) {
    return NextResponse.json({ ok: true, aplica: false });
  }
  const yaUso = await yaUsoDescuentoCumple(id, mesCita, anioCita);
  return NextResponse.json({
    ok: true,
    aplica: !yaUso,
    porcentaje: DESCUENTO_CUMPLE,
  });
}
