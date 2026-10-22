import type { ImagenDePagina } from "@/lib/imagenes";

/**
 * Una foto de la página, con sus tamaños (`srcSet`) y su texto alternativo:
 * de Unsplash por hotlink, o propia en WebP desde `public/imagenes/`.
 *
 * Reserva el espacio desde el HTML con `width` y `height` y recorta al bloque
 * con `object-cover`. La primera foto visible de la portada lleva `prioridad`
 * (`loading="eager"` y `fetchPriority="high"`).
 *
 * Si trae `credito` (las de Unsplash), lleva encima, abajo a la derecha, «Foto
 * de Autor en Unsplash» con los dos enlaces, como piden sus directrices. Para
 * eso la foto va dentro de un contenedor `relative` con las mismas clases.
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
  const foto = (
    // eslint-disable-next-line @next/next/no-img-element -- hotlink de Unsplash o WebP propio ya generado en dos tamaños con srcSet
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
      style={imagen.color ? { backgroundColor: imagen.color } : undefined}
      className={`object-cover ${imagen.credito ? "h-full w-full" : className}`.trim()}
    />
  );

  if (!imagen.credito) return foto;

  return (
    <span className={`relative block ${className}`.trim()}>
      {foto}
      <CreditoDeFoto credito={imagen.credito} />
    </span>
  );
}

/** «Foto de Autor en Unsplash», sobre la esquina de la foto. */
export function CreditoDeFoto({
  credito,
}: {
  credito: NonNullable<ImagenDePagina["credito"]>;
}) {
  return (
    <span className="absolute right-2 bottom-2 z-10 max-w-[calc(100%-16px)] truncate rounded-full bg-[#15132A]/70 px-2.5 py-1 text-[11px] leading-none text-white backdrop-blur-sm">
      Foto de{" "}
      <a
        href={credito.autorEnlace}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2"
      >
        {credito.autor}
      </a>{" "}
      en{" "}
      <a
        href={credito.unsplashEnlace}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2"
      >
        Unsplash
      </a>
    </span>
  );
}
