-- ============================================================
-- 010 — Interview Lab: resultados de los tests de JobCannon
--
-- El Interview Lab del joven reúne cuatro tests: el de personalidad de
-- 16Personalities (obligatorio, ya en `perfil_personalidad`, migración 009)
-- y tres opcionales de JobCannon: psicométrico, juicio situacional y
-- aptitudes. La API de JobCannon es paga y no hay clave: el joven hace cada
-- test en su sitio y carga acá lo que le dio (nivel o puntaje y el resultado
-- principal, todo opcional). Ver `docs/decisiones.md`, 2026-10-22.
--
-- Misma regla que la personalidad: el joven ve y edita lo suyo; una
-- empresa lo lee solo si el joven lo marcó visible y se postuló a una de
-- sus búsquedas sin cancelar. Sin sesión, nada. No entra en la
-- compatibilidad, los filtros ni el orden de los candidatos.
--
-- Preparada para la API: `origen` dice si el resultado lo declaró el joven
-- o llegó verificado. Desde la API pública (`authenticated`) solo se
-- escribe `declarado`: la columna no tiene permiso de escritura y el valor
-- por defecto es ese. Un resultado verificado lo escribiría el servidor con
-- la clave de servicio; si después el joven lo edita, vuelve a `declarado`
-- (ver el disparador).
--
-- Para bases creadas antes de esta migración. En una base nueva no hace
-- falta: `db/schema.sql` y `db/politicas.sql` ya traen todo esto.
--
-- Se ejecuta como `postgres`, con un respaldo antes:
--   ~/bin/respaldo-linkyouth.sh
--   docker exec -i supabase-db psql -U postgres -d postgres \
--     -v ON_ERROR_STOP=1 < db/migraciones/010-interview-lab.sql
--
-- Es idempotente y va entera en una transacción.
-- ============================================================

begin;

create table if not exists public.resultados_de_tests (
  perfil_id              uuid not null references public.perfiles(id) on delete cascade,
  test                   text not null
                         check (test in ('psicometrico', 'juicio_situacional', 'aptitudes')),
  -- «Excepcional», «24 de 30»… Opcional.
  puntaje                text check (puntaje is null or char_length(puntaje) <= 40),
  -- El resultado principal, en una frase. Opcional.
  resultado              text check (resultado is null or char_length(resultado) <= 280),
  -- La pone el disparador de abajo: al cargar y cada vez que cambia el
  -- resultado.
  cargado_en             timestamptz not null default now(),
  -- Por defecto, no: el joven decide mostrarlo.
  visible_para_empresas  boolean not null default false,
  origen                 text not null default 'declarado'
                         check (origen in ('declarado', 'verificado')),
  primary key (perfil_id, test)
);

-- La fecha de carga no la elige quien escribe, y un resultado verificado
-- que se edita deja de estarlo.
create or replace function public.resultado_de_test_al_escribir()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    new.cargado_en := now();
  elsif new.puntaje is distinct from old.puntaje
        or new.resultado is distinct from old.resultado then
    new.cargado_en := now();
    if new.origen is not distinct from old.origen then
      new.origen := 'declarado';
    end if;
  else
    new.cargado_en := old.cargado_en;
  end if;
  return new;
end;
$$;

drop trigger if exists resultados_de_tests_al_escribir on public.resultados_de_tests;
create trigger resultados_de_tests_al_escribir
before insert or update on public.resultados_de_tests
for each row execute function public.resultado_de_test_al_escribir();

alter table public.resultados_de_tests enable row level security;
revoke all on public.resultados_de_tests from public, anon, authenticated;
grant select, delete on public.resultados_de_tests to authenticated;
-- Sin `origen` ni `cargado_en`: el joven no los elige.
grant insert (perfil_id, test, puntaje, resultado, visible_para_empresas)
  on public.resultados_de_tests to authenticated;
grant update (puntaje, resultado, visible_para_empresas)
  on public.resultados_de_tests to authenticated;
grant all on public.resultados_de_tests to service_role;

drop policy if exists "resultados_veo_los_mios_o_los_compartidos" on public.resultados_de_tests;
create policy "resultados_veo_los_mios_o_los_compartidos"
on public.resultados_de_tests for select
to authenticated
using (
  perfil_id = (select auth.uid())
  or (
    visible_para_empresas
    and public.cuenta_activa(perfil_id)
    and public.es_postulante_de_mi_empresa(perfil_id)
  )
);

drop policy if exists "resultados_cargo_los_mios" on public.resultados_de_tests;
create policy "resultados_cargo_los_mios"
on public.resultados_de_tests for insert
to authenticated
with check (
  perfil_id = (select auth.uid())
  and exists (select 1 from public.perfiles where id = (select auth.uid()))
);

drop policy if exists "resultados_edito_los_mios" on public.resultados_de_tests;
create policy "resultados_edito_los_mios"
on public.resultados_de_tests for update
to authenticated
using (perfil_id = (select auth.uid()))
with check (perfil_id = (select auth.uid()));

drop policy if exists "resultados_borro_los_mios" on public.resultados_de_tests;
create policy "resultados_borro_los_mios"
on public.resultados_de_tests for delete
to authenticated
using (perfil_id = (select auth.uid()));

-- ------------------------------------------------------------
-- RF1.7 — Al eliminar la cuenta, los resultados se borran con el resto del
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
    delete from resultados_de_tests where perfil_id = yo;
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
