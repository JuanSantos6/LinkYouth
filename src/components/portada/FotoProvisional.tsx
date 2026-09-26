import { IconoCamara } from "@/components/layout/Iconos";

type Tono = "turquesa" | "violeta" | "mandarina" | "mixto";

const FONDOS: Record<Tono, string> = {
  turquesa:
    "radial-gradient(120% 90% at 80% 20%, #19DDD2 0%, #0E7E86 38%, #1E1A38 100%)",
  violeta:
    "radial-gradient(120% 90% at 75% 25%, #8C66FA 0%, #4A33A8 40%, #15132A 100%)",
  mandarina:
    "radial-gradient(110% 90% at 78% 22%, #F25C1A 0%, #8C3A5E 42%, #1E1A38 100%)",
  mixto:
    "radial-gradient(140% 110% at 70% 10%, #19DDD2 0%, #6F6BE8 40%, #15132A 100%)",
};

/** Anillos y barras del isotipo, a baja opacidad, siempre en el mismo lugar para cada semilla. */
function trama(semilla: number) {
  let estado = semilla * 9301 + 49297;
  const azar = (min: number, max: number) => {
    estado = (estado * 9301 + 49297) % 233280;
    return min + Math.floor((estado / 233280) * (max - min));
  };
  const anillos = Array.from({ length: 7 }, () => ({
    x: azar(0, 1600),
    y: azar(0, 1000),
    r: azar(40, 220),
    o: [0.06, 0.09, 0.12][azar(0, 3)],
  }));
  const barras = Array.from({ length: 3 }, () => ({
    x: azar(0, 1600),
    y: azar(0, 1000),
    d: azar(160, 420),
    w: azar(18, 40),
  }));
  return { anillos, barras };
}

/**
 * Espacio para una foto real, con una imagen provisional identificada como tal.
 *
 * Nada de fotos de banco: mientras no haya fotos propias —de los jóvenes, de
 * la universidad, del equipo—, el lugar lo ocupa una composición con las
 * formas del logo y un rótulo que dice qué foto va. Cuando exista, se pasa
 * `src` y se muestra con `object-fit: cover`, recortándose al bloque sin
 * estirarse. La lista de fotos que faltan está en `docs/decisiones.md`.
 */
export function FotoProvisional({
  que,
  tono = "turquesa",
  semilla = 1,
  src,
  className = "",
  rotuloArriba = true,
  conRotulo = true,
}: {
  /** Qué foto real va en este lugar. */
  que: string;
  tono?: Tono;
  semilla?: number;
  src?: string;
  className?: string;
  rotuloArriba?: boolean;
  /** Sin rótulo propio: cuando se recorta, el rótulo va aparte (`RotuloFotoProvisional`). */
  conRotulo?: boolean;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- foto propia, el recorte lo hace object-fit
      <img
        src={src}
        alt={que}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  const { anillos, barras } = trama(semilla);

  return (
    <div
      role="img"
      aria-label={`Foto provisional. Va una foto de ${que}.`}
      className={`relative h-full w-full overflow-hidden ${className}`}
      style={{ background: FONDOS[tono] }}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 1600 1000"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        {anillos.map((a, i) => (
          <circle
            key={i}
            cx={a.x}
            cy={a.y}
            r={a.r}
            fill="none"
            stroke={`rgb(255 255 255 / ${a.o})`}
            strokeWidth={Math.max(8, Math.round(a.r / 3))}
          />
        ))}
        {barras.map((b, i) => (
          <path
            key={i}
            d={`M${b.x} ${b.y} l${b.d} ${-b.d}`}
            stroke="rgb(255 255 255 / 0.07)"
            strokeWidth={b.w}
            strokeLinecap="round"
          />
        ))}
      </svg>
      {conRotulo && (
        <span
          className={`absolute right-3 z-[1] flex max-w-[calc(100%-24px)] items-center gap-2 rounded-full border-[1.5px] border-dashed border-[#15132A] bg-white/95 px-3 py-1.5 text-[12.5px] font-semibold text-[#15132A] ${
            rotuloArriba ? "top-3" : "bottom-3"
          }`}
        >
          <IconoCamara className="h-4 w-4 shrink-0" />
          <span className="truncate">Foto provisional · {que}</span>
        </span>
      )}
    </div>
  );
}

/** El rótulo solo, para ubicarlo dentro de la parte visible de una foto recortada. */
export function RotuloFotoProvisional({ que }: { que: string }) {
  return (
    <span className="inline-flex max-w-full items-center gap-2 justify-self-start rounded-full border-[1.5px] border-dashed border-[#15132A] bg-white/95 px-3 py-1.5 text-[12.5px] font-semibold text-[#15132A]">
      <IconoCamara className="h-4 w-4 shrink-0" />
      <span className="truncate">Foto provisional · {que}</span>
    </span>
  );
}
