import type { ComponentPropsWithoutRef } from "react";
import Link from "next/link";

type Variante = "primario" | "secundario" | "fantasma";

const VARIANTES: Record<Variante, string> = {
  primario: "bg-primario text-white hover:bg-primario-fuerte shadow-tarjeta",
  secundario:
    "border border-borde bg-superficie text-tinta hover:border-borde-fuerte hover:bg-superficie-suave",
  fantasma: "text-tinta-media hover:bg-superficie-suave hover:text-tinta",
};

/**
 * La transición enumera las propiedades en vez de usar `transition-colors`,
 * que en Tailwind 4 incluye `outline-color`: con el atajo, el anillo de foco
 * arrancaba en el color del texto y tardaba 150 ms en llegar al azul, o sea
 * que sobre el botón primario el foco de teclado era blanco sobre azul.
 *
 * El estado deshabilitado no se resuelve con opacidad. El texto de carga
 * («Entrando…», «Ya te postulaste») vive acá y tiene que leerse: fondo claro
 * y tinta media dan 7.36:1, contra los 2.58:1 del blanco sobre `tinta-tenue`.
 */
const BASE =
  "inline-flex items-center justify-center gap-2 rounded-control px-4 py-2 text-sm font-semibold transition-[color,background-color,border-color] duration-150 disabled:cursor-not-allowed disabled:bg-superficie-suave disabled:text-tinta-media disabled:shadow-none";

export function Boton({
  variante = "primario",
  className = "",
  ...resto
}: { variante?: Variante } & ComponentPropsWithoutRef<"button">) {
  return (
    <button
      className={`${BASE} ${VARIANTES[variante]} ${className}`}
      {...resto}
    />
  );
}

export function BotonEnlace({
  variante = "secundario",
  className = "",
  ...resto
}: { variante?: Variante } & ComponentPropsWithoutRef<typeof Link>) {
  return (
    <Link
      className={`${BASE} ${VARIANTES[variante]} ${className}`}
      {...resto}
    />
  );
}
