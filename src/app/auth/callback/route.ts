import type { EmailOtpType } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * A dónde lleva el enlace de cada correo de GoTrue (ver `docs/correo.md`).
 *
 * Las plantillas arman `/auth/callback?token_hash=…&type=…` en vez del enlace
 * por defecto de GoTrue, que apunta a la API de Supabase: esa API escucha
 * solo dentro del servidor y no es alcanzable desde el correo de nadie.
 */
const TIPOS: readonly EmailOtpType[] = [
  "recovery",
  "email",
  "signup",
  "email_change",
];

function esTipo(valor: string | null): valor is EmailOtpType {
  return TIPOS.includes(valor as EmailOtpType);
}

/**
 * Verifica el token del correo con la base y abre la sesión.
 *
 * - `recovery` (RF1.8): con la sesión abierta, a elegir la contraseña nueva.
 * - `email` / `signup` (confirmación del registro): se confirma y se cierra la
 *   sesión. El alta pendiente la completa `iniciarSesion`, que es el único
 *   lugar que sabe hacerlo; entrar con la contraseña una vez es el precio de
 *   no duplicar esa lógica acá.
 * - `email_change`: el cambio ya quedó hecho; vuelve al perfil.
 *
 * `code` cubre el flujo PKCE, por si una plantilla vuelve a usar el enlace
 * por defecto con `redirect_to` a esta ruta.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type");
  const codigo = searchParams.get("code");

  // Redirección relativa: detrás de Tailscale Funnel el origen que ve el
  // servidor es `localhost`, no el dominio público. El navegador resuelve la
  // ruta contra la URL del enlace. Las cookies de la sesión las agrega
  // `cookies()` a esta misma respuesta.
  const ir = (ruta: string) =>
    new Response(null, { status: 303, headers: { Location: ruta } });
  const fallo =
    tipo === "recovery" ? "/recuperar?motivo=vencido" : "/login?correo=vencido";

  const supabase = await createClient();
  if (!supabase) return ir(fallo);

  if (tokenHash && esTipo(tipo)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: tipo,
    });
    if (error) return ir(fallo);
  } else if (codigo) {
    const { error } = await supabase.auth.exchangeCodeForSession(codigo);
    if (error) return ir(fallo);
  } else {
    return ir(fallo);
  }

  if (tipo === "recovery") return ir("/recuperar/nueva");
  if (tipo === "email_change") return ir("/perfil");

  await supabase.auth.signOut();
  return ir("/login?correo=confirmado");
}
