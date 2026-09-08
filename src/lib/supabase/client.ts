import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para Client Components (navegador).
 * Solo usa variables NEXT_PUBLIC_*, que se exponen al bundle del cliente.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
