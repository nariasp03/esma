import { NextResponse } from "next/server";
import { insertarReserva, ocupadosDelDia } from "@/app/lib/db";
import { slotsDisponibles, estaAbierto } from "@/app/lib/disponibilidad";

// POST /api/reservas — guarda una reserva nueva (desde el formulario público).
export async function POST(request: Request) {
  try {
    const b = await request.json();
    const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");

    const nombre = s(b.nombre);
    const whatsapp = s(b.whatsapp);
    const fecha_cita = s(b.fecha_cita);
    const hora_cita = s(b.hora_cita);
    const duracion_min = Number(b.duracion_min) || 0;

    if (
      !nombre ||
      whatsapp.replace(/\D/g, "").length !== 10 ||
      !fecha_cita ||
      !hora_cita ||
      !duracion_min
    ) {
      return NextResponse.json(
        { ok: false, error: "Faltan datos o el WhatsApp no es válido." },
        { status: 400 },
      );
    }

    if (!estaAbierto(fecha_cita)) {
      return NextResponse.json(
        { ok: false, error: "Ese día el salón está cerrado." },
        { status: 400 },
      );
    }

    // Revalidamos que el horario siga libre (evita doble reservación).
    const ocupados = await ocupadosDelDia(fecha_cita);
    if (!slotsDisponibles(fecha_cita, duracion_min, ocupados).includes(hora_cita)) {
      return NextResponse.json(
        { ok: false, error: "Ese horario ya no está disponible. Elige otro." },
        { status: 409 },
      );
    }

    const id = await insertarReserva({
      nombre,
      whatsapp,
      primera_vez: !!b.primera_vez,
      fecha_nacimiento: s(b.fecha_nacimiento) || null,
      servicios: s(b.servicios),
      total: Number(b.total) || 0,
      anticipo: Number(b.anticipo) || 0,
      fecha_cita,
      hora_cita,
      duracion_min,
      comprobante: typeof b.comprobante === "string" ? b.comprobante : null,
      metodo_pago: "transferencia",
    });

    return NextResponse.json({ ok: true, id });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Error al guardar la reserva." },
      { status: 500 },
    );
  }
}
