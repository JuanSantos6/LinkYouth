import Link from "next/link";

import { BotonTema } from "@/components/layout/BotonTema";
import { Marca } from "@/components/layout/Marca";

/**
 * Estructura de las pantallas de autenticación: una sola columna centrada,
 * sin menú ni pie. Quien está por entrar tiene una sola cosa que hacer.
 *
 * La marca y el enlace de al lado llevan a la portada: si alguien llegó a
 * `/login` porque una pantalla pedía sesión, tiene por dónde volver sin usar
 * el botón de atrás. El botón de tema está también acá: es la primera
 * pantalla que ve mucha gente.
 */
export default function LayoutAuth({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col bg-papel px-4 py-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3">
        <Marca href="/" alto={28} />
        <div className="flex items-center gap-1">
          <Link
            href="/"
            className="rounded-control px-2 py-1.5 text-[14px] font-medium text-tinta transition-colors duration-150 hover:bg-realce"
          >
            <span aria-hidden="true">← </span>
            Volver a la página principal
          </Link>
          <BotonTema />
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 py-10">
        {children}
      </main>
    </div>
  );
}
