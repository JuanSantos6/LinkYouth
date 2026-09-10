import type { ComponentPropsWithoutRef, ElementType } from "react";

type TarjetaProps<T extends ElementType> = {
  /** Elemento a renderizar. `article` para una tarjeta de contenido, `div` si no. */
  como?: T;
  /** Suma la reacción al puntero. Solo para tarjetas que llevan a algún lado. */
  interactiva?: boolean;
  className?: string;
};

/**
 * Superficie base de la aplicación. Todo bloque de contenido usa esta tarjeta,
 * de modo que borde, radio y sombra salgan de un único lugar.
 */
export function Tarjeta<T extends ElementType = "div">({
  como,
  interactiva = false,
  className = "",
  ...resto
}: TarjetaProps<T> & Omit<ComponentPropsWithoutRef<T>, keyof TarjetaProps<T>>) {
  const Componente = (como ?? "div") as ElementType;

  return (
    <Componente
      className={`tarjeta ${interactiva ? "tarjeta-interactiva" : ""} ${className}`}
      {...resto}
    />
  );
}
