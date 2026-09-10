"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import { SIN_SESION, type EstadoAccion } from "./tipos";

/**
 * Largo máximo de la biografía.
 *
 * `db/schema.sql` declara `bio` como `text` sin restricción de longitud, así
 * que este límite es una decisión de producto (RF2.2.1) que vive únicamente
 * acá. Si alguna vez se agrega el `check` en la base, este número tiene que
 * seguirlo.
 */
const LARGO_MAXIMO_BIO = 600;

/** RF1.5 y RF2.2 — Editar los datos públicos del perfil propio. */
export async function actualizarPerfil(
  _estadoPrevio: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  const nombre = String(datos.get("nombre") ?? "").trim();
  const apellido = String(datos.get("apellido") ?? "").trim();
  const pais = String(datos.get("pais") ?? "").trim();
  const bio = String(datos.get("bio") ?? "").trim();

  if (nombre.length < 2 || apellido.length < 2) {
    return {
      estado: "error",
      mensaje: "El nombre y el apellido son obligatorios.",
    };
  }

  if (!pais) {
    return { estado: "error", mensaje: "El país es obligatorio." };
  }

  // RF2.2.2: la validación de longitud corre en el servidor, no solo en el
  // atributo maxlength del campo.
  if (bio.length > LARGO_MAXIMO_BIO) {
    return {
      estado: "error",
      mensaje: `La biografía no puede superar los ${LARGO_MAXIMO_BIO} caracteres.`,
    };
  }

  const supabase = await createClient();
  if (!supabase) return SIN_SESION;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return SIN_SESION;

  const { error } = await supabase
    .from("perfiles")
    .update({ nombre, apellido, pais, bio: bio || null })
    .eq("id", user.id);

  if (error) return { estado: "error", mensaje: error.message };

  revalidatePath("/perfil");

  return { estado: "ok", mensaje: "Perfil actualizado." };
}
