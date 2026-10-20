import type { ImagenDePagina } from "@/lib/imagenes";

/**
 * Foto propia servida en WebP desde `public/imagenes/`, con sus dos tamaños
 * (`srcSet` de 640 y 1280 px) y su texto alternativo.
 *
 * Reserva el espacio desde el HTML con `width` y `height` y recorta al bloque
 * con `object-cover`. La primera foto visible de la portada lleva `prioridad`
 * (`loading="eager"` y `fetchPriority="high"`).
 */
export function Foto({
  imagen,
  sizes = "100vw",
  prioridad = false,
  className = "h-full w-full",
}: {
  imagen: ImagenDePagina;
  sizes?: string;
  prioridad?: boolean;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- WebP propio ya generado en dos tamaños con srcSet
    <img
      src={imagen.src}
      srcSet={imagen.srcSet}
      sizes={sizes}
      alt={imagen.alt}
      width={imagen.ancho}
      height={imagen.alto}
      loading={prioridad ? "eager" : "lazy"}
      fetchPriority={prioridad ? "high" : undefined}
      decoding="async"
      className={`object-cover ${className}`.trim()}
    />
  );
}
