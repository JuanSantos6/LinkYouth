#!/usr/bin/env node
/**
 * Borra de `pendientes` (migración 012) las imágenes de registros que no
 * llegaron a completarse:
 *
 * - la cuenta ya no existe;
 * - la cuenta confirmó el correo y la imagen sigue ahí más de 1 día (el alta
 *   la mueve al confirmar; si quedó, o falló o ya no sirve);
 * - la cuenta nunca confirmó y pasaron más de 7 días.
 *
 *   node scripts/mantenimiento/limpiar-imagenes-pendientes.mjs [--simular]
 *
 * Corre todos los días desde el crontab (`15 4 * * *`). `--simular` solo
 * muestra qué borraría.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
process.loadEnvFile(join(RAIZ, ".env.local"));

const BUCKET = "pendientes";
const DIA = 24 * 3600 * 1000;
const simular = process.argv.includes("--simular");

const db = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const { data: carpetas, error } = await db.storage
  .from(BUCKET)
  .list("", { limit: 1000 });
if (error) {
  console.error(`✗ No se pudo listar «${BUCKET}»: ${error.message}`);
  process.exit(1);
}

let borradas = 0;
let quedan = 0;
for (const carpeta of carpetas) {
  const { data: objetos } = await db.storage.from(BUCKET).list(carpeta.name);
  if (!objetos?.length) continue;

  const desde = Math.min(
    ...objetos.map((o) => Date.parse(o.created_at ?? o.updated_at)),
  );
  const edad = Date.now() - desde;
  const { data } = await db.auth.admin.getUserById(carpeta.name);
  const usuario = data?.user;

  let motivo = null;
  if (!usuario) motivo = "la cuenta ya no existe";
  else if (usuario.email_confirmed_at && edad > DIA)
    motivo = "confirmada y sin mover hace más de 1 día";
  else if (!usuario.email_confirmed_at && edad > 7 * DIA)
    motivo = "sin confirmar hace más de 7 días";

  if (!motivo) {
    quedan++;
    continue;
  }
  console.log(`${simular ? "borraría" : "borro"} ${carpeta.name}: ${motivo}`);
  if (!simular) {
    await db.storage
      .from(BUCKET)
      .remove(objetos.map((o) => `${carpeta.name}/${o.name}`));
  }
  borradas++;
}

console.log(
  `${new Date().toISOString()} · ${simular ? "a borrar" : "borradas"}: ${borradas} · esperando confirmación: ${quedan}`,
);
