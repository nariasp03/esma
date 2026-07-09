import { NextResponse } from "next/server";
import { ocupadosDelDia } from "@/app/lib/db";
import { slotsDisponibles, estaAbierto } from "@/app/lib/disponibilidad";

// GET /api/disponibilidad?fecha=YYYY-MM-DD&duracion=NN
// Devuelve las horas disponibles ese día para una cita de esa duración.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fecha = searchParams.get("fecha") || "";
  const duracion = Number(searchParams.get("duracion") || 0);

  if (!fecha || !duracion || !estaAbierto(fecha)) {
    return NextResponse.json({ slots: [] });
  }

  try {
    const ocupados = await ocupadosDelDia(fecha);
    return NextResponse.json({ slots: slotsDisponibles(fecha, duracion, ocupados) });
  } catch {
    return NextResponse.json({ slots: [] }, { status: 500 });
  }
}
