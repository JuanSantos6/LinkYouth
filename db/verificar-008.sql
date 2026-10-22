-- ============================================================
-- LinkYouth — Verificación de la migración 008 (habilidades ocultas y fotos)
--
--   docker exec -i supabase-db psql -U postgres -d postgres < db/verificar-008.sql
--
-- Qué esperar: líneas «✓ NN …» y al final «TODO EN ORDEN». Si una regla no
-- se cumple, se corta con «FALLA NN: …».
--
-- NO DEJA DATOS: todo corre en una transacción que termina en ROLLBACK. Ids
-- con prefijo e8000000 y correos del dominio reservado .invalid. Actúa como
-- cada usuario igual que la API de Supabase: rol `authenticated` o `anon` y
-- el id en `request.jwt.claims`.
-- ============================================================

begin;

insert into auth.users (id, email) values
  ('e8000000-0000-4000-8000-00000000000a', 'empresa@verificacion8.invalid'),
  ('e8000000-0000-4000-8000-00000000000b', 'otra@verificacion8.invalid'),
  ('e8000000-0000-4000-8000-0000000000a1', 'joven@verificacion8.invalid');
insert into cuentas (id, tipo) values
  ('e8000000-0000-4000-8000-00000000000a', 'empresa'),
  ('e8000000-0000-4000-8000-00000000000b', 'empresa'),
  ('e8000000-0000-4000-8000-0000000000a1', 'individual');
insert into empresas (id, razon_social, rubro) values
  ('e8000000-0000-4000-8000-00000000000a', 'Verificación 8', 'Pruebas'),
  ('e8000000-0000-4000-8000-00000000000b', 'Verificación 8 otra', 'Pruebas');
insert into perfiles (id, nombre_usuario, nombre, apellido, fecha_nacimiento, pais) values
  ('e8000000-0000-4000-8000-0000000000a1', 'verif8_joven', 'Joven', 'Ocho', current_date - interval '20 years', 'Uruguay');
insert into vacantes (id, empresa_id, titulo, descripcion, tipo, posiciones, estado, modalidad) values
  ('e8000000-0000-4000-8000-000000000101', 'e8000000-0000-4000-8000-00000000000a', 'Verificación 8', 'x', 'empleo', 1, 'activa', 'remota');
insert into vacante_habilidades_ocultas (vacante_id, habilidad_id)
select 'e8000000-0000-4000-8000-000000000101', id from habilidades order by nombre limit 1;
insert into postulaciones (vacante_id, perfil_id) values
  ('e8000000-0000-4000-8000-000000000101', 'e8000000-0000-4000-8000-0000000000a1');
insert into fotos (url, unsplash_id, autor, autor_enlace, enlace, descripcion, ancho, alto) values
  ('https://images.unsplash.com/photo-verificacion-8', 'verif8', 'Autora', 'https://unsplash.com/@verif8', 'https://unsplash.com/photos/verif8', 'Foto de prueba', 1200, 800);
insert into lugares_con_foto (lugar, url) values
  ('portada:verificacion', 'https://images.unsplash.com/photo-verificacion-8');

-- ============================================================
-- Sin sesión
-- ============================================================
select set_config('request.jwt.claims', '', true);
set local role anon;

do $$ begin
  begin
    perform * from vacante_habilidades_ocultas;
    raise exception 'FALLA 01: sin sesión se leen habilidades ocultas';
  exception when insufficient_privilege then
    raise notice '✓ 01 Sin sesión no se leen habilidades ocultas (RNF5)';
  end;
end $$;

do $$ begin
  if (select count(*) from lugares_con_foto l join fotos f using (url)
      where l.lugar = 'portada:verificacion') <> 1 then
    raise exception 'FALLA 02: sin sesión no se leen las fotos de la portada';
  end if;
  raise notice '✓ 02 Sin sesión se leen las fotos y su atribución';
end $$;

do $$ begin
  begin
    insert into fotos (url, unsplash_id, autor, autor_enlace, enlace, descripcion, ancho, alto)
    values ('https://images.unsplash.com/x', 'x', 'x', 'https://unsplash.com/x', 'https://unsplash.com/x', 'x', 1, 1);
    raise exception 'FALLA 03: sin sesión se escribe en fotos';
  exception when insufficient_privilege then
    raise notice '✓ 03 Sin sesión no se escribe en fotos';
  end;
end $$;

reset role;

-- ============================================================
-- El joven que se postuló
-- ============================================================
select set_config('request.jwt.claims',
  '{"sub":"e8000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;

do $$ begin
  if exists (select 1 from vacante_habilidades_ocultas
             where vacante_id = 'e8000000-0000-4000-8000-000000000101') then
    raise exception 'FALLA 04: el postulante lee las habilidades ocultas';
  end if;
  raise notice '✓ 04 El postulante no lee las habilidades ocultas (RF3.1.6, RNF5)';
end $$;

do $$ begin
  begin
    insert into vacante_habilidades_ocultas (vacante_id, habilidad_id)
    select 'e8000000-0000-4000-8000-000000000101', id from habilidades order by nombre offset 1 limit 1;
    raise exception 'FALLA 05: el postulante agrega habilidades ocultas';
  exception when insufficient_privilege then
    raise notice '✓ 05 El postulante no agrega habilidades ocultas';
  end;
end $$;

do $$ begin
  begin
    update fotos set autor = 'otro';
    if exists (select 1 from fotos where autor = 'otro') then
      raise exception 'FALLA 06: una sesión cambia la atribución de una foto';
    end if;
    raise notice '✓ 06 Una sesión no cambia la atribución de una foto';
  exception when insufficient_privilege then
    raise notice '✓ 06 Una sesión no cambia la atribución de una foto';
  end;
end $$;

reset role;

-- ============================================================
-- Otra empresa
-- ============================================================
select set_config('request.jwt.claims',
  '{"sub":"e8000000-0000-4000-8000-00000000000b","role":"authenticated"}', true);
set local role authenticated;

do $$ begin
  if exists (select 1 from vacante_habilidades_ocultas
             where vacante_id = 'e8000000-0000-4000-8000-000000000101') then
    raise exception 'FALLA 07: otra empresa lee las habilidades ocultas';
  end if;
  raise notice '✓ 07 Otra empresa no lee las habilidades ocultas';
end $$;

reset role;

-- ============================================================
-- La empresa dueña
-- ============================================================
select set_config('request.jwt.claims',
  '{"sub":"e8000000-0000-4000-8000-00000000000a","role":"authenticated"}', true);
set local role authenticated;

do $$ begin
  if (select count(*) from vacante_habilidades_ocultas
      where vacante_id = 'e8000000-0000-4000-8000-000000000101') <> 1 then
    raise exception 'FALLA 08: la empresa dueña no lee sus habilidades ocultas';
  end if;
  delete from vacante_habilidades_ocultas
  where vacante_id = 'e8000000-0000-4000-8000-000000000101';
  insert into vacante_habilidades_ocultas (vacante_id, habilidad_id)
  select 'e8000000-0000-4000-8000-000000000101', id from habilidades order by nombre offset 1 limit 1;
  raise notice '✓ 08 La empresa dueña lee, borra y agrega sus habilidades ocultas';
end $$;

reset role;

do $$ begin raise notice 'TODO EN ORDEN'; end $$;

rollback;
