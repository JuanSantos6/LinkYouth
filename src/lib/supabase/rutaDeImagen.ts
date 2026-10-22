import { esDeUnsplash } from "@/lib/unsplash";

/** Prefijo de los archivos públicos de Supabase Storage. */
const PREFIJO_PUBLICO = "/storage/v1/object/public/";

/**
 * Convierte la URL de una imagen pública de Supabase Storage en una ruta
 * relativa (`/storage/v1/object/public/avatars/…`).
 *
 * Supabase no se publica en internet: el navegador pide las fotos a la propia
 * app, que las trae de Storage por la red interna con el `rewrite` de
 * `next.config.ts`. Por eso la URL absoluta que devuelve `getPublicUrl`
 * (`http://<ip interna>:8000/…`) no le sirve a un visitante de afuera.
 *
 * Acepta también las URLs absolutas que ya están guardadas en la base, de
 * cualquier origen: lo que se mira es el camino. La vista previa `blob:` (la
 * foto elegida antes de subirla) vuelve tal cual.
 *
 * Las fotos de Unsplash (`images.unsplash.com`) vuelven tal cual: sus
 * directrices piden mostrarlas por hotlink, y la CSP solo deja ese origen
 * (2026-10-22). Cualquier otra cosa devuelve `null`: un `logo_url` apuntando
 * a otro sitio haría que cada visitante de la portada le pida la imagen a ese
 * sitio (y le entregue su IP). Ver `docs/seguridad.md`.
 */
export function rutaDeImagen(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith(PREFIJO_PUBLICO)) return url;
  if (url.startsWith("blob:")) return url;
  if (esDeUnsplash(url)) return url;

  let analizada: URL;
  try {
    analizada = new URL(url);
  } catch {
    return null;
  }

  const esHttp =
    analizada.protocol === "http:" || analizada.protocol === "https:";
  if (!esHttp || !analizada.pathname.startsWith(PREFIJO_PUBLICO)) return null;

  return analizada.pathname + analizada.search;
}
