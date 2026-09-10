import { iniciales } from "@/lib/formato";

type AvatarProps = {
  nombre: string;
  url?: string | null;
  tamano?: "sm" | "md" | "lg";
  /** `cuadrado` para logos institucionales, `redondo` para personas. */
  forma?: "redondo" | "cuadrado";
};

const TAMANOS = {
  sm: "h-9 w-9 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-20 w-20 text-xl",
} as const;

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
  const clases = `${TAMANOS[tamano]} ${radio} shrink-0 border border-borde bg-superficie-suave object-cover`;

  if (url) {
    // Los logos y las fotos viven en Supabase Storage, con dominios variables:
    // no pasan por el optimizador de imágenes de Next.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={nombre} className={clases} />
    );
  }

  return (
    <span
      className={`${clases} flex items-center justify-center font-semibold text-tinta-suave`}
      aria-hidden="true"
    >
      {iniciales(nombre)}
    </span>
  );
}
