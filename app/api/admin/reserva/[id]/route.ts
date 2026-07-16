import { NextResponse } from "next/server";
import { esAdmin } from "@/app/lib/adminAuth";
import {
  getReservaPorId,
  actualizarEstadoReserva,
  reagendarReservaPorId,
  marcarReagendaVista,
  marcarCancelacionVista,
  ocupadosDelDia,
} from "@/app/lib/db";
import { slotsDisponibles, estaAbierto } from "@/app/lib/disponibilidad";

// PATCH /api/admin/reserva/[id]
// Acciones: aprobar | rechazar | completar | cancelar | reagendar | enterada
export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await esAdmin())) {
    return NextResponse.json(
      { ok: false, error: "No autorizada." },
      { status: 401 },
    );
  }

  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  const reserva = Number.isFinite(id) ? await getReservaPorId(id) : null;
  if (!reserva) {
    return NextResponse.json(
      { ok: false, error: "No encontramos esta cita." },
      { status: 404 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const accion = body.accion;

  if (accion === "aprobar") {
    await actualizarEstadoReserva(id, "Aprobada");
    return NextResponse.json({ ok: true, estado: "Aprobada" });
  }

  if (accion === "rechazar") {
    // Rechazar el comprobante: vuelve a Pendiente para que la clienta reintente.
    await actualizarEstadoReserva(id, "Pendiente");
    return NextResponse.json({ ok: true, estado: "Pendiente" });
  }

  if (accion === "completar") {
    await actualizarEstadoReserva(id, "Completada");
    return NextResponse.json({ ok: true, estado: "Completada" });
  }

  if (accion === "enterada") {
    await marcarReagendaVista(id);
    await marcarCancelacionVista(id);
    return NextResponse.json({
      ok: true,
      reagendada: false,
      cancelacion_nueva: false,
    });
  }

  if (accion === "cancelar") {
    await actualizarEstadoReserva(id, "Cancelada");
    return NextResponse.json({ ok: true, estado: "Cancelada" });
  }

  if (accion === "reagendar") {
    const fecha = typeof body.fecha === "string" ? body.fecha : "";
    const hora = typeof body.hora === "string" ? body.hora : "";
    if (!fecha || !hora || !estaAbierto(fecha)) {
      return NextResponse.json(
        { ok: false, error: "Fecha u hora no válida." },
        { status: 400 },
      );
    }
    const ocupados = await ocupadosDelDia(fecha, id);
    if (!slotsDisponibles(fecha, reserva.duracion_min, ocupados).includes(hora)) {
      return NextResponse.json(
        { ok: false, error: "Ese horario ya no está disponible." },
        { status: 409 },
      );
    }
    await reagendarReservaPorId(id, fecha, hora);
    return NextResponse.json({ ok: true, fecha, hora });
  }

  return NextResponse.json(
    { ok: false, error: "Acción no válida." },
    { status: 400 },
  );
}
