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

export const ESTADOS_VACANTE = ["activa", "cerrada"] as const;
export type EstadoVacante = (typeof ESTADOS_VACANTE)[number];

export const ESTADOS_POSTULACION = [
  "pendiente",
  "en_revision",
  "aceptada",
  "rechazada",
  "cancelada",
] as const;
export type EstadoPostulacion = (typeof ESTADOS_POSTULACION)[number];

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
  estado: EstadoEvento;
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

export type PerfilCompleto = Tabla<"perfiles"> & {
  tags: string[];
  habilidades: string[];
  formaciones: Formacion[];
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
