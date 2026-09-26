"use server";

import { revalidatePath } from "next/cache";

import { mensajeDeError, sesionDePostulante } from "./sesion";
import { CLAVE_DUPLICADA, type EstadoAccion } from "./tipos";

/** RF3.6 — Postularse a una vacante. */
export async function postularse(
  _estadoPrevio: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  const vacanteId = String(datos.get("vacanteId") ?? "");
  if (!vacanteId) {
    return { estado: "error", mensaje: "Falta identificar la vacante." };
  }

  const guardia = await sesionDePostulante();
  if (!guardia.ok) return guardia.error;
  const { supabase, usuarioId } = guardia.sesion;

  // RF3.6.4: el estado inicial 'pendiente' es el valor por defecto de la
  // columna. RF3.6.2 lo resuelve la restricción única (vacante_id, perfil_id),
  // y la política de RLS exige además que la vacante esté activa y que quien
  // se postula tenga fila en `perfiles`.
  const { error } = await supabase
    .from("postulaciones")
    .insert({ vacante_id: vacanteId, perfil_id: usuarioId });

  if (error) {
    return {
      estado: "error",
      mensaje:
        error.code === CLAVE_DUPLICADA
          ? "Ya te habías postulado a esta búsqueda."
          : mensajeDeError(error),
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

  const guardia = await sesionDePostulante();
  if (!guardia.ok) return guardia.error;
  const { supabase, usuarioId } = guardia.sesion;

  // El `.select("id")` es lo que permite distinguir «no se tocó ninguna fila»
  // de «salió bien». Sin él, cancelar la postulación de otro no devuelve error
  // —RLS y el `.eq` no encuentran la fila, y la respuesta es un éxito vacío— y
  // la pantalla mostraba «Postulación cancelada.» sobre algo que no cambió.
  const { data, error } = await supabase
    .from("postulaciones")
    .update({ estado: "cancelada" })
    .eq("id", postulacionId)
    .eq("perfil_id", usuarioId)
    .select("id");

  if (error) return { estado: "error", mensaje: mensajeDeError(error) };

  if (!data || data.length === 0) {
    return {
      estado: "error",
      mensaje: "Esa postulación no es tuya, o ya no se puede cancelar.",
    };
  }

  revalidatePath("/postulaciones");

  return { estado: "ok", mensaje: "Postulación cancelada." };
}
