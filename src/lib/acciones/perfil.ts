"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import { SIN_SESION, type EstadoAccion } from "./tipos";

const LIMITES = {
  titular: 120,
  biografia: 600,
} as const;

/** RF1.5 y RF2.2 — Editar los datos públicos del perfil propio. */
export async function actualizarPerfil(
  _estadoPrevio: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  const nombre = String(datos.get("nombre") ?? "").trim();
  const apellido = String(datos.get("apellido") ?? "").trim();
  const titular = String(datos.get("titular") ?? "").trim();
  const biografia = String(datos.get("biografia") ?? "").trim();
  const ciudad = String(datos.get("ciudad") ?? "").trim();
  const pais = String(datos.get("pais") ?? "").trim();

  if (nombre.length < 2 || apellido.length < 2) {
    return {
      estado: "error",
      mensaje: "El nombre y el apellido son obligatorios.",
    };
  }

  // RF2.2.2: la validación de longitud también corre en el servidor, no solo
  // en el atributo maxlength del campo.
  if (titular.length > LIMITES.titular) {
    return {
      estado: "error",
      mensaje: `El titular no puede superar los ${LIMITES.titular} caracteres.`,
    };
  }

  if (biografia.length > LIMITES.biografia) {
    return {
      estado: "error",
      mensaje: `La biografía no puede superar los ${LIMITES.biografia} caracteres.`,
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
    .update({
      nombre,
      apellido,
      titular: titular || null,
      biografia: biografia || null,
      ciudad: ciudad || null,
      pais: pais || "Uruguay",
    })
    .eq("id", user.id);

  if (error) return { estado: "error", mensaje: error.message };

  revalidatePath("/perfil");

  return { estado: "ok", mensaje: "Perfil actualizado." };
}
