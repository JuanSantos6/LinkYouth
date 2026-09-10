-- LinkYouth — Row Level Security (RNF5)
--
-- Regla general del proyecto: el control de acceso vive en la base, no en la
-- interfaz. La clave `anon` es publica, asi que todo lo que no este permitido
-- aca explicitamente queda fuera del alcance de cualquier cliente.

-- ---------------------------------------------------------------------------
-- Ayudantes
-- ---------------------------------------------------------------------------

-- Devuelve la empresa que opera la sesion actual, o null si la sesion es de un
-- postulante. Se marca `security definer` para que la politica de una tabla no
-- dependa de las politicas de `empresas`.
create or replace function empresa_actual()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from empresas where cuenta_id = auth.uid();
$$;

create or replace function es_duena_de_vacante(vacante uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from vacantes v
     where v.id = vacante
       and v.empresa_id = empresa_actual()
  );
$$;

create or replace function es_duena_de_evento(evento uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from eventos e
     where e.id = evento
       and e.empresa_id = empresa_actual()
  );
$$;

-- ---------------------------------------------------------------------------
-- Perfiles y formacion
-- ---------------------------------------------------------------------------

alter table perfiles enable row level security;

-- RF2.5: el perfil es publico; los datos sensibles (correo, contrasena) los
-- guarda auth.users, que no se expone.
create policy "perfiles visibles para todos"
  on perfiles for select
  using (true);

create policy "cada persona crea su propio perfil"
  on perfiles for insert to authenticated
  with check (id = auth.uid());

create policy "cada persona edita su propio perfil"
  on perfiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "cada persona borra su propio perfil"
  on perfiles for delete to authenticated
  using (id = auth.uid());

alter table formaciones enable row level security;

create policy "formacion visible para todos"
  on formaciones for select
  using (true);

create policy "cada persona gestiona su formacion"
  on formaciones for all to authenticated
  using (perfil_id = auth.uid())
  with check (perfil_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Empresas
-- ---------------------------------------------------------------------------

alter table empresas enable row level security;

create policy "empresas visibles para todos"
  on empresas for select
  using (true);

create policy "la empresa se vincula a su propia cuenta"
  on empresas for insert to authenticated
  with check (cuenta_id = auth.uid());

create policy "la empresa edita sus propios datos"
  on empresas for update to authenticated
  using (cuenta_id = auth.uid())
  with check (cuenta_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Tags
-- ---------------------------------------------------------------------------

alter table tags enable row level security;

create policy "catalogo de tags de lectura publica"
  on tags for select
  using (true);

alter table perfil_tags enable row level security;

create policy "tags de perfil visibles para todos"
  on perfil_tags for select
  using (true);

create policy "cada persona gestiona sus tags"
  on perfil_tags for all to authenticated
  using (perfil_id = auth.uid())
  with check (perfil_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Vacantes
-- ---------------------------------------------------------------------------

alter table vacantes enable row level security;

create policy "vacantes activas de lectura publica"
  on vacantes for select
  using (estado = 'activa' or empresa_id = empresa_actual());

create policy "la empresa publica sus vacantes"
  on vacantes for insert to authenticated
  with check (empresa_id = empresa_actual());

create policy "la empresa modifica sus vacantes"
  on vacantes for update to authenticated
  using (empresa_id = empresa_actual())
  with check (empresa_id = empresa_actual());

create policy "la empresa elimina sus vacantes"
  on vacantes for delete to authenticated
  using (empresa_id = empresa_actual());

alter table vacante_tags enable row level security;

create policy "tags publicos de la vacante visibles para todos"
  on vacante_tags for select
  using (true);

create policy "la empresa gestiona los tags publicos"
  on vacante_tags for all to authenticated
  using (es_duena_de_vacante(vacante_id))
  with check (es_duena_de_vacante(vacante_id));

alter table vacante_tags_ocultos enable row level security;

-- RNF5: sin politica de lectura para `anon` ni para postulantes. El unico
-- camino a estos tags es la empresa duena de la vacante o la funcion de
-- matching, que corre con `security definer` y devuelve solo el puntaje.
create policy "tags ocultos solo para la empresa duena"
  on vacante_tags_ocultos for select to authenticated
  using (es_duena_de_vacante(vacante_id));

create policy "la empresa gestiona sus tags ocultos"
  on vacante_tags_ocultos for all to authenticated
  using (es_duena_de_vacante(vacante_id))
  with check (es_duena_de_vacante(vacante_id));

-- ---------------------------------------------------------------------------
-- Postulaciones
-- ---------------------------------------------------------------------------

alter table postulaciones enable row level security;

-- RF3.7 y RF3.4.1: la ve el postulante que la hizo y la empresa que publico.
create policy "postulacion visible para las dos partes"
  on postulaciones for select to authenticated
  using (perfil_id = auth.uid() or es_duena_de_vacante(vacante_id));

create policy "el postulante crea su postulacion"
  on postulaciones for insert to authenticated
  with check (
    perfil_id = auth.uid()
    and exists (
      select 1 from vacantes v
       where v.id = vacante_id and v.estado = 'activa'
    )
  );

-- RF3.4.3: solo la empresa mueve el estado.
create policy "la empresa actualiza el estado"
  on postulaciones for update to authenticated
  using (es_duena_de_vacante(vacante_id))
  with check (es_duena_de_vacante(vacante_id));

-- RF3.8: el postulante puede cancelar la suya.
create policy "el postulante cancela su postulacion"
  on postulaciones for delete to authenticated
  using (perfil_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Eventos
-- ---------------------------------------------------------------------------

alter table eventos enable row level security;

create policy "eventos publicados de lectura publica"
  on eventos for select
  using (estado = 'publicado' or empresa_id = empresa_actual());

create policy "la empresa gestiona sus eventos"
  on eventos for all to authenticated
  using (empresa_id = empresa_actual())
  with check (empresa_id = empresa_actual());

alter table evento_tags enable row level security;

create policy "tags de evento de lectura publica"
  on evento_tags for select
  using (true);

create policy "la empresa gestiona los tags del evento"
  on evento_tags for all to authenticated
  using (es_duena_de_evento(evento_id))
  with check (es_duena_de_evento(evento_id));

alter table inscripciones enable row level security;

create policy "inscripcion visible para las dos partes"
  on inscripciones for select to authenticated
  using (perfil_id = auth.uid() or es_duena_de_evento(evento_id));

create policy "cada persona gestiona su inscripcion"
  on inscripciones for all to authenticated
  using (perfil_id = auth.uid())
  with check (perfil_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Notificaciones
-- ---------------------------------------------------------------------------

alter table notificaciones enable row level security;

create policy "cada persona ve su bandeja"
  on notificaciones for select to authenticated
  using (perfil_id = auth.uid());

create policy "cada persona marca sus notificaciones"
  on notificaciones for update to authenticated
  using (perfil_id = auth.uid())
  with check (perfil_id = auth.uid());
