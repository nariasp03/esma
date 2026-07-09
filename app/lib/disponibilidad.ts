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
export const MIN_DIAS = 7; // se puede reservar desde 1 semana antes
export const MAX_DIAS = 30; // hasta 1 mes antes
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
export function rangoFechas(): { min: string; max: string } {
  const hoy = new Date();
  const min = new Date(hoy);
  min.setDate(min.getDate() + MIN_DIAS);
  const max = new Date(hoy);
  max.setDate(max.getDate() + MAX_DIAS);
  return { min: fechaAStr(min), max: fechaAStr(max) };
}
