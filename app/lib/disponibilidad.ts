// Configuración de horarios y cálculo de disponibilidad de esma.
// Día de la semana: 0=Domingo, 1=Lunes, ... 6=Sábado.

export const HORARIOS: Record<number, { inicio: string; fin: string } | null> = {
  0: null, // Domingo: cerrado
  1: { inicio: "10:00", fin: "15:00" }, // Lunes
  2: { inicio: "10:00", fin: "15:00" }, // Martes
  3: { inicio: "10:00", fin: "15:00" }, // Miércoles
  4: { inicio: "11:00", fin: "18:00" }, // Jueves
  5: { inicio: "11:00", fin: "18:00" }, // Viernes
  6: { inicio: "11:00", fin: "18:00" }, // Sábado
};

export const BUFFER_MIN = 15; // descanso entre citas
export const MIN_DIAS = 1; // se puede reservar para el día siguiente
export const CORTE_HORA = 18; // hasta las 6pm se agenda para mañana; después, pasado mañana
export const MAX_DIAS = 90; // hasta 3 meses antes
export const PASO_MIN = 30; // se ofrecen horarios cada 30 min

const DIAS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

function aMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function aHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Convierte "YYYY-MM-DD" a Date local (evita problemas de zona horaria).
export function parseFecha(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function estaAbierto(fechaStr: string): boolean {
  return HORARIOS[parseFecha(fechaStr).getDay()] != null;
}

export function nombreDia(fechaStr: string): string {
  return DIAS[parseFecha(fechaStr).getDay()];
}

// Genera las horas de inicio disponibles para un día, según la duración total
// del servicio. Por ahora asume el día vacío; cuando exista la base de datos,
// se quitarán aquí los horarios ya ocupados (respetando el BUFFER_MIN).
export function generarSlots(fechaStr: string, duracionMin: number): string[] {
  const h = HORARIOS[parseFecha(fechaStr).getDay()];
  if (!h || duracionMin <= 0) return [];
  const inicio = aMinutos(h.inicio);
  const fin = aMinutos(h.fin);
  const slots: string[] = [];
  for (let t = inicio; t + duracionMin <= fin; t += PASO_MIN) {
    slots.push(aHHMM(t));
  }
  return slots;
}

function fechaAStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

// Rango de fechas permitido para el selector (YYYY-MM-DD).
// Regla: hasta las 6pm del día anterior se puede agendar para el día siguiente.
// Si ya pasaron las 6pm, el día siguiente ya no está disponible (mínimo pasado
// mañana).
export function rangoFechas(): { min: string; max: string } {
  const hoy = new Date();
  const diasMin = hoy.getHours() >= CORTE_HORA ? MIN_DIAS + 1 : MIN_DIAS;
  const min = new Date(hoy);
  min.setDate(min.getDate() + diasMin);
  const max = new Date(hoy);
  max.setDate(max.getDate() + MAX_DIAS);
  return { min: fechaAStr(min), max: fechaAStr(max) };
}

// Convierte "YYYY-MM-DD" a "DD/MM/YYYY" (formato que usamos en toda la app).
export function formatearFecha(fechaStr: string): string {
  const [y, m, d] = fechaStr.split("-");
  return `${d}/${m}/${y}`;
}

// Fecha (YYYY-MM-DD) en la zona horaria de Aguascalientes, con un desfase de
// días opcional (0 = hoy, 1 = mañana). Se usa en el servidor para los
// recordatorios, porque Railway corre en UTC.
export function fechaMexico(offsetDias = 0): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = Number(partes.find((p) => p.type === "year")?.value);
  const m = Number(partes.find((p) => p.type === "month")?.value);
  const d = Number(partes.find((p) => p.type === "day")?.value);
  return new Date(Date.UTC(y, m - 1, d + offsetDias)).toISOString().slice(0, 10);
}

// Igual que generarSlots, pero quita las horas que chocan con citas ya
// ocupadas (respetando el descanso BUFFER_MIN entre citas).
export function slotsDisponibles(
  fechaStr: string,
  duracionMin: number,
  ocupados: { inicio: number; fin: number }[],
): string[] {
  return generarSlots(fechaStr, duracionMin).filter((hhmm) => {
    const t = aMinutos(hhmm);
    const finT = t + duracionMin;
    // Hay conflicto si no queda el descanso mínimo entre esta cita y otra.
    return !ocupados.some(
      (o) => t < o.fin + BUFFER_MIN && o.inicio < finT + BUFFER_MIN,
    );
  });
}
