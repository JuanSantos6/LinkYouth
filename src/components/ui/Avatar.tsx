import { iniciales } from "@/lib/formato";

type AvatarProps = {
  nombre: string;
  url?: string | null;
  tamano?: "sm" | "md" | "lg";
  /** `cuadrado` para logos institucionales, `redondo` para personas. */
  forma?: "redondo" | "cuadrado";
};

const TAMANOS = {
  sm: "h-9 w-9 text-[13px]",
  md: "h-12 w-12 text-[14px]",
  lg: "h-20 w-20 text-xl",
} as const;

/**
 * El mismo lado en píxeles que fija cada clase de `TAMANOS`. Va como atributo
 * `width`/`height` de la imagen: las clases reservan el espacio recién cuando
 * llegó la hoja de estilos, el atributo lo reserva desde el HTML.
 */
const LADOS = { sm: 36, md: 48, lg: 80 } as const;

/**
 * Avatar con reserva de espacio para la foto. Cuando no hay imagen cargada
 * muestra las iniciales, así la grilla nunca cambia de alto.
 */
export function Avatar({
  nombre,
  url,
  tamano = "md",
  forma = "redondo",
}: AvatarProps) {
  const radio = forma === "redondo" ? "rounded-full" : "rounded-control";
  const clases = `${TAMANOS[tamano]} ${radio} shrink-0 border border-borde bg-realce object-cover`;

  if (url) {
    // Los logos y las fotos viven en Supabase Storage, con dominios variables:
    // no pasan por el optimizador de imágenes de Next.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={nombre}
        width={LADOS[tamano]}
        height={LADOS[tamano]}
        loading="lazy"
        className={clases}
      />
    );
  }

  return (
    <span
      className={`${clases} flex items-center justify-center font-semibold text-apagado`}
      aria-hidden="true"
    >
      {iniciales(nombre)}
    </span>
  );
}
