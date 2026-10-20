-- ============================================================
-- LinkYouth — Verificación de la migración 006 (cuenta y perfil público)
--
--   docker exec -i supabase-db psql -U postgres -d postgres < db/verificar-006.sql
--
-- Qué esperar: líneas «✓ NN …» y al final «TODO EN ORDEN». Si una regla no
-- se cumple, se corta con «FALLA NN: …».
--
-- NO DEJA DATOS: todo corre en una transacción que termina en ROLLBACK. Ids
-- con prefijo e6000000 y correos del dominio reservado .invalid. Actúa como
-- cada usuario igual que la API de Supabase: rol `authenticated` o `anon` y
-- el id en `request.jwt.claims`.
-- ============================================================

begin;

insert into auth.users (id, email) values
  ('e6000000-0000-4000-8000-00000000000a', 'empresa@verificacion6.invalid'),
  ('e6000000-0000-4000-8000-0000000000a1', 'joven-1@verificacion6.invalid'),
  ('e6000000-0000-4000-8000-0000000000a2', 'joven-2@verificacion6.invalid');
insert into cuentas (id, tipo) values
  ('e6000000-0000-4000-8000-00000000000a', 'empresa'),
  ('e6000000-0000-4000-8000-0000000000a1', 'individual'),
  ('e6000000-0000-4000-8000-0000000000a2', 'individual');
insert into empresas (id, razon_social, rubro, rut) values
  ('e6000000-0000-4000-8000-00000000000a', 'Verificación 6', 'Pruebas', '219999999999');
insert into perfiles (id, nombre_usuario, nombre, apellido, fecha_nacimiento, pais, bio) values
  ('e6000000-0000-4000-8000-0000000000a1', 'verif6_joven_1', 'Joven', 'Uno', current_date - interval '20 years', 'Uruguay', 'Bio pública'),
  ('e6000000-0000-4000-8000-0000000000a2', 'verif6_joven_2', 'Joven', 'Dos', current_date - interval '21 years', 'Uruguay', null);
insert into perfil_tags (perfil_id, tag_id)
select 'e6000000-0000-4000-8000-0000000000a1', id from tags order by nombre limit 5;
insert into formaciones (perfil_id, institucion, titulo, estado) values
  ('e6000000-0000-4000-8000-0000000000a1', 'UdelaR', 'Licenciatura', 'en_curso');
insert into vacantes (id, empresa_id, titulo, descripcion, tipo, posiciones, estado, modalidad, ubicacion) values
  ('e6000000-0000-4000-8000-000000000101', 'e6000000-0000-4000-8000-00000000000a', 'Verificación 6', 'x', 'empleo', 3, 'activa', 'remota', null);
insert into postulaciones (id, vacante_id, perfil_id, estado) values
  ('e6000000-0000-4000-8000-000000000201', 'e6000000-0000-4000-8000-000000000101', 'e6000000-0000-4000-8000-0000000000a1', 'pendiente'),
  ('e6000000-0000-4000-8000-000000000202', 'e6000000-0000-4000-8000-000000000101', 'e6000000-0000-4000-8000-0000000000a2', 'pendiente');
insert into eventos (id, empresa_id, titulo, descripcion, fecha_hora, estado) values
  ('e6000000-0000-4000-8000-000000000301', 'e6000000-0000-4000-8000-00000000000a', 'Verificación 6', 'x', now() + interval '5 days', 'activo');
insert into inscripciones_evento (evento_id, perfil_id) values
  ('e6000000-0000-4000-8000-000000000301', 'e6000000-0000-4000-8000-0000000000a1');
insert into resenias (empresa_id, perfil_id, calificacion, comentario) values
  ('e6000000-0000-4000-8000-00000000000a', 'e6000000-0000-4000-8000-0000000000a1', 4, 'Buen proceso');
insert into notificaciones (cuenta_id, tipo, mensaje) values
  ('e6000000-0000-4000-8000-0000000000a1', 'prueba', 'Aviso original');

-- ============================================================
-- Sin sesión
-- ============================================================
select set_config('request.jwt.claims', '', true);
set local role anon;

do $$ begin
  if (select count(*) from resenias_de_empresa('e6000000-0000-4000-8000-00000000000a')) <> 1 then
    raise exception 'FALLA 01: sin sesión no se ven las reseñas de una empresa (RF8.2)';
  end if;
  raise notice '✓ 01 Sin sesión se ven las reseñas de una empresa (RF8.2)';
end $$;

do $$ begin
  begin
    perform * from perfil_publico('verif6_joven_1');
    raise exception 'FALLA 02: sin sesión se lee el perfil de una persona';
  exception when insufficient_privilege then
    raise notice '✓ 02 Sin sesión no se lee el perfil de una persona';
  end;
end $$;

reset role;

-- ============================================================
-- Joven 2 con sesión
-- ============================================================
select set_config('request.jwt.claims',
  '{"sub":"e6000000-0000-4000-8000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;

do $$
declare p record;
begin
  select * into p from perfil_publico('verif6_joven_1');
  if p.nombre_usuario is distinct from 'verif6_joven_1' or p.bio is distinct from 'Bio pública'
     or cardinality(p.tags) <> 5 then
    raise exception 'FALLA 03: el perfil público no trae usuario, bio y los 5 intereses (RF2.5)';
  end if;
  raise notice '✓ 03 Con sesión se lee el perfil público: usuario, bio e intereses (RF2.5)';
end $$;

do $$ begin
  -- La firma de la función es la garantía: no devuelve nombre, apellido,
  -- fecha de nacimiento ni país.
  if exists (
    select 1 from unnest(array['nombre','apellido','fecha_nacimiento','pais']) c
    where c = any (select unnest(proargnames) from pg_proc where proname = 'perfil_publico')
  ) then
    raise exception 'FALLA 04: el perfil público expone datos personales';
  end if;
  raise notice '✓ 04 El perfil público no expone nombre, apellido, nacimiento ni país';
end $$;

do $$ begin
  if exists (select 1 from resenias_de_empresa('e6000000-0000-4000-8000-00000000000a') r
             where r::text like '%e6000000-0000-4000-8000-0000000000a1%') then
    raise exception 'FALLA 05: la reseña pública dice quién la escribió';
  end if;
  raise notice '✓ 05 La reseña pública no dice quién la escribió';
end $$;

reset role;

-- ============================================================
-- Joven 1: avisos y eliminar su cuenta
-- ============================================================
select set_config('request.jwt.claims',
  '{"sub":"e6000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;

do $$ begin
  update notificaciones set leida = true where cuenta_id = auth.uid();
  if not found then raise exception 'FALLA 06: no puede marcar su aviso como leído'; end if;
  begin
    update notificaciones set mensaje = 'Reescrito' where cuenta_id = auth.uid();
    raise exception 'FALLA 07: puede reescribir el texto de un aviso';
  exception when insufficient_privilege then null;
  end;
  raise notice '✓ 06 Marca sus avisos como leídos y no puede reescribirlos (RF6.1)';
end $$;

select eliminar_mi_cuenta();

reset role;

do $$
declare p record;
begin
  select * into p from perfiles where id = 'e6000000-0000-4000-8000-0000000000a1';
  if p.nombre <> 'Cuenta' or p.bio is not null or p.nombre_usuario not like 'cuenta_eliminada_%' then
    raise exception 'FALLA 08: el perfil eliminado conserva datos personales';
  end if;
  if exists (select 1 from perfil_tags where perfil_id = p.id)
     or exists (select 1 from formaciones where perfil_id = p.id)
     or exists (select 1 from inscripciones_evento where perfil_id = p.id)
     or exists (select 1 from notificaciones where cuenta_id = p.id) then
    raise exception 'FALLA 09: quedaron intereses, formación, inscripciones o avisos';
  end if;
  if (select estado from postulaciones where id = 'e6000000-0000-4000-8000-000000000201') <> 'cancelada' then
    raise exception 'FALLA 10: la postulación en curso no pasó a cancelada';
  end if;
  if not exists (select 1 from resenias where perfil_id = p.id) then
    raise exception 'FALLA 11: se borró la reseña';
  end if;
  if cuenta_activa(p.id) then raise exception 'FALLA 12: la cuenta sigue activa'; end if;
  raise notice '✓ 07 Eliminar la cuenta de un joven anonimiza, cancela lo pendiente y conserva la reseña (RF1.7)';
end $$;

-- ============================================================
-- Empresa elimina su cuenta
-- ============================================================
select set_config('request.jwt.claims',
  '{"sub":"e6000000-0000-4000-8000-00000000000a","role":"authenticated"}', true);
set local role authenticated;
select eliminar_mi_cuenta();
reset role;

do $$ begin
  if (select estado from vacantes where id = 'e6000000-0000-4000-8000-000000000101') <> 'cerrada' then
    raise exception 'FALLA 13: la búsqueda activa no se cerró';
  end if;
  if (select estado from postulaciones where id = 'e6000000-0000-4000-8000-000000000202') <> 'rechazada' then
    raise exception 'FALLA 14: la postulación pendiente no se rechazó al cerrar (RF3.3.3)';
  end if;
  if (select estado from eventos where id = 'e6000000-0000-4000-8000-000000000301') <> 'cancelado' then
    raise exception 'FALLA 15: el evento futuro no se canceló';
  end if;
  if (select rut from empresas where id = 'e6000000-0000-4000-8000-00000000000a') is not null then
    raise exception 'FALLA 16: la empresa eliminada conserva el RUT';
  end if;
  if (select count(*) from resenias_de_empresa('e6000000-0000-4000-8000-00000000000a')) <> 0 then
    raise exception 'FALLA 17: se siguen mostrando reseñas de una empresa eliminada';
  end if;
  raise notice '✓ 08 Eliminar la cuenta de una empresa cierra búsquedas, cancela eventos y anonimiza (RF1.7)';
end $$;

do $$ begin
  begin
    set local role anon;
    perform eliminar_mi_cuenta();
    raise exception 'FALLA 18: anon puede llamar a eliminar_mi_cuenta';
  exception when insufficient_privilege then null;
  end;
  reset role;
  raise notice '✓ 09 Sin sesión no se puede llamar a eliminar_mi_cuenta';
  raise notice 'TODO EN ORDEN: 9 verificaciones. Se deshacen todos los datos de prueba.';
end $$;

rollback;
