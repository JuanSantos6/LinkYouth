import type { FeedDeVacantes } from "@/lib/dominio/FeedDeVacantes";

import { FilaVacante } from "./FilaVacante";

/**
 * El listado de vacantes: tarjetas apiladas, en el orden de `FeedDeVacantes`.
 */
export function ListadoDeVacantes({
  feed,
  yaPostuladas,
  esEjemplo = false,
  conSesion = true,
}: {
  feed: FeedDeVacantes;
  yaPostuladas: Set<string>;
  /** Las vacantes salieron de `ejemplos.ts`. */
  esEjemplo?: boolean;
  conSesion?: boolean;
}) {
  return (
    <ul className="grid gap-3">
      {feed.entradas.map((entrada) => (
        <li key={entrada.vacante.id}>
          <FilaVacante
            entrada={entrada}
            yaPostulado={yaPostuladas.has(entrada.vacante.id)}
            esEjemplo={esEjemplo}
            conSesion={conSesion}
          />
        </li>
      ))}
    </ul>
  );
}
