"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import { SIN_SESION, type EstadoAccion } from "./tipos";

/** RF3.6 — Postularse a una vacante. */
export async function postularse(
  _estadoPrevio: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  const vacanteId = String(datos.get("vacanteId") ?? "");
  if (!vacanteId) {
    return { estado: "error", mensaje: "Falta identificar la vacante." };
  }

  const supabase = await createClient();
  if (!supabase) return SIN_SESION;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return SIN_SESION;

  // RF3.6.4: la postulación nace en estado "pendiente" (valor por defecto de
  // la columna). RF3.6.2 lo cubre la restricción única de la tabla.
  const { error } = await supabase
    .from("postulaciones")
    .insert({ vacante_id: vacanteId, perfil_id: user.id });

  if (error) {
    const duplicada = error.code === "23505";

    return {
      estado: "error",
      mensaje: duplicada
        ? "Ya te habías postulado a esta búsqueda."
        : error.message,
    };
  }

  revalidatePath("/inicio");
  revalidatePath("/empleos");
  revalidatePath("/postulaciones");

  return {
    estado: "ok",
    mensaje: "Postulación enviada. Vas a ver el estado en «Postulaciones».",
  };
}

/** RF3.8 — Cancelar una postulación propia. */
export async function cancelarPostulacion(
  _estadoPrevio: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  const postulacionId = String(datos.get("postulacionId") ?? "");
  if (!postulacionId) {
    return { estado: "error", mensaje: "Falta identificar la postulación." };
  }

  const supabase = await createClient();
  if (!supabase) return SIN_SESION;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return SIN_SESION;

  const { error } = await supabase
    .from("postulaciones")
    .delete()
    .eq("id", postulacionId)
    .eq("perfil_id", user.id);

  if (error) return { estado: "error", mensaje: error.message };

  revalidatePath("/postulaciones");

  return { estado: "ok", mensaje: "Postulación cancelada." };
}
