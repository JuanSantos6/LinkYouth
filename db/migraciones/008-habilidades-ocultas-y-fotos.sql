-- ============================================================
-- 008 — Habilidades ocultas de una búsqueda y fotos de Unsplash
--
-- RF3.1.6  La empresa marca cada habilidad que pide como pública u oculta.
--          Hasta ahora solo los intereses (tags) podían ser ocultos; las
--          habilidades se publicaban todas.
-- RF3.9    Las habilidades ocultas entran en la coincidencia que ve solo la
--          empresa, igual que los tags ocultos.
--
-- Por qué una tabla y no una columna `oculta` en `vacante_habilidades`:
-- esa tabla se lee sin sesión (es parte del aviso), y RLS decide filas,
-- no columnas. Una columna haría viajar la fila oculta a cualquiera. Es
-- el mismo motivo por el que existe `vacante_tags_ocultos` (RNF5).
--
-- Fotos: las imágenes de Unsplash se muestran con la URL que devuelve su
-- API (hotlink), como piden sus directrices. `fotos` guarda, por cada
-- URL, el autor y los enlaces de la atribución; la URL misma vive en la
-- columna de quien la usa (`perfiles.foto_url`, `empresas.portada_url`,
-- `eventos.imagen_url`) o, para los lugares fijos de la página (portada,
-- estados vacíos, rubros, instituciones), en `lugares_con_foto`. Las
-- elige un script una sola vez (`scripts/fotos/`), no cada visita. Ver
-- `docs/decisiones.md`, 2026-10-22.
--
-- Para bases creadas antes de esta migración. En una base nueva no hace
-- falta: `db/schema.sql` y `db/politicas.sql` ya traen todo esto.
--
-- Se ejecuta como `postgres`:
--   docker exec -i supabase-db psql -U postgres -d postgres \
--     -v ON_ERROR_STOP=1 < db/migraciones/008-habilidades-ocultas-y-fotos.sql
--
-- Es idempotente y va entera en una transacción.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- Habilidades ocultas
-- ------------------------------------------------------------
create table if not exists public.vacante_habilidades_ocultas (
  vacante_id    uuid not null references public.vacantes(id) on delete cascade,
  habilidad_id  uuid not null references public.habilidades(id) on delete cascade,
  primary key (vacante_id, habilidad_id)
);

create index if not exists idx_vacante_habilidades_ocultas_habilidad
  on public.vacante_habilidades_ocultas (habilidad_id);

-- Mismo trato que `vacante_tags_ocultos`: solo la empresa dueña de la
-- vacante la ve o la toca. Ningún postulante tiene política de select.
alter table public.vacante_habilidades_ocultas enable row level security;
revoke all on public.vacante_habilidades_ocultas from public, anon;
grant select, insert, delete on public.vacante_habilidades_ocultas to authenticated;

drop policy if exists "habilidades_ocultas_solo_empresa_duena_lee" on public.vacante_habilidades_ocultas;
create policy "habilidades_ocultas_solo_empresa_duena_lee"
on public.vacante_habilidades_ocultas for select
to authenticated
using (
  exists (select 1 from public.vacantes v where v.id = vacante_id and v.empresa_id = (select auth.uid()))
);

drop policy if exists "habilidades_ocultas_solo_empresa_duena_escribe" on public.vacante_habilidades_ocultas;
create policy "habilidades_ocultas_solo_empresa_duena_escribe"
on public.vacante_habilidades_ocultas for insert
to authenticated
with check (
  exists (select 1 from public.vacantes v where v.id = vacante_id and v.empresa_id = (select auth.uid()))
);

drop policy if exists "habilidades_ocultas_solo_empresa_duena_elimina" on public.vacante_habilidades_ocultas;
create policy "habilidades_ocultas_solo_empresa_duena_elimina"
on public.vacante_habilidades_ocultas for delete
to authenticated
using (
  exists (select 1 from public.vacantes v where v.id = vacante_id and v.empresa_id = (select auth.uid()))
);

-- ------------------------------------------------------------
-- Fotos de Unsplash
-- ------------------------------------------------------------
create table if not exists public.fotos (
  -- La URL `urls.raw` que devuelve la API, sin parámetros de tamaño: la
  -- aplicación le agrega `w`, `q` y `fm` al mostrarla.
  url             text primary key check (url like 'https://images.unsplash.com/%'),
  unsplash_id     text not null unique,
  autor           text not null,
  -- Perfil del fotógrafo y página de la foto en unsplash.com, para la
  -- atribución con enlace.
  autor_enlace    text not null check (autor_enlace like 'https://unsplash.com/%'),
  enlace          text not null check (enlace like 'https://unsplash.com/%'),
  descripcion     text not null,
  ancho           int not null check (ancho > 0),
  alto            int not null check (alto > 0),
  -- Color dominante que da la API, de fondo mientras carga.
  color           text check (color is null or color ~ '^#[0-9a-fA-F]{6}$'),
  -- Cuándo se avisó a `download_location`: Unsplash pide hacerlo al usarla.
  descarga_avisada_en timestamptz,
  creada_en       timestamptz not null default now()
);

-- Los lugares fijos de la página: `portada:bienvenida`, `vacio:postulaciones`,
-- `rubro:tecnologia`, `institucion:udelar`…
create table if not exists public.lugares_con_foto (
  lugar  text primary key check (lugar ~ '^[a-z]+:[a-z0-9-]+$'),
  url    text not null references public.fotos(url) on update cascade
);

alter table public.empresas add column if not exists portada_url text;

-- Las dos tablas son la lista de fotos de banco y su atribución: no son
-- datos de nadie, y la portada las lee sin sesión. Nadie escribe desde la
-- API: las carga el script con `service_role`.
alter table public.fotos enable row level security;
alter table public.lugares_con_foto enable row level security;
revoke all on public.fotos, public.lugares_con_foto from public, anon, authenticated;
grant select on public.fotos, public.lugares_con_foto to anon, authenticated;
grant all on public.fotos, public.lugares_con_foto to service_role;

drop policy if exists "fotos_lectura_publica" on public.fotos;
create policy "fotos_lectura_publica"
on public.fotos for select
to anon, authenticated
using (true);

drop policy if exists "lugares_con_foto_lectura_publica" on public.lugares_con_foto;
create policy "lugares_con_foto_lectura_publica"
on public.lugares_con_foto for select
to anon, authenticated
using (true);

-- La empresa elimina su cuenta: la portada se va con el resto de sus datos.
create or replace function public.eliminar_mi_cuenta()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  yo     uuid := auth.uid();
  sufijo text;
begin
  if yo is null then
    raise exception 'Hace falta una sesión para eliminar la cuenta';
  end if;
  sufijo := left(replace(yo::text, '-', ''), 12);

  update cuentas set eliminada = true where id = yo;

  if exists (select 1 from perfiles where id = yo) then
    update postulaciones set estado = 'cancelada'
    where perfil_id = yo
      and estado in ('pendiente', 'en_revision', 'entrevista');

    delete from perfil_tags where perfil_id = yo;
    delete from perfil_habilidades where perfil_id = yo;
    delete from formaciones where perfil_id = yo;
    delete from inscripciones_evento where perfil_id = yo;

    update perfiles
    set nombre_usuario = 'cuenta_eliminada_' || sufijo,
        nombre = 'Cuenta',
        apellido = 'eliminada',
        fecha_nacimiento = date '1900-01-01',
        pais = '—',
        bio = null,
        foto_url = null
    where id = yo;
  end if;

  if exists (select 1 from empresas where id = yo) then
    update vacantes set estado = 'cerrada'
    where empresa_id = yo and estado <> 'cerrada';

    update eventos set estado = 'cancelado'
    where empresa_id = yo and estado = 'activo' and fecha_hora > now();

    update empresas
    set razon_social = 'Empresa eliminada ' || sufijo,
        rut = null,
        descripcion = null,
        logo_url = null,
        portada_url = null,
        sitio_web = null
    where id = yo;
  end if;

  delete from notificaciones where cuenta_id = yo;
end;
$$;

revoke all on function public.eliminar_mi_cuenta() from public, anon;
grant execute on function public.eliminar_mi_cuenta() to authenticated;

notify pgrst, 'reload schema';

commit;
