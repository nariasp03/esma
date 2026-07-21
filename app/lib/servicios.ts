export type Servicio = {
  nombre: string; // nombre completo (para reservar), ej. "Gelish color liso"
  precio: number; // precio base (sobre este se calcula el anticipo)
  duracion: string;
  duracionMin: number; // duración en minutos (para el calendario)
  categoria: string;
  nota?: string;
  // Si el servicio pertenece a un grupo (ej. "Gelish"), en la página de
  // servicios se muestra el grupo y al tocarlo se ven las variantes.
  grupo?: string;
  etiqueta?: string; // nombre corto dentro del grupo, ej. "Color liso"
  // Texto de precio a mostrar cuando NO es un precio simple (ej. con extra).
  precioTexto?: string;
  // Aviso importante para la clienta (se muestra claramente al reservar).
  aviso?: string;
};

// Avisos reutilizables para los servicios con variantes (liso / personalizado).
const AVISO_LISO =
  "Esta opción es para tus uñas en un solo color, sin diseños 💖. Si te gustaría agregar algún diseño —aunque sea en una sola uña— elige mejor la opción de Diseño personalizado. ¡Así te queda justo como lo imaginas! ✨";
const avisoPersonalizado = (base: number) =>
  `El precio base es $${base} y el diseño personalizado lleva un pequeño extra que definimos juntas en el local, según lo que elijas 💕. Por ahora solo apartas con la mitad como anticipo; el resto y el extra del diseño los pagas en tu cita. ¡Todo clarito para que disfrutes sin sorpresas! 😊`;

// duracionMin usa el máximo del rango, para no encimar citas.
export const servicios: Servicio[] = [
  { nombre: "Manicure ruso", precio: 120, duracion: "30 min", duracionMin: 30, categoria: "Manicure" },
  // Gelish: dos variantes agrupadas.
  {
    nombre: "Gelish color liso",
    etiqueta: "Color liso",
    grupo: "Gelish",
    precio: 180,
    duracion: "1 h",
    duracionMin: 60,
    categoria: "Manicure",
    aviso: AVISO_LISO,
  },
  {
    nombre: "Gelish diseño personalizado",
    etiqueta: "Diseño personalizado",
    grupo: "Gelish",
    precio: 180,
    precioTexto: "$180 + extra por diseño",
    duracion: "1:30 h",
    duracionMin: 90,
    categoria: "Manicure",
    aviso: avisoPersonalizado(180),
  },
  // Nivelación con rubber: dos variantes agrupadas.
  {
    nombre: "Nivelación con rubber color liso",
    etiqueta: "Color liso",
    grupo: "Nivelación con rubber",
    precio: 250,
    duracion: "1:30 h",
    duracionMin: 90,
    categoria: "Manicure",
    aviso: AVISO_LISO,
  },
  {
    nombre: "Nivelación con rubber diseño personalizado",
    etiqueta: "Diseño personalizado",
    grupo: "Nivelación con rubber",
    precio: 250,
    precioTexto: "$250 + extra por diseño",
    duracion: "2:30 h",
    duracionMin: 150,
    categoria: "Manicure",
    aviso: avisoPersonalizado(250),
  },
  // Nivelación con builder: dos variantes agrupadas.
  {
    nombre: "Nivelación con builder color liso",
    etiqueta: "Color liso",
    grupo: "Nivelación con builder",
    precio: 270,
    duracion: "1:30 h",
    duracionMin: 90,
    categoria: "Manicure",
    aviso: AVISO_LISO,
  },
  {
    nombre: "Nivelación con builder diseño personalizado",
    etiqueta: "Diseño personalizado",
    grupo: "Nivelación con builder",
    precio: 270,
    precioTexto: "$270 + extra por diseño",
    duracion: "2:30 h",
    duracionMin: 150,
    categoria: "Manicure",
    aviso: avisoPersonalizado(270),
  },
  // Extensión de uña acrílica: dos variantes agrupadas.
  {
    nombre: "Extensión de uña acrílica (largo #1 o #2) color liso",
    etiqueta: "Color liso",
    grupo: "Extensión de uña acrílica (largo #1 o #2)",
    precio: 350,
    duracion: "2 – 2:30 h",
    duracionMin: 150,
    categoria: "Acrílicas",
    aviso: AVISO_LISO,
  },
  {
    nombre: "Extensión de uña acrílica (largo #1 o #2) diseño personalizado",
    etiqueta: "Diseño personalizado",
    grupo: "Extensión de uña acrílica (largo #1 o #2)",
    precio: 350,
    precioTexto: "$350 + extra por diseño",
    duracion: "2:30 h",
    duracionMin: 150,
    categoria: "Acrílicas",
    aviso: avisoPersonalizado(350),
  },
  // Baño de acrílico: dos variantes agrupadas.
  {
    nombre: "Baño de acrílico color liso",
    etiqueta: "Color liso",
    grupo: "Baño de acrílico",
    precio: 320,
    duracion: "1 h",
    duracionMin: 60,
    categoria: "Acrílicas",
    aviso: AVISO_LISO,
  },
  {
    nombre: "Baño de acrílico diseño personalizado",
    etiqueta: "Diseño personalizado",
    grupo: "Baño de acrílico",
    precio: 320,
    precioTexto: "$320 + extra por diseño",
    duracion: "2 h",
    duracionMin: 120,
    categoria: "Acrílicas",
    aviso: avisoPersonalizado(320),
  },
  // Retoque de acrílico: dos variantes agrupadas.
  {
    nombre: "Retoque de acrílico color liso",
    etiqueta: "Color liso",
    grupo: "Retoque de acrílico",
    precio: 330,
    duracion: "1:30 – 2 h",
    duracionMin: 120,
    categoria: "Acrílicas",
    aviso: AVISO_LISO,
  },
  {
    nombre: "Retoque de acrílico diseño personalizado",
    etiqueta: "Diseño personalizado",
    grupo: "Retoque de acrílico",
    precio: 330,
    precioTexto: "$330 + extra por diseño",
    duracion: "2 h",
    duracionMin: 120,
    categoria: "Acrílicas",
    aviso: avisoPersonalizado(330),
  },
  { nombre: "Retiro de acrílico (de otro salón)", precio: 100, duracion: "30 min", duracionMin: 30, categoria: "Retiros" },
  { nombre: "Retiro de gelish o rubber (de otro salón)", precio: 80, duracion: "15 min", duracionMin: 15, categoria: "Retiros" },
  { nombre: "Retiro de acrílico (trabajos de esma)", precio: 80, duracion: "30 min", duracionMin: 30, categoria: "Retiros" },
  { nombre: "Retiro de gelish o rubber (trabajos de esma)", precio: 60, duracion: "15 min", duracionMin: 15, categoria: "Retiros" },
];

export const categorias = ["Manicure", "Acrílicas", "Retiros"] as const;

// Descuento (%) que se aplica cuando la clienta reserva en el mes de su
// cumpleaños (solo en UNA cita al mes).
export const DESCUENTO_CUMPLE = 10;

// Datos del negocio
export const negocio = {
  nombre: "esma",
  ciudad: "Aguascalientes",
  direccion: "Calle Guadalupe 709, Heliodoro García",
  instagram: "https://www.instagram.com/esma.ags",
  instagramUser: "@esma.ags",
  // TEMPORAL: número de Natalia para pruebas. Cambiar por el del local.
  telefono: "+524491863483",
  telefonoTexto: "449 186 3483",
};

// Datos para el anticipo (transferencia SPEI)
export const pago = {
  clabe: "722969016430797626",
  beneficiario: "Martha Esperanza Jiménez Pérez",
  banco: "Mercado Pago",
};

// Texto de la política de cancelación (se muestra al reservar)
export const politicaCancelacion =
  "Política de cancelación: si cancelas tu cita con al menos 24 horas de anticipación, se te reembolsa tu anticipo. Si la cancelas con menos de 24 horas de anticipación, el anticipo no es reembolsable. Gracias por respetar mi tiempo y el de las demás clientas.";
