import type {
  Catalogos,
  Evento,
  Formacion,
  PerfilCompleto,
  OpcionCatalogo,
  PostulacionResumen,
  Vacante,
} from "./tipos";

/**
 * Datos de demostración.
 *
 * Tienen exactamente la forma que devuelven las consultas de `consultas.ts`,
 * así que la interfaz no distingue entre estos objetos y una fila real. Solo
 * usan campos que existen en `db/schema.sql`: no hay salario, modalidad,
 * ubicación ni cupo, porque el esquema no los tiene.
 */

/** Fecha futura en hora de Montevideo (UTC-3, sin horario de verano). */
function enDias(dias: number, hora: number, minutos = 0): string {
  const hoy = new Date();

  return new Date(
    Date.UTC(
      hoy.getUTCFullYear(),
      hoy.getUTCMonth(),
      hoy.getUTCDate() + dias,
      hora + 3,
      minutos,
    ),
  ).toISOString();
}

function haceHoras(horas: number): string {
  return new Date(Date.now() - horas * 3_600_000).toISOString();
}

const MERCADO_LIBRE = {
  id: "ejemplo-empresa-1",
  razon_social: "Mercado Libre",
  rubro: "Comercio electrónico",
  logo_url: null,
};

const PEDIDOSYA = {
  id: "ejemplo-empresa-2",
  razon_social: "PedidosYa",
  rubro: "Tecnología y logística",
  logo_url: null,
};

const DLOCAL = {
  id: "ejemplo-empresa-3",
  razon_social: "dLocal",
  rubro: "Fintech",
  logo_url: null,
};

const UDELAR = {
  id: "ejemplo-empresa-4",
  razon_social: "Universidad de la República",
  rubro: "Educación",
  logo_url: null,
};

export const VACANTES_EJEMPLO: Vacante[] = [
  {
    id: "ejemplo-vacante-1",
    titulo: "Desarrollador Frontend Junior",
    descripcion:
      "Sumate al equipo de design system: vas a construir componentes reutilizables en React y TypeScript, con acompañamiento de un referente técnico durante los primeros seis meses. No pedimos experiencia previa en la industria.",
    tipo: "empleo",
    posiciones: 2,
    estado: "activa",
    creada_en: haceHoras(3),
    empresa: MERCADO_LIBRE,
    tags: ["Desarrollo web", "Diseño de interfaces"],
    habilidades: ["React", "TypeScript", "HTML y CSS", "Git"],
  },
  {
    id: "ejemplo-vacante-2",
    titulo: "Pasantía en Ingeniería de Interfaces",
    descripcion:
      "Pasantía rentada de seis meses en el equipo de checkout. Vas a trabajar sobre la interfaz que usan miles de personas por día, con revisión de código y mentoría semanal.",
    tipo: "pasantia",
    posiciones: 3,
    estado: "activa",
    creada_en: haceHoras(9),
    empresa: PEDIDOSYA,
    tags: ["Desarrollo web", "Primera experiencia"],
    habilidades: ["React", "JavaScript", "HTML y CSS"],
  },
  {
    id: "ejemplo-vacante-3",
    titulo: "Analista de Datos Junior",
    descripcion:
      "Buscamos una persona curiosa para el equipo de reportes de negocio: vas a escribir consultas SQL, mantener tableros y presentar hallazgos al equipo comercial.",
    tipo: "empleo",
    posiciones: 1,
    estado: "activa",
    creada_en: haceHoras(28),
    empresa: DLOCAL,
    tags: ["Datos", "Negocios"],
    habilidades: ["SQL", "Planillas de cálculo", "Inglés B2"],
  },
  {
    id: "ejemplo-vacante-4",
    titulo: "Pasantía en Atención al Cliente",
    descripcion:
      "Primera experiencia laboral en el equipo de posventa. Formación paga las primeras cuatro semanas y horario compatible con estudio.",
    tipo: "pasantia",
    posiciones: 5,
    estado: "activa",
    creada_en: haceHoras(50),
    empresa: MERCADO_LIBRE,
    tags: ["Atención al cliente", "Primera experiencia"],
    habilidades: ["Comunicación", "Trabajo en equipo"],
  },
];

export const EVENTOS_EJEMPLO: Evento[] = [
  {
    id: "ejemplo-evento-1",
    titulo: "Taller: cómo preparar tu primera entrevista técnica",
    descripcion:
      "Taller práctico de dos horas con personas que entrevistan a diario. Se trabaja sobre casos reales y se sale con una devolución individual.",
    fecha_hora: enDias(10, 18, 30),
    imagen_url: null,
    estado: "activo",
    empresa: PEDIDOSYA,
    tags: ["Primera experiencia", "Desarrollo web"],
  },
  {
    id: "ejemplo-evento-2",
    titulo: "Feria de Primer Empleo Tecnológico",
    descripcion:
      "Jornada de vinculación con empresas de tecnología: charlas cortas, rondas de entrevistas breves y espacio de consultas sobre pasantías.",
    fecha_hora: enDias(21, 14),
    imagen_url: null,
    estado: "activo",
    empresa: UDELAR,
    tags: ["Primera experiencia", "Networking"],
  },
  {
    id: "ejemplo-evento-3",
    titulo: "Charla abierta: primeros pasos en análisis de datos",
    descripcion:
      "Recorrido por el trabajo cotidiano de un equipo de datos, las herramientas que se usan y cómo es el proceso de selección para perfiles junior.",
    fecha_hora: enDias(32, 19),
    imagen_url: null,
    estado: "activo",
    empresa: DLOCAL,
    tags: ["Datos", "Networking"],
  },
];

const FORMACIONES_EJEMPLO: Formacion[] = [
  {
    id: "ejemplo-formacion-1",
    institucion: "Universidad de la República",
    titulo: "Ingeniería en Computación",
    estado: "en_curso",
  },
  {
    id: "ejemplo-formacion-2",
    institucion: "Plan Ceibal — Jóvenes a Programar",
    titulo: "Desarrollo web front-end",
    estado: "finalizado",
  },
  {
    id: "ejemplo-formacion-3",
    institucion: "Instituto Anglo Uruguayo",
    titulo: "B2 First (FCE)",
    estado: "finalizado",
  },
];

export const PERFIL_EJEMPLO: PerfilCompleto = {
  id: "ejemplo-perfil",
  nombre_usuario: "mateo_silveira",
  nombre: "Mateo",
  apellido: "Silveira",
  fecha_nacimiento: "2005-04-17",
  pais: "Uruguay",
  bio: "Estudio Ingeniería en Computación y trabajo en proyectos propios de front-end con React y TypeScript. Busco mi primera experiencia laboral en un equipo donde pueda aprender de gente con más recorrido.",
  foto_url: null,
  creado_en: haceHoras(4000),
  tags: ["Desarrollo web", "Diseño de interfaces", "Primera experiencia"],
  habilidades: [
    "React",
    "TypeScript",
    "JavaScript",
    "HTML y CSS",
    "Git",
    "SQL",
    "Inglés B2",
    "Trabajo en equipo",
    "Comunicación",
  ],
  formaciones: FORMACIONES_EJEMPLO,
};

/**
 * Catálogos de demostración.
 *
 * Los `id` son inventados: sin credenciales no hay fila de `tags` ni de
 * `habilidades` que referenciar. Por eso `SelectorTags` no deja elegir cuando
 * el origen es «ejemplo», igual que `BotonAccion` con `esEjemplo`: un clic que
 * no puede terminar en la base no se ofrece.
 *
 * La lista contiene todos los nombres que usan los demás ejemplos de este
 * archivo, así que lo que el perfil de demostración muestra como elegido
 * siempre existe en el catálogo.
 */
function opcionesDe(nombres: string[]): OpcionCatalogo[] {
  return nombres
    .map((nombre) => ({ id: `ejemplo-${nombre}`, nombre }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

export const CATALOGOS_EJEMPLO: Catalogos = {
  tags: opcionesDe([
    "Atención al cliente",
    "Datos",
    "Desarrollo web",
    "Diseño de interfaces",
    "Negocios",
    "Networking",
    "Primera experiencia",
  ]),
  habilidades: opcionesDe([
    "Comunicación",
    "Git",
    "HTML y CSS",
    "Inglés B2",
    "JavaScript",
    "Planillas de cálculo",
    "React",
    "SQL",
    "Trabajo en equipo",
    "TypeScript",
  ]),
};

export const POSTULACIONES_EJEMPLO: PostulacionResumen[] = [
  {
    id: "ejemplo-postulacion-1",
    estado: "en_revision",
    creada_en: haceHoras(30),
    vacante: {
      id: "ejemplo-vacante-2",
      titulo: "Pasantía en Ingeniería de Interfaces",
      empresa: "PedidosYa",
      empresa_logo_url: null,
    },
  },
  {
    id: "ejemplo-postulacion-2",
    estado: "pendiente",
    creada_en: haceHoras(52),
    vacante: {
      id: "ejemplo-vacante-1",
      titulo: "Desarrollador Frontend Junior",
      empresa: "Mercado Libre",
      empresa_logo_url: null,
    },
  },
  {
    id: "ejemplo-postulacion-3",
    estado: "aceptada",
    creada_en: haceHoras(220),
    vacante: {
      id: "ejemplo-vacante-3",
      titulo: "Analista de Datos Junior",
      empresa: "dLocal",
      empresa_logo_url: null,
    },
  },
];
