import { NextResponse } from "next/server";
import { cerrarSesionAdmin } from "@/app/lib/adminAuth";

// POST /api/admin/logout
export async function POST() {
  await cerrarSesionAdmin();
  return NextResponse.json({ ok: true });
}
