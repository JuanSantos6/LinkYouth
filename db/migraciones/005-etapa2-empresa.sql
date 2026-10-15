-- ============================================================
-- 005 — Etapa 2: el lado de la empresa
--
-- Agrega lo que el esquema no tenía para que una empresa publique y
-- gestione búsquedas y eventos, y cierra dos huecos de seguridad que
-- aparecieron al diseñarlo.
--
-- Para bases creadas antes de esta migración. En una base nueva no hace
-- falta: `db/schema.sql` y `db/politicas.sql` ya traen todo esto.
--
-- Se ejecuta en Supabase Dashboard > SQL Editor, como `postgres`.
--
-- Es idempotente: cada `add column` lleva `if not exists`, cada
-- restricción y cada política se borra antes de crearse, y las funciones
-- son `create or replace`. Correrla dos veces deja la base igual que
-- correrla una.
--
-- Va entera en una transacción: si algo falla, no queda nada a medio
-- aplicar.
--
-- ANTES DE CORRERLA, en el servidor: el índice de la sección 1 no se puede
-- crear si ya hay dos búsquedas activas con el mismo título en la misma
-- empresa. Esta consulta tiene que volver vacía:
--
--   select empresa_id, lower(btrim(titulo)), count(*)
--   from vacantes where estado = 'activa'
--   group by 1, 2 having count(*) > 1;
--
-- Decisiones y alternativas: docs/decisiones.md, 2026-10-15.
-- ============================================================

begin;

-- ============================================================
-- 1. Búsquedas (vacantes): modalidad, ubicación, pausa y título único
-- ============================================================

-- Las dos columnas son opcionales a nivel base porque las búsquedas que ya
-- existen no las tienen, y no hay ningún valor razonable que inventarles.
-- El formulario las pide siempre para las nuevas.
alter table vacantes add column if not exists modalidad text;
alter table vacantes add column if not exists ubicacion text;

alter table vacantes drop constraint if exists vacantes_modalidad_check;
alter table vacantes add constraint vacantes_modalidad_check
  check (modalidad is null or modalidad in ('presencial', 'remota', 'hibrida'));

-- `pausada`: la búsqueda sigue siendo de la empresa pero deja de verse y de
-- aceptar postulaciones. Las dos cosas las resuelven solas las políticas que
-- ya existen, porque piden `estado = 'activa'`.
alter table vacantes drop constraint if exists vacantes_estado_check;
alter table vacantes add constraint vacantes_estado_check
  check (estado in ('activa', 'pausada', 'cerrada'));

-- RF3.1.2: el título no se repite entre las búsquedas activas de la misma
-- empresa. Un índice parcial y no una verificación en la aplicación: dos
-- formularios mandados al mismo tiempo pasarían los dos un control previo.
create unique index if not exists vacantes_titulo_unico_entre_activas
  on vacantes (empresa_id, lower(btrim(titulo)))
  where estado = 'activa';

-- Borrar una búsqueda solo si nadie se postuló. `postulaciones` borra en
-- cascada desde `vacantes`, y las postulaciones no se borran nunca
-- (CLAUDE.md): con postulaciones, la búsqueda solo se puede cerrar.
--
-- `vacantes.id` va calificado a propósito: dentro de la subconsulta, un `id`
-- suelto sería el de `postulaciones`, y la condición quedaría siempre falsa.
drop policy if exists "vacantes_borro_las_mias_sin_postulaciones" on vacantes;

create policy "vacantes_borro_las_mias_sin_postulaciones"
on vacantes for delete
to authenticated
using (
  empresa_id = (select auth.uid())
  and not exists (
    select 1 from postulaciones p where p.vacante_id = vacantes.id
  )
);

-- ============================================================
-- 2. Postulaciones: el estado «entrevista»
--
-- La empresa nombra los estados como Nueva, En revisión, Entrevista,
-- Descartada y Seleccionada. En la base siguen siendo los de siempre
-- (`pendiente`, `en_revision`, `rechazada`, `aceptada`) y solo se agrega
-- `entrevista`, que no es final: después puede pasar a cualquiera de los
-- dos estados finales de la empresa.
-- ============================================================

alter table postulaciones drop constraint if exists postulaciones_estado_check;
alter table postulaciones add constraint postulaciones_estado_check
  check (estado in (
    'pendiente', 'en_revision', 'entrevista', 'aceptada', 'rechazada', 'cancelada'
  ));

drop policy if exists "postulaciones_transiciones_permitidas" on postulaciones;

create policy "postulaciones_transiciones_permitidas"
on postulaciones for update
to authenticated
using (
  perfil_id = auth.uid()
  or exists (select 1 from vacantes v where v.id = vacante_id and v.empresa_id = auth.uid())
)
with check (
  (perfil_id = auth.uid() and estado = 'cancelada')
  or (
    exists (select 1 from vacantes v where v.id = vacante_id and v.empresa_id = auth.uid())
    and estado in ('en_revision', 'entrevista', 'aceptada', 'rechazada')
  )
);

-- ============================================================
-- 3. Eventos: dirección y coordenadas
--
-- La interfaz muestra un enlace «Ver en el mapa» a OpenStreetMap, sin mapa
-- embebido. Las coordenadas se guardan igual para poder armar más adelante
-- el mapa de eventos del lado del joven sin volver a pedírselas a nadie.
-- ============================================================

alter table eventos add column if not exists direccion text;
alter table eventos add column if not exists latitud numeric(9, 6);
alter table eventos add column if not exists longitud numeric(9, 6);

alter table eventos drop constraint if exists eventos_coordenadas_check;
alter table eventos add constraint eventos_coordenadas_check check (
  (latitud is null and longitud is null)
  or (latitud between -90 and 90 and longitud between -180 and 180)
);

-- Inscribirse solo a un evento activo y que todavía no pasó. Antes la
-- política solo miraba quién se inscribía: con el id de un evento cancelado
-- o vencido, la inscripción entraba igual por la API.
drop policy if exists "inscripciones_me_inscribo_yo" on inscripciones_evento;

create policy "inscripciones_me_inscribo_yo"
on inscripciones_evento for insert
to authenticated
with check (
  perfil_id = auth.uid()
  and exists (select 1 from perfiles where id = auth.uid())
  and exists (
    select 1 from eventos e
    where e.id = evento_id and e.estado = 'activo' and e.fecha_hora > now()
  )
);

-- ============================================================
-- 4. Empresas: sitio web
-- ============================================================

alter table empresas add column if not exists sitio_web text;

alter table empresas drop constraint if exists empresas_sitio_web_check;
alter table empresas add constraint empresas_sitio_web_check
  check (sitio_web is null or sitio_web ~* '^https?://[^[:space:]]+\.[^[:space:]]+$');

-- ============================================================
-- 5. Quién se postuló o se inscribió: los datos que ve la empresa
--
-- `perfiles` solo deja leer la fila propia, y `perfiles_publicos` expone
-- únicamente `id` y `nombre_usuario` (H6, H13). Sin esto, una empresa ve que
-- alguien se postuló pero no sabe quién es.
--
-- Una política nueva sobre `perfiles` no sirve: RLS decide filas, no
-- columnas, y abriría también `fecha_nacimiento`. Esta función devuelve la
-- lista exacta de columnas que una empresa necesita, y solo de quienes se
-- postularon a una de sus búsquedas (sin haber cancelado) o se inscribieron
-- a uno de sus eventos.
--
-- `security definer` para poder leer `perfiles` pasando por encima de su RLS;
-- por eso la condición sobre la empresa está escrita adentro y no confía en
-- ninguna otra política. Con `anon` no se puede llamar.
-- ============================================================

create or replace function public.candidatos_de_mi_empresa(ids uuid[])
returns table (
  id uuid,
  nombre_usuario text,
  nombre text,
  apellido text,
  pais text,
  bio text,
  foto_url text
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.nombre_usuario, p.nombre, p.apellido, p.pais, p.bio, p.foto_url
  from public.perfiles p
  where p.id = any (ids)
    and public.cuenta_activa(p.id)
    and (
      exists (
        select 1
        from public.postulaciones po
        join public.vacantes v on v.id = po.vacante_id
        where po.perfil_id = p.id
          and v.empresa_id = (select auth.uid())
          and po.estado <> 'cancelada'
      )
      or exists (
        select 1
        from public.inscripciones_evento i
        join public.eventos e on e.id = i.evento_id
        where i.perfil_id = p.id
          and e.empresa_id = (select auth.uid())
      )
    );
$$;

revoke all on function public.candidatos_de_mi_empresa(uuid[]) from public, anon;
grant execute on function public.candidatos_de_mi_empresa(uuid[]) to authenticated;

-- ============================================================
-- 6. Aviso al joven cuando cambia su postulación (RF6.2)
--
-- Antes enlazaba a `/postulaciones/<id>`, una ruta que no existe, y mostraba
-- el valor crudo de la base («cambió a: en_revision»). Ahora nombra la
-- búsqueda y dice el estado con palabras.
-- ============================================================

create or replace function notificar_cambio_estado_postulacion()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_titulo text;
  v_estado text;
begin
  -- 'cancelada' es la única transición que hace el propio postulante: avisarle
  -- sería contarle su propia acción.
  if new.estado is distinct from old.estado and new.estado <> 'cancelada' then
    select titulo into v_titulo from vacantes where id = new.vacante_id;

    v_estado := case new.estado
      when 'en_revision' then 'está en revisión'
      when 'entrevista'  then 'pasó a la etapa de entrevista'
      when 'aceptada'    then 'fue aceptada'
      when 'rechazada'   then 'no fue seleccionada'
      else 'cambió de estado'
    end;

    insert into notificaciones (cuenta_id, tipo, mensaje, enlace)
    values (
      new.perfil_id,
      'postulacion',
      'Tu postulación a «' || coalesce(v_titulo, 'una búsqueda') || '» ' || v_estado || '.',
      '/postulaciones'
    );
  end if;
  return new;
end;
$$;

-- ============================================================
-- 7. RF3.3.2: la búsqueda se cierra sola al cubrir sus posiciones
-- ============================================================

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

drop trigger if exists postulaciones_cerrar_vacante_al_cubrir on postulaciones;

create trigger postulaciones_cerrar_vacante_al_cubrir
after update of estado on postulaciones
for each row execute function cerrar_vacante_al_cubrir_posiciones();

-- ============================================================
-- 8. RF3.3.3: al cerrar una búsqueda, las postulaciones pendientes pasan a
-- rechazada
--
-- Solo las `pendiente`, como dice el requisito: quien está en revisión o en
-- entrevista sigue en proceso aunque la búsqueda ya no reciba gente nueva.
-- Cada cambio dispara el aviso de la sección 6, así que nadie queda
-- esperando una respuesta que no va a llegar.
-- ============================================================

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

drop trigger if exists vacantes_rechazar_pendientes_al_cerrar on vacantes;

create trigger vacantes_rechazar_pendientes_al_cerrar
after update of estado on vacantes
for each row execute function rechazar_pendientes_al_cerrar();

-- ============================================================
-- 9. RF4.3.2: cancelar un evento avisa a quienes se inscribieron
--
-- `notificaciones` no tiene política de insert: los avisos los crean
-- disparadores con `security definer`, nunca el cliente.
-- ============================================================

create or replace function notificar_cancelacion_evento()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.estado = 'cancelado' and old.estado is distinct from 'cancelado' then
    insert into notificaciones (cuenta_id, tipo, mensaje, enlace)
    select i.perfil_id,
           'evento',
           'Se canceló el evento «' || new.titulo || '».',
           '/eventos'
    from inscripciones_evento i
    where i.evento_id = new.id;
  end if;
  return null;
end;
$$;

drop trigger if exists eventos_notificar_cancelacion on eventos;

create trigger eventos_notificar_cancelacion
after update of estado on eventos
for each row execute function notificar_cancelacion_evento();

commit;
