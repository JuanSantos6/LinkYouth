/**
 * CONTENIDO DE EJEMPLO — no es información real.
 *
 * En la app completa, las organizaciones y las búsquedas de la portada se
 * leen de la base de datos. Esta versión de presentación no tiene base: todo
 * lo que la portada muestra sale de este archivo, y la pantalla avisa en cada
 * sección que es contenido de demostración.
 *
 * Las organizaciones usan nombres conocidos solo para que la cinta y las
 * tarjetas se vean como se verían con datos reales. Ninguna publicó nada en
 * LinkYouth.
 */

/** Una organización de la cinta de logos. Sin logo, se dibujan sus iniciales. */
export type Organizacion = {
  id: string;
  nombre: string;
  rubro: string;
  logo: string | null;
};

/** Una tarjeta del carrusel «Búsquedas abiertas». */
export type BusquedaDeEjemplo = {
  id: string;
  titulo: string;
  organizacion: string;
  tipo: "Empleo" | "Pasantía";
  /** Texto fijo: en la versión real se calcula a partir de la fecha. */
  publicada: string;
  requisitos: string[];
};

export const ORGANIZACIONES: Organizacion[] = [
  {
    id: "org-1",
    nombre: "Mercado Libre",
    rubro: "Comercio electrónico",
    logo: null,
  },
  {
    id: "org-2",
    nombre: "PedidosYa",
    rubro: "Tecnología y logística",
    logo: null,
  },
  { id: "org-3", nombre: "dLocal", rubro: "Fintech", logo: null },
  {
    id: "org-4",
    nombre: "Universidad de la República",
    rubro: "Educación",
    logo: null,
  },
];

export const BUSQUEDAS: BusquedaDeEjemplo[] = [
  {
    id: "busqueda-1",
    titulo: "Desarrollador Frontend Junior",
    organizacion: "Mercado Libre",
    tipo: "Empleo",
    publicada: "hace 3 horas",
    requisitos: ["React", "HTML y CSS"],
  },
  {
    id: "busqueda-2",
    titulo: "Pasantía en Ingeniería de Interfaces",
    organizacion: "PedidosYa",
    tipo: "Pasantía",
    publicada: "hace 9 horas",
    requisitos: ["JavaScript", "HTML y CSS"],
  },
  {
    id: "busqueda-3",
    titulo: "Analista de Datos Junior",
    organizacion: "dLocal",
    tipo: "Empleo",
    publicada: "ayer",
    requisitos: ["SQL", "Planillas de cálculo"],
  },
  {
    id: "busqueda-4",
    titulo: "Pasantía en Atención al Cliente",
    organizacion: "Mercado Libre",
    tipo: "Pasantía",
    publicada: "hace 2 días",
    requisitos: ["Comunicación", "Trabajo en equipo"],
  },
];
