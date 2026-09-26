import Link from "next/link";

/**
 * Marca de LinkYouth.
 *
 * El sello es un cuadro con las iniciales, en el color de la plataforma. Sin
 * ámbar: el ámbar significa «esto está acreditado» y un logo no acredita
 * nada. Puesto acá sería lo mismo que ponerlo en cualquier lado, y entonces
 * dejaría de decir algo donde sí importa.
 *
 * El destino es obligatorio a propósito. Tenía `/inicio` por defecto, y como
 * `/inicio` pide sesión, el logo de las pantallas públicas mandaba a `/login` a
 * quien no la tenía: no había forma de volver a la portada. Quien la usa pasa
 * `inicioDe(area)` de `src/lib/navegacion.ts`, o un ancla si ya está en la
 * portada.
 */
export function Marca({ href }: { href: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="flex h-8 w-8 items-center justify-center rounded-ficha bg-acento text-[13px] font-semibold tracking-tight text-sobre-acento"
      >
        LY
      </span>
      <span className="font-titulo text-[17px] font-semibold tracking-tight text-tinta">
        LinkYouth
      </span>
    </Link>
  );
}
