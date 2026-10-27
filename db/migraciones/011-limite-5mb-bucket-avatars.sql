-- ============================================================
-- 011 — Límite de 5 MB en el bucket `avatars`
--
-- La migración 004 lo había fijado en 2 MB. Una foto sacada con el celular
-- pasa de eso casi siempre, y la persona recibía un rechazo sin poder hacer
-- nada razonable. Se sube a 5 MB (`ReglasDeRegistro.PESO_MAXIMO_IMAGEN`);
-- los tipos permitidos no cambian.
--
-- Vuelta atrás:
--   update storage.buckets set file_size_limit = 2 * 1024 * 1024
--   where id = 'avatars';
-- ============================================================

update storage.buckets
set file_size_limit = 5 * 1024 * 1024
where id = 'avatars';
