"use server";

import { sesionDeEmpresa } from "./sesion";

/**
 * Búsqueda de direcciones para el formulario de eventos (RF4.1): de una
 * dirección escrita a sus coordenadas, y de un punto tocado en el mapa a su
 * dirección.
 *
 * La consulta la hace el servidor y no el navegador, por dos motivos. La CSP
 * sigue sin abrir `connect-src` a nadie de afuera (el único origen externo es
 * el de las teselas, y solo para imágenes). Y Nominatim pide que cada
 * aplicación se identifique con su `User-Agent` y no pase de una consulta por
 * segundo, cosa que desde el navegador de cada empresa no se puede cumplir.
 *
 * Solo para cuentas de empresa: es la única que carga eventos, y así el
 * servidor no queda como intermediario abierto hacia Nominatim.
 */

const NOMINATIM = "https://nominatim.openstreetmap.org";
const AGENTE = "LinkYouth/1.0 (linkyouth.uy@gmail.com)";
const ESPERA_MINIMA_MS = 1100;
const TEXTO_MIN = 4;
const TEXTO_MAX = 160;

export type LugarEncontrado = {
  etiqueta: string;
  latitud: number;
  longitud: number;
};

export type ResultadoDeBusqueda =
  | { estado: "ok"; lugares: LugarEncontrado[] }
  | { estado: "error"; mensaje: string };

/** La última consulta a Nominatim de este proceso, para no pasar de 1 por segundo. */
let ultimaConsulta = 0;

async function respetarLimite() {
  const espera = ultimaConsulta + ESPERA_MINIMA_MS - Date.now();
  ultimaConsulta = Math.max(Date.now(), ultimaConsulta + ESPERA_MINIMA_MS);
  if (espera > 0) await new Promise((listo) => setTimeout(listo, espera));
}

async function consultar(ruta: string, parametros: Record<string, string>) {
  await respetarLimite();
  const url = new URL(ruta, NOMINATIM);
  for (const [clave, valor] of Object.entries(parametros)) {
    url.searchParams.set(clave, valor);
  }
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("accept-language", "es");

  const respuesta = await fetch(url, {
    headers: { "User-Agent": AGENTE },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!respuesta.ok) throw new Error(`Nominatim respondió ${respuesta.status}`);
  return (await respuesta.json()) as unknown;
}

type FilaDeNominatim = { display_name?: unknown; lat?: unknown; lon?: unknown };

function comoLugar(fila: FilaDeNominatim): LugarEncontrado | null {
  const latitud = Number(fila.lat);
  const longitud = Number(fila.lon);
  if (
    typeof fila.display_name !== "string" ||
    !Number.isFinite(latitud) ||
    !Number.isFinite(longitud)
  ) {
    return null;
  }
  return {
    etiqueta: fila.display_name,
    // Seis decimales, como `eventos.latitud numeric(9, 6)`: unos 10 cm.
    latitud: Math.round(latitud * 1e6) / 1e6,
    longitud: Math.round(longitud * 1e6) / 1e6,
  };
}

const SIN_SERVICIO: ResultadoDeBusqueda = {
  estado: "error",
  mensaje:
    "No se pudo buscar la dirección ahora. Probá de nuevo en un rato o marcá el lugar tocando el mapa.",
};

/** De una dirección escrita, hasta cinco lugares posibles en Uruguay. */
export async function buscarDireccion(
  texto: string,
): Promise<ResultadoDeBusqueda> {
  const guardia = await sesionDeEmpresa();
  if (!guardia.ok) return { estado: "error", mensaje: guardia.error.mensaje };

  const consulta = texto.trim().slice(0, TEXTO_MAX);
  if (consulta.length < TEXTO_MIN) {
    return {
      estado: "error",
      mensaje: "Escribí la calle y el número, o el nombre del lugar.",
    };
  }

  try {
    const filas = await consultar("/search", {
      q: consulta,
      countrycodes: "uy",
      limit: "5",
    });
    const lugares = (Array.isArray(filas) ? filas : []).flatMap(
      (fila: FilaDeNominatim) => comoLugar(fila) ?? [],
    );
    if (lugares.length === 0) {
      return {
        estado: "error",
        mensaje:
          "No encontramos esa dirección. Probá con la calle y el número, o marcá el lugar tocando el mapa.",
      };
    }
    return { estado: "ok", lugares };
  } catch {
    return SIN_SERVICIO;
  }
}

/** De un punto tocado en el mapa, la dirección más cercana. */
export async function direccionDePunto(
  latitud: number,
  longitud: number,
): Promise<ResultadoDeBusqueda> {
  const guardia = await sesionDeEmpresa();
  if (!guardia.ok) return { estado: "error", mensaje: guardia.error.mensaje };

  if (
    !Number.isFinite(latitud) ||
    !Number.isFinite(longitud) ||
    Math.abs(latitud) > 90 ||
    Math.abs(longitud) > 180
  ) {
    return { estado: "error", mensaje: "Ese punto no está en el mapa." };
  }

  try {
    const fila = await consultar("/reverse", {
      lat: String(latitud),
      lon: String(longitud),
      zoom: "18",
    });
    const lugar = comoLugar((fila ?? {}) as FilaDeNominatim);
    return lugar
      ? { estado: "ok", lugares: [{ ...lugar, latitud, longitud }] }
      : { estado: "ok", lugares: [] };
  } catch {
    return SIN_SERVICIO;
  }
}
