import type {
  GrupoDePersonalidad,
  TipoDePersonalidad,
} from "@/lib/dominio/TipoDePersonalidad";

/**
 * Un ícono propio por grupo, dibujado para LinkYouth (2026-10-22). No copia
 * las ilustraciones de 16Personalities ni sus colores: son formas
 * geométricas de trazo, sobre pares de tokens de la paleta Recreo que ya
 * cumplen AA en los dos temas (los mismos del avatar automático). Sin
 * mandarina, que es del botón principal.
 *
 * - Analistas: un cubo, lo que se arma pieza por pieza.
 * - Diplomáticos: un brote, lo que crece con los demás.
 * - Centinelas: un escudo, lo que se cuida.
 * - Exploradores: una brújula, lo que sale a buscar.
 */
const ICONOS: Record<
  GrupoDePersonalidad,
  { fondo: string; trazo: string; dibujo: React.ReactNode }
> = {
  analistas: {
    fondo: "bg-lavanda",
    trazo: "text-acento",
    dibujo: (
      <>
        <path d="M24 8 38 16v16l-14 8-14-8V16Z" />
        <path d="M10 16l14 8 14-8M24 24v16" />
        <circle cx="24" cy="24" r="2.2" fill="currentColor" stroke="none" />
      </>
    ),
  },
  diplomaticos: {
    fondo: "bg-coincide-fondo",
    trazo: "text-sobre-turquesa",
    dibujo: (
      <>
        <path d="M24 40V21" />
        <path d="M24 28c-7.5 0-12-5-12-12 7 0 12 4.5 12 12Z" />
        <path d="M24 22c0-7.5 4.5-12 12-12 0 7.5-4.5 12-12 12Z" />
        <path d="M15 40h18" />
      </>
    ),
  },
  centinelas: {
    fondo: "bg-acento",
    trazo: "text-sobre-acento",
    dibujo: (
      <>
        <path d="M24 8l13 5v10c0 8-5.5 14-13 17-7.5-3-13-9-13-17V13Z" />
        <path d="M17 21h14M19 27h10" />
      </>
    ),
  },
  exploradores: {
    fondo: "bg-tinta",
    trazo: "text-papel",
    dibujo: (
      <>
        <circle cx="24" cy="24" r="15" />
        <path d="M24 13l4 11h-8Z" fill="currentColor" />
        <path d="M20 24h8l-4 11Z" />
      </>
    ),
  },
};

const TAMANOS = {
  grande: {
    caja: "flex flex-col items-center gap-2 text-center",
    icono: "h-20 w-20 rounded-tarjeta",
    nombre: "font-titulo text-[20px] leading-tight font-bold text-tinta",
    letras: "text-[14px] font-semibold tracking-[0.08em] text-apagado",
  },
  compacta: {
    caja: "flex items-center gap-3",
    icono: "h-11 w-11 shrink-0 rounded-ficha",
    nombre: "font-titulo text-[16px] leading-tight font-bold text-tinta",
    letras: "text-[13px] font-semibold tracking-[0.08em] text-apagado",
  },
} as const;

/**
 * El resultado de personalidad que cargó el joven: el ícono de su grupo,
 * debajo el nombre del tipo en español («Arquitecto») y debajo las letras
 * («INTJ-T»). `grande` para su perfil; `compacta`, en fila, para la ficha
 * del postulante que ve la empresa.
 *
 * El grupo y la variante, que el dibujo y la letra final dicen a medias, van
 * en palabras para lectores de pantalla.
 */
export function InsigniaDePersonalidad({
  tipo,
  tamano = "grande",
  etiqueta,
}: {
  tipo: TipoDePersonalidad;
  tamano?: keyof typeof TAMANOS;
  /** Una línea más, debajo de las letras: «Declarado por el postulante». */
  etiqueta?: string;
}) {
  const icono = ICONOS[tipo.grupo];
  const t = TAMANOS[tamano];

  return (
    <div className={t.caja} data-personalidad={tipo.codigo}>
      <span
        className={`flex items-center justify-center ${t.icono} ${icono.fondo} ${icono.trazo}`}
      >
        <svg
          viewBox="0 0 48 48"
          className="h-[70%] w-[70%]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {icono.dibujo}
        </svg>
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className={t.nombre}>{tipo.nombre}</span>
        <span className={t.letras}>
          {tipo.codigo}
          <span className="sr-only">
            {` (${tipo.nombreDelGrupo}, variante ${tipo.nombreDeLaVariante.toLowerCase()})`}
          </span>
        </span>
        {etiqueta && (
          <span className="text-[13px] text-apagado">{etiqueta}</span>
        )}
      </span>
    </div>
  );
}
