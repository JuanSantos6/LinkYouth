-- ============================================================
-- LinkYouth — Datos iniciales de catálogo (versión definitiva v3)
-- Ejecutar en: Supabase Dashboard > SQL Editor, después de
-- schema.sql y politicas.sql.
--
-- Si ya corriste una versión anterior de este seed, el bloque de
-- limpieza borra los nombres de las dos versiones previas antes
-- de insertar la definitiva. Seguro de correr aunque las tablas
-- estén vacías.
-- ============================================================

-- ============================================================
-- LIMPIEZA (nombres de las dos versiones anteriores del seed)
-- ============================================================

delete from tags where nombre in (
  -- versión 1 (sin agrupar)
  'Tecnología', 'Inteligencia Artificial', 'Desarrollo de Software',
  'Ciencia de Datos', 'Ciberseguridad', 'Diseño', 'Marketing',
  'Finanzas', 'Administración de Empresas', 'Contabilidad', 'Derecho',
  'Ingeniería', 'Arquitectura', 'Salud', 'Educación', 'Comunicación',
  'Ventas', 'Logística', 'Sustentabilidad',
  -- versión 2 (agrupada de a pares)
  'Tecnología y Sistemas', 'Datos e Inteligencia Artificial',
  'Diseño y UX', 'Marketing y Publicidad', 'Comunicación y Medios',
  'Ventas y Comercio', 'Atención al Cliente y Soporte',
  'Administración y Gestión', 'Contabilidad y Finanzas',
  'Logística y Depósito', 'Ingeniería y Producción',
  'Construcción y Arquitectura', 'Salud y Cuidados',
  'Educación y Enseñanza', 'Derecho y Legal',
  'Gastronomía y Hotelería', 'Turismo y Eventos',
  'Deporte y Recreación', 'Agro y Sustentabilidad'
);

delete from habilidades where nombre in (
  'JavaScript', 'TypeScript', 'Java', 'HTML y CSS', 'React',
  'Photoshop', 'Illustrator', 'Git', 'SAP', 'WordPress',
  'Google Ads', 'Gestión de proyectos', 'Redacción', 'Edición de video'
);

-- ============================================================
-- TAGS (intereses) — RF2.3, RF1.1.11
-- 36 tags. Los pares que representaban intereses genuinamente
-- distintos (ej. Contabilidad / Finanzas) quedaron separados;
-- los que eran el mismo concepto con dos nombres (ej. Derecho y
-- Legal) se mantienen juntos.
-- ============================================================

insert into tags (nombre) values
  -- Tech y datos
  ('Tecnología'),
  ('Sistemas'),
  ('Datos'),
  ('Inteligencia Artificial'),
  -- Creativos y comunicación
  ('Diseño'),
  ('UX'),
  ('Marketing'),
  ('Publicidad'),
  ('Comunicación'),
  ('Medios'),
  -- Comerciales
  ('Ventas'),
  ('Comercio'),
  ('Atención al Cliente'),
  ('Soporte Técnico'),
  -- Oficina y negocios
  ('Administración y Gestión'),
  ('Contabilidad'),
  ('Finanzas'),
  ('Recursos Humanos'),
  ('Logística'),
  ('Depósito'),
  -- Técnicos y obra
  ('Ingeniería'),
  ('Producción'),
  ('Construcción'),
  ('Arquitectura'),
  -- Personas y sociedad
  ('Salud'),
  ('Cuidados'),
  ('Educación y Enseñanza'),
  ('Derecho y Legal'),
  -- Servicios y experiencias
  ('Gastronomía'),
  ('Hotelería'),
  ('Turismo'),
  ('Eventos'),
  ('Deporte'),
  ('Recreación'),
  ('Agro'),
  ('Sustentabilidad')
on conflict (nombre) do nothing;

-- ============================================================
-- HABILIDADES (conocimientos técnicos) — RF2.4.3, RF2.4.4
-- Sin cambios respecto a la versión anterior: 20 herramientas
-- y competencias, agrupadas por tipo.
-- ============================================================

insert into habilidades (nombre) values
  -- Herramientas de oficina
  ('Excel y Google Sheets'),
  ('Google Workspace / Office'),
  ('Canva'),
  ('Figma'),
  ('Edición de video (CapCut o Premiere)'),
  ('Power BI'),
  ('CRM (Salesforce o HubSpot)'),
  ('AutoCAD y lectura de planos'),
  -- Técnicas
  ('Desarrollo web (HTML, CSS, JavaScript)'),
  ('Python'),
  ('SQL'),
  -- Aplicadas
  ('Manejo de redes sociales'),
  ('Publicidad digital (Meta Ads, Google Ads)'),
  ('Atención al público'),
  ('Caja y punto de venta (POS)'),
  ('Contabilidad básica y facturación'),
  ('Redacción y ortografía'),
  -- Idioma
  ('Inglés'),
  -- Blandas
  ('Trabajo en equipo'),
  ('Organización y planificación')
on conflict (nombre) do nothing;
