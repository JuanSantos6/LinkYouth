"use server";

import { TipoDePersonalidad } from "@/lib/dominio/TipoDePersonalidad";

import { revalidarInterviewLab } from "./revalidar";
import { mensajeDeError, sesionDePostulante } from "./sesion";
import { type EstadoAccion, type EstadoFormulario, valoresDe } from "./tipos";

/**
 * Cargar o cambiar el resultado del test de personalidad (migración 009).
 * Desde la migración 010 se hace solo en el Interview Lab: el perfil lo
 * muestra sin dejar editarlo.
 *
 * El joven elige el tipo de una lista y la variante: nunca lo escribe. Igual
 * se valida acá (y la base lo vuelve a validar con su `check`), porque el
 * formulario se puede mandar a mano. La fecha de carga la pone la base.
 */
export async function guardarPersonalidad(
  _estadoPrevio: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const valores = valoresDe(datos);
  const letras = String(datos.get("letras") ?? "");
  const variante = String(datos.get("variante") ?? "");
  const visible = datos.get("visible") === "si";

  const campos: Record<string, string> = {};
  if (!letras) campos.letras = "Elegí tu tipo de la lista.";
  if (variante !== "A" && variante !== "T")
    campos.variante = "Elegí si tu resultado terminó en -A o en -T.";
  const tipo = TipoDePersonalidad.armar(letras, variante);
  if (!tipo && !campos.letras && !campos.variante)
    campos.letras = "Ese tipo no está en la lista. Elegí uno de los 16.";
  if (Object.keys(campos).length || !tipo) {
    return {
      estado: "error",
      mensaje: Object.values(campos)[0] ?? "Elegí tu tipo de la lista.",
      campos,
      valores,
    };
  }

  const guardia = await sesionDePostulante();
  if (!guardia.ok) return { ...guardia.error, valores };
  const { supabase, usuarioId } = guardia.sesion;

  const { data, error } = await supabase
    .from("perfil_personalidad")
    .upsert({
      perfil_id: usuarioId,
      tipo: tipo.codigo,
      visible_para_empresas: visible,
    })
    .select("perfil_id");
  if (error)
    return { estado: "error", mensaje: mensajeDeError(error), valores };
  if (!data?.length) {
    return {
      estado: "error",
      mensaje: "No se pudo guardar el resultado.",
      valores,
    };
  }

  revalidarInterviewLab();
  return {
    estado: "ok",
    mensaje: `Guardaste tu resultado: ${tipo.nombre} (${tipo.codigo}).`,
  };
}

/**
 * El interruptor «Mostrar a las empresas a las que me postulo». Cambia solo
 * la visibilidad: la fecha de carga queda como estaba.
 */
export async function cambiarVisibilidadDePersonalidad(
  _estadoPrevio: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  const visible = datos.get("visible") === "si";

  const guardia = await sesionDePostulante();
  if (!guardia.ok) return guardia.error;
  const { supabase, usuarioId } = guardia.sesion;

  const { data, error } = await supabase
    .from("perfil_personalidad")
    .update({ visible_para_empresas: visible })
    .eq("perfil_id", usuarioId)
    .select("perfil_id");
  if (error) return { estado: "error", mensaje: mensajeDeError(error) };
  if (!data?.length) {
    return {
      estado: "error",
      mensaje: "Primero cargá tu resultado.",
    };
  }

  revalidarInterviewLab();
  return {
    estado: "ok",
    mensaje: visible
      ? "Las empresas a las que te postulás ya pueden verlo."
      : "Las empresas ya no lo ven.",
  };
}

/** Borrar el resultado. Vuelve a «Sin completar». */
export async function borrarPersonalidad(): Promise<EstadoAccion> {
  const guardia = await sesionDePostulante();
  if (!guardia.ok) return guardia.error;
  const { supabase, usuarioId } = guardia.sesion;

  const { data, error } = await supabase
    .from("perfil_personalidad")
    .delete()
    .eq("perfil_id", usuarioId)
    .select("perfil_id");
  if (error) return { estado: "error", mensaje: mensajeDeError(error) };
  if (!data?.length) {
    return { estado: "error", mensaje: "No había ningún resultado cargado." };
  }

  revalidarInterviewLab();
  return { estado: "ok", mensaje: "Borraste tu resultado." };
}
