import { Insignia } from "@/components/ui/Insignia";
import type { EstadoVacante } from "@/lib/data/tipos";
import { ETIQUETA_ESTADO_BUSQUEDA } from "@/lib/dominio/ReglasDeBusqueda";

/**
 * Estado de una búsqueda. Activa va en acento y no en turquesa: el turquesa
 * dice «logrado», y una búsqueda abierta es justo lo contrario.
 */
const TONO = {
  activa: "acento",
  pausada: "neutro",
  cerrada: "apagado",
} as const satisfies Record<EstadoVacante, string>;

export function InsigniaDeBusqueda({ estado }: { estado: EstadoVacante }) {
  return (
    <Insignia tono={TONO[estado]}>{ETIQUETA_ESTADO_BUSQUEDA[estado]}</Insignia>
  );
}
