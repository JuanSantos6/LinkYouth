-- ============================================================
-- 006 — Cuenta y perfil público (Nivel 2 del cierre)
--
-- RF8.2  Reseñas de una empresa en su perfil público, sin quién las
--        escribió.
-- RF2.5  Perfil público de una persona: nombre de usuario, foto,
--        biografía e intereses (RF2.1.1), y nada más.
-- RF1.7  Eliminar la cuenta anonimizando: se borran los datos
--        personales y se conservan postulaciones y reseñas sin nada que
--        identifique a nadie (nunca se borran filas de esas tablas).
-- RF6.1  Los avisos solo admiten cambiar `leida`.
--
-- Para bases creadas antes de esta migración. En una base nueva no hace
-- falta: `db/schema.sql` y `db/politicas.sql` ya traen todo esto.
--
-- Se ejecuta como `postgres`:
--   docker exec -i supabase-db psql -U postgres -d postgres \
--     -v ON_ERROR_STOP=1 < db/migraciones/006-cuenta-y-perfil-publico.sql
--
-- Es idempotente (`create or replace`, `revoke`/`grant`) y va entera en
-- una transacción.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- RF8.2 — Reseñas públicas de una empresa
--
-- Una función y no una política de `select` abierta: la fila de
-- `resenias` lleva `perfil_id`, y abrirla le diría a cualquiera quién
-- escribió cada reseña. Mismo criterio que `candidatos_de_mi_empresa`.
-- ------------------------------------------------------------
create or replace function public.resenias_de_empresa(empresa uuid)
returns table (
  id           uuid,
  calificacion int,
  comentario   text,
  creada_en    timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select r.id, r.calificacion, r.comentario, r.creada_en
  from resenias r
  where r.empresa_id = empresa
    and cuenta_activa(empresa)
  order by r.creada_en desc;
$$;

revoke all on function public.resenias_de_empresa(uuid) from public;
grant execute on function public.resenias_de_empresa(uuid) to anon, authenticated;

-- ------------------------------------------------------------
-- RF2.5 — Perfil público de una persona
--
-- Solo con sesión: el perfil de un joven no se raspa sin cuenta (CN-002).
-- Devuelve lo que RF2.1.1 llama datos públicos. Nombre, apellido, fecha de
-- nacimiento y país quedan afuera (H1).
-- ------------------------------------------------------------
create or replace function public.perfil_publico(usuario text)
returns table (
  id             uuid,
  nombre_usuario text,
  foto_url       text,
  bio            text,
  tags           text[]
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.id, p.nombre_usuario, p.foto_url, p.bio,
         coalesce(
           array(
             select t.nombre from perfil_tags pt
             join tags t on t.id = pt.tag_id
             where pt.perfil_id = p.id
             order by t.nombre
           ),
           '{}'
         )
  from perfiles p
  where p.nombre_usuario = usuario
    and cuenta_activa(p.id);
$$;

revoke all on function public.perfil_publico(text) from public, anon;
grant execute on function public.perfil_publico(text) to authenticated;

-- ------------------------------------------------------------
-- RF1.7 — Anonimizar la cuenta de quien la pide
--
-- Lo que hace la base, en una transacción. La parte de `auth.users`
-- (correo, contraseña, bloqueo) la hace la aplicación con la API de
-- administración de GoTrue, que es la dueña de ese esquema.
--
-- Postulante: datos del perfil fuera; intereses, habilidades, formación,
-- inscripciones y avisos borrados; postulaciones en curso pasan a
-- `cancelada` (la empresa deja de ver a alguien que ya no existe). Las
-- reseñas quedan: nunca tuvieron nombre.
-- Empresa: datos de la empresa fuera; búsquedas activas o pausadas pasan a
-- `cerrada` (el disparador de RF3.3.3 rechaza las pendientes y avisa);
-- eventos futuros activos pasan a `cancelado` (el de RF4.3.2 avisa).
-- ------------------------------------------------------------
create or replace function public.eliminar_mi_cuenta()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  yo     uuid := auth.uid();
  sufijo text;
begin
  if yo is null then
    raise exception 'Hace falta una sesión para eliminar la cuenta';
  end if;
  sufijo := left(replace(yo::text, '-', ''), 12);

  update cuentas set eliminada = true where id = yo;

  if exists (select 1 from perfiles where id = yo) then
    update postulaciones set estado = 'cancelada'
    where perfil_id = yo
      and estado in ('pendiente', 'en_revision', 'entrevista');

    delete from perfil_tags where perfil_id = yo;
    delete from perfil_habilidades where perfil_id = yo;
    delete from formaciones where perfil_id = yo;
    delete from inscripciones_evento where perfil_id = yo;

    update perfiles
    set nombre_usuario = 'cuenta_eliminada_' || sufijo,
        nombre = 'Cuenta',
        apellido = 'eliminada',
        fecha_nacimiento = date '1900-01-01',
        pais = '—',
        bio = null,
        foto_url = null
    where id = yo;
  end if;

  if exists (select 1 from empresas where id = yo) then
    update vacantes set estado = 'cerrada'
    where empresa_id = yo and estado <> 'cerrada';

    update eventos set estado = 'cancelado'
    where empresa_id = yo and estado = 'activo' and fecha_hora > now();

    update empresas
    set razon_social = 'Empresa eliminada ' || sufijo,
        rut = null,
        descripcion = null,
        logo_url = null,
        sitio_web = null
    where id = yo;
  end if;

  delete from notificaciones where cuenta_id = yo;
end;
$$;

revoke all on function public.eliminar_mi_cuenta() from public, anon;
grant execute on function public.eliminar_mi_cuenta() to authenticated;

-- ------------------------------------------------------------
-- RF6.1 — De un aviso propio solo se puede cambiar `leida`
--
-- La política `notificaciones_marco_como_leidas` decide qué filas; este
-- permiso, qué columnas. Antes se podía reescribir el texto o el enlace de
-- un aviso propio.
-- ------------------------------------------------------------
revoke update on notificaciones from authenticated, anon;
grant update (leida) on notificaciones to authenticated;

commit;
