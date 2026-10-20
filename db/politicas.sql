-- ============================================================
-- LinkYouth — Políticas de Row Level Security
-- Ejecutar DESPUÉS de schema.sql
-- Cubre: RNF5 (seguridad y separación de datos)
-- ============================================================

-- ============================================================
-- EL TIPO DE CUENTA SE EXIGE ACÁ, NO EN EL MIDDLEWARE
--
-- Dos auditorías independientes (la interna y Cyber Neo, 2026-09-15)
-- encontraron lo mismo: ninguna acción de servidor verificaba el tipo de
-- cuenta de quien la invoca, y el middleware no la cubre.
--
-- El middleware reparte por `cuentas.tipo` y manda a cada uno a su mitad de
-- la aplicación, pero eso protege la navegación por URL, no el endpoint. Una
-- Server Action no vive en una ruta propia: se invoca por POST contra
-- cualquier ruta, con un id que viaja en los chunks que Next sirve desde
-- `/_next/static` —ruta que el `matcher` de `src/middleware.ts` excluye
-- explícitamente—. Una cuenta de empresa puede sacar el id de `postularse`
-- de esos chunks y hacerle POST contra `/empresa`, que su tipo sí tiene
-- permitido: el middleware ve `/empresa`, deja pasar, y Next despacha la
-- acción por id.
--
-- Lo que frenaba eso hasta ahora era la clave foránea `perfil_id ->
-- perfiles`: una cuenta de empresa no tiene fila en `perfiles`, así que el
-- insert fallaba con 23503. Andaba, pero por accidente —una clave foránea
-- existe para integridad referencial, no para control de acceso— y no cubría
-- la dirección inversa, que es la que va a importar cuando el Hito 6 traiga
-- las acciones de empresa.
--
-- La condición que se agrega abajo no consulta `cuentas.tipo` ni necesita una
-- función nueva. Se apoya en la garantía que ya da el disparador
-- `validar_tipo_cuenta` de `schema.sql`: una cuenta tiene fila en `perfiles`
-- O en `empresas`, nunca en las dos. Por lo tanto:
--
--   exists (select 1 from perfiles where id = auth.uid())  ==  soy individual
--   exists (select 1 from empresas where id = auth.uid())  ==  soy empresa
--
-- La subquery se evalúa con los permisos de quien ejecuta, así que el RLS de
-- la tabla consultada se aplica. Acá eso no molesta y no hace falta
-- `security definer` como en `cuenta_activa()`: las dos políticas de lectura
-- involucradas dejan ver la fila propia, que es exactamente la única que
-- estas subconsultas necesitan.
--
-- No se tocaron las políticas de select, update ni delete. Tampoco las tres
-- del alta (`cuentas_creo_la_mia`, `perfiles_creo_el_mio`,
-- `empresas_creo_la_mia`): exigirles una fila que el propio insert está
-- creando dejaría a todo el mundo afuera del registro.
-- ============================================================

-- ============================================================
-- CUENTAS
-- Cada uno ve y edita únicamente su propia cuenta.
-- ============================================================

alter table cuentas enable row level security;

create policy "cuentas_veo_la_mia"
on cuentas for select
using (auth.uid() = id);

create policy "cuentas_creo_la_mia"
on cuentas for insert
with check (auth.uid() = id);

create policy "cuentas_edito_la_mia"
on cuentas for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- ============================================================
-- PERFILES
-- La tabla NO se lee desde la API. El perfil público de RF2.5 se sirve
-- por la vista `perfiles_publicos` de schema.sql, que expone solo las
-- columnas publicables; acá queda únicamente la fila propia, completa.
--
-- Motivo (CN-001 de la auditoría del 2026-09-12): RLS es control por
-- fila, no por columna. La política anterior, `perfiles_lectura_publica
-- using (cuenta_activa(id))`, autorizaba la fila entera y sin cláusula
-- `to`, así que alcanzaba también al rol `anon`. Como la ANON_KEY viaja
-- al navegador por diseño, cualquiera podía consultar PostgREST y leer
-- `fecha_nacimiento` de todos los usuarios: una columna que la interfaz
-- no muestra en ningún lado y que solo existe para el constraint
-- `perfiles_mayor_de_edad` (RF1.1.8).
-- ============================================================

alter table perfiles enable row level security;

-- Sobre una base que ya tiene la política vieja, esto la saca. En una
-- base nueva no hace nada: por eso el `if exists`.
drop policy if exists "perfiles_lectura_publica" on perfiles;

create policy "perfiles_veo_el_mio_completo"
on perfiles for select
to authenticated
using (auth.uid() = id);

create policy "perfiles_creo_el_mio"
on perfiles for insert
with check (auth.uid() = id);

create policy "perfiles_edito_el_mio"
on perfiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- ============================================================
-- EMPRESAS
-- Mismo patrón que perfiles.
-- ============================================================

alter table empresas enable row level security;

create policy "empresas_lectura_publica"
on empresas for select
using (cuenta_activa(id));

create policy "empresas_creo_la_mia"
on empresas for insert
with check (auth.uid() = id);

create policy "empresas_edito_la_mia"
on empresas for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- ============================================================
-- TAGS Y HABILIDADES (catálogos)
-- Lectura libre para todos. Sin política de insert/update/delete:
-- por diseño, nadie desde la app puede escribir acá. Se cargan
-- a mano desde el SQL Editor (seed inicial).
-- ============================================================

alter table tags enable row level security;
alter table habilidades enable row level security;

-- ============================================================
-- «LECTURA PÚBLICA» QUIERE DECIR «CUALQUIER USUARIO», NO «CUALQUIERA»
--
-- Varias políticas de select decían `using (true)` sin cláusula `to`. Sin `to`,
-- una política alcanza también al rol `anon`, y la ANON_KEY viaja al navegador
-- por diseño: con esa clave y PostgREST se podía bajar, sin cuenta y sin
-- límite, el padrón entero —cada perfil con sus intereses, sus habilidades,
-- sus estudios y sus reseñas, todo unido por `perfil_id`—.
--
-- Es la misma forma de problema que CN-001 (auditoría del 2026-09-12), que
-- cerró la *columna* `fecha_nacimiento` pero dejó abierta la *superficie*.
-- Raspar sigue siendo posible; ahora cuesta una cuenta.
--
-- La condición no cambia: lo que se agrega es `to authenticated`. Los datos
-- siguen siendo públicos entre usuarios, que es lo que pide RF2.5.
--
-- Quedan deliberadamente afuera:
--
-- · `tags` y `habilidades`, los dos catálogos de acá abajo. `/registro` los lee
--   SIN sesión para ofrecer los intereses (RF1.1.11): cerrarlos deja el selector
--   vacío y nadie puede registrarse. No son datos de una persona —son la lista
--   fija de opciones, cargada por seed— así que abrirlos no expone a nadie.
--   Lo que arma el padrón es quién eligió qué (`perfil_tags`,
--   `perfil_habilidades`), y eso sí queda cerrado. Ver `docs/decisiones.md`.
-- · `perfiles_publicos`: `registrarse()` la lee SIN sesión para avisar que un
--   nombre de usuario ya está tomado. Cerrarla rompe el registro. Desde el
--   2026-10-06 (H6, H13) expone solo `id` y `nombre_usuario`, y es de solo
--   lectura: ver schema.sql.
-- · `vacantes` y `eventos`, que son el aviso en sí y no datos de una persona,
--   y lo que el aviso dice que pide (`vacante_tags_publicos`,
--   `vacante_habilidades`, `evento_tags`): desde el 2026-09-26 `/empleos` y
--   `/eventos` se leen sin sesión, y sin ellas el aviso llegaría sin decir qué
--   pide. Los tags ocultos siguen cerrados
--   (RF3.1.6, RNF5). Ver `docs/decisiones.md`.
-- ============================================================

-- Sin `to` a propósito: el catálogo es público también para `anon`.
drop policy if exists "tags_lectura_publica" on tags;

create policy "tags_lectura_publica"
on tags for select
using (true);

drop policy if exists "habilidades_lectura_publica" on habilidades;

create policy "habilidades_lectura_publica"
on habilidades for select
using (true);

-- ============================================================
-- PERFIL_TAGS / PERFIL_HABILIDADES
-- Cada usuario gestiona únicamente los propios.
-- ============================================================

-- ¿El joven `perfil` tiene una postulación no cancelada a una vacante de la
-- empresa de la sesión? `security invoker`: corre con los permisos de quien
-- consulta, así que `postulaciones` y `vacantes` siguen filtradas por sus
-- propias políticas. La usan las lecturas de perfil_tags, perfil_habilidades
-- y formaciones.
create or replace function public.es_postulante_de_mi_empresa(perfil uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.postulaciones p
    join public.vacantes v on v.id = p.vacante_id
    where p.perfil_id = perfil
      and v.empresa_id = (select auth.uid())
      and p.estado <> 'cancelada'
  );
$$;

revoke all on function public.es_postulante_de_mi_empresa(uuid) from public, anon;
grant execute on function public.es_postulante_de_mi_empresa(uuid) to authenticated;

-- Los datos que una empresa ve de quien se postuló a una de sus búsquedas (sin
-- haber cancelado) o se inscribió a uno de sus eventos (migración 005).
--
-- `perfiles` solo deja leer la fila propia y `perfiles_publicos` expone solo
-- `id` y `nombre_usuario`: sin esto, la empresa sabe que alguien se postuló
-- pero no quién es. Una política sobre `perfiles` no sirve, porque RLS decide
-- filas y no columnas, y abriría también `fecha_nacimiento`. La función
-- devuelve la lista exacta de columnas.
--
-- `security definer` para leer `perfiles` por encima de su RLS: por eso la
-- condición sobre la empresa está escrita adentro y no se apoya en ninguna
-- otra política. Con `anon` no se puede llamar.
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

alter table perfil_tags enable row level security;
alter table perfil_habilidades enable row level security;

drop policy if exists "perfil_tags_lectura_publica" on perfil_tags;
drop policy if exists "perfil_tags_veo_los_mios_o_de_mis_postulantes" on perfil_tags;

-- H1 (2026-10-06): antes `using (true)`, que con el registro abierto era
-- "cualquiera lee todo". Ahora cada joven ve lo suyo y una empresa ve lo de
-- quienes se postularon a sus vacantes. Ver migración 003.
create policy "perfil_tags_veo_los_mios_o_de_mis_postulantes"
on perfil_tags for select
to authenticated
using (
  perfil_id = (select auth.uid())
  or public.es_postulante_de_mi_empresa(perfil_id)
);

-- Solo una cuenta individual suma intereses: ver la nota del encabezado.
drop policy if exists "perfil_tags_agrego_los_mios" on perfil_tags;

create policy "perfil_tags_agrego_los_mios"
on perfil_tags for insert
to authenticated
with check (
  auth.uid() = perfil_id
  and exists (select 1 from perfiles where id = auth.uid())
);

create policy "perfil_tags_elimino_los_mios"
on perfil_tags for delete
using (auth.uid() = perfil_id);

drop policy if exists "perfil_habilidades_lectura_publica" on perfil_habilidades;
drop policy if exists "perfil_habilidades_veo_las_mias_o_de_mis_postulantes" on perfil_habilidades;

-- H1 (2026-10-06): antes `using (true)`, que con el registro abierto era
-- "cualquiera lee todo". Ahora cada joven ve lo suyo y una empresa ve lo de
-- quienes se postularon a sus vacantes. Ver migración 003.
create policy "perfil_habilidades_veo_las_mias_o_de_mis_postulantes"
on perfil_habilidades for select
to authenticated
using (
  perfil_id = (select auth.uid())
  or public.es_postulante_de_mi_empresa(perfil_id)
);

drop policy if exists "perfil_habilidades_agrego_las_mias" on perfil_habilidades;

create policy "perfil_habilidades_agrego_las_mias"
on perfil_habilidades for insert
to authenticated
with check (
  auth.uid() = perfil_id
  and exists (select 1 from perfiles where id = auth.uid())
);

create policy "perfil_habilidades_elimino_las_mias"
on perfil_habilidades for delete
using (auth.uid() = perfil_id);

-- ============================================================
-- FORMACIONES
-- Parte del perfil público. Cada usuario gestiona las propias.
-- ============================================================

alter table formaciones enable row level security;

drop policy if exists "formaciones_lectura_publica" on formaciones;
drop policy if exists "formaciones_veo_las_mias_o_de_mis_postulantes" on formaciones;

-- H1 (2026-10-06): antes `using (true)`, que con el registro abierto era
-- "cualquiera lee todo". Ahora cada joven ve lo suyo y una empresa ve lo de
-- quienes se postularon a sus vacantes. Ver migración 003.
create policy "formaciones_veo_las_mias_o_de_mis_postulantes"
on formaciones for select
to authenticated
using (
  perfil_id = (select auth.uid())
  or public.es_postulante_de_mi_empresa(perfil_id)
);

drop policy if exists "formaciones_agrego_las_mias" on formaciones;

create policy "formaciones_agrego_las_mias"
on formaciones for insert
to authenticated
with check (
  auth.uid() = perfil_id
  and exists (select 1 from perfiles where id = auth.uid())
);

create policy "formaciones_edito_las_mias"
on formaciones for update
using (auth.uid() = perfil_id);

create policy "formaciones_elimino_las_mias"
on formaciones for delete
using (auth.uid() = perfil_id);

-- ============================================================
-- VACANTES
-- Públicas si están activas. La empresa dueña ve también las
-- cerradas y es la única que puede crearlas o modificarlas.
-- ============================================================

alter table vacantes enable row level security;

create policy "vacantes_lectura_activas_o_propias"
on vacantes for select
using (estado = 'activa' or empresa_id = auth.uid());

-- La condición inversa: publicar una vacante es cosa de una cuenta de
-- empresa. Las tablas hijas (`vacante_tags_publicos`, `vacante_habilidades`,
-- `vacante_tags_ocultos`) no necesitan repetirla: ya exigen ser dueño de una
-- vacante, y con esta política una vacante solo puede tener dueño empresa.
drop policy if exists "vacantes_creo_las_mias" on vacantes;

create policy "vacantes_creo_las_mias"
on vacantes for insert
to authenticated
with check (
  empresa_id = auth.uid()
  and exists (select 1 from empresas where id = auth.uid())
);

create policy "vacantes_edito_las_mias"
on vacantes for update
using (empresa_id = auth.uid());

-- Borrar una búsqueda solo si nadie se postuló (migración 005).
-- `postulaciones` borra en cascada desde `vacantes`, y las postulaciones no se
-- borran nunca: con postulaciones, la búsqueda solo se puede cerrar.
-- `vacantes.id` va calificado: dentro de la subconsulta, un `id` suelto sería
-- el de `postulaciones` y la condición quedaría siempre falsa.
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
-- VACANTE_TAGS_PUBLICOS / VACANTE_HABILIDADES
-- Visibles para todos. Solo la empresa dueña de la vacante
-- administra sus filas.
-- ============================================================

alter table vacante_tags_publicos enable row level security;
alter table vacante_habilidades enable row level security;

drop policy if exists "vacante_tags_publicos_lectura_publica" on vacante_tags_publicos;

-- Sin `to` a propósito: es parte del aviso, que se lee sin sesión.
create policy "vacante_tags_publicos_lectura_publica"
on vacante_tags_publicos for select
using (true);

create policy "vacante_tags_publicos_administro_los_mios"
on vacante_tags_publicos for insert
with check (
  exists (select 1 from vacantes v where v.id = vacante_id and v.empresa_id = auth.uid())
);

create policy "vacante_tags_publicos_elimino_los_mios"
on vacante_tags_publicos for delete
using (
  exists (select 1 from vacantes v where v.id = vacante_id and v.empresa_id = auth.uid())
);

drop policy if exists "vacante_habilidades_lectura_publica" on vacante_habilidades;

-- Sin `to` a propósito: es parte del aviso, que se lee sin sesión.
create policy "vacante_habilidades_lectura_publica"
on vacante_habilidades for select
using (true);

create policy "vacante_habilidades_administro_las_mias"
on vacante_habilidades for insert
with check (
  exists (select 1 from vacantes v where v.id = vacante_id and v.empresa_id = auth.uid())
);

create policy "vacante_habilidades_elimino_las_mias"
on vacante_habilidades for delete
using (
  exists (select 1 from vacantes v where v.id = vacante_id and v.empresa_id = auth.uid())
);

-- ============================================================
-- VACANTE_TAGS_OCULTOS — la tabla más sensible (RNF5)
-- Solo la empresa dueña de la vacante puede ver o tocar sus filas.
-- Ningún postulante tiene ninguna política de select: para ellos,
-- estas filas no existen.
-- ============================================================

alter table vacante_tags_ocultos enable row level security;

create policy "tags_ocultos_solo_empresa_duena_lee"
on vacante_tags_ocultos for select
using (
  exists (select 1 from vacantes v where v.id = vacante_id and v.empresa_id = auth.uid())
);

create policy "tags_ocultos_solo_empresa_duena_escribe"
on vacante_tags_ocultos for insert
with check (
  exists (select 1 from vacantes v where v.id = vacante_id and v.empresa_id = auth.uid())
);

create policy "tags_ocultos_solo_empresa_duena_elimina"
on vacante_tags_ocultos for delete
using (
  exists (select 1 from vacantes v where v.id = vacante_id and v.empresa_id = auth.uid())
);

-- ============================================================
-- POSTULACIONES
-- El postulante ve y crea las propias. La empresa ve las de sus
-- vacantes. Las transiciones de estado están acotadas: el
-- postulante solo puede cancelar (RF3.8); la empresa solo puede
-- mover a en_revision/entrevista/aceptada/rechazada (RF3.4.3, y
-- `entrevista` desde la migración 005). Nunca se borran.
-- ============================================================

alter table postulaciones enable row level security;

create policy "postulaciones_veo_las_mias_o_de_mi_empresa"
on postulaciones for select
using (
  perfil_id = auth.uid()
  or exists (select 1 from vacantes v where v.id = vacante_id and v.empresa_id = auth.uid())
);

drop policy if exists "postulaciones_me_postulo_a_vacante_activa" on postulaciones;

create policy "postulaciones_me_postulo_a_vacante_activa"
on postulaciones for insert
to authenticated
with check (
  perfil_id = auth.uid()
  and exists (select 1 from perfiles where id = auth.uid())
  and exists (select 1 from vacantes v where v.id = vacante_id and v.estado = 'activa')
);

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
-- EVENTOS
-- Mismo patrón que vacantes.
-- ============================================================

alter table eventos enable row level security;

create policy "eventos_lectura_activos_o_propios"
on eventos for select
using (estado = 'activo' or empresa_id = auth.uid());

-- Mismo caso que `vacantes_creo_las_mias`, y `evento_tags` queda cubierta por
-- la misma razón que las hijas de `vacantes`.
drop policy if exists "eventos_creo_los_mios" on eventos;

create policy "eventos_creo_los_mios"
on eventos for insert
to authenticated
with check (
  empresa_id = auth.uid()
  and exists (select 1 from empresas where id = auth.uid())
);

create policy "eventos_edito_los_mios"
on eventos for update
using (empresa_id = auth.uid());

-- ============================================================
-- EVENTO_TAGS
-- ============================================================

alter table evento_tags enable row level security;

drop policy if exists "evento_tags_lectura_publica" on evento_tags;

-- Sin `to` a propósito: es parte del aviso, que se lee sin sesión.
create policy "evento_tags_lectura_publica"
on evento_tags for select
using (true);

create policy "evento_tags_administro_los_mios"
on evento_tags for insert
with check (
  exists (select 1 from eventos e where e.id = evento_id and e.empresa_id = auth.uid())
);

create policy "evento_tags_elimino_los_mios"
on evento_tags for delete
using (
  exists (select 1 from eventos e where e.id = evento_id and e.empresa_id = auth.uid())
);

-- ============================================================
-- INSCRIPCIONES_EVENTO
-- El usuario se inscribe y cancela por su cuenta (RF4.5, RF4.6).
-- La empresa dueña del evento puede ver quién está inscripto.
-- ============================================================

alter table inscripciones_evento enable row level security;

create policy "inscripciones_veo_las_mias_o_de_mi_evento"
on inscripciones_evento for select
using (
  perfil_id = auth.uid()
  or exists (select 1 from eventos e where e.id = evento_id and e.empresa_id = auth.uid())
);

drop policy if exists "inscripciones_me_inscribo_yo" on inscripciones_evento;

-- Desde la migración 005, además, solo a un evento activo y que todavía no
-- pasó: antes, con el id de uno cancelado o vencido, la inscripción entraba
-- igual por la API.
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

create policy "inscripciones_cancelo_la_mia"
on inscripciones_evento for delete
using (perfil_id = auth.uid());

-- ============================================================
-- RESEÑAS
-- Lectura pública (RF8.2). Solo publica quien tenga al menos una
-- postulación (en cualquier estado) a esa empresa.
-- ============================================================

alter table resenias enable row level security;

drop policy if exists "resenias_lectura_publica" on resenias;
drop policy if exists "resenias_veo_las_mias_o_de_mi_empresa" on resenias;

-- H1 (2026-10-06): antes la leía cualquiera con sesión. Ahora, quien la
-- escribió y la empresa reseñada. RF8.2 pide lectura pública: se vuelve a
-- abrir cuando exista la pantalla y se decida qué mostrar (decisiones.md).
create policy "resenias_veo_las_mias_o_de_mi_empresa"
on resenias for select
to authenticated
using (
  perfil_id = (select auth.uid())
  or empresa_id = (select auth.uid())
);

create policy "resenias_solo_quien_postulo"
on resenias for insert
with check (
  perfil_id = auth.uid()
  and exists (
    select 1 from postulaciones p
    join vacantes v on v.id = p.vacante_id
    where p.perfil_id = auth.uid() and v.empresa_id = resenias.empresa_id
  )
);

-- ============================================================
-- NOTIFICACIONES
-- Cada cuenta ve y marca como leídas únicamente las propias.
-- No hay política de insert: las crea el trigger de schema.sql
-- (security definer), nunca el cliente directamente.
-- ============================================================

alter table notificaciones enable row level security;

create policy "notificaciones_veo_las_mias"
on notificaciones for select
using (cuenta_id = auth.uid());

create policy "notificaciones_marco_como_leidas"
on notificaciones for update
using (cuenta_id = auth.uid())
with check (cuenta_id = auth.uid());

-- ============================================================
-- CORREOS_PENDIENTES (migración 007)
-- Cola de los correos de aviso (RF6.3). RLS activado y sin políticas, y
-- sin permisos para `anon` ni `authenticated`: ni el joven ni la empresa
-- la leen, ni siquiera sus filas. La llenan los disparadores (`security
-- definer`) y la vacía la aplicación con `service_role`.
-- ============================================================

alter table correos_pendientes enable row level security;
revoke all on correos_pendientes from public, anon, authenticated;
grant all on correos_pendientes to service_role;

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

revoke all on function public.avisar(uuid, text, text, text, text) from public, anon, authenticated;

-- ============================================================
-- Cuenta y perfil público (migración 006): RF8.2, RF2.5, RF1.7, RF6.1
-- ============================================================
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
