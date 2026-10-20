-- ============================================================
-- LinkYouth — Verificación de la Etapa 2 (lado de la empresa)
--
-- Comprueba, actuando como cada tipo de usuario, que las reglas de acceso
-- y los disparadores de la migración 005 hacen lo que dicen.
--
-- Cómo correrlo (después de aplicar la migración 005):
--   · Supabase Dashboard > SQL Editor: pegar el archivo entero y Run.
--   · O en el servidor:
--       docker exec -i supabase-db psql -U postgres -d postgres < db/verificar-etapa2.sql
--
-- Qué esperar: una lista de líneas «✓ NN …» y al final «TODO EN ORDEN».
-- Si una regla no se cumple, se corta con «FALLA NN: …» y dice cuál.
--
-- NO DEJA DATOS. Todo corre dentro de una transacción que termina en
-- ROLLBACK: las cuentas, búsquedas, eventos y avisos de prueba desaparecen
-- al final, haya salido bien o mal. Los ids usan el prefijo e2000000 y los
-- correos el dominio reservado .invalid, para que no se confundan con nada
-- real ni choquen con datos existentes.
--
-- Cómo actúa como otro usuario: igual que la API de Supabase, con el rol
-- `authenticated` (o `anon`) y el id en `request.jwt.claims`, que es lo que
-- lee `auth.uid()`. Así las políticas de RLS se aplican de verdad.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- Datos de prueba (como postgres, sin RLS)
--
--   Empresa A ............ e2…0a     Empresa B ............ e2…0b
--   Joven 1 (se postula) . e2…a1     Joven 2 .............. e2…a2
--
--   Búsquedas de A: 101 activa (1 posición), 102 pausada sin postulaciones
--   Búsquedas de B: 201 pausada, 202 activa
--   Eventos de A:   301 activo futuro, 302 cancelado, 303 activo ya pasado
-- ------------------------------------------------------------

insert into auth.users (id, email) values
  ('e2000000-0000-4000-8000-00000000000a', 'empresa-a@verificacion.invalid'),
  ('e2000000-0000-4000-8000-00000000000b', 'empresa-b@verificacion.invalid'),
  ('e2000000-0000-4000-8000-0000000000a1', 'joven-1@verificacion.invalid'),
  ('e2000000-0000-4000-8000-0000000000a2', 'joven-2@verificacion.invalid');

insert into cuentas (id, tipo) values
  ('e2000000-0000-4000-8000-00000000000a', 'empresa'),
  ('e2000000-0000-4000-8000-00000000000b', 'empresa'),
  ('e2000000-0000-4000-8000-0000000000a1', 'individual'),
  ('e2000000-0000-4000-8000-0000000000a2', 'individual');

insert into empresas (id, razon_social, rubro) values
  ('e2000000-0000-4000-8000-00000000000a', 'Verificación A', 'Pruebas'),
  ('e2000000-0000-4000-8000-00000000000b', 'Verificación B', 'Pruebas');

insert into perfiles (id, nombre_usuario, nombre, apellido, fecha_nacimiento, pais) values
  ('e2000000-0000-4000-8000-0000000000a1', 'verif_joven_1', 'Joven', 'Uno', current_date - interval '20 years', 'Uruguay'),
  ('e2000000-0000-4000-8000-0000000000a2', 'verif_joven_2', 'Joven', 'Dos', current_date - interval '21 years', 'Uruguay');

insert into perfil_habilidades (perfil_id, habilidad_id)
select p, (select id from habilidades order by nombre limit 1)
from unnest(array[
  'e2000000-0000-4000-8000-0000000000a1',
  'e2000000-0000-4000-8000-0000000000a2'
]::uuid[]) as p;

insert into vacantes (id, empresa_id, titulo, descripcion, tipo, posiciones, estado, modalidad, ubicacion) values
  ('e2000000-0000-4000-8000-000000000101', 'e2000000-0000-4000-8000-00000000000a', 'Verificación activa', 'x', 'empleo', 1, 'activa', 'remota', 'Montevideo'),
  ('e2000000-0000-4000-8000-000000000102', 'e2000000-0000-4000-8000-00000000000a', 'Verificación pausada', 'x', 'empleo', 1, 'pausada', 'presencial', 'Montevideo'),
  ('e2000000-0000-4000-8000-000000000201', 'e2000000-0000-4000-8000-00000000000b', 'Verificación B pausada', 'x', 'pasantia', 1, 'pausada', 'hibrida', 'Canelones'),
  ('e2000000-0000-4000-8000-000000000202', 'e2000000-0000-4000-8000-00000000000b', 'Verificación B activa', 'x', 'pasantia', 2, 'activa', 'hibrida', 'Canelones');

insert into vacante_tags_ocultos (vacante_id, tag_id)
values ('e2000000-0000-4000-8000-000000000101', (select id from tags order by nombre limit 1));

insert into eventos (id, empresa_id, titulo, descripcion, fecha_hora, estado, direccion, latitud, longitud) values
  ('e2000000-0000-4000-8000-000000000301', 'e2000000-0000-4000-8000-00000000000a', 'Verificación futuro', 'x', now() + interval '10 days', 'activo', 'Av. 18 de Julio 1000', -34.905, -56.191),
  ('e2000000-0000-4000-8000-000000000302', 'e2000000-0000-4000-8000-00000000000a', 'Verificación cancelado', 'x', now() + interval '10 days', 'cancelado', null, null, null),
  ('e2000000-0000-4000-8000-000000000303', 'e2000000-0000-4000-8000-00000000000a', 'Verificación pasado', 'x', now() - interval '10 days', 'activo', null, null, null);

-- ============================================================
-- Sin sesión (anon)
-- ============================================================

select set_config('request.jwt.claims', '', true);
set local role anon;

do $$ begin
  if exists (select 1 from vacantes where id in (
      'e2000000-0000-4000-8000-000000000102', 'e2000000-0000-4000-8000-000000000201')) then
    raise exception 'FALLA 01: sin sesión se ven búsquedas pausadas';
  end if;
  if not exists (select 1 from vacantes where id = 'e2000000-0000-4000-8000-000000000202') then
    raise exception 'FALLA 01: sin sesión no se ve una búsqueda activa';
  end if;
  raise notice '✓ 01 Sin sesión se ven las búsquedas activas y no las pausadas';
end $$;

do $$ begin
  begin
    perform * from candidatos_de_mi_empresa(array['e2000000-0000-4000-8000-0000000000a1']::uuid[]);
    raise exception 'FALLA 02: sin sesión se puede pedir la lista de candidatos';
  exception when insufficient_privilege then null;
  end;
  raise notice '✓ 02 Sin sesión no se puede pedir la lista de candidatos';
end $$;

reset role;

-- ============================================================
-- Joven 1 se postula a la búsqueda activa de A; Joven 2 también
-- ============================================================

select set_config('request.jwt.claims',
  '{"sub":"e2000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;

do $$ begin
  insert into postulaciones (id, vacante_id, perfil_id)
  values ('e2000000-0000-4000-8000-000000000401',
          'e2000000-0000-4000-8000-000000000101',
          'e2000000-0000-4000-8000-0000000000a1');
  raise notice '✓ 03 Un joven se postula a una búsqueda activa';
end $$;

do $$ begin
  begin
    insert into postulaciones (vacante_id, perfil_id)
    values ('e2000000-0000-4000-8000-000000000201', 'e2000000-0000-4000-8000-0000000000a1');
    raise exception 'FALLA 04: un joven se postuló a una búsqueda pausada';
  exception when insufficient_privilege then null;
  end;
  raise notice '✓ 04 Un joven no se puede postular a una búsqueda pausada';
end $$;

do $$ begin
  begin
    insert into vacantes (empresa_id, titulo, descripcion, tipo, posiciones)
    values ('e2000000-0000-4000-8000-0000000000a1', 'Intruso', 'x', 'empleo', 1);
    raise exception 'FALLA 05: un joven pudo crear una búsqueda';
  exception when insufficient_privilege then null;
  end;
  raise notice '✓ 05 Un joven no puede crear búsquedas';
end $$;

do $$ begin
  if exists (select 1 from vacante_tags_ocultos) then
    raise exception 'FALLA 06: un joven ve tags ocultos';
  end if;
  raise notice '✓ 06 Un joven no ve los tags ocultos (RF3.1.6, RNF5)';
end $$;

do $$ begin
  if exists (select 1 from candidatos_de_mi_empresa(array[
      'e2000000-0000-4000-8000-0000000000a1', 'e2000000-0000-4000-8000-0000000000a2']::uuid[])) then
    raise exception 'FALLA 07: un joven obtuvo datos de candidatos';
  end if;
  raise notice '✓ 07 Un joven no obtiene datos de nadie con la función de candidatos';
end $$;

do $$ begin
  begin
    update postulaciones set estado = 'entrevista'
    where id = 'e2000000-0000-4000-8000-000000000401';
    raise exception 'FALLA 08: el joven movió su propia postulación a entrevista';
  exception when insufficient_privilege then null;
  end;
  raise notice '✓ 08 Un joven no puede cambiar su postulación salvo para cancelarla';
end $$;

do $$ begin
  begin
    insert into inscripciones_evento (evento_id, perfil_id)
    values ('e2000000-0000-4000-8000-000000000302', 'e2000000-0000-4000-8000-0000000000a1');
    raise exception 'FALLA 09: inscripción a un evento cancelado';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into inscripciones_evento (evento_id, perfil_id)
    values ('e2000000-0000-4000-8000-000000000303', 'e2000000-0000-4000-8000-0000000000a1');
    raise exception 'FALLA 09: inscripción a un evento que ya pasó';
  exception when insufficient_privilege then null;
  end;
  insert into inscripciones_evento (evento_id, perfil_id)
  values ('e2000000-0000-4000-8000-000000000301', 'e2000000-0000-4000-8000-0000000000a1');
  raise notice '✓ 09 Inscribirse solo a eventos activos y futuros';
end $$;

reset role;

select set_config('request.jwt.claims',
  '{"sub":"e2000000-0000-4000-8000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;

do $$ begin
  insert into postulaciones (id, vacante_id, perfil_id)
  values ('e2000000-0000-4000-8000-000000000402',
          'e2000000-0000-4000-8000-000000000101',
          'e2000000-0000-4000-8000-0000000000a2');
  if exists (select 1 from postulaciones where perfil_id = 'e2000000-0000-4000-8000-0000000000a1') then
    raise exception 'FALLA 10: un joven ve la postulación de otro';
  end if;
  raise notice '✓ 10 Un joven no ve las postulaciones de otro';
end $$;

reset role;

-- ============================================================
-- Empresa B: no ve ni toca nada de A
-- ============================================================

select set_config('request.jwt.claims',
  '{"sub":"e2000000-0000-4000-8000-00000000000b","role":"authenticated"}', true);
set local role authenticated;

do $$
declare n int;
begin
  if exists (select 1 from vacantes where id = 'e2000000-0000-4000-8000-000000000102') then
    raise exception 'FALLA 11: B ve la búsqueda pausada de A';
  end if;
  if exists (select 1 from postulaciones) then
    raise exception 'FALLA 11: B ve postulaciones de A';
  end if;
  if exists (select 1 from vacante_tags_ocultos) then
    raise exception 'FALLA 11: B ve los tags ocultos de A';
  end if;
  if exists (select 1 from inscripciones_evento) then
    raise exception 'FALLA 11: B ve los inscriptos de A';
  end if;
  if exists (select 1 from perfil_habilidades where perfil_id = 'e2000000-0000-4000-8000-0000000000a1') then
    raise exception 'FALLA 11: B ve las habilidades de quien se postuló a A';
  end if;
  if exists (select 1 from candidatos_de_mi_empresa(array['e2000000-0000-4000-8000-0000000000a1']::uuid[])) then
    raise exception 'FALLA 11: B obtiene los datos de quien se postuló a A';
  end if;
  raise notice '✓ 11 La empresa B no ve búsquedas pausadas, postulantes, tags ocultos, habilidades ni inscriptos de A';

  update vacantes set titulo = 'Pisada' where id = 'e2000000-0000-4000-8000-000000000101';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLA 12: B editó una búsqueda de A'; end if;

  delete from vacantes where id = 'e2000000-0000-4000-8000-000000000102';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLA 12: B borró una búsqueda de A'; end if;

  update postulaciones set estado = 'rechazada' where id = 'e2000000-0000-4000-8000-000000000401';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLA 12: B cambió una postulación de A'; end if;

  update eventos set estado = 'cancelado' where id = 'e2000000-0000-4000-8000-000000000301';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLA 12: B canceló un evento de A'; end if;

  update empresas set descripcion = 'Pisada' where id = 'e2000000-0000-4000-8000-00000000000a';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLA 12: B editó el perfil de A'; end if;

  begin
    insert into vacantes (empresa_id, titulo, descripcion, tipo, posiciones)
    values ('e2000000-0000-4000-8000-00000000000a', 'A nombre de A', 'x', 'empleo', 1);
    raise exception 'FALLA 12: B creó una búsqueda a nombre de A';
  exception when insufficient_privilege then null;
  end;

  raise notice '✓ 12 La empresa B no edita, borra ni crea nada a nombre de A';
end $$;

reset role;

-- ============================================================
-- Empresa A: ve y gestiona lo suyo
-- ============================================================

select set_config('request.jwt.claims',
  '{"sub":"e2000000-0000-4000-8000-00000000000a","role":"authenticated"}', true);
set local role authenticated;

do $$
declare n int;
begin
  select count(*) into n from vacantes
  where empresa_id = 'e2000000-0000-4000-8000-00000000000a';
  if n <> 2 then raise exception 'FALLA 13: A ve % búsquedas propias en vez de 2', n; end if;
  if exists (select 1 from vacantes where id = 'e2000000-0000-4000-8000-000000000201') then
    raise exception 'FALLA 13: A ve la búsqueda pausada de B';
  end if;
  raise notice '✓ 13 La empresa A ve sus búsquedas, incluida la pausada, y no las pausadas de B';
end $$;

do $$ begin
  if (select count(*) from vacante_tags_ocultos) <> 1 then
    raise exception 'FALLA 14: A no ve sus tags ocultos';
  end if;
  raise notice '✓ 14 La empresa A ve los tags ocultos de sus búsquedas';
end $$;

do $$
declare n int;
begin
  select count(*) into n from candidatos_de_mi_empresa(array[
    'e2000000-0000-4000-8000-0000000000a1',
    'e2000000-0000-4000-8000-0000000000a2',
    'e2000000-0000-4000-8000-00000000000b']::uuid[]);
  if n <> 2 then raise exception 'FALLA 15: la función devolvió % candidatos en vez de 2', n; end if;
  raise notice '✓ 15 La empresa A obtiene los datos de sus dos postulantes y de nadie más';
end $$;

do $$ begin
  if exists (
    select 1 from information_schema.routines r
    join information_schema.parameters pa on pa.specific_name = r.specific_name
    where r.routine_name = 'candidatos_de_mi_empresa' and pa.parameter_name = 'fecha_nacimiento'
  ) then
    raise exception 'FALLA 16: la función de candidatos expone la fecha de nacimiento';
  end if;
  raise notice '✓ 16 La función de candidatos no expone la fecha de nacimiento';
end $$;

do $$ begin
  if (select count(*) from inscripciones_evento) <> 1 then
    raise exception 'FALLA 17: A no ve a quien se inscribió a su evento';
  end if;
  raise notice '✓ 17 La empresa A ve quién se inscribió a sus eventos';
end $$;

do $$
declare n int;
begin
  delete from vacantes where id = 'e2000000-0000-4000-8000-000000000101';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLA 18: se borró una búsqueda con postulaciones'; end if;

  delete from vacantes where id = 'e2000000-0000-4000-8000-000000000102';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FALLA 18: no se pudo borrar una búsqueda sin postulaciones'; end if;

  raise notice '✓ 18 Se borra una búsqueda sin postulaciones; con postulaciones, no';
end $$;

do $$ begin
  begin
    insert into vacantes (empresa_id, titulo, descripcion, tipo, posiciones)
    values ('e2000000-0000-4000-8000-00000000000a', '  verificación ACTIVA ', 'x', 'empleo', 1);
    raise exception 'FALLA 19: se repitió el título de una búsqueda activa';
  exception when unique_violation then null;
  end;
  raise notice '✓ 19 No se repite el título entre búsquedas activas de la misma empresa (RF3.1.2)';
end $$;

do $$ begin
  begin
    update postulaciones set estado = 'pendiente'
    where id = 'e2000000-0000-4000-8000-000000000401';
    raise exception 'FALLA 20: la empresa devolvió una postulación a pendiente';
  exception when insufficient_privilege then null;
  end;

  update postulaciones set estado = 'entrevista'
  where id = 'e2000000-0000-4000-8000-000000000401';

  raise notice '✓ 20 La empresa pasa una postulación a entrevista y no puede volverla a nueva';
end $$;

do $$ begin
  begin
    update empresas set sitio_web = 'no-es-una-direccion'
    where id = 'e2000000-0000-4000-8000-00000000000a';
    raise exception 'FALLA 21: se guardó un sitio web inválido';
  exception when check_violation then null;
  end;

  update empresas set sitio_web = 'https://verificacion.invalid'
  where id = 'e2000000-0000-4000-8000-00000000000a';

  raise notice '✓ 21 La empresa edita su perfil y la base rechaza un sitio web inválido';
end $$;

-- Disparadores: seleccionar al Joven 1 cubre la única posición. La búsqueda
-- se cierra sola (RF3.3.2) y el Joven 2, que seguía pendiente, pasa a
-- rechazada (RF3.3.3).
do $$ begin
  update postulaciones set estado = 'aceptada'
  where id = 'e2000000-0000-4000-8000-000000000401';
end $$;

reset role;

do $$ begin
  if (select estado from vacantes where id = 'e2000000-0000-4000-8000-000000000101') <> 'cerrada' then
    raise exception 'FALLA 22: la búsqueda no se cerró al cubrir sus posiciones';
  end if;
  if (select estado from postulaciones where id = 'e2000000-0000-4000-8000-000000000402') <> 'rechazada' then
    raise exception 'FALLA 22: la postulación pendiente no pasó a rechazada al cerrar';
  end if;
  raise notice '✓ 22 Al cubrir las posiciones la búsqueda se cierra y las pendientes pasan a rechazada (RF3.3.2, RF3.3.3)';
end $$;

do $$ begin
  if not exists (
    select 1 from notificaciones
    where cuenta_id = 'e2000000-0000-4000-8000-0000000000a1'
      -- Texto y enlace desde la migración 007.
      and mensaje like 'Te seleccionaron en Verificación A para «Verificación activa».%'
      and enlace like '/postulaciones#postulacion-%'
  ) then
    raise exception 'FALLA 23: el aviso al joven no tiene el texto o el enlace esperados';
  end if;
  -- Solo los avisos de las cuentas de prueba: los que ya existían en la base
  -- antes de la migración tienen el formato viejo, y no son de este guion.
  if exists (
    select 1 from notificaciones
    where cuenta_id in ('e2000000-0000-4000-8000-0000000000a1', 'e2000000-0000-4000-8000-0000000000a2')
      and (mensaje like '%en_revision%' or enlace like '/postulaciones/%')
  ) then
    raise exception 'FALLA 23: quedó un aviso con el valor crudo o con el enlace roto';
  end if;
  raise notice '✓ 23 El aviso al joven nombra la búsqueda, usa palabras y enlaza a /postulaciones';
end $$;

-- Cancelar el evento avisa a quien estaba inscripto (RF4.3.2).
select set_config('request.jwt.claims',
  '{"sub":"e2000000-0000-4000-8000-00000000000a","role":"authenticated"}', true);
set local role authenticated;

do $$ begin
  update eventos set estado = 'cancelado'
  where id = 'e2000000-0000-4000-8000-000000000301';
end $$;

reset role;

do $$ begin
  if not exists (
    select 1 from notificaciones
    where cuenta_id = 'e2000000-0000-4000-8000-0000000000a1'
      and mensaje = 'Se canceló el evento «Verificación futuro».'
  ) then
    raise exception 'FALLA 24: cancelar el evento no avisó a quien estaba inscripto';
  end if;
  raise notice '✓ 24 Cancelar un evento avisa a quienes estaban inscriptos (RF4.3.2)';
end $$;

-- ============================================================
-- Un joven no ve los avisos de otro
-- ============================================================

select set_config('request.jwt.claims',
  '{"sub":"e2000000-0000-4000-8000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;

do $$ begin
  if exists (select 1 from notificaciones where cuenta_id <> 'e2000000-0000-4000-8000-0000000000a2') then
    raise exception 'FALLA 25: un joven ve avisos de otra cuenta';
  end if;
  raise notice '✓ 25 Un joven solo ve sus propios avisos';
end $$;

reset role;

do $$ begin
  raise notice 'TODO EN ORDEN: 25 verificaciones. Se deshacen todos los datos de prueba.';
end $$;

rollback;
