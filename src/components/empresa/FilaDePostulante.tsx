import Link from "next/link";

import { Avatar } from "@/components/ui/Avatar";
import { Insignia } from "@/components/ui/Insignia";
import type { PostulacionRecibida } from "@/lib/data/tipos";
import type { CoincidenciaDeCandidato } from "@/lib/dominio/CoincidenciaDeCandidato";
import { EstadoParaEmpresa } from "@/lib/dominio/EstadoParaEmpresa";
import { tiempoRelativo } from "@/lib/formato";

import { Coincidencia } from "./Coincidencia";
import { HabilidadesDeclaradas } from "./HabilidadesDeclaradas";

/**
 * Una persona que se postuló, en el listado de una búsqueda (RF3.4.1): quién
 * es, en qué estado está y cuánto declara de lo que se pide. El nombre lleva
 * a su ficha completa, donde se cambia el estado.
 *
 * Quien se retiró aparece igual —la postulación no se borra nunca—, pero sin
 * datos: dejó de compartirlos con la empresa.
 */
export function FilaDePostulante({
  postulacion,
  coincidencia,
  href,
  detalle,
}: {
  postulacion: PostulacionRecibida;
  coincidencia: CoincidenciaDeCandidato;
  /** La ficha de la persona en esta búsqueda. */
  href: string;
  /** Una línea más, para cuando la fila aparece fuera de su búsqueda. */
  detalle?: React.ReactNode;
}) {
  const estado = new EstadoParaEmpresa(postulacion.estado);
  const { persona } = postulacion;

  if (!persona) {
    return (
      <li className="flex items-center gap-4 py-4">
        <span
          aria-hidden="true"
          className="h-12 w-12 shrink-0 rounded-full border border-dashed border-borde-control/70"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] text-apagado">
            Una persona se retiró del proceso{" "}
            {tiempoRelativo(postulacion.actualizada_en)}.
          </p>
          <p className="text-[13px] text-apagado">
            Sus datos dejaron de compartirse con tu empresa.
          </p>
        </div>
        <Insignia tono={estado.tono}>{estado.etiqueta}</Insignia>
      </li>
    );
  }

  const nombre = `${persona.nombre} ${persona.apellido}`;

  return (
    <li className="relative flex flex-col gap-3 py-5 sm:flex-row sm:items-start sm:gap-4">
      <Avatar nombre={nombre} url={persona.foto_url} />

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h3 className="text-[17px] font-semibold text-tinta">
            <Link
              href={href}
              className="underline-offset-4 after:absolute after:inset-0 hover:underline"
            >
              {nombre}
            </Link>
          </h3>
          <Insignia tono={estado.tono}>{estado.etiqueta}</Insignia>
        </div>

        <p className="flex flex-wrap gap-x-3 text-[13px] text-apagado">
          <span>@{persona.nombre_usuario}</span>
          <span>{persona.pais}</span>
          <span>se postuló {tiempoRelativo(postulacion.creada_en)}</span>
        </p>

        {detalle}

        <Coincidencia coincidencia={coincidencia} />
        <HabilidadesDeclaradas
          habilidades={postulacion.habilidades}
          coincidencia={coincidencia}
        />
      </div>
    </li>
  );
}
