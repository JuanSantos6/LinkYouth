import Link from "next/link";

import { BotonTema } from "@/components/layout/BotonTema";
import { Marca } from "@/components/layout/Marca";

/**
 * La tarjeta de iniciar sesión y de crear cuenta: centrada, con esquinas
 * redondeadas, sombra suave y aire adentro. Arriba, el logo y el tema; abajo,
 * el enlace alternativo (crear cuenta / iniciar sesión) y la vuelta a la
 * página principal, para que nadie quede sin salida.
 */
export function TarjetaDeAcceso({
  titulo,
  bajada,
  children,
  alternativa,
  ancha = false,
}: {
  titulo: string;
  bajada?: React.ReactNode;
  children: React.ReactNode;
  /** «¿Todavía no tenés cuenta? Creá una», o al revés. */
  alternativa: React.ReactNode;
  /** El registro tiene más campos: la tarjeta es más ancha. */
  ancha?: boolean;
}) {
  return (
    <div
      className={`w-full rounded-[28px] border border-borde bg-superficie p-6 shadow-[0_24px_60px_-28px_rgb(30_26_56/0.35),0_2px_8px_-2px_rgb(30_26_56/0.08)] sm:p-10 ${
        ancha ? "max-w-[560px]" : "max-w-[440px]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <Marca href="/" alto={28} />
        <BotonTema />
      </div>

      <div className="mt-8 space-y-2">
        <h1 className="text-[28px] leading-tight font-extrabold text-tinta sm:text-[30px]">
          {titulo}
        </h1>
        {bajada && <div className="text-[15px] text-apagado">{bajada}</div>}
      </div>

      <div className="mt-7">{children}</div>

      <div className="mt-7 space-y-3 border-t border-filete pt-6 text-center text-[15px]">
        <p className="text-apagado">{alternativa}</p>
        <p>
          <Link
            href="/"
            className="inline-flex rounded-control px-2 py-1 font-medium text-tinta transition-colors duration-150 hover:bg-realce"
          >
            <span aria-hidden="true">←&nbsp;</span>Volver a la página principal
          </Link>
        </p>
      </div>
    </div>
  );
}
