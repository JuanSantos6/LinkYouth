import type { ComponentPropsWithoutRef } from "react";
import Link from "next/link";

type Variante = "primario" | "secundario" | "fantasma";

/**
 * `primario` es el único lugar de la app donde aparece la mandarina: el acento
 * cálido que dice «esto es lo que tenés que hacer». Lleva texto tinta, no
 * blanco (5,0:1). Uno solo por pantalla.
 */
const VARIANTES: Record<Variante, string> = {
  primario:
    "bg-mandarina text-sobre-mandarina hover:brightness-[0.94] font-semibold",
  secundario:
    "border border-borde-control bg-superficie text-tinta hover:border-tinta",
  fantasma: "text-tinta hover:bg-realce",
};

/**
 * La transición enumera las propiedades en vez de usar `transition-colors`,
 * que en Tailwind 4 incluye `outline-color`: con el atajo, el anillo de foco
 * arrancaba en el color del texto y tardaba 150 ms en llegar al azul, o sea
 * que sobre el botón primario el foco de teclado arrancaba con el color del
 * texto en vez del acento.
 *
 * El estado deshabilitado no se resuelve con opacidad. El texto de carga
 * («Entrando…», «Ya te postulaste») vive acá y tiene que leerse: fondo claro
 * y tinta media dan 7.36:1, contra los 2.58:1 del blanco sobre `tinta-tenue`.
 */
const BASE =
  "inline-flex items-center justify-center gap-2 rounded-control px-4 py-2.5 text-[15px] font-medium leading-tight transition-[color,background-color,border-color,filter,transform] duration-150 active:translate-y-px disabled:cursor-not-allowed disabled:border-borde disabled:bg-realce disabled:text-apagado disabled:brightness-100 disabled:translate-y-0";

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
