-- ============================================================
-- LinkYouth — Verificación de la migración 009 (personalidad declarada)
--
--   docker exec -i supabase-db psql -U postgres -d postgres < db/verificar-009.sql
--
-- Qué esperar: líneas «✓ NN …» y al final «TODO EN ORDEN». Si una regla no
-- se cumple, se corta con «FALLA NN: …».
--
-- NO DEJA DATOS: todo corre en una transacción que termina en ROLLBACK. Ids
-- con prefijo e9000000 y correos del dominio reservado .invalid. Actúa como
-- cada usuario igual que la API de Supabase: rol `authenticated` o `anon` y
-- el id en `request.jwt.claims`.
--
-- Personas:
--   a1  se postuló a la empresa A y lo compartió          → A lo ve
--   a2  se postuló a la empresa A y NO lo compartió       → nadie más lo ve
--   a3  se postuló a A, lo compartió y canceló            → A no lo ve
--   a4  solo se inscribió a un evento de A y lo compartió → A no lo ve
-- La empresa B no tiene postulantes: no ve ninguno.
-- ============================================================

begin;

insert into auth.users (id, email) values
  ('e9000000-0000-4000-8000-00000000000a', 'empresa@verificacion9.invalid'),
  ('e9000000-0000-4000-8000-00000000000b', 'otra@verificacion9.invalid'),
  ('e9000000-0000-4000-8000-0000000000a1', 'joven1@verificacion9.invalid'),
  ('e9000000-0000-4000-8000-0000000000a2', 'joven2@verificacion9.invalid'),
  ('e9000000-0000-4000-8000-0000000000a3', 'joven3@verificacion9.invalid'),
  ('e9000000-0000-4000-8000-0000000000a4', 'joven4@verificacion9.invalid');
insert into cuentas (id, tipo) values
  ('e9000000-0000-4000-8000-00000000000a', 'empresa'),
  ('e9000000-0000-4000-8000-00000000000b', 'empresa'),
  ('e9000000-0000-4000-8000-0000000000a1', 'individual'),
  ('e9000000-0000-4000-8000-0000000000a2', 'individual'),
  ('e9000000-0000-4000-8000-0000000000a3', 'individual'),
  ('e9000000-0000-4000-8000-0000000000a4', 'individual');
insert into empresas (id, razon_social, rubro) values
  ('e9000000-0000-4000-8000-00000000000a', 'Verificación 9', 'Pruebas'),
  ('e9000000-0000-4000-8000-00000000000b', 'Verificación 9 otra', 'Pruebas');
insert into perfiles (id, nombre_usuario, nombre, apellido, fecha_nacimiento, pais)
select id, 'verif9_' || right(id::text, 2), 'Joven', 'Nueve', current_date - interval '20 years', 'Uruguay'
from (values
  ('e9000000-0000-4000-8000-0000000000a1'::uuid),
  ('e9000000-0000-4000-8000-0000000000a2'::uuid),
  ('e9000000-0000-4000-8000-0000000000a3'::uuid),
  ('e9000000-0000-4000-8000-0000000000a4'::uuid)
) as v(id);
insert into vacantes (id, empresa_id, titulo, descripcion, tipo, posiciones, estado, modalidad) values
  ('e9000000-0000-4000-8000-000000000101', 'e9000000-0000-4000-8000-00000000000a', 'Verificación 9', 'x', 'empleo', 1, 'activa', 'remota');
insert into postulaciones (vacante_id, perfil_id, estado) values
  ('e9000000-0000-4000-8000-000000000101', 'e9000000-0000-4000-8000-0000000000a1', 'pendiente'),
  ('e9000000-0000-4000-8000-000000000101', 'e9000000-0000-4000-8000-0000000000a2', 'pendiente'),
  ('e9000000-0000-4000-8000-000000000101', 'e9000000-0000-4000-8000-0000000000a3', 'cancelada');
insert into eventos (id, empresa_id, titulo, descripcion, fecha_hora) values
  ('e9000000-0000-4000-8000-000000000201', 'e9000000-0000-4000-8000-00000000000a', 'Evento 9', 'x', now() + interval '10 days');
insert into inscripciones_evento (evento_id, perfil_id) values
  ('e9000000-0000-4000-8000-000000000201', 'e9000000-0000-4000-8000-0000000000a4');
insert into perfil_personalidad (perfil_id, tipo, visible_para_empresas) values
  ('e9000000-0000-4000-8000-0000000000a2', 'ISFJ-T', false),
  ('e9000000-0000-4000-8000-0000000000a3', 'ENTP-A', true),
  ('e9000000-0000-4000-8000-0000000000a4', 'ESFP-T', true);

-- ============================================================
-- Sin sesión
-- ============================================================
select set_config('request.jwt.claims', '', true);
set local role anon;

do $$ begin
  begin
    perform * from perfil_personalidad;
    raise exception 'FALLA 01: sin sesión se lee perfil_personalidad';
  exception when insufficient_privilege then
    raise notice '✓ 01 Sin sesión no se lee ningún resultado de personalidad';
  end;
end $$;

do $$ begin
  begin
    insert into perfil_personalidad (perfil_id, tipo)
    values ('e9000000-0000-4000-8000-0000000000a1', 'INTJ-A');
    raise exception 'FALLA 02: sin sesión se carga un resultado';
  exception when insufficient_privilege then
    raise notice '✓ 02 Sin sesión no se carga un resultado';
  end;
end $$;

reset role;

-- ============================================================
-- El joven a1: carga, edita, cambia la visibilidad
-- ============================================================
select set_config('request.jwt.claims',
  '{"sub":"e9000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;

do $$ begin
  begin
    insert into perfil_personalidad (perfil_id, tipo)
    values ('e9000000-0000-4000-8000-0000000000a1', 'INTJ');
    raise exception 'FALLA 03: se acepta un tipo sin variante';
  exception when check_violation then null;
  end;
  begin
    insert into perfil_personalidad (perfil_id, tipo)
    values ('e9000000-0000-4000-8000-0000000000a1', 'XNTJ-A');
    raise exception 'FALLA 03: se acepta un tipo que no existe';
  exception when check_violation then null;
  end;
  begin
    insert into perfil_personalidad (perfil_id, tipo)
    values ('e9000000-0000-4000-8000-0000000000a1', 'intj-a');
    raise exception 'FALLA 03: se acepta un tipo en minúsculas';
  exception when check_violation then null;
  end;
  raise notice '✓ 03 Solo se aceptan los 16 tipos con variante -A o -T';
end $$;

do $$ begin
  insert into perfil_personalidad (perfil_id, tipo, cargada_en)
  values ('e9000000-0000-4000-8000-0000000000a1', 'INTJ-T', '2000-01-01');
  if (select visible_para_empresas from perfil_personalidad
      where perfil_id = 'e9000000-0000-4000-8000-0000000000a1') then
    raise exception 'FALLA 04: el resultado nace visible';
  end if;
  if (select cargada_en from perfil_personalidad
      where perfil_id = 'e9000000-0000-4000-8000-0000000000a1') <> now() then
    raise exception 'FALLA 04: la fecha de carga la eligió quien escribe';
  end if;
  raise notice '✓ 04 El joven carga su resultado: nace oculto y con la fecha de hoy';
end $$;

do $$ begin
  update perfil_personalidad
  set visible_para_empresas = true, cargada_en = '2000-01-01'
  where perfil_id = 'e9000000-0000-4000-8000-0000000000a1';
  if (select cargada_en from perfil_personalidad
      where perfil_id = 'e9000000-0000-4000-8000-0000000000a1') <> now() then
    raise exception 'FALLA 05: la fecha de carga cambió a mano';
  end if;
  raise notice '✓ 05 El joven lo marca visible; la fecha de carga no se toca a mano';
end $$;

do $$ begin
  if exists (select 1 from perfil_personalidad
             where perfil_id <> 'e9000000-0000-4000-8000-0000000000a1') then
    raise exception 'FALLA 06: un joven lee el resultado de otro';
  end if;
  raise notice '✓ 06 Un joven solo lee el suyo, aunque otros lo compartan';
end $$;

do $$ begin
  begin
    insert into perfil_personalidad (perfil_id, tipo)
    values ('e9000000-0000-4000-8000-0000000000a2', 'INTJ-A');
    raise exception 'FALLA 07: un joven carga el resultado de otro';
  exception when insufficient_privilege or unique_violation then
    null;
  end;
  update perfil_personalidad set tipo = 'ESTP-A'
  where perfil_id = 'e9000000-0000-4000-8000-0000000000a2';
  delete from perfil_personalidad
  where perfil_id = 'e9000000-0000-4000-8000-0000000000a2';
  raise notice '✓ 07 Un joven no carga, edita ni borra el de otro';
end $$;

reset role;

do $$ begin
  if (select tipo from perfil_personalidad
      where perfil_id = 'e9000000-0000-4000-8000-0000000000a2') <> 'ISFJ-T' then
    raise exception 'FALLA 07: el resultado de a2 cambió desde la sesión de a1';
  end if;
end $$;

-- ============================================================
-- La empresa A
-- ============================================================
select set_config('request.jwt.claims',
  '{"sub":"e9000000-0000-4000-8000-00000000000a","role":"authenticated"}', true);
set local role authenticated;

do $$ begin
  if (select tipo from perfil_personalidad
      where perfil_id = 'e9000000-0000-4000-8000-0000000000a1') is distinct from 'INTJ-T' then
    raise exception 'FALLA 08: la empresa no ve el resultado compartido de quien se postuló';
  end if;
  raise notice '✓ 08 La empresa ve el resultado compartido de quien se postuló';
end $$;

do $$ begin
  if exists (select 1 from perfil_personalidad
             where perfil_id = 'e9000000-0000-4000-8000-0000000000a2') then
    raise exception 'FALLA 09: la empresa ve un resultado que el joven no compartió';
  end if;
  raise notice '✓ 09 La empresa no ve un resultado oculto';
end $$;

do $$ begin
  if exists (select 1 from perfil_personalidad
             where perfil_id = 'e9000000-0000-4000-8000-0000000000a3') then
    raise exception 'FALLA 10: la empresa ve el resultado de quien canceló';
  end if;
  raise notice '✓ 10 La empresa no ve el de quien canceló la postulación';
end $$;

do $$ begin
  if exists (select 1 from perfil_personalidad
             where perfil_id = 'e9000000-0000-4000-8000-0000000000a4') then
    raise exception 'FALLA 11: la empresa ve el resultado de quien solo se inscribió a un evento';
  end if;
  raise notice '✓ 11 Una inscripción a un evento no alcanza: solo postulaciones';
end $$;

do $$ begin
  update perfil_personalidad set visible_para_empresas = false, tipo = 'ESTJ-A'
  where perfil_id = 'e9000000-0000-4000-8000-0000000000a1';
  delete from perfil_personalidad
  where perfil_id = 'e9000000-0000-4000-8000-0000000000a1';
  begin
    insert into perfil_personalidad (perfil_id, tipo)
    values ('e9000000-0000-4000-8000-00000000000a', 'INTJ-A');
    raise exception 'FALLA 12: una empresa carga un resultado propio';
  exception when insufficient_privilege or foreign_key_violation then
    null;
  end;
  raise notice '✓ 12 La empresa no edita, borra ni carga resultados';
end $$;

reset role;

do $$ begin
  if (select tipo || visible_para_empresas::text from perfil_personalidad
      where perfil_id = 'e9000000-0000-4000-8000-0000000000a1') <> 'INTJ-Ttrue' then
    raise exception 'FALLA 12: el resultado de a1 cambió desde la sesión de la empresa';
  end if;
end $$;

-- ============================================================
-- La empresa B, sin postulantes
-- ============================================================
select set_config('request.jwt.claims',
  '{"sub":"e9000000-0000-4000-8000-00000000000b","role":"authenticated"}', true);
set local role authenticated;

do $$ begin
  if exists (select 1 from perfil_personalidad) then
    raise exception 'FALLA 13: otra empresa ve resultados de quien no se le postuló';
  end if;
  raise notice '✓ 13 Otra empresa no ve ningún resultado';
end $$;

reset role;

-- ============================================================
-- a1 lo oculta, y después lo borra
-- ============================================================
select set_config('request.jwt.claims',
  '{"sub":"e9000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
update perfil_personalidad set visible_para_empresas = false
where perfil_id = 'e9000000-0000-4000-8000-0000000000a1';
reset role;

select set_config('request.jwt.claims',
  '{"sub":"e9000000-0000-4000-8000-00000000000a","role":"authenticated"}', true);
set local role authenticated;
do $$ begin
  if exists (select 1 from perfil_personalidad
             where perfil_id = 'e9000000-0000-4000-8000-0000000000a1') then
    raise exception 'FALLA 14: la empresa lo sigue viendo después de que el joven lo ocultó';
  end if;
  raise notice '✓ 14 Cuando el joven lo oculta, la empresa deja de verlo';
end $$;
reset role;

select set_config('request.jwt.claims',
  '{"sub":"e9000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
do $$ begin
  delete from perfil_personalidad
  where perfil_id = 'e9000000-0000-4000-8000-0000000000a1';
  if exists (select 1 from perfil_personalidad) then
    raise exception 'FALLA 15: el joven no pudo borrar su resultado';
  end if;
  raise notice '✓ 15 El joven borra su resultado';
end $$;
reset role;

-- ============================================================
-- Eliminar la cuenta borra el resultado (RF1.7)
-- ============================================================
select set_config('request.jwt.claims',
  '{"sub":"e9000000-0000-4000-8000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
select eliminar_mi_cuenta();
reset role;

do $$ begin
  if exists (select 1 from perfil_personalidad
             where perfil_id = 'e9000000-0000-4000-8000-0000000000a2') then
    raise exception 'FALLA 16: eliminar la cuenta deja el resultado';
  end if;
  raise notice '✓ 16 Eliminar la cuenta borra el resultado (RF1.7)';
end $$;

do $$ begin raise notice 'TODO EN ORDEN'; end $$;

rollback;
