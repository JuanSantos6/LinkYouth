-- ============================================================
-- 002 — Bucket `avatars`
--
-- Fotos de perfil y logos de empresa. El bucket se puede crear a mano
-- en Supabase Dashboard > Storage > New bucket, marcándolo público;
-- este script hace lo mismo y además deja las políticas, que por el
-- panel hay que escribir igual.
--
-- Se ejecuta en Supabase Dashboard > SQL Editor.
-- ============================================================

-- Público de lectura: la foto de perfil se ve en el feed y en la ficha, y una
-- URL firmada que vence obligaría a renovarla en cada render. Lo que no es
-- público es escribir, que es de lo que se ocupan las políticas de abajo.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Cada quien escribe únicamente dentro de su propia carpeta, que se llama
-- como su id de usuario. `storage.foldername(name)` devuelve el camino en
-- partes: la primera es la carpeta, y tiene que coincidir con `auth.uid()`.
-- Sin esto, cualquier persona autenticada podría pisar el avatar de otra.

create policy "avatars_lectura_publica"
on storage.objects for select
using (bucket_id = 'avatars');

create policy "avatars_subo_los_mios"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "avatars_reemplazo_los_mios"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "avatars_borro_los_mios"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);
