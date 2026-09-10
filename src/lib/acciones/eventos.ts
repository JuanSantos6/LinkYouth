"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import { CLAVE_DUPLICADA, SIN_SESION, type EstadoAccion } from "./tipos";

/** RF4.5 — Inscribirse a un evento institucional. */
export async function inscribirse(
  _estadoPrevio: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  const eventoId = String(datos.get("eventoId") ?? "");
  if (!eventoId) {
    return { estado: "error", mensaje: "Falta identificar el evento." };
  }

  const supabase = await createClient();
  if (!supabase) return SIN_SESION;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return SIN_SESION;

  const { error } = await supabase
    .from("inscripciones_evento")
    .insert({ evento_id: eventoId, perfil_id: user.id });

  if (error) {
    return {
      estado: "error",
      mensaje:
        error.code === CLAVE_DUPLICADA
          ? "Ya estabas inscripto a este evento."
          : error.message,
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

  const supabase = await createClient();
  if (!supabase) return SIN_SESION;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return SIN_SESION;

  const { error } = await supabase
    .from("inscripciones_evento")
    .delete()
    .eq("evento_id", eventoId)
    .eq("perfil_id", user.id);

  if (error) return { estado: "error", mensaje: error.message };

  revalidatePath("/eventos");
  revalidatePath("/inicio");

  return { estado: "ok", mensaje: "Cancelaste tu inscripción." };
}
