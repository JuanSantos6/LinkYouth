/**
 * «1 de 4 completados» con una barra. La barra es un `progressbar` con el
 * texto como valor legible; el relleno es el violeta de marca (indicador) y
 * crece con `transform`, no con el ancho.
 */
export function BarraDeProgreso({
  completados,
  total,
  texto,
}: {
  completados: number;
  total: number;
  texto: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[15px] font-semibold text-tinta">{texto}</p>
      <div
        role="progressbar"
        aria-label="Tests del Interview Lab"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={completados}
        aria-valuetext={texto}
        className="h-2.5 overflow-hidden rounded-full border border-borde-control/60 bg-realce"
      >
        <div
          className="h-full origin-left rounded-full bg-violeta transition-transform duration-300"
          style={{ transform: `scaleX(${total ? completados / total : 0})` }}
        />
      </div>
    </div>
  );
}
