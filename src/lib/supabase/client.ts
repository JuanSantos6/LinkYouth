import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";
import { leerCredenciales } from "./config";

/**
 * Cliente de Supabase para Client Components (navegador).
 * Solo usa variables NEXT_PUBLIC_*, que se exponen al bundle del cliente.
 *
 * Devuelve `null` si el proyecto todavía no tiene credenciales cargadas.
 */
export function createClient() {
  const credenciales = leerCredenciales();
  if (!credenciales) return null;

  return createBrowserClient<Database>(credenciales.url, credenciales.anonKey);
}
