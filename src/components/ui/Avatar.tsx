import { iniciales } from "@/lib/formato";

type AvatarProps = {
  nombre: string;
  url?: string | null;
  tamano?: "sm" | "md" | "lg";
  /** `cuadrado` para logos institucionales, `redondo` para personas. */
  forma?: "redondo" | "cuadrado";
};

const TAMANOS = {
  sm: "h-9 w-9 text-[12px]",
  md: "h-11 w-11 text-[13px]",
  lg: "h-20 w-20 text-[20px]",
} as const;

/**
 * Foto o logo. Cuando no hay imagen cargada muestra las iniciales con el mismo
 * tamaño, así la grilla nunca cambia de alto según haya foto o no.
 */
export function Avatar({
  nombre,
  url,
  tamano = "md",
  forma = "redondo",
}: AvatarProps) {
  const radio = forma === "redondo" ? "rounded-full" : "rounded-ficha";
  const clases = `${TAMANOS[tamano]} ${radio} shrink-0 border border-borde bg-realce object-cover`;

  if (url) {
    // Las fotos y los logos viven en Supabase Storage, con dominios variables:
    // no pasan por el optimizador de imágenes de Next.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={nombre} className={clases} />
    );
  }

  return (
    <span
      className={`${clases} flex items-center justify-center font-medium text-apagado`}
      aria-hidden="true"
    >
      {iniciales(nombre)}
    </span>
  );
}
