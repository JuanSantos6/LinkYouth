"use server";

import { revalidatePath } from "next/cache";

import { ReglasDeResenia } from "@/lib/dominio/ReglasDeResenia";

import { mensajeDeError, sesionDePostulante } from "./sesion";
import {
  CLAVE_DUPLICADA,
  POLITICA_RLS,
  type EstadoFormulario,
  valoresDe,
} from "./tipos";

/**
 * RF8.1 — Publicar una reseña de una empresa.
 *
 * Quién puede lo decide la política `resenias_solo_quien_postulo`: haberse
 * postulado a alguna búsqueda de esa empresa. Una por persona y empresa
 * (restricción única). La reseña se publica sin el nombre de quien la
 * escribe: `resenias_de_empresa()` no lo devuelve.
 */
export async function publicarResenia(
  _estadoPrevio: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const empresaId = String(datos.get("empresaId") ?? "");
  const calificacion = Number(datos.get("calificacion"));
  const comentario = String(datos.get("comentario") ?? "").trim();
  const valores = valoresDe(datos);

  const campos = ReglasDeResenia.problemas(calificacion, comentario);
  if (Object.keys(campos).length) {
    return {
      estado: "error",
      mensaje: Object.values(campos)[0],
      campos,
      valores,
    };
  }

  const guardia = await sesionDePostulante();
  if (!guardia.ok) return { ...guardia.error, valores };
  const { supabase, usuarioId } = guardia.sesion;

  const { error } = await supabase.from("resenias").insert({
    empresa_id: empresaId,
    perfil_id: usuarioId,
    calificacion,
    comentario,
  });
  if (error) {
    return {
      estado: "error",
      mensaje:
        error.code === CLAVE_DUPLICADA
          ? "Ya habías dejado una reseña de esta empresa."
          : error.code === POLITICA_RLS
            ? "Podés reseñar una empresa después de postularte a una de sus búsquedas."
            : mensajeDeError(error),
      valores,
    };
  }

  revalidatePath(`/organizaciones/${empresaId}`);
  return { estado: "ok", mensaje: "Gracias, tu reseña ya está publicada." };
}
