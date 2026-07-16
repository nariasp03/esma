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
  "Aprobada",
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
  // Cuentas de clientas.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clientes (
      id SERIAL PRIMARY KEY,
      creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
      nombre TEXT NOT NULL DEFAULT '',
      telefono TEXT NOT NULL DEFAULT '',
      fecha_nacimiento DATE
    );
  `);
  await pool.query(
    `CREATE UNIQUE INDEX IF NOT EXISTS clientes_telefono_idx ON clientes(telefono);`,
  );
  await pool.query(
    `ALTER TABLE reservas ADD COLUMN IF NOT EXISTS cliente_id INTEGER;`,
  );
  // Renombramos el estado antiguo "Confirmada" a "Aprobada".
  await pool.query(
    `UPDATE reservas SET estado = 'Aprobada' WHERE estado = 'Confirmada';`,
  );
  // Marca si la clienta reagendó la cita (para la pestaña "Reagendadas").
  await pool.query(
    `ALTER TABLE reservas ADD COLUMN IF NOT EXISTS reagendada BOOLEAN NOT NULL DEFAULT false;`,
  );
  // Marca una cancelación nueva (hecha por la clienta) que el admin aún no ha
  // revisado (para la pestaña "Canceladas" y su marca de atención).
  await pool.query(
    `ALTER TABLE reservas ADD COLUMN IF NOT EXISTS cancelacion_nueva BOOLEAN NOT NULL DEFAULT false;`,
  );
  tablaLista = true;
}

export type Cliente = {
  id: number;
  nombre: string;
  telefono: string;
  fecha_nacimiento: string | null;
};

function soloDigitos(t: string): string {
  return t.replace(/\D/g, "");
}

// Pone la primera letra de cada palabra en mayúscula (ej. "maría lópez" →
// "María López"), para guardar el nombre bien escrito.
function capitalizarNombre(nombre: string): string {
  return nombre
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((p) => (p ? p.charAt(0).toUpperCase() + p.slice(1) : p))
    .join(" ");
}

// La identidad de la cuenta es el TELÉFONO (único). El nombre es solo para
// identificar a la clienta.
export async function buscarClientePorTelefono(
  telefono: string,
): Promise<Cliente | null> {
  await ensureTable();
  const r = await pool.query<Cliente>(
    `SELECT id, nombre, telefono,
            to_char(fecha_nacimiento, 'YYYY-MM-DD') AS fecha_nacimiento
     FROM clientes WHERE telefono = $1`,
    [soloDigitos(telefono)],
  );
  return r.rows[0] ?? null;
}

export async function crearCliente(
  nombre: string,
  telefono: string,
  fechaNacimiento: string | null,
): Promise<Cliente> {
  await ensureTable();
  const tel = soloDigitos(telefono);
  const existente = await buscarClientePorTelefono(tel);
  const nombreCap = capitalizarNombre(nombre);
  if (existente) {
    // Ya hay cuenta con ese teléfono: actualizamos nombre y cumpleaños.
    await pool.query(
      "UPDATE clientes SET nombre = $1, fecha_nacimiento = COALESCE($2, fecha_nacimiento) WHERE id = $3",
      [nombreCap, fechaNacimiento, existente.id],
    );
    return {
      ...existente,
      nombre: nombreCap,
      fecha_nacimiento: fechaNacimiento ?? existente.fecha_nacimiento,
    };
  }
  const r = await pool.query<Cliente>(
    `INSERT INTO clientes (nombre, telefono, fecha_nacimiento)
     VALUES ($1,$2,$3)
     RETURNING id, nombre, telefono,
               to_char(fecha_nacimiento, 'YYYY-MM-DD') AS fecha_nacimiento`,
    [nombreCap, tel, fechaNacimiento],
  );
  return r.rows[0];
}

export async function getClientePorId(id: number): Promise<Cliente | null> {
  await ensureTable();
  const r = await pool.query<Cliente>(
    `SELECT id, nombre, telefono,
            to_char(fecha_nacimiento, 'YYYY-MM-DD') AS fecha_nacimiento
     FROM clientes WHERE id = $1`,
    [id],
  );
  return r.rows[0] ?? null;
}

export async function reservasPorCliente(
  clienteId: number,
): Promise<(Reserva & { tiene_comprobante: boolean })[]> {
  await ensureTable();
  const r = await pool.query<Reserva & { tiene_comprobante: boolean }>(
    `SELECT id, creado_en, nombre, whatsapp, primera_vez,
            to_char(fecha_nacimiento, 'YYYY-MM-DD') AS fecha_nacimiento,
            servicios, total, anticipo,
            to_char(fecha_cita, 'YYYY-MM-DD') AS fecha_cita,
            hora_cita, duracion_min, NULL AS comprobante, metodo_pago, estado,
            confirmada_clienta, token,
            (comprobante IS NOT NULL AND comprobante <> '') AS tiene_comprobante
     FROM reservas WHERE cliente_id = $1
     ORDER BY fecha_cita DESC, hora_cita DESC`,
    [clienteId],
  );
  return r.rows;
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
  cliente_id: number | null;
};

export async function insertarReserva(
  r: NuevaReserva,
): Promise<{ id: number; token: string }> {
  await ensureTable();
  const token = randomUUID();
  const res = await pool.query(
    `INSERT INTO reservas
       (nombre, whatsapp, primera_vez, fecha_nacimiento, servicios, total,
        anticipo, fecha_cita, hora_cita, duracion_min, comprobante, metodo_pago,
        token, cliente_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
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
      r.cliente_id,
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
  // La cancela la clienta: la marcamos como cancelación nueva para que el admin
  // la revise en la pestaña "Canceladas".
  const r = await pool.query(
    "UPDATE reservas SET estado = 'Cancelada', cancelacion_nueva = true WHERE token = $1 RETURNING id",
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
    `UPDATE reservas SET fecha_cita = $1, hora_cita = $2, reagendada = true
     WHERE token = $3 AND estado <> 'Cancelada' RETURNING id`,
    [fecha, hora, token],
  );
  return (r.rowCount ?? 0) > 0;
}

// Citas de un día (no canceladas), ordenadas por hora. Para los recordatorios.
export async function citasDelDia(fecha: string): Promise<
  {
    nombre: string;
    servicios: string;
    hora_cita: string;
    whatsapp: string;
  }[]
> {
  await ensureTable();
  const r = await pool.query<{
    nombre: string;
    servicios: string;
    hora_cita: string;
    whatsapp: string;
  }>(
    `SELECT nombre, servicios, hora_cita, whatsapp FROM reservas
     WHERE fecha_cita = $1 AND estado <> 'Cancelada'
     ORDER BY hora_cita`,
    [fecha],
  );
  return r.rows;
}

// ----- Funciones para el panel de administración -----

// Como el comprobante es una imagen grande (base64), NO lo mandamos en la
// lista; solo indicamos si existe. Se pide aparte al abrirlo.
export type ReservaAdmin = Omit<Reserva, "comprobante"> & {
  tiene_comprobante: boolean;
  reagendada: boolean;
  cancelacion_nueva: boolean;
};

export async function listarReservasAdmin(): Promise<ReservaAdmin[]> {
  await ensureTable();
  const r = await pool.query<ReservaAdmin>(
    `SELECT id, creado_en, nombre, whatsapp, primera_vez,
            to_char(fecha_nacimiento, 'YYYY-MM-DD') AS fecha_nacimiento,
            servicios, total, anticipo,
            to_char(fecha_cita, 'YYYY-MM-DD') AS fecha_cita,
            hora_cita, duracion_min, metodo_pago, estado,
            confirmada_clienta, token, reagendada, cancelacion_nueva,
            (comprobante IS NOT NULL AND comprobante <> '') AS tiene_comprobante
     FROM reservas
     ORDER BY fecha_cita DESC, hora_cita DESC`,
  );
  return r.rows;
}

export async function getComprobante(id: number): Promise<string | null> {
  await ensureTable();
  const r = await pool.query<{ comprobante: string | null }>(
    "SELECT comprobante FROM reservas WHERE id = $1",
    [id],
  );
  return r.rows[0]?.comprobante ?? null;
}

export async function getReservaPorId(id: number): Promise<Reserva | null> {
  await ensureTable();
  const r = await pool.query<Reserva>(
    `SELECT id, creado_en, nombre, whatsapp, primera_vez,
            to_char(fecha_nacimiento, 'YYYY-MM-DD') AS fecha_nacimiento,
            servicios, total, anticipo,
            to_char(fecha_cita, 'YYYY-MM-DD') AS fecha_cita,
            hora_cita, duracion_min, comprobante, metodo_pago, estado,
            confirmada_clienta, token
     FROM reservas WHERE id = $1`,
    [id],
  );
  return r.rows[0] ?? null;
}

export async function actualizarEstadoReserva(
  id: number,
  estado: string,
): Promise<boolean> {
  await ensureTable();
  const r = await pool.query(
    "UPDATE reservas SET estado = $1 WHERE id = $2 RETURNING id",
    [estado, id],
  );
  return (r.rowCount ?? 0) > 0;
}

// El admin ya vio la reagenda: quita la marca (sale de "Reagendadas").
export async function marcarReagendaVista(id: number): Promise<boolean> {
  await ensureTable();
  const r = await pool.query(
    "UPDATE reservas SET reagendada = false WHERE id = $1 RETURNING id",
    [id],
  );
  return (r.rowCount ?? 0) > 0;
}

// El admin ya vio la cancelación: quita la marca (sale de "Canceladas").
export async function marcarCancelacionVista(id: number): Promise<boolean> {
  await ensureTable();
  const r = await pool.query(
    "UPDATE reservas SET cancelacion_nueva = false WHERE id = $1 RETURNING id",
    [id],
  );
  return (r.rowCount ?? 0) > 0;
}

export async function reagendarReservaPorId(
  id: number,
  fecha: string,
  hora: string,
): Promise<boolean> {
  await ensureTable();
  const r = await pool.query(
    `UPDATE reservas SET fecha_cita = $1, hora_cita = $2
     WHERE id = $3 AND estado <> 'Cancelada' RETURNING id`,
    [fecha, hora, id],
  );
  return (r.rowCount ?? 0) > 0;
}
