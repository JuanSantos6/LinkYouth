"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { comoEstadoEvento } from "@/lib/data/tipos";
import {
  type DatosDeEvento,
  ReglasDeEvento,
} from "@/lib/dominio/ReglasDeEvento";
import { ReglasDeRegistro } from "@/lib/dominio/ReglasDeRegistro";
import {
  leerArchivo,
  subirImagenDePerfil,
} from "@/lib/supabase/almacenamiento";

import { mensajeDeError, sesionDeEmpresa } from "./sesion";
import { type EstadoAccion, type EstadoFormulario, valoresDe } from "./tipos";

/** Acciones de los eventos de una empresa (RF4.1–RF4.3). */

function leerEvento(datos: FormData): DatosDeEvento {
  const texto = (campo: string) => String(datos.get(campo) ?? "");
  return {
    titulo: texto("titulo"),
    descripcion: texto("descripcion"),
    fechaHora: texto("fechaHora"),
    direccion: texto("direccion"),
    latitud: texto("latitud"),
    longitud: texto("longitud"),
    tags: [...new Set(datos.getAll("tags").map(String).filter(Boolean))],
  };
}

/** RF4.1 y RF4.2 — Crear un evento o guardar los cambios de uno. */
export async function guardarEvento(
  _previo: EstadoFormulario,
  formulario: FormData,
): Promise<EstadoFormulario> {
  const datos = leerEvento(formulario);
  const id = String(formulario.get("id") ?? "");
  const imagen = leerArchivo(formulario, "imagen");
  const conValores = (estado: EstadoFormulario): EstadoFormulario => ({
    ...estado,
    valores: valoresDe(formulario),
  });

  const campos = ReglasDeEvento.validar(datos);
  const problemaDeImagen = imagen && ReglasDeRegistro.problemaDeImagen(imagen);
  if (problemaDeImagen) campos.imagen = problemaDeImagen;

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

  const latitud = ReglasDeEvento.leerCoordenada(datos.latitud);
  const longitud = ReglasDeEvento.leerCoordenada(datos.longitud);
  const fila = {
    titulo: datos.titulo.trim(),
    descripcion: datos.descripcion.trim(),
    // Validada arriba: acá ya existe.
    fecha_hora: ReglasDeEvento.deHoraLocal(datos.fechaHora)!.toISOString(),
    direccion: datos.direccion.trim() || null,
    latitud,
    longitud,
  };

  let eventoId = id;

  if (id) {
    const { data: actual } = await supabase
      .from("eventos")
      .select("estado, fecha_hora")
      .eq("id", id)
      .eq("empresa_id", usuarioId)
      .maybeSingle();

    if (!actual) {
      return conValores({
        estado: "error",
        mensaje: "No encontramos ese evento entre los tuyos.",
      });
    }
    if (!ReglasDeEvento.puedeModificar(actual)) {
      return conValores({
        estado: "error",
        mensaje: "Un evento cancelado o que ya pasó no se edita.",
      });
    }

    const { error } = await supabase.from("eventos").update(fila).eq("id", id);
    if (error)
      return conValores({ estado: "error", mensaje: mensajeDeError(error) });
  } else {
    const { data, error } = await supabase
      .from("eventos")
      .insert({ ...fila, empresa_id: usuarioId })
      .select("id")
      .single();

    if (error || !data) {
      return conValores({
        estado: "error",
        mensaje: error ? mensajeDeError(error) : "No se pudo crear el evento.",
      });
    }
    eventoId = data.id;
  }

  // RF4.1.5 — Los tags del evento: borrar y volver a insertar, como con las
  // búsquedas. Son pocas filas y la versión simple no se desincroniza.
  const borrado = await supabase
    .from("evento_tags")
    .delete()
    .eq("evento_id", eventoId);
  const insertado =
    !borrado.error && datos.tags.length
      ? await supabase
          .from("evento_tags")
          .insert(datos.tags.map((tag_id) => ({ evento_id: eventoId, tag_id })))
      : null;
  const errorDeTags = borrado.error ?? insertado?.error;

  // RF4.1.4 — La imagen va debajo de la carpeta de la empresa, que es lo único
  // que la política del bucket deja escribir.
  let avisoDeImagen = "";
  if (imagen) {
    const { url, problema } = await subirImagenDePerfil(
      supabase,
      usuarioId,
      imagen,
      `eventos/${eventoId}`,
    );
    if (url) {
      await supabase
        .from("eventos")
        .update({ imagen_url: url })
        .eq("id", eventoId);
    } else {
      avisoDeImagen = problema ?? "No se pudo subir la imagen.";
    }
  }

  revalidatePath("/empresa", "layout");
  revalidatePath("/eventos");

  if (errorDeTags || avisoDeImagen) {
    // El evento ya existe: volver al formulario con un error haría que se
    // cree otro igual al reintentar. Se va al detalle y se dice qué faltó.
    const faltante = errorDeTags
      ? "las áreas del evento"
      : `la imagen (${avisoDeImagen})`;
    redirect(
      `/empresa/eventos/${eventoId}?guardado=1&falto=${encodeURIComponent(faltante)}`,
    );
  }

  redirect(`/empresa/eventos/${eventoId}?guardado=1`);
}

/** RF4.3 — Cancelar un evento. La base les avisa a los inscriptos (RF4.3.2). */
export async function cancelarEvento(
  _previo: EstadoAccion,
  formulario: FormData,
): Promise<EstadoAccion> {
  const id = String(formulario.get("id") ?? "");

  const guardia = await sesionDeEmpresa();
  if (!guardia.ok) return guardia.error;
  const { supabase, usuarioId } = guardia.sesion;

  const { data: actual } = await supabase
    .from("eventos")
    .select("estado, fecha_hora")
    .eq("id", id)
    .eq("empresa_id", usuarioId)
    .maybeSingle();

  if (!actual) {
    return {
      estado: "error",
      mensaje: "No encontramos ese evento entre los tuyos.",
    };
  }
  if (
    !ReglasDeEvento.puedeModificar({
      ...actual,
      estado: comoEstadoEvento(actual.estado),
    })
  ) {
    return {
      estado: "error",
      mensaje: "Ese evento ya estaba cancelado o ya pasó.",
    };
  }

  const { error } = await supabase
    .from("eventos")
    .update({ estado: "cancelado" })
    .eq("id", id);

  if (error) return { estado: "error", mensaje: mensajeDeError(error) };

  revalidatePath("/empresa", "layout");
  revalidatePath("/eventos");
  return {
    estado: "ok",
    mensaje:
      "El evento quedó cancelado y les avisamos a las personas inscriptas.",
  };
}
