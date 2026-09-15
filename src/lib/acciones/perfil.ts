"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import { mensajeDeError, sesionDePostulante } from "./sesion";
import { CLAVE_DUPLICADA, type EstadoAccion } from "./tipos";

type ClienteSupabase = NonNullable<Awaited<ReturnType<typeof createClient>>>;

/**
 * Largo máximo de la biografía.
 *
 * `db/schema.sql` declara `bio` como `text` sin restricción de longitud, así
 * que este límite es una decisión de producto (RF2.2.1) que vive únicamente
 * acá. Si alguna vez se agrega el `check` en la base, este número tiene que
 * seguirlo.
 */
const LARGO_MAXIMO_BIO = 600;

/** RF1.5 y RF2.2 — Editar los datos públicos del perfil propio. */
export async function actualizarPerfil(
  _estadoPrevio: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  const nombre = String(datos.get("nombre") ?? "").trim();
  const apellido = String(datos.get("apellido") ?? "").trim();
  const pais = String(datos.get("pais") ?? "").trim();
  const bio = String(datos.get("bio") ?? "").trim();

  if (nombre.length < 2 || apellido.length < 2) {
    return {
      estado: "error",
      mensaje: "El nombre y el apellido son obligatorios.",
    };
  }

  if (!pais) {
    return { estado: "error", mensaje: "El país es obligatorio." };
  }

  // RF2.2.2: la validación de longitud corre en el servidor, no solo en el
  // atributo maxlength del campo.
  if (bio.length > LARGO_MAXIMO_BIO) {
    return {
      estado: "error",
      mensaje: `La biografía no puede superar los ${LARGO_MAXIMO_BIO} caracteres.`,
    };
  }

  // El guardia acá hace algo que RLS no puede: un `update` sobre una fila que
  // la política no deja ver no devuelve error, devuelve cero filas. Sin esto,
  // una cuenta de empresa invocando esta acción recibía «Perfil actualizado.»
  // sin haber tocado nada.
  const guardia = await sesionDePostulante();
  if (!guardia.ok) return guardia.error;
  const { supabase, usuarioId } = guardia.sesion;

  // Mismo motivo que en `cancelarPostulacion`: un `update` que no encuentra la
  // fila no falla, devuelve cero filas. El `.select("id")` es lo que convierte
  // ese caso en un error en vez de un «Perfil actualizado.» sobre nada.
  const { data, error } = await supabase
    .from("perfiles")
    .update({ nombre, apellido, pais, bio: bio || null })
    .eq("id", usuarioId)
    .select("id");

  if (error) return { estado: "error", mensaje: mensajeDeError(error) };

  if (!data || data.length === 0) {
    return { estado: "error", mensaje: "No se pudo actualizar el perfil." };
  }

  revalidatePath("/perfil");

  return { estado: "ok", mensaje: "Perfil actualizado." };
}

// --- Intereses y habilidades ------------------------------------------------

/**
 * Lo que comparten las cuatro acciones de abajo: cliente, sesión, manejo del
 * clic repetido y revalidación. Lo único que cambia entre ellas es una línea
 * —a qué tabla puente le insertan o le borran la fila—, así que esa línea es
 * lo único que reciben.
 *
 * La consulta llega como función y no como un par (tabla, columna) armado a
 * mano para que TypeScript siga viendo el nombre literal de la tabla: con un
 * nombre variable, los tipos de `src/types/database.ts` dejan de aplicar y el
 * `insert` pasa a aceptar cualquier objeto.
 *
 * No valida que el id exista en el catálogo: de eso ya se ocupan la clave
 * foránea contra `tags`/`habilidades` y las políticas de `db/politicas.sql`,
 * que además son las que impiden tocar el perfil de otro (`auth.uid() =
 * perfil_id`). Repetir esa comprobación acá sería una lectura de más que no
 * agrega ninguna garantía.
 */
async function cambiarVinculo(
  id: string,
  consulta: (
    supabase: ClienteSupabase,
    perfilId: string,
  ) => PromiseLike<{
    data: unknown[] | null;
    error: { code: string; message: string } | null;
  }>,
): Promise<EstadoAccion> {
  if (!id) {
    return { estado: "error", mensaje: "No se indicó qué agregar o quitar." };
  }

  const guardia = await sesionDePostulante();
  if (!guardia.ok) return guardia.error;
  const { supabase, usuarioId } = guardia.sesion;

  const { error } = await consulta(supabase, usuarioId);

  // Dos clics seguidos sobre la misma etiqueta mandan dos inserts iguales y el
  // segundo choca contra la clave primaria `(perfil_id, tag_id)`. La fila
  // quedó como quería quien hizo clic, así que es un éxito: devolver error
  // acá haría que la interfaz revirtiera una etiqueta que sí está guardada.
  if (error && error.code !== CLAVE_DUPLICADA) {
    return { estado: "error", mensaje: mensajeDeError(error) };
  }

  // Las cuatro consultas terminan en `.select("perfil_id")` —no `"id"`: estas
  // dos tablas puente tienen clave compuesta y no llevan columna `id`—, así
  // que `data` dice cuántas filas se tocaron.
  //
  // Acá, a diferencia de `actualizarPerfil` y `cancelarPostulacion`, cero filas
  // NO es un error, y la simetría es deliberada: sacar una etiqueta que ya no
  // estaba deja el perfil como lo pidió el clic, igual que agregar una que ya
  // estaba. Devolver error haría que el estado optimista de `SelectorTags`
  // revirtiera una etiqueta que sí quedó bien, que es exactamente lo que evita
  // el caso del `23505` de arriba. La operación es idempotente en las dos
  // direcciones, y ahora eso está escrito en vez de pasar de casualidad.

  revalidatePath("/perfil");

  return { estado: "ok", mensaje: "" };
}

/** RF2.3 — Sumar un interés del catálogo al perfil propio. */
export async function agregarTag(tagId: string): Promise<EstadoAccion> {
  return cambiarVinculo(tagId, (supabase, perfilId) =>
    supabase
      .from("perfil_tags")
      .insert({ perfil_id: perfilId, tag_id: tagId })
      .select("perfil_id"),
  );
}

/** RF2.3 — Sacar un interés del perfil propio. */
export async function quitarTag(tagId: string): Promise<EstadoAccion> {
  return cambiarVinculo(tagId, (supabase, perfilId) =>
    supabase
      .from("perfil_tags")
      .delete()
      .eq("perfil_id", perfilId)
      .eq("tag_id", tagId)
      .select("perfil_id"),
  );
}

/** RF2.4.3 — Sumar una habilidad del catálogo al perfil propio. */
export async function agregarHabilidad(
  habilidadId: string,
): Promise<EstadoAccion> {
  return cambiarVinculo(habilidadId, (supabase, perfilId) =>
    supabase
      .from("perfil_habilidades")
      .insert({ perfil_id: perfilId, habilidad_id: habilidadId })
      .select("perfil_id"),
  );
}

/** RF2.4.3 — Sacar una habilidad del perfil propio. */
export async function quitarHabilidad(
  habilidadId: string,
): Promise<EstadoAccion> {
  return cambiarVinculo(habilidadId, (supabase, perfilId) =>
    supabase
      .from("perfil_habilidades")
      .delete()
      .eq("perfil_id", perfilId)
      .eq("habilidad_id", habilidadId)
      .select("perfil_id"),
  );
}
