import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * Cliente con la clave de servicio: saltea RLS.
 *
 * Existe para una sola cosa que RLS no puede resolver sin abrir datos: pasar
 * de un nombre de usuario al correo con el que se inicia sesión (RF1.3.1).
 * Exponer esa correspondencia en una vista o en una función `security
 * definer` le daría a cualquiera el correo de cualquier persona; acá el
 * correo nunca sale del servidor.
 *
 * `server-only` corta el build si algún componente de cliente lo importa. No
 * lo uses para nada que pueda resolverse con la sesión de quien pide.
 */
export function crearClienteDeServicio() {
  const url = process.env.SUPABASE_URL;
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !clave) return null;

  return createClient<Database>(url, clave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * El correo de la cuenta con ese nombre de usuario, o `null` si no hay
 * ninguna. Quien llama no tiene que distinguir los dos casos ante la persona
 * (ver `iniciarSesion`).
 */
export async function correoDeUsuario(
  nombreUsuario: string,
): Promise<string | null> {
  const servicio = crearClienteDeServicio();
  if (!servicio) return null;

  const { data: perfil } = await servicio
    .from("perfiles")
    .select("id")
    .eq("nombre_usuario", nombreUsuario)
    .maybeSingle();
  if (!perfil) return null;

  const { data } = await servicio.auth.admin.getUserById(perfil.id);
  return data.user?.email ?? null;
}
