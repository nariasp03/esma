import { Pool } from "pg";
import { randomUUID } from "crypto";

const globalForPg = globalThis as unknown as { pgPool?: Pool };

// Quitamos sslmode/channel_binding de la URL (evita un warning de pg); el SSL
// se activa explícitamente abajo, la conexión sigue cifrada.
function connectionStringLimpia(): string {
  const raw = process.env.DATABASE_URL || "";
  try {
    const u = new URL(raw);
    u.searchParams.delete("sslmode");
    u.searchParams.delete("channel_binding");
    return u.toString();
  } catch {
    return raw;
  }
}

export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: connectionStringLimpia(),
    ssl: { rejectUnauthorized: false },
  });

if (process.env.NODE_ENV !== "production") globalForPg.pgPool = pool;

export const ESTADOS = [
  "Pendiente",
  "Confirmada",
  "Cancelada",
  "Completada",
] as const;

export type Reserva = {
  id: number;
  creado_en: string;
  nombre: string;
  whatsapp: string;
  primera_vez: boolean;
  fecha_nacimiento: string | null;
  servicios: string;
  total: number;
  anticipo: number;
  fecha_cita: string;
  hora_cita: string;
  duracion_min: number;
  comprobante: string | null;
  metodo_pago: string;
  estado: string;
  confirmada_clienta: boolean;
  token: string | null;
};

let tablaLista = false;
async function ensureTable() {
  if (tablaLista) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reservas (
      id SERIAL PRIMARY KEY,
      creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
      nombre TEXT NOT NULL DEFAULT '',
      whatsapp TEXT NOT NULL DEFAULT '',
      primera_vez BOOLEAN NOT NULL DEFAULT false,
      fecha_nacimiento DATE,
      servicios TEXT NOT NULL DEFAULT '',
      total INTEGER NOT NULL DEFAULT 0,
      anticipo INTEGER NOT NULL DEFAULT 0,
      fecha_cita DATE NOT NULL,
      hora_cita TEXT NOT NULL DEFAULT '',
      duracion_min INTEGER NOT NULL DEFAULT 0,
      comprobante TEXT,
      metodo_pago TEXT NOT NULL DEFAULT 'transferencia',
      estado TEXT NOT NULL DEFAULT 'Pendiente',
      confirmada_clienta BOOLEAN NOT NULL DEFAULT false,
      token TEXT
    );
  `);
  // Para tablas ya existentes, añadimos el token si falta.
  await pool.query(`ALTER TABLE reservas ADD COLUMN IF NOT EXISTS token TEXT;`);
  await pool.query(
    `CREATE UNIQUE INDEX IF NOT EXISTS reservas_token_idx ON reservas(token);`,
  );
  tablaLista = true;
}

export type NuevaReserva = {
  nombre: string;
  whatsapp: string;
  primera_vez: boolean;
  fecha_nacimiento: string | null;
  servicios: string;
  total: number;
  anticipo: number;
  fecha_cita: string;
  hora_cita: string;
  duracion_min: number;
  comprobante: string | null;
  metodo_pago: string;
};

export async function insertarReserva(
  r: NuevaReserva,
): Promise<{ id: number; token: string }> {
  await ensureTable();
  const token = randomUUID();
  const res = await pool.query(
    `INSERT INTO reservas
       (nombre, whatsapp, primera_vez, fecha_nacimiento, servicios, total,
        anticipo, fecha_cita, hora_cita, duracion_min, comprobante, metodo_pago, token)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING id`,
    [
      r.nombre,
      r.whatsapp,
      r.primera_vez,
      r.fecha_nacimiento,
      r.servicios,
      r.total,
      r.anticipo,
      r.fecha_cita,
      r.hora_cita,
      r.duracion_min,
      r.comprobante,
      r.metodo_pago,
      token,
    ],
  );
  return { id: res.rows[0].id as number, token };
}

// Citas ocupadas de un día (rangos en minutos desde medianoche). Ignora las
// canceladas y, opcionalmente, una cita a excluir (útil al reagendar).
export async function ocupadosDelDia(
  fecha: string,
  excluirId = 0,
): Promise<{ inicio: number; fin: number }[]> {
  await ensureTable();
  const res = await pool.query<{ hora_cita: string; duracion_min: number }>(
    `SELECT hora_cita, duracion_min FROM reservas
     WHERE fecha_cita = $1 AND estado <> 'Cancelada' AND id <> $2`,
    [fecha, excluirId],
  );
  return res.rows.map((r) => {
    const [h, m] = r.hora_cita.split(":").map(Number);
    const inicio = h * 60 + m;
    return { inicio, fin: inicio + r.duracion_min };
  });
}

export async function getReservaPorToken(
  token: string,
): Promise<Reserva | null> {
  await ensureTable();
  const r = await pool.query<Reserva>(
    `SELECT id, creado_en, nombre, whatsapp, primera_vez,
            to_char(fecha_nacimiento, 'YYYY-MM-DD') AS fecha_nacimiento,
            servicios, total, anticipo,
            to_char(fecha_cita, 'YYYY-MM-DD') AS fecha_cita,
            hora_cita, duracion_min, comprobante, metodo_pago, estado,
            confirmada_clienta, token
     FROM reservas WHERE token = $1`,
    [token],
  );
  return r.rows[0] ?? null;
}

// Busca TODAS las citas de una clienta por su nombre completo (pasadas,
// próximas y canceladas), más recientes primero.
export async function reservasPorNombre(nombre: string): Promise<Reserva[]> {
  await ensureTable();
  const r = await pool.query<Reserva>(
    `SELECT id, creado_en, nombre, whatsapp, primera_vez,
            to_char(fecha_nacimiento, 'YYYY-MM-DD') AS fecha_nacimiento,
            servicios, total, anticipo,
            to_char(fecha_cita, 'YYYY-MM-DD') AS fecha_cita,
            hora_cita, duracion_min, NULL AS comprobante, metodo_pago, estado,
            confirmada_clienta, token
     FROM reservas
     WHERE lower(trim(nombre)) = lower(trim($1))
     ORDER BY fecha_cita DESC, hora_cita DESC`,
    [nombre],
  );
  return r.rows;
}

export async function cancelarReserva(token: string): Promise<boolean> {
  await ensureTable();
  const r = await pool.query(
    "UPDATE reservas SET estado = 'Cancelada' WHERE token = $1 RETURNING id",
    [token],
  );
  return (r.rowCount ?? 0) > 0;
}

export async function reagendarReserva(
  token: string,
  fecha: string,
  hora: string,
): Promise<boolean> {
  await ensureTable();
  const r = await pool.query(
    `UPDATE reservas SET fecha_cita = $1, hora_cita = $2
     WHERE token = $3 AND estado <> 'Cancelada' RETURNING id`,
    [fecha, hora, token],
  );
  return (r.rowCount ?? 0) > 0;
}

export async function listarReservas(): Promise<Reserva[]> {
  await ensureTable();
  const r = await pool.query<Reserva>(
    `SELECT id, creado_en, nombre, whatsapp, primera_vez,
            to_char(fecha_nacimiento, 'YYYY-MM-DD') AS fecha_nacimiento,
            servicios, total, anticipo,
            to_char(fecha_cita, 'YYYY-MM-DD') AS fecha_cita,
            hora_cita, duracion_min, comprobante, metodo_pago, estado,
            confirmada_clienta, token
     FROM reservas ORDER BY fecha_cita, hora_cita`,
  );
  return r.rows;
}
