import { Carrusel } from "@/components/portada/Carrusel";

export type Opinion = {
  texto: string;
  quien: string;
  rol: string;
};

/**
 * Opiniones de quienes usan LinkYouth. Hoy no se muestra en ninguna pantalla:
 * se enchufa en la portada cuando haya opiniones reales, con permiso de quien
 * las da. No se inventan ni se rellenan con ejemplos.
 */
export function Opiniones({ opiniones }: { opiniones: readonly Opinion[] }) {
  if (opiniones.length === 0) return null;

  return (
    <Carrusel
      etiqueta="Opiniones"
      controlesArriba={
        <h2
          id="t-opiniones"
          className="max-w-[720px] text-[32px] leading-[1.08] font-extrabold text-tinta sm:text-[44px]"
        >
          Lo que cuentan quienes la usan
        </h2>
      }
    >
      {opiniones.map((opinion) => (
        <figure
          key={opinion.texto}
          className="m-0 grid w-[min(420px,86vw)] shrink-0 snap-start content-between gap-4 rounded-[24px] border border-borde bg-superficie p-6"
        >
          <blockquote className="m-0 font-titulo text-[19px] leading-normal font-medium text-tinta">
            «{opinion.texto}»
          </blockquote>
          <figcaption>
            <b className="block text-tinta">{opinion.quien}</b>
            <span className="text-[15px] text-apagado">{opinion.rol}</span>
          </figcaption>
        </figure>
      ))}
    </Carrusel>
  );
}
