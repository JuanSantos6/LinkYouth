-- LinkYouth — Datos de demostracion.
--
-- Carga empresas, vacantes y eventos para que el feed tenga contenido real
-- antes de que existan cuentas institucionales. Las empresas quedan sin
-- `cuenta_id`: cuando la organizacion se registre de verdad, basta con
-- asociarle su usuario. Es idempotente.
--
-- Requiere haber corrido db/seed/0001_tags.sql.

-- ---------------------------------------------------------------------------
-- Empresas
-- ---------------------------------------------------------------------------

insert into empresas (razon_social, rubro, descripcion, ubicacion, sitio_web, verificada) values
  ('Mercado Libre',
   'Comercio electronico',
   'Plataforma de comercio electronico y pagos digitales con equipos de producto en Montevideo.',
   'Montevideo, Uruguay',
   'https://www.mercadolibre.com.uy',
   true),
  ('PedidosYa',
   'Tecnologia y logistica',
   'Hub tecnologico regional con equipos de producto, datos e infraestructura en el WTC Free Zone.',
   'Montevideo, Uruguay',
   'https://www.pedidosya.com.uy',
   true),
  ('dLocal',
   'Fintech',
   'Procesador de pagos transfronterizos para mercados emergentes.',
   'Montevideo, Uruguay',
   'https://www.dlocal.com',
   true),
  ('Universidad de la Republica',
   'Educacion',
   'Universidad publica del Uruguay. Organiza instancias de vinculacion entre estudiantes y empresas.',
   'Montevideo, Uruguay',
   'https://www.udelar.edu.uy',
   true)
on conflict (razon_social) do update
  set rubro = excluded.rubro,
      descripcion = excluded.descripcion,
      ubicacion = excluded.ubicacion,
      verificada = excluded.verificada;

-- ---------------------------------------------------------------------------
-- Vacantes, tags publicos y tags ocultos
-- ---------------------------------------------------------------------------

do $$
declare
  fila record;
  id_empresa uuid;
  id_vacante uuid;
begin
  for fila in
    select *
      from (values
        ('Mercado Libre', 'Desarrollador Frontend Junior',
         'Sumate al equipo de design system: vas a construir componentes reutilizables en React y TypeScript, con acompanamiento de un referente tecnico durante los primeros seis meses. No pedimos experiencia previa en la industria.',
         'empleo'::tipo_oportunidad, 'hibrido'::modalidad_trabajo, 'Montevideo, Uruguay',
         1500, 2000, 2::smallint,
         array['react', 'typescript', 'tailwind', 'html-css', 'git'],
         array['testing', 'accesibilidad', 'ingles-b2']),

        ('PedidosYa', 'Pasantia en Ingenieria de Interfaces',
         'Pasantia rentada de seis meses en el equipo de checkout. Vas a trabajar sobre la interfaz que usan miles de personas por dia, con revision de codigo y mentoria semanal.',
         'pasantia'::tipo_oportunidad, 'hibrido'::modalidad_trabajo, 'WTC Free Zone, Montevideo',
         1000, 1350, 3::smallint,
         array['react', 'javascript', 'html-css', 'trabajo-en-equipo'],
         array['accesibilidad', 'git', 'comunicacion']),

        ('dLocal', 'Analista de Datos Junior',
         'Buscamos una persona curiosa para el equipo de reportes de negocio: vas a escribir consultas SQL, mantener tableros y presentar hallazgos al equipo comercial.',
         'empleo'::tipo_oportunidad, 'remoto'::modalidad_trabajo, 'Remoto desde Uruguay',
         1400, 1900, 1::smallint,
         array['sql', 'analisis-datos', 'excel', 'ingles-b2'],
         array['python', 'power-bi', 'comunicacion']),

        ('Mercado Libre', 'Pasantia en Atencion al Cliente',
         'Primera experiencia laboral en el equipo de posventa. Formacion paga las primeras cuatro semanas y horario compatible con estudio.',
         'pasantia'::tipo_oportunidad, 'presencial'::modalidad_trabajo, 'Montevideo, Uruguay',
         800, 1000, 5::smallint,
         array['atencion-cliente', 'comunicacion', 'trabajo-en-equipo'],
         array['adaptabilidad', 'portugues'])
      ) as v(empresa, titulo, descripcion, tipo, modalidad, ubicacion,
             salario_min, salario_max, posiciones, tags_publicos, tags_ocultos)
  loop
    select id into id_empresa from empresas where razon_social = fila.empresa;

    select id into id_vacante
      from vacantes
     where empresa_id = id_empresa and lower(titulo) = lower(fila.titulo);

    if id_vacante is null then
      insert into vacantes (empresa_id, titulo, descripcion, tipo, modalidad,
                            ubicacion, salario_min, salario_max, posiciones)
      values (id_empresa, fila.titulo, fila.descripcion, fila.tipo, fila.modalidad,
              fila.ubicacion, fila.salario_min, fila.salario_max, fila.posiciones)
      returning id into id_vacante;
    end if;

    insert into vacante_tags (vacante_id, tag_id)
    select id_vacante, t.id from tags t where t.slug = any (fila.tags_publicos)
    on conflict do nothing;

    insert into vacante_tags_ocultos (vacante_id, tag_id, peso)
    select id_vacante, t.id, 3 from tags t where t.slug = any (fila.tags_ocultos)
    on conflict do nothing;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Eventos institucionales
-- ---------------------------------------------------------------------------

do $$
declare
  fila record;
  id_empresa uuid;
  id_evento uuid;
begin
  for fila in
    select *
      from (values
        ('Universidad de la Republica', 'Feria de Primer Empleo Tecnologico',
         'Jornada de vinculacion con empresas de tecnologia: charlas cortas, rondas de entrevistas breves y espacio de consultas sobre pasantias.',
         (current_date + 21)::timestamptz + interval '14 hours',
         (current_date + 21)::timestamptz + interval '19 hours',
         'presencial'::modalidad_trabajo, 'Facultad de Ingenieria, Montevideo',
         200::smallint, array['gestion-proyectos', 'comunicacion', 'react']),

        ('PedidosYa', 'Taller: como preparar tu primera entrevista tecnica',
         'Taller practico de dos horas con personas que entrevistan a diario. Se trabaja sobre casos reales y se sale con una devolucion individual.',
         (current_date + 10)::timestamptz + interval '18 hours 30 minutes',
         (current_date + 10)::timestamptz + interval '20 hours 30 minutes',
         'hibrido'::modalidad_trabajo, 'WTC Free Zone, Torre 4, Montevideo',
         60::smallint, array['comunicacion', 'javascript', 'resolucion-problemas']),

        ('dLocal', 'Charla abierta: primeros pasos en analisis de datos',
         'Recorrido por el trabajo cotidiano de un equipo de datos, las herramientas que se usan y como es el proceso de seleccion para perfiles junior.',
         (current_date + 32)::timestamptz + interval '19 hours',
         (current_date + 32)::timestamptz + interval '20 hours 30 minutes',
         'remoto'::modalidad_trabajo, 'Transmision en linea',
         null::smallint, array['analisis-datos', 'sql', 'estadistica'])
      ) as e(empresa, titulo, descripcion, inicia_en, termina_en, modalidad,
             ubicacion, cupo, tags)
  loop
    select id into id_empresa from empresas where razon_social = fila.empresa;

    select id into id_evento
      from eventos
     where empresa_id = id_empresa and lower(titulo) = lower(fila.titulo);

    if id_evento is null then
      insert into eventos (empresa_id, titulo, descripcion, inicia_en, termina_en,
                           modalidad, ubicacion, cupo)
      values (id_empresa, fila.titulo, fila.descripcion, fila.inicia_en,
              fila.termina_en, fila.modalidad, fila.ubicacion, fila.cupo)
      returning id into id_evento;
    end if;

    insert into evento_tags (evento_id, tag_id)
    select id_evento, t.id from tags t where t.slug = any (fila.tags)
    on conflict do nothing;
  end loop;
end;
$$;
