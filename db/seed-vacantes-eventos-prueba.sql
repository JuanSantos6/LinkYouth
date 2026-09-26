-- ============================================================
-- Vacantes y eventos de prueba
--
-- 15 vacantes (3 por empresa) y 8 eventos, publicados por las cinco empresas
-- de `db/seed-usuarios-prueba.sql` y etiquetados con el catálogo real de
-- `tags` y `habilidades`. Sirven para evaluar el diseño con contenido
-- verosímil, no para producción.
--
-- Requisitos: `schema.sql`, `politicas.sql`, `seed.sql` y
-- `seed-usuarios-prueba.sql` ya aplicados.
--
-- Todas las filas llevan un id fijo que empieza con `5eed`. Eso las hace
-- reconocibles y es lo que permite borrarlas sin tocar nada más:
--
--   Cargar:  docker exec -i supabase-db psql -U postgres -d postgres \
--              -v ON_ERROR_STOP=1 -1 < db/seed-vacantes-eventos-prueba.sql
--   Borrar:  docker exec -i supabase-db psql -U postgres -d postgres \
--              -v ON_ERROR_STOP=1 -1 < db/borrar-vacantes-eventos-prueba.sql
--
-- Se puede correr dos veces: primero borra lo que haya cargado antes.
--
-- Las fechas son relativas a `now()`: las vacantes aparecen publicadas en los
-- últimos días y los eventos caen siempre en las próximas semanas.
-- ============================================================

-- Idempotente: saca la carga anterior, si la hay. Las tablas puente,
-- postulaciones e inscripciones hechas sobre estas filas caen en cascada.
delete from vacantes where id::text like '5eed%';
delete from eventos  where id::text like '5eed%';

-- ------------------------------------------------------------
-- Vacantes
-- ------------------------------------------------------------

insert into vacantes (id, empresa_id, titulo, descripcion, tipo, posiciones, creada_en)
select v.id::uuid, e.id, v.titulo, v.descripcion, v.tipo, v.posiciones,
       now() - v.hace::interval
from (values
  -- Nube UY · Tecnología
  ('5eed0001-0000-4000-8000-000000000001', 'Nube UY',
   'Desarrollador/a front-end junior',
   E'Sumate al equipo que construye el panel que usan nuestros clientes todos los días. Vas a trabajar con componentes en React junto a una persona senior que te acompaña los primeros meses.\n\nNo pedimos experiencia laboral: nos alcanza con que hayas armado algo tuyo, aunque sea un proyecto del curso.',
   'empleo', 2, '2 hours'),
  ('5eed0001-0000-4000-8000-000000000002', 'Nube UY',
   'Pasantía en soporte técnico',
   E'Respondés consultas de clientes por chat y correo, y aprendés cómo funciona la plataforma por dentro. Seis meses, 20 horas semanales, compatible con estudiar.',
   'pasantia', 3, '1 day'),
  ('5eed0001-0000-4000-8000-000000000003', 'Nube UY',
   'Analista de datos trainee',
   E'Armás tableros para que los equipos comerciales entiendan qué pasa con sus clientes. Vas a usar SQL todos los días y Power BI para mostrar los resultados.',
   'empleo', 1, '4 days'),

  -- Sur Logística · Logística y transporte
  ('5eed0002-0000-4000-8000-000000000001', 'Sur Logística',
   'Auxiliar de depósito',
   E'Recepción, control y preparación de pedidos en nuestro centro de distribución de Ruta 5. Turno matutino, de lunes a viernes. Te capacitamos en el sistema de gestión de stock.',
   'empleo', 4, '5 hours'),
  ('5eed0002-0000-4000-8000-000000000002', 'Sur Logística',
   'Pasantía en planificación logística',
   E'Ayudás a planificar las rutas de reparto de la semana y a medir cuánto tardan los envíos. Ideal si estudiás ingeniería, administración o una tecnicatura en logística.',
   'pasantia', 1, '2 days'),
  ('5eed0002-0000-4000-8000-000000000003', 'Sur Logística',
   'Atención al cliente para seguimiento de envíos',
   E'Sos la voz de Sur Logística cuando alguien pregunta dónde está su paquete. Registrás cada caso en el CRM y coordinás con el depósito para resolverlo.',
   'empleo', 2, '6 days'),

  -- Clínica Omega · Salud
  ('5eed0003-0000-4000-8000-000000000001', 'Clínica Omega',
   'Recepcionista de policlínica',
   E'Recibís a los pacientes, coordinás agendas y respondés el teléfono en nuestra policlínica de Pocitos. Buscamos a alguien con paciencia y ganas de ayudar.',
   'empleo', 2, '8 hours'),
  ('5eed0003-0000-4000-8000-000000000002', 'Clínica Omega',
   'Pasantía en administración de salud',
   E'Acompañás al equipo de facturación a mutualistas y seguros. Vas a aprender cómo se liquida una consulta de punta a punta.',
   'pasantia', 1, '3 days'),
  ('5eed0003-0000-4000-8000-000000000003', 'Clínica Omega',
   'Asistente de comunicación interna',
   E'Escribís el boletín semanal para el personal, armás piezas para las carteleras y ayudás con las redes de la clínica.',
   'empleo', 1, '9 days'),

  -- Granja La Flor · Agroindustria
  ('5eed0004-0000-4000-8000-000000000001', 'Granja La Flor',
   'Operario/a de producción',
   E'Trabajás en la línea de envasado de dulces y conservas en nuestra planta de Canelones. Hay transporte desde Las Piedras. No hace falta experiencia: te enseñamos todo.',
   'empleo', 5, '12 hours'),
  ('5eed0004-0000-4000-8000-000000000002', 'Granja La Flor',
   'Pasantía en calidad y sustentabilidad',
   E'Medís el consumo de agua y energía de la planta y proponés mejoras. Buscamos estudiantes de ingeniería, agronomía o ciencias ambientales.',
   'pasantia', 2, '5 days'),
  ('5eed0004-0000-4000-8000-000000000003', 'Granja La Flor',
   'Vendedor/a para feria y punto de venta',
   E'Atendés nuestro puesto en las ferias de fin de semana y el local de fábrica. Manejo de caja y mucha buena onda con la gente.',
   'empleo', 2, '7 days'),

  -- Estudio Brecha · Diseño y comunicación
  ('5eed0005-0000-4000-8000-000000000001', 'Estudio Brecha',
   'Diseñador/a gráfico/a junior',
   E'Diseñás piezas para redes, presentaciones e identidades de marcas chicas. Queremos ver tu portfolio: puede ser de trabajos de facultad o propios.',
   'empleo', 1, '3 hours'),
  ('5eed0005-0000-4000-8000-000000000002', 'Estudio Brecha',
   'Pasantía en redes sociales',
   E'Planificás y producís contenido para las cuentas de nuestros clientes: textos, videos cortos y respuestas a la comunidad.',
   'pasantia', 2, '2 days'),
  ('5eed0005-0000-4000-8000-000000000003', 'Estudio Brecha',
   'Asistente de cuentas publicitarias',
   E'Acompañás a los clientes en sus campañas de Meta y Google: armás los reportes, seguís los presupuestos y proponés ajustes.',
   'empleo', 1, '10 days')
) as v(id, empresa, titulo, descripcion, tipo, posiciones, hace)
join empresas e on e.razon_social = v.empresa;

insert into vacante_tags_publicos (vacante_id, tag_id)
select x.vacante::uuid, t.id
from (values
  ('5eed0001-0000-4000-8000-000000000001', 'Tecnología'),
  ('5eed0001-0000-4000-8000-000000000001', 'Sistemas'),
  ('5eed0001-0000-4000-8000-000000000001', 'UX'),
  ('5eed0001-0000-4000-8000-000000000002', 'Soporte Técnico'),
  ('5eed0001-0000-4000-8000-000000000002', 'Atención al Cliente'),
  ('5eed0001-0000-4000-8000-000000000002', 'Tecnología'),
  ('5eed0001-0000-4000-8000-000000000003', 'Datos'),
  ('5eed0001-0000-4000-8000-000000000003', 'Tecnología'),
  ('5eed0001-0000-4000-8000-000000000003', 'Finanzas'),
  ('5eed0002-0000-4000-8000-000000000001', 'Depósito'),
  ('5eed0002-0000-4000-8000-000000000001', 'Logística'),
  ('5eed0002-0000-4000-8000-000000000002', 'Logística'),
  ('5eed0002-0000-4000-8000-000000000002', 'Datos'),
  ('5eed0002-0000-4000-8000-000000000002', 'Administración y Gestión'),
  ('5eed0002-0000-4000-8000-000000000003', 'Atención al Cliente'),
  ('5eed0002-0000-4000-8000-000000000003', 'Logística'),
  ('5eed0002-0000-4000-8000-000000000003', 'Comercio'),
  ('5eed0003-0000-4000-8000-000000000001', 'Salud'),
  ('5eed0003-0000-4000-8000-000000000001', 'Atención al Cliente'),
  ('5eed0003-0000-4000-8000-000000000001', 'Administración y Gestión'),
  ('5eed0003-0000-4000-8000-000000000002', 'Salud'),
  ('5eed0003-0000-4000-8000-000000000002', 'Administración y Gestión'),
  ('5eed0003-0000-4000-8000-000000000002', 'Contabilidad'),
  ('5eed0003-0000-4000-8000-000000000003', 'Comunicación'),
  ('5eed0003-0000-4000-8000-000000000003', 'Salud'),
  ('5eed0003-0000-4000-8000-000000000003', 'Medios'),
  ('5eed0004-0000-4000-8000-000000000001', 'Producción'),
  ('5eed0004-0000-4000-8000-000000000001', 'Agro'),
  ('5eed0004-0000-4000-8000-000000000002', 'Sustentabilidad'),
  ('5eed0004-0000-4000-8000-000000000002', 'Agro'),
  ('5eed0004-0000-4000-8000-000000000002', 'Ingeniería'),
  ('5eed0004-0000-4000-8000-000000000003', 'Ventas'),
  ('5eed0004-0000-4000-8000-000000000003', 'Comercio'),
  ('5eed0004-0000-4000-8000-000000000003', 'Gastronomía'),
  ('5eed0005-0000-4000-8000-000000000001', 'Diseño'),
  ('5eed0005-0000-4000-8000-000000000001', 'Publicidad'),
  ('5eed0005-0000-4000-8000-000000000001', 'Comunicación'),
  ('5eed0005-0000-4000-8000-000000000002', 'Marketing'),
  ('5eed0005-0000-4000-8000-000000000002', 'Medios'),
  ('5eed0005-0000-4000-8000-000000000002', 'Comunicación'),
  ('5eed0005-0000-4000-8000-000000000003', 'Publicidad'),
  ('5eed0005-0000-4000-8000-000000000003', 'Marketing'),
  ('5eed0005-0000-4000-8000-000000000003', 'Ventas')
) as x(vacante, nombre)
join tags t on t.nombre = x.nombre;

insert into vacante_habilidades (vacante_id, habilidad_id)
select x.vacante::uuid, h.id
from (values
  ('5eed0001-0000-4000-8000-000000000001', 'Desarrollo web (HTML, CSS, JavaScript)'),
  ('5eed0001-0000-4000-8000-000000000001', 'Figma'),
  ('5eed0001-0000-4000-8000-000000000001', 'Trabajo en equipo'),
  ('5eed0001-0000-4000-8000-000000000001', 'Inglés'),
  ('5eed0001-0000-4000-8000-000000000002', 'Atención al público'),
  ('5eed0001-0000-4000-8000-000000000002', 'Google Workspace / Office'),
  ('5eed0001-0000-4000-8000-000000000002', 'Redacción y ortografía'),
  ('5eed0001-0000-4000-8000-000000000003', 'SQL'),
  ('5eed0001-0000-4000-8000-000000000003', 'Excel y Google Sheets'),
  ('5eed0001-0000-4000-8000-000000000003', 'Power BI'),
  ('5eed0001-0000-4000-8000-000000000003', 'Python'),
  ('5eed0002-0000-4000-8000-000000000001', 'Organización y planificación'),
  ('5eed0002-0000-4000-8000-000000000001', 'Trabajo en equipo'),
  ('5eed0002-0000-4000-8000-000000000001', 'Excel y Google Sheets'),
  ('5eed0002-0000-4000-8000-000000000002', 'Excel y Google Sheets'),
  ('5eed0002-0000-4000-8000-000000000002', 'Power BI'),
  ('5eed0002-0000-4000-8000-000000000002', 'Organización y planificación'),
  ('5eed0002-0000-4000-8000-000000000003', 'Atención al público'),
  ('5eed0002-0000-4000-8000-000000000003', 'CRM (Salesforce o HubSpot)'),
  ('5eed0002-0000-4000-8000-000000000003', 'Redacción y ortografía'),
  ('5eed0003-0000-4000-8000-000000000001', 'Atención al público'),
  ('5eed0003-0000-4000-8000-000000000001', 'Google Workspace / Office'),
  ('5eed0003-0000-4000-8000-000000000001', 'Organización y planificación'),
  ('5eed0003-0000-4000-8000-000000000002', 'Contabilidad básica y facturación'),
  ('5eed0003-0000-4000-8000-000000000002', 'Excel y Google Sheets'),
  ('5eed0003-0000-4000-8000-000000000003', 'Redacción y ortografía'),
  ('5eed0003-0000-4000-8000-000000000003', 'Canva'),
  ('5eed0003-0000-4000-8000-000000000003', 'Manejo de redes sociales'),
  ('5eed0004-0000-4000-8000-000000000001', 'Trabajo en equipo'),
  ('5eed0004-0000-4000-8000-000000000001', 'Organización y planificación'),
  ('5eed0004-0000-4000-8000-000000000002', 'Excel y Google Sheets'),
  ('5eed0004-0000-4000-8000-000000000002', 'Redacción y ortografía'),
  ('5eed0004-0000-4000-8000-000000000002', 'Organización y planificación'),
  ('5eed0004-0000-4000-8000-000000000003', 'Caja y punto de venta (POS)'),
  ('5eed0004-0000-4000-8000-000000000003', 'Atención al público'),
  ('5eed0005-0000-4000-8000-000000000001', 'Figma'),
  ('5eed0005-0000-4000-8000-000000000001', 'Canva'),
  ('5eed0005-0000-4000-8000-000000000001', 'Trabajo en equipo'),
  ('5eed0005-0000-4000-8000-000000000002', 'Manejo de redes sociales'),
  ('5eed0005-0000-4000-8000-000000000002', 'Edición de video (CapCut o Premiere)'),
  ('5eed0005-0000-4000-8000-000000000002', 'Redacción y ortografía'),
  ('5eed0005-0000-4000-8000-000000000003', 'Publicidad digital (Meta Ads, Google Ads)'),
  ('5eed0005-0000-4000-8000-000000000003', 'CRM (Salesforce o HubSpot)'),
  ('5eed0005-0000-4000-8000-000000000003', 'Inglés')
) as x(vacante, nombre)
join habilidades h on h.nombre = x.nombre;

-- Tags ocultos (RF3.1.6): los usa el matching de la empresa y nunca llegan al
-- postulante. Se cargan para poder comprobar, con datos, que siguen cerrados.
insert into vacante_tags_ocultos (vacante_id, tag_id)
select x.vacante::uuid, t.id
from (values
  ('5eed0001-0000-4000-8000-000000000001', 'Inteligencia Artificial'),
  ('5eed0001-0000-4000-8000-000000000002', 'Sistemas'),
  ('5eed0001-0000-4000-8000-000000000003', 'Ingeniería'),
  ('5eed0002-0000-4000-8000-000000000001', 'Producción'),
  ('5eed0002-0000-4000-8000-000000000002', 'Ingeniería'),
  ('5eed0002-0000-4000-8000-000000000003', 'Ventas'),
  ('5eed0003-0000-4000-8000-000000000001', 'Cuidados'),
  ('5eed0003-0000-4000-8000-000000000002', 'Finanzas'),
  ('5eed0003-0000-4000-8000-000000000003', 'Recursos Humanos'),
  ('5eed0004-0000-4000-8000-000000000001', 'Sustentabilidad'),
  ('5eed0004-0000-4000-8000-000000000002', 'Datos'),
  ('5eed0004-0000-4000-8000-000000000003', 'Atención al Cliente'),
  ('5eed0005-0000-4000-8000-000000000001', 'UX'),
  ('5eed0005-0000-4000-8000-000000000002', 'Publicidad'),
  ('5eed0005-0000-4000-8000-000000000003', 'Datos')
) as x(vacante, nombre)
join tags t on t.nombre = x.nombre;

-- ------------------------------------------------------------
-- Eventos
-- ------------------------------------------------------------

insert into eventos (id, empresa_id, titulo, descripcion, fecha_hora)
select v.id::uuid, e.id, v.titulo, v.descripcion,
       date_trunc('day', now() at time zone 'America/Montevideo')
         at time zone 'America/Montevideo' + v.en::interval
from (values
  ('5eed0101-0000-4000-8000-000000000001', 'Nube UY',
   'Taller: tu primer repositorio en GitHub',
   'Traé tu computadora y salí con un proyecto publicado. Pensado para quien nunca usó Git.',
   '4 days 18 hours 30 minutes'),
  ('5eed0101-0000-4000-8000-000000000002', 'Nube UY',
   'Cómo es un día trabajando como desarrollador junior',
   'Tres personas que entraron el año pasado cuentan qué hacen, qué les costó y qué les hubiera gustado saber.',
   '18 days 19 hours'),
  ('5eed0102-0000-4000-8000-000000000001', 'Sur Logística',
   'Visita guiada al centro de distribución',
   'Recorremos el depósito de Ruta 5 y te mostramos cómo sale un pedido. Cupos limitados, con transporte desde Tres Cruces.',
   '9 days 10 hours'),
  ('5eed0103-0000-4000-8000-000000000001', 'Clínica Omega',
   'Trabajar en salud sin ser médico',
   'Jornada de orientación sobre los puestos administrativos, de atención y de comunicación dentro de una clínica.',
   '6 days 18 hours'),
  ('5eed0103-0000-4000-8000-000000000002', 'Clínica Omega',
   'Taller abierto de primeros auxilios',
   'Dos horas prácticas con el equipo de enfermería. Te llevás un certificado de asistencia.',
   '25 days 17 hours'),
  ('5eed0104-0000-4000-8000-000000000001', 'Granja La Flor',
   'Feria de empleo rural en Canelones',
   'Empresas de la zona buscan gente para la temporada. Llevá tu cédula; el perfil de LinkYouth alcanza como carta de presentación.',
   '13 days 10 hours'),
  ('5eed0105-0000-4000-8000-000000000001', 'Estudio Brecha',
   'Taller de portfolio para quienes recién empiezan',
   'Revisamos portfolios en vivo y te damos una devolución concreta. Podés traer trabajos de facultad.',
   '11 days 19 hours'),
  ('5eed0105-0000-4000-8000-000000000002', 'Estudio Brecha',
   'Redes sociales para marcas chicas',
   'Charla práctica sobre cómo planificar un mes de contenido con poco presupuesto.',
   '32 days 19 hours')
) as v(id, empresa, titulo, descripcion, en)
join empresas e on e.razon_social = v.empresa;

insert into evento_tags (evento_id, tag_id)
select x.evento::uuid, t.id
from (values
  ('5eed0101-0000-4000-8000-000000000001', 'Tecnología'),
  ('5eed0101-0000-4000-8000-000000000001', 'Sistemas'),
  ('5eed0101-0000-4000-8000-000000000001', 'Educación y Enseñanza'),
  ('5eed0101-0000-4000-8000-000000000002', 'Tecnología'),
  ('5eed0101-0000-4000-8000-000000000002', 'UX'),
  ('5eed0102-0000-4000-8000-000000000001', 'Logística'),
  ('5eed0102-0000-4000-8000-000000000001', 'Depósito'),
  ('5eed0103-0000-4000-8000-000000000001', 'Salud'),
  ('5eed0103-0000-4000-8000-000000000001', 'Administración y Gestión'),
  ('5eed0103-0000-4000-8000-000000000001', 'Cuidados'),
  ('5eed0103-0000-4000-8000-000000000002', 'Salud'),
  ('5eed0103-0000-4000-8000-000000000002', 'Cuidados'),
  ('5eed0104-0000-4000-8000-000000000001', 'Agro'),
  ('5eed0104-0000-4000-8000-000000000001', 'Producción'),
  ('5eed0104-0000-4000-8000-000000000001', 'Sustentabilidad'),
  ('5eed0105-0000-4000-8000-000000000001', 'Diseño'),
  ('5eed0105-0000-4000-8000-000000000001', 'Publicidad'),
  ('5eed0105-0000-4000-8000-000000000002', 'Marketing'),
  ('5eed0105-0000-4000-8000-000000000002', 'Medios')
) as x(evento, nombre)
join tags t on t.nombre = x.nombre;

-- Control: si falta una empresa o un nombre del catálogo, la carga queda
-- incompleta sin error. Esto lo hace visible.
select
  (select count(*) from vacantes              where id::text like '5eed%') as vacantes,        -- 15
  (select count(*) from vacante_tags_publicos where vacante_id::text like '5eed%') as tags_pub, -- 43
  (select count(*) from vacante_habilidades   where vacante_id::text like '5eed%') as habilid,  -- 44
  (select count(*) from vacante_tags_ocultos  where vacante_id::text like '5eed%') as ocultos,  -- 15
  (select count(*) from eventos               where id::text like '5eed%') as eventos,         -- 8
  (select count(*) from evento_tags           where evento_id::text like '5eed%') as ev_tags;  -- 19
