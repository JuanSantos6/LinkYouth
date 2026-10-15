import "server-only";

import { createClient } from "@/lib/supabase/server";

import type { Resultado } from "./tipos";

/**
 * Lo que comparten las dos capas de lectura: `consultas.ts` (el joven y lo
 * público) y `empresa.ts` (el panel de la empresa). Vivían dentro de la
 * primera; con la segunda, copiarlos habría sido tener dos versiones de la
 * misma regla esperando a separarse.
 */

export type ClienteSupabase = NonNullable<
  Awaited<ReturnType<typeof createClient>>
>;

export const SIN_CREDENCIALES =
  "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local";

export const TABLA_VACIA =
  "La base respondió, pero todavía no tiene datos cargados";

export const SIN_SESION = "No hay una sesión iniciada";

export function ejemplo<T>(datos: T, error: string): Resultado<T> {
  return { datos, origen: "ejemplo", error };
}

/** Aplana `tabla_puente ( catalogo ( nombre ) )` a una lista de nombres. */
export function nombresDe<C extends string>(
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
export async function resolverUsuarioId(
  supabase: ClienteSupabase,
  usuarioId?: string,
): Promise<string | null> {
  if (usuarioId) return usuarioId;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}
