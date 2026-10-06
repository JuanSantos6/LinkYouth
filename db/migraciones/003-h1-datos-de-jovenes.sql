-- ============================================================
-- 003 — H1 y H13: los datos de cada joven dejan de ser legibles por todos
--
-- Antes: `perfil_tags`, `perfil_habilidades`, `formaciones` y `resenias`
-- tenían `for select to authenticated using (true)`. Con el registro abierto
-- y autoconfirmado, eso era "cualquiera puede leer todo" (H1).
--
-- Además, `perfiles_publicos` era una vista actualizable, de `postgres` (que
-- tiene `bypassrls`), con permisos de escritura para `anon` y
-- `authenticated`: sin sesión se podía modificar o borrar el perfil de
-- cualquier joven a través de PostgREST (H13).
--
-- Después:
--   - Cada joven lee lo suyo.
--   - Una empresa lee tags, habilidades y formaciones de un joven solo si ese
--     joven tiene una postulación no cancelada a una vacante suya.
--   - `resenias`: las lee quien la escribió y la empresa reseñada.
--   - `perfiles_publicos` queda en `id` y `nombre_usuario` (lo único que usa
--     el registro para avisar que el nombre está ocupado) y solo de lectura.
--   - `formaciones_publicas` expone institución y título, sin `perfil_id`,
--     para la ficha de institución, que agrupa las de todos.
--
-- Las políticas de escritura no cambian.
--
-- Se ejecuta entero o no se ejecuta: va dentro de una transacción.
-- Vuelta atrás: ~/respaldos/2026-10-06-h1/politicas-antes.sql en el servidor.
-- ============================================================

begin;

-- ¿El joven `perfil` se postuló a alguna vacante de la empresa de la sesión?
-- `security invoker`: corre con los permisos de quien consulta, así que
-- `postulaciones` y `vacantes` siguen filtradas por sus propias políticas.
create or replace function public.es_postulante_de_mi_empresa(perfil uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.postulaciones p
    join public.vacantes v on v.id = p.vacante_id
    where p.perfil_id = perfil
      and v.empresa_id = (select auth.uid())
      and p.estado <> 'cancelada'
  );
$$;

revoke all on function public.es_postulante_de_mi_empresa(uuid) from public, anon;
grant execute on function public.es_postulante_de_mi_empresa(uuid) to authenticated;

-- --- perfil_tags --------------------------------------------------------------
drop policy if exists "perfil_tags_lectura_publica" on public.perfil_tags;
drop policy if exists "perfil_tags_veo_los_mios_o_de_mis_postulantes" on public.perfil_tags;
create policy "perfil_tags_veo_los_mios_o_de_mis_postulantes"
  on public.perfil_tags for select to authenticated
  using (
    perfil_id = (select auth.uid())
    or public.es_postulante_de_mi_empresa(perfil_id)
  );

-- --- perfil_habilidades ---------------------------------------------------------
drop policy if exists "perfil_habilidades_lectura_publica" on public.perfil_habilidades;
drop policy if exists "perfil_habilidades_veo_las_mias_o_de_mis_postulantes" on public.perfil_habilidades;
create policy "perfil_habilidades_veo_las_mias_o_de_mis_postulantes"
  on public.perfil_habilidades for select to authenticated
  using (
    perfil_id = (select auth.uid())
    or public.es_postulante_de_mi_empresa(perfil_id)
  );

-- --- formaciones ----------------------------------------------------------------
drop policy if exists "formaciones_lectura_publica" on public.formaciones;
drop policy if exists "formaciones_veo_las_mias_o_de_mis_postulantes" on public.formaciones;
create policy "formaciones_veo_las_mias_o_de_mis_postulantes"
  on public.formaciones for select to authenticated
  using (
    perfil_id = (select auth.uid())
    or public.es_postulante_de_mi_empresa(perfil_id)
  );

-- --- resenias -------------------------------------------------------------------
drop policy if exists "resenias_lectura_publica" on public.resenias;
drop policy if exists "resenias_veo_las_mias_o_de_mi_empresa" on public.resenias;
create policy "resenias_veo_las_mias_o_de_mi_empresa"
  on public.resenias for select to authenticated
  using (
    perfil_id = (select auth.uid())
    or empresa_id = (select auth.uid())
  );

-- --- perfiles_publicos (H6 y H13) -----------------------------------------------
-- Una vista no se puede achicar con `create or replace`: hay que recrearla.
-- `security_barrier` impide que un filtro de quien consulta vea filas que
-- `cuenta_activa` descarta. Los `revoke` van porque los privilegios por
-- defecto de Supabase le dan todo a `anon` y `authenticated` al crearla.
drop view if exists public.perfiles_publicos;
create view public.perfiles_publicos
  with (security_barrier = true)
as
  select id, nombre_usuario
  from public.perfiles
  where public.cuenta_activa(id);

revoke all on public.perfiles_publicos from public, anon, authenticated;
grant select on public.perfiles_publicos to anon, authenticated;

-- --- formaciones_publicas -------------------------------------------------------
-- Para la ficha de institución (`obtenerInstitucion`), que agrupa por nombre
-- las formaciones de todos. Sin `perfil_id`: se ve qué se estudia y dónde,
-- no quién.
drop view if exists public.formaciones_publicas;
create view public.formaciones_publicas
  with (security_barrier = true)
as
  select institucion, titulo
  from public.formaciones;

revoke all on public.formaciones_publicas from public, anon, authenticated;
grant select on public.formaciones_publicas to authenticated;

commit;
