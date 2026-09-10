import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { TipoOportunidad } from "@/types/database";

import {
  EVENTOS_EJEMPLO,
  PERFIL_EJEMPLO,
  POSTULACIONES_EJEMPLO,
  VACANTES_EJEMPLO,
} from "./ejemplos";
import type {
  Evento,
  PerfilCompleto,
  PostulacionResumen,
  Resultado,
  TagDePerfil,
  Vacante,
} from "./tipos";

/**
 * Capa de lectura de la aplicación.
 *
 * Cada consulta devuelve un `Resultado`: los datos y de dónde salieron. Si
 * faltan las credenciales, si la lectura falla o si la tabla está vacía, se
 * responde con el contenido de demostración y `origen: "ejemplo"`, y la
 * pantalla lo avisa. Así la interfaz se puede revisar y mostrar sin base
 * cargada, sin que eso se confunda nunca con datos reales.
 */

const SIN_CREDENCIALES =
  "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local";

const TABLA_VACIA = "La base respondió, pero todavía no tiene datos cargados";

function ejemplo<T>(datos: T, error: string): Resultado<T> {
  return { datos, origen: "ejemplo", error };
}

export type FiltrosVacantes = {
  /** Texto libre: se busca en el título de la vacante y en la empresa. */
  busqueda?: string;
  tipo?: TipoOportunidad;
  limite?: number;
};

/** RF3.5.1 — Listado de vacantes activas, de la más reciente a la más vieja. */
export async function obtenerVacantes(
  filtros: FiltrosVacantes = {},
): Promise<Resultado<Vacante[]>> {
  const { busqueda, tipo, limite = 20 } = filtros;

  const filtrarEjemplo = () =>
    VACANTES_EJEMPLO.filter((vacante) => {
      if (tipo && vacante.tipo !== tipo) return false;
      if (!busqueda) return true;

      const texto = `${vacante.titulo} ${vacante.empresa} ${vacante.tags.join(" ")}`;
      return texto.toLowerCase().includes(busqueda.toLowerCase());
    }).slice(0, limite);

  const supabase = await createClient();
  if (!supabase) return ejemplo(filtrarEjemplo(), SIN_CREDENCIALES);

  let consulta = supabase
    .from("vacantes_feed")
    .select("*")
    .eq("estado", "activa")
    .order("publicada_en", { ascending: false })
    .limit(limite);

  if (tipo) consulta = consulta.eq("tipo", tipo);
  if (busqueda) consulta = consulta.ilike("titulo", `%${busqueda}%`);

  const { data, error } = await consulta;

  if (error) return ejemplo(filtrarEjemplo(), error.message);
  if (!data || data.length === 0) {
    return ejemplo(filtrarEjemplo(), TABLA_VACIA);
  }

  return { datos: data, origen: "supabase" };
}

/** RF4.4.1 — Agenda de eventos publicados, del más próximo en adelante. */
export async function obtenerEventos(
  limite = 12,
): Promise<Resultado<Evento[]>> {
  const supabase = await createClient();
  if (!supabase) {
    return ejemplo(EVENTOS_EJEMPLO.slice(0, limite), SIN_CREDENCIALES);
  }

  const { data, error } = await supabase
    .from("eventos_agenda")
    .select("*")
    .eq("estado", "publicado")
    .gte("inicia_en", new Date().toISOString())
    .order("inicia_en", { ascending: true })
    .limit(limite);

  if (error) return ejemplo(EVENTOS_EJEMPLO.slice(0, limite), error.message);
  if (!data || data.length === 0) {
    return ejemplo(EVENTOS_EJEMPLO.slice(0, limite), TABLA_VACIA);
  }

  return { datos: data, origen: "supabase" };
}

/**
 * RF2.1 — Perfil de la sesión activa, con sus tags y su formación.
 *
 * Sin sesión iniciada devuelve el perfil de demostración: la pantalla se puede
 * recorrer entera antes de que exista el módulo de autenticación (RF1.3).
 */
export async function obtenerPerfilActual(): Promise<
  Resultado<PerfilCompleto>
> {
  const supabase = await createClient();
  if (!supabase) return ejemplo(PERFIL_EJEMPLO, SIN_CREDENCIALES);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return ejemplo(PERFIL_EJEMPLO, "No hay una sesión iniciada");

  const { data: perfil, error } = await supabase
    .from("perfiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) return ejemplo(PERFIL_EJEMPLO, error.message);
  if (!perfil) {
    return ejemplo(PERFIL_EJEMPLO, "La sesión todavía no tiene perfil creado");
  }

  const [{ data: filasTags }, { data: formaciones }] = await Promise.all([
    supabase
      .from("perfil_tags")
      .select("nivel, tag_id")
      .eq("perfil_id", user.id),
    supabase
      .from("formaciones")
      .select("*")
      .eq("perfil_id", user.id)
      .order("anio_inicio", { ascending: false }),
  ]);

  const idsDeTags = (filasTags ?? []).map((fila) => fila.tag_id);
  const { data: catalogo } = idsDeTags.length
    ? await supabase
        .from("tags")
        .select("id, slug, nombre, categoria")
        .in("id", idsDeTags)
    : { data: [] };

  const nivelPorTag = new Map(
    (filasTags ?? []).map((fila) => [fila.tag_id, fila.nivel]),
  );

  const tags: TagDePerfil[] = (catalogo ?? []).map((tag) => ({
    slug: tag.slug,
    nombre: tag.nombre,
    categoria: tag.categoria,
    nivel: nivelPorTag.get(tag.id) ?? 3,
  }));

  return {
    datos: {
      ...perfil,
      tags,
      formaciones: (formaciones ?? []).map(({ ...formacion }) => formacion),
    },
    origen: "supabase",
  };
}

/** RF3.7 — Postulaciones propias con su estado actual. */
export async function obtenerPostulaciones(): Promise<
  Resultado<PostulacionResumen[]>
> {
  const supabase = await createClient();
  if (!supabase) return ejemplo(POSTULACIONES_EJEMPLO, SIN_CREDENCIALES);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return ejemplo(POSTULACIONES_EJEMPLO, "No hay una sesión iniciada");

  const { data, error } = await supabase
    .from("postulaciones")
    .select("id, estado, creado_en, vacante_id")
    .eq("perfil_id", user.id)
    .order("creado_en", { ascending: false });

  if (error) return ejemplo(POSTULACIONES_EJEMPLO, error.message);
  if (!data || data.length === 0) return { datos: [], origen: "supabase" };

  const { data: vacantes } = await supabase
    .from("vacantes_feed")
    .select("id, titulo, empresa, empresa_logo_url")
    .in(
      "id",
      data.map((postulacion) => postulacion.vacante_id),
    );

  const porId = new Map(
    (vacantes ?? []).map((vacante) => [vacante.id, vacante]),
  );

  return {
    datos: data.map((postulacion) => {
      const vacante = porId.get(postulacion.vacante_id);

      return {
        id: postulacion.id,
        estado: postulacion.estado,
        creado_en: postulacion.creado_en,
        vacante: {
          id: postulacion.vacante_id,
          titulo: vacante?.titulo ?? "Vacante dada de baja",
          empresa: vacante?.empresa ?? "—",
          empresa_logo_url: vacante?.empresa_logo_url ?? null,
        },
      };
    }),
    origen: "supabase",
  };
}

/** Ids de las vacantes a las que ya se postuló la sesión activa (RF3.6.2). */
export async function obtenerVacantesPostuladas(): Promise<Set<string>> {
  const supabase = await createClient();
  if (!supabase) return new Set();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return new Set();

  const { data } = await supabase
    .from("postulaciones")
    .select("vacante_id")
    .eq("perfil_id", user.id);

  return new Set((data ?? []).map((fila) => fila.vacante_id));
}
