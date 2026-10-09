import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

import type { Database } from "@/types/database";
import { leerCredenciales } from "./config";
import {
  COOKIE_RECORDAR,
  esConexionSegura,
  opcionesDeCookie,
  recuerdaSesion,
} from "./sesion";

/**
 * Cliente de Supabase para Server Components, Route Handlers y Server Actions.
 * En Next.js 15 `cookies()` es asíncrono, por eso la función es async.
 *
 * Devuelve `null` cuando faltan las variables de entorno, así quien consulta
 * decide qué hacer sin que la página entera falle.
 */
/**
 * `recordar` fuerza la preferencia de «Mantener la sesión iniciada» en el
 * mismo request del login, antes de que la cookie `ly-recordar` exista. Si no
 * se pasa, se lee de esa cookie (ver `sesion.ts`).
 */
export async function createClient(opciones: { recordar?: boolean } = {}) {
  const credenciales = leerCredenciales();
  if (!credenciales) return null;

  const cookieStore = await cookies();
  const recordar =
    opciones.recordar ??
    recuerdaSesion(cookieStore.get(COOKIE_RECORDAR)?.value);
  const segura = esConexionSegura((await headers()).get("x-forwarded-proto"));

  return createServerClient<Database>(credenciales.url, credenciales.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(
              name,
              value,
              opcionesDeCookie(options, recordar, segura),
            ),
          );
        } catch {
          // Un Server Component no puede escribir cookies.
          // El middleware ya refresca la sesión, así que se puede ignorar.
        }
      },
    },
  });
}
