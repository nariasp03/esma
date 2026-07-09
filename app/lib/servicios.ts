export type Servicio = {
  nombre: string;
  precio: number;
  duracion: string;
  categoria: string;
  nota?: string;
};

// Todos los servicios con precio son "color liso".
export const servicios: Servicio[] = [
  { nombre: "Gelish", precio: 150, duracion: "1 h", categoria: "Manicure", nota: "color liso" },
  { nombre: "Nivelación con rubber", precio: 250, duracion: "1:30 h", categoria: "Manicure", nota: "color liso" },
  { nombre: "Nivelación con builder", precio: 270, duracion: "1:30 h", categoria: "Manicure", nota: "color liso" },
  { nombre: "Extensión de uña acrílica (largo #1 o #2)", precio: 350, duracion: "2 – 2:30 h", categoria: "Acrílicas", nota: "color liso" },
  { nombre: "Retoque de acrílico", precio: 330, duracion: "1:30 – 2 h", categoria: "Acrílicas", nota: "color liso" },
  { nombre: "Retiro de acrílico (de otro salón)", precio: 100, duracion: "30 min", categoria: "Retiros" },
  { nombre: "Retiro de gelish o rubber (de otro salón)", precio: 80, duracion: "15 min", categoria: "Retiros" },
  { nombre: "Retiro de acrílico (trabajos de esma)", precio: 80, duracion: "30 min", categoria: "Retiros" },
  { nombre: "Retiro de gelish o rubber (trabajos de esma)", precio: 60, duracion: "15 min", categoria: "Retiros" },
];

export const categorias = ["Manicure", "Acrílicas", "Retiros"] as const;

// Datos del negocio
export const negocio = {
  nombre: "esma",
  ciudad: "Aguascalientes",
  direccion: "Calle Guadalupe 709, Heliodoro García",
  instagram: "https://www.instagram.com/esma.ags",
  instagramUser: "@esma.ags",
};
