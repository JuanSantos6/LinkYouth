/**
 * Crea los diez usuarios de prueba con la Admin API de Supabase.
 *
 * Es la alternativa a `db/seed-usuarios-prueba.sql`, y la preferible: el
 * script SQL escribe directo en `auth.users`, que es el esquema interno de
 * GoTrue y no una API estable. Acá se usa el camino soportado.
 *
 *   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/crear-usuarios-prueba.mjs
 *
 * La clave `service_role` saltea RLS por completo. Va en la línea de comando o
 * en `.env.local` — nunca en el código, nunca en el navegador, nunca en una
 * variable `NEXT_PUBLIC_`.
 *
 * Deja las cuentas creadas y confirmadas. Las filas de `cuentas`, `perfiles`,
 * `empresas`, `formaciones`, `perfil_tags` y `perfil_habilidades` las sigue
 * poniendo `db/seed-usuarios-prueba.sql`: los ids son los mismos y sus
 * inserts en `auth` no hacen nada si el usuario ya existe.
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !clave) {
  console.error(
    "Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.\n" +
      "La service_role está en Supabase Dashboard > Project Settings > API.",
  );
  process.exit(1);
}

const CLAVE_JOVEN = "LinkYouth2026!";
const CLAVE_EMPRESA = "Empresa2026!";

/** Los mismos ids que usa db/seed-usuarios-prueba.sql. */
const USUARIOS = [
  [
    "11111111-1111-4111-8111-000000000001",
    "sofia.prueba@linkyouth.dev",
    CLAVE_JOVEN,
  ],
  [
    "11111111-1111-4111-8111-000000000002",
    "mateo.prueba@linkyouth.dev",
    CLAVE_JOVEN,
  ],
  [
    "11111111-1111-4111-8111-000000000003",
    "valentina.prueba@linkyouth.dev",
    CLAVE_JOVEN,
  ],
  [
    "11111111-1111-4111-8111-000000000004",
    "joaquin.prueba@linkyouth.dev",
    CLAVE_JOVEN,
  ],
  [
    "11111111-1111-4111-8111-000000000005",
    "camila.prueba@linkyouth.dev",
    CLAVE_JOVEN,
  ],
  ["22222222-2222-4222-8222-000000000001", "rrhh@nube-uy.dev", CLAVE_EMPRESA],
  [
    "22222222-2222-4222-8222-000000000002",
    "talento@surlogistica.dev",
    CLAVE_EMPRESA,
  ],
  [
    "22222222-2222-4222-8222-000000000003",
    "personas@clinicaomega.dev",
    CLAVE_EMPRESA,
  ],
  [
    "22222222-2222-4222-8222-000000000004",
    "empleos@granjalaflor.dev",
    CLAVE_EMPRESA,
  ],
  [
    "22222222-2222-4222-8222-000000000005",
    "rrhh@estudiobrecha.dev",
    CLAVE_EMPRESA,
  ],
];

const supabase = createClient(url, clave, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let creados = 0;
let existentes = 0;

for (const [id, email, password] of USUARIOS) {
  const { error } = await supabase.auth.admin.createUser({
    id,
    email,
    password,
    email_confirm: true,
  });

  // Correr el script dos veces no es un error: la segunda vez los usuarios ya
  // están y eso es exactamente lo que se quería.
  if (error?.message.match(/already (been )?registered|already exists/i)) {
    existentes += 1;
    console.log(`ya existía  ${email}`);
    continue;
  }

  if (error) {
    console.error(`falló      ${email}: ${error.message}`);
    process.exitCode = 1;
    continue;
  }

  creados += 1;
  console.log(`creado      ${email}`);
}

console.log(`\n${creados} creados, ${existentes} ya existían.`);
console.log(
  "Falta el resto: corré db/seed-usuarios-prueba.sql en el SQL Editor para\n" +
    "las filas de cuentas, perfiles, empresas, formaciones e intereses.",
);
