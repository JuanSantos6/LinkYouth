import type {
  Evento,
  Formacion,
  PerfilCompleto,
  PostulacionResumen,
  Vacante,
} from "./tipos";

/**
 * Datos de demostración.
 *
 * Reproducen exactamente la forma que devuelven las vistas `vacantes_feed` y
 * `eventos_agenda`, así que la interfaz no distingue entre estos objetos y una
 * fila real: cuando la base esté cargada, se reemplazan sin tocar los
 * componentes. Mismo contenido que `db/seed/0002_demo.sql`.
 */

/**
 * Fecha futura expresada en hora de Montevideo (UTC-3, sin horario de verano),
 * para que el ejemplo se vea igual sin importar la zona del servidor.
 */
function enDias(dias: number, hora: number, minutos = 0): string {
  const hoy = new Date();
  const fecha = new Date(
    Date.UTC(
      hoy.getUTCFullYear(),
      hoy.getUTCMonth(),
      hoy.getUTCDate() + dias,
      hora + 3,
      minutos,
    ),
  );

  return fecha.toISOString();
}

function haceHoras(horas: number): string {
  return new Date(Date.now() - horas * 3_600_000).toISOString();
}

export const VACANTES_EJEMPLO: Vacante[] = [
  {
    id: "ejemplo-vacante-1",
    titulo: "Desarrollador Frontend Junior",
    descripcion:
      "Sumate al equipo de design system: vas a construir componentes reutilizables en React y TypeScript, con acompañamiento de un referente técnico durante los primeros seis meses. No pedimos experiencia previa en la industria.",
    tipo: "empleo",
    modalidad: "hibrido",
    ubicacion: "Montevideo, Uruguay",
    salario_min: 1500,
    salario_max: 2000,
    moneda: "USD",
    posiciones: 2,
    estado: "activa",
    publicada_en: haceHoras(3),
    empresa_id: "ejemplo-empresa-1",
    empresa: "Mercado Libre",
    empresa_logo_url: null,
    empresa_rubro: "Comercio electrónico",
    empresa_verificada: true,
    tags: ["React", "TypeScript", "Tailwind CSS", "HTML y CSS", "Git"],
    postulaciones: 18,
  },
  {
    id: "ejemplo-vacante-2",
    titulo: "Pasantía en Ingeniería de Interfaces",
    descripcion:
      "Pasantía rentada de seis meses en el equipo de checkout. Vas a trabajar sobre la interfaz que usan miles de personas por día, con revisión de código y mentoría semanal.",
    tipo: "pasantia",
    modalidad: "hibrido",
    ubicacion: "WTC Free Zone, Montevideo",
    salario_min: 1000,
    salario_max: 1350,
    moneda: "USD",
    posiciones: 3,
    estado: "activa",
    publicada_en: haceHoras(9),
    empresa_id: "ejemplo-empresa-2",
    empresa: "PedidosYa",
    empresa_logo_url: null,
    empresa_rubro: "Tecnología y logística",
    empresa_verificada: true,
    tags: ["React", "JavaScript", "HTML y CSS", "Trabajo en equipo"],
    postulaciones: 41,
  },
  {
    id: "ejemplo-vacante-3",
    titulo: "Analista de Datos Junior",
    descripcion:
      "Buscamos una persona curiosa para el equipo de reportes de negocio: vas a escribir consultas SQL, mantener tableros y presentar hallazgos al equipo comercial.",
    tipo: "empleo",
    modalidad: "remoto",
    ubicacion: "Remoto desde Uruguay",
    salario_min: 1400,
    salario_max: 1900,
    moneda: "USD",
    posiciones: 1,
    estado: "activa",
    publicada_en: haceHoras(28),
    empresa_id: "ejemplo-empresa-3",
    empresa: "dLocal",
    empresa_logo_url: null,
    empresa_rubro: "Fintech",
    empresa_verificada: true,
    tags: ["SQL", "Análisis de datos", "Planillas de cálculo", "Inglés B2"],
    postulaciones: 12,
  },
  {
    id: "ejemplo-vacante-4",
    titulo: "Pasantía en Atención al Cliente",
    descripcion:
      "Primera experiencia laboral en el equipo de posventa. Formación paga las primeras cuatro semanas y horario compatible con estudio.",
    tipo: "pasantia",
    modalidad: "presencial",
    ubicacion: "Montevideo, Uruguay",
    salario_min: 800,
    salario_max: 1000,
    moneda: "USD",
    posiciones: 5,
    estado: "activa",
    publicada_en: haceHoras(50),
    empresa_id: "ejemplo-empresa-1",
    empresa: "Mercado Libre",
    empresa_logo_url: null,
    empresa_rubro: "Comercio electrónico",
    empresa_verificada: true,
    tags: ["Atención al cliente", "Comunicación", "Trabajo en equipo"],
    postulaciones: 63,
  },
];

export const EVENTOS_EJEMPLO: Evento[] = [
  {
    id: "ejemplo-evento-1",
    titulo: "Taller: cómo preparar tu primera entrevista técnica",
    descripcion:
      "Taller práctico de dos horas con personas que entrevistan a diario. Se trabaja sobre casos reales y se sale con una devolución individual.",
    inicia_en: enDias(10, 18, 30),
    termina_en: enDias(10, 20, 30),
    modalidad: "hibrido",
    ubicacion: "WTC Free Zone, Torre 4, Montevideo",
    imagen_url: null,
    cupo: 60,
    estado: "publicado",
    empresa_id: "ejemplo-empresa-2",
    empresa: "PedidosYa",
    empresa_logo_url: null,
    tags: ["Comunicación", "JavaScript", "Resolución de problemas"],
    inscriptos: 46,
  },
  {
    id: "ejemplo-evento-2",
    titulo: "Feria de Primer Empleo Tecnológico",
    descripcion:
      "Jornada de vinculación con empresas de tecnología: charlas cortas, rondas de entrevistas breves y espacio de consultas sobre pasantías.",
    inicia_en: enDias(21, 14),
    termina_en: enDias(21, 19),
    modalidad: "presencial",
    ubicacion: "Facultad de Ingeniería, Montevideo",
    imagen_url: null,
    cupo: 200,
    estado: "publicado",
    empresa_id: "ejemplo-empresa-4",
    empresa: "Universidad de la República",
    empresa_logo_url: null,
    tags: ["Gestión de proyectos", "Comunicación", "React"],
    inscriptos: 128,
  },
  {
    id: "ejemplo-evento-3",
    titulo: "Charla abierta: primeros pasos en análisis de datos",
    descripcion:
      "Recorrido por el trabajo cotidiano de un equipo de datos, las herramientas que se usan y cómo es el proceso de selección para perfiles junior.",
    inicia_en: enDias(32, 19),
    termina_en: enDias(32, 20, 30),
    modalidad: "remoto",
    ubicacion: "Transmisión en línea",
    imagen_url: null,
    cupo: null,
    estado: "publicado",
    empresa_id: "ejemplo-empresa-3",
    empresa: "dLocal",
    empresa_logo_url: null,
    tags: ["Análisis de datos", "SQL", "Estadística"],
    inscriptos: 74,
  },
];

const FORMACIONES_EJEMPLO: Formacion[] = [
  {
    id: "ejemplo-formacion-1",
    institucion: "Universidad de la República",
    institucion_logo_url: null,
    titulo: "Ingeniería en Computación",
    estado: "en_curso",
    anio_inicio: 2023,
    anio_fin: null,
    acreditada: true,
    creado_en: haceHoras(900),
  },
  {
    id: "ejemplo-formacion-2",
    institucion: "Plan Ceibal — Jóvenes a Programar",
    institucion_logo_url: null,
    titulo: "Desarrollo web front-end",
    estado: "finalizado",
    anio_inicio: 2022,
    anio_fin: 2023,
    acreditada: true,
    creado_en: haceHoras(1200),
  },
  {
    id: "ejemplo-formacion-3",
    institucion: "Instituto Anglo Uruguayo",
    institucion_logo_url: null,
    titulo: "B2 First (FCE)",
    estado: "finalizado",
    anio_inicio: 2021,
    anio_fin: 2022,
    acreditada: false,
    creado_en: haceHoras(2000),
  },
];

export const PERFIL_EJEMPLO: PerfilCompleto = {
  id: "ejemplo-perfil",
  nombre_usuario: "mateo_silveira",
  nombre: "Mateo",
  apellido: "Silveira",
  fecha_nacimiento: "2005-04-17",
  pais: "Uruguay",
  ciudad: "Montevideo",
  titular: "Estudiante de Ingeniería en Computación · Front-end junior",
  biografia:
    "Estudio Ingeniería en Computación y trabajo en proyectos propios de front-end con React y TypeScript. Busco mi primera experiencia laboral en un equipo donde pueda aprender de gente con más recorrido.",
  avatar_url: null,
  verificado: true,
  creado_en: haceHoras(4000),
  actualizado_en: haceHoras(20),
  tags: [
    { slug: "react", nombre: "React", categoria: "tecnologia", nivel: 4 },
    {
      slug: "typescript",
      nombre: "TypeScript",
      categoria: "tecnologia",
      nivel: 3,
    },
    {
      slug: "javascript",
      nombre: "JavaScript",
      categoria: "tecnologia",
      nivel: 4,
    },
    { slug: "git", nombre: "Git", categoria: "tecnologia", nivel: 3 },
    { slug: "tailwind", nombre: "Tailwind CSS", categoria: "diseno", nivel: 4 },
    { slug: "html-css", nombre: "HTML y CSS", categoria: "diseno", nivel: 5 },
    { slug: "figma", nombre: "Figma", categoria: "diseno", nivel: 3 },
    { slug: "sql", nombre: "SQL", categoria: "tecnologia", nivel: 2 },
    { slug: "ingles-b2", nombre: "Inglés B2", categoria: "idiomas", nivel: 4 },
    {
      slug: "trabajo-en-equipo",
      nombre: "Trabajo en equipo",
      categoria: "habilidades_blandas",
      nivel: 4,
    },
    {
      slug: "comunicacion",
      nombre: "Comunicación",
      categoria: "habilidades_blandas",
      nivel: 4,
    },
  ],
  formaciones: FORMACIONES_EJEMPLO,
};

export const POSTULACIONES_EJEMPLO: PostulacionResumen[] = [
  {
    id: "ejemplo-postulacion-1",
    estado: "en_revision",
    creado_en: haceHoras(30),
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
    creado_en: haceHoras(52),
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
    creado_en: haceHoras(220),
    vacante: {
      id: "ejemplo-vacante-3",
      titulo: "Analista de Datos Junior",
      empresa: "dLocal",
      empresa_logo_url: null,
    },
  },
];
