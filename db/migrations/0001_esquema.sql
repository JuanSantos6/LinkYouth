-- LinkYouth — Esquema base (Sprints 1 y 2 del SRS)
--
-- Cubre RF1 (cuentas), RF2 (perfil, tags y formacion), RF3 (vacantes y
-- postulaciones), RF4 (eventos e inscripciones) y RF6.1 (notificaciones).
--
-- Convenciones:
--   * Nombres de tablas y columnas en espanol, en minuscula y sin tildes.
--   * Toda tabla lleva `creado_en`; las que se editan llevan `actualizado_en`.
--   * Las claves foraneas usan `on delete cascade` cuando el hijo no tiene
--     sentido sin el padre (RF1.7.5: eliminar la cuenta borra sus datos).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tipos enumerados
-- ---------------------------------------------------------------------------

create type tipo_oportunidad as enum ('empleo', 'pasantia');
create type modalidad_trabajo as enum ('presencial', 'hibrido', 'remoto');
create type estado_vacante as enum ('activa', 'cerrada');
create type estado_postulacion as enum ('pendiente', 'en_revision', 'rechazada', 'aceptada');
create type estado_formacion as enum ('en_curso', 'finalizado', 'abandonado');
create type estado_evento as enum ('publicado', 'cancelado');
create type categoria_tag as enum ('tecnologia', 'diseno', 'datos', 'negocios', 'idiomas', 'habilidades_blandas');

-- ---------------------------------------------------------------------------
-- RF1 — Cuentas
-- ---------------------------------------------------------------------------

-- Perfil del postulante. El id es el mismo que el de auth.users para que las
-- politicas de Row Level Security puedan compararlo contra auth.uid().
create table perfiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  nombre_usuario    text not null unique
                    check (nombre_usuario ~ '^[a-z0-9_]{3,30}$'),
  nombre            text not null check (length(nombre) between 2 and 60),
  apellido          text not null check (length(apellido) between 2 and 60),
  fecha_nacimiento  date not null
                    -- RF1.1.8: la edad minima para operar en la plataforma.
                    check (fecha_nacimiento <= current_date - interval '18 years'),
  pais              text not null default 'Uruguay',
  ciudad            text,
  titular           text check (length(titular) <= 120),
  biografia         text check (length(biografia) <= 600),
  avatar_url        text,
  verificado        boolean not null default false,
  creado_en         timestamptz not null default now(),
  actualizado_en    timestamptz not null default now()
);

comment on table perfiles is 'RF1.1 / RF2: datos publicos del postulante.';
comment on column perfiles.verificado is 'Marca institucional: la formacion declarada fue validada.';

-- Cuenta institucional. `cuenta_id` es opcional para poder cargar empresas de
-- catalogo (demo o alta manual) antes de que exista el usuario que las opera.
create table empresas (
  id             uuid primary key default gen_random_uuid(),
  cuenta_id      uuid unique references auth.users (id) on delete cascade,
  razon_social   text not null unique check (length(razon_social) between 2 and 120),
  rubro          text not null,
  descripcion    text check (length(descripcion) <= 1000),
  logo_url       text,
  sitio_web      text,
  ubicacion      text,
  verificada     boolean not null default false,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

comment on table empresas is 'RF1.2 / RF7: cuenta de empresa u organizacion.';

-- ---------------------------------------------------------------------------
-- RF2 — Tags, formacion
-- ---------------------------------------------------------------------------

create table tags (
  id        uuid primary key default gen_random_uuid(),
  slug      text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  nombre    text not null unique,
  categoria categoria_tag not null,
  creado_en timestamptz not null default now()
);

comment on table tags is 'Catalogo unico de etiquetas. Base del filtrado y del matching.';

-- RF2.3: tags publicos del perfil. `nivel` es la autoevaluacion del postulante.
create table perfil_tags (
  perfil_id uuid not null references perfiles (id) on delete cascade,
  tag_id    uuid not null references tags (id) on delete cascade,
  nivel     smallint not null default 3 check (nivel between 1 and 5),
  creado_en timestamptz not null default now(),
  primary key (perfil_id, tag_id)
);

-- RF2.4: formacion declarada. `institucion_logo_url` alimenta el bloque de
-- logo que la vista de perfil reserva a la izquierda de cada estudio.
create table formaciones (
  perfil_id            uuid not null references perfiles (id) on delete cascade,
  id                   uuid primary key default gen_random_uuid(),
  institucion          text not null,
  institucion_logo_url text,
  titulo               text not null,
  estado               estado_formacion not null default 'en_curso',
  anio_inicio          smallint check (anio_inicio between 1950 and 2100),
  anio_fin             smallint check (anio_fin between 1950 and 2100),
  acreditada           boolean not null default false,
  creado_en            timestamptz not null default now(),
  check (anio_fin is null or anio_inicio is null or anio_fin >= anio_inicio)
);

create index formaciones_perfil_idx on formaciones (perfil_id);

-- ---------------------------------------------------------------------------
-- RF3 — Vacantes y postulaciones
-- ---------------------------------------------------------------------------

create table vacantes (
  id           uuid primary key default gen_random_uuid(),
  empresa_id   uuid not null references empresas (id) on delete cascade,
  titulo       text not null check (length(titulo) between 4 and 140),
  descripcion  text not null,
  tipo         tipo_oportunidad not null default 'empleo',
  modalidad    modalidad_trabajo not null default 'presencial',
  ubicacion    text,
  salario_min  integer check (salario_min >= 0),
  salario_max  integer check (salario_max >= 0),
  moneda       text not null default 'USD' check (moneda in ('USD', 'UYU')),
  posiciones   smallint not null default 1 check (posiciones > 0),
  estado       estado_vacante not null default 'activa',
  publicada_en timestamptz not null default now(),
  cerrada_en   timestamptz,
  check (salario_max is null or salario_min is null or salario_max >= salario_min)
);

-- RF3.1.2: el titulo no se repite entre las vacantes activas de una empresa.
create unique index vacantes_titulo_activo_idx
  on vacantes (empresa_id, lower(titulo))
  where estado = 'activa';

create index vacantes_estado_idx on vacantes (estado, publicada_en desc);

-- RF3.1.5: tags publicos, visibles para el postulante.
create table vacante_tags (
  vacante_id uuid not null references vacantes (id) on delete cascade,
  tag_id     uuid not null references tags (id) on delete cascade,
  primary key (vacante_id, tag_id)
);

-- RF3.1.6 y RNF5: los tags ocultos viven en su propia tabla justamente para
-- que ninguna consulta del postulante pueda alcanzarlos por error. La politica
-- de lectura de esta tabla solo habilita a la empresa duena de la vacante.
create table vacante_tags_ocultos (
  vacante_id uuid not null references vacantes (id) on delete cascade,
  tag_id     uuid not null references tags (id) on delete cascade,
  peso       smallint not null default 1 check (peso between 1 and 5),
  primary key (vacante_id, tag_id)
);

comment on table vacante_tags_ocultos is
  'RF3.1.6: tags privados de la vacante. Solo los lee la empresa que publica.';

create table postulaciones (
  id              uuid primary key default gen_random_uuid(),
  vacante_id      uuid not null references vacantes (id) on delete cascade,
  perfil_id       uuid not null references perfiles (id) on delete cascade,
  estado          estado_postulacion not null default 'pendiente',
  puntaje         smallint check (puntaje between 0 and 100),
  mensaje         text check (length(mensaje) <= 600),
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now(),
  -- RF3.6.2: una sola postulacion por persona y vacante.
  unique (vacante_id, perfil_id)
);

create index postulaciones_perfil_idx on postulaciones (perfil_id, creado_en desc);
create index postulaciones_vacante_idx on postulaciones (vacante_id, estado);

-- ---------------------------------------------------------------------------
-- RF4 — Eventos institucionales
-- ---------------------------------------------------------------------------

create table eventos (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references empresas (id) on delete cascade,
  titulo      text not null check (length(titulo) between 4 and 140),
  descripcion text not null,
  inicia_en   timestamptz not null,
  termina_en  timestamptz,
  modalidad   modalidad_trabajo not null default 'presencial',
  ubicacion   text,
  imagen_url  text,
  cupo        smallint check (cupo > 0),
  estado      estado_evento not null default 'publicado',
  creado_en   timestamptz not null default now(),
  check (termina_en is null or termina_en >= inicia_en)
);

create index eventos_agenda_idx on eventos (estado, inicia_en);

create table evento_tags (
  evento_id uuid not null references eventos (id) on delete cascade,
  tag_id    uuid not null references tags (id) on delete cascade,
  primary key (evento_id, tag_id)
);

create table inscripciones (
  evento_id uuid not null references eventos (id) on delete cascade,
  perfil_id uuid not null references perfiles (id) on delete cascade,
  creado_en timestamptz not null default now(),
  primary key (evento_id, perfil_id)
);

-- ---------------------------------------------------------------------------
-- RF6 — Notificaciones
-- ---------------------------------------------------------------------------

create table notificaciones (
  id        uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references perfiles (id) on delete cascade,
  tipo      text not null,
  titulo    text not null,
  cuerpo    text,
  enlace    text,
  leida     boolean not null default false,
  creado_en timestamptz not null default now()
);

create index notificaciones_bandeja_idx on notificaciones (perfil_id, leida, creado_en desc);

-- ---------------------------------------------------------------------------
-- Disparadores auxiliares
-- ---------------------------------------------------------------------------

create or replace function tocar_actualizado_en()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

create trigger perfiles_actualizado_en
  before update on perfiles
  for each row execute function tocar_actualizado_en();

create trigger empresas_actualizado_en
  before update on empresas
  for each row execute function tocar_actualizado_en();

create trigger postulaciones_actualizado_en
  before update on postulaciones
  for each row execute function tocar_actualizado_en();

-- RF6.2: cada cambio de estado de una postulacion avisa al postulante.
create or replace function notificar_cambio_postulacion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  titulo_vacante text;
begin
  if new.estado is distinct from old.estado then
    select v.titulo into titulo_vacante from vacantes v where v.id = new.vacante_id;

    insert into notificaciones (perfil_id, tipo, titulo, cuerpo, enlace)
    values (
      new.perfil_id,
      'postulacion',
      'Tu postulacion cambio de estado',
      format('%s: %s', coalesce(titulo_vacante, 'Vacante'), replace(new.estado::text, '_', ' ')),
      '/postulaciones'
    );
  end if;

  return new;
end;
$$;

create trigger postulaciones_notifican
  after update on postulaciones
  for each row execute function notificar_cambio_postulacion();

-- RF3.3.2 y RF3.3.3: al llenarse las posiciones la vacante se cierra sola y
-- las postulaciones que quedaron pendientes pasan a rechazadas.
create or replace function cerrar_vacante_si_completa()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  aceptadas integer;
  cupos     smallint;
begin
  if new.estado <> 'aceptada' then
    return new;
  end if;

  select posiciones into cupos from vacantes where id = new.vacante_id;
  select count(*) into aceptadas
    from postulaciones
   where vacante_id = new.vacante_id and estado = 'aceptada';

  if aceptadas >= cupos then
    update vacantes
       set estado = 'cerrada', cerrada_en = now()
     where id = new.vacante_id and estado = 'activa';

    update postulaciones
       set estado = 'rechazada'
     where vacante_id = new.vacante_id
       and estado in ('pendiente', 'en_revision');
  end if;

  return new;
end;
$$;

create trigger postulaciones_cierran_vacante
  after update on postulaciones
  for each row execute function cerrar_vacante_si_completa();
