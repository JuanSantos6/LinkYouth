-- ============================================================
-- LinkYouth — Verificación de la migración 007 (avisos y correos)
--
--   docker exec -i supabase-db psql -U postgres -d postgres < db/verificar-007.sql
--
-- Qué esperar: líneas «✓ NN …» y al final «TODO EN ORDEN». Si una regla no
-- se cumple, se corta con «FALLA NN: …».
--
-- NO DEJA DATOS: todo corre en una transacción que termina en ROLLBACK. Ids
-- con prefijo e7000000 y correos del dominio reservado .invalid. Actúa como
-- cada usuario igual que la API de Supabase.
-- ============================================================

begin;

insert into auth.users (id, email) values
  ('e7000000-0000-4000-8000-00000000000a', 'empresa@verificacion7.invalid'),
  ('e7000000-0000-4000-8000-0000000000a1', 'joven-1@verificacion7.invalid'),
  ('e7000000-0000-4000-8000-0000000000a2', 'joven-2@verificacion7.invalid');
insert into cuentas (id, tipo) values
  ('e7000000-0000-4000-8000-00000000000a', 'empresa'),
  ('e7000000-0000-4000-8000-0000000000a1', 'individual'),
  ('e7000000-0000-4000-8000-0000000000a2', 'individual');
insert into empresas (id, razon_social, rubro) values
  ('e7000000-0000-4000-8000-00000000000a', 'Verificación 7 S.A.', 'Pruebas');
insert into perfiles (id, nombre_usuario, nombre, apellido, fecha_nacimiento, pais) values
  ('e7000000-0000-4000-8000-0000000000a1', 'verif7_joven_1', 'Ana', 'Uno', current_date - interval '20 years', 'Uruguay'),
  ('e7000000-0000-4000-8000-0000000000a2', 'verif7_joven_2', 'Beto', 'Dos', current_date - interval '21 years', 'Uruguay');
insert into vacantes (id, empresa_id, titulo, descripcion, tipo, posiciones) values
  ('e7000000-0000-4000-8000-000000000101', 'e7000000-0000-4000-8000-00000000000a', 'Búsqueda 7', 'x', 'empleo', 3);
insert into eventos (id, empresa_id, titulo, descripcion, fecha_hora) values
  ('e7000000-0000-4000-8000-000000000301', 'e7000000-0000-4000-8000-00000000000a', 'Evento 7', 'x', now() + interval '5 days');

-- ============================================================
-- Joven 1 se postula y se inscribe, con su sesión
-- ============================================================
select set_config('request.jwt.claims',
  '{"sub":"e7000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;

insert into postulaciones (id, vacante_id, perfil_id) values
  ('e7000000-0000-4000-8000-000000000201', 'e7000000-0000-4000-8000-000000000101', 'e7000000-0000-4000-8000-0000000000a1');
insert into inscripciones_evento (evento_id, perfil_id) values
  ('e7000000-0000-4000-8000-000000000301', 'e7000000-0000-4000-8000-0000000000a1');

do $$ begin
  if exists (select 1 from notificaciones) then
    raise exception 'FALLA 01: el joven ve avisos que no son suyos';
  end if;
  raise notice '✓ 01 El joven no ve los avisos que le llegaron a la empresa';
end $$;

do $$ begin
  begin
    perform 1 from correos_pendientes;
    raise exception 'FALLA 02: un usuario con sesión lee la cola de correos';
  exception when insufficient_privilege then
    raise notice '✓ 02 Un usuario con sesión no lee la cola de correos';
  end;
end $$;

do $$ begin
  begin
    perform avisar('e7000000-0000-4000-8000-0000000000a2', 'x', 'falso', null, 'falso');
    raise exception 'FALLA 03: un usuario con sesión fabrica avisos con avisar()';
  exception when insufficient_privilege then
    raise notice '✓ 03 Un usuario con sesión no puede llamar a avisar()';
  end;
end $$;

do $$ begin
  begin
    perform * from reclamar_correos_pendientes(5);
    raise exception 'FALLA 04: un usuario con sesión reclama correos';
  exception when insufficient_privilege then
    raise notice '✓ 04 Un usuario con sesión no puede reclamar correos';
  end;
end $$;

reset role;

-- ============================================================
-- La empresa ve sus avisos
-- ============================================================
select set_config('request.jwt.claims',
  '{"sub":"e7000000-0000-4000-8000-00000000000a","role":"authenticated"}', true);
set local role authenticated;

do $$
declare n record;
begin
  select * into n from notificaciones where tipo = 'postulacion_recibida';
  if n is null or n.mensaje <> 'Ana Uno se postuló a «Búsqueda 7».'
     or n.enlace <> '/empresa/busquedas/e7000000-0000-4000-8000-000000000101/postulantes/e7000000-0000-4000-8000-000000000201' then
    raise exception 'FALLA 05: aviso de postulación recibida: %', row_to_json(n);
  end if;
  raise notice '✓ 05 La empresa recibe un aviso cuando alguien se postula, con enlace a la postulación';

  select * into n from notificaciones where tipo = 'inscripcion_recibida';
  if n is null or n.mensaje <> 'Ana Uno se inscribió a «Evento 7».'
     or n.enlace <> '/empresa/eventos/e7000000-0000-4000-8000-000000000301' then
    raise exception 'FALLA 06: aviso de inscripción recibida: %', row_to_json(n);
  end if;
  raise notice '✓ 06 La empresa recibe un aviso cuando alguien se inscribe a su evento';
end $$;

-- La empresa mueve la postulación: revisión, entrevista, seleccionada.
update postulaciones set estado = 'en_revision' where id = 'e7000000-0000-4000-8000-000000000201';
update postulaciones set estado = 'entrevista' where id = 'e7000000-0000-4000-8000-000000000201';
update postulaciones set estado = 'aceptada' where id = 'e7000000-0000-4000-8000-000000000201';

reset role;

-- La segunda persona se postula y la empresa la descarta.
insert into postulaciones (id, vacante_id, perfil_id) values
  ('e7000000-0000-4000-8000-000000000202', 'e7000000-0000-4000-8000-000000000101', 'e7000000-0000-4000-8000-0000000000a2');
update postulaciones set estado = 'rechazada' where id = 'e7000000-0000-4000-8000-000000000202';

-- ============================================================
-- Lo que le llegó al joven
-- ============================================================
select set_config('request.jwt.claims',
  '{"sub":"e7000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;

do $$
declare n record;
begin
  if (select count(*) from notificaciones) <> 3 then
    raise exception 'FALLA 07: el joven tiene % avisos, se esperaban 3', (select count(*) from notificaciones);
  end if;

  select * into n from notificaciones where tipo = 'postulacion_seleccionada';
  if n is null
     or n.mensaje <> 'Te seleccionaron en Verificación 7 S.A. para «Búsqueda 7». La empresa se va a comunicar con vos para los próximos pasos.'
     or n.enlace <> '/postulaciones#postulacion-e7000000-0000-4000-8000-000000000201' then
    raise exception 'FALLA 07: aviso de seleccionado: %', row_to_json(n);
  end if;
  if exists (select 1 from notificaciones where mensaje ~ '(aceptada|rechazada|en_revision|entrevista)\M' and mensaje !~ 'etapa de entrevista') then
    raise exception 'FALLA 07: algún aviso muestra el valor crudo de la base';
  end if;
  raise notice '✓ 07 Al joven le llegan revisión, entrevista y seleccionado, con palabras y enlace a su postulación';
end $$;

reset role;

select set_config('request.jwt.claims',
  '{"sub":"e7000000-0000-4000-8000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;

do $$ begin
  if not exists (
    select 1 from notificaciones
    where tipo = 'postulacion_descartada'
      and mensaje like 'Tu postulación a «Búsqueda 7» en Verificación 7 S.A. no siguió adelante.%'
  ) then
    raise exception 'FALLA 08: no llegó el aviso de descartado';
  end if;
  raise notice '✓ 08 Al joven descartado le llega un aviso con palabras';
end $$;

reset role;

-- ============================================================
-- Correos: solo lo importante
-- ============================================================
do $$
declare correo record;
begin
  if (select count(*) from correos_pendientes
      where cuenta_id::text like 'e7000000%') <> 4 then
    raise exception 'FALLA 09: hay % correos encolados, se esperaban 4 (2 postulaciones recibidas, 1 seleccionado, 1 descartado)',
      (select count(*) from correos_pendientes where cuenta_id::text like 'e7000000%');
  end if;
  if exists (select 1 from correos_pendientes c join notificaciones n on n.id = c.notificacion_id
             where n.tipo in ('postulacion_en_revision', 'postulacion_entrevista', 'inscripcion_recibida')) then
    raise exception 'FALLA 09: se encoló un correo por un aviso menor';
  end if;
  raise notice '✓ 09 Correo solo al seleccionar, al descartar y al recibir una postulación';

  select * into correo from correos_pendientes
  where cuenta_id = 'e7000000-0000-4000-8000-0000000000a1';
  if correo.asunto <> 'Te seleccionaron para «Búsqueda 7»' then
    raise exception 'FALLA 10: asunto del correo de seleccionado: %', correo.asunto;
  end if;
  raise notice '✓ 10 El correo de seleccionado lleva un asunto claro';
end $$;

-- Dos despachos a la vez no se llevan el mismo correo.
do $$
declare primero int; segundo int;
begin
  select count(*) into primero from reclamar_correos_pendientes(50) where cuenta_id::text like 'e7000000%';
  select count(*) into segundo from reclamar_correos_pendientes(50) where cuenta_id::text like 'e7000000%';
  if primero <> 4 or segundo <> 0 then
    raise exception 'FALLA 11: reclamar devolvió % y después %', primero, segundo;
  end if;
  raise notice '✓ 11 Un correo reclamado no se vuelve a reclamar';
end $$;

-- Cancelar el evento sigue avisando al inscripto.
update eventos set estado = 'cancelado' where id = 'e7000000-0000-4000-8000-000000000301';
do $$ begin
  if not exists (select 1 from notificaciones
                 where cuenta_id = 'e7000000-0000-4000-8000-0000000000a1'
                   and tipo = 'evento_cancelado' and mensaje = 'Se canceló el evento «Evento 7».') then
    raise exception 'FALLA 12: cancelar el evento no avisó al inscripto';
  end if;
  raise notice '✓ 12 Cancelar un evento avisa a quien se inscribió';
end $$;

do $$ begin raise notice 'TODO EN ORDEN'; end $$;

rollback;
