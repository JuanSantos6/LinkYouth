import type { CreditoDeFoto } from "@/lib/unsplash";
import type { Database } from "@/types/database";

/**
 * Tipos de dominio de la aplicación.
 *
 * Viven acá y no en `src/types/database.ts` porque ese archivo se regenera con
 * `supabase gen types typescript` y cualquier cosa que se le agregue a mano se
 * pierde en la próxima corrida (deuda 7.2 de `docs/arquitectura.md`).
 *
 * El esquema usa `text` + `check` en lugar de enums de Postgres, así que
 * Supabase genera esas columnas como `string`. Los alias de abajo recuperan el
 * conjunto cerrado de valores que la base ya garantiza, y cada uno viene con su
 * función de estrechamiento para convertir el `string` que llega de la consulta.
 */

type Tabla<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

// --- Conjuntos cerrados declarados en db/schema.sql -------------------------

export const TIPOS_OPORTUNIDAD = ["empleo", "pasantia"] as const;
export type TipoOportunidad = (typeof TIPOS_OPORTUNIDAD)[number];

/**
 * `pausada` (migración 005): la búsqueda sigue siendo de la empresa, pero no
 * se ve ni recibe postulaciones.
 */
export const ESTADOS_VACANTE = ["activa", "pausada", "cerrada"] as const;
export type EstadoVacante = (typeof ESTADOS_VACANTE)[number];

export const ESTADOS_POSTULACION = [
  "pendiente",
  "en_revision",
  "entrevista",
  "aceptada",
  "rechazada",
  "cancelada",
] as const;
export type EstadoPostulacion = (typeof ESTADOS_POSTULACION)[number];

/** Dónde se trabaja (migración 005). Opcional en la base, obligatoria al publicar. */
export const MODALIDADES = ["presencial", "remota", "hibrida"] as const;
export type Modalidad = (typeof MODALIDADES)[number];

export const ESTADOS_FORMACION = ["en_curso", "finalizado"] as const;
export type EstadoFormacion = (typeof ESTADOS_FORMACION)[number];

export const ESTADOS_EVENTO = ["activo", "cancelado"] as const;
export type EstadoEvento = (typeof ESTADOS_EVENTO)[number];

export const TIPOS_CUENTA = ["individual", "empresa"] as const;
export type TipoCuenta = (typeof TIPOS_CUENTA)[number];

/**
 * Convierte el `string` de la base en el alias correspondiente.
 *
 * La restricción `check` ya impide guardar otro valor, así que este camino
 * solo se recorre si el esquema cambió y el código todavía no. En ese caso se
 * devuelve el valor de respaldo en vez de romper la pantalla entera.
 */
function estrechar<T extends string>(
  valores: readonly T[],
  valor: string,
  respaldo: T,
): T {
  return (valores as readonly string[]).includes(valor)
    ? (valor as T)
    : respaldo;
}

export const comoTipoOportunidad = (valor: string): TipoOportunidad =>
  estrechar(TIPOS_OPORTUNIDAD, valor, "empleo");

export const comoEstadoVacante = (valor: string): EstadoVacante =>
  estrechar(ESTADOS_VACANTE, valor, "activa");

export const comoEstadoPostulacion = (valor: string): EstadoPostulacion =>
  estrechar(ESTADOS_POSTULACION, valor, "pendiente");

/** `null` cuando la búsqueda es anterior a la migración 005 y no la tiene. */
export const comoModalidad = (valor: string | null): Modalidad | null =>
  valor === null ? null : estrechar(MODALIDADES, valor, "presencial");

export const comoEstadoFormacion = (valor: string): EstadoFormacion =>
  estrechar(ESTADOS_FORMACION, valor, "en_curso");

export const comoEstadoEvento = (valor: string): EstadoEvento =>
  estrechar(ESTADOS_EVENTO, valor, "activo");

/**
 * El respaldo es `individual` a propósito: es el tipo con menos alcance. Ante
 * un valor que no se reconoce, la sesión cae en la aplicación del postulante,
 * nunca en el panel de empresa.
 */
export const comoTipoCuenta = (valor: string): TipoCuenta =>
  estrechar(TIPOS_CUENTA, valor, "individual");

// --- Formas que consume la interfaz ----------------------------------------

/** Datos públicos de la empresa que publica una vacante o un evento. */
export type EmpresaResumen = Pick<
  Tabla<"empresas">,
  "id" | "razon_social" | "rubro" | "logo_url"
>;

/**
 * Vacante lista para mostrar.
 *
 * `tags` son los intereses declarados de la búsqueda y `habilidades` los
 * conocimientos técnicos: `db/schema.sql` los separa a propósito, porque el
 * matching (RF3.9) necesita distinguir «le interesa» de «sabe hacer».
 *
 * Los tags ocultos (`vacante_tags_ocultos`) no aparecen en este tipo ni en
 * ninguna consulta de esta capa: RF3.1.6 y RNF5.
 */
export type Vacante = {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: TipoOportunidad;
  posiciones: number;
  estado: EstadoVacante;
  modalidad: Modalidad | null;
  ubicacion: string | null;
  creada_en: string;
  empresa: EmpresaResumen;
  tags: string[];
  habilidades: string[];
};

export type Evento = {
  id: string;
  titulo: string;
  descripcion: string;
  fecha_hora: string;
  imagen_url: string | null;
  /** Atribución, si la imagen es de Unsplash (`src/lib/data/fotos.ts`). */
  credito?: CreditoDeFoto | null;
  estado: EstadoEvento;
  direccion: string | null;
  latitud: number | null;
  longitud: number | null;
  empresa: EmpresaResumen;
  tags: string[];
};

export type Formacion = {
  id: string;
  institucion: string;
  titulo: string;
  estado: EstadoFormacion;
};

/**
 * Una institución educativa reconstruida desde `formaciones`.
 *
 * No sale de una tabla: `db/schema.sql` guarda la institución como texto libre
 * dentro de la formación de cada perfil, así que la ficha se arma agrupando
 * las formaciones que nombran el mismo lugar. Ver `src/lib/dominio/Institucion.ts`.
 */
export type FichaDeInstitucion = {
  /** El identificador derivado del nombre, el que va en la URL. */
  id: string;
  nombre: string;
  /** Cuántos perfiles la declaran. */
  estudiantes: number;
  /** Las carreras que se cursan ahí, sin repetir. */
  titulos: string[];
};

/** Una opción de un catálogo cerrado: la fila de `tags` o de `habilidades`. */
export type OpcionCatalogo = { id: string; nombre: string };

/**
 * Los dos catálogos cerrados, enteros (RF2.3, RF2.4.3).
 *
 * Acá sí viajan los `id`, porque son lo que `perfil_tags` y
 * `perfil_habilidades` guardan. `PerfilCompleto` sigue llevando solo nombres:
 * las pantallas que muestran tags ajenos —una vacante, la ficha del feed— no
 * tienen nada que hacer con el id, y el nombre es único en las dos tablas.
 */
export type Catalogos = {
  tags: OpcionCatalogo[];
  habilidades: OpcionCatalogo[];
};

/**
 * El resultado del test de personalidad que cargó el joven (migración 009).
 * Solo el código: el nombre sale de `TipoDePersonalidad`.
 */
export type PersonalidadDeclarada = {
  tipo: string;
  cargada_en: string;
  visible_para_empresas: boolean;
};

export type PerfilCompleto = Tabla<"perfiles"> & {
  tags: string[];
  habilidades: string[];
  formaciones: Formacion[];
  /** `null` si todavía no lo cargó. */
  personalidad: PersonalidadDeclarada | null;
};

/** Una notificación de la bandeja (RF6.1). */
export type Aviso = {
  id: string;
  tipo: string;
  mensaje: string;
  enlace: string | null;
  leida: boolean;
  creada_en: string;
};

export type PostulacionResumen = {
  id: string;
  estado: EstadoPostulacion;
  creada_en: string;
  vacante: {
    id: string;
    titulo: string;
    empresa: string;
    /** Para el color del avatar automático de la empresa. */
    empresa_id: string | null;
    empresa_logo_url: string | null;
  };
};

/**
 * De dónde salieron los datos de la pantalla.
 *
 * `supabase` es una lectura real; `ejemplo` significa que no hay credenciales,
 * que la consulta falló o que la tabla está vacía, y se está mostrando el
 * contenido de demostración. La interfaz lo avisa con `AvisoOrigen`: mostrar
 * datos inventados sin decirlo sería engañoso (§2.3 de `docs/arquitectura.md`).
 */
export type OrigenDatos = "supabase" | "ejemplo";

export type Resultado<T> = {
  datos: T;
  origen: OrigenDatos;
  /** Mensaje del error de lectura, si lo hubo. */
  error?: string;
};

// --- Lado de la empresa (Etapa 2) -------------------------------------------

/** El perfil propio de una empresa, completo, para verlo y editarlo. */
export type PerfilDeEmpresa = Pick<
  Tabla<"empresas">,
  | "id"
  | "razon_social"
  | "rut"
  | "rubro"
  | "descripcion"
  | "logo_url"
  | "sitio_web"
>;

/** Una búsqueda en el listado de «Mis búsquedas». */
export type BusquedaResumen = {
  id: string;
  titulo: string;
  tipo: TipoOportunidad;
  modalidad: Modalidad | null;
  ubicacion: string | null;
  posiciones: number;
  estado: EstadoVacante;
  creada_en: string;
  /** Todas las postulaciones, en cualquier estado. */
  postulaciones: number;
  /** Las que todavía nadie miró (`pendiente`). */
  nuevas: number;
};

/**
 * Una búsqueda completa, para el detalle y el formulario de edición.
 *
 * Los ids viajan porque son lo que se guarda en las tablas puente; los nombres,
 * porque son lo que se muestra. `tagsOcultos` y `habilidadesOcultas` solo
 * llegan acá: los lee la empresa dueña y nadie más (RF3.1.6, RNF5).
 */
export type BusquedaCompleta = BusquedaResumen & {
  descripcion: string;
  habilidades: OpcionCatalogo[];
  /** Las que pide sin publicarlas (RF3.1.6, migración 008): como `tagsOcultos`. */
  habilidadesOcultas: OpcionCatalogo[];
  tags: OpcionCatalogo[];
  tagsOcultos: OpcionCatalogo[];
};

/** Lo que la empresa ve de una persona que se postuló o se inscribió. */
export type DatosDeCandidato = {
  id: string;
  nombre_usuario: string;
  nombre: string;
  apellido: string;
  pais: string;
  bio: string | null;
  foto_url: string | null;
};

/**
 * Una postulación recibida, con lo que la persona declara.
 *
 * `persona` es `null` cuando la postulación está cancelada: quien se retira de
 * un proceso deja de compartir sus datos con esa empresa (ver
 * `candidatos_de_mi_empresa` en `db/politicas.sql`).
 */
export type PostulacionRecibida = {
  id: string;
  estado: EstadoPostulacion;
  creada_en: string;
  actualizada_en: string;
  persona: DatosDeCandidato | null;
  /** Habilidades declaradas, no acreditadas: la plataforma no acredita todavía. */
  habilidades: string[];
  tags: string[];
  formaciones: Formacion[];
};

/** Un evento de la empresa, para su listado, detalle y edición. */
export type EventoDeEmpresa = {
  id: string;
  titulo: string;
  descripcion: string;
  fecha_hora: string;
  imagen_url: string | null;
  credito?: CreditoDeFoto | null;
  estado: EstadoEvento;
  direccion: string | null;
  latitud: number | null;
  longitud: number | null;
  tags: OpcionCatalogo[];
  inscriptos: number;
};

/** Quién se inscribió a un evento. */
export type Inscripto = {
  persona: DatosDeCandidato;
  creada_en: string;
};

/** Una reseña recibida (RF7.4). Anónima: ver `obtenerReseniasRecibidas`. */
export type ReseniaRecibida = {
  id: string;
  calificacion: number;
  comentario: string;
  creada_en: string;
};

/**
 * Un postulante recomendado en el panel: una postulación propia, con la
 * búsqueda a la que se postuló, ordenada por coincidencia.
 */
export type Recomendado = {
  postulacion: PostulacionRecibida;
  busqueda: Pick<
    BusquedaCompleta,
    "id" | "titulo" | "habilidades" | "habilidadesOcultas" | "tagsOcultos"
  >;
};

/** Lo que ve una empresa en su panel (RF7). */
export type PanelDeEmpresa = {
  empresa: PerfilDeEmpresa;
  busquedas: BusquedaResumen[];
  eventos: EventoDeEmpresa[];
  recomendados: Recomendado[];
};
