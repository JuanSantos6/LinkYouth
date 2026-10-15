import { IconoUbicacion } from "@/components/layout/Iconos";
import { ReglasDeEvento } from "@/lib/dominio/ReglasDeEvento";

/**
 * «Ver en el mapa», a OpenStreetMap, en pestaña nueva. Si el evento no tiene
 * ni coordenadas ni dirección no aparece: un enlace a un mapa vacío no ayuda
 * a llegar a ningún lado.
 *
 * Lo usan la empresa y el joven: es el mismo evento visto desde los dos lados.
 */
export function EnlaceAlMapa({
  evento,
}: {
  evento: {
    latitud: number | null;
    longitud: number | null;
    direccion: string | null;
  };
}) {
  const href = ReglasDeEvento.enlaceAlMapa(evento);
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-[14px] font-medium text-acento underline-offset-4 hover:underline"
    >
      <IconoUbicacion className="h-4 w-4" />
      Ver en el mapa
      <span className="sr-only"> (OpenStreetMap, se abre en otra pestaña)</span>
    </a>
  );
}
