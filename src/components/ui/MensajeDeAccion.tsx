import type { EstadoAccion } from "@/lib/acciones/tipos";

/**
 * El resultado de una acción, al lado del control que la disparó.
 *
 * El error no se distingue por color: la paleta no tiene rojo a propósito, y
 * un estado que solo se lee por su tono deja afuera a quien no lo percibe. Se
 * distingue por peso, por un filete a la izquierda y por la palabra. Siempre
 * en `aria-live`, para que también llegue a un lector de pantalla.
 */
export function MensajeDeAccion({
  estado,
  className = "",
}: {
  estado: EstadoAccion;
  className?: string;
}) {
  if (estado.estado === "inicial" || !estado.mensaje) {
    return (
      <p aria-live="polite" className="sr-only">
        {estado.mensaje}
      </p>
    );
  }

  const esError = estado.estado === "error";

  return (
    <p
      aria-live="polite"
      className={`max-w-xs text-[13px] ${
        esError
          ? "border-l-2 border-tinta pl-2 font-medium text-tinta"
          : "text-apagado"
      } ${className}`}
    >
      {esError && <span className="font-semibold">No se pudo: </span>}
      {estado.mensaje}
    </p>
  );
}
