import { Tarjeta } from "./Tarjeta";

/**
 * Qué se muestra cuando una lista viene vacía. Nunca un espacio en blanco:
 * siempre qué pasó y qué se puede hacer al respecto.
 */
export function EstadoVacio({
  titulo,
  descripcion,
  accion,
}: {
  titulo: string;
  descripcion: string;
  accion?: React.ReactNode;
}) {
  return (
    <Tarjeta className="px-6 py-12 text-center">
      <h3 className="text-base font-semibold text-tinta">{titulo}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-tinta-suave">
        {descripcion}
      </p>
      {accion && <div className="mt-5 flex justify-center">{accion}</div>}
    </Tarjeta>
  );
}
