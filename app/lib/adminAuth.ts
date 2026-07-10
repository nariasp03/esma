import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE = "esma_admin";

function secreto(): string {
  return process.env.SESSION_SECRET || "esma-dev-secret";
}

// Contraseña del panel. Se configura en la variable de entorno ADMIN_PASSWORD.
export function passwordAdmin(): string {
  return process.env.ADMIN_PASSWORD || "esma-admin";
}

// La cookie guarda una firma fija; sin el secreto no se puede falsificar.
function valorSesion(): string {
  return crypto.createHmac("sha256", secreto()).update("admin-ok").digest("hex");
}

export async function esAdmin(): Promise<boolean> {
  const store = await cookies();
  return store.get(COOKIE)?.value === valorSesion();
}

export function passwordCorrecta(intento: string): boolean {
  const esperada = passwordAdmin();
  // Comparación de tiempo constante para no filtrar la contraseña.
  const a = Buffer.from(intento);
  const b = Buffer.from(esperada);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function iniciarSesionAdmin(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, valorSesion(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 días
  });
}

export async function cerrarSesionAdmin(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}
