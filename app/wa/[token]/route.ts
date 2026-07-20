import { NextResponse } from "next/server";
import { getReservaPorToken } from "@/app/lib/db";
import { nombreDia, formatearFecha } from "@/app/lib/disponibilidad";

// GET /wa/[token] — link corto y limpio para el recordatorio. Redirige al chat
// de WhatsApp de la clienta con el mensaje de confirmación ya escrito. Así el
// mensaje que le llega al admin muestra un link corto (no el churro de código).
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  const reserva = await getReservaPorToken(token);

  if (!reserva) {
    return NextResponse.redirect(
      new URL("/", "https://esmaags-production.up.railway.app"),
    );
  }

  const mensaje =
    `¡Hola ${reserva.nombre}! Te recordamos tu cita en esma el ` +
    `${nombreDia(reserva.fecha_cita)} ${formatearFecha(reserva.fecha_cita)} a las ` +
    `${reserva.hora_cita} (${reserva.servicios}). Por favor responde para ` +
    `confirmar tu asistencia; si no respondes, tomaremos tu cita como confirmada. ` +
    `Recuerda: si cancelas con menos de 24 horas de anticipación, el anticipo no ` +
    `es reembolsable. ¡Te esperamos con mucho gusto!`;

  let n = reserva.whatsapp.replace(/\D/g, "");
  if (n.length === 10) n = "52" + n; // México

  const url = `https://wa.me/${n}?text=${encodeURIComponent(mensaje)}`;
  return NextResponse.redirect(url);
}
