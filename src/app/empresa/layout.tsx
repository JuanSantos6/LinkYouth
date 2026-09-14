import { CabeceraGlobal } from "@/components/layout/CabeceraGlobal";
import { PieDeSitio } from "@/components/layout/PieDeSitio";

/**
 * Estructura del panel de empresa.
 *
 * Usa la misma cabecera y el mismo pie que el resto del sitio —una cuenta de
 * empresa está en LinkYouth igual que cualquier otra— pero no la barra
 * lateral, que lista las secciones del postulante y ninguna le sirve.
 *
 * El panel real —vacantes propias, postulantes ordenados por matching— es el
 * Hito 6. Lo único que esta ruta sostiene hoy es que una cuenta de empresa
 * aterrice en algo propio al iniciar sesión, y no en el feed del postulante.
 */
export default function LayoutEmpresa({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <CabeceraGlobal area="empresa" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 lg:py-10">
        {children}
      </main>
      <PieDeSitio area="empresa" />
    </div>
  );
}
