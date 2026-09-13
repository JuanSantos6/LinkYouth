import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import {
  EVENTOS_EJEMPLO,
  PERFIL_EJEMPLO,
  POSTULACIONES_EJEMPLO,
  VACANTES_EJEMPLO,
} from "./ejemplos";
import {
  comoEstadoEvento,
  comoEstadoFormacion,
  comoEstadoPostulacion,
  comoEstadoVacante,
  comoTipoOportunidad,
  type Evento,
  type PerfilCompleto,
  type PostulacionResumen,
  type Resultado,
  type TipoOportunidad,
  type Vacante,
} from "./tipos";

/**
 * Capa de lectura, escrita contra `db/schema.sql`.
 *
 * Cada consulta devuelve un `Resultado`: los datos y de dónde salieron. Si
 * faltan las credenciales, si la lectura falla o si la tabla está vacía, se
 * responde con el contenido de `ejemplos.ts` y `origen: "ejemplo"`, y la
 * pantalla lo anuncia con `AvisoOrigen`.
 *
 * Ninguna consulta de este archivo toca `vacante_tags_ocultos` (RF3.1.6,
 * RNF5). Tampoco hace falta que lo evite a mano: la política de RLS ya se lo
 * impide a cualquier sesión que no sea la empresa dueña de la vacante.
 */

type ClienteSupabase = NonNullable<Awaited<ReturnType<typeof createClient>>>;

const SIN_CREDENCIALES =
  "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local";

const TABLA_VACIA = "La base respondió, pero todavía no tiene datos cargados";

const SIN_SESION = "No hay una sesión iniciada";

function ejemplo<T>(datos: T, error: string): Resultado<T> {
  return { datos, origen: "ejemplo", error };
}

/** Aplana `tabla_puente ( catalogo ( nombre ) )` a una lista de nombres. */
function nombresDe<C extends string>(
  filas: { [K in C]: { nombre: string } | null }[] | null,
  catalogo: C,
): string[] {
  return (filas ?? [])
    .map((fila) => fila[catalogo]?.nombre)
    .filter((nombre): nombre is string => Boolean(nombre))
    .sort((a, b) => a.localeCompare(b, "es"));
}

/**
 * Id del usuario de la sesión, o `null` si no hay ninguna.
 *
 * Cada llamada a `auth.getUser()` es un viaje de red al servidor de auth
 * (~240 ms medidos). Una pantalla que pide varias lecturas las pagaba todas:
 * `/inicio` hacía cinco validaciones de la misma sesión para una sola
 * navegación. Las páginas resuelven el usuario una vez con esta función y se lo
 * pasan a las consultas.
 */
export async function obtenerUsuarioId(): Promise<string | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

/**
 * Devuelve el id recibido, o lo resuelve contra el servidor de auth si no vino.
 *
 * El parámetro es opcional a propósito: las consultas se llaman también desde
 * pantallas que solo necesitan una, donde resolver la sesión por su cuenta es
 * lo correcto y ahorra ceremonia. Quien pide varias lo resuelve una vez y lo
 * pasa.
 */
async function resolverUsuarioId(
  supabase: ClienteSupabase,
  usuarioId?: string,
): Promise<string | null> {
  if (usuarioId) return usuarioId;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

const EMPRESA = "empresas ( id, razon_social, rubro, logo_url )";

// --- Vacantes ---------------------------------------------------------------

export type FiltrosVacantes = {
  /** Texto libre. Se busca en el título de la vacante. */
  busqueda?: string;
  tipo?: TipoOportunidad;
  limite?: number;
};

/** RF3.5.1 — Vacantes activas, de la más reciente a la más vieja. */
export async function obtenerVacantes(
  filtros: FiltrosVacantes = {},
): Promise<Resultado<Vacante[]>> {
  const { busqueda, tipo, limite = 20 } = filtros;

  const filtrarEjemplo = () =>
    VACANTES_EJEMPLO.filter((vacante) => {
      if (tipo && vacante.tipo !== tipo) return false;
      if (!busqueda) return true;

      return vacante.titulo.toLowerCase().includes(busqueda.toLowerCase());
    }).slice(0, limite);

  const supabase = await createClient();
  if (!supabase) return ejemplo(filtrarEjemplo(), SIN_CREDENCIALES);

  let consulta = supabase
    .from("vacantes")
    .select(
      `id, titulo, descripcion, tipo, posiciones, estado, creada_en,
       ${EMPRESA},
       vacante_tags_publicos ( tags ( nombre ) ),
       vacante_habilidades ( habilidades ( nombre ) )`,
    )
    .eq("estado", "activa")
    .order("creada_en", { ascending: false })
    .limit(limite);

  if (tipo) consulta = consulta.eq("tipo", tipo);
  if (busqueda) consulta = consulta.ilike("titulo", `%${busqueda}%`);

  const { data, error } = await consulta;

  if (error) return ejemplo(filtrarEjemplo(), error.message);
  if (!data || data.length === 0) return ejemplo(filtrarEjemplo(), TABLA_VACIA);

  const vacantes: Vacante[] = data.flatMap((fila) => {
    // La empresa es obligatoria en el esquema, pero si su cuenta fue dada de
    // baja la política `empresas_lectura_publica` la deja fuera del join.
    if (!fila.empresas) return [];

    return [
      {
        id: fila.id,
        titulo: fila.titulo,
        descripcion: fila.descripcion,
        tipo: comoTipoOportunidad(fila.tipo),
        posiciones: fila.posiciones,
        estado: comoEstadoVacante(fila.estado),
        creada_en: fila.creada_en,
        empresa: fila.empresas,
        tags: nombresDe(fila.vacante_tags_publicos, "tags"),
        habilidades: nombresDe(fila.vacante_habilidades, "habilidades"),
      },
    ];
  });

  return { datos: vacantes, origen: "supabase" };
}

// --- Eventos ----------------------------------------------------------------

/** RF4.4.1 — Eventos activos que todavía no ocurrieron, del más próximo. */
export async function obtenerEventos(
  limite = 12,
): Promise<Resultado<Evento[]>> {
  const supabase = await createClient();
  if (!supabase) {
    return ejemplo(EVENTOS_EJEMPLO.slice(0, limite), SIN_CREDENCIALES);
  }

  const { data, error } = await supabase
    .from("eventos")
    .select(
      `id, titulo, descripcion, fecha_hora, imagen_url, estado,
       ${EMPRESA},
       evento_tags ( tags ( nombre ) )`,
    )
    .eq("estado", "activo")
    .gte("fecha_hora", new Date().toISOString())
    .order("fecha_hora", { ascending: true })
    .limit(limite);

  if (error) return ejemplo(EVENTOS_EJEMPLO.slice(0, limite), error.message);
  if (!data || data.length === 0) {
    return ejemplo(EVENTOS_EJEMPLO.slice(0, limite), TABLA_VACIA);
  }

  const eventos: Evento[] = data.flatMap((fila) => {
    if (!fila.empresas) return [];

    return [
      {
        id: fila.id,
        titulo: fila.titulo,
        descripcion: fila.descripcion,
        fecha_hora: fila.fecha_hora,
        imagen_url: fila.imagen_url,
        estado: comoEstadoEvento(fila.estado),
        empresa: fila.empresas,
        tags: nombresDe(fila.evento_tags, "tags"),
      },
    ];
  });

  return { datos: eventos, origen: "supabase" };
}

// --- Perfil -----------------------------------------------------------------

/**
 * RF2.1 — Perfil de la sesión activa, con sus tags, habilidades y formación.
 *
 * Sin credenciales de Supabase devuelve el perfil de demostración: sin base no
 * hay sesión posible y la aplicación tiene que poder recorrerse igual (§2.3).
 *
 * Con Supabase configurado y sin sesión, en cambio, manda a `/login`. Antes
 * devolvía `PERFIL_EJEMPLO` también en ese caso, que desde que existe el login
 * (RF1.3) significa mostrarle a un desconocido un perfil inventado como si
 * fuera el suyo. El middleware ya corta ese request antes de llegar acá; esto
 * es la segunda barrera, para cualquier llamada que no venga de una pantalla.
 */
export async function obtenerPerfilActual(
  usuarioId?: string,
): Promise<Resultado<PerfilCompleto>> {
  const supabase = await createClient();
  if (!supabase) return ejemplo(PERFIL_EJEMPLO, SIN_CREDENCIALES);

  const id = await resolverUsuarioId(supabase, usuarioId);
  if (!id) redirect("/login");

  const { data, error } = await supabase
    .from("perfiles")
    .select(
      `id, nombre_usuario, nombre, apellido, fecha_nacimiento, pais, bio,
       foto_url, creado_en,
       perfil_tags ( tags ( nombre ) ),
       perfil_habilidades ( habilidades ( nombre ) ),
       formaciones ( id, institucion, titulo, estado )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) return ejemplo(PERFIL_EJEMPLO, error.message);
  if (!data) {
    return ejemplo(PERFIL_EJEMPLO, "La sesión todavía no tiene perfil creado");
  }

  const { perfil_tags, perfil_habilidades, formaciones, ...perfil } = data;

  return {
    datos: {
      ...perfil,
      tags: nombresDe(perfil_tags, "tags"),
      habilidades: nombresDe(perfil_habilidades, "habilidades"),
      formaciones: (formaciones ?? []).map((formacion) => ({
        id: formacion.id,
        institucion: formacion.institucion,
        titulo: formacion.titulo,
        estado: comoEstadoFormacion(formacion.estado),
      })),
    },
    origen: "supabase",
  };
}

// --- Postulaciones ----------------------------------------------------------

/** RF3.7 — Postulaciones propias con su estado actual. */
export async function obtenerPostulaciones(
  usuarioId?: string,
): Promise<Resultado<PostulacionResumen[]>> {
  const supabase = await createClient();
  if (!supabase) return ejemplo(POSTULACIONES_EJEMPLO, SIN_CREDENCIALES);

  const id = await resolverUsuarioId(supabase, usuarioId);
  if (!id) return ejemplo(POSTULACIONES_EJEMPLO, SIN_SESION);

  const { data, error } = await supabase
    .from("postulaciones")
    .select(
      `id, estado, creada_en,
       vacantes ( id, titulo, empresas ( razon_social, logo_url ) )`,
    )
    .eq("perfil_id", id)
    .order("creada_en", { ascending: false });

  if (error) return ejemplo(POSTULACIONES_EJEMPLO, error.message);
  if (!data) return { datos: [], origen: "supabase" };

  return {
    datos: data.map((fila) => ({
      id: fila.id,
      estado: comoEstadoPostulacion(fila.estado),
      creada_en: fila.creada_en,
      vacante: {
        id: fila.vacantes?.id ?? "",
        titulo: fila.vacantes?.titulo ?? "Vacante dada de baja",
        empresa: fila.vacantes?.empresas?.razon_social ?? "—",
        empresa_logo_url: fila.vacantes?.empresas?.logo_url ?? null,
      },
    })),
    origen: "supabase",
  };
}

/**
 * Ids de las vacantes a las que ya se postuló la sesión activa (RF3.6.2).
 *
 * Incluye también las canceladas: la restricción única de `postulaciones` es
 * por (vacante, perfil) sin mirar el estado, así que un segundo intento sobre
 * la misma vacante falla igual.
 */
export async function obtenerVacantesPostuladas(
  usuarioId?: string,
): Promise<Set<string>> {
  const supabase = await createClient();
  if (!supabase) return new Set();

  const id = await resolverUsuarioId(supabase, usuarioId);
  if (!id) return new Set();

  const { data } = await supabase
    .from("postulaciones")
    .select("vacante_id")
    .eq("perfil_id", id);

  return new Set((data ?? []).map((fila) => fila.vacante_id));
}

/** Ids de los eventos a los que ya está inscripta la sesión activa (RF4.5). */
export async function obtenerEventosInscriptos(
  usuarioId?: string,
): Promise<Set<string>> {
  const supabase = await createClient();
  if (!supabase) return new Set();

  const id = await resolverUsuarioId(supabase, usuarioId);
  if (!id) return new Set();

  const { data } = await supabase
    .from("inscripciones_evento")
    .select("evento_id")
    .eq("perfil_id", id);

  return new Set((data ?? []).map((fila) => fila.evento_id));
}
