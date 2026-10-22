import type {
  Aviso,
  BusquedaCompleta,
  DatosDeCandidato,
  EmpresaResumen,
  EventoDeEmpresa,
  Inscripto,
  PerfilDeEmpresa,
  PostulacionRecibida,
  ReseniaRecibida,
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
 * usan campos que existen en `db/schema.sql`: no hay salario ni cupo, porque el
 * esquema no los tiene. Modalidad, ubicación y dirección llegaron con la
 * migración 005.
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
    modalidad: "hibrida",
    ubicacion: "Montevideo",
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
    modalidad: "presencial",
    ubicacion: "Montevideo",
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
    modalidad: "remota",
    ubicacion: null,
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
    modalidad: "presencial",
    ubicacion: "Canelones",
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
    direccion: "Av. 18 de Julio 1453, Montevideo",
    latitud: -34.9037,
    longitud: -56.1786,
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
    direccion: "Edificio Polo, Montevideo",
    latitud: null,
    longitud: null,
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
    direccion: null,
    latitud: null,
    longitud: null,
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
  personalidad: null,
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
      empresa_id: null,
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
      empresa_id: null,
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
      empresa_id: null,
      empresa_logo_url: null,
    },
  },
];

export const AVISOS_EJEMPLO: Aviso[] = [
  {
    id: "ejemplo-aviso-1",
    tipo: "postulacion",
    mensaje: "El estado de tu postulación cambió a: en_revision",
    enlace: "/postulaciones",
    leida: false,
    creada_en: haceHoras(5),
  },
  {
    id: "ejemplo-aviso-2",
    tipo: "postulacion",
    mensaje: "El estado de tu postulación cambió a: aceptada",
    enlace: "/postulaciones",
    leida: true,
    creada_en: haceHoras(72),
  },
];

/**
 * Las mismas organizaciones que publican las vacantes de ejemplo. La portada
 * las muestra en el carrusel cuando no hay base cargada, y lo aclara.
 */
export const EMPRESAS_EJEMPLO: EmpresaResumen[] = [
  MERCADO_LIBRE,
  PEDIDOSYA,
  DLOCAL,
  UDELAR,
];

// --- Lado de la empresa -----------------------------------------------------

/**
 * La empresa de demostración del panel. Inventada a propósito, igual que sus
 * postulantes: atribuirle búsquedas y candidatos ficticios a una empresa real
 * sería ponerle palabras en la boca.
 */
export const EMPRESA_PROPIA_EJEMPLO: PerfilDeEmpresa = {
  id: "ejemplo-empresa-propia",
  razon_social: "Nube UY",
  rut: "210001230011",
  rubro: "Tecnología",
  descripcion:
    "Fábrica de software uruguaya. Tomamos perfiles junior con acompañamiento de un referente técnico durante los primeros meses.",
  logo_url: null,
  sitio_web: "https://nube-uy.example",
};

export const BUSQUEDAS_EJEMPLO: BusquedaCompleta[] = [
  {
    id: "ejemplo-busqueda-1",
    titulo: "Desarrollador/a front-end junior",
    tipo: "empleo",
    modalidad: "hibrida",
    ubicacion: "Montevideo",
    posiciones: 2,
    estado: "activa",
    creada_en: haceHoras(30),
    postulaciones: 3,
    nuevas: 2,
    descripcion:
      "Vas a sumarte al equipo que construye el portal de clientes, con React y TypeScript. Te acompaña un referente técnico y tenés tiempo protegido para aprender.",
    habilidades: opcionesDe(["React", "TypeScript", "HTML y CSS", "Git"]),
    habilidadesOcultas: opcionesDe(["Inglés B2"]),
    tags: opcionesDe(["Desarrollo web", "Primera experiencia"]),
    tagsOcultos: opcionesDe(["Diseño de interfaces"]),
  },
  {
    id: "ejemplo-busqueda-2",
    titulo: "Pasantía en soporte técnico",
    tipo: "pasantia",
    modalidad: "presencial",
    ubicacion: "Montevideo",
    posiciones: 1,
    estado: "pausada",
    creada_en: haceHoras(200),
    postulaciones: 0,
    nuevas: 0,
    descripcion:
      "Atención de consultas de clientes por chat y teléfono, con capacitación inicial de dos semanas y horario compatible con el estudio.",
    habilidades: opcionesDe(["Comunicación", "Trabajo en equipo"]),
    habilidadesOcultas: [],
    tags: opcionesDe(["Atención al cliente"]),
    tagsOcultos: [],
  },
  {
    id: "ejemplo-busqueda-3",
    titulo: "Analista de datos trainee",
    tipo: "empleo",
    modalidad: "remota",
    ubicacion: null,
    posiciones: 1,
    estado: "cerrada",
    creada_en: haceHoras(900),
    postulaciones: 4,
    nuevas: 0,
    descripcion:
      "Armado de tableros y limpieza de datos para el área comercial, con SQL y planillas. Búsqueda cerrada: se cubrió la posición.",
    habilidades: opcionesDe(["SQL", "Inglés B2"]),
    habilidadesOcultas: [],
    tags: opcionesDe(["Datos"]),
    tagsOcultos: [],
  },
];

const SOFIA: DatosDeCandidato = {
  id: "ejemplo-candidato-1",
  nombre_usuario: "sofia_prueba",
  nombre: "Sofía",
  apellido: "Methol",
  pais: "Uruguay",
  bio: "Estudio Ingeniería en Computación y armo interfaces con React. Busco mi primera experiencia en un equipo de producto.",
  foto_url: null,
};

const MATEO: DatosDeCandidato = {
  id: "ejemplo-candidato-2",
  nombre_usuario: "mateo_prueba",
  nombre: "Mateo",
  apellido: "Silveira",
  pais: "Uruguay",
  bio: "Terminé Jóvenes a Programar y sigo con front-end por mi cuenta.",
  foto_url: null,
};

const CAMILA: DatosDeCandidato = {
  id: "ejemplo-candidato-3",
  nombre_usuario: "camila_prueba",
  nombre: "Camila",
  apellido: "Ferreira",
  pais: "Uruguay",
  bio: "Estudio Diseño de Comunicación Visual. Trabajo con Figma todos los días.",
  foto_url: null,
};

/** Postulaciones recibidas por búsqueda de demostración. */
export const POSTULACIONES_RECIBIDAS_EJEMPLO: Record<
  string,
  PostulacionRecibida[]
> = {
  "ejemplo-busqueda-1": [
    {
      id: "ejemplo-postulacion-recibida-1",
      estado: "pendiente",
      creada_en: haceHoras(5),
      actualizada_en: haceHoras(5),
      persona: SOFIA,
      habilidades: ["React", "TypeScript", "Git", "SQL"],
      tags: ["Desarrollo web", "Diseño de interfaces"],
      formaciones: [
        {
          id: "ejemplo-formacion-sofia",
          institucion: "Universidad de la República",
          titulo: "Ingeniería en Computación",
          estado: "en_curso",
        },
      ],
    },
    {
      id: "ejemplo-postulacion-recibida-2",
      estado: "entrevista",
      creada_en: haceHoras(26),
      actualizada_en: haceHoras(3),
      persona: MATEO,
      habilidades: ["React", "HTML y CSS", "JavaScript"],
      tags: ["Desarrollo web", "Primera experiencia"],
      formaciones: FORMACIONES_EJEMPLO.slice(1, 2),
    },
    {
      id: "ejemplo-postulacion-recibida-3",
      estado: "pendiente",
      creada_en: haceHoras(2),
      actualizada_en: haceHoras(2),
      persona: CAMILA,
      habilidades: ["HTML y CSS"],
      tags: ["Diseño de interfaces"],
      formaciones: [],
    },
  ],
};

export const EVENTOS_DE_EMPRESA_EJEMPLO: EventoDeEmpresa[] = [
  {
    id: "ejemplo-evento-propio-1",
    titulo: "Taller: tu primer repositorio con Git",
    descripcion:
      "Dos horas para crear un repositorio, subir un proyecto y presentarlo bien. Traé tu computadora.",
    fecha_hora: enDias(9, 18, 30),
    imagen_url: null,
    estado: "activo",
    direccion: "Av. 18 de Julio 1453, Montevideo",
    latitud: -34.9037,
    longitud: -56.1786,
    tags: opcionesDe(["Desarrollo web", "Primera experiencia"]),
    inscriptos: 2,
  },
  {
    id: "ejemplo-evento-propio-2",
    titulo: "Cómo es un día trabajando como desarrollador junior",
    descripcion:
      "Charla abierta con dos personas del equipo que entraron sin experiencia previa.",
    fecha_hora: enDias(23, 19),
    imagen_url: null,
    estado: "activo",
    direccion: null,
    latitud: null,
    longitud: null,
    tags: opcionesDe(["Networking"]),
    inscriptos: 0,
  },
];

export const INSCRIPTOS_EJEMPLO: Record<string, Inscripto[]> = {
  "ejemplo-evento-propio-1": [
    { persona: SOFIA, creada_en: haceHoras(40) },
    { persona: CAMILA, creada_en: haceHoras(12) },
  ],
};

export const RESENIAS_EJEMPLO: ReseniaRecibida[] = [
  {
    id: "ejemplo-resenia-1",
    calificacion: 5,
    comentario:
      "Me respondieron rápido y en la entrevista me explicaron bien qué esperaban.",
    creada_en: haceHoras(300),
  },
  {
    id: "ejemplo-resenia-2",
    calificacion: 4,
    comentario:
      "Buen proceso. Tardaron un poco en avisar que no había quedado.",
    creada_en: haceHoras(700),
  },
];
