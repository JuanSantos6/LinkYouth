import Link from "next/link";

import { Avatar } from "@/components/ui/Avatar";
import type { PostulacionRecibida } from "@/lib/data/tipos";
import type { CoincidenciaDeCandidato } from "@/lib/dominio/CoincidenciaDeCandidato";
import { tiempoRelativo } from "@/lib/formato";

/**
 * Una persona en el tablero de postulantes de una búsqueda: foto, nombre,
 * cuántas de las habilidades pedidas declara y hace cuánto se postuló. Entra
 * en una columna angosta. Toda la tarjeta lleva a la ficha.
 *
 * El estado no se repite: ya lo dice el grupo en el que está.
 */
export function TarjetaDePostulante({
  postulacion,
  coincidencia,
  href,
}: {
  postulacion: PostulacionRecibida;
  coincidencia: CoincidenciaDeCandidato;
  href: string;
}) {
  const { persona } = postulacion;

  if (!persona) {
    return (
      <li className="rounded-ficha border border-dashed border-borde-control/70 px-3 py-2.5 text-[13px] text-apagado">
        Una persona se retiró {tiempoRelativo(postulacion.actualizada_en)}. Sus
        datos ya no se comparten.
      </li>
    );
  }

  const nombre = `${persona.nombre} ${persona.apellido}`;
  const pedidas = coincidencia.habilidadesPedidas;

  return (
    <li className="relative flex items-center gap-2.5 rounded-ficha border border-borde bg-superficie px-3 py-2.5 transition-shadow duration-150 hover:shadow-elevada">
      <Avatar
        nombre={nombre}
        url={persona.foto_url}
        semilla={persona.id}
        tamano="sm"
      />
      <span className="min-w-0 flex-1">
        <Link
          href={href}
          className="line-clamp-2 block text-[14.5px] leading-snug font-semibold break-words text-tinta after:absolute after:inset-0 after:rounded-ficha"
        >
          {nombre}
        </Link>
        <span className="block text-[12.5px] leading-snug text-apagado">
          {pedidas > 0 && (
            <>
              {coincidencia.habilidadesCubiertas} de {pedidas}
              <span className="sr-only"> habilidades</span> pedidas ·{" "}
            </>
          )}
          {tiempoRelativo(postulacion.creada_en)}
        </span>
      </span>
    </li>
  );
}
