#!/usr/bin/env node
/**
 * Paso 4 de 4, en segundo plano: avisar a Unsplash cada foto que se usa.
 *
 *   nohup node scripts/fotos/avisar-descargas.mjs \
 *     > ~/.cache/linkyouth-fotos/avisos.log 2>&1 &
 *
 * Sus directrices piden llamar al `download_location` de cada foto cuando la
 * aplicación la empieza a usar. No bloquea nada: las fotos ya se ven (las
 * cargó `cargar.mjs`) y esto solo registra el uso. Va de a una, respeta el
 * límite (si se agota, espera a la hora siguiente) y anota la fecha en
 * `fotos.json` y en `fotos.descarga_avisada_en`, así una corrida cortada
 * sigue donde quedó y una foto nunca se avisa dos veces.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

import { pedir } from "./unsplash.mjs";

const AQUI = dirname(fileURLToPath(import.meta.url));
const FOTOS = join(AQUI, "fotos.json");
process.loadEnvFile(join(AQUI, "..", "..", ".env.local"));
const db = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const archivo = JSON.parse(readFileSync(FOTOS, "utf8"));
const pendientes = archivo.fotos.filter((f) => !f.descarga_avisada_en);
console.log(`${pendientes.length} descargas para avisar.`);

for (const foto of pendientes) {
  const { quedan } = await pedir(foto.descarga, { esperar: true });
  foto.descarga_avisada_en = new Date().toISOString();
  writeFileSync(FOTOS, JSON.stringify(archivo, null, 2) + "\n");
  const { error } = await db
    .from("fotos")
    .update({ descarga_avisada_en: foto.descarga_avisada_en })
    .eq("unsplash_id", foto.unsplash_id);
  console.log(
    `✓ ${foto.unsplash_id} (${foto.autor})${error ? ` — no se anotó en la base: ${error.message}` : ""} · quedan ${quedan}`,
  );
}
console.log("Listo: todas las descargas avisadas.");
