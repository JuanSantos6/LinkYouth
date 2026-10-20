"use server";

import { revalidatePath } from "next/cache";

import { mensajeDeError, sesionDePostulante } from "./sesion";
import { type EstadoFormulario, valoresDe } from "./tipos";

const LARGO_MAXIMO = 120;

/** RF2.4.1 — Agregar un estudio en curso o finalizado. */
export async function agregarFormacion(
  _estadoPrevio: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const institucion = String(datos.get("institucion") ?? "").trim();
  const titulo = String(datos.get("titulo") ?? "").trim();
  const estado = String(datos.get("estado") ?? "");
  const valores = valoresDe(datos);

  const campos: Record<string, string> = {};
  if (!institucion) campos.institucion = "Escribí dónde estudiás o estudiaste.";
  else if (institucion.length > LARGO_MAXIMO)
    campos.institucion = `Hasta ${LARGO_MAXIMO} caracteres.`;
  if (!titulo) campos.titulo = "Escribí qué estudiás o estudiaste.";
  else if (titulo.length > LARGO_MAXIMO)
    campos.titulo = `Hasta ${LARGO_MAXIMO} caracteres.`;
  if (estado !== "en_curso" && estado !== "finalizado")
    campos.estado = "Elegí si está en curso o terminado.";
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

  const { error } = await supabase
    .from("formaciones")
    .insert({ perfil_id: usuarioId, institucion, titulo, estado });
  if (error)
    return { estado: "error", mensaje: mensajeDeError(error), valores };

  revalidatePath("/perfil");
  return { estado: "ok", mensaje: "Agregaste el estudio a tu perfil." };
}

/** RF2.4.2 — Quitar un estudio. La política solo deja borrar los propios. */
export async function quitarFormacion(id: string): Promise<EstadoFormulario> {
  const guardia = await sesionDePostulante();
  if (!guardia.ok) return guardia.error;
  const { supabase, usuarioId } = guardia.sesion;

  const { data, error } = await supabase
    .from("formaciones")
    .delete()
    .eq("id", id)
    .eq("perfil_id", usuarioId)
    .select("id");
  if (error || !data?.length) {
    return {
      estado: "error",
      mensaje: error ? mensajeDeError(error) : "Ese estudio ya no estaba.",
    };
  }

  revalidatePath("/perfil");
  return { estado: "ok", mensaje: "Quitaste el estudio." };
}
