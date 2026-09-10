"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import { CLAVE_DUPLICADA, SIN_SESION, type EstadoAccion } from "./tipos";

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

  // RF3.6.4: el estado inicial 'pendiente' es el valor por defecto de la
  // columna. RF3.6.2 lo resuelve la restricción única (vacante_id, perfil_id),
  // y la política de RLS exige además que la vacante esté activa.
  const { error } = await supabase
    .from("postulaciones")
    .insert({ vacante_id: vacanteId, perfil_id: user.id });

  if (error) {
    return {
      estado: "error",
      mensaje:
        error.code === CLAVE_DUPLICADA
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

/**
 * RF3.8 — Cancelar una postulación propia.
 *
 * Es un cambio de estado, no un borrado: de `postulaciones` no se elimina
 * ninguna fila (regla de `CLAUDE.md`, deuda 7.3 de `docs/arquitectura.md`).
 * La política `postulaciones_transiciones_permitidas` deja que el postulante
 * pase únicamente a 'cancelada'.
 */
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
    .update({ estado: "cancelada" })
    .eq("id", postulacionId)
    .eq("perfil_id", user.id);

  if (error) return { estado: "error", mensaje: error.message };

  revalidatePath("/postulaciones");

  return { estado: "ok", mensaje: "Postulación cancelada." };
}
