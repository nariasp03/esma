import { NextResponse } from "next/server";
import { citasDelDia } from "@/app/lib/db";
import {
  avisarRecordatorioManana,
  avisarRecordatorioHoy,
} from "@/app/lib/notificar";
import { fechaMexico } from "@/app/lib/disponibilidad";

// GET /api/cron/recordatorio?clave=SECRET[&tipo=hoy|manana]
// Lo llama el cron a las 8am (sin tipo → manda AMBOS: las citas de hoy y las de
// mañana). tipo=hoy / tipo=manana sirve para probar uno solo. Protegido con
// CRON_SECRET.
export const dynamic = "force-dynamic";

async function mandarHoy(): Promise<number> {
  const fecha = fechaMexico(0);
  const citas = await citasDelDia(fecha);
  await avisarRecordatorioHoy({ fecha, citas });
  return citas.length;
}

async function mandarManana(): Promise<number> {
  const fecha = fechaMexico(1);
  const citas = await citasDelDia(fecha);
  await avisarRecordatorioManana({ fecha, citas });
  return citas.length;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clave = searchParams.get("clave");
  const tipo = searchParams.get("tipo");

  if (!process.env.CRON_SECRET || clave !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  if (tipo === "hoy") {
    return NextResponse.json({ ok: true, tipo, citas: await mandarHoy() });
  }
  if (tipo === "manana") {
    return NextResponse.json({ ok: true, tipo, citas: await mandarManana() });
  }

  // Sin tipo: ambos recordatorios (lo que hace el cron de las 8am).
  const hoy = await mandarHoy();
  const manana = await mandarManana();
  return NextResponse.json({ ok: true, tipo: "ambos", hoy, manana });
}
