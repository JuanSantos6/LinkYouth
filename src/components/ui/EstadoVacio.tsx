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
    <div className="rounded-tarjeta border border-dashed border-borde-control/70 bg-superficie px-6 py-12 text-center">
      <svg
        aria-hidden="true"
        viewBox="0 0 64 64"
        className="mx-auto mb-4 h-12 w-12"
        fill="none"
        strokeWidth="6"
      >
        <circle cx="16" cy="48" r="9" className="stroke-turquesa" />
        <circle cx="48" cy="16" r="9" className="stroke-violeta" />
        <path
          d="M23 41 41 23"
          className="stroke-borde-control"
          strokeDasharray="2 7"
          strokeLinecap="round"
          strokeWidth="3"
        />
      </svg>
      <h3 className="text-[16px] font-semibold text-tinta">{titulo}</h3>
      <p className="mx-auto mt-2 max-w-md text-[14px] text-apagado">
        {descripcion}
      </p>
      {accion && <div className="mt-5 flex justify-center">{accion}</div>}
    </div>
  );
}
