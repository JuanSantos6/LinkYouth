import Link from "next/link";

/**
 * Marca de LinkYouth.
 *
 * El sello es un cuadro con las iniciales, en el color de la plataforma. Sin
 * ámbar: el ámbar significa «esto está acreditado» y un logo no acredita
 * nada. Puesto acá sería lo mismo que ponerlo en cualquier lado, y entonces
 * dejaría de decir algo donde sí importa.
 */
export function Marca({ href = "/inicio" }: { href?: string }) {
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
