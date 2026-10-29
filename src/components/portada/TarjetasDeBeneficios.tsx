import { Carrusel } from "@/components/portada/Carrusel";

export type Beneficio = {
  para: "jovenes" | "empresas";
  titulo: string;
  texto: string;
  icono: React.ReactNode;
};

const PARA = {
  jovenes: { etiqueta: "Para jóvenes", clases: "bg-lavanda text-tinta" },
  empresas: {
    etiqueta: "Para empresas",
    clases: "bg-coincide-fondo text-tinta",
  },
} as const;

/**
 * Lo que LinkYouth hace por cada lado, en tarjetas que se deslizan. Cada una
 * lleva una etiqueta con a quién le sirve; el color nunca va solo.
 */
export function TarjetasDeBeneficios({
  beneficios,
  etiquetaDelCarrusel,
  controlesArriba,
}: {
  beneficios: readonly Beneficio[];
  etiquetaDelCarrusel: string;
  controlesArriba: React.ReactNode;
}) {
  return (
    <Carrusel etiqueta={etiquetaDelCarrusel} controlesArriba={controlesArriba}>
      {beneficios.map((beneficio) => (
        <article
          key={beneficio.titulo}
          className="grid w-[min(360px,86vw)] shrink-0 snap-start content-start gap-4 rounded-tarjeta border border-borde bg-superficie p-6"
        >
          <span
            className={`justify-self-start rounded-full px-3 py-1 text-[14px] font-bold ${PARA[beneficio.para].clases}`}
          >
            {PARA[beneficio.para].etiqueta}
          </span>
          <span className="flex h-12 w-12 items-center justify-center rounded-ficha bg-lavanda text-acento">
            {beneficio.icono}
          </span>
          <h3 className="text-[22px] leading-snug text-tinta">
            {beneficio.titulo}
          </h3>
          <p className="text-[17px] leading-relaxed text-apagado">
            {beneficio.texto}
          </p>
        </article>
      ))}
    </Carrusel>
  );
}
