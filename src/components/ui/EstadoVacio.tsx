/**
 * Qué se ve cuando una lista viene vacía.
 *
 * Nunca un blanco: siempre qué pasó y qué se puede hacer. El borde punteado
 * dice «acá va a haber algo» sin fingir que hay contenido.
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
    <div className="rounded-ficha border border-dashed border-borde px-6 py-12 text-center">
      <h3 className="text-[16px] font-semibold text-tinta">{titulo}</h3>
      <p className="mx-auto mt-2 max-w-md text-[14px] text-apagado">
        {descripcion}
      </p>
      {accion && <div className="mt-5 flex justify-center">{accion}</div>}
    </div>
  );
}
