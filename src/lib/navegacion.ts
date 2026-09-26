/**
 * Reglas de navegación que comparten el middleware, las cabeceras y las
 * acciones de login y registro.
 *
 * Viven juntas porque son una sola regla vista desde tres lados: a dónde lleva
 * el logo, a dónde vuelve alguien después de entrar y qué pantallas se leen
 * sin sesión. Cuando estaban repartidas, cada pieza decidía por su cuenta y el
 * logo terminaba mandando a `/inicio` —privada— a quien no tenía sesión, que
 * el middleware rebotaba a `/login`: un círculo sin salida a la portada.
 *
 * No importa nada de servidor ni de React: el middleware corre en el runtime
 * de Edge y lo usa tal cual.
 */

import type { TipoCuenta } from "@/lib/data/tipos";

/** En qué mitad del sitio está quien mira. */
export type Area = "publico" | "postulante" | "empresa";

/** Parámetro de la URL de `/login` y `/registro` con la ruta a la que volver. */
export const PARAMETRO_SIGUIENTE = "next";

export function areaDe(tipo: TipoCuenta | null): Area {
  if (tipo === "empresa") return "empresa";
  return tipo ? "postulante" : "publico";
}

/**
 * Adónde lleva el logo: la portada sin sesión, y la pantalla de inicio de cada
 * tipo de cuenta con sesión.
 */
export function inicioDe(area: Area): string {
  if (area === "empresa") return "/empresa";
  return area === "postulante" ? "/inicio" : "/";
}

/**
 * La portada y las pantallas que cuentan qué es LinkYouth.
 *
 * Se leen con o sin sesión, y por los dos tipos de cuenta: son la cara pública
 * del sitio y están enlazadas desde la cabecera y el pie, que aparecen en
 * todas partes. Mandar a `/login` a alguien que toca «Cómo funciona» sería
 * pedirle credenciales para leer un folleto, y `/` es literalmente la puerta
 * de entrada: si pidiera sesión, nadie sin cuenta podría enterarse de qué es
 * esto.
 */
export const INFORMATIVAS = ["/", "/empresas", "/como-funciona", "/legales"];

/**
 * Pantallas de exploración: se leen con o sin sesión (el listado de vacantes,
 * su detalle y los eventos). Lo que pide cuenta es postularse o inscribirse, y
 * eso lo resuelve cada botón. Ver `docs/decisiones.md`, 2026-09-26.
 */
export const EXPLORABLES = ["/empleos", "/eventos"];

export function esExplorable(ruta: string): boolean {
  return EXPLORABLES.some(
    (base) => ruta === base || ruta.startsWith(`${base}/`),
  );
}

/**
 * La ruta a la que se puede volver después de entrar, o `null`.
 *
 * El valor llega por la URL, así que lo puede escribir cualquiera: sin este
 * filtro, `/login?next=https://otro-sitio` sería un redirector abierto que
 * presta el dominio de LinkYouth para mandar a alguien a una copia del login.
 * Solo se aceptan rutas internas absolutas: tienen que empezar con una sola
 * `/` —`//otro-sitio` es una URL de otro host para el navegador— y no pueden
 * llevar `\`, que algunos navegadores leen como `/`.
 *
 * Tampoco se vuelve a `/login` ni a `/registro`: con sesión el middleware los
 * rebota, y el resultado sería un salto de más.
 */
export function destinoSeguro(valor: unknown): string | null {
  if (typeof valor !== "string") return null;

  const ruta = valor.trim();
  if (!ruta.startsWith("/") || ruta.startsWith("//")) return null;
  if (ruta.includes("\\") || /[\u0000-\u001f]/.test(ruta)) return null;

  const camino = ruta.split(/[?#]/, 1)[0];
  if (camino === "/login" || camino === "/registro") return null;

  return ruta;
}

/** `/login` o `/registro` con la ruta a la que volver, si hay una válida. */
export function conSiguiente(
  entrada: "/login" | "/registro",
  siguiente: string | null | undefined,
  extra: Record<string, string> = {},
): string {
  const parametros = new URLSearchParams(extra);
  const destino = destinoSeguro(siguiente);
  if (destino) parametros.set(PARAMETRO_SIGUIENTE, destino);

  const consulta = parametros.toString();
  return consulta ? `${entrada}?${consulta}` : entrada;
}

/**
 * Si `ruta` es una pantalla a la que puede entrar ese tipo de cuenta.
 *
 * El middleware reubica a cada cuenta en su mitad, pero hay un caso en el que
 * no llega a actuar: el `redirect()` de una Server Action renderiza el destino
 * dentro de la misma respuesta, sin un request nuevo que pase por el
 * middleware. Sin este control, una empresa que entrara con
 * `/login?next=/perfil` terminaría viendo la pantalla del postulante.
 */
export function correspondeA(
  area: Exclude<Area, "publico">,
  ruta: string,
): boolean {
  const camino = ruta.split(/[?#]/, 1)[0];
  if (INFORMATIVAS.includes(camino)) return true;

  const deEmpresa = camino === "/empresa" || camino.startsWith("/empresa/");
  return area === "empresa" ? deEmpresa : !deEmpresa;
}
