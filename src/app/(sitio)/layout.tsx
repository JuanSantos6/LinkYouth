import { CabeceraGlobal } from "@/components/layout/CabeceraGlobal";
import { PieDeSitio } from "@/components/layout/PieDeSitio";

/**
 * Estructura de las pantallas públicas: las mismas cabecera y pie que el
 * resto del sitio, sin la barra lateral. Acá no hay secciones de tu cuenta
 * que marcar, y una columna vacía a la izquierda sería puro andamio.
 */
export default function LayoutSitio({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <CabeceraGlobal />
      <main className="mx-auto w-full max-w-[760px] flex-1 px-4 py-12 sm:px-6">
        {children}
      </main>
      <PieDeSitio />
    </div>
  );
}
