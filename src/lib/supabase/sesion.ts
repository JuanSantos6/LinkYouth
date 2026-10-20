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

/**
 * ¿El request llegó por HTTPS? Detrás de Tailscale Funnel y del WAF, Next
 * recibe HTTP y el protocolo original viaja en `X-Forwarded-Proto` (lo pone
 * tailscaled y Caddy lo conserva). Desde la tailnet se entra por `http://`.
 */
export function esConexionSegura(
  protocoloReenviado: string | null | undefined,
): boolean {
  return protocoloReenviado?.split(",")[0]?.trim().toLowerCase() === "https";
}

/**
 * Opciones con las que se escriben las cookies de sesión de Supabase.
 *
 * - `httpOnly`: el JavaScript de la página no puede leerlas, así que un XSS no
 *   se lleva la sesión. Se puede porque ningún código del navegador usa
 *   Supabase (`@supabase/ssr` las deja legibles por defecto para su cliente
 *   de navegador, que acá no existe).
 * - `sameSite: "lax"`: no viajan en POST iniciados desde otro sitio.
 * - `secure` solo cuando el request llegó por HTTPS: si se marcara siempre, el
 *   navegador no las guardaría en el acceso por `http://` de la tailnet y no
 *   se podría entrar.
 *
 * Ver `docs/seguridad.md` (Fase 3 del incidente del 2026-10-08).
 */
export function opcionesDeCookie(
  opciones: CookieOptions | undefined,
  recordar: boolean,
  segura: boolean,
): CookieOptions {
  const endurecidas: CookieOptions = {
    ...opciones,
    httpOnly: true,
    sameSite: "lax",
    secure: segura,
  };
  if (recordar) return endurecidas;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- se descartan a propósito
  const { maxAge, expires, ...resto } = endurecidas;
  return resto;
}
