import type { FeedDeVacantes } from "@/lib/dominio/FeedDeVacantes";

import { FilaVacante } from "./FilaVacante";

/**
 * El listado de vacantes.
 *
 * La destacada va suelta arriba, elevada; el resto son filas separadas por
 * filetes. Meterla dentro del mismo listado dividido obligaría a cortar los
 * filetes alrededor de su sombra, y se notaría el parche.
 */
export function ListadoDeVacantes({
  feed,
  yaPostuladas,
  esEjemplo = false,
}: {
  feed: FeedDeVacantes;
  yaPostuladas: Set<string>;
  /** Las vacantes salieron de `ejemplos.ts`. */
  esEjemplo?: boolean;
}) {
  const [primera, ...resto] = feed.entradas;
  const destacada = primera?.destacada ? primera : null;
  const filas = destacada ? resto : feed.entradas;

  return (
    <div className="space-y-6">
      {destacada && (
        <FilaVacante
          entrada={destacada}
          yaPostulado={yaPostuladas.has(destacada.vacante.id)}
          esEjemplo={esEjemplo}
        />
      )}

      {filas.length > 0 && (
        <ul className="divide-y divide-filete border-y border-filete">
          {filas.map((entrada) => (
            <li key={entrada.vacante.id}>
              <FilaVacante
                entrada={entrada}
                yaPostulado={yaPostuladas.has(entrada.vacante.id)}
                esEjemplo={esEjemplo}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
