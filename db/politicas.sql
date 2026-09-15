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
-- Nueve políticas de select decían `using (true)` sin cláusula `to`. Sin `to`,
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
-- `perfiles_publicos` queda deliberadamente afuera: `registrarse()` la lee
-- SIN sesión para avisar que un nombre de usuario ya está tomado. Cerrarla
-- rompe el registro. Lo mismo `vacantes` y `eventos`, que son el aviso en sí
-- y no datos de una persona.
-- ============================================================

drop policy if exists "tags_lectura_publica" on tags;

create policy "tags_lectura_publica"
on tags for select
to authenticated
using (true);

drop policy if exists "habilidades_lectura_publica" on habilidades;

create policy "habilidades_lectura_publica"
on habilidades for select
to authenticated
using (true);

-- ============================================================
-- PERFIL_TAGS / PERFIL_HABILIDADES
-- Cada usuario gestiona únicamente los propios.
-- ============================================================

alter table perfil_tags enable row level security;
alter table perfil_habilidades enable row level security;

drop policy if exists "perfil_tags_lectura_publica" on perfil_tags;

create policy "perfil_tags_lectura_publica"
on perfil_tags for select
to authenticated
using (true);

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

create policy "perfil_habilidades_lectura_publica"
on perfil_habilidades for select
to authenticated
using (true);

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

create policy "formaciones_lectura_publica"
on formaciones for select
to authenticated
using (true);

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

-- ============================================================
-- VACANTE_TAGS_PUBLICOS / VACANTE_HABILIDADES
-- Visibles para todos. Solo la empresa dueña de la vacante
-- administra sus filas.
-- ============================================================

alter table vacante_tags_publicos enable row level security;
alter table vacante_habilidades enable row level security;

drop policy if exists "vacante_tags_publicos_lectura_publica" on vacante_tags_publicos;

create policy "vacante_tags_publicos_lectura_publica"
on vacante_tags_publicos for select
to authenticated
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

create policy "vacante_habilidades_lectura_publica"
on vacante_habilidades for select
to authenticated
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
-- mover a en_revision/aceptada/rechazada (RF3.4.3). Nunca se borran.
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

create policy "postulaciones_transiciones_permitidas"
on postulaciones for update
using (
  perfil_id = auth.uid()
  or exists (select 1 from vacantes v where v.id = vacante_id and v.empresa_id = auth.uid())
)
with check (
  (perfil_id = auth.uid() and estado = 'cancelada')
  or (
    exists (select 1 from vacantes v where v.id = vacante_id and v.empresa_id = auth.uid())
    and estado in ('en_revision', 'aceptada', 'rechazada')
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

create policy "evento_tags_lectura_publica"
on evento_tags for select
to authenticated
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

create policy "inscripciones_me_inscribo_yo"
on inscripciones_evento for insert
to authenticated
with check (
  perfil_id = auth.uid()
  and exists (select 1 from perfiles where id = auth.uid())
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

create policy "resenias_lectura_publica"
on resenias for select
to authenticated
using (true);

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
