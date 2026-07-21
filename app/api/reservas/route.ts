import { NextResponse } from "next/server";
import {
  insertarReserva,
  ocupadosDelDia,
  getClientePorId,
  yaUsoDescuentoCumple,
} from "@/app/lib/db";
import { slotsDisponibles, estaAbierto } from "@/app/lib/disponibilidad";
import { avisarNuevaReserva } from "@/app/lib/notificar";
import { DESCUENTO_CUMPLE } from "@/app/lib/servicios";

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

    // El total base (suma de servicios, antes de descuento) lo manda el cliente;
    // el descuento y el anticipo se calculan aquí (más seguro).
    const totalBase = Number(b.total) || 0;
    const clienteId = typeof b.cliente_id === "number" ? b.cliente_id : null;

    // Descuento de cumpleaños: 10% si la cita es en su mes de cumpleaños y no lo
    // ha usado ya ese mes.
    let descuento = 0;
    if (clienteId) {
      const cliente = await getClientePorId(clienteId);
      if (cliente?.fecha_nacimiento) {
        const mesCumple = Number(cliente.fecha_nacimiento.split("-")[1]);
        const [anioCita, mesCita] = fecha_cita.split("-").map(Number);
        if (mesCumple === mesCita) {
          const yaUso = await yaUsoDescuentoCumple(clienteId, mesCita, anioCita);
          if (!yaUso) descuento = Math.round((totalBase * DESCUENTO_CUMPLE) / 100);
        }
      }
    }
    const totalFinal = totalBase - descuento;
    const anticipo = Math.round(totalFinal / 2);

    const { id, token } = await insertarReserva({
      nombre,
      whatsapp,
      primera_vez: !!b.primera_vez,
      fecha_nacimiento: s(b.fecha_nacimiento) || null,
      servicios: s(b.servicios),
      total: totalFinal,
      anticipo,
      fecha_cita,
      hora_cita,
      duracion_min,
      comprobante: typeof b.comprobante === "string" ? b.comprobante : null,
      metodo_pago: "transferencia",
      cliente_id: clienteId,
      nota: s(b.nota) || null,
      descuento,
    });

    // Avisamos al administrador por WhatsApp (si CallMeBot está configurado).
    await avisarNuevaReserva({
      nombre,
      whatsapp,
      servicios: s(b.servicios),
      fecha_cita,
      hora_cita,
      anticipo,
      nota: s(b.nota) || null,
    });

    return NextResponse.json({ ok: true, id, token });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Error al guardar la reserva." },
      { status: 500 },
    );
  }
}
