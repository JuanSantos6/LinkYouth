-- ============================================================
-- LinkYouth — Políticas de Row Level Security
-- Ejecutar DESPUÉS de schema.sql
-- Cubre: RNF5 (seguridad y separación de datos)
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
-- Públicos para lectura (RF2.5). Cada quien crea y edita el suyo.
-- ============================================================

alter table perfiles enable row level security;

create policy "perfiles_lectura_publica"
on perfiles for select
using (true);

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
using (true);

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

create policy "tags_lectura_publica"
on tags for select
using (true);

create policy "habilidades_lectura_publica"
on habilidades for select
using (true);

-- ============================================================
-- PERFIL_TAGS / PERFIL_HABILIDADES
-- Cada usuario gestiona únicamente los propios.
-- ============================================================

alter table perfil_tags enable row level security;
alter table perfil_habilidades enable row level security;

create policy "perfil_tags_lectura_publica"
on perfil_tags for select
using (true);

create policy "perfil_tags_agrego_los_mios"
on perfil_tags for insert
with check (auth.uid() = perfil_id);

create policy "perfil_tags_elimino_los_mios"
on perfil_tags for delete
using (auth.uid() = perfil_id);

create policy "perfil_habilidades_lectura_publica"
on perfil_habilidades for select
using (true);

create policy "perfil_habilidades_agrego_las_mias"
on perfil_habilidades for insert
with check (auth.uid() = perfil_id);

create policy "perfil_habilidades_elimino_las_mias"
on perfil_habilidades for delete
using (auth.uid() = perfil_id);

-- ============================================================
-- FORMACIONES
-- Parte del perfil público. Cada usuario gestiona las propias.
-- ============================================================

alter table formaciones enable row level security;

create policy "formaciones_lectura_publica"
on formaciones for select
using (true);

create policy "formaciones_agrego_las_mias"
on formaciones for insert
with check (auth.uid() = perfil_id);

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

create policy "vacantes_creo_las_mias"
on vacantes for insert
with check (empresa_id = auth.uid());

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
-- mover a en_revision/aceptada/rechazada (RF3.4.3). Nunca se borran.
-- ============================================================

alter table postulaciones enable row level security;

create policy "postulaciones_veo_las_mias_o_de_mi_empresa"
on postulaciones for select
using (
  perfil_id = auth.uid()
  or exists (select 1 from vacantes v where v.id = vacante_id and v.empresa_id = auth.uid())
);

create policy "postulaciones_me_postulo_a_vacante_activa"
on postulaciones for insert
with check (
  perfil_id = auth.uid()
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

create policy "eventos_creo_los_mios"
on eventos for insert
with check (empresa_id = auth.uid());

create policy "eventos_edito_los_mios"
on eventos for update
using (empresa_id = auth.uid());

-- ============================================================
-- EVENTO_TAGS
-- ============================================================

alter table evento_tags enable row level security;

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

create policy "inscripciones_me_inscribo_yo"
on inscripciones_evento for insert
with check (perfil_id = auth.uid());

create policy "inscripciones_cancelo_la_mia"
on inscripciones_evento for delete
using (perfil_id = auth.uid());

-- ============================================================
-- RESEÑAS
-- Lectura pública (RF8.2). Solo publica quien tenga al menos una
-- postulación (en cualquier estado) a esa empresa.
-- ============================================================

alter table resenias enable row level security;

create policy "resenias_lectura_publica"
on resenias for select
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
