-- ============================================================
-- LinkYouth — Esquema de base de datos
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- Orden: este archivo primero, después politicas.sql
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- MÓDULO: Identidad y cuentas
-- Cubre: RF1.1, RF1.2, RF1.3.5, RF1.5, RF1.6, RF1.7, RF2.1, RF2.2
-- ============================================================

-- Tabla puente: toda cuenta (individual o empresa) vive acá.
-- auth.users ya la maneja Supabase; esta tabla la extiende.
create table cuentas (
  id         uuid primary key references auth.users(id) on delete cascade,
  tipo       text not null check (tipo in ('individual', 'empresa')),
  eliminada  boolean not null default false,
  creada_en  timestamptz not null default now()
);

create table perfiles (
  id                uuid primary key references cuentas(id) on delete cascade,
  nombre_usuario    text not null unique,
  nombre            text not null,
  apellido          text not null,
  fecha_nacimiento  date not null,
  pais              text not null,
  bio               text,
  foto_url          text,
  creado_en         timestamptz not null default now()
);

-- Exige que el usuario sea mayor de 18 años al momento del registro (RF1.1.8).
alter table perfiles
  add constraint perfiles_mayor_de_edad
  check (fecha_nacimiento <= current_date - interval '18 years');

create table empresas (
  id             uuid primary key references cuentas(id) on delete cascade,
  razon_social   text not null unique,
  rubro          text not null,
  descripcion    text,
  logo_url       text,
  creada_en      timestamptz not null default now()
);

-- ============================================================
-- MÓDULO: Catálogos — Tags (intereses) y Habilidades (conocimientos técnicos)
-- Son catálogos cerrados: se cargan por seed, no los crea el usuario.
-- Separados porque el matching (RF3.9) necesita distinguir
-- "le interesa" de "sabe hacer".
-- Cubre: RF1.1.11, RF2.3, RF2.4.3, RF2.4.4
-- ============================================================

create table tags (
  id      uuid primary key default gen_random_uuid(),
  nombre  text not null unique
);

create table habilidades (
  id      uuid primary key default gen_random_uuid(),
  nombre  text not null unique
);

create table perfil_tags (
  perfil_id  uuid not null references perfiles(id) on delete cascade,
  tag_id     uuid not null references tags(id) on delete cascade,
  primary key (perfil_id, tag_id)
);

create table perfil_habilidades (
  perfil_id     uuid not null references perfiles(id) on delete cascade,
  habilidad_id  uuid not null references habilidades(id) on delete cascade,
  primary key (perfil_id, habilidad_id)
);

-- ============================================================
-- MÓDULO: Formación declarada
-- Cubre: RF2.4.1, RF2.4.2
-- ============================================================

create table formaciones (
  id           uuid primary key default gen_random_uuid(),
  perfil_id    uuid not null references perfiles(id) on delete cascade,
  institucion  text not null,
  titulo       text not null,
  estado       text not null check (estado in ('en_curso', 'finalizado'))
);

-- ============================================================
-- MÓDULO: Vacantes y postulaciones
-- Cubre: RF3.1-RF3.8
-- ============================================================

create table vacantes (
  id           uuid primary key default gen_random_uuid(),
  empresa_id   uuid not null references empresas(id) on delete cascade,
  titulo       text not null,
  descripcion  text not null,
  tipo         text not null check (tipo in ('empleo', 'pasantia')),
  posiciones   int not null check (posiciones > 0),
  estado       text not null default 'activa' check (estado in ('activa', 'cerrada')),
  creada_en    timestamptz not null default now()
);

create table vacante_tags_publicos (
  vacante_id  uuid not null references vacantes(id) on delete cascade,
  tag_id      uuid not null references tags(id) on delete cascade,
  primary key (vacante_id, tag_id)
);

create table vacante_habilidades (
  vacante_id    uuid not null references vacantes(id) on delete cascade,
  habilidad_id  uuid not null references habilidades(id) on delete cascade,
  primary key (vacante_id, habilidad_id)
);

-- Tabla separada por RNF5: los tags ocultos nunca deben viajar
-- junto con el resto de la fila de la vacante.
create table vacante_tags_ocultos (
  vacante_id  uuid not null references vacantes(id) on delete cascade,
  tag_id      uuid not null references tags(id) on delete cascade,
  primary key (vacante_id, tag_id)
);

create table postulaciones (
  id             uuid primary key default gen_random_uuid(),
  vacante_id     uuid not null references vacantes(id) on delete cascade,
  perfil_id      uuid not null references perfiles(id) on delete cascade,
  estado         text not null default 'pendiente'
                 check (estado in ('pendiente', 'en_revision', 'aceptada', 'rechazada', 'cancelada')),
  creada_en      timestamptz not null default now(),
  actualizada_en timestamptz not null default now(),
  unique (vacante_id, perfil_id) -- resuelve RF3.6.2 en la base
);

-- Mantiene actualizada_en al día sin que la app tenga que acordarse.
create or replace function set_actualizada_en()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.actualizada_en = now();
  return new;
end;
$$;

create trigger postulaciones_actualizada_en
before update on postulaciones
for each row execute function set_actualizada_en();

-- ============================================================
-- MÓDULO: Eventos institucionales
-- Cubre: RF4.1-RF4.6
-- ============================================================

create table eventos (
  id           uuid primary key default gen_random_uuid(),
  empresa_id   uuid not null references empresas(id) on delete cascade,
  titulo       text not null,
  descripcion  text not null,
  fecha_hora   timestamptz not null,
  imagen_url   text,
  estado       text not null default 'activo' check (estado in ('activo', 'cancelado'))
);

create table evento_tags (
  evento_id  uuid not null references eventos(id) on delete cascade,
  tag_id     uuid not null references tags(id) on delete cascade,
  primary key (evento_id, tag_id)
);

create table inscripciones_evento (
  evento_id  uuid not null references eventos(id) on delete cascade,
  perfil_id  uuid not null references perfiles(id) on delete cascade,
  creada_en  timestamptz not null default now(),
  primary key (evento_id, perfil_id)
);

-- ============================================================
-- MÓDULO: Reseñas
-- Cubre: RF8.1, RF8.2, RF7.4
-- Puede reseñar quien tenga al menos una postulación (en cualquier
-- estado) a esa empresa — ver politicas.sql para la regla completa.
-- ============================================================

create table resenias (
  id            uuid primary key default gen_random_uuid(),
  empresa_id    uuid not null references empresas(id) on delete cascade,
  perfil_id     uuid not null references perfiles(id) on delete cascade,
  calificacion  int not null check (calificacion between 1 and 5),
  comentario    text not null,
  creada_en     timestamptz not null default now(),
  unique (empresa_id, perfil_id) -- una reseña por usuario por empresa
);

-- ============================================================
-- MÓDULO: Notificaciones
-- Cubre: RF6.1, RF6.2
-- ============================================================

create table notificaciones (
  id         uuid primary key default gen_random_uuid(),
  cuenta_id  uuid not null references cuentas(id) on delete cascade,
  tipo       text not null,
  mensaje    text not null,
  enlace     text,
  leida      boolean not null default false,
  creada_en  timestamptz not null default now()
);

-- Genera la notificación de RF6.2 automáticamente cuando una
-- empresa cambia el estado de una postulación. Corre con permisos
-- elevados (security definer) porque inserta en la cuenta del
-- postulante, no en la de quien ejecuta la acción.
create or replace function notificar_cambio_estado_postulacion()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- 'cancelada' es la unica transicion que hace el propio postulante
  -- (ver politicas.sql). Notificarsela seria avisarle de su propia accion.
  if new.estado is distinct from old.estado and new.estado <> 'cancelada' then
    insert into notificaciones (cuenta_id, tipo, mensaje, enlace)
    values (
      new.perfil_id,
      'postulacion',
      'El estado de tu postulación cambió a: ' || new.estado,
      '/postulaciones/' || new.id
    );
  end if;
  return new;
end;
$$;

create trigger postulaciones_notificar_cambio
after update on postulaciones
for each row execute function notificar_cambio_estado_postulacion();

-- ============================================================
-- MÓDULO: Integridad entre cuentas, perfiles y empresas
-- Una cuenta es individual o empresa, nunca las dos. La fila de
-- detalle tiene que coincidir con cuentas.tipo: varias políticas
-- de RLS asumen que ese campo es siempre correcto.
-- ============================================================

create or replace function validar_tipo_cuenta()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if TG_TABLE_NAME = 'perfiles' then
    if not exists (select 1 from cuentas where id = new.id and tipo = 'individual') then
      raise exception 'La cuenta % no es de tipo individual', new.id;
    end if;
    if exists (select 1 from empresas where id = new.id) then
      raise exception 'La cuenta % ya tiene un registro de empresa', new.id;
    end if;
  elsif TG_TABLE_NAME = 'empresas' then
    if not exists (select 1 from cuentas where id = new.id and tipo = 'empresa') then
      raise exception 'La cuenta % no es de tipo empresa', new.id;
    end if;
    if exists (select 1 from perfiles where id = new.id) then
      raise exception 'La cuenta % ya tiene un registro de perfil', new.id;
    end if;
  end if;
  return new;
end;
$$;

create trigger perfiles_valida_tipo
before insert or update on perfiles
for each row execute function validar_tipo_cuenta();

create trigger empresas_valida_tipo
before insert or update on empresas
for each row execute function validar_tipo_cuenta();

-- Bloquea el cambio de cuentas.tipo cuando la cuenta ya tiene su fila de
-- detalle: si no, tipo queda desincronizado de donde vive realmente la fila
-- y las politicas de RLS que confian en tipo dejan de decir la verdad.
create or replace function validar_cambio_tipo_cuenta()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.tipo is distinct from old.tipo
     and (exists (select 1 from perfiles where id = new.id)
          or exists (select 1 from empresas where id = new.id)) then
    raise exception 'No se puede cambiar el tipo de la cuenta %: ya tiene datos asociados', new.id;
  end if;
  return new;
end;
$$;

create trigger cuentas_valida_cambio_tipo
before update on cuentas
for each row execute function validar_cambio_tipo_cuenta();

-- ============================================================
-- MÓDULO: Baja lógica de cuentas
-- Las políticas de lectura consultan esta función en vez de leer
-- cuentas directamente: la tabla tiene RLS que limita cada fila a su
-- dueño, así que una subquery común solo vería la cuenta propia y
-- ocultaría todos los demás perfiles. security definer la saltea;
-- stable permite que el planificador la evalúe una vez por consulta.
-- ============================================================

create or replace function cuenta_activa(cuenta uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from cuentas where id = cuenta and not eliminada);
$$;

-- ============================================================
-- MÓDULO: Perfil público (CN-001)
-- RF2.5 pide que el perfil sea consultable por otros. RLS no sabe de
-- columnas, así que exponer la tabla entera exponía también
-- `fecha_nacimiento`, que la interfaz nunca muestra. La vista publica
-- la lista exacta de columnas publicables y deja la fecha afuera.
--
-- Sin `security_invoker`, una vista corre con los permisos de su dueño
-- y por lo tanto saltea el RLS de `perfiles`. Eso es deliberado: es lo
-- que permite que un visitante sin sesión lea un perfil público ahora
-- que la política de la tabla se limita a la fila propia. El filtro de
-- cuentas dadas de baja, que antes hacía la política, lo hace el
-- `where` de la vista.
-- ============================================================

create view perfiles_publicos as
select id, nombre_usuario, nombre, apellido, pais, bio, foto_url, creado_en
from perfiles
where cuenta_activa(id);

grant select on perfiles_publicos to anon, authenticated;

-- ============================================================
-- ÍNDICES
-- Postgres no indexa las claves foráneas por su cuenta. Cada política
-- de RLS que hace `exists (select 1 from vacantes ...)` corre por fila,
-- así que sin estos índices el costo se multiplica por el tamaño de la
-- tabla. Cubre RNF1 (rendimiento).
-- Las claves primarias compuestas ya indexan su primera columna; acá va
-- el lado inverso, que es el que usa el matching (RF3.9).
-- ============================================================

create index if not exists idx_postulaciones_perfil
  on postulaciones (perfil_id);
create index if not exists idx_postulaciones_vacante_estado
  on postulaciones (vacante_id, estado);

create index if not exists idx_vacantes_empresa
  on vacantes (empresa_id);
create index if not exists idx_vacantes_activas
  on vacantes (creada_en desc) where estado = 'activa';

create index if not exists idx_eventos_empresa
  on eventos (empresa_id);
create index if not exists idx_eventos_proximos
  on eventos (fecha_hora) where estado = 'activo';

create index if not exists idx_formaciones_perfil
  on formaciones (perfil_id);
create index if not exists idx_resenias_perfil
  on resenias (perfil_id);
create index if not exists idx_inscripciones_perfil
  on inscripciones_evento (perfil_id);

create index if not exists idx_notificaciones_cuenta
  on notificaciones (cuenta_id, creada_en desc);
create index if not exists idx_notificaciones_no_leidas
  on notificaciones (cuenta_id) where not leida;

create index if not exists idx_perfil_tags_tag
  on perfil_tags (tag_id);
create index if not exists idx_perfil_habilidades_habilidad
  on perfil_habilidades (habilidad_id);
create index if not exists idx_vacante_tags_publicos_tag
  on vacante_tags_publicos (tag_id);
create index if not exists idx_vacante_tags_ocultos_tag
  on vacante_tags_ocultos (tag_id);
create index if not exists idx_vacante_habilidades_habilidad
  on vacante_habilidades (habilidad_id);
create index if not exists idx_evento_tags_tag
  on evento_tags (tag_id);

-- ============================================================
-- MÓDULO: Inmutabilidad de la identidad de una postulación
-- RLS decide qué fila se puede tocar y con qué valores, pero no ve la
-- fila vieja: no puede exigir que una columna no cambie. Sin esto, la
-- empresa dueña de la vacante puede reasignar la postulación a otro
-- perfil (y dispararle una notificación que ese usuario nunca pidió).
-- Una política que leyera `postulaciones` para comparar caería en
-- "infinite recursion detected in policy for relation"; el trigger no.
-- ============================================================

create or replace function postulacion_identidad_inmutable()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.perfil_id is distinct from old.perfil_id
     or new.vacante_id is distinct from old.vacante_id then
    raise exception 'No se puede cambiar el perfil ni la vacante de una postulación';
  end if;
  return new;
end;
$$;

create trigger postulaciones_identidad_inmutable
before update on postulaciones
for each row execute function postulacion_identidad_inmutable();


-- ============================================================
-- MÓDULO: Estados finales de una postulación (CN-003)
-- `postulaciones_transiciones_permitidas` acota el estado destino pero
-- no ve la fila vieja, así que no podía exigir nada sobre el origen.
-- Sin esto, la empresa dueña de la vacante podía tomar una postulación
-- que el postulante ya había cancelado (RF3.8) y moverla a 'aceptada',
-- reabriendo un proceso del que la persona se había bajado —y
-- disparándole la notificación de RF6.2 por un cambio que no pidió.
--
-- 'aceptada', 'rechazada' y 'cancelada' son terminales: ninguno de los
-- tres puede pasar a otro estado. La fila nunca se borra (RF3.8, deuda
-- 7.3), solo deja de moverse.
-- ============================================================

create or replace function postulacion_transicion_valida()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if old.estado in ('aceptada', 'rechazada', 'cancelada')
     and new.estado is distinct from old.estado then
    raise exception 'La postulacion % ya esta en un estado final (%) y no puede cambiar', old.id, old.estado;
  end if;
  return new;
end;
$$;

create trigger postulaciones_transicion_valida
before update on postulaciones
for each row execute function postulacion_transicion_valida();
