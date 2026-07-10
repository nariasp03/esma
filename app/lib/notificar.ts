import { nombreDia } from "@/app/lib/disponibilidad";

// Aviso por WhatsApp al administrador cuando entra una reserva nueva, usando
// CallMeBot (gratis). Requiere dos variables de entorno:
//   CALLMEBOT_PHONE  → número que autorizó el bot (con lada, ej. 5214491863483)
//   CALLMEBOT_APIKEY → la API key que da CallMeBot al activarlo
// Si no están configuradas, simplemente no hace nada (no rompe la reserva).

type DatosAviso = {
  nombre: string;
  whatsapp: string;
  servicios: string;
  fecha_cita: string;
  hora_cita: string;
  anticipo: number;
};

export async function avisarNuevaReserva(d: DatosAviso): Promise<void> {
  const phone = (process.env.CALLMEBOT_PHONE || "").replace(/\D/g, "");
  const apikey = process.env.CALLMEBOT_APIKEY;
  if (!phone || !apikey) return; // sin configurar: no se envía nada

  const texto =
    `💅 Nueva reserva en esma\n` +
    `Cliente: ${d.nombre}\n` +
    `WhatsApp: ${d.whatsapp}\n` +
    `Servicio(s): ${d.servicios}\n` +
    `Día: ${nombreDia(d.fecha_cita)} ${d.fecha_cita}\n` +
    `Hora: ${d.hora_cita}\n` +
    `Anticipo: $${d.anticipo}\n` +
    `Revisa el panel para confirmar el pago.`;

  const url =
    `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}` +
    `&text=${encodeURIComponent(texto)}&apikey=${encodeURIComponent(apikey)}`;

  // Cortamos a los 8 segundos para no dejar colgada la petición si CallMeBot
  // tarda; cualquier error se ignora (el aviso no debe tumbar la reserva).
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
