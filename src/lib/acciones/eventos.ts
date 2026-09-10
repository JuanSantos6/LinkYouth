"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import { SIN_SESION, type EstadoAccion } from "./tipos";

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
    .from("inscripciones")
    .insert({ evento_id: eventoId, perfil_id: user.id });

  if (error) {
    return {
      estado: "error",
      mensaje:
        error.code === "23505"
          ? "Ya estabas inscripto a este evento."
          : error.message,
    };
  }

  revalidatePath("/eventos");
  revalidatePath("/inicio");

  return { estado: "ok", mensaje: "Listo, quedaste inscripto." };
}
