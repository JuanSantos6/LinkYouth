import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/types/database";
import { leerCredenciales } from "./config";

/**
 * Cliente de Supabase para Server Components, Route Handlers y Server Actions.
 * En Next.js 15 `cookies()` es asíncrono, por eso la función es async.
 *
 * Devuelve `null` cuando faltan las variables de entorno, así quien consulta
 * decide qué hacer sin que la página entera falle.
 */
export async function createClient() {
  const credenciales = leerCredenciales();
  if (!credenciales) return null;

  const cookieStore = await cookies();

  return createServerClient<Database>(credenciales.url, credenciales.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Un Server Component no puede escribir cookies.
          // El middleware ya refresca la sesión, así que se puede ignorar.
        }
      },
    },
  });
}
