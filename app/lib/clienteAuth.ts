import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE = "esma_cliente";

function secreto(): string {
  return process.env.SESSION_SECRET || "esma-dev-secret";
}

// La cookie guarda "<id>.<firma>" para que no se pueda falsificar el id.
function firma(id: string): string {
  return crypto.createHmac("sha256", secreto()).update(id).digest("hex");
}

export async function sesionClienteId(): Promise<number | null> {
  const store = await cookies();
  const valor = store.get(COOKIE)?.value;
  if (!valor) return null;
  const [idStr, f] = valor.split(".");
  if (!idStr || !f || f !== firma(idStr)) return null;
  const id = Number(idStr);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export async function iniciarSesionCliente(id: number): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, `${id}.${firma(String(id))}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180, // 180 días
  });
}

export async function cerrarSesionCliente(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}
