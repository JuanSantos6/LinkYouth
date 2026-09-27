import { CabeceraGlobal } from "@/components/layout/CabeceraGlobal";
import { PieDeSitio } from "@/components/layout/PieDeSitio";
import { AvisoDeLlegada } from "@/components/navegacion/AvisoDeLlegada";
import { BarraPestanas } from "@/components/navegacion/BarraPestanas";
import { Suspense } from "react";
import { obtenerTipoCuenta } from "@/lib/data/consultas";
import { areaDe } from "@/lib/navegacion";

/**
 * Estructura de las pantallas de la cuenta y de exploración.
 *
 * Un solo menú: el del encabezado. La barra lateral que repetía Empleos y
 * Eventos se sacó con el sistema «Recreo» (ver `docs/decisiones.md`,
 * 2026-09-27). En el teléfono, el postulante tiene las cuatro secciones en
 * las pestañas de abajo.
 *
 * `/empleos` y `/eventos` también viven acá y se leen sin sesión
 * (`EXPLORABLES` en `src/lib/navegacion.ts`): para quien no la tiene, el
 * encabezado y el pie son los públicos.
 */
export default async function LayoutApp({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const area = areaDe(await obtenerTipoCuenta());

  return (
    <div className="flex min-h-dvh flex-col">
      <CabeceraGlobal area={area} />
      <Suspense>
        <AvisoDeLlegada />
      </Suspense>

      <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 py-8 sm:px-6 lg:py-12">
        {children}
      </main>

      {area === "postulante" && <BarraPestanas />}
      <PieDeSitio area={area} />
    </div>
  );
}
