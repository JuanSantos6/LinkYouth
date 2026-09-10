import { Avatar } from "@/components/ui/Avatar";
import { Insignia } from "@/components/ui/Insignia";
// TODO: reconectar contra db/schema.sql
import type { Formacion } from "@/lib/data/tipos";
import type { EstadoFormacion } from "@/types/database";

const ESTADOS: Record<EstadoFormacion, string> = {
  en_curso: "En curso",
  finalizado: "Finalizado",
  abandonado: "Sin finalizar",
};

function periodo(formacion: Formacion): string {
  if (!formacion.anio_inicio) return "";
  if (formacion.estado === "en_curso") return `Desde ${formacion.anio_inicio}`;
  if (!formacion.anio_fin) return `${formacion.anio_inicio}`;

  return `${formacion.anio_inicio} – ${formacion.anio_fin}`;
}

/**
 * Formación declarada (RF2.4).
 *
 * Cada fila reserva a la izquierda un cuadro fijo para el logo de la
 * institución. Cuando el logo no está cargado, ese cuadro muestra las
 * iniciales: la lista se lee igual de alineada con logo y sin logo.
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
          <Avatar
            nombre={formacion.institucion}
            url={formacion.institucion_logo_url}
            forma="cuadrado"
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-tinta">
                {formacion.titulo}
              </h3>
              {formacion.acreditada && (
                <Insignia tono="exito">Acreditado</Insignia>
              )}
            </div>

            <p className="mt-0.5 text-sm text-tinta-media">
              {formacion.institucion}
            </p>

            <p className="mt-1 text-xs text-tinta-suave">
              {[ESTADOS[formacion.estado], periodo(formacion)]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
