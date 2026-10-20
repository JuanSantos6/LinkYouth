-- ============================================================
-- 007 — Avisos para los dos lados y correos (cierre)
--
-- RF6.2  El aviso al joven cuando cambia su postulación dice, con
--        palabras, qué pasó: «Te seleccionaron», «No siguió adelante».
--        Enlaza a esa postulación, no a la lista entera.
-- RF6.1  La empresa recibe avisos: cuando alguien se postula a una de
--        sus búsquedas y cuando alguien se inscribe a uno de sus eventos.
--        Hasta ahora no recibía ninguno.
-- RF6.3  Correo por SMTP solo para lo importante: al joven cuando lo
--        seleccionan o lo descartan, y a la empresa cuando recibe una
--        postulación. Los demás avisos quedan solo en la página.
--
-- Por qué una cola y no mandar el correo desde la base: Postgres no
-- habla SMTP, y mandarlo desde el disparador ataría la escritura a que
-- Gmail responda. El disparador deja el correo en `correos_pendientes`,
-- en la misma transacción que el aviso (si la escritura se deshace, el
-- correo también), y la aplicación lo despacha después con la clave de
-- servicio (`src/lib/correo/`). Ver `docs/decisiones.md`, 2026-10-20.
--
-- Para bases creadas antes de esta migración. En una base nueva no hace
-- falta: `db/schema.sql` y `db/politicas.sql` ya traen todo esto.
--
-- Se ejecuta como `postgres`:
--   docker exec -i supabase-db psql -U postgres -d postgres \
--     -v ON_ERROR_STOP=1 < db/migraciones/007-avisos-y-correos.sql
--
-- Es idempotente y va entera en una transacción.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- Cola de correos
--
-- Nadie la lee ni la escribe desde la API: RLS activado y sin
-- políticas, y sin permisos para `anon` ni `authenticated`. La llenan
-- los disparadores (`security definer`) y la vacía la aplicación con
-- `service_role`, que saltea RLS. El destinatario va por `cuenta_id` y
-- no por dirección: el correo se busca en `auth.users` al despachar,
-- así un cambio de correo posterior se respeta y la tabla no guarda
-- direcciones.
-- ------------------------------------------------------------
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

alter table public.correos_pendientes enable row level security;
revoke all on public.correos_pendientes from public, anon, authenticated;
grant all on public.correos_pendientes to service_role;

-- Toma hasta `limite` correos sin enviar y los marca como reclamados, de
-- a uno por despacho: `for update skip locked` hace que dos despachos
-- simultáneos se repartan la cola en vez de mandar lo mismo. Un correo
-- reclamado hace más de 10 minutos y sin enviar se considera abandonado
-- (el proceso se cortó a mitad) y se vuelve a tomar. Después de 5
-- intentos se deja de reintentar.
create or replace function public.reclamar_correos_pendientes(limite int default 20)
returns setof public.correos_pendientes
language sql
security definer
set search_path = public, pg_temp
as $$
  update correos_pendientes c
  set reclamado_en = now(), intentos = c.intentos + 1
  where c.id in (
    select id from correos_pendientes
    where enviado_en is null
      and intentos < 5
      and (reclamado_en is null or reclamado_en < now() - interval '10 minutes')
    order by creado_en
    limit greatest(1, least(limite, 50))
    for update skip locked
  )
  returning c.*;
$$;

revoke all on function public.reclamar_correos_pendientes(int) from public, anon, authenticated;
grant execute on function public.reclamar_correos_pendientes(int) to service_role;

-- ------------------------------------------------------------
-- Avisar a una cuenta, y opcionalmente encolar el correo
--
-- Un solo lugar que escribe en `notificaciones`, para que el texto, el
-- enlace y el correo salgan siempre juntos. No se puede llamar desde la
-- API: solo la usan los disparadores de abajo.
-- ------------------------------------------------------------
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

revoke all on function public.avisar(uuid, text, text, text, text) from public, anon, authenticated;

-- ------------------------------------------------------------
-- RF6.2 — Al joven, cuando cambia su postulación
--
-- Nunca el valor crudo de la base. Seleccionada y descartada llevan
-- correo; revisión y entrevista quedan solo en la página. `cancelada`
-- no avisa: es la única transición que hace el propio joven.
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- RF6.1 — A la empresa, cuando alguien se postula
-- ------------------------------------------------------------
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

drop trigger if exists postulaciones_notificar_recibida on public.postulaciones;
create trigger postulaciones_notificar_recibida
after insert on public.postulaciones
for each row execute function public.notificar_postulacion_recibida();

-- ------------------------------------------------------------
-- RF6.1 — A la empresa, cuando alguien se inscribe a un evento suyo
-- (sin correo: es un aviso menor)
-- ------------------------------------------------------------
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

drop trigger if exists inscripciones_notificar_recibida on public.inscripciones_evento;
create trigger inscripciones_notificar_recibida
after insert on public.inscripciones_evento
for each row execute function public.notificar_inscripcion_recibida();

-- ------------------------------------------------------------
-- RF4.3.2 — Cancelación de evento: mismo texto, ahora por `avisar` y
-- con enlace al evento (el detalle lo muestra cancelado).
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Los avisos viejos llevaban el enlace a la lista entera y el tipo
-- genérico. Se dejan como están: el texto ya era legible desde la 005,
-- y reescribir avisos que la persona ya leyó cambiaría lo que vio.
-- ------------------------------------------------------------

commit;
