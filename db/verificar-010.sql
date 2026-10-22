-- ============================================================
-- LinkYouth — Verificación de la migración 010 (Interview Lab)
--
--   docker exec -i supabase-db psql -U postgres -d postgres < db/verificar-010.sql
--
-- Qué esperar: líneas «✓ NN …» y al final «TODO EN ORDEN». Si una regla no
-- se cumple, se corta con «FALLA NN: …».
--
-- NO DEJA DATOS: todo corre en una transacción que termina en ROLLBACK. Ids
-- con prefijo ea000000 y correos del dominio reservado .invalid. Actúa como
-- cada usuario igual que la API de Supabase: rol `authenticated` o `anon` y
-- el id en `request.jwt.claims`.
--
-- Personas:
--   a1  se postuló a la empresa A; carga, comparte y oculta
--   a2  se postuló a la empresa A y NO compartió nada
--   a3  se postuló a A, compartió y canceló             → A no lo ve
--   a4  solo se inscribió a un evento de A y compartió  → A no lo ve
-- La empresa B no tiene postulantes: no ve ninguno.
-- ============================================================

begin;

insert into auth.users (id, email) values
  ('ea000000-0000-4000-8000-00000000000a', 'empresa@verificacion10.invalid'),
  ('ea000000-0000-4000-8000-00000000000b', 'otra@verificacion10.invalid'),
  ('ea000000-0000-4000-8000-0000000000a1', 'joven1@verificacion10.invalid'),
  ('ea000000-0000-4000-8000-0000000000a2', 'joven2@verificacion10.invalid'),
  ('ea000000-0000-4000-8000-0000000000a3', 'joven3@verificacion10.invalid'),
  ('ea000000-0000-4000-8000-0000000000a4', 'joven4@verificacion10.invalid');
insert into cuentas (id, tipo) values
  ('ea000000-0000-4000-8000-00000000000a', 'empresa'),
  ('ea000000-0000-4000-8000-00000000000b', 'empresa'),
  ('ea000000-0000-4000-8000-0000000000a1', 'individual'),
  ('ea000000-0000-4000-8000-0000000000a2', 'individual'),
  ('ea000000-0000-4000-8000-0000000000a3', 'individual'),
  ('ea000000-0000-4000-8000-0000000000a4', 'individual');
insert into empresas (id, razon_social, rubro) values
  ('ea000000-0000-4000-8000-00000000000a', 'Verificación 10', 'Pruebas'),
  ('ea000000-0000-4000-8000-00000000000b', 'Verificación 10 otra', 'Pruebas');
insert into perfiles (id, nombre_usuario, nombre, apellido, fecha_nacimiento, pais)
select id, 'verif10_' || right(id::text, 2), 'Joven', 'Diez', current_date - interval '20 years', 'Uruguay'
from (values
  ('ea000000-0000-4000-8000-0000000000a1'::uuid),
  ('ea000000-0000-4000-8000-0000000000a2'::uuid),
  ('ea000000-0000-4000-8000-0000000000a3'::uuid),
  ('ea000000-0000-4000-8000-0000000000a4'::uuid)
) as v(id);
insert into vacantes (id, empresa_id, titulo, descripcion, tipo, posiciones, estado, modalidad) values
  ('ea000000-0000-4000-8000-000000000101', 'ea000000-0000-4000-8000-00000000000a', 'Verificación 10', 'x', 'empleo', 1, 'activa', 'remota');
insert into postulaciones (vacante_id, perfil_id, estado) values
  ('ea000000-0000-4000-8000-000000000101', 'ea000000-0000-4000-8000-0000000000a1', 'pendiente'),
  ('ea000000-0000-4000-8000-000000000101', 'ea000000-0000-4000-8000-0000000000a2', 'pendiente'),
  ('ea000000-0000-4000-8000-000000000101', 'ea000000-0000-4000-8000-0000000000a3', 'cancelada');
insert into eventos (id, empresa_id, titulo, descripcion, fecha_hora) values
  ('ea000000-0000-4000-8000-000000000201', 'ea000000-0000-4000-8000-00000000000a', 'Evento 10', 'x', now() + interval '10 days');
insert into inscripciones_evento (evento_id, perfil_id) values
  ('ea000000-0000-4000-8000-000000000201', 'ea000000-0000-4000-8000-0000000000a4');
insert into resultados_de_tests (perfil_id, test, puntaje, visible_para_empresas) values
  ('ea000000-0000-4000-8000-0000000000a2', 'aptitudes', 'Alto', false),
  ('ea000000-0000-4000-8000-0000000000a3', 'aptitudes', 'Alto', true),
  ('ea000000-0000-4000-8000-0000000000a4', 'aptitudes', 'Alto', true);

-- ============================================================
-- Sin sesión
-- ============================================================
select set_config('request.jwt.claims', '', true);
set local role anon;

do $$ begin
  begin
    perform * from resultados_de_tests;
    raise exception 'FALLA 01: sin sesión se leen resultados de tests';
  exception when insufficient_privilege then
    raise notice '✓ 01 Sin sesión no se lee ningún resultado';
  end;
end $$;

do $$ begin
  begin
    insert into resultados_de_tests (perfil_id, test)
    values ('ea000000-0000-4000-8000-0000000000a1', 'aptitudes');
    raise exception 'FALLA 02: sin sesión se carga un resultado';
  exception when insufficient_privilege then
    raise notice '✓ 02 Sin sesión no se carga un resultado';
  end;
end $$;

reset role;

-- ============================================================
-- El joven a1
-- ============================================================
select set_config('request.jwt.claims',
  '{"sub":"ea000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;

do $$ begin
  begin
    insert into resultados_de_tests (perfil_id, test)
    values ('ea000000-0000-4000-8000-0000000000a1', 'personalidad');
    raise exception 'FALLA 03: se acepta un test que no existe';
  exception when check_violation then null;
  end;
  begin
    insert into resultados_de_tests (perfil_id, test, resultado)
    values ('ea000000-0000-4000-8000-0000000000a1', 'aptitudes', repeat('x', 281));
    raise exception 'FALLA 03: se acepta un resultado de más de 280 caracteres';
  exception when check_violation then null;
  end;
  begin
    insert into resultados_de_tests (perfil_id, test, puntaje)
    values ('ea000000-0000-4000-8000-0000000000a1', 'aptitudes', repeat('x', 41));
    raise exception 'FALLA 03: se acepta un puntaje de más de 40 caracteres';
  exception when check_violation then null;
  end;
  raise notice '✓ 03 Solo los tres tests de JobCannon, con puntaje y resultado cortos';
end $$;

do $$ begin
  begin
    insert into resultados_de_tests (perfil_id, test, origen)
    values ('ea000000-0000-4000-8000-0000000000a1', 'aptitudes', 'verificado');
    raise exception 'FALLA 04: el joven carga un resultado como verificado';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into resultados_de_tests (perfil_id, test, cargado_en)
    values ('ea000000-0000-4000-8000-0000000000a1', 'aptitudes', '2000-01-01');
    raise exception 'FALLA 04: el joven elige la fecha de carga';
  exception when insufficient_privilege then null;
  end;
  raise notice '✓ 04 El joven no elige el origen ni la fecha de carga';
end $$;

do $$ begin
  insert into resultados_de_tests (perfil_id, test, puntaje, resultado)
  values ('ea000000-0000-4000-8000-0000000000a1', 'aptitudes', '24 de 30', 'Fuerte en razonamiento lógico');
  insert into resultados_de_tests (perfil_id, test)
  values ('ea000000-0000-4000-8000-0000000000a1', 'psicometrico');
  if exists (select 1 from resultados_de_tests
             where perfil_id = 'ea000000-0000-4000-8000-0000000000a1'
               and (visible_para_empresas or origen <> 'declarado' or cargado_en <> now())) then
    raise exception 'FALLA 05: un resultado nace visible, verificado o con otra fecha';
  end if;
  raise notice '✓ 05 El joven carga resultados (con o sin datos): nacen ocultos, declarados y con la fecha de hoy';
end $$;

do $$ begin
  update resultados_de_tests set visible_para_empresas = true
  where perfil_id = 'ea000000-0000-4000-8000-0000000000a1' and test = 'aptitudes';
  begin
    update resultados_de_tests set origen = 'verificado'
    where perfil_id = 'ea000000-0000-4000-8000-0000000000a1';
    raise exception 'FALLA 06: el joven marca un resultado como verificado';
  exception when insufficient_privilege then null;
  end;
  raise notice '✓ 06 El joven lo marca visible, pero no puede marcarlo verificado';
end $$;

do $$ begin
  if exists (select 1 from resultados_de_tests
             where perfil_id <> 'ea000000-0000-4000-8000-0000000000a1') then
    raise exception 'FALLA 07: un joven lee resultados de otro';
  end if;
  update resultados_de_tests set puntaje = 'cambiado'
  where perfil_id = 'ea000000-0000-4000-8000-0000000000a2';
  delete from resultados_de_tests
  where perfil_id = 'ea000000-0000-4000-8000-0000000000a2';
  begin
    insert into resultados_de_tests (perfil_id, test)
    values ('ea000000-0000-4000-8000-0000000000a2', 'psicometrico');
    raise exception 'FALLA 07: un joven carga un resultado de otro';
  exception when insufficient_privilege then null;
  end;
  raise notice '✓ 07 Un joven no lee, carga, edita ni borra los de otro';
end $$;

reset role;

do $$ begin
  if (select puntaje from resultados_de_tests
      where perfil_id = 'ea000000-0000-4000-8000-0000000000a2') <> 'Alto' then
    raise exception 'FALLA 07: el resultado de a2 cambió desde la sesión de a1';
  end if;
end $$;

-- ============================================================
-- La empresa A
-- ============================================================
select set_config('request.jwt.claims',
  '{"sub":"ea000000-0000-4000-8000-00000000000a","role":"authenticated"}', true);
set local role authenticated;

do $$ begin
  if (select array_agg(test) from resultados_de_tests
      where perfil_id = 'ea000000-0000-4000-8000-0000000000a1') is distinct from array['aptitudes'] then
    raise exception 'FALLA 08: la empresa no ve exactamente lo compartido por quien se postuló';
  end if;
  raise notice '✓ 08 La empresa ve el resultado compartido y no el oculto del mismo joven';
end $$;

do $$ begin
  if exists (select 1 from resultados_de_tests
             where perfil_id in ('ea000000-0000-4000-8000-0000000000a2',
                                 'ea000000-0000-4000-8000-0000000000a3',
                                 'ea000000-0000-4000-8000-0000000000a4')) then
    raise exception 'FALLA 09: la empresa ve lo oculto, lo de quien canceló o lo de quien solo se inscribió';
  end if;
  raise notice '✓ 09 Ni lo oculto, ni lo de quien canceló, ni lo de quien solo fue a un evento';
end $$;

do $$ begin
  update resultados_de_tests set puntaje = 'de la empresa';
  delete from resultados_de_tests;
  begin
    insert into resultados_de_tests (perfil_id, test)
    values ('ea000000-0000-4000-8000-00000000000a', 'aptitudes');
    raise exception 'FALLA 10: una empresa carga un resultado';
  exception when insufficient_privilege or foreign_key_violation then null;
  end;
  raise notice '✓ 10 La empresa no edita, borra ni carga resultados';
end $$;

reset role;

do $$ begin
  if (select count(*) from resultados_de_tests
      where perfil_id = 'ea000000-0000-4000-8000-0000000000a1') <> 2
     or exists (select 1 from resultados_de_tests where puntaje = 'de la empresa') then
    raise exception 'FALLA 10: los resultados cambiaron desde la sesión de la empresa';
  end if;
end $$;

-- ============================================================
-- La empresa B, sin postulantes
-- ============================================================
select set_config('request.jwt.claims',
  '{"sub":"ea000000-0000-4000-8000-00000000000b","role":"authenticated"}', true);
set local role authenticated;

do $$ begin
  if exists (select 1 from resultados_de_tests) then
    raise exception 'FALLA 11: otra empresa ve resultados de quien no se le postuló';
  end if;
  raise notice '✓ 11 Otra empresa no ve ningún resultado';
end $$;

reset role;

-- ============================================================
-- Un resultado verificado (el día que llegue por la API)
-- ============================================================
update resultados_de_tests set origen = 'verificado'
where perfil_id = 'ea000000-0000-4000-8000-0000000000a1' and test = 'aptitudes';

select set_config('request.jwt.claims',
  '{"sub":"ea000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;

do $$ begin
  update resultados_de_tests set visible_para_empresas = false
  where perfil_id = 'ea000000-0000-4000-8000-0000000000a1' and test = 'aptitudes';
  if (select origen from resultados_de_tests
      where perfil_id = 'ea000000-0000-4000-8000-0000000000a1' and test = 'aptitudes') <> 'verificado' then
    raise exception 'FALLA 12: ocultar un resultado verificado le quitó la verificación';
  end if;
  update resultados_de_tests set puntaje = 'Excepcional'
  where perfil_id = 'ea000000-0000-4000-8000-0000000000a1' and test = 'aptitudes';
  if (select origen from resultados_de_tests
      where perfil_id = 'ea000000-0000-4000-8000-0000000000a1' and test = 'aptitudes') <> 'declarado' then
    raise exception 'FALLA 12: un resultado verificado editado por el joven sigue verificado';
  end if;
  raise notice '✓ 12 Ocultar no toca la verificación; editar el resultado lo vuelve declarado';
end $$;

reset role;

select set_config('request.jwt.claims',
  '{"sub":"ea000000-0000-4000-8000-00000000000a","role":"authenticated"}', true);
set local role authenticated;
do $$ begin
  if exists (select 1 from resultados_de_tests
             where perfil_id = 'ea000000-0000-4000-8000-0000000000a1') then
    raise exception 'FALLA 13: la empresa lo sigue viendo después de que el joven lo ocultó';
  end if;
  raise notice '✓ 13 Cuando el joven lo oculta, la empresa deja de verlo';
end $$;
reset role;

select set_config('request.jwt.claims',
  '{"sub":"ea000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
do $$ begin
  delete from resultados_de_tests
  where perfil_id = 'ea000000-0000-4000-8000-0000000000a1' and test = 'psicometrico';
  if (select count(*) from resultados_de_tests) <> 1 then
    raise exception 'FALLA 14: el joven no pudo borrar su resultado';
  end if;
  raise notice '✓ 14 El joven borra un resultado';
end $$;
select eliminar_mi_cuenta();
reset role;

do $$ begin
  if exists (select 1 from resultados_de_tests
             where perfil_id = 'ea000000-0000-4000-8000-0000000000a1') then
    raise exception 'FALLA 15: eliminar la cuenta deja los resultados';
  end if;
  raise notice '✓ 15 Eliminar la cuenta borra los resultados (RF1.7)';
end $$;

do $$ begin raise notice 'TODO EN ORDEN'; end $$;

rollback;
