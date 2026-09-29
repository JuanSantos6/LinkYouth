import { BarraLateral } from "@/components/layout/BarraLateral";
import { CabeceraGlobal } from "@/components/layout/CabeceraGlobal";
import { PieDeSitio } from "@/components/layout/PieDeSitio";
import { obtenerTipoCuenta } from "@/lib/data/consultas";
import { areaDe } from "@/lib/navegacion";

/**
 * Estructura de las pantallas de tu cuenta: cabecera de sitio, secciones a la
 * izquierda y contenido a la derecha. Cada pantalla decide si además abre una
 * tercera columna, así el perfil puede ocupar todo el ancho sin pelearse con
 * el layout.
 *
 * `/empleos` y `/eventos` también viven acá y se leen sin sesión (ver
 * `EXPLORABLES` en `src/lib/navegacion.ts`). Para quien no la tiene, la
 * cabecera y el pie son los públicos —«Entrar» en vez de «Cerrar sesión», el
 * logo a la portada— y no hay barra lateral: sus secciones son las de una
 * cuenta que todavía no existe, y cada una terminaría en `/login`.
 *
 * El contenido va en un `<main>`: sin el landmark queda fuera de toda región y
 * un lector de pantalla no puede saltar hasta él.
 */
export default async function LayoutApp({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const area = areaDe(await obtenerTipoCuenta());
  const conSesion = area !== "publico";

  return (
    <div className="flex min-h-dvh flex-col">
      <CabeceraGlobal area={area} />

      <div
        className={`mx-auto grid w-full max-w-[1320px] flex-1 gap-6 px-4 py-6 sm:px-6 lg:gap-8 lg:py-10 ${
          conSesion ? "lg:grid-cols-[184px_minmax(0,1fr)]" : ""
        }`}
      >
        {conSesion && <BarraLateral />}
        <main className="min-w-0">{children}</main>
      </div>

      <PieDeSitio area={area} />
    </div>
  );
}
