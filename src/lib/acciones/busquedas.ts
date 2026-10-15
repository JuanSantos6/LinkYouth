"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { comoEstadoPostulacion, comoEstadoVacante } from "@/lib/data/tipos";
import { EstadoParaEmpresa } from "@/lib/dominio/EstadoParaEmpresa";
import {
  type DatosDeBusqueda,
  ReglasDeBusqueda,
} from "@/lib/dominio/ReglasDeBusqueda";

import { mensajeDeError, sesionDeEmpresa, type SesionActiva } from "./sesion";
import {
  CLAVE_DUPLICADA,
  type EstadoAccion,
  type EstadoFormulario,
  valoresDe,
} from "./tipos";

/**
 * Acciones de las búsquedas de una empresa (RF3.1–RF3.4).
 *
 * Cada una empieza por `sesionDeEmpresa()`, y la base vuelve a decidir con sus
 * políticas: lo que se comprueba acá es para dar un mensaje claro, no para
 * conceder el permiso.
 */

const TITULO_REPETIDO =
  "Ya tenés una búsqueda activa con ese título. Cambialo un poco, o pausá o cerrá la otra.";

function leerBusqueda(datos: FormData): DatosDeBusqueda {
  const texto = (campo: string) => String(datos.get(campo) ?? "");
  const lista = (campo: string) => [
    ...new Set(datos.getAll(campo).map(String).filter(Boolean)),
  ];

  return {
    titulo: texto("titulo"),
    descripcion: texto("descripcion"),
    tipo: texto("tipo"),
    modalidad: texto("modalidad"),
    ubicacion: texto("ubicacion"),
    posiciones: Number(texto("posiciones")),
    habilidades: lista("habilidades"),
    tags: lista("tags"),
    tagsOcultos: lista("tagsOcultos"),
  };
}

/**
 * Deja las tres tablas puente de la búsqueda con exactamente lo elegido.
 *
 * Borrar todo y volver a insertar, en vez de calcular qué sobra y qué falta:
 * son a lo sumo una decena de filas por tabla y la versión simple no se
 * desincroniza. Las políticas `…_elimino_los_mios` y `…_administro_los_mios`
 * exigen que la búsqueda sea de la empresa de la sesión.
 */
async function sincronizarPuentes(
  { supabase }: SesionActiva,
  vacanteId: string,
  datos: DatosDeBusqueda,
): Promise<string | null> {
  const borrados = await Promise.all([
    supabase.from("vacante_habilidades").delete().eq("vacante_id", vacanteId),
    supabase.from("vacante_tags_publicos").delete().eq("vacante_id", vacanteId),
    supabase.from("vacante_tags_ocultos").delete().eq("vacante_id", vacanteId),
  ]);
  const errorAlBorrar = borrados.find((r) => r.error)?.error;
  if (errorAlBorrar) return mensajeDeError(errorAlBorrar);

  const insertados = await Promise.all([
    datos.habilidades.length
      ? supabase.from("vacante_habilidades").insert(
          datos.habilidades.map((habilidad_id) => ({
            vacante_id: vacanteId,
            habilidad_id,
          })),
        )
      : null,
    datos.tags.length
      ? supabase
          .from("vacante_tags_publicos")
          .insert(
            datos.tags.map((tag_id) => ({ vacante_id: vacanteId, tag_id })),
          )
      : null,
    datos.tagsOcultos.length
      ? supabase
          .from("vacante_tags_ocultos")
          .insert(
            datos.tagsOcultos.map((tag_id) => ({
              vacante_id: vacanteId,
              tag_id,
            })),
          )
      : null,
  ]);
  const errorAlInsertar = insertados.find((r) => r?.error)?.error;
  return errorAlInsertar ? mensajeDeError(errorAlInsertar) : null;
}

/** RF3.1 y RF3.2 — Publicar una búsqueda nueva o guardar los cambios de una. */
export async function guardarBusqueda(
  _previo: EstadoFormulario,
  formulario: FormData,
): Promise<EstadoFormulario> {
  const datos = leerBusqueda(formulario);
  const id = String(formulario.get("id") ?? "");
  const conValores = (estado: EstadoFormulario): EstadoFormulario => ({
    ...estado,
    valores: valoresDe(formulario),
  });

  const campos = ReglasDeBusqueda.validar(datos);
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

  const fila = {
    titulo: datos.titulo.trim(),
    descripcion: datos.descripcion.trim(),
    tipo: ReglasDeBusqueda.comoTipo(datos.tipo),
    modalidad: datos.modalidad,
    ubicacion: datos.ubicacion.trim() || null,
    posiciones: datos.posiciones,
  };

  // RF3.1.2 — El índice de la base es la defensa final; esto es para avisar
  // antes, con un mensaje sobre el campo, en el caso común.
  const { data: repetida } = await supabase
    .from("vacantes")
    .select("id")
    .eq("empresa_id", usuarioId)
    .eq("estado", "activa")
    // `ilike` sin comodines: `%` y `_` del título se escapan para que
    // «Pasantía 100%» compare como texto y no como patrón.
    .ilike(
      "titulo",
      fila.titulo.replace(/[\\%_]/g, (c) => `\\${c}`),
    )
    .neq("id", id || "00000000-0000-0000-0000-000000000000")
    .limit(1);

  if (repetida?.length) {
    return conValores({
      estado: "error",
      mensaje: "Revisá los campos marcados.",
      campos: { titulo: TITULO_REPETIDO },
    });
  }

  let vacanteId = id;

  if (id) {
    // Editar: solo si es de la empresa y no está cerrada.
    const { data: actual } = await supabase
      .from("vacantes")
      .select("estado")
      .eq("id", id)
      .eq("empresa_id", usuarioId)
      .maybeSingle();

    if (!actual) {
      return conValores({
        estado: "error",
        mensaje: "No encontramos esa búsqueda entre las tuyas.",
      });
    }
    if (!ReglasDeBusqueda.puedeEditar(comoEstadoVacante(actual.estado))) {
      return conValores({
        estado: "error",
        mensaje: "Una búsqueda cerrada ya no se edita.",
      });
    }

    const { error } = await supabase.from("vacantes").update(fila).eq("id", id);
    if (error) {
      return conValores({
        estado: "error",
        mensaje:
          error.code === CLAVE_DUPLICADA
            ? TITULO_REPETIDO
            : mensajeDeError(error),
      });
    }
  } else {
    // Publicar: se crea pausada, se cargan los requisitos y recién entonces
    // se activa. Si algo falla a la mitad, la búsqueda queda pausada y visible
    // solo para la empresa, nunca publicada sin lo que pide.
    const { data, error } = await supabase
      .from("vacantes")
      .insert({ ...fila, empresa_id: usuarioId, estado: "pausada" })
      .select("id")
      .single();

    if (error || !data) {
      return conValores({
        estado: "error",
        mensaje: error
          ? mensajeDeError(error)
          : "No se pudo crear la búsqueda.",
      });
    }
    vacanteId = data.id;
  }

  const problema = await sincronizarPuentes(guardia.sesion, vacanteId, datos);
  if (problema) {
    return conValores({
      estado: "error",
      mensaje: id
        ? `Se guardaron los datos, pero no los requisitos: ${problema}`
        : `La búsqueda quedó guardada como pausada, sin publicar: ${problema}`,
    });
  }

  if (!id) {
    const { error } = await supabase
      .from("vacantes")
      .update({ estado: "activa" })
      .eq("id", vacanteId);

    if (error) {
      return conValores({
        estado: "error",
        mensaje:
          error.code === CLAVE_DUPLICADA
            ? `La búsqueda quedó guardada como pausada. ${TITULO_REPETIDO}`
            : `La búsqueda quedó guardada como pausada: ${mensajeDeError(error)}`,
      });
    }
  }

  revalidatePath("/empresa", "layout");
  revalidatePath("/empleos");
  redirect(`/empresa/busquedas/${vacanteId}?guardada=1`);
}

/** RF3.3.1 — Pausar, reactivar o cerrar una búsqueda. */
export async function cambiarEstadoBusqueda(
  _previo: EstadoAccion,
  formulario: FormData,
): Promise<EstadoAccion> {
  const id = String(formulario.get("id") ?? "");
  const accion = String(formulario.get("accion") ?? "");

  const guardia = await sesionDeEmpresa();
  if (!guardia.ok) return guardia.error;
  const { supabase, usuarioId } = guardia.sesion;

  const { data: actual } = await supabase
    .from("vacantes")
    .select("estado")
    .eq("id", id)
    .eq("empresa_id", usuarioId)
    .maybeSingle();

  if (!actual) {
    return {
      estado: "error",
      mensaje: "No encontramos esa búsqueda entre las tuyas.",
    };
  }

  const destino = ReglasDeBusqueda.estadoTras(
    comoEstadoVacante(actual.estado),
    accion,
  );
  if (!destino) {
    return {
      estado: "error",
      mensaje: "Esa acción no corresponde al estado de la búsqueda.",
    };
  }

  const { error } = await supabase
    .from("vacantes")
    .update({ estado: destino })
    .eq("id", id);

  if (error) {
    return {
      estado: "error",
      mensaje:
        error.code === CLAVE_DUPLICADA
          ? "Ya tenés otra búsqueda activa con el mismo título. Cambiale el título a una de las dos."
          : mensajeDeError(error),
    };
  }

  revalidatePath("/empresa", "layout");
  revalidatePath("/empleos");

  const mensajes = {
    activa: "La búsqueda está activa otra vez.",
    pausada: "La búsqueda quedó pausada: no se ve ni recibe postulaciones.",
    cerrada:
      "La búsqueda quedó cerrada. Las postulaciones nuevas pasaron a descartadas y se les avisó.",
  } as const;
  return { estado: "ok", mensaje: mensajes[destino] };
}

/** Borrar una búsqueda: solo si nadie se postuló (ver migración 005). */
export async function eliminarBusqueda(
  _previo: EstadoAccion,
  formulario: FormData,
): Promise<EstadoAccion> {
  const id = String(formulario.get("id") ?? "");

  const guardia = await sesionDeEmpresa();
  if (!guardia.ok) return guardia.error;
  const { supabase, usuarioId } = guardia.sesion;

  // `.select()` para saber si se borró algo: sin filas, la política no lo
  // dejó, y eso no es un error para Postgres.
  const { data, error } = await supabase
    .from("vacantes")
    .delete()
    .eq("id", id)
    .eq("empresa_id", usuarioId)
    .select("id");

  if (error) return { estado: "error", mensaje: mensajeDeError(error) };
  if (!data?.length) {
    return {
      estado: "error",
      mensaje:
        "No se puede eliminar: alguien ya se postuló. Las postulaciones se conservan, así que cerrala en su lugar.",
    };
  }

  revalidatePath("/empresa", "layout");
  revalidatePath("/empleos");
  redirect("/empresa/busquedas?eliminada=1");
}

/** RF3.4.3 — Cambiar el estado de una postulación recibida. */
export async function cambiarEstadoPostulacion(
  _previo: EstadoAccion,
  formulario: FormData,
): Promise<EstadoAccion> {
  const id = String(formulario.get("id") ?? "");
  const destino = comoEstadoPostulacion(String(formulario.get("estado") ?? ""));

  const guardia = await sesionDeEmpresa();
  if (!guardia.ok) return guardia.error;
  const { supabase } = guardia.sesion;

  // La política de lectura solo deja ver postulaciones de búsquedas propias:
  // si no aparece, no es de esta empresa.
  const { data: actual } = await supabase
    .from("postulaciones")
    .select("estado, vacante_id")
    .eq("id", id)
    .maybeSingle();

  if (!actual) {
    return { estado: "error", mensaje: "No encontramos esa postulación." };
  }

  const estado = new EstadoParaEmpresa(comoEstadoPostulacion(actual.estado));
  if (!estado.puedePasarA(destino)) {
    return {
      estado: "error",
      mensaje: `Una postulación «${estado.etiqueta.toLowerCase()}» no puede pasar a ese estado.`,
    };
  }

  const { data, error } = await supabase
    .from("postulaciones")
    .update({ estado: destino })
    .eq("id", id)
    .select("id");

  if (error || !data?.length) {
    return {
      estado: "error",
      mensaje: error ? mensajeDeError(error) : "No se pudo cambiar el estado.",
    };
  }

  revalidatePath("/empresa", "layout");

  const etiqueta = new EstadoParaEmpresa(destino).etiqueta;
  return {
    estado: "ok",
    mensaje: `Listo: ahora está en «${etiqueta}». Le avisamos a la persona.`,
  };
}
