import { NextResponse } from "next/server";
import { citasDelDia } from "@/app/lib/db";
import {
  avisarRecordatorioManana,
  avisarRecordatorioHoy,
} from "@/app/lib/notificar";
import { fechaMexico } from "@/app/lib/disponibilidad";

// GET /api/cron/recordatorio?tipo=hoy|manana&clave=SECRET
// Lo llama un cron (de noche con tipo=manana, en la mañana con tipo=hoy) y le
// manda al admin por WhatsApp las citas de ese día. Protegido con CRON_SECRET.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clave = searchParams.get("clave");
  const tipo = searchParams.get("tipo") === "manana" ? "manana" : "hoy";

  if (!process.env.CRON_SECRET || clave !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const fecha = fechaMexico(tipo === "manana" ? 1 : 0);
  const citas = await citasDelDia(fecha);
  if (tipo === "manana") {
    await avisarRecordatorioManana({ fecha, citas });
  } else {
    await avisarRecordatorioHoy({ fecha, citas });
  }

  return NextResponse.json({ ok: true, tipo, fecha, enviadas: citas.length });
}
