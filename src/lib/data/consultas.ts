import "server-only";

import { redirect } from "next/navigation";

import { Institucion } from "@/lib/dominio/Institucion";
import { createClient } from "@/lib/supabase/server";

import {
  type ClienteSupabase,
  ejemplo,
  nombresDe,
  resolverUsuarioId,
  SIN_CREDENCIALES,
  SIN_SESION,
  TABLA_VACIA,
} from "./comun";

// Sigue saliendo de acá para no tocar a quien ya lo importa de este módulo.
export { obtenerUsuarioId } from "./comun";

import {
  AVISOS_EJEMPLO,
  EMPRESAS_EJEMPLO,
  CATALOGOS_EJEMPLO,
  EVENTOS_EJEMPLO,
  PERFIL_EJEMPLO,
  POSTULACIONES_EJEMPLO,
  VACANTES_EJEMPLO,
} from "./ejemplos";
import {
  type Catalogos,
  comoEstadoEvento,
  comoEstadoFormacion,
  comoEstadoPostulacion,
  comoEstadoVacante,
  comoModalidad,
  comoTipoCuenta,
  comoTipoOportunidad,
  type Aviso,
  type EmpresaResumen,
  type FichaDeInstitucion,
  type TipoCuenta,
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

/**
 * En qué mitad de la aplicación vive la sesión, o `null` si no hay ninguna.
 *
 * La cabecera y el pie aparecen en todas las pantallas, incluidas las
 * públicas, así que necesitan saberlo para no ofrecerle a una cuenta de
 * empresa enlaces a secciones del postulante que el middleware le va a
 * rebotar.
 */
export async function obtenerTipoCuenta(
  usuarioId?: string,
): Promise<TipoCuenta | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const id = await resolverUsuarioId(supabase, usuarioId);
  if (!id) return null;

  const { data } = await supabase
    .from("cuentas")
    .select("tipo")
    .eq("id", id)
    .maybeSingle();

  return data ? comoTipoCuenta(data.tipo) : null;
}

/**
 * Las organizaciones que ya publican en LinkYouth, para la portada.
 *
 * Lectura pública: `empresas_lectura_publica` habilita el select a cualquiera
 * y `cuenta_activa` deja fuera a las dadas de baja. No hace falta sesión, que
 * es justamente el punto: esta consulta la hace alguien que todavía no se
 * registró.
 */
export async function obtenerEmpresas(
  limite = 12,
): Promise<Resultado<EmpresaResumen[]>> {
  const supabase = await createClient();
  if (!supabase) return ejemplo(EMPRESAS_EJEMPLO, SIN_CREDENCIALES);

  const { data, error } = await supabase
    .from("empresas")
    .select("id, razon_social, rubro, logo_url")
    .order("razon_social")
    .limit(limite);

  if (error) return ejemplo(EMPRESAS_EJEMPLO, error.message);
  if (!data || data.length === 0) return ejemplo(EMPRESAS_EJEMPLO, TABLA_VACIA);

  return { datos: data, origen: "supabase" };
}

const EMPRESA = "empresas ( id, razon_social, rubro, logo_url )";

// --- Vacantes ---------------------------------------------------------------

export type FiltrosVacantes = {
  /** Texto libre. Se busca en el título de la vacante. */
  busqueda?: string;
  tipo?: TipoOportunidad;
  limite?: number;
};

/**
 * Lo que se lee de una vacante, para el listado y para el detalle.
 *
 * Una sola definición a propósito: si el detalle armara su propio `select`,
 * tarde o temprano mostraría algo distinto de la fila de la que se llegó.
 */
function consultarVacantes(supabase: ClienteSupabase) {
  return supabase
    .from("vacantes")
    .select(
      `id, titulo, descripcion, tipo, posiciones, estado, modalidad, ubicacion,
       creada_en,
       ${EMPRESA},
       vacante_tags_publicos ( tags ( nombre ) ),
       vacante_habilidades ( habilidades ( nombre ) )`,
    )
    .eq("estado", "activa");
}

type FilaVacante = NonNullable<
  Awaited<ReturnType<typeof consultarVacantes>>["data"]
>[number];

function comoVacante(fila: FilaVacante): Vacante | null {
  // La empresa es obligatoria en el esquema, pero si su cuenta fue dada de
  // baja la política `empresas_lectura_publica` la deja fuera del join.
  if (!fila.empresas) return null;

  return {
    id: fila.id,
    titulo: fila.titulo,
    descripcion: fila.descripcion,
    tipo: comoTipoOportunidad(fila.tipo),
    posiciones: fila.posiciones,
    estado: comoEstadoVacante(fila.estado),
    modalidad: comoModalidad(fila.modalidad),
    ubicacion: fila.ubicacion,
    creada_en: fila.creada_en,
    empresa: fila.empresas,
    tags: nombresDe(fila.vacante_tags_publicos, "tags"),
    habilidades: nombresDe(fila.vacante_habilidades, "habilidades"),
  };
}

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

  let consulta = consultarVacantes(supabase)
    .order("creada_en", { ascending: false })
    .limit(limite);

  if (tipo) consulta = consulta.eq("tipo", tipo);
  if (busqueda) consulta = consulta.ilike("titulo", `%${busqueda}%`);

  const { data, error } = await consulta;

  if (error) return ejemplo(filtrarEjemplo(), error.message);
  if (!data || data.length === 0) return ejemplo(filtrarEjemplo(), TABLA_VACIA);

  const vacantes = data.flatMap((fila) => comoVacante(fila) ?? []);

  return { datos: vacantes, origen: "supabase" };
}

/**
 * RF3.5.3 — Una vacante activa, para su pantalla de detalle, o `null` si no
 * existe o ya no está activa.
 *
 * Los ids de `ejemplos.ts` se resuelven contra el contenido de demostración:
 * son los que muestra el listado cuando la base está vacía, y el detalle tiene
 * que abrir igual que la fila de la que se llegó.
 */
export async function obtenerVacante(
  id: string,
): Promise<Resultado<Vacante> | null> {
  const deEjemplo = VACANTES_EJEMPLO.find((vacante) => vacante.id === id);
  if (deEjemplo) return ejemplo(deEjemplo, TABLA_VACIA);

  const supabase = await createClient();
  if (!supabase) return null;

  // Un id que no es un UUID haría fallar la consulta con un error de tipo en
  // vez de no encontrar nada. Para quien mira es lo mismo: esa vacante no está.
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;

  const { data } = await consultarVacantes(supabase).eq("id", id).maybeSingle();
  const vacante = data ? comoVacante(data) : null;

  return vacante ? { datos: vacante, origen: "supabase" } : null;
}

// --- Eventos ----------------------------------------------------------------

function consultarEventos(supabase: ClienteSupabase) {
  return supabase.from("eventos").select(
    `id, titulo, descripcion, fecha_hora, imagen_url, estado,
     direccion, latitud, longitud,
     ${EMPRESA},
     evento_tags ( tags ( nombre ) )`,
  );
}

type FilaDeEvento = NonNullable<
  Awaited<ReturnType<typeof consultarEventos>>["data"]
>[number];

/** La fila de la base como `Evento`, o `null` si su empresa no se ve. */
function comoEvento(fila: FilaDeEvento): Evento | null {
  if (!fila.empresas) return null;
  return {
    id: fila.id,
    titulo: fila.titulo,
    descripcion: fila.descripcion,
    fecha_hora: fila.fecha_hora,
    imagen_url: fila.imagen_url,
    estado: comoEstadoEvento(fila.estado),
    direccion: fila.direccion,
    // `numeric` llega como número o como texto según el driver: se fija.
    latitud: fila.latitud === null ? null : Number(fila.latitud),
    longitud: fila.longitud === null ? null : Number(fila.longitud),
    empresa: fila.empresas,
    tags: nombresDe(fila.evento_tags, "tags"),
  };
}

/** RF4.4.1 — Eventos activos que todavía no ocurrieron, del más próximo. */
export async function obtenerEventos(
  limite = 12,
): Promise<Resultado<Evento[]>> {
  const supabase = await createClient();
  if (!supabase) {
    return ejemplo(EVENTOS_EJEMPLO.slice(0, limite), SIN_CREDENCIALES);
  }

  const { data, error } = await consultarEventos(supabase)
    .eq("estado", "activo")
    .gte("fecha_hora", new Date().toISOString())
    .order("fecha_hora", { ascending: true })
    .limit(limite);

  if (error) return ejemplo(EVENTOS_EJEMPLO.slice(0, limite), error.message);
  if (!data || data.length === 0) {
    return ejemplo(EVENTOS_EJEMPLO.slice(0, limite), TABLA_VACIA);
  }

  const eventos = data.flatMap((fila) => comoEvento(fila) ?? []);
  return { datos: eventos, origen: "supabase" };
}

/**
 * RF4.4 — Un evento para su pantalla de detalle, o `null` si no existe o no
 * se ve. La política de `eventos` deja ver los activos (también los que ya
 * pasaron) y, a la empresa dueña, los suyos cancelados.
 *
 * Igual que `obtenerVacante`: los ids de `ejemplos.ts` abren el contenido de
 * demostración, que es lo que muestra el listado cuando la base está vacía.
 */
export async function obtenerEvento(
  id: string,
): Promise<Resultado<Evento> | null> {
  const deEjemplo = EVENTOS_EJEMPLO.find((evento) => evento.id === id);
  if (deEjemplo) return ejemplo(deEjemplo, TABLA_VACIA);

  const supabase = await createClient();
  if (!supabase) return null;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;

  const { data } = await consultarEventos(supabase).eq("id", id).maybeSingle();
  const evento = data ? comoEvento(data) : null;

  return evento ? { datos: evento, origen: "supabase" } : null;
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

/**
 * RF2.3 y RF2.4.3 — Los dos catálogos cerrados, enteros.
 *
 * Se traen completos y sin filtrar: son 36 tags y 20 habilidades, y a ese
 * tamaño una lectura de cada tabla cuesta menos que un buscador con paginado
 * que después hay que mantener. Si el catálogo creciera a varios cientos, esto
 * es lo primero que hay que cambiar.
 *
 * `db/politicas.sql` le da lectura pública a las dos tablas y no le da
 * escritura a nadie: el catálogo se carga por seed, no lo amplía el usuario.
 */
export async function obtenerCatalogos(): Promise<Resultado<Catalogos>> {
  const supabase = await createClient();
  if (!supabase) return ejemplo(CATALOGOS_EJEMPLO, SIN_CREDENCIALES);

  const [consultaTags, consultaHabilidades] = await Promise.all([
    supabase.from("tags").select("id, nombre").order("nombre"),
    supabase.from("habilidades").select("id, nombre").order("nombre"),
  ]);

  const error = consultaTags.error ?? consultaHabilidades.error;
  if (error) return ejemplo(CATALOGOS_EJEMPLO, error.message);

  const tags = consultaTags.data ?? [];
  const habilidades = consultaHabilidades.data ?? [];

  // Sin catálogo no hay nada que elegir, y una lista vacía sin explicación
  // parece una pantalla rota. Se avisa con `AvisoOrigen` como cualquier otra
  // lectura que no llegó a los datos reales.
  if (tags.length === 0 || habilidades.length === 0) {
    return ejemplo(CATALOGOS_EJEMPLO, TABLA_VACIA);
  }

  return { datos: { tags, habilidades }, origen: "supabase" };
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
       vacantes ( id, titulo, empresas ( id, razon_social, logo_url ) )`,
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
        empresa_id: fila.vacantes?.empresas?.id ?? null,
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

// --- Avisos -----------------------------------------------------------------

/**
 * RF6.1 — Bandeja de notificaciones de la sesión activa.
 *
 * Las filas las crea el disparador `postulaciones_notificar_cambio` de
 * `db/schema.sql`, nunca el cliente: `notificaciones` no tiene política de
 * insert, así que ningún navegador puede fabricar un aviso.
 */
export async function obtenerAvisos(
  usuarioId?: string,
  limite = 30,
): Promise<Resultado<Aviso[]>> {
  const supabase = await createClient();
  if (!supabase) return ejemplo(AVISOS_EJEMPLO, SIN_CREDENCIALES);

  const id = await resolverUsuarioId(supabase, usuarioId);
  if (!id) return ejemplo(AVISOS_EJEMPLO, SIN_SESION);

  const { data, error } = await supabase
    .from("notificaciones")
    .select("id, tipo, mensaje, enlace, leida, creada_en")
    .eq("cuenta_id", id)
    .order("creada_en", { ascending: false })
    .limit(limite);

  if (error) return ejemplo(AVISOS_EJEMPLO, error.message);

  return { datos: data ?? [], origen: "supabase" };
}

// --- Identidad de la sesión -------------------------------------------------

/** Lo que hace falta para dibujar el avatar de quien tiene la sesión. */
export type IdentidadDeSesion = {
  id: string;
  nombre: string;
  url: string | null;
  forma: "redondo" | "cuadrado";
};

/**
 * Nombre y foto (o logo) de la sesión, para el avatar del menú de la cuenta.
 * Joven: nombre y apellido con su foto; empresa: razón social con su logo.
 * `null` sin sesión o sin base. Cada política deja leer la fila propia.
 */
export async function obtenerIdentidadDeSesion(): Promise<IdentidadDeSesion | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const id = await resolverUsuarioId(supabase);
  if (!id) return null;

  const [{ data: perfil }, { data: empresa }] = await Promise.all([
    supabase
      .from("perfiles")
      .select("nombre, apellido, foto_url")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("empresas")
      .select("razon_social, logo_url")
      .eq("id", id)
      .maybeSingle(),
  ]);

  if (perfil) {
    return {
      id,
      nombre: `${perfil.nombre} ${perfil.apellido}`.trim(),
      url: perfil.foto_url,
      forma: "redondo",
    };
  }
  if (empresa) {
    return {
      id,
      nombre: empresa.razon_social,
      url: empresa.logo_url,
      forma: "cuadrado",
    };
  }
  return null;
}

/**
 * RF6.1 — Cuántos avisos sin leer tiene la sesión, para el contador de la
 * campana. Sirve para las dos cuentas: la política
 * `notificaciones_veo_las_mias` ya acota a los propios. Sin sesión o sin base,
 * cero: la campana no anuncia avisos de ejemplo.
 */
export async function contarAvisosSinLeer(usuarioId?: string): Promise<number> {
  const supabase = await createClient();
  if (!supabase) return 0;

  const id = await resolverUsuarioId(supabase, usuarioId);
  if (!id) return 0;

  const { count } = await supabase
    .from("notificaciones")
    .select("id", { count: "exact", head: true })
    .eq("cuenta_id", id)
    .eq("leida", false);

  return count ?? 0;
}

// --- Instituciones ----------------------------------------------------------

/**
 * Ficha de una institución educativa, armada desde `formaciones`.
 *
 * No hay tabla de instituciones: el nombre es texto libre en la formación de
 * cada perfil (ver `src/lib/dominio/Institucion.ts`). Así que la ficha se
 * reconstruye agrupando por nombre, y el identificador de la URL se compara
 * contra el derivado de cada uno.
 *
 * Se trae la columna entera y se agrupa en memoria en vez de filtrar en la
 * base: el identificador es una transformación del nombre que Postgres no
 * conoce, así que no hay `where` que escribir. Con el tamaño de `formaciones`
 * hoy es barato; cuando deje de serlo, la salida es la tabla de instituciones,
 * no una consulta más astuta.
 *
 * Devuelve `null` cuando ningún nombre corresponde a ese identificador. Quien
 * llama decide si eso es un 404.
 */
export async function obtenerInstitucion(
  id: string,
): Promise<Resultado<FichaDeInstitucion | null>> {
  const supabase = await createClient();
  if (!supabase) return ejemplo(null, SIN_CREDENCIALES);

  // `formaciones_publicas` y no `formaciones`: desde H1 cada sesión lee solo
  // las formaciones propias (y una empresa, las de sus postulantes). La vista
  // trae institución y título de todas, sin decir de quién son.
  const { data, error } = await supabase
    .from("formaciones_publicas")
    .select("institucion, titulo");

  if (error) return ejemplo(null, error.message);

  // Las columnas de una vista llegan anulables en los tipos, aunque en la
  // tabla no lo sean.
  const suyas = (data ?? [])
    .flatMap(({ institucion, titulo }) =>
      institucion !== null && titulo !== null ? [{ institucion, titulo }] : [],
    )
    .filter((formacion) =>
      new Institucion(formacion.institucion).correspondeA(id),
    );

  if (suyas.length === 0) return { datos: null, origen: "supabase" };

  return {
    datos: {
      id,
      nombre: suyas[0].institucion,
      estudiantes: suyas.length,
      titulos: [...new Set(suyas.map((formacion) => formacion.titulo))].sort(),
    },
    origen: "supabase",
  };
}
