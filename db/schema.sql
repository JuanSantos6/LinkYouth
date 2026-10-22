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
  -- RUT del contribuyente. `unique` y no `not null`: las empresas dadas de
  -- alta antes de que existiera la columna no lo tienen, y no hay ningún
  -- valor razonable que inventarles. El formato lo valida la aplicación,
  -- no un `check`: doce dígitos es la forma uruguaya y la plataforma no
  -- descarta abrirse a otros países.
  rut            text unique,
  rubro          text not null,
  descripcion    text,
  logo_url       text,
  -- Foto de cabecera del perfil público (migración 008): una URL de
  -- Unsplash registrada en `fotos`. Sin ella, la de su rubro.
  portada_url    text,
  -- Sitio web de la empresa (migración 005). La forma la valida también la
  -- aplicación; acá se garantiza que sea una dirección http o https.
  sitio_web      text check (
    sitio_web is null or sitio_web ~* '^https?://[^[:space:]]+\.[^[:space:]]+$'
  ),
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
-- MÓDULO: Personalidad declarada (migración 009)
-- El resultado del test de 16Personalities que el joven carga a mano: el
-- sitio no tiene API. LinkYouth no lo valida y no lo usa para la
-- compatibilidad, los filtros ni el orden de los candidatos. Tabla aparte de
-- `perfiles` para que la visibilidad sea una política (ver politicas.sql).
-- El nombre del tipo se deriva del código, no se guarda.
-- ============================================================

create table perfil_personalidad (
  perfil_id              uuid primary key references perfiles(id) on delete cascade,
  -- Uno de los 16 tipos con su variante: INTJ-A, ENFP-T…
  tipo                   text not null
                         check (tipo ~ '^[EI][SN][TF][JP]-[AT]$'),
  -- La pone el disparador de abajo: al cargar y cada vez que cambia el tipo.
  cargada_en             timestamptz not null default now(),
  -- Por defecto, no: el joven decide mostrarlo.
  visible_para_empresas  boolean not null default false
);

-- La fecha de carga no la elige quien escribe: se pone al insertar y al
-- cambiar el tipo, y no se mueve si solo cambia la visibilidad.
create or replace function personalidad_fecha_de_carga()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' or new.tipo is distinct from old.tipo then
    new.cargada_en := now();
  else
    new.cargada_en := old.cargada_en;
  end if;
  return new;
end;
$$;

create trigger perfil_personalidad_fecha_de_carga
before insert or update on perfil_personalidad
for each row execute function personalidad_fecha_de_carga();

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
  -- `pausada` (migración 005): sigue siendo de la empresa pero no se ve ni
  -- recibe postulaciones. Las políticas que piden `estado = 'activa'` ya lo
  -- resuelven solas.
  estado       text not null default 'activa' check (estado in ('activa', 'pausada', 'cerrada')),
  -- Opcionales a nivel base: las búsquedas anteriores a la migración 005 no
  -- las tienen. El formulario las pide siempre.
  modalidad    text check (modalidad is null or modalidad in ('presencial', 'remota', 'hibrida')),
  ubicacion    text,
  creada_en    timestamptz not null default now()
);

-- RF3.1.2: el título no se repite entre las búsquedas activas de la misma
-- empresa. En la base y no en la aplicación: dos formularios mandados a la
-- vez pasarían los dos un control previo.
create unique index vacantes_titulo_unico_entre_activas
  on vacantes (empresa_id, lower(btrim(titulo)))
  where estado = 'activa';

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

-- Habilidades ocultas (migración 008, RF3.1.6): la empresa marca cada
-- habilidad que pide como pública u oculta. Tabla aparte por lo mismo que
-- los tags ocultos: `vacante_habilidades` se lee sin sesión, y RLS decide
-- filas, no columnas.
create table vacante_habilidades_ocultas (
  vacante_id    uuid not null references vacantes(id) on delete cascade,
  habilidad_id  uuid not null references habilidades(id) on delete cascade,
  primary key (vacante_id, habilidad_id)
);

create table postulaciones (
  id             uuid primary key default gen_random_uuid(),
  vacante_id     uuid not null references vacantes(id) on delete cascade,
  perfil_id      uuid not null references perfiles(id) on delete cascade,
  estado         text not null default 'pendiente'
                 -- `entrevista` (migración 005) no es final. La empresa ve estos
                 -- valores como Nueva, En revisión, Entrevista, Seleccionada y
                 -- Descartada (ver EstadoParaEmpresa en src/lib/dominio/).
                 check (estado in ('pendiente', 'en_revision', 'entrevista', 'aceptada', 'rechazada', 'cancelada')),
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
  estado       text not null default 'activo' check (estado in ('activo', 'cancelado')),
  -- Dirección y coordenadas (migración 005). La interfaz enlaza a
  -- OpenStreetMap; las coordenadas quedan para el mapa de eventos del joven.
  direccion    text,
  latitud      numeric(9, 6),
  longitud     numeric(9, 6),
  constraint eventos_coordenadas_check check (
    (latitud is null and longitud is null)
    or (latitud between -90 and 90 and longitud between -180 and 180)
  )
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
-- MÓDULO: Fotos de Unsplash (migración 008)
-- Se muestran con la URL que devuelve la API (hotlink), como piden sus
-- directrices. `fotos` guarda la atribución de cada URL; la URL vive en la
-- columna de quien la usa (`perfiles.foto_url`, `empresas.portada_url`,
-- `eventos.imagen_url`) o, para los lugares fijos de la página, en
-- `lugares_con_foto`. Las elige `scripts/fotos/` una sola vez.
-- ============================================================

create table fotos (
  -- `urls.raw` de la API, sin parámetros de tamaño.
  url             text primary key check (url like 'https://images.unsplash.com/%'),
  unsplash_id     text not null unique,
  autor           text not null,
  autor_enlace    text not null check (autor_enlace like 'https://unsplash.com/%'),
  enlace          text not null check (enlace like 'https://unsplash.com/%'),
  descripcion     text not null,
  ancho           int not null check (ancho > 0),
  alto            int not null check (alto > 0),
  color           text check (color is null or color ~ '^#[0-9a-fA-F]{6}$'),
  -- Cuándo se avisó a `download_location`, como pide Unsplash al usarla.
  descarga_avisada_en timestamptz,
  creada_en       timestamptz not null default now()
);

-- `portada:bienvenida`, `vacio:postulaciones`, `rubro:tecnologia`,
-- `institucion:udelar`…
create table lugares_con_foto (
  lugar  text primary key check (lugar ~ '^[a-z]+:[a-z0-9-]+$'),
  url    text not null references fotos(url) on update cascade
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

-- Cola de correos (migración 007, RF6.3). Los disparadores dejan acá el
-- correo de los avisos importantes, en la misma transacción que el aviso, y
-- la aplicación lo despacha por SMTP con la clave de servicio
-- (`src/lib/correo/`). Nadie la lee desde la API: ver politicas.sql. El
-- destinatario va por `cuenta_id`: la dirección se busca en `auth.users` al
-- despachar.
create table if not exists public.correos_pendientes (
  id              uuid primary key default gen_random_uuid(),
  cuenta_id       uuid not null references public.cuentas(id) on delete cascade,
  notificacion_id uuid references public.notificaciones(id) on delete set null,
  asunto          text not null,
  mensaje         text not null,
  enlace          text,
  creado_en       timestamptz not null default now(),
  -- Quién lo tomó para mandarlo, así dos despachos a la vez no lo
  -- mandan dos veces (ver `reclamar_correos_pendientes`).
  reclamado_en    timestamptz,
  enviado_en      timestamptz,
  intentos        int not null default 0,
  ultimo_error    text
);

create index if not exists idx_correos_pendientes_sin_enviar
  on public.correos_pendientes (creado_en) where enviado_en is null;

-- Un solo lugar que escribe en `notificaciones` (migración 007): el texto, el
-- enlace y el correo salen siempre juntos. Con `asunto`, además encola el
-- correo. Corre con permisos elevados porque escribe en la cuenta de otro; no
-- se puede llamar desde la API (ver politicas.sql).
create or replace function public.avisar(
  destino     uuid,
  tipo_aviso  text,
  texto       text,
  destino_url text,
  asunto      text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
begin
  insert into notificaciones (cuenta_id, tipo, mensaje, enlace)
  values (destino, tipo_aviso, texto, destino_url)
  returning id into v_id;

  if asunto is not null then
    insert into correos_pendientes (cuenta_id, notificacion_id, asunto, mensaje, enlace)
    values (destino, v_id, asunto, texto, destino_url);
  end if;
end;
$$;

-- RF6.2 — Al joven, cuando una empresa cambia el estado de su postulación.
-- Con palabras y nombrando la búsqueda y la empresa, nunca el valor crudo de
-- la base, y con enlace a esa postulación. Seleccionada y descartada llevan
-- correo; revisión y entrevista quedan solo en la página. 'cancelada' no
-- avisa: es la única transición que hace el propio postulante (ver
-- politicas.sql), y sería avisarle de su propia acción.
create or replace function public.notificar_cambio_estado_postulacion()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_titulo  text;
  v_empresa text;
  v_texto   text;
  v_tipo    text;
  v_asunto  text;
begin
  if new.estado is not distinct from old.estado or new.estado = 'cancelada' then
    return new;
  end if;

  select v.titulo, e.razon_social into v_titulo, v_empresa
  from vacantes v join empresas e on e.id = v.empresa_id
  where v.id = new.vacante_id;
  v_titulo := '«' || coalesce(v_titulo, 'una búsqueda') || '»';
  v_empresa := coalesce(v_empresa, 'la empresa');

  case new.estado
    when 'en_revision' then
      v_tipo := 'postulacion_en_revision';
      v_texto := v_empresa || ' está revisando tu postulación a ' || v_titulo || '.';
    when 'entrevista' then
      v_tipo := 'postulacion_entrevista';
      v_texto := v_empresa || ' quiere conocerte: tu postulación a ' || v_titulo
        || ' pasó a la etapa de entrevista.';
    when 'aceptada' then
      v_tipo := 'postulacion_seleccionada';
      v_texto := 'Te seleccionaron en ' || v_empresa || ' para ' || v_titulo
        || '. La empresa se va a comunicar con vos para los próximos pasos.';
      v_asunto := 'Te seleccionaron para ' || v_titulo;
    when 'rechazada' then
      v_tipo := 'postulacion_descartada';
      v_texto := 'Tu postulación a ' || v_titulo || ' en ' || v_empresa
        || ' no siguió adelante. Gracias por postularte: hay más búsquedas esperándote.';
      v_asunto := 'Novedades sobre tu postulación a ' || v_titulo;
    else
      v_tipo := 'postulacion';
      v_texto := 'Tu postulación a ' || v_titulo || ' cambió de estado.';
  end case;

  perform avisar(
    new.perfil_id, v_tipo, v_texto,
    '/postulaciones#postulacion-' || new.id,
    v_asunto
  );
  return new;
end;
$$;

create trigger postulaciones_notificar_cambio
after update on postulaciones
for each row execute function notificar_cambio_estado_postulacion();

-- RF6.1 — A la empresa, cuando alguien se postula a una de sus búsquedas
-- (migración 007). Lleva correo.
create or replace function public.notificar_postulacion_recibida()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_empresa uuid;
  v_titulo  text;
  v_persona text;
begin
  select v.empresa_id, v.titulo into v_empresa, v_titulo
  from vacantes v where v.id = new.vacante_id;
  if v_empresa is null then
    return null;
  end if;

  select trim(p.nombre || ' ' || p.apellido) into v_persona
  from perfiles p where p.id = new.perfil_id;
  v_persona := coalesce(nullif(v_persona, ''), 'Una persona');

  perform avisar(
    v_empresa,
    'postulacion_recibida',
    v_persona || ' se postuló a «' || v_titulo || '».',
    '/empresa/busquedas/' || new.vacante_id || '/postulantes/' || new.id,
    'Nueva postulación a «' || v_titulo || '»'
  );
  return null;
end;
$$;

create trigger postulaciones_notificar_recibida
after insert on public.postulaciones
for each row execute function public.notificar_postulacion_recibida();

-- RF6.1 — A la empresa, cuando alguien se inscribe a uno de sus eventos
-- (migración 007). Sin correo: es un aviso menor.
create or replace function public.notificar_inscripcion_recibida()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_empresa uuid;
  v_titulo  text;
  v_persona text;
begin
  select e.empresa_id, e.titulo into v_empresa, v_titulo
  from eventos e where e.id = new.evento_id;
  if v_empresa is null then
    return null;
  end if;

  select trim(p.nombre || ' ' || p.apellido) into v_persona
  from perfiles p where p.id = new.perfil_id;
  v_persona := coalesce(nullif(v_persona, ''), 'Una persona');

  perform avisar(
    v_empresa,
    'inscripcion_recibida',
    v_persona || ' se inscribió a «' || v_titulo || '».',
    '/empresa/eventos/' || new.evento_id,
    null
  );
  return null;
end;
$$;

create trigger inscripciones_notificar_recibida
after insert on public.inscripciones_evento
for each row execute function public.notificar_inscripcion_recibida();

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

-- Desde el 2026-10-06 (H6 y H13, migración 003) expone solo lo que usa el
-- registro: `id` y `nombre_usuario`. Antes llevaba nombre, apellido, país,
-- bio y foto, que cualquiera podía descargar sin sesión. Y como la vista es
-- actualizable y su dueño saltea RLS, los privilegios por defecto de
-- Supabase (todos, para `anon` y `authenticated`) dejaban modificar perfiles
-- ajenos sin sesión: por eso el `revoke all` antes del `grant select`.
create view perfiles_publicos
  with (security_barrier = true)
as
select id, nombre_usuario
from perfiles
where cuenta_activa(id);

revoke all on perfiles_publicos from public, anon, authenticated;
grant select on perfiles_publicos to anon, authenticated;

-- Institución y título de todas las formaciones, sin `perfil_id`: la ficha de
-- institución agrupa las de todos y `formaciones` ya no se lee entera (H1).
-- Solo con sesión. Misma razón para el `revoke all`.
create view formaciones_publicas
  with (security_barrier = true)
as
select institucion, titulo
from formaciones;

revoke all on formaciones_publicas from public, anon, authenticated;
grant select on formaciones_publicas to authenticated;

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
create index if not exists idx_vacante_habilidades_ocultas_habilidad
  on vacante_habilidades_ocultas (habilidad_id);
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


-- ============================================================
-- MÓDULO: Ciclo de vida de búsquedas y eventos (migración 005)
-- Reglas que tienen que valer aunque la acción no venga de la app.
-- ============================================================

-- RF3.3.2: la búsqueda se cierra sola al cubrir sus posiciones.
create or replace function cerrar_vacante_al_cubrir_posiciones()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.estado = 'aceptada' and old.estado is distinct from 'aceptada' then
    update vacantes v
    set estado = 'cerrada'
    where v.id = new.vacante_id
      and v.estado <> 'cerrada'
      and (
        select count(*) from postulaciones p
        where p.vacante_id = v.id and p.estado = 'aceptada'
      ) >= v.posiciones;
  end if;
  return null;
end;
$$;

create trigger postulaciones_cerrar_vacante_al_cubrir
after update of estado on postulaciones
for each row execute function cerrar_vacante_al_cubrir_posiciones();

-- RF3.3.3: al cerrar una búsqueda, las postulaciones pendientes pasan a
-- rechazada. Solo las `pendiente`, como dice el requisito: quien está en
-- revisión o en entrevista sigue en proceso.
create or replace function rechazar_pendientes_al_cerrar()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.estado = 'cerrada' and old.estado is distinct from 'cerrada' then
    update postulaciones
    set estado = 'rechazada'
    where vacante_id = new.id and estado = 'pendiente';
  end if;
  return null;
end;
$$;

create trigger vacantes_rechazar_pendientes_al_cerrar
after update of estado on vacantes
for each row execute function rechazar_pendientes_al_cerrar();

-- RF4.3.2: cancelar un evento avisa a quienes se inscribieron.
create or replace function public.notificar_cancelacion_evento()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_inscripto uuid;
begin
  if new.estado = 'cancelado' and old.estado is distinct from 'cancelado' then
    for v_inscripto in
      select i.perfil_id from inscripciones_evento i where i.evento_id = new.id
    loop
      perform avisar(
        v_inscripto, 'evento_cancelado',
        'Se canceló el evento «' || new.titulo || '».',
        '/eventos', null
      );
    end loop;
  end if;
  return null;
end;
$$;

create trigger eventos_notificar_cancelacion
after update of estado on eventos
for each row execute function notificar_cancelacion_evento();
