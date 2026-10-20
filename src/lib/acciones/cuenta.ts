"use server";

import { createClient as clienteSuelto } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { FuerzaDeContrasenia } from "@/lib/dominio/FuerzaDeContrasenia";
import { ReglasDeRegistro } from "@/lib/dominio/ReglasDeRegistro";
import { crearClienteDeServicio } from "@/lib/supabase/admin";
import { BUCKET_IMAGENES } from "@/lib/supabase/almacenamiento";
import { leerCredenciales } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { COOKIE_RECORDAR } from "@/lib/supabase/sesion";

import {
  CLAVE_DUPLICADA,
  type EstadoAccion,
  type EstadoFormulario,
  SIN_CONFIGURAR,
  SIN_SESION,
} from "./tipos";

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** El cliente con la sesión y quién es. `null` si no hay sesión. */
async function sesion() {
  const supabase = await createClient();
  if (!supabase) return { ok: false as const, error: SIN_CONFIGURAR };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false as const, error: SIN_SESION };
  return { ok: true as const, supabase, user, email: user.email };
}

/**
 * ¿Es esta la contraseña de esa cuenta? Con un cliente aparte, sin cookies:
 * comprobarla no tiene que tocar la sesión abierta.
 */
async function contraseniaCorrecta(email: string, password: string) {
  const credenciales = leerCredenciales();
  if (!credenciales || !password) return false;
  const suelto = clienteSuelto(credenciales.url, credenciales.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await suelto.auth.signInWithPassword({ email, password });
  return !error;
}

const CONTRASENIA_INCORRECTA = (campo: string): EstadoFormulario => ({
  estado: "error",
  mensaje: "La contraseña actual no es correcta.",
  campos: { [campo]: "La contraseña actual no es correcta." },
});

/** RF1.5.1 — Cambiar el nombre de usuario (cuenta individual). */
export async function cambiarNombreDeUsuario(
  _estadoPrevio: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const nombre = String(datos.get("nombre_usuario") ?? "").trim();
  const valores = { nombre_usuario: nombre };
  const { LARGO_USUARIO_MINIMO: min, LARGO_USUARIO_MAXIMO: max } =
    ReglasDeRegistro;
  if (nombre.length < min || nombre.length > max || /\s|@/.test(nombre)) {
    const mensaje = `Entre ${min} y ${max} caracteres, sin espacios ni «@».`;
    return {
      estado: "error",
      mensaje,
      campos: { nombre_usuario: mensaje },
      valores,
    };
  }

  const s = await sesion();
  if (!s.ok) return s.error;

  const { data, error } = await s.supabase
    .from("perfiles")
    .update({ nombre_usuario: nombre })
    .eq("id", s.user.id)
    .select("id");

  if (error?.code === CLAVE_DUPLICADA) {
    const mensaje = "Ese nombre de usuario ya está en uso. Probá con otro.";
    return {
      estado: "error",
      mensaje,
      campos: { nombre_usuario: mensaje },
      valores,
    };
  }
  if (error || !data?.length) {
    return { estado: "error", mensaje: "No se pudo guardar. Probá de nuevo." };
  }

  revalidatePath("/", "layout");
  return {
    estado: "ok",
    mensaje: "Listo, ya tenés tu nombre de usuario nuevo.",
  };
}

/** RF1.5.2 — Cambiar la contraseña, confirmando la actual. */
export async function cambiarContrasenia(
  _estadoPrevio: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const actual = String(datos.get("actual") ?? "");
  const nueva = String(datos.get("password") ?? "");
  const confirmacion = String(datos.get("password_confirmacion") ?? "");

  if (nueva !== confirmacion) {
    const mensaje = "Las dos contraseñas no coinciden.";
    return {
      estado: "error",
      mensaje,
      campos: { password_confirmacion: mensaje },
    };
  }
  const motivo = new FuerzaDeContrasenia(nueva).motivoDelRechazo;
  if (motivo) {
    return { estado: "error", mensaje: motivo, campos: { password: motivo } };
  }

  const s = await sesion();
  if (!s.ok) return s.error;
  if (!(await contraseniaCorrecta(s.email, actual))) {
    return CONTRASENIA_INCORRECTA("actual");
  }

  const { error } = await s.supabase.auth.updateUser({ password: nueva });
  if (error) {
    return {
      estado: "error",
      mensaje:
        error.code === "same_password"
          ? "La contraseña nueva tiene que ser distinta de la actual."
          : "No se pudo cambiar la contraseña. Probá de nuevo.",
    };
  }
  return { estado: "ok", mensaje: "Listo, tu contraseña cambió." };
}

/**
 * RF1.5.3 — Cambiar el correo. GoTrue manda un enlace al correo nuevo
 * (plantilla `cambio-de-correo.html`) y el cambio queda hecho cuando se abre,
 * en `/auth/callback`.
 */
export async function cambiarCorreo(
  _estadoPrevio: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const nuevo = String(datos.get("email") ?? "").trim();
  const actual = String(datos.get("actual") ?? "");
  const valores = { email: nuevo };

  if (!CORREO.test(nuevo)) {
    const mensaje = "Escribí un correo válido.";
    return { estado: "error", mensaje, campos: { email: mensaje }, valores };
  }

  const s = await sesion();
  if (!s.ok) return s.error;
  if (nuevo.toLowerCase() === s.email.toLowerCase()) {
    const mensaje = "Ese ya es tu correo.";
    return { estado: "error", mensaje, campos: { email: mensaje }, valores };
  }
  if (!(await contraseniaCorrecta(s.email, actual))) {
    return { ...CONTRASENIA_INCORRECTA("actual"), valores };
  }

  const { error } = await s.supabase.auth.updateUser({ email: nuevo });
  if (error) {
    const mensaje =
      error.code === "email_exists"
        ? "Ese correo ya tiene una cuenta."
        : "No se pudo pedir el cambio. Probá de nuevo en unos minutos.";
    return { estado: "error", mensaje, campos: { email: mensaje }, valores };
  }
  return {
    estado: "ok",
    mensaje: `Te mandamos un enlace a ${nuevo}. El cambio queda hecho cuando lo abras.`,
  };
}

/**
 * RF1.7 — Eliminar la cuenta, anonimizando.
 *
 * 1. Confirma la contraseña (RF1.7.1, RF1.7.2) y la palabra ELIMINAR.
 * 2. `eliminar_mi_cuenta()` en la base: datos personales fuera, lo pendiente
 *    cancelado o cerrado; postulaciones y reseñas quedan sin nombre.
 * 3. Con la clave de servicio: correo y contraseña de `auth.users`
 *    reemplazados y la cuenta bloqueada, y las imágenes borradas.
 *
 * No se borra la fila de `auth.users`: su borrado en cascada se llevaría las
 * postulaciones y las reseñas.
 */
export async function eliminarCuenta(
  _estadoPrevio: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  const password = String(datos.get("actual") ?? "");
  if (String(datos.get("confirmacion") ?? "").trim() !== "ELIMINAR") {
    return {
      estado: "error",
      mensaje: "Para confirmar, escribí ELIMINAR en mayúsculas.",
    };
  }

  const s = await sesion();
  if (!s.ok) return s.error;
  if (!(await contraseniaCorrecta(s.email, password))) {
    return CONTRASENIA_INCORRECTA("actual");
  }

  const servicio = crearClienteDeServicio();
  if (!servicio) return SIN_CONFIGURAR;

  const { error } = await s.supabase.rpc("eliminar_mi_cuenta");
  if (error) {
    return {
      estado: "error",
      mensaje: "No se pudo eliminar la cuenta. Probá de nuevo.",
    };
  }

  const id = s.user.id;
  await servicio.auth.admin.updateUserById(id, {
    email: `eliminada-${id}@linkyouth.invalid`,
    password: `${randomBytes(24).toString("base64url")}Aa1`,
    user_metadata: {},
    ban_duration: "876000h",
  });
  const { data: imagenes } = await servicio.storage
    .from(BUCKET_IMAGENES)
    .list(id);
  if (imagenes?.length) {
    await servicio.storage
      .from(BUCKET_IMAGENES)
      .remove(imagenes.map((i) => `${id}/${i.name}`));
  }

  await s.supabase.auth.signOut();
  (await cookies()).delete(COOKIE_RECORDAR);
  revalidatePath("/", "layout");
  redirect("/?cuenta=eliminada");
}
