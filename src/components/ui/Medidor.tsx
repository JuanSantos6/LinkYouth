/**
 * Medidor de compatibilidad: un segmento por requisito, relleno en turquesa
 * los que ya tenés, y el texto «Tenés 3 de 4» al lado.
 *
 * Se entiende sin saber qué es un porcentaje, y el texto dice lo mismo que la
 * barra: el color nunca va solo. Los segmentos rellenos llevan borde
 * turquesa oscuro para distinguirse de los vacíos con 3:1 (WCAG 1.4.11).
 */
export function Medidor({
  cubiertos,
  total,
  detalle,
  className = "",
}: {
  cubiertos: number;
  total: number;
  /** Texto que sigue a «Tenés X de Y»: «requisitos», «de lo que pide»… */
  detalle?: string;
  className?: string;
}) {
  if (total === 0) return null;

  return (
    <div className={`grid gap-1.5 ${className}`}>
      <div className="flex gap-1" aria-hidden="true">
        {Array.from({ length: total }, (_, indice) => (
          <span
            key={indice}
            className={`h-2 flex-1 rounded-full border ${
              indice < cubiertos
                ? "border-turquesa-texto bg-turquesa"
                : "border-borde bg-realce"
            }`}
          />
        ))}
      </div>
      <p className="text-[13px] text-apagado">
        <span className="font-semibold text-tinta">
          Tenés {cubiertos} de {total}
        </span>
        {detalle ? ` ${detalle}` : ""}
      </p>
    </div>
  );
}
