import { CabeceraGlobal } from "@/components/layout/CabeceraGlobal";
import { PieDeSitio } from "@/components/layout/PieDeSitio";
import { AvisoDeLlegada } from "@/components/navegacion/AvisoDeLlegada";
import { Suspense } from "react";

/**
 * Estructura del panel de empresa: la misma cabecera y el mismo pie que el
 * resto del sitio, con las secciones de la empresa. El aviso de llegada
 * explica, si hace falta, por qué alguien que eligió «Busco trabajo» en el
 * login terminó acá.
 */
export default function LayoutEmpresa({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <CabeceraGlobal area="empresa" />
      <Suspense>
        <AvisoDeLlegada />
      </Suspense>
      <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 py-8 sm:px-6 lg:py-12">
        {children}
      </main>
      <PieDeSitio area="empresa" />
    </div>
  );
}
