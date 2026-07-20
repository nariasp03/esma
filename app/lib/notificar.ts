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
  nota?: string | null;
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
    (d.nota ? `Nota: ${d.nota}\n` : ``) +
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
  nota?: string | null;
};

// Aviso de que una clienta reagendó su cita.
export async function avisarReagenda(d: DatosReagenda): Promise<void> {
  const texto =
    `📅 Reagenda en esma\n` +
    `La clienta ${d.nombre} cambió la fecha de su cita.\n` +
    `Servicio(s): ${d.servicios}\n` +
    `Antes: ${nombreDia(d.fechaAnterior)} ${formatearFecha(d.fechaAnterior)} ${d.horaAnterior}\n` +
    `Ahora: ${nombreDia(d.fechaNueva)} ${formatearFecha(d.fechaNueva)} ${d.horaNueva}` +
    (d.nota ? `\nNota: ${d.nota}` : ``);
  await enviarWhatsApp(texto);
}

// Aviso de que una clienta canceló su cita.
export async function avisarCancelacion(d: {
  nombre: string;
  servicios: string;
  fecha: string;
  hora: string;
  motivo?: string | null;
}): Promise<void> {
  const texto =
    `❌ Cancelación en esma\n` +
    `La clienta ${d.nombre} canceló su cita.\n` +
    `Servicio(s): ${d.servicios}\n` +
    `Era: ${nombreDia(d.fecha)} ${formatearFecha(d.fecha)} ${d.hora}` +
    (d.motivo ? `\nMotivo: ${d.motivo}` : ``);
  await enviarWhatsApp(texto);
}

type CitaDia = {
  nombre: string;
  servicios: string;
  hora_cita: string;
  whatsapp: string;
  token: string | null;
};

// Dirección base del sitio (para los links cortos del recordatorio).
function baseUrl(): string {
  return process.env.SITE_URL || "https://esmaags-production.up.railway.app";
}

// Link corto y limpio (a nuestro sitio) que redirige al chat de la clienta con
// el mensaje ya escrito. Se ve limpio en WhatsApp (no el churro de código).
function linkConfirmacion(c: CitaDia): string {
  return `${baseUrl()}/wa/${c.token ?? ""}`;
}

// Recordatorio de las citas de MAÑANA (día antes): UN solo mensaje. Por cada
// clienta, un link corto que abre su chat con el mensaje ya escrito (solo dar
// Enviar). Un solo mensaje evita que CallMeBot los agrupe.
export async function avisarRecordatorioManana(d: {
  fecha: string;
  citas: CitaDia[];
}): Promise<void> {
  if (d.citas.length === 0) return;
  const bloques = d.citas
    .map(
      (c, i) =>
        `${i + 1}) ${c.hora_cita} · ${c.nombre} (${c.servicios})\n` +
        linkConfirmacion(c),
    )
    .join("\n\n");
  const texto =
    `🌅 Recordatorio esma\n` +
    `MAÑANA (${nombreDia(d.fecha)} ${formatearFecha(d.fecha)}) tienes ${d.citas.length} cita(s). ` +
    `Toca el link de cada clienta: se abre su chat con el mensaje ya escrito, solo dale Enviar.\n\n` +
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
