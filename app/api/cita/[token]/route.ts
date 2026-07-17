import { NextResponse } from "next/server";
import {
  getReservaPorToken,
  cancelarReserva,
  reagendarReserva,
  ocupadosDelDia,
} from "@/app/lib/db";
import { slotsDisponibles, estaAbierto } from "@/app/lib/disponibilidad";
import { avisarReagenda, avisarCancelacion } from "@/app/lib/notificar";

// PATCH /api/cita/[token] — { accion: "cancelar" } o { accion: "reagendar", fecha, hora }
export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  const reserva = await getReservaPorToken(token);

  if (!reserva) {
    return NextResponse.json(
      { ok: false, error: "No encontramos esta cita." },
      { status: 404 },
    );
  }
  if (reserva.estado === "Cancelada") {
    return NextResponse.json(
      { ok: false, error: "Esta cita ya está cancelada." },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const accion = body.accion;

  if (accion === "cancelar") {
    const motivo = typeof body.motivo === "string" ? body.motivo.trim() : "";
    await cancelarReserva(token, motivo || null);
    // Avisamos al admin por WhatsApp (si CallMeBot está configurado).
    await avisarCancelacion({
      nombre: reserva.nombre,
      servicios: reserva.servicios,
      fecha: reserva.fecha_cita,
      hora: reserva.hora_cita,
      motivo: motivo || null,
    });
    return NextResponse.json({ ok: true });
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
    // Revalidamos disponibilidad (ignorando la propia cita).
    const ocupados = await ocupadosDelDia(fecha, reserva.id);
    if (
      !slotsDisponibles(fecha, reserva.duracion_min, ocupados).includes(hora)
    ) {
      return NextResponse.json(
        { ok: false, error: "Ese horario ya no está disponible." },
        { status: 409 },
      );
    }
    const nota = typeof body.nota === "string" ? body.nota.trim() : "";
    await reagendarReserva(token, fecha, hora, nota || null);
    // Avisamos al administrador por WhatsApp (si CallMeBot está configurado).
    // La clienta no ve nada de esto.
    await avisarReagenda({
      nombre: reserva.nombre,
      servicios: reserva.servicios,
      fechaAnterior: reserva.fecha_cita,
      horaAnterior: reserva.hora_cita,
      fechaNueva: fecha,
      horaNueva: hora,
      nota: nota || null,
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json(
    { ok: false, error: "Acción no válida." },
    { status: 400 },
  );
}
