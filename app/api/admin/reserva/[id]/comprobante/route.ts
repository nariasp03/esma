import { NextResponse } from "next/server";
import { esAdmin } from "@/app/lib/adminAuth";
import { getComprobante } from "@/app/lib/db";

// GET /api/admin/reserva/[id]/comprobante — devuelve la imagen del comprobante.
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await esAdmin())) {
    return NextResponse.json({ ok: false, error: "No autorizada." }, { status: 401 });
  }

  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  const comprobante = Number.isFinite(id) ? await getComprobante(id) : null;

  if (!comprobante) {
    return NextResponse.json(
      { ok: false, error: "Sin comprobante." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, comprobante });
}
