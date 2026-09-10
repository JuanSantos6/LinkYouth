-- LinkYouth — Vistas de lectura y calculo de compatibilidad (RF3.5, RF3.9)

-- ---------------------------------------------------------------------------
-- Afinidad publica: que porcentaje de los tags visibles de la vacante ya tiene
-- el postulante. Es el numero que la interfaz muestra como "% compatible".
-- No toca los tags ocultos, asi que puede ejecutarse con permisos normales.
-- ---------------------------------------------------------------------------

create or replace function afinidad_publica(vacante uuid, perfil uuid)
returns smallint
language sql
stable
as $$
  select case
           when count(*) = 0 then 0
           else round(100.0 * count(*) filter (where pt.tag_id is not null) / count(*))::smallint
         end
    from vacante_tags vt
    left join perfil_tags pt
      on pt.tag_id = vt.tag_id
     and pt.perfil_id = perfil
   where vt.vacante_id = vacante;
$$;

-- ---------------------------------------------------------------------------
-- RF3.9 — Puntaje de matching. Cruza los tags ocultos de la vacante con los
-- tags publicos del postulante y pondera por el peso que cargo la empresa.
-- Corre con `security definer` porque necesita leer `vacante_tags_ocultos`,
-- que ninguna sesion de postulante puede consultar (RNF5). Devuelve solo el
-- numero: los tags en si nunca salen de la funcion.
-- ---------------------------------------------------------------------------

create or replace function puntaje_matching(vacante uuid, perfil uuid)
returns smallint
language sql
stable
security definer
set search_path = public
as $$
  select case
           when coalesce(sum(vto.peso), 0) = 0 then 0
           else round(
                  100.0 * sum(vto.peso) filter (where pt.tag_id is not null)
                  / sum(vto.peso)
                )::smallint
         end
    from vacante_tags_ocultos vto
    left join perfil_tags pt
      on pt.tag_id = vto.tag_id
     and pt.perfil_id = perfil
   where vto.vacante_id = vacante;
$$;

-- El puntaje es visible solo para la empresa duena de la vacante (RF3.9.2).
revoke execute on function puntaje_matching(uuid, uuid) from public, anon;
grant execute on function puntaje_matching(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Vista del feed. Aplana empresa y tags publicos para que la aplicacion lea
-- una fila por vacante y no arme el join en el cliente.
-- `security_invoker` mantiene vigente la RLS de las tablas de origen.
-- ---------------------------------------------------------------------------

create or replace view vacantes_feed
with (security_invoker = true)
as
  select v.id,
         v.titulo,
         v.descripcion,
         v.tipo,
         v.modalidad,
         v.ubicacion,
         v.salario_min,
         v.salario_max,
         v.moneda,
         v.posiciones,
         v.estado,
         v.publicada_en,
         e.id           as empresa_id,
         e.razon_social as empresa,
         e.logo_url     as empresa_logo_url,
         e.rubro        as empresa_rubro,
         e.verificada   as empresa_verificada,
         coalesce(
           array_agg(t.nombre order by t.nombre) filter (where t.id is not null),
           '{}'
         ) as tags,
         (select count(*) from postulaciones p where p.vacante_id = v.id) as postulaciones
    from vacantes v
    join empresas e on e.id = v.empresa_id
    left join vacante_tags vt on vt.vacante_id = v.id
    left join tags t on t.id = vt.tag_id
   group by v.id, e.id;

comment on view vacantes_feed is 'RF3.5.1: listado resumido de vacantes con su empresa y tags publicos.';

create or replace view eventos_agenda
with (security_invoker = true)
as
  select ev.id,
         ev.titulo,
         ev.descripcion,
         ev.inicia_en,
         ev.termina_en,
         ev.modalidad,
         ev.ubicacion,
         ev.imagen_url,
         ev.cupo,
         ev.estado,
         e.id           as empresa_id,
         e.razon_social as empresa,
         e.logo_url     as empresa_logo_url,
         coalesce(
           array_agg(t.nombre order by t.nombre) filter (where t.id is not null),
           '{}'
         ) as tags,
         (select count(*) from inscripciones i where i.evento_id = ev.id) as inscriptos
    from eventos ev
    join empresas e on e.id = ev.empresa_id
    left join evento_tags et on et.evento_id = ev.id
    left join tags t on t.id = et.tag_id
   group by ev.id, e.id;

comment on view eventos_agenda is 'RF4.4.1: agenda de eventos publicados con su organizador y tags.';
