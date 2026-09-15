import { createClient } from "@/lib/supabase/server";

import {
  POLITICA_RLS,
  SIN_CONFIGURAR,
  SIN_PERFIL,
  SIN_SESION,
  type EstadoAccion,
} from "./tipos";

type ClienteSupabase = NonNullable<Awaited<ReturnType<typeof createClient>>>;

/** Lo que necesita una acción para escribir: el cliente y de quién es la sesión. */
export type SesionActiva = {
  supabase: ClienteSupabase;
  usuarioId: string;
};

export type Guardia =
  | { ok: true; sesion: SesionActiva }
  | { ok: false; error: EstadoAccion };

/**
 * El preámbulo de toda acción de postulante: cliente, sesión y tipo de cuenta.
 *
 * Las seis acciones de escritura repetían las mismas cuatro líneas —crear el
 * cliente, comprobar `SIN_CONFIGURAR`, pedir `getUser()`, comprobar
 * `SIN_SESION`—. Con el chequeo de tipo de cuenta serían seis lugares donde
 * acordarse de agregarlo, así que el preámbulo pasa a vivir acá y el guardia
 * entra en las seis de una sola vez.
 *
 * Por qué hace falta: el middleware reparte por tipo de cuenta, pero eso
 * protege la navegación por URL y no el endpoint de la acción. Los ids de las
 * Server Actions viajan en los chunks de `/_next/static`, que el `matcher` de
 * `src/middleware.ts` excluye, así que una cuenta de empresa puede invocar una
 * acción de postulante por POST contra una ruta que sí tiene permitida. La
 * regla de verdad está en `db/politicas.sql`, como manda `CLAUDE.md`; esto es
 * la capa de arriba, y existe por dos motivos concretos:
 *
 * 1. Para que el mensaje sea una frase y no un error crudo de Postgres.
 * 2. Porque un `update` o un `delete` que RLS deja pasar sin encontrar filas
 *    no devuelve error: sin este chequeo, `actualizarPerfil` invocada por una
 *    cuenta de empresa respondía «Perfil actualizado.» sin haber tocado nada.
 *
 * Que exista fila en `perfiles` equivale a ser cuenta individual: el
 * disparador `validar_tipo_cuenta` de `db/schema.sql` garantiza que una cuenta
 * tiene fila en `perfiles` o en `empresas`, nunca en las dos. Por eso no se
 * consulta `cuentas.tipo` —que además es una tabla más— ni hace falta una
 * función nueva.
 *
 * ponytail: una consulta de más por escritura. A este tamaño se paga sola; si
 * pesa, el tipo de cuenta va como claim del JWT con un auth hook de Supabase y
 * el chequeo se resuelve sin tocar la base, igual que lo anotado en
 * `src/middleware.ts`.
 */
export async function sesionDePostulante(): Promise<Guardia> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: SIN_CONFIGURAR };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: SIN_SESION };

  // `perfiles_veo_el_mio_completo` deja leer la fila propia, que es la única
  // que esta consulta necesita.
  const { data: perfil } = await supabase
    .from("perfiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!perfil) return { ok: false, error: SIN_PERFIL };

  return { ok: true, sesion: { supabase, usuarioId: user.id } };
}

/**
 * Traduce el error de una escritura al texto que se muestra en pantalla.
 *
 * Hoy solo desarma el `42501`. El resto de los códigos los sigue traduciendo
 * cada acción, que es la que sabe qué significa un `23505` en su contexto
 * —«ya te habías postulado» no es lo mismo que «esa etiqueta ya estaba»—.
 */
export function mensajeDeError(error: { code?: string; message: string }): string {
  return error.code === POLITICA_RLS
    ? "No tenés permiso para hacer esto."
    : error.message;
}
