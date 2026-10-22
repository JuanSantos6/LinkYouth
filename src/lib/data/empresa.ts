import "server-only";

import { redirect } from "next/navigation";

import { rutaDeImagen } from "@/lib/supabase/rutaDeImagen";
import { createClient } from "@/lib/supabase/server";

import {
  type ClienteSupabase,
  ejemplo,
  nombresDe,
  resolverUsuarioId,
  SIN_CREDENCIALES,
} from "./comun";
import {
  BUSQUEDAS_EJEMPLO,
  EMPRESA_PROPIA_EJEMPLO,
  EVENTOS_DE_EMPRESA_EJEMPLO,
  INSCRIPTOS_EJEMPLO,
  POSTULACIONES_RECIBIDAS_EJEMPLO,
  RESENIAS_EJEMPLO,
} from "./ejemplos";
import { conCreditos } from "./fotos";
import {
  type BusquedaCompleta,
  comoEstadoEvento,
  comoEstadoFormacion,
  comoEstadoPostulacion,
  comoEstadoVacante,
  comoModalidad,
  comoTipoOportunidad,
  type DatosDeCandidato,
  type EventoDeEmpresa,
  type Inscripto,
  type OpcionCatalogo,
  type PanelDeEmpresa,
  type PerfilDeEmpresa,
  type PostulacionRecibida,
  type Recomendado,
  type ReseniaRecibida,
  type Resultado,
} from "./tipos";

/**
 * Capa de lectura del lado de la empresa (Etapa 2, RF3.1–RF3.4, RF4, RF7).
 *
 * Mismo contrato que `consultas.ts`: cada lectura devuelve un `Resultado`, y
 * sin credenciales responde con el contenido de demostración de `ejemplos.ts`.
 * La diferencia es la sesión: sin sesión no hay panel que mostrar, así que se
 * manda a `/login` (el middleware ya lo hace; esto es la red de abajo).
 *
 * Nada de acá filtra por empresa a mano para decidir qué se ve: lo decide RLS.
 * Los `.eq("empresa_id", …)` ordenan la consulta —sin ellos, una empresa
 * también vería las búsquedas activas de las demás, que son públicas— pero no
 * son el control de acceso.
 *
 * Sobre las personas: `perfiles` no se lee directo (solo deja ver la fila
 * propia). Nombre, foto, bio y país salen de `candidatos_de_mi_empresa`, que
 * los devuelve solo para quien se postuló o se inscribió a algo de esta
 * empresa. Habilidades, intereses y formación salen de sus tablas, que desde
 * H1 la empresa puede leer de sus postulantes y de nadie más.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Un id de ruta que no es un UUID haría fallar la consulta en vez de no encontrar nada. */
function esUuid(id: string): boolean {
  return UUID.test(id);
}

const SIN_EMPRESA =
  "La sesión todavía no tiene una empresa creada. Si te registraste recién, iniciá sesión de nuevo para terminar el alta";

/** Cliente y empresa de la sesión, o el motivo por el que no hay. */
async function sesion(
  usuarioId?: string,
): Promise<{ supabase: ClienteSupabase; id: string } | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const id = await resolverUsuarioId(supabase, usuarioId);
  if (!id) redirect("/login");

  return { supabase, id };
}

/** Aplana `puente ( catalogo ( id, nombre ) )` a opciones, ordenadas. */
function opcionesDe<C extends string>(
  filas: { [K in C]: { id: string; nombre: string } | null }[] | null,
  catalogo: C,
): OpcionCatalogo[] {
  return (filas ?? [])
    .map((fila) => fila[catalogo])
    .filter((opcion): opcion is OpcionCatalogo => Boolean(opcion))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

// --- Perfil de empresa ------------------------------------------------------

const COLUMNAS_EMPRESA =
  "id, razon_social, rut, rubro, descripcion, logo_url, sitio_web";

/** RF7.1 — El perfil de la empresa de la sesión. */
export async function obtenerEmpresaPropia(
  usuarioId?: string,
): Promise<Resultado<PerfilDeEmpresa>> {
  const s = await sesion(usuarioId);
  if (!s) return ejemplo(EMPRESA_PROPIA_EJEMPLO, SIN_CREDENCIALES);

  const { data, error } = await s.supabase
    .from("empresas")
    .select(COLUMNAS_EMPRESA)
    .eq("id", s.id)
    .maybeSingle();

  if (error) return ejemplo(EMPRESA_PROPIA_EJEMPLO, error.message);
  if (!data) return ejemplo(EMPRESA_PROPIA_EJEMPLO, SIN_EMPRESA);

  return {
    origen: "supabase",
    datos: { ...data, logo_url: rutaDeImagen(data.logo_url) },
  };
}

// --- Búsquedas --------------------------------------------------------------

function consultarBusquedas(supabase: ClienteSupabase, empresaId: string) {
  return supabase
    .from("vacantes")
    .select(
      `id, titulo, descripcion, tipo, modalidad, ubicacion, posiciones, estado,
       creada_en,
       postulaciones ( estado ),
       vacante_habilidades ( habilidades ( id, nombre ) ),
       vacante_habilidades_ocultas ( habilidades ( id, nombre ) ),
       vacante_tags_publicos ( tags ( id, nombre ) ),
       vacante_tags_ocultos ( tags ( id, nombre ) )`,
    )
    .eq("empresa_id", empresaId);
}

type FilaBusqueda = NonNullable<
  Awaited<ReturnType<typeof consultarBusquedas>>["data"]
>[number];

function comoBusqueda(fila: FilaBusqueda): BusquedaCompleta {
  const estados = (fila.postulaciones ?? []).map((p) => p.estado);
  return {
    id: fila.id,
    titulo: fila.titulo,
    descripcion: fila.descripcion,
    tipo: comoTipoOportunidad(fila.tipo),
    modalidad: comoModalidad(fila.modalidad),
    ubicacion: fila.ubicacion,
    posiciones: fila.posiciones,
    estado: comoEstadoVacante(fila.estado),
    creada_en: fila.creada_en,
    postulaciones: estados.length,
    nuevas: estados.filter((estado) => estado === "pendiente").length,
    habilidades: opcionesDe(fila.vacante_habilidades, "habilidades"),
    habilidadesOcultas: opcionesDe(
      fila.vacante_habilidades_ocultas,
      "habilidades",
    ),
    tags: opcionesDe(fila.vacante_tags_publicos, "tags"),
    tagsOcultos: opcionesDe(fila.vacante_tags_ocultos, "tags"),
  };
}

/** RF7.1.1 — Las búsquedas de la empresa, de la más reciente a la más vieja. */
export async function obtenerBusquedas(
  usuarioId?: string,
): Promise<Resultado<BusquedaCompleta[]>> {
  const s = await sesion(usuarioId);
  if (!s) return ejemplo(BUSQUEDAS_EJEMPLO, SIN_CREDENCIALES);

  const { data, error } = await consultarBusquedas(s.supabase, s.id).order(
    "creada_en",
    { ascending: false },
  );

  if (error) return ejemplo(BUSQUEDAS_EJEMPLO, error.message);

  return { origen: "supabase", datos: (data ?? []).map(comoBusqueda) };
}

/** Una búsqueda propia, completa, o `null` si no existe o no es de la empresa. */
export async function obtenerBusqueda(
  id: string,
  usuarioId?: string,
): Promise<Resultado<BusquedaCompleta> | null> {
  const deEjemplo = BUSQUEDAS_EJEMPLO.find((b) => b.id === id);
  if (deEjemplo) return ejemplo(deEjemplo, SIN_CREDENCIALES);
  if (!esUuid(id)) return null;

  const s = await sesion(usuarioId);
  if (!s) return null;

  const { data } = await consultarBusquedas(s.supabase, s.id)
    .eq("id", id)
    .maybeSingle();

  return data ? { origen: "supabase", datos: comoBusqueda(data) } : null;
}

// --- Postulaciones recibidas ------------------------------------------------

type FilaPostulacion = {
  id: string;
  estado: string;
  creada_en: string;
  actualizada_en: string;
  perfil_id: string;
};

/**
 * Completa cada postulación con lo que la empresa puede ver de la persona.
 *
 * Tres lecturas en paralelo para todas las personas a la vez, no una por
 * postulante: con veinte postulantes serían sesenta viajes a la base.
 */
async function armarPostulaciones(
  supabase: ClienteSupabase,
  filas: FilaPostulacion[],
): Promise<PostulacionRecibida[]> {
  // Quien se retiró no comparte más sus datos: ni se piden.
  const ids = [
    ...new Set(
      filas.filter((f) => f.estado !== "cancelada").map((f) => f.perfil_id),
    ),
  ];

  const [personas, habilidades, tags, formaciones] = ids.length
    ? await Promise.all([
        supabase.rpc("candidatos_de_mi_empresa", { ids }),
        supabase
          .from("perfil_habilidades")
          .select("perfil_id, habilidades ( nombre )")
          .in("perfil_id", ids),
        supabase
          .from("perfil_tags")
          .select("perfil_id, tags ( nombre )")
          .in("perfil_id", ids),
        supabase
          .from("formaciones")
          .select("id, perfil_id, institucion, titulo, estado")
          .in("perfil_id", ids),
      ])
    : [null, null, null, null];

  const porId = new Map<string, DatosDeCandidato>(
    (personas?.data ?? []).map((p) => [
      p.id,
      { ...p, foto_url: rutaDeImagen(p.foto_url) },
    ]),
  );

  const de = <T extends { perfil_id: string }>(lista: T[] | null, id: string) =>
    (lista ?? []).filter((fila) => fila.perfil_id === id);

  return filas.map((fila) => ({
    id: fila.id,
    estado: comoEstadoPostulacion(fila.estado),
    creada_en: fila.creada_en,
    actualizada_en: fila.actualizada_en,
    persona: porId.get(fila.perfil_id) ?? null,
    habilidades: nombresDe(
      de(habilidades?.data ?? null, fila.perfil_id),
      "habilidades",
    ),
    tags: nombresDe(de(tags?.data ?? null, fila.perfil_id), "tags"),
    formaciones: de(formaciones?.data ?? null, fila.perfil_id).map((f) => ({
      id: f.id,
      institucion: f.institucion,
      titulo: f.titulo,
      estado: comoEstadoFormacion(f.estado),
    })),
  }));
}

const COLUMNAS_POSTULACION = "id, estado, creada_en, actualizada_en, perfil_id";

/** RF3.4.1 — Quiénes se postularon a una búsqueda propia. */
export async function obtenerPostulacionesRecibidas(
  vacanteId: string,
  usuarioId?: string,
): Promise<Resultado<PostulacionRecibida[]>> {
  const deEjemplo = POSTULACIONES_RECIBIDAS_EJEMPLO[vacanteId];
  if (deEjemplo || !esUuid(vacanteId)) {
    return ejemplo(deEjemplo ?? [], SIN_CREDENCIALES);
  }

  const s = await sesion(usuarioId);
  if (!s) return ejemplo([], SIN_CREDENCIALES);

  const { data, error } = await s.supabase
    .from("postulaciones")
    .select(COLUMNAS_POSTULACION)
    .eq("vacante_id", vacanteId)
    .order("creada_en", { ascending: true });

  if (error) return ejemplo([], error.message);

  return {
    origen: "supabase",
    datos: await armarPostulaciones(s.supabase, data ?? []),
  };
}

// --- Eventos ----------------------------------------------------------------

function consultarEventos(supabase: ClienteSupabase, empresaId: string) {
  return supabase
    .from("eventos")
    .select(
      `id, titulo, descripcion, fecha_hora, imagen_url, estado,
       direccion, latitud, longitud,
       evento_tags ( tags ( id, nombre ) ),
       inscripciones_evento ( count )`,
    )
    .eq("empresa_id", empresaId);
}

type FilaEvento = NonNullable<
  Awaited<ReturnType<typeof consultarEventos>>["data"]
>[number];

function comoEvento(fila: FilaEvento): EventoDeEmpresa {
  const conteo = fila.inscripciones_evento as unknown as { count: number }[];
  return {
    id: fila.id,
    titulo: fila.titulo,
    descripcion: fila.descripcion,
    fecha_hora: fila.fecha_hora,
    imagen_url: rutaDeImagen(fila.imagen_url),
    estado: comoEstadoEvento(fila.estado),
    direccion: fila.direccion,
    // `numeric` puede llegar como texto según el driver: se fija a número.
    latitud: fila.latitud === null ? null : Number(fila.latitud),
    longitud: fila.longitud === null ? null : Number(fila.longitud),
    tags: opcionesDe(fila.evento_tags, "tags"),
    inscriptos: conteo?.[0]?.count ?? 0,
  };
}

/** RF4 — Los eventos de la empresa, del más próximo al más lejano. */
export async function obtenerEventosDeEmpresa(
  usuarioId?: string,
): Promise<Resultado<EventoDeEmpresa[]>> {
  const s = await sesion(usuarioId);
  if (!s) return ejemplo(EVENTOS_DE_EMPRESA_EJEMPLO, SIN_CREDENCIALES);

  const { data, error } = await consultarEventos(s.supabase, s.id).order(
    "fecha_hora",
    { ascending: true },
  );

  if (error) return ejemplo(EVENTOS_DE_EMPRESA_EJEMPLO, error.message);

  return { origen: "supabase", datos: (data ?? []).map(comoEvento) };
}

/** Un evento propio, o `null` si no existe o no es de la empresa. */
export async function obtenerEventoDeEmpresa(
  id: string,
  usuarioId?: string,
): Promise<Resultado<EventoDeEmpresa> | null> {
  const deEjemplo = EVENTOS_DE_EMPRESA_EJEMPLO.find((e) => e.id === id);
  if (deEjemplo) return ejemplo(deEjemplo, SIN_CREDENCIALES);
  if (!esUuid(id)) return null;

  const s = await sesion(usuarioId);
  if (!s) return null;

  const { data } = await consultarEventos(s.supabase, s.id)
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;
  const [evento] = await conCreditos([comoEvento(data)]);
  return { origen: "supabase", datos: evento };
}

/** Quiénes se inscribieron a un evento propio, del primero al último. */
export async function obtenerInscriptos(
  eventoId: string,
  usuarioId?: string,
): Promise<Resultado<Inscripto[]>> {
  const deEjemplo = INSCRIPTOS_EJEMPLO[eventoId];
  if (deEjemplo || !esUuid(eventoId)) {
    return ejemplo(deEjemplo ?? [], SIN_CREDENCIALES);
  }

  const s = await sesion(usuarioId);
  if (!s) return ejemplo([], SIN_CREDENCIALES);

  const { data, error } = await s.supabase
    .from("inscripciones_evento")
    .select("perfil_id, creada_en")
    .eq("evento_id", eventoId)
    .order("creada_en", { ascending: true });

  if (error) return ejemplo([], error.message);

  const ids = (data ?? []).map((fila) => fila.perfil_id);
  const personas = ids.length
    ? await s.supabase.rpc("candidatos_de_mi_empresa", { ids })
    : null;
  const porId = new Map(
    (personas?.data ?? []).map((p) => [
      p.id,
      { ...p, foto_url: rutaDeImagen(p.foto_url) },
    ]),
  );

  return {
    origen: "supabase",
    datos: (data ?? []).flatMap((fila) => {
      const persona = porId.get(fila.perfil_id);
      return persona ? [{ persona, creada_en: fila.creada_en }] : [];
    }),
  };
}

// --- Reseñas recibidas (RF7.4) ----------------------------------------------

/**
 * Las reseñas que recibió la empresa, de la más reciente a la más vieja.
 *
 * Sin el nombre de quien la escribió: la política `resenias_veo_las_mias_o_de_mi_empresa`
 * deja leer el `perfil_id`, pero ponerle nombre a una reseña frente a la
 * empresa reseñada es la forma más rápida de que nadie escriba una honesta.
 */
export async function obtenerReseniasRecibidas(
  usuarioId?: string,
): Promise<Resultado<ReseniaRecibida[]>> {
  const s = await sesion(usuarioId);
  if (!s) return ejemplo(RESENIAS_EJEMPLO, SIN_CREDENCIALES);

  const { data, error } = await s.supabase
    .from("resenias")
    .select("id, calificacion, comentario, creada_en")
    .eq("empresa_id", s.id)
    .order("creada_en", { ascending: false });

  if (error) return ejemplo(RESENIAS_EJEMPLO, error.message);

  return { origen: "supabase", datos: data ?? [] };
}

// --- Candidatos por intereses (RF7.3) ---------------------------------------

/**
 * Las personas que se postularon a alguna búsqueda de la empresa (y siguen
 * en el proceso o ya terminaron, sin haberse retirado), con las búsquedas a
 * las que se postularon.
 *
 * Es la base de la búsqueda por intereses de RF7.3, acotada a los postulantes
 * propios: buscar entre todos los jóvenes de la plataforma obligaría a
 * abrirles a todas las empresas los datos de todos, que es lo que cerró H1.
 * El filtro por intereses lo hace la pantalla con `Set`, porque es sobre una
 * lista que ya está en memoria.
 */
export async function obtenerPostulantesPropios(usuarioId?: string): Promise<
  Resultado<
    {
      postulacion: PostulacionRecibida;
      busqueda: { id: string; titulo: string };
    }[]
  >
> {
  const s = await sesion(usuarioId);
  if (!s) {
    return ejemplo(
      (POSTULACIONES_RECIBIDAS_EJEMPLO["ejemplo-busqueda-1"] ?? []).map(
        (postulacion) => ({
          postulacion,
          busqueda: {
            id: "ejemplo-busqueda-1",
            titulo: BUSQUEDAS_EJEMPLO[0].titulo,
          },
        }),
      ),
      SIN_CREDENCIALES,
    );
  }

  const { data, error } = await s.supabase
    .from("postulaciones")
    .select(
      `${COLUMNAS_POSTULACION}, vacantes!inner ( id, titulo, empresa_id )`,
    )
    .eq("vacantes.empresa_id", s.id)
    .neq("estado", "cancelada")
    .order("creada_en", { ascending: false });

  if (error) return ejemplo([], error.message);

  const filas = data ?? [];
  const armadas = await armarPostulaciones(s.supabase, filas);

  return {
    origen: "supabase",
    datos: armadas.map((postulacion, i) => ({
      postulacion,
      busqueda: { id: filas[i].vacantes.id, titulo: filas[i].vacantes.titulo },
    })),
  };
}

// --- Panel (RF7) ------------------------------------------------------------

/**
 * Todo lo del panel en una sola pasada: el perfil, las búsquedas, los eventos
 * y las postulaciones en curso de las búsquedas activas (para recomendar). El
 * orden de los recomendados lo decide `ResumenDePanel`, no esta consulta.
 */
export async function obtenerPanelDeEmpresa(
  usuarioId?: string,
): Promise<Resultado<PanelDeEmpresa>> {
  const ejemploCompleto: PanelDeEmpresa = {
    empresa: EMPRESA_PROPIA_EJEMPLO,
    busquedas: BUSQUEDAS_EJEMPLO,
    eventos: EVENTOS_DE_EMPRESA_EJEMPLO,
    recomendados: (
      POSTULACIONES_RECIBIDAS_EJEMPLO["ejemplo-busqueda-1"] ?? []
    ).map((postulacion) => ({ postulacion, busqueda: BUSQUEDAS_EJEMPLO[0] })),
  };

  const s = await sesion(usuarioId);
  if (!s) return ejemplo(ejemploCompleto, SIN_CREDENCIALES);

  const [empresa, busquedas, eventos] = await Promise.all([
    obtenerEmpresaPropia(s.id),
    obtenerBusquedas(s.id),
    obtenerEventosDeEmpresa(s.id),
  ]);

  // Si alguna lectura cayó en el ejemplo, el panel entero lo es: mezclar una
  // empresa de demostración con búsquedas reales confundiría más que avisar.
  const caida = [empresa, busquedas, eventos].find(
    (r) => r.origen === "ejemplo",
  );
  if (caida) return ejemplo(ejemploCompleto, caida.error ?? SIN_CREDENCIALES);

  const activas = busquedas.datos.filter((b) => b.estado === "activa");
  const { data: filas } = activas.length
    ? await s.supabase
        .from("postulaciones")
        .select(`${COLUMNAS_POSTULACION}, vacante_id`)
        .in(
          "vacante_id",
          activas.map((b) => b.id),
        )
        .in("estado", ["pendiente", "en_revision", "entrevista"])
    : { data: [] };

  const enCurso = filas ?? [];
  const armadas = await armarPostulaciones(s.supabase, enCurso);
  const porBusqueda = new Map(activas.map((b) => [b.id, b]));

  const recomendados: Recomendado[] = armadas.flatMap((postulacion, i) => {
    const busqueda = porBusqueda.get(enCurso[i].vacante_id);
    return busqueda ? [{ postulacion, busqueda }] : [];
  });

  return {
    origen: "supabase",
    datos: {
      empresa: empresa.datos,
      busquedas: busquedas.datos,
      eventos: eventos.datos,
      recomendados,
    },
  };
}
