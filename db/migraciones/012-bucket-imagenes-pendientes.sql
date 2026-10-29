-- ============================================================
-- 012 — Bucket privado `pendientes` (imagen elegida en el registro)
--
-- Con la confirmación de correo obligatoria, quien se registra todavía no
-- tiene sesión cuando elige su foto o su logo, y las políticas de `avatars`
-- exigen `auth.uid()`. En vez de abrir `avatars` a usuarios anónimos, la
-- acción de registro (del lado del servidor, con la clave de servicio) deja
-- la imagen acá, en `<id del usuario nuevo>/imagen.<ext>`, y el alta
-- pendiente la mueve a `avatars/<id>/perfil.<ext>` al confirmar el correo.
--
-- El bucket es privado y NO tiene políticas sobre `storage.objects`: ni
-- anónimos ni usuarios con sesión pueden leer, escribir ni listar nada; solo
-- la clave de servicio, que saltea RLS. Mismos límites que `avatars`.
-- Los que nunca se confirman los borra `scripts/mantenimiento/
-- limpiar-imagenes-pendientes.mjs`.
--
-- Vuelta atrás:
--   delete from storage.objects where bucket_id = 'pendientes';
--   delete from storage.buckets where id = 'pendientes';
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pendientes', 'pendientes', false, 5 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
