"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { FuerzaDeContrasenia } from "@/lib/dominio/FuerzaDeContrasenia";
import { conAviso } from "@/lib/navegacion";
import { createClient } from "@/lib/supabase/server";

import { type EstadoAccion, SIN_CONFIGURAR, SIN_SESION } from "./tipos";

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * RF1.8.1 a RF1.8.3 — Pedir el enlace para elegir una contraseña nueva.
 *
 * La respuesta es la misma exista o no la cuenta. RF1.8.2 pide comprobar que
 * el correo exista, y se comprueba —Supabase solo manda el correo si la
 * cuenta existe—, pero decirlo en pantalla le serviría a cualquiera para
 * averiguar quién está registrado. Mismo criterio que `iniciarSesion`.
 *
 * El enlace del correo lleva a `/auth/callback` con un `token_hash`: lo arma la
 * plantilla de GoTrue (ver `docs/correo.md`).
 */
export async function pedirRecuperacion(
  _estadoPrevio: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  const email = String(datos.get("email") ?? "").trim();
  if (!CORREO.test(email)) {
    return { estado: "error", mensaje: "Escribí un correo válido." };
  }

  const supabase = await createClient();
  if (!supabase) return SIN_CONFIGURAR;

  // El error no se muestra: los dos que puede dar (cuenta inexistente y
  // demasiados pedidos seguidos) dirían algo de la cuenta.
  await supabase.auth.resetPasswordForEmail(email);

  return {
    estado: "ok",
    mensaje:
      "Si hay una cuenta con ese correo, te mandamos un enlace para elegir una contraseña nueva. Vence en una hora. Si no lo ves, mirá en el correo no deseado.",
  };
}

/**
 * RF1.8.4 y RF1.8.5 — Guardar la contraseña nueva.
 *
 * Solo funciona con la sesión que abre el enlace del correo en
 * `/auth/callback`; el middleware manda a `/recuperar` a quien llega sin ella.
 */
export async function guardarContraseniaNueva(
  _estadoPrevio: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  const password = String(datos.get("password") ?? "");
  const confirmacion = String(datos.get("password_confirmacion") ?? "");

  if (password !== confirmacion) {
    return { estado: "error", mensaje: "Las dos contraseñas no coinciden." };
  }
  const motivo = new FuerzaDeContrasenia(password).motivoDelRechazo;
  if (motivo) return { estado: "error", mensaje: motivo };

  const supabase = await createClient();
  if (!supabase) return SIN_CONFIGURAR;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return SIN_SESION;

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return {
      estado: "error",
      mensaje:
        error.code === "same_password"
          ? "La contraseña nueva tiene que ser distinta de la anterior."
          : "No se pudo guardar la contraseña. Pedí un enlace nuevo y probá otra vez.",
    };
  }

  revalidatePath("/", "layout");
  // `/inicio` y no el panel: el middleware lleva a cada cuenta a su mitad.
  redirect(conAviso("/inicio", "contrasenia-nueva"));
}
