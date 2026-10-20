import { colorDeAvatar } from "@/lib/diseno/avatar";
import { iniciales } from "@/lib/formato";
import { rutaDeImagen } from "@/lib/supabase/rutaDeImagen";

type AvatarProps = {
  nombre: string;
  url?: string | null;
  /** Identificador de la cuenta para que el color sea estable aunque cambie el nombre. */
  semilla?: string;
  tamano?: "xs" | "sm" | "md" | "lg";
  /** `cuadrado` para logos institucionales, `redondo` para personas. */
  forma?: "redondo" | "cuadrado";
};

const TAMANOS = {
  xs: "h-7 w-7 text-[11px]",
  sm: "h-9 w-9 text-[13px]",
  md: "h-12 w-12 text-[14px]",
  lg: "h-20 w-20 text-xl",
} as const;

/**
 * El mismo lado en píxeles que fija cada clase de `TAMANOS`. Va como atributo
 * `width`/`height` de la imagen: las clases reservan el espacio recién cuando
 * llegó la hoja de estilos, el atributo lo reserva desde el HTML.
 */
const LADOS = { xs: 28, sm: 36, md: 48, lg: 80 } as const;

/**
 * Avatar con reserva de espacio para la foto. Cuando no hay imagen cargada
 * muestra las iniciales sobre el color de `colorDeAvatar(semilla ?? nombre)`,
 * así ninguna cuenta queda sin imagen y la grilla nunca cambia de alto.
 */
export function Avatar({
  nombre,
  url,
  semilla,
  tamano = "md",
  forma = "redondo",
}: AvatarProps) {
  const radio = forma === "redondo" ? "rounded-full" : "rounded-ficha";
  const color = colorDeAvatar(semilla ?? nombre);
  const clases = `${TAMANOS[tamano]} ${radio} ${color.fondo} shrink-0 border border-borde object-cover`;

  const src = rutaDeImagen(url);

  if (src) {
    // Los logos y las fotos viven en Supabase Storage, con dominios variables:
    // no pasan por el optimizador de imágenes de Next.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
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
      className={`${clases} ${color.texto} flex items-center justify-center font-titulo font-bold`}
      aria-hidden="true"
    >
      {iniciales(nombre)}
    </span>
  );
}
