-- ============================================================
-- LinkYouth — Usuarios de prueba
-- Ejecutar en: Supabase Dashboard > SQL Editor, después de
-- schema.sql, politicas.sql y seed.sql. Si la base es anterior a la
-- columna `empresas.rut`, corré antes db/migraciones/001-empresas-rut.sql.
--
-- Crea 5 cuentas de postulante y 5 de empresa, con contraseña conocida,
-- para poder probar el inicio de sesión a mano.
--
-- ⚠ ESTE ARCHIVO NO VA A UN PROYECTO DE PRODUCCIÓN.
-- Las contraseñas son públicas: están en `docs/usuarios-prueba.md` y en el
-- historial de git. Cualquiera que lea el repositorio entra con ellas. Es
-- aceptable en un proyecto de desarrollo con datos inventados, y es
-- inaceptable en cuanto haya una persona real registrada.
--
-- ⚠ ESCRIBE DIRECTO EN `auth.users`.
-- Es el esquema interno de Supabase Auth: no es una API estable y la forma
-- de sus filas puede cambiar entre versiones. La alternativa soportada es
-- la Admin API (`supabase.auth.admin.createUser`) desde un script con la
-- clave `service_role`, que no se puede correr desde el SQL Editor. Se
-- eligió el SQL porque el pedido era un script para pegar en el panel.
--
-- Es idempotente: los ids son fijos y todos los inserts ignoran el
-- conflicto. Correrlo dos veces no duplica nada.
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- 1. Cuentas de autenticación
--
-- `encrypted_password` usa bcrypt con `gen_salt('bf')`, que es lo que
-- espera GoTrue. `email_confirmed_at` viene con fecha para saltear la
-- confirmación por correo: sin eso, estas cuentas no podrían iniciar
-- sesión hasta confirmar un correo que nadie va a recibir.
-- ============================================================

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-000000000001', 'authenticated', 'authenticated', 'sofia.prueba@linkyouth.dev',  crypt('LinkYouth2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-000000000002', 'authenticated', 'authenticated', 'mateo.prueba@linkyouth.dev',  crypt('LinkYouth2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-000000000003', 'authenticated', 'authenticated', 'valentina.prueba@linkyouth.dev', crypt('LinkYouth2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-000000000004', 'authenticated', 'authenticated', 'joaquin.prueba@linkyouth.dev', crypt('LinkYouth2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-000000000005', 'authenticated', 'authenticated', 'camila.prueba@linkyouth.dev',  crypt('LinkYouth2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-000000000001', 'authenticated', 'authenticated', 'rrhh@nube-uy.dev',            crypt('Empresa2026!', gen_salt('bf')),   now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-000000000002', 'authenticated', 'authenticated', 'talento@surlogistica.dev',    crypt('Empresa2026!', gen_salt('bf')),   now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-000000000003', 'authenticated', 'authenticated', 'personas@clinicaomega.dev',   crypt('Empresa2026!', gen_salt('bf')),   now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-000000000004', 'authenticated', 'authenticated', 'empleos@granjalaflor.dev',    crypt('Empresa2026!', gen_salt('bf')),   now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-000000000005', 'authenticated', 'authenticated', 'rrhh@estudiobrecha.dev',      crypt('Empresa2026!', gen_salt('bf')),   now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}')
on conflict (id) do nothing;

-- ============================================================
-- 2. Identidades
--
-- GoTrue busca una identidad del proveedor `email` para resolver el login
-- con contraseña. Sin esta tabla, el usuario existe pero la aplicación
-- responde «credenciales inválidas» con la contraseña correcta.
-- ============================================================

insert into auth.identities (
  id, user_id, provider_id, provider, identity_data, created_at, updated_at, last_sign_in_at
)
select
  u.id, u.id, u.id::text, 'email',
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  now(), now(), now()
from auth.users u
where u.email like '%.prueba@linkyouth.dev'
   or u.email in (
     'rrhh@nube-uy.dev', 'talento@surlogistica.dev', 'personas@clinicaomega.dev',
     'empleos@granjalaflor.dev', 'rrhh@estudiobrecha.dev'
   )
on conflict (provider_id, provider) do nothing;

-- ============================================================
-- 3. Cuentas de LinkYouth
--
-- El orden importa: el disparador `validar_tipo_cuenta` exige que la fila
-- de `cuentas` exista con el tipo correcto antes de aceptar la de
-- `perfiles` o `empresas`.
-- ============================================================

insert into cuentas (id, tipo) values
  ('11111111-1111-4111-8111-000000000001', 'individual'),
  ('11111111-1111-4111-8111-000000000002', 'individual'),
  ('11111111-1111-4111-8111-000000000003', 'individual'),
  ('11111111-1111-4111-8111-000000000004', 'individual'),
  ('11111111-1111-4111-8111-000000000005', 'individual'),
  ('22222222-2222-4222-8222-000000000001', 'empresa'),
  ('22222222-2222-4222-8222-000000000002', 'empresa'),
  ('22222222-2222-4222-8222-000000000003', 'empresa'),
  ('22222222-2222-4222-8222-000000000004', 'empresa'),
  ('22222222-2222-4222-8222-000000000005', 'empresa')
on conflict (id) do nothing;

-- ============================================================
-- 4. Perfiles
--
-- Las fechas de nacimiento se calculan contra `current_date` para que el
-- check `perfiles_mayor_de_edad` siga pasando dentro de cinco años. Una
-- fecha fija haría que el seed dejara de funcionar sin que nadie entienda
-- por qué.
-- ============================================================

insert into perfiles (id, nombre_usuario, nombre, apellido, fecha_nacimiento, pais, bio) values
  ('11111111-1111-4111-8111-000000000001', 'sofia_prueba', 'Sofía', 'Methol',
   (current_date - interval '21 years')::date, 'Uruguay',
   'Estudio Ingeniería en Computación y armo interfaces con React. Busco mi primera experiencia en un equipo de producto.'),
  ('11111111-1111-4111-8111-000000000002', 'mateo_prueba', 'Mateo', 'Silveira',
   (current_date - interval '19 years')::date, 'Uruguay',
   'Terminé Jóvenes a Programar y sigo con front-end por mi cuenta. Me interesa el diseño de interfaces.'),
  ('11111111-1111-4111-8111-000000000003', 'valentina_prueba', 'Valentina', 'Rocha',
   (current_date - interval '23 years')::date, 'Uruguay',
   'Estudiante de Contabilidad. Me gusta el trabajo con datos y las planillas bien hechas.'),
  ('11111111-1111-4111-8111-000000000004', 'joaquin_prueba', 'Joaquín', 'Barreiro',
   (current_date - interval '20 years')::date, 'Uruguay',
   'Vengo de atención al público y quiero pasarme a soporte técnico.'),
  ('11111111-1111-4111-8111-000000000005', 'camila_prueba', 'Camila', 'Ferreira',
   (current_date - interval '22 years')::date, 'Uruguay',
   'Estudio Diseño de Comunicación Visual. Trabajo con Figma todos los días.')
on conflict (id) do nothing;

-- ============================================================
-- 5. Empresas
-- ============================================================

insert into empresas (id, razon_social, rut, rubro, descripcion) values
  ('22222222-2222-4222-8222-000000000001', 'Nube UY', '210001230011', 'Tecnología',
   'Fábrica de software uruguaya. Tomamos perfiles junior con acompañamiento de un referente técnico.'),
  ('22222222-2222-4222-8222-000000000002', 'Sur Logística', '210002340012', 'Logística y transporte',
   'Operador logístico con depósitos en Montevideo y Canelones.'),
  ('22222222-2222-4222-8222-000000000003', 'Clínica Omega', '210003450013', 'Salud',
   'Centro de salud privado. Buscamos perfiles administrativos y de atención al paciente.'),
  ('22222222-2222-4222-8222-000000000004', 'Granja La Flor', '210004560014', 'Agroindustria',
   'Producción y distribución de alimentos frescos. Primera experiencia laboral formal.'),
  ('22222222-2222-4222-8222-000000000005', 'Estudio Brecha', '210005670015', 'Diseño y comunicación',
   'Estudio de diseño gráfico y comunicación institucional.')
on conflict (id) do nothing;

-- ============================================================
-- 6. Formación e intereses de los perfiles
--
-- Sin esto los perfiles quedan vacíos y el feed no tiene nada que comparar:
-- la compatibilidad de toda vacante daría 0 % y el listado se vería roto
-- sin estarlo.
-- ============================================================

insert into formaciones (perfil_id, institucion, titulo, estado)
select v.perfil_id, v.institucion, v.titulo, v.estado
from (values
  ('11111111-1111-4111-8111-000000000001'::uuid, 'Universidad de la República', 'Ingeniería en Computación', 'en_curso'),
  ('11111111-1111-4111-8111-000000000002'::uuid, 'Plan Ceibal — Jóvenes a Programar', 'Desarrollo web front-end', 'finalizado'),
  ('11111111-1111-4111-8111-000000000003'::uuid, 'Universidad de la República', 'Contador Público', 'en_curso'),
  ('11111111-1111-4111-8111-000000000004'::uuid, 'UTU — Consejo de Educación Técnico Profesional', 'Bachillerato tecnológico en Informática', 'finalizado'),
  ('11111111-1111-4111-8111-000000000005'::uuid, 'Universidad ORT Uruguay', 'Diseño de Comunicación Visual', 'en_curso')
) as v(perfil_id, institucion, titulo, estado)
-- `formaciones` no tiene restricción única, así que `on conflict` no
-- alcanza: sin este guardia, correr el script dos veces duplica los
-- estudios de cada perfil.
where not exists (
  select 1 from formaciones f
  where f.perfil_id = v.perfil_id and f.titulo = v.titulo
);

-- Cinco intereses por perfil: es el mínimo que pide RF1.1.11.
insert into perfil_tags (perfil_id, tag_id)
select p.id, t.id
from (values
  ('11111111-1111-4111-8111-000000000001'::uuid,
   array['Tecnología', 'Sistemas', 'Datos', 'Inteligencia Artificial', 'Ingeniería']),
  ('11111111-1111-4111-8111-000000000002'::uuid,
   array['Tecnología', 'Sistemas', 'Diseño', 'UX', 'Soporte Técnico']),
  ('11111111-1111-4111-8111-000000000003'::uuid,
   array['Contabilidad', 'Finanzas', 'Administración y Gestión', 'Datos', 'Recursos Humanos']),
  ('11111111-1111-4111-8111-000000000004'::uuid,
   array['Atención al Cliente', 'Ventas', 'Logística', 'Depósito', 'Tecnología']),
  ('11111111-1111-4111-8111-000000000005'::uuid,
   array['Diseño', 'Marketing', 'Comunicación', 'Publicidad', 'Medios'])
) as p(id, nombres)
join tags t on t.nombre = any (p.nombres)
on conflict do nothing;

-- Habilidades declaradas (RF2.4.3). Los nombres son los del catálogo de
-- db/seed.sql: si no coinciden exactamente, el join no trae nada y el
-- perfil queda sin habilidades sin que nadie se entere.
insert into perfil_habilidades (perfil_id, habilidad_id)
select p.id, h.id
from (values
  ('11111111-1111-4111-8111-000000000001'::uuid,
   array['Desarrollo web (HTML, CSS, JavaScript)', 'Python', 'SQL', 'Inglés', 'Trabajo en equipo']),
  ('11111111-1111-4111-8111-000000000002'::uuid,
   array['Desarrollo web (HTML, CSS, JavaScript)', 'Figma', 'Canva', 'Inglés']),
  ('11111111-1111-4111-8111-000000000003'::uuid,
   array['Excel y Google Sheets', 'Contabilidad básica y facturación', 'SQL', 'Organización y planificación']),
  ('11111111-1111-4111-8111-000000000004'::uuid,
   array['Atención al público', 'Caja y punto de venta (POS)', 'Google Workspace / Office', 'Trabajo en equipo']),
  ('11111111-1111-4111-8111-000000000005'::uuid,
   array['Figma', 'Canva', 'Edición de video (CapCut o Premiere)', 'Manejo de redes sociales', 'Publicidad digital (Meta Ads, Google Ads)'])
) as p(id, nombres)
join habilidades h on h.nombre = any (p.nombres)
on conflict do nothing;
