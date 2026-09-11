import { BarraLateral } from "@/components/layout/BarraLateral";
import { CabeceraGlobal } from "@/components/layout/CabeceraGlobal";
import { PieDeSitio } from "@/components/layout/PieDeSitio";

/**
 * Estructura de las pantallas de tu cuenta: cabecera de sitio, secciones a la
 * izquierda y contenido a la derecha. Cada pantalla decide si además abre una
 * tercera columna, así el perfil puede ocupar todo el ancho sin pelearse con
 * el layout.
 */
export default function LayoutApp({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <CabeceraGlobal />

      <div className="mx-auto grid w-full max-w-[1320px] flex-1 gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[184px_minmax(0,1fr)] lg:py-10">
        <BarraLateral />
        <div className="min-w-0">{children}</div>
      </div>

      <PieDeSitio />
    </div>
  );
}
