import Link from "next/link";

import { Marca } from "@/components/layout/Marca";

/**
 * Estructura de las pantallas de autenticación: una sola columna centrada, sin
 * la barra lateral ni el pie. Quien está por entrar tiene una sola cosa que
 * hacer, y todo lo demás compite con ella.
 *
 * La marca sí está, y lleva a la página pública: si alguien llegó por error a
 * `/login`, tiene por dónde salir sin usar el botón de atrás.
 *
 * Es un `<main>` y no un `<div>`: sin el landmark, el contenido queda fuera de
 * toda región y un lector de pantalla no puede saltar hasta él.
 */
export default function LayoutAuth({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col px-4 py-8 sm:py-10">
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-4">
        <Marca href="/como-funciona" />
        <Link
          href="/como-funciona"
          className="text-[14px] text-apagado transition-[color] duration-150 hover:text-tinta"
        >
          Qué es LinkYouth
        </Link>
      </div>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 py-10">
        {children}
      </main>
    </div>
  );
}
