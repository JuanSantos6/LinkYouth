/**
 * Lectura de las credenciales de Supabase.
 *
 * La aplicación tiene que poder levantarse sin `.env.local` (por ejemplo en un
 * clon recién hecho o en una revisión de diseño), así que en vez de romper el
 * render se informa que la conexión no está configurada y las consultas caen
 * en los datos de ejemplo de `src/lib/data/ejemplos.ts`.
 */
export type CredencialesSupabase = {
  url: string;
  anonKey: string;
};

export function leerCredenciales(): CredencialesSupabase | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;

  return { url, anonKey };
}

export function supabaseConfigurado(): boolean {
  return leerCredenciales() !== null;
}
