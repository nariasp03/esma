import { NextResponse } from "next/server";
import { reservasPorNombre } from "@/app/lib/db";

// GET /api/reservas/buscar?nombre=... — devuelve las citas próximas de esa clienta.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const nombre = (searchParams.get("nombre") || "").trim();

  if (nombre.length < 3) {
    return NextResponse.json({ citas: [] });
  }

  try {
    const citas = await reservasPorNombre(nombre);
    // Solo devolvemos lo necesario para gestionar la cita.
    return NextResponse.json({
      citas: citas.map((c) => ({
        token: c.token,
        id: c.id,
        nombre: c.nombre,
        servicios: c.servicios,
        fecha_cita: c.fecha_cita,
        hora_cita: c.hora_cita,
        duracion_min: c.duracion_min,
        anticipo: c.anticipo,
        estado: c.estado,
      })),
    });
  } catch {
    return NextResponse.json({ citas: [] }, { status: 500 });
  }
}
