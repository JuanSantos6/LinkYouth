import "server-only";

import { cache } from "react";

import { Institucion } from "@/lib/dominio/Institucion";
import { createClient } from "@/lib/supabase/server";
import {
  conReferencia,
  type CreditoDeFoto,
  creditoDe,
  esDeUnsplash,
  type FilaDeFoto,
  imagenDeUnsplash,
} from "@/lib/unsplash";

import type { ImagenDePagina } from "@/lib/imagenes";

/**
 * Las fotos de Unsplash que eligió `scripts/fotos/` (migración 008). Se leen
 * de la base, nunca de la API: la API se consulta una sola vez, al elegirlas.
 *
 * Sin base, sin la tabla o con un error, todo devuelve vacío y cada pantalla
 * usa su respaldo (la foto propia, la ilustración o el avatar con iniciales):
 * una foto que falta nunca rompe una pantalla.
 */

const COLUMNAS =
  "url, autor, autor_enlace, enlace, descripcion, ancho, alto, color";

export type MapaDeFotos = ReadonlyMap<string, FilaDeFoto>;

/**
 * Todos los lugares fijos con su foto (`portada:bienvenida`,
 * `vacio:busquedas`, `rubro:tecnologia`, `institucion:udelar`…), una vez por
 * request: `cache` hace que la portada, los estados vacíos y las fichas que
 * los piden en la misma pantalla compartan la consulta. Son unas decenas de
 * filas.
 */
export const obtenerLugaresConFoto = cache(async (): Promise<MapaDeFotos> => {
  const supabase = await createClient();
  if (!supabase) return new Map();

  const { data, error } = await supabase
    .from("lugares_con_foto")
    .select(`lugar, fotos ( ${COLUMNAS} )`);
  if (error || !data) return new Map();

  return new Map(
    data.flatMap(({ lugar, fotos }) => (fotos ? [[lugar, fotos]] : [])),
  );
});

/** La foto de un lugar como imagen de página, o el respaldo. */
export async function imagenDeLugar<R extends ImagenDePagina | null>(
  lugar: string | null,
  respaldo: R,
  opciones?: { encuadre?: "caras" | "entropia" },
): Promise<ImagenDePagina | R> {
  if (!lugar) return respaldo;
  const fila = (await obtenerLugaresConFoto()).get(lugar);
  return fila ? imagenDeUnsplash(fila, opciones) : respaldo;
}

/**
 * La atribución de las fotos de Unsplash que usa una lista de cosas (eventos,
 * portadas de empresa), por URL. Las que no son de Unsplash no se buscan.
 */
export async function creditosDe(
  urls: readonly (string | null | undefined)[],
): Promise<ReadonlyMap<string, CreditoDeFoto & { descripcion: string }>> {
  const deUnsplash = [...new Set(urls.filter(esDeUnsplash))];
  if (deUnsplash.length === 0) return new Map();

  const supabase = await createClient();
  if (!supabase) return new Map();

  const { data, error } = await supabase
    .from("fotos")
    .select("url, autor, autor_enlace, descripcion")
    .in("url", deUnsplash);
  if (error || !data) return new Map();

  return new Map(
    data.map((fila) => [
      fila.url,
      { ...creditoDe(fila), descripcion: fila.descripcion },
    ]),
  );
}

/** Todas las fotos de Unsplash, para la lista de créditos de `/legales`. */
export async function obtenerTodasLasFotos(): Promise<
  (CreditoDeFoto & { descripcion: string; enlace: string })[]
> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("fotos")
    .select("autor, autor_enlace, enlace, descripcion")
    .order("autor");
  if (error || !data) return [];

  return data.map((fila) => ({
    ...creditoDe(fila),
    descripcion: fila.descripcion,
    enlace: conReferencia(fila.enlace),
  }));
}

/** Le agrega a cada elemento la atribución de su `imagen_url`, si es de Unsplash. */
export async function conCreditos<T extends { imagen_url: string | null }>(
  elementos: T[],
): Promise<(T & { credito: CreditoDeFoto | null })[]> {
  const creditos = await creditosDe(elementos.map((e) => e.imagen_url));
  return elementos.map((elemento) => ({
    ...elemento,
    credito: (elemento.imagen_url && creditos.get(elemento.imagen_url)) || null,
  }));
}

/**
 * La foto genérica (campus, aula) de cada institución, por nombre: la URL de
 * Unsplash, para `Avatar` o `ImagenDeInstitucion`. Nunca el logo real. Las
 * que no tienen foto no aparecen, y quien la muestra pone las iniciales.
 */
export async function fotosDeInstituciones(
  nombres: readonly string[],
): Promise<Record<string, string>> {
  const lugares = await obtenerLugaresConFoto();
  return Object.fromEntries(
    nombres.flatMap((nombre) => {
      const fila = lugares.get(`institucion:${new Institucion(nombre).id}`);
      return fila ? [[nombre, fila.url]] : [];
    }),
  );
}
