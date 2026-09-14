-- ============================================================
-- LinkYouth — Datos iniciales de catálogo
-- Ejecutar en: Supabase Dashboard > SQL Editor, después de
-- schema.sql y politicas.sql.
--
-- Son inserts puros con `on conflict (nombre) do nothing`: agregan lo que
-- falta y no tocan lo que ya está. Correrlo de nuevo es seguro y no tiene
-- efecto sobre las filas existentes.
--
-- ESTE ARCHIVO NUNCA BORRA FILAS DE `tags` NI DE `habilidades`.
-- Las cuatro tablas puente que las referencian —perfil_tags,
-- vacante_tags_publicos, vacante_tags_ocultos y evento_tags— lo hacen
-- `on delete cascade`. Un `delete` acá borraría en silencio los intereses
-- elegidos por cada perfil, las habilidades de cada vacante y los tags
-- ocultos que sostienen el matching de RF3.9, sin dejar rastro de qué se
-- perdió.
--
-- Si hay que renombrar o quitar un valor del catálogo, se hace con una
-- sentencia aparte, revisada a mano y con el impacto en las tablas puente
-- verificado antes de ejecutarla. Nunca desde este archivo.
-- ============================================================

-- ============================================================
-- TAGS (intereses) — RF2.3, RF1.1.11
-- 36 tags. Los intereses genuinamente distintos van separados
-- (ej. Contabilidad / Finanzas); los que son el mismo concepto con
-- dos nombres van juntos (ej. Derecho y Legal).
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
-- 20 herramientas y competencias, agrupadas por tipo.
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
