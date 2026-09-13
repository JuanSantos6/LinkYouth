import { BarraLateral } from "@/components/layout/BarraLateral";

/**
 * Estructura de la aplicación: navegación fija a la izquierda y contenido a
 * la derecha. Cada pantalla decide si además abre una tercera columna, así
 * el perfil puede ocupar todo el ancho sin que el layout pelee con él.
 */
export default function LayoutApp({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="mx-auto grid w-full max-w-[1400px] gap-6 px-4 py-6 lg:grid-cols-[228px_minmax(0,1fr)] lg:px-6 lg:py-8">
      <BarraLateral />
      {/* `main` completa el par con el `nav` de la barra lateral: son las dos
          regiones de la pantalla y hacen falta para poder saltar entre ellas. */}
      <main className="min-w-0">{children}</main>
    </div>
  );
}
