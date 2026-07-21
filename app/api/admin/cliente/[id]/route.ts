import { NextResponse } from "next/server";
import { esAdmin } from "@/app/lib/adminAuth";
import {
  getClientePorId,
  reservasPorCliente,
  insertarReserva,
  ocupadosDelDia,
  actualizarDatosCliente,
} from "@/app/lib/db";
import { slotsDisponibles, estaAbierto } from "@/app/lib/disponibilidad";

// GET /api/admin/cliente/[id] — perfil de la clienta + todas sus citas.
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await esAdmin())) {
    return NextResponse.json({ ok: false, error: "No autorizada." }, { status: 401 });
  }
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  const cliente = Number.isFinite(id) ? await getClientePorId(id) : null;
  if (!cliente) {
    return NextResponse.json(
      { ok: false, error: "No encontramos esta clienta." },
      { status: 404 },
    );
  }
  const citas = await reservasPorCliente(id);
  return NextResponse.json({ ok: true, cliente, citas });
}

// POST /api/admin/cliente/[id] — el admin agenda una cita manualmente para la
// clienta. Queda directamente "Aprobada" (sin comprobante).
export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await esAdmin())) {
    return NextResponse.json({ ok: false, error: "No autorizada." }, { status: 401 });
  }
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  const cliente = Number.isFinite(id) ? await getClientePorId(id) : null;
  if (!cliente) {
    return NextResponse.json(
      { ok: false, error: "No encontramos esta clienta." },
      { status: 404 },
    );
  }

  const b = await request.json().catch(() => ({}));
  const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const servicios = s(b.servicios);
  const fecha_cita = s(b.fecha_cita);
  const hora_cita = s(b.hora_cita);
  const duracion_min = Number(b.duracion_min) || 0;
  const total = Number(b.total) || 0;
  const comprobante = typeof b.comprobante === "string" ? b.comprobante : null;

  if (!servicios || !fecha_cita || !hora_cita || !duracion_min) {
    return NextResponse.json(
      { ok: false, error: "Faltan datos de la cita." },
      { status: 400 },
    );
  }
  if (!comprobante) {
    return NextResponse.json(
      { ok: false, error: "Sube el comprobante del anticipo." },
      { status: 400 },
    );
  }
  if (!estaAbierto(fecha_cita)) {
    return NextResponse.json(
      { ok: false, error: "Ese día el salón está cerrado." },
      { status: 400 },
    );
  }
  // Revalidamos que el horario siga libre.
  const ocupados = await ocupadosDelDia(fecha_cita);
  if (!slotsDisponibles(fecha_cita, duracion_min, ocupados).includes(hora_cita)) {
    return NextResponse.json(
      { ok: false, error: "Ese horario ya no está disponible." },
      { status: 409 },
    );
  }

  const { id: reservaId } = await insertarReserva({
    nombre: cliente.nombre,
    whatsapp: cliente.telefono,
    primera_vez: false,
    fecha_nacimiento: cliente.fecha_nacimiento,
    servicios,
    total,
    anticipo: Math.round(total / 2),
    fecha_cita,
    hora_cita,
    duracion_min,
    comprobante,
    metodo_pago: "transferencia",
    cliente_id: cliente.id,
    nota: s(b.nota) || null,
    estado: "Aprobada",
  });

  return NextResponse.json({ ok: true, id: reservaId });
}

// PATCH /api/admin/cliente/[id] — el admin edita el nombre de la clienta.
export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await esAdmin())) {
    return NextResponse.json({ ok: false, error: "No autorizada." }, { status: 401 });
  }
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  const b = await request.json().catch(() => ({}));
  const nombre = typeof b.nombre === "string" ? b.nombre.trim() : "";
  const telefono = typeof b.telefono === "string" ? b.telefono.trim() : "";
  const fecha_nacimiento =
    typeof b.fecha_nacimiento === "string" && b.fecha_nacimiento
      ? b.fecha_nacimiento
      : null;

  if (!Number.isFinite(id)) {
    return NextResponse.json(
      { ok: false, error: "No se pudo actualizar." },
      { status: 400 },
    );
  }
  const res = await actualizarDatosCliente(id, nombre, telefono, fecha_nacimiento);
  if (!res.ok) {
    return NextResponse.json(
      { ok: false, error: res.error || "No se pudo actualizar." },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true, cliente: res.cliente });
}
