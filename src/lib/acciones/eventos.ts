"use server";

import { revalidatePath } from "next/cache";

import { mensajeDeError, sesionDePostulante } from "./sesion";
import { CLAVE_DUPLICADA, type EstadoAccion } from "./tipos";

/** RF4.5 — Inscribirse a un evento institucional. */
export async function inscribirse(
  _estadoPrevio: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  const eventoId = String(datos.get("eventoId") ?? "");
  if (!eventoId) {
    return { estado: "error", mensaje: "Falta identificar el evento." };
  }

  const guardia = await sesionDePostulante();
  if (!guardia.ok) return guardia.error;
  const { supabase, usuarioId } = guardia.sesion;

  const { error } = await supabase
    .from("inscripciones_evento")
    .insert({ evento_id: eventoId, perfil_id: usuarioId });

  if (error) {
    return {
      estado: "error",
      mensaje:
        error.code === CLAVE_DUPLICADA
          ? "Ya estabas inscripto a este evento."
          : mensajeDeError(error),
    };
  }

  revalidatePath("/eventos");
  revalidatePath("/inicio");

  return { estado: "ok", mensaje: "Listo, quedaste inscripto." };
}

/**
 * RF4.6 — Cancelar la inscripción propia.
 *
 * Acá sí se borra la fila: `inscripciones_evento` no lleva estado y su
 * política `inscripciones_cancelo_la_mia` habilita el delete al dueño.
 */
export async function cancelarInscripcion(
  _estadoPrevio: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  const eventoId = String(datos.get("eventoId") ?? "");
  if (!eventoId) {
    return { estado: "error", mensaje: "Falta identificar el evento." };
  }

  const guardia = await sesionDePostulante();
  if (!guardia.ok) return guardia.error;
  const { supabase, usuarioId } = guardia.sesion;

  const { error } = await supabase
    .from("inscripciones_evento")
    .delete()
    .eq("evento_id", eventoId)
    .eq("perfil_id", usuarioId);

  if (error) return { estado: "error", mensaje: mensajeDeError(error) };

  revalidatePath("/eventos");
  revalidatePath("/inicio");

  return { estado: "ok", mensaje: "Cancelaste tu inscripción." };
}
