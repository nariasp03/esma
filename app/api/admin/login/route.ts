import { NextResponse } from "next/server";
import { passwordCorrecta, iniciarSesionAdmin } from "@/app/lib/adminAuth";

// POST /api/admin/login — { password }
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";

  if (!passwordCorrecta(password)) {
    return NextResponse.json(
      { ok: false, error: "Contraseña incorrecta." },
      { status: 401 },
    );
  }

  await iniciarSesionAdmin();
  return NextResponse.json({ ok: true });
}
