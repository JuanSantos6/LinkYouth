import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";

import { ReglasDeRegistro } from "@/lib/dominio/ReglasDeRegistro";
import { crearClienteDeServicio } from "@/lib/supabase/admin";
import {
  EXTENSIONES,
  subirImagenDePerfil,
} from "@/lib/supabase/almacenamiento";
import type { Database } from "@/types/database";

/**
 * La imagen que se elige al registrarse, cuando todavía no hay sesión.
 *
 * Con la confirmación de correo obligatoria, `signUp` no devuelve sesión y las
 * políticas de `avatars` (`auth.uid()` = carpeta) rechazan la subida. En vez
 * de abrir ese bucket a anónimos, la acción de registro deja la imagen en
 * `pendientes/<id>/imagen.<ext>` —bucket privado y sin políticas, solo la
 * clave de servicio entra: migración 012— y el alta pendiente
 * (`completarAltaPendiente`) la mueve a `avatars/<id>/perfil.<ext>` al
 * confirmar el correo. Las que nunca se confirman las borra
 * `scripts/mantenimiento/limpiar-imagenes-pendientes.mjs`.
 *
 * Qué hay en `user_metadata` (lo escribe el registro y lo lee el alta):
 * - `imagen_pendiente: true` — hay una imagen esperando en `pendientes`.
 * - `imagen_fallida: true` — no se pudo guardar; el panel avisa hasta que la
 *   persona suba una desde su perfil (ver `AvisoDeImagenFallida`).
 *
 * Nada de esto frena el registro: la cuenta existe y la imagen se puede subir
 * después, así que ningún fallo acá devuelve un error al formulario.
 */
export const BUCKET_PENDIENTES = "pendientes";

/** La ruta de la imagen pendiente de un usuario, sin la extensión. */
const carpetaDe = (usuarioId: string) => `${usuarioId}/`;

/**
 * Valida la imagen en el servidor (peso y formato real, no el `type` que
 * declaró el navegador) y la deja en `pendientes`. Devuelve `true` si quedó
 * guardada. Nunca lanza.
 */
export async function guardarImagenPendiente(
  usuarioId: string,
  archivo: File,
): Promise<boolean> {
  const problema = ReglasDeRegistro.problemaDeImagen(archivo);
  const formato = await ReglasDeRegistro.formatoReal(archivo);
  if (problema || !formato) {
    console.warn(
      `Imagen pendiente de ${usuarioId} rechazada: ${problema ?? "formato"}`,
    );
    return false;
  }

  const servicio = crearClienteDeServicio();
  if (!servicio) return false;

  const { error } = await servicio.storage
    .from(BUCKET_PENDIENTES)
    .upload(`${carpetaDe(usuarioId)}imagen.${EXTENSIONES[formato]}`, archivo, {
      upsert: true,
      contentType: formato,
    });
  if (error) {
    console.warn(
      `No se pudo guardar la imagen pendiente de ${usuarioId}: ${error.message}`,
    );
    return false;
  }
  return true;
}

/** Marca que la imagen no se pudo guardar, para que el panel lo avise. */
export async function marcarImagenFallida(usuarioId: string): Promise<void> {
  await crearClienteDeServicio()?.auth.admin.updateUserById(usuarioId, {
    user_metadata: { imagen_pendiente: false, imagen_fallida: true },
  });
}

/**
 * Pasa la imagen pendiente a su lugar definitivo y la asocia a la fila:
 * `perfiles.foto_url` o `empresas.logo_url`. No hace nada si el registro no
 * dejó una (`imagen_pendiente` ausente). Si algo falla deja `imagen_fallida`
 * y sigue: el alta ya está completa y esto no la deshace. Es idempotente.
 *
 * Va con la sesión de la propia cuenta: la copia a `avatars` la autoriza
 * `avatars_subo_los_mios`, igual que cualquier subida desde el perfil.
 */
export async function aplicarImagenPendiente(
  supabase: SupabaseClient<Database>,
  user: User,
): Promise<void> {
  if (user.user_metadata?.imagen_pendiente !== true) return;

  const servicio = crearClienteDeServicio();
  if (!servicio) return;

  const esEmpresa = Boolean(
    user.user_metadata.razon_social && user.user_metadata.rubro,
  );
  let guardada = false;

  try {
    const { data: lista } = await servicio.storage
      .from(BUCKET_PENDIENTES)
      .list(user.id);
    const objeto = lista?.find((o) => o.name.startsWith("imagen."));
    if (objeto) {
      const ruta = `${carpetaDe(user.id)}${objeto.name}`;
      const { data: blob } = await servicio.storage
        .from(BUCKET_PENDIENTES)
        .download(ruta);
      const formato = blob && (await ReglasDeRegistro.formatoReal(blob));
      if (blob && formato) {
        const archivo = new File([blob], objeto.name, { type: formato });
        const subida = await subirImagenDePerfil(supabase, user.id, archivo);
        if (subida.url) {
          const { error } = esEmpresa
            ? await supabase
                .from("empresas")
                .update({ logo_url: subida.url })
                .eq("id", user.id)
            : await supabase
                .from("perfiles")
                .update({ foto_url: subida.url })
                .eq("id", user.id);
          guardada = !error;
        }
      }
      if (guardada)
        await servicio.storage.from(BUCKET_PENDIENTES).remove([ruta]);
    }
  } catch (error) {
    console.warn(`Imagen pendiente de ${user.id}: ${String(error)}`);
  }

  await servicio.auth.admin.updateUserById(user.id, {
    user_metadata: { imagen_pendiente: false, imagen_fallida: !guardada },
  });
}

/**
 * La persona subió una imagen propia: el aviso de «no pudimos guardar tu
 * imagen» ya no corresponde. Con su propia sesión, sin clave de servicio.
 */
export async function limpiarAvisoDeImagen(
  supabase: SupabaseClient<Database>,
): Promise<void> {
  await supabase.auth.updateUser({ data: { imagen_fallida: false } });
}
