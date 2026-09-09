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
returns trigger as $$
begin
  new.actualizada_en = now();
  return new;
end;
$$ language plpgsql;

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
returns trigger as $$
begin
  if new.estado is distinct from old.estado then
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
$$ language plpgsql security definer;

create trigger postulaciones_notificar_cambio
after update on postulaciones
for each row execute function notificar_cambio_estado_postulacion();
