"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

import { CLAVE_DUPLICADA, type EstadoAccion } from "./tipos";

/** Código de Postgres para violación de una restricción `check`. */
const CHECK_VIOLADO = "23514";

const SIN_CONFIGURAR: EstadoAccion = {
  estado: "error",
  mensaje:
    "La conexión con Supabase no está configurada. Cargá las credenciales en .env.local.",
};

/**
 * Datos del formulario de registro que no van a `auth.users` sino a
 * `perfiles`. Viajan en `options.data` del `signUp` para que sigan
 * disponibles cuando el alta se complete recién en el primer inicio de
 * sesión (ver `completarAlta`).
 */
type DatosDePerfil = {
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  pais: string;
  nombre_usuario: string;
};

function leerDatosDePerfil(datos: FormData): DatosDePerfil {
  return {
    nombre: String(datos.get("nombre") ?? "").trim(),
    apellido: String(datos.get("apellido") ?? "").trim(),
    fecha_nacimiento: String(datos.get("fecha_nacimiento") ?? "").trim(),
    pais: String(datos.get("pais") ?? "").trim(),
    nombre_usuario: String(datos.get("nombre_usuario") ?? "").trim(),
  };
}

/** Lo mismo, pero recuperado de `user_metadata` en un inicio de sesión. */
function leerDatosDeMetadata(user: User): DatosDePerfil | null {
  const meta = user.user_metadata as Partial<DatosDePerfil> | undefined;
  if (
    !meta?.nombre ||
    !meta.apellido ||
    !meta.fecha_nacimiento ||
    !meta.pais ||
    !meta.nombre_usuario
  ) {
    return null;
  }

  return {
    nombre: meta.nombre,
    apellido: meta.apellido,
    fecha_nacimiento: meta.fecha_nacimiento,
    pais: meta.pais,
    nombre_usuario: meta.nombre_usuario,
  };
}

/**
 * Crea las dos filas que acompañan a un usuario de `auth.users`: la cuenta y
 * el perfil. Requiere sesión activa, porque las políticas
 * `cuentas_creo_la_mia` y `perfiles_creo_el_mio` exigen `auth.uid() = id`.
 *
 * Es idempotente: las dos escrituras ignoran el conflicto por clave primaria,
 * así que volver a llamarla sobre una cuenta ya creada no hace nada. Eso es
 * lo que permite invocarla tanto al registrarse como al iniciar sesión.
 *
 * Devuelve `null` si salió bien, o el `EstadoAccion` del error si no.
 */
async function completarAlta(
  supabase: SupabaseClient<Database>,
  user: User,
  datos: DatosDePerfil,
): Promise<EstadoAccion | null> {
  const { error: errorCuenta } = await supabase
    .from("cuentas")
    .upsert(
      { id: user.id, tipo: "individual" },
      { onConflict: "id", ignoreDuplicates: true },
    );

  if (errorCuenta) {
    return { estado: "error", mensaje: errorCuenta.message };
  }

  const { error } = await supabase.from("perfiles").upsert(
    {
      id: user.id,
      nombre: datos.nombre,
      apellido: datos.apellido,
      fecha_nacimiento: datos.fecha_nacimiento,
      pais: datos.pais,
      nombre_usuario: datos.nombre_usuario,
    },
    { onConflict: "id", ignoreDuplicates: true },
  );

  if (!error) return null;

  // La edad la exige el constraint `perfiles_mayor_de_edad` de db/schema.sql
  // (RF1.1.8). No se repite la comprobación acá: la base es la única fuente
  // de la regla y el código solo traduce su respuesta.
  if (error.code === CHECK_VIOLADO) {
    return {
      estado: "error",
      mensaje: "Tenés que ser mayor de 18 años para registrarte.",
    };
  }

  // El conflicto por `id` ya está ignorado arriba, así que una clave duplicada
  // acá solo puede venir del índice único de `nombre_usuario`.
  if (error.code === CLAVE_DUPLICADA) {
    return {
      estado: "error",
      mensaje: "Ese nombre de usuario ya está en uso. Probá con otro.",
    };
  }

  return { estado: "error", mensaje: error.message };
}

/**
 * RF1.1 — Registro de una cuenta individual.
 *
 * Crea el usuario en `auth.users` y, con la sesión que devuelve el `signUp`,
 * las filas de `cuentas` y `perfiles`.
 *
 * Si el proyecto de Supabase tiene activada la confirmación por correo, el
 * `signUp` devuelve usuario pero **no** sesión. Sin sesión, `auth.uid()` es
 * nulo y las políticas de RLS rechazan las dos inserciones. En ese caso los
 * datos quedan guardados en `user_metadata` y el alta se completa en el
 * primer inicio de sesión, que es cuando existe la sesión que RLS pide.
 */
export async function registrarse(
  _estadoPrevio: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  const email = String(datos.get("email") ?? "").trim();
  const password = String(datos.get("password") ?? "");
  const perfil = leerDatosDePerfil(datos);

  if (!email || !password) {
    return {
      estado: "error",
      mensaje: "El correo y la contraseña son obligatorios.",
    };
  }

  if (
    !perfil.nombre ||
    !perfil.apellido ||
    !perfil.fecha_nacimiento ||
    !perfil.pais ||
    !perfil.nombre_usuario
  ) {
    return { estado: "error", mensaje: "Faltan datos del perfil." };
  }

  const supabase = await createClient();
  if (!supabase) return SIN_CONFIGURAR;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: perfil },
  });

  if (error) {
    return { estado: "error", mensaje: error.message };
  }

  if (!data.user) {
    return {
      estado: "error",
      mensaje: "No se pudo crear la cuenta. Probá de nuevo.",
    };
  }

  if (!data.session) {
    return {
      estado: "ok",
      mensaje:
        "Te enviamos un correo para confirmar la cuenta. Al iniciar sesión por primera vez terminamos de crear tu perfil.",
    };
  }

  const fallo = await completarAlta(supabase, data.user, perfil);
  if (fallo) return fallo;

  revalidatePath("/", "layout");
  redirect("/inicio");
}

/**
 * RF1.3 — Inicio de sesión.
 *
 * Después de autenticar, completa el alta si quedó pendiente: es el caso de
 * quien se registró con la confirmación por correo activada y todavía no
 * tiene fila en `perfiles`.
 */
export async function iniciarSesion(
  _estadoPrevio: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  const email = String(datos.get("email") ?? "").trim();
  const password = String(datos.get("password") ?? "");

  if (!email || !password) {
    return {
      estado: "error",
      mensaje: "El correo y la contraseña son obligatorios.",
    };
  }

  const supabase = await createClient();
  if (!supabase) return SIN_CONFIGURAR;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // Un mensaje único para credenciales incorrectas y para correo inexistente:
  // distinguirlos le diría a cualquiera qué direcciones están registradas.
  if (error || !data.user) {
    return {
      estado: "error",
      mensaje: "El correo o la contraseña no son correctos.",
    };
  }

  const perfil = leerDatosDeMetadata(data.user);
  if (perfil) {
    const fallo = await completarAlta(supabase, data.user, perfil);
    if (fallo) return fallo;
  }

  revalidatePath("/", "layout");
  redirect("/inicio");
}

/** RF1.3.5 — Cerrar la sesión. */
export async function cerrarSesion(): Promise<void> {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login");
}
