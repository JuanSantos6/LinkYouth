import type { ComponentPropsWithoutRef } from "react";
import Link from "next/link";

type Variante = "primario" | "secundario" | "fantasma";

const VARIANTES: Record<Variante, string> = {
  primario:
    "bg-acento text-sobre-acento hover:bg-tinta disabled:bg-apagado disabled:text-papel",
  secundario:
    "border border-borde-control bg-superficie text-tinta hover:border-tinta",
  fantasma: "text-apagado hover:text-tinta",
};

const BASE =
  "inline-flex items-center justify-center rounded-control px-4 py-2 text-[14px] font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-70";

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
