import { Avatar } from "@/components/ui/Avatar";
import { Insignia } from "@/components/ui/Insignia";
import type { Formacion } from "@/lib/data/tipos";
import { etiquetaEstadoFormacion } from "@/lib/formato";

/**
 * Formación declarada (RF2.4).
 *
 * Cada fila reserva a la izquierda un cuadro fijo con las iniciales de la
 * institución, para que la lista se lea alineada. `db/schema.sql` no guarda
 * logo, años ni acreditación de la institución: `formaciones` tiene solo
 * institución, título y estado.
 */
export function ListaFormacion({ formaciones }: { formaciones: Formacion[] }) {
  if (formaciones.length === 0) {
    return (
      <p className="text-sm text-tinta-suave">
        Todavía no cargaste estudios. Agregá tu formación en curso: es lo que
        más mira una empresa en un perfil sin experiencia previa.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-borde">
      {formaciones.map((formacion) => (
        <li
          key={formacion.id}
          className="flex items-start gap-4 py-4 first:pt-0 last:pb-0"
        >
          <Avatar nombre={formacion.institucion} forma="cuadrado" />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-tinta">
                {formacion.titulo}
              </h3>
              <Insignia
                tono={formacion.estado === "finalizado" ? "exito" : "primario"}
              >
                {etiquetaEstadoFormacion(formacion.estado)}
              </Insignia>
            </div>

            <p className="mt-0.5 text-sm text-tinta-media">
              {formacion.institucion}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
