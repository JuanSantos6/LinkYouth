-- ============================================================
-- LinkYouth — Base de datos básica (primera entrega)
--
-- Versión simplificada de db/schema.sql para presentar: solo las tablas
-- principales, con sus claves y restricciones. Sin datos de prueba, sin
-- políticas de seguridad (RLS), sin funciones ni disparadores.
--
-- Se puede ejecutar en cualquier PostgreSQL 13 o superior.
-- ============================================================


-- ------------------------------------------------------------
-- Cuentas y perfiles
-- ------------------------------------------------------------

-- Toda cuenta del sistema: una persona joven o una empresa.
-- (En el proyecto real, el `id` lo genera el sistema de autenticación.)
create table cuentas (
  id         uuid primary key default gen_random_uuid(),
  tipo       text not null check (tipo in ('individual', 'empresa')),
  creada_en  timestamptz not null default now()
);

-- Datos públicos de la persona joven que busca trabajo.
create table perfiles (
  id                uuid primary key references cuentas(id) on delete cascade,
  nombre_usuario    text not null unique,
  nombre            text not null,
  apellido          text not null,
  fecha_nacimiento  date not null,
  pais              text not null,
  bio               text,
  foto_url          text,
  creado_en         timestamptz not null default now(),
  -- Solo mayores de 18 años.
  constraint perfiles_mayor_de_edad
    check (fecha_nacimiento <= current_date - interval '18 years')
);

-- Datos de la organización que publica búsquedas y eventos.
create table empresas (
  id            uuid primary key references cuentas(id) on delete cascade,
  razon_social  text not null unique,
  rut           text unique,  -- RUT único: no puede haber dos empresas con el mismo
  rubro         text not null,
  descripcion   text,
  logo_url      text,
  creada_en     timestamptz not null default now()
);


-- ------------------------------------------------------------
-- Catálogos (listas cerradas, las carga el equipo)
-- ------------------------------------------------------------

-- Intereses: «Desarrollo web», «Datos», «Atención al cliente»…
create table tags (
  id      uuid primary key default gen_random_uuid(),
  nombre  text not null unique
);

-- Conocimientos: «HTML y CSS», «SQL», «Trabajo en equipo»…
create table habilidades (
  id      uuid primary key default gen_random_uuid(),
  nombre  text not null unique
);

-- Qué intereses eligió cada perfil (relación muchos a muchos).
create table perfil_tags (
  perfil_id  uuid not null references perfiles(id) on delete cascade,
  tag_id     uuid not null references tags(id) on delete cascade,
  primary key (perfil_id, tag_id)
);

-- Qué habilidades declaró cada perfil (relación muchos a muchos).
create table perfil_habilidades (
  perfil_id     uuid not null references perfiles(id) on delete cascade,
  habilidad_id  uuid not null references habilidades(id) on delete cascade,
  primary key (perfil_id, habilidad_id)
);


-- ------------------------------------------------------------
-- Vacantes y postulaciones
-- ------------------------------------------------------------

-- Una búsqueda publicada por una empresa: empleo o pasantía.
create table vacantes (
  id           uuid primary key default gen_random_uuid(),
  empresa_id   uuid not null references empresas(id) on delete cascade,
  titulo       text not null,
  descripcion  text not null,
  tipo         text not null check (tipo in ('empleo', 'pasantia')),
  posiciones   int  not null check (posiciones > 0),
  estado       text not null default 'activa' check (estado in ('activa', 'cerrada')),
  creada_en    timestamptz not null default now()
);

-- Qué habilidades pide cada vacante (relación muchos a muchos).
create table vacante_habilidades (
  vacante_id    uuid not null references vacantes(id) on delete cascade,
  habilidad_id  uuid not null references habilidades(id) on delete cascade,
  primary key (vacante_id, habilidad_id)
);

-- A qué intereses apunta cada vacante (relación muchos a muchos).
create table vacante_tags_publicos (
  vacante_id  uuid not null references vacantes(id) on delete cascade,
  tag_id      uuid not null references tags(id) on delete cascade,
  primary key (vacante_id, tag_id)
);

-- Una persona se postula a una vacante. El estado cuenta en qué etapa está.
create table postulaciones (
  id              uuid primary key default gen_random_uuid(),
  vacante_id      uuid not null references vacantes(id) on delete cascade,
  perfil_id       uuid not null references perfiles(id) on delete cascade,
  estado          text not null default 'pendiente'
                  check (estado in ('pendiente', 'en_revision', 'aceptada', 'rechazada', 'cancelada')),
  creada_en       timestamptz not null default now(),
  actualizada_en  timestamptz not null default now(),
  -- Nadie se postula dos veces a la misma vacante.
  unique (vacante_id, perfil_id)
);


-- ------------------------------------------------------------
-- Eventos
-- ------------------------------------------------------------

-- Talleres y charlas que organiza una empresa o institución.
create table eventos (
  id           uuid primary key default gen_random_uuid(),
  empresa_id   uuid not null references empresas(id) on delete cascade,
  titulo       text not null,
  descripcion  text not null,
  fecha_hora   timestamptz not null,
  imagen_url   text,
  estado       text not null default 'activo' check (estado in ('activo', 'cancelado'))
);

-- Quién se anotó a cada evento. La clave doble impide anotarse dos veces.
create table inscripciones_evento (
  evento_id  uuid not null references eventos(id) on delete cascade,
  perfil_id  uuid not null references perfiles(id) on delete cascade,
  creada_en  timestamptz not null default now(),
  primary key (evento_id, perfil_id)
);
