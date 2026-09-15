import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { ReglasDeRegistro } from "@/lib/dominio/ReglasDeRegistro";
import type { Database } from "@/types/database";

/**
 * Bucket de fotos de perfil y logos. Se crea con
 * `db/migraciones/002-bucket-avatars.sql`, o a mano desde el panel.
 */
export const BUCKET_IMAGENES = "avatars";

/** Resultado de la subida: la URL pública, o el motivo por el que no hay. */
export type SubidaDeImagen =
  { url: string; problema: null } | { url: null; problema: string };

const EXTENSIONES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Sube la foto de perfil o el logo al bucket y devuelve su URL pública.
 *
 * El nombre del archivo lo arma el servidor —`<id de usuario>/perfil.<ext>`— y
 * no se usa el que trae el navegador: un nombre de archivo es texto que manda
 * la persona, y el camino dentro del bucket es lo que la política de RLS
 * compara contra `auth.uid()`.
 *
 * `upsert` para que volver a subir reemplace en vez de acumular archivos
 * huérfanos, y `cacheControl` corto porque la foto cambia y la URL no.
 *
 * Nunca lanza: la subida es accesoria al alta, y una excepción acá dejaría la
 * cuenta creada con el formulario mostrando un error. Quien llama decide qué
 * hacer con `problema`.
 */
export async function subirImagenDePerfil(
  supabase: SupabaseClient<Database>,
  usuarioId: string,
  archivo: File,
): Promise<SubidaDeImagen> {
  const problema = ReglasDeRegistro.problemaDeImagen(archivo);
  if (problema) return { url: null, problema };

  const extension = EXTENSIONES[archivo.type];
  if (!extension) {
    return { url: null, problema: "La imagen tiene que ser JPG, PNG o WebP." };
  }

  const camino = `${usuarioId}/perfil.${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET_IMAGENES)
    .upload(camino, archivo, {
      upsert: true,
      contentType: archivo.type,
      cacheControl: "60",
    });

  if (error) {
    // El caso más común es que el bucket todavía no exista: se nombra, porque
    // «Bucket not found» a secas manda a buscar el problema al código.
    return {
      url: null,
      problema: /not found/i.test(error.message)
        ? `Falta crear el bucket «${BUCKET_IMAGENES}» en Supabase Storage.`
        : error.message,
    };
  }

  const { data } = supabase.storage.from(BUCKET_IMAGENES).getPublicUrl(camino);

  return { url: data.publicUrl, problema: null };
}

/**
 * Saca el archivo del `FormData` si de verdad hay uno.
 *
 * Un `<input type="file">` vacío igual viaja: llega un `File` de cero bytes y
 * nombre vacío. Sin este filtro, cada registro sin foto intentaría una subida
 * que falla y ensucia el alta con un error que no le importa a nadie.
 */
export function leerArchivo(datos: FormData, campo: string): File | null {
  const valor = datos.get(campo);
  if (!(valor instanceof File) || valor.size === 0) return null;
  return valor;
}
