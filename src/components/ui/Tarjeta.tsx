import type { ComponentPropsWithoutRef, ElementType } from "react";

type TarjetaProps<T extends ElementType> = {
  /** Elemento a renderizar. `article` para una tarjeta de contenido, `div` si no. */
  como?: T;
  /**
   * Eleva la tarjeta del plano. Se reserva para lo que de verdad está por
   * encima del resto —hoy, la vacante destacada—. Si todo estuviera elevado,
   * nada lo estaría.
   */
  elevada?: boolean;
  className?: string;
};

/**
 * Superficie con borde.
 *
 * Ya no es el envoltorio de todo: el listado de vacantes son filas separadas
 * por filetes, no tarjetas. Queda para lo que sí es una pieza autónoma —un
 * evento con su imagen y su fecha, un bloque de formulario—.
 */
export function Tarjeta<T extends ElementType = "div">({
  como,
  elevada = false,
  className = "",
  ...resto
}: TarjetaProps<T> & Omit<ComponentPropsWithoutRef<T>, keyof TarjetaProps<T>>) {
  const Componente = (como ?? "div") as ElementType;

  return (
    <Componente
      className={`rounded-tarjeta border border-borde bg-superficie ${
        elevada ? "shadow-elevada" : ""
      } ${className}`}
      {...resto}
    />
  );
}
