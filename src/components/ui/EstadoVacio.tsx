import { Ilustracion, type VarianteDeIlustracion } from "./Ilustracion";

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
  nivel = 3,
  ilustracion = "personas",
}: {
  titulo: string;
  descripcion: string;
  accion?: React.ReactNode;
  /**
   * Nivel del título. 3 dentro de una sección con su `h2`; 2 cuando la lista
   * vacía cuelga directo del `h1` de la pantalla, para no saltear niveles.
   */
  nivel?: 1 | 2 | 3;
  ilustracion?: VarianteDeIlustracion;
}) {
  const Titulo = `h${nivel}` as const;

  return (
    <div className="rounded-tarjeta border border-dashed border-borde-control/70 bg-superficie px-6 py-12 text-center">
      <Ilustracion variante={ilustracion} className="mx-auto mb-4 h-24 w-24" />
      <Titulo className="text-[16px] font-semibold text-tinta">{titulo}</Titulo>
      <p className="mx-auto mt-2 max-w-md text-[14px] text-apagado">
        {descripcion}
      </p>
      {accion && <div className="mt-5 flex justify-center">{accion}</div>}
    </div>
  );
}
