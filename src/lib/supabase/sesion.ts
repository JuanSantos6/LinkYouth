import type { CookieOptions } from "@supabase/ssr";

/**
 * «Mantener la sesión iniciada».
 *
 * Supabase guarda la sesión en cookies, y `@supabase/ssr` las escribe con una
 * duración de 400 días: sin hacer nada, la sesión sobrevive a cerrar el
 * navegador. Cuando la persona NO marca la casilla, el login deja esta cookie
 * en `"0"`, y es una cookie de sesión (sin `maxAge`): el navegador la borra
 * al cerrarse.
 *
 * Mientras exista, cada vez que Supabase escribe sus cookies —al entrar, y
 * también cada vez que el middleware renueva el token— se les sacan `maxAge`
 * y `expires` (`opcionesDeCookie`), así que también son de sesión y se van
 * con ella. Sin la cookie, se respeta la duración de Supabase.
 *
 * Solo importa tipos: lo usan el middleware (Edge) y el servidor.
 */
export const COOKIE_RECORDAR = "ly-recordar";

export function recuerdaSesion(valor: string | undefined): boolean {
  return valor !== "0";
}

export function opcionesDeCookie(
  opciones: CookieOptions | undefined,
  recordar: boolean,
): CookieOptions | undefined {
  if (recordar || !opciones) return opciones;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- se descartan a propósito
  const { maxAge, expires, ...resto } = opciones;
  return resto;
}
