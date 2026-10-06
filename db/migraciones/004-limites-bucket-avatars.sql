-- ============================================================
-- 004 — Límites del bucket `avatars` (H7)
--
-- El bucket es público y aceptaba cualquier archivo, de cualquier tamaño:
-- un usuario con sesión podía subir HTML a su carpeta y servirlo desde el
-- dominio de la app. La app ya valida 2 MB y JPG/PNG/WebP
-- (`ReglasDeRegistro`), pero esa validación se saltea llamando a Storage
-- directo con el token de la sesión. Acá la regla la hace cumplir Storage.
--
-- Storage compara el tipo con el `Content-Type` de la subida, que es el que
-- después usa para servir el archivo: un `text/html` ya no entra.
--
-- Vuelta atrás:
--   update storage.buckets
--   set file_size_limit = null, allowed_mime_types = null
--   where id = 'avatars';
-- ============================================================

update storage.buckets
set file_size_limit = 2 * 1024 * 1024,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'avatars';
