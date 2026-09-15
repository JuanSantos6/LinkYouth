import { CabeceraGlobal } from "@/components/layout/CabeceraGlobal";
import { PieDeSitio } from "@/components/layout/PieDeSitio";
import { obtenerTipoCuenta } from "@/lib/data/consultas";

/**
 * Estructura de las pantallas públicas: las mismas cabecera y pie que el
 * resto del sitio, sin la barra lateral. Acá no hay secciones de tu cuenta
 * que marcar, y una columna vacía a la izquierda sería puro andamio.
 *
 * Se leen con o sin sesión y por los dos tipos de cuenta, así que la cabecera
 * y el pie preguntan de qué mitad viene quien mira: una empresa que entra por
 * «Cómo funciona» no tiene por qué ver enlaces a las secciones del postulante.
 */
/**
 * Se renderiza por request: el layout lee la sesión para decidir qué ofrece la
 * cabecera. Prerenderizado, la página quedaría congelada con el estado de
 * quien no tiene sesión y le mostraría «Entrar» a alguien que ya entró.
 */
export const dynamic = "force-dynamic";

export default async function LayoutSitio({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const tipo = await obtenerTipoCuenta();
  const area = tipo === "empresa" ? "empresa" : tipo ? "postulante" : "publico";

  return (
    <div className="flex min-h-dvh flex-col">
      <CabeceraGlobal area={area} />
      <main className="mx-auto w-full max-w-[760px] flex-1 px-4 py-10 sm:px-6 sm:py-12">
        {children}
      </main>
      <PieDeSitio area={area} />
    </div>
  );
}
