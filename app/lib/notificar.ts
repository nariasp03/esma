import { nombreDia } from "@/app/lib/disponibilidad";

// Aviso por WhatsApp a la prima cuando entra una reserva nueva, usando
// Green API (https://green-api.com). Requiere estas variables de entorno:
//   GREENAPI_ID_INSTANCE → idInstance de tu instancia
//   GREENAPI_TOKEN       → apiTokenInstance de tu instancia
//   GREENAPI_DESTINO     → número que RECIBE el aviso, con lada (ej. 5214491863483)
//   GREENAPI_API_URL     → (opcional) host que da la consola; por defecto api.green-api.com
// Si faltan las claves, no se envía nada (la reserva se guarda igual).

type DatosAviso = {
  nombre: string;
  whatsapp: string;
  servicios: string;
  fecha_cita: string;
  hora_cita: string;
  anticipo: number;
};

export async function avisarNuevaReserva(d: DatosAviso): Promise<void> {
  const apiUrl = process.env.GREENAPI_API_URL || "https://api.green-api.com";
  const idInstance = process.env.GREENAPI_ID_INSTANCE;
  const token = process.env.GREENAPI_TOKEN;
  const destino = (process.env.GREENAPI_DESTINO || "").replace(/\D/g, "");
  if (!idInstance || !token || !destino) return; // sin configurar: no se envía

  const texto =
    `💅 Nueva reserva en esma\n` +
    `Cliente: ${d.nombre}\n` +
    `WhatsApp: ${d.whatsapp}\n` +
    `Servicio(s): ${d.servicios}\n` +
    `Día: ${nombreDia(d.fecha_cita)} ${d.fecha_cita}\n` +
    `Hora: ${d.hora_cita}\n` +
    `Anticipo: $${d.anticipo}\n` +
    `Revisa el panel para confirmar el pago.`;

  const url = `${apiUrl}/waInstance${idInstance}/sendMessage/${token}`;

  // Cortamos a los 8 segundos para no dejar colgada la petición; cualquier
  // error se ignora (el aviso no debe tumbar la reserva).
  const controlador = new AbortController();
  const t = setTimeout(() => controlador.abort(), 8000);
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId: `${destino}@c.us`, message: texto }),
      signal: controlador.signal,
    });
  } catch {
    // Ignoramos fallos del aviso.
  } finally {
    clearTimeout(t);
  }
}
