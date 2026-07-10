import type { Metadata } from "next";
import { esAdmin } from "@/app/lib/adminAuth";
import { listarReservasAdmin } from "@/app/lib/db";
import AdminLogin from "./AdminLogin";
import AdminPanel from "./AdminPanel";

export const metadata: Metadata = {
  title: "Panel · esma",
  robots: { index: false, follow: false },
};

// El panel siempre lee datos frescos de la base de datos.
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await esAdmin())) {
    return <AdminLogin />;
  }
  const reservas = await listarReservasAdmin();
  return <AdminPanel reservasIniciales={reservas} />;
}
