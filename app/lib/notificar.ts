import { nombreDia, formatearFecha } from "@/app/lib/disponibilidad";

// Avisos por WhatsApp al administrador usando CallMeBot (gratis). Requiere:
//   CALLMEBOT_PHONE  → número que autorizó el bot (con lada, ej. 5214491863483)
//   CALLMEBOT_APIKEY → la API key que da CallMeBot al activarlo
// Si no están configuradas, simplemente no hace nada (no rompe la operación).

// Envía un mensaje de WhatsApp. Nunca lanza error (los avisos no deben tumbar
// la reserva/reagenda). Corta a los 8s si CallMeBot tarda.
async function enviarWhatsApp(texto: string): Promise<void> {
  const phone = (process.env.CALLMEBOT_PHONE || "").replace(/\D/g, "");
  const apikey = process.env.CALLMEBOT_APIKEY;
  if (!phone || !apikey) return; // sin configurar: no se envía nada

  const url =
    `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}` +
    `&text=${encodeURIComponent(texto)}&apikey=${encodeURIComponent(apikey)}`;

  const controlador = new AbortController();
  const t = setTimeout(() => controlador.abort(), 8000);
  try {
    await fetch(url, { signal: controlador.signal });
  } catch {
    // Ignoramos fallos del aviso.
  } finally {
    clearTimeout(t);
  }
}

type DatosAviso = {
  nombre: string;
  whatsapp: string;
  servicios: string;
  fecha_cita: string;
  hora_cita: string;
  anticipo: number;
};

// Aviso de una reserva nueva.
export async function avisarNuevaReserva(d: DatosAviso): Promise<void> {
  const texto =
    `💅 Nueva reserva en esma\n` +
    `Cliente: ${d.nombre}\n` +
    `WhatsApp: ${d.whatsapp}\n` +
    `Servicio(s): ${d.servicios}\n` +
    `Día: ${nombreDia(d.fecha_cita)} ${formatearFecha(d.fecha_cita)}\n` +
    `Hora: ${d.hora_cita}\n` +
    `Anticipo: $${d.anticipo}\n` +
    `Revisa el panel para confirmar el pago.`;
  await enviarWhatsApp(texto);
}

type DatosReagenda = {
  nombre: string;
  servicios: string;
  fechaAnterior: string;
  horaAnterior: string;
  fechaNueva: string;
  horaNueva: string;
};

// Aviso de que una clienta reagendó su cita.
export async function avisarReagenda(d: DatosReagenda): Promise<void> {
  const texto =
    `📅 Reagenda en esma\n` +
    `La clienta ${d.nombre} cambió la fecha de su cita.\n` +
    `Servicio(s): ${d.servicios}\n` +
    `Antes: ${nombreDia(d.fechaAnterior)} ${formatearFecha(d.fechaAnterior)} ${d.horaAnterior}\n` +
    `Ahora: ${nombreDia(d.fechaNueva)} ${formatearFecha(d.fechaNueva)} ${d.horaNueva}`;
  await enviarWhatsApp(texto);
}

// Aviso de que una clienta canceló su cita.
export async function avisarCancelacion(d: {
  nombre: string;
  servicios: string;
  fecha: string;
  hora: string;
}): Promise<void> {
  const texto =
    `❌ Cancelación en esma\n` +
    `La clienta ${d.nombre} canceló su cita.\n` +
    `Servicio(s): ${d.servicios}\n` +
    `Era: ${nombreDia(d.fecha)} ${formatearFecha(d.fecha)} ${d.hora}`;
  await enviarWhatsApp(texto);
}

type CitaDia = {
  nombre: string;
  servicios: string;
  hora_cita: string;
  whatsapp: string;
};

// Mensaje de confirmación que la clienta recibe (ya escrito).
function mensajeConfirmacion(c: CitaDia, fecha: string): string {
  return (
    `¡Hola ${c.nombre}! 💅✨\n` +
    `Te recordamos tu cita en esma:\n` +
    `📅 ${nombreDia(fecha)} ${formatearFecha(fecha)}\n` +
    `🕐 ${c.hora_cita}\n` +
    `💅 ${c.servicios}\n\n` +
    `Por favor responde este mensaje para confirmar que sí asistirás. Si no nos respondes, daremos por hecho que tu cita sigue en pie.\n\n` +
    `Recuerda nuestra política de cancelación: si necesitas cancelar, avísanos con al menos 24 horas de anticipación y te reembolsamos tu anticipo. Con menos tiempo, el anticipo no es reembolsable.\n\n` +
    `¡Te esperamos con mucho gusto para consentirte! 💖`
  );
}

// Link de WhatsApp que abre el chat de la clienta con el mensaje ya escrito.
function linkConfirmacion(c: CitaDia, fecha: string): string {
  let n = c.whatsapp.replace(/\D/g, "");
  if (n.length === 10) n = "52" + n; // México
  return `https://wa.me/${n}?text=${encodeURIComponent(mensajeConfirmacion(c, fecha))}`;
}

// Recordatorio de las citas de MAÑANA (día antes, 9am). Un solo mensaje con un
// LINK por clienta: al tocarlo se abre su chat con el mensaje ya escrito, solo
// hay que darle Enviar.
export async function avisarRecordatorioManana(d: {
  fecha: string;
  citas: CitaDia[];
}): Promise<void> {
  if (d.citas.length === 0) return;
  const bloques = d.citas
    .map(
      (c) =>
        `• ${c.hora_cita} — ${c.nombre} (${c.servicios})\n${linkConfirmacion(c, d.fecha)}`,
    )
    .join("\n\n");
  const texto =
    `🌅 Recordatorio esma\n` +
    `MAÑANA (${nombreDia(d.fecha)} ${formatearFecha(d.fecha)}) tienes ${d.citas.length} cita(s). Toca el link de cada clienta para enviarle su confirmación (ya viene escrita, solo dale Enviar):\n\n` +
    bloques;
  await enviarWhatsApp(texto);
}

// Recordatorio de las citas de HOY (mismo día, 8am): solo el resumen.
export async function avisarRecordatorioHoy(d: {
  fecha: string;
  citas: CitaDia[];
}): Promise<void> {
  if (d.citas.length === 0) return;
  const lista = d.citas
    .map((c) => `• ${c.hora_cita} — ${c.nombre} (${c.servicios})`)
    .join("\n");
  const texto =
    `☀️ Recordatorio esma\n` +
    `HOY (${nombreDia(d.fecha)} ${formatearFecha(d.fecha)}) tienes ${d.citas.length} cita(s):\n` +
    lista;
  await enviarWhatsApp(texto);
}
