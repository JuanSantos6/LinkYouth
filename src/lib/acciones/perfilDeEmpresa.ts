"use server";

import { revalidatePath } from "next/cache";

import { ReglasDePerfilDeEmpresa } from "@/lib/dominio/ReglasDePerfilDeEmpresa";
import { ReglasDeRegistro } from "@/lib/dominio/ReglasDeRegistro";
import {
  leerArchivo,
  subirImagenDePerfil,
} from "@/lib/supabase/almacenamiento";

import { mensajeDeError, sesionDeEmpresa } from "./sesion";
import { CLAVE_DUPLICADA, type EstadoFormulario, valoresDe } from "./tipos";

const RUT_OCUPADO = "Ese RUT ya está registrado por otra empresa.";
const RAZON_OCUPADA = "Ya hay otra empresa registrada con esa razón social.";

/** RF7.1 — Editar el perfil de la empresa: datos, RUT, sitio web y logo. */
export async function actualizarPerfilDeEmpresa(
  _previo: EstadoFormulario,
  formulario: FormData,
): Promise<EstadoFormulario> {
  const texto = (campo: string) => String(formulario.get(campo) ?? "");
  const datos = {
    razonSocial: texto("razonSocial"),
    rut: texto("rut"),
    rubro: texto("rubro"),
    descripcion: texto("descripcion"),
    sitioWeb: texto("sitioWeb"),
  };
  const logo = leerArchivo(formulario, "logo");
  const conValores = (estado: EstadoFormulario): EstadoFormulario => ({
    ...estado,
    valores: valoresDe(formulario),
  });

  const campos = ReglasDePerfilDeEmpresa.validar(datos);
  const problemaDeLogo = logo && ReglasDeRegistro.problemaDeImagen(logo);
  if (problemaDeLogo) campos.logo = problemaDeLogo;

  if (Object.keys(campos).length > 0) {
    return conValores({
      estado: "error",
      mensaje: "Revisá los campos marcados.",
      campos,
    });
  }

  const guardia = await sesionDeEmpresa();
  if (!guardia.ok) return conValores(guardia.error);
  const { supabase, usuarioId } = guardia.sesion;

  const rut = ReglasDeRegistro.normalizarRut(datos.rut);

  // El índice único de la base es la defensa final; esto da el mensaje sobre
  // el campo. `empresas` se lee entera sin problema: es pública y el RUT es un
  // dato registral (ver `registrarEmpresa`).
  const { data: tomado } = await supabase
    .from("empresas")
    .select("id")
    .eq("rut", rut)
    .neq("id", usuarioId)
    .limit(1);

  if (tomado?.length) {
    return conValores({
      estado: "error",
      mensaje: "Revisá los campos marcados.",
      campos: { rut: RUT_OCUPADO },
    });
  }

  const { error } = await supabase
    .from("empresas")
    .update({
      razon_social: datos.razonSocial.trim(),
      rut,
      rubro: datos.rubro.trim(),
      descripcion: datos.descripcion.trim() || null,
      sitio_web: ReglasDePerfilDeEmpresa.normalizarSitio(datos.sitioWeb),
    })
    .eq("id", usuarioId);

  if (error) {
    // Dos índices únicos en `empresas`: cuál saltó lo dice el mensaje de
    // Postgres, que nombra la restricción.
    if (error.code === CLAVE_DUPLICADA) {
      const esRut = /rut/i.test(error.message);
      return conValores({
        estado: "error",
        mensaje: "Revisá los campos marcados.",
        campos: esRut ? { rut: RUT_OCUPADO } : { razonSocial: RAZON_OCUPADA },
      });
    }
    return conValores({ estado: "error", mensaje: mensajeDeError(error) });
  }

  let aviso = "";
  if (logo) {
    const { url, problema } = await subirImagenDePerfil(
      supabase,
      usuarioId,
      logo,
    );
    if (url) {
      await supabase
        .from("empresas")
        .update({ logo_url: url })
        .eq("id", usuarioId);
    } else {
      aviso = ` El logo no se pudo subir: ${problema}`;
    }
  }

  revalidatePath("/empresa", "layout");
  return {
    estado: aviso ? "error" : "ok",
    mensaje: aviso ? `Se guardaron los datos.${aviso}` : "Perfil actualizado.",
  };
}
