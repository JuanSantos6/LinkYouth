"use server";

import {
  esTestOpcional,
  testDe,
  validarResultado,
} from "@/lib/dominio/InterviewLab";

import { revalidarInterviewLab } from "./revalidar";
import { mensajeDeError, sesionDePostulante } from "./sesion";
import {
  CLAVE_DUPLICADA,
  type EstadoAccion,
  type EstadoFormulario,
  valoresDe,
} from "./tipos";

const TEST_INVALIDO: EstadoAccion = {
  estado: "error",
  mensaje: "Ese test no está en el Interview Lab.",
};

/**
 * Cargar o cambiar el resultado de un test de JobCannon (migración 010).
 *
 * Nivel o puntaje y resultado principal, los dos opcionales: haberlo hecho
 * ya cuenta. Primero intenta actualizar y, si no había fila, la crea: un
 * `upsert` necesitaría permiso de escritura sobre la clave, que la base no
 * le da al joven. El origen («declarado») y la fecha los pone la base.
 */
export async function guardarResultadoDeTest(
  _estadoPrevio: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const valores = valoresDe(datos);
  const test = datos.get("test");
  if (!esTestOpcional(test)) return { ...TEST_INVALIDO, valores };

  const puntaje = String(datos.get("puntaje") ?? "").trim();
  const resultado = String(datos.get("resultado") ?? "").trim();
  const campos = validarResultado({ puntaje, resultado });
  if (Object.keys(campos).length) {
    return {
      estado: "error",
      mensaje: Object.values(campos)[0]!,
      campos,
      valores,
    };
  }

  const guardia = await sesionDePostulante();
  if (!guardia.ok) return { ...guardia.error, valores };
  const { supabase, usuarioId } = guardia.sesion;

  const cambios = { puntaje: puntaje || null, resultado: resultado || null };
  const actualizado = await supabase
    .from("resultados_de_tests")
    .update(cambios)
    .eq("perfil_id", usuarioId)
    .eq("test", test)
    .select("test");
  if (actualizado.error) {
    return {
      estado: "error",
      mensaje: mensajeDeError(actualizado.error),
      valores,
    };
  }

  if (!actualizado.data?.length) {
    const { error } = await supabase.from("resultados_de_tests").insert({
      perfil_id: usuarioId,
      test,
      ...cambios,
      visible_para_empresas: datos.get("visible") === "si",
    });
    // Dos envíos seguidos: el segundo choca con el primero, que ya guardó.
    if (error && error.code !== CLAVE_DUPLICADA) {
      return { estado: "error", mensaje: mensajeDeError(error), valores };
    }
  }

  revalidarInterviewLab();
  return {
    estado: "ok",
    mensaje: `Guardaste tu resultado del ${testDe(test).nombre.toLowerCase()}.`,
  };
}

/** El interruptor «Mostrar a las empresas a las que me postulo» de un test. */
export async function cambiarVisibilidadDeResultado(
  _estadoPrevio: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  const test = datos.get("test");
  if (!esTestOpcional(test)) return TEST_INVALIDO;
  const visible = datos.get("visible") === "si";

  const guardia = await sesionDePostulante();
  if (!guardia.ok) return guardia.error;
  const { supabase, usuarioId } = guardia.sesion;

  const { data, error } = await supabase
    .from("resultados_de_tests")
    .update({ visible_para_empresas: visible })
    .eq("perfil_id", usuarioId)
    .eq("test", test)
    .select("test");
  if (error) return { estado: "error", mensaje: mensajeDeError(error) };
  if (!data?.length) {
    return { estado: "error", mensaje: "Primero cargá tu resultado." };
  }

  revalidarInterviewLab();
  return {
    estado: "ok",
    mensaje: visible
      ? "Las empresas a las que te postulás ya pueden verlo."
      : "Las empresas ya no lo ven.",
  };
}

/** Borrar el resultado de un test. Vuelve a «Pendiente». */
export async function borrarResultadoDeTest(
  _estadoPrevio: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  const test = datos.get("test");
  if (!esTestOpcional(test)) return TEST_INVALIDO;

  const guardia = await sesionDePostulante();
  if (!guardia.ok) return guardia.error;
  const { supabase, usuarioId } = guardia.sesion;

  const { data, error } = await supabase
    .from("resultados_de_tests")
    .delete()
    .eq("perfil_id", usuarioId)
    .eq("test", test)
    .select("test");
  if (error) return { estado: "error", mensaje: mensajeDeError(error) };
  if (!data?.length) {
    return { estado: "error", mensaje: "No había ningún resultado cargado." };
  }

  revalidarInterviewLab();
  return { estado: "ok", mensaje: "Borraste el resultado." };
}
