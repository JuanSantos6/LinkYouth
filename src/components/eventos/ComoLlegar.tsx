import { headers } from "next/headers";

import { IconoUbicacion } from "@/components/layout/Iconos";
import { BotonEnlace } from "@/components/ui/Boton";
import { ReglasDeEvento } from "@/lib/dominio/ReglasDeEvento";

/**
 * RF4.4 — Botón «Cómo llegar» para la pantalla de detalle de un evento.
 *
 * Lee el `User-Agent` en el servidor y delega en `ReglasDeEvento` la elección
 * del enlace según el sistema (`maps.apple.com` en iOS, `geo:` en Android o
 * las indicaciones de OpenStreetMap en escritorio). Si el evento no tiene ni
 * coordenadas ni dirección, no muestra nada.
 */
export async function ComoLlegar({
  evento,
}: {
  evento: {
    titulo: string;
    latitud: number | null;
    longitud: number | null;
    direccion: string | null;
  };
}) {
  const cabeceras = await headers();
  const plataforma = ReglasDeEvento.plataformaDe(cabeceras.get("user-agent"));
  const href = ReglasDeEvento.comoLlegar(evento, plataforma);

  if (!href) return null;

  const abreEnOtraPestana = href.startsWith("http");

  return (
    <BotonEnlace
      href={href}
      variante="secundario"
      target={abreEnOtraPestana ? "_blank" : undefined}
      rel={abreEnOtraPestana ? "noopener noreferrer" : undefined}
    >
      <IconoUbicacion />
      Cómo llegar
      {abreEnOtraPestana && (
        <span className="sr-only"> (abre la aplicación de mapas)</span>
      )}
    </BotonEnlace>
  );
}
