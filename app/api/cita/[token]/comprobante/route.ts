import { NextResponse } from "next/server";
import { getReservaPorToken } from "@/app/lib/db";

// GET /api/cita/[token]/comprobante — devuelve la imagen del comprobante que
// la clienta subió, para que pueda verla en su cuenta.
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  const reserva = await getReservaPorToken(token);

  if (!reserva || !reserva.comprobante) {
    return NextResponse.json(
      { ok: false, error: "Sin comprobante." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, comprobante: reserva.comprobante });
}
