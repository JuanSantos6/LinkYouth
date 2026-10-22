-- ============================================================
-- 009 — Resultado del test de personalidad (16Personalities)
--
-- 16Personalities no tiene API: el joven hace el test en su sitio y carga
-- acá el resultado que le dio, eligiéndolo de la lista de los 16 tipos con
-- su variante (-A o -T). LinkYouth no lo valida ni lo usa para nada más que
-- mostrarlo: no entra en la compatibilidad, en los filtros ni en el orden
-- de los candidatos. Ver `docs/decisiones.md`, 2026-10-22.
--
-- Por qué una tabla y no tres columnas en `perfiles`: `perfiles` solo deja
-- leer la fila propia, y RLS decide filas, no columnas. Para que una empresa
-- lo vea habría que abrir la fila entera (con `fecha_nacimiento`) o sumar
-- una función `security definer` que repita la regla. Con una tabla aparte
-- la regla es una política, como pide CLAUDE.md: el joven ve lo suyo; una
-- empresa, solo si el joven lo marcó visible y se postuló a una de sus
-- búsquedas sin cancelar (`es_postulante_de_mi_empresa`, el mismo criterio
-- que `candidatos_de_mi_empresa` para las postulaciones). Sin sesión, nada.
--
-- El nombre del tipo («Arquitecto») no se guarda: sale del código
-- (`src/lib/dominio/TipoDePersonalidad.ts`).
--
-- Para bases creadas antes de esta migración. En una base nueva no hace
-- falta: `db/schema.sql` y `db/politicas.sql` ya traen todo esto.
--
-- Se ejecuta como `postgres`, con un respaldo antes:
--   ~/bin/respaldo-linkyouth.sh
--   docker exec -i supabase-db psql -U postgres -d postgres \
--     -v ON_ERROR_STOP=1 < db/migraciones/009-personalidad.sql
--
-- Es idempotente y va entera en una transacción.
-- ============================================================

begin;

create table if not exists public.perfil_personalidad (
  perfil_id              uuid primary key references public.perfiles(id) on delete cascade,
  -- Uno de los 16 tipos con su variante: INTJ-A, ENFP-T…
  tipo                   text not null
                         check (tipo ~ '^[EI][SN][TF][JP]-[AT]$'),
  -- La pone el disparador de abajo: al cargar y cada vez que cambia el tipo.
  cargada_en             timestamptz not null default now(),
  -- Por defecto, no: el joven decide mostrarlo.
  visible_para_empresas  boolean not null default false
);

-- La fecha de carga no la elige quien escribe: se pone al insertar y al
-- cambiar el tipo, y no se mueve si solo cambia la visibilidad.
create or replace function public.personalidad_fecha_de_carga()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' or new.tipo is distinct from old.tipo then
    new.cargada_en := now();
  else
    new.cargada_en := old.cargada_en;
  end if;
  return new;
end;
$$;

drop trigger if exists perfil_personalidad_fecha_de_carga on public.perfil_personalidad;
create trigger perfil_personalidad_fecha_de_carga
before insert or update on public.perfil_personalidad
for each row execute function public.personalidad_fecha_de_carga();

alter table public.perfil_personalidad enable row level security;
revoke all on public.perfil_personalidad from public, anon;
grant select, insert, update, delete on public.perfil_personalidad to authenticated;

drop policy if exists "personalidad_veo_la_mia_o_la_compartida" on public.perfil_personalidad;
create policy "personalidad_veo_la_mia_o_la_compartida"
on public.perfil_personalidad for select
to authenticated
using (
  perfil_id = (select auth.uid())
  or (
    visible_para_empresas
    and public.cuenta_activa(perfil_id)
    and public.es_postulante_de_mi_empresa(perfil_id)
  )
);

drop policy if exists "personalidad_cargo_la_mia" on public.perfil_personalidad;
create policy "personalidad_cargo_la_mia"
on public.perfil_personalidad for insert
to authenticated
with check (
  perfil_id = (select auth.uid())
  and exists (select 1 from public.perfiles where id = (select auth.uid()))
);

drop policy if exists "personalidad_edito_la_mia" on public.perfil_personalidad;
create policy "personalidad_edito_la_mia"
on public.perfil_personalidad for update
to authenticated
using (perfil_id = (select auth.uid()))
with check (perfil_id = (select auth.uid()));

drop policy if exists "personalidad_borro_la_mia" on public.perfil_personalidad;
create policy "personalidad_borro_la_mia"
on public.perfil_personalidad for delete
to authenticated
using (perfil_id = (select auth.uid()));

-- ------------------------------------------------------------
-- RF1.7 — Al eliminar la cuenta, el resultado se borra con el resto del
-- perfil. Es la función de `db/politicas.sql` con una línea más.
-- ------------------------------------------------------------
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
    delete from perfil_personalidad where perfil_id = yo;
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

commit;
