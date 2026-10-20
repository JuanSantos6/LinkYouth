"use client";

import { Avatar } from "@/components/ui/Avatar";
import { BotonConfirmado } from "@/components/ui/BotonConfirmado";
import { Insignia } from "@/components/ui/Insignia";
import { quitarFormacion } from "@/lib/acciones/formacion";
import type { EstadoAccion } from "@/lib/acciones/tipos";
import type { Formacion } from "@/lib/data/tipos";
import { etiquetaEstadoFormacion } from "@/lib/formato";

async function eliminarEstudio(
  _previo: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  return quitarFormacion(String(datos.get("id") ?? ""));
}

/**
 * Formación declarada (RF2.4).
 *
 * Cada fila reserva a la izquierda un cuadro fijo con las iniciales de la
 * institución, para que la lista se lea alineada. `db/schema.sql` no guarda
 * logo, años ni acreditación: `formaciones` tiene institución, título y
 * estado. Cada estudio propio ofrece quitarlo con confirmación en la misma
 * pantalla (RF2.4.2).
 */
export function ListaFormacion({
  formaciones,
  esEjemplo = false,
}: {
  formaciones: Formacion[];
  esEjemplo?: boolean;
}) {
  if (formaciones.length === 0) {
    return (
      <p className="text-[14px] text-apagado">
        Todavía no cargaste estudios. Agregá tu formación en curso: es lo que
        más mira una empresa en un perfil sin experiencia previa.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-filete">
      {formaciones.map((formacion) => (
        <li
          key={formacion.id}
          className="flex flex-wrap items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
        >
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <Avatar
              nombre={formacion.institucion}
              semilla={formacion.institucion}
              forma="cuadrado"
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[15px] font-medium text-tinta">
                  {formacion.titulo}
                </h3>
                <Insignia tono="apagado">
                  {etiquetaEstadoFormacion(formacion.estado)}
                </Insignia>
              </div>

              <p className="mt-0.5 text-[14px] text-apagado">
                {formacion.institucion}
              </p>
            </div>
          </div>

          <BotonConfirmado
            accion={eliminarEstudio}
            campos={{ id: formacion.id }}
            variante="fantasma"
            deshabilitado={esEjemplo}
            textos={{
              inicial: "Quitar",
              pregunta: `Se va a quitar «${formacion.titulo}» en ${formacion.institucion} de tu perfil.`,
              confirmar: "Sí, quitar",
              enCurso: "Quitando…",
            }}
          />
        </li>
      ))}
    </ul>
  );
}
