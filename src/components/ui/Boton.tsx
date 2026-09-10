import type { ComponentPropsWithoutRef } from "react";
import Link from "next/link";

type Variante = "primario" | "secundario" | "fantasma";

const VARIANTES: Record<Variante, string> = {
  primario:
    "bg-primario text-white hover:bg-primario-fuerte shadow-tarjeta disabled:bg-tinta-tenue",
  secundario:
    "border border-borde bg-superficie text-tinta hover:border-borde-fuerte hover:bg-superficie-suave",
  fantasma: "text-tinta-media hover:bg-superficie-suave hover:text-tinta",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-control px-4 py-2 text-sm font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-70";

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
