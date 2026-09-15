-- ============================================================
-- 001 — RUT de las empresas
--
-- Para bases que ya se crearon con la versión anterior de
-- `db/schema.sql`. En una base nueva no hace falta: el esquema ya
-- trae la columna.
--
-- Se ejecuta en Supabase Dashboard > SQL Editor.
-- ============================================================

-- `unique` pero no `not null`: las empresas dadas de alta antes de esta
-- migración no tienen RUT, y no hay ningún valor razonable que inventarles.
-- Ponerlo obligatorio ahora dejaría la tabla imposible de migrar sin tocar
-- datos de otros.
--
-- Sin `check` de formato: doce dígitos es la forma uruguaya, y la validación
-- vive en la aplicación (`src/lib/dominio/RegistroDeEmpresa.ts`) para no
-- cerrarle la puerta a una empresa de otro país por una restricción de tabla.
alter table empresas
  add column if not exists rut text;

-- `add constraint if not exists` no existe para restricciones: hay que
-- preguntar por el catálogo.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'empresas_rut_key'
  ) then
    alter table empresas add constraint empresas_rut_key unique (rut);
  end if;
end $$;

-- Nada que agregar en `db/politicas.sql`: RLS se aplica por fila, no por
-- columna, y `empresas_lectura_publica` ya cubre la tabla entera. El RUT
-- queda visible para cualquiera que pueda ver la empresa, igual que la
-- razón social — es un dato registral público.
