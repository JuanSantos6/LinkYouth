import { Suspense } from "react";

import { IconoAvisos } from "@/components/layout/Iconos";
import { EnlaceTransicion } from "@/components/navegacion/Transiciones";
import { contarAvisosSinLeer } from "@/lib/data/consultas";
import { TipoDeAviso } from "@/lib/dominio/TipoDeAviso";

/**
 * RF6.1 — Acceso a la bandeja de avisos desde la cabecera, para joven y
 * empresa, con el contador de los que todavía no se leyeron.
 *
 * La burbuja usa `acento` con `sobre-acento` (6,2:1 en claro y 7,9:1 en
 * oscuro): `alerta` en tema oscuro es `#FF7A99`, que no alcanza contraste AA
 * con texto claro, y además en «Recreo» está reservado a los errores.
 *
 * El nombre accesible sale entero de `TipoDeAviso.nombreDeLaCampana(sinLeer)`
 * («Avisos» o «Avisos, 3 sin leer») y la burbuja va oculta a lectores de
 * pantalla para no anunciar el número dos veces.
 */
export function CampanaDeAvisos({
  href,
  sinLeer,
}: {
  href: string;
  sinLeer: number;
}) {
  const contador = TipoDeAviso.textoDelContador(sinLeer);

  return (
    <EnlaceTransicion
      href={href}
      aria-label={TipoDeAviso.nombreDeLaCampana(sinLeer)}
      className="relative flex h-11 w-11 items-center justify-center rounded-full text-tinta transition-colors duration-150 hover:bg-realce"
    >
      <IconoAvisos className="h-[18px] w-[18px]" />
      {contador && (
        <span
          aria-hidden="true"
          className="cifra absolute top-1 right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-acento px-1 text-[11px] font-bold leading-none text-sobre-acento"
        >
          {contador}
        </span>
      )}
    </EnlaceTransicion>
  );
}

async function CampanaConContador({ href }: { href: string }) {
  return <CampanaDeAvisos href={href} sinLeer={await contarAvisosSinLeer()} />;
}

/**
 * La campana con el número de avisos sin leer, leído de la base.
 *
 * La consulta va dentro de su propio `Suspense`: la cabecera se manda entera
 * de entrada (con la campana sin número) y el contador llega cuando la base
 * responde. Con la cabecera entera asíncrona, la página esperaba esa consulta
 * y en desarrollo aparecían errores de hidratación del layout.
 */
export function CampanaDeAvisosDeLaSesion({ href }: { href: string }) {
  return (
    <Suspense fallback={<CampanaDeAvisos href={href} sinLeer={0} />}>
      <CampanaConContador href={href} />
    </Suspense>
  );
}
