/**
 * Lo que comparten los scripts de fotos: la clave de la API, las llamadas con
 * su límite y la carpeta de trabajo.
 *
 * La clave vive en ~/.linkyouth-unsplash (`UNSPLASH_ACCESS_KEY=…`), fuera del
 * repositorio. Solo la usan estos scripts, del lado del servidor: la
 * aplicación nunca habla con la API (lee de la base lo que eligieron).
 * Nunca se imprime.
 *
 * La demo tiene 50 consultas por hora. La búsqueda gasta una por categoría
 * (cinco) y no espera nunca; los avisos de descarga, una por foto, corren
 * después en segundo plano y esos sí esperan a la hora siguiente si hace
 * falta. Las búsquedas quedan guardadas en la carpeta de trabajo, así volver
 * a correr no gasta consultas.
 */
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const API = "https://api.unsplash.com";
export const TRABAJO =
  process.env.FOTOS_TRABAJO ?? join(homedir(), ".cache", "linkyouth-fotos");
mkdirSync(TRABAJO, { recursive: true, mode: 0o700 });

function leerClave() {
  const archivo = join(homedir(), ".linkyouth-unsplash");
  if (!existsSync(archivo)) {
    console.error(
      `✗ Falta ${archivo} con UNSPLASH_ACCESS_KEY=… (la clave de acceso de la aplicación en unsplash.com/oauth/applications).`,
    );
    process.exit(1);
  }
  const linea = readFileSync(archivo, "utf8")
    .split("\n")
    .find((l) => l.trim().startsWith("UNSPLASH_ACCESS_KEY="));
  const clave = linea
    ?.split("=")
    .slice(1)
    .join("=")
    .trim()
    .replace(/^"|"$/g, "");
  if (!clave) {
    console.error(`✗ ${archivo} no tiene UNSPLASH_ACCESS_KEY=…`);
    process.exit(1);
  }
  return clave;
}

const CLAVE = leerClave();

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * GET a la API con la clave. Devuelve el JSON y cuántas consultas quedan en
 * la hora.
 *
 * Sin `esperar`, un cupo agotado es un error: la búsqueda se hace en una sola
 * corrida, sin pausas. Con `esperar` (los avisos de descarga, que corren en
 * segundo plano), espera a la hora siguiente y sigue.
 */
export async function pedir(ruta, { esperar: puedeEsperar = false } = {}) {
  const url = ruta.startsWith("http") ? ruta : `${API}${ruta}`;
  for (;;) {
    const respuesta = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${CLAVE}`,
        "Accept-Version": "v1",
      },
    });
    const quedan = Number(respuesta.headers.get("x-ratelimit-remaining"));
    if (respuesta.status === 403 && quedan === 0) {
      if (!puedeEsperar) {
        throw new Error("Se agotaron las consultas de esta hora en Unsplash.");
      }
      await esperarALaHora();
      continue;
    }
    if (!respuesta.ok) {
      throw new Error(
        `Unsplash respondió ${respuesta.status} a ${ruta.split("?")[0]}`,
      );
    }
    return { datos: await respuesta.json(), quedan };
  }
}

async function esperarALaHora() {
  const ahora = new Date();
  const proxima = new Date(ahora);
  proxima.setMinutes(61, 0, 0);
  const ms = proxima - ahora;
  console.log(
    `… se agotaron las consultas de esta hora. Sigo a las ${proxima.toTimeString().slice(0, 5)} (${Math.round(ms / 60000)} min).`,
  );
  await esperar(ms);
}

/** Un archivo de imagen (miniatura para revisar), sin la clave: son URLs públicas. */
export async function bajarMiniatura(url) {
  const respuesta = await fetch(url);
  if (!respuesta.ok) throw new Error(`miniatura ${respuesta.status}`);
  return Buffer.from(await respuesta.arrayBuffer());
}
