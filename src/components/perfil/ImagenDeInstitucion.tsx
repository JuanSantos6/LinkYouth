import { colorDeAvatar } from "@/lib/diseno/avatar";
import { Institucion } from "@/lib/dominio/Institucion";

/**
 * La imagen de una institución educativa: una foto genérica de campus o aula
 * cuando la hay, y si no, sus iniciales sobre un color de la paleta, siempre
 * el mismo para el mismo nombre. **Nunca el logo real**: las instituciones
 * son reales y su marca no es nuestra.
 */
export function ImagenDeInstitucion({
  nombre,
  foto,
  tamanio = 48,
}: {
  nombre: string;
  foto?: { src: string; alt: string } | null;
  /** Lado en píxeles. */
  tamanio?: number;
}) {
  const institucion = new Institucion(nombre);
  const lado = { width: tamanio, height: tamanio };

  if (foto) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- foto de Unsplash por hotlink, ver docs/imagenes.md
      <img
        src={foto.src}
        alt={foto.alt}
        {...lado}
        loading="lazy"
        decoding="async"
        style={lado}
        className="shrink-0 rounded-ficha border border-borde object-cover"
      />
    );
  }

  const color = colorDeAvatar(institucion.id);
  return (
    <span
      aria-hidden="true"
      style={lado}
      className={`flex shrink-0 items-center justify-center rounded-ficha border border-borde font-titulo text-[14px] font-bold ${color.fondo} ${color.texto}`}
    >
      {institucion.iniciales}
    </span>
  );
}
