import { BotonEnlace } from "@/components/ui/Boton";
import { BotonAccion } from "@/components/ui/BotonAccion";
import { BotonConfirmado } from "@/components/ui/BotonConfirmado";
import {
  cambiarEstadoBusqueda,
  eliminarBusqueda,
} from "@/lib/acciones/busquedas";
import type { BusquedaResumen } from "@/lib/data/tipos";
import { ReglasDeBusqueda } from "@/lib/dominio/ReglasDeBusqueda";

/** Cómo se lee cada acción mientras ocurre y cuando ya ocurrió. */
const TEXTOS = {
  pausar: { enCurso: "Pausando…", hecho: "Pausada" },
  reactivar: { enCurso: "Reactivando…", hecho: "Activa otra vez" },
} as const;

/**
 * Lo que la empresa puede hacer con una búsqueda (RF3.2, RF3.3): editar,
 * pausar o reactivar, cerrar y, si nadie se postuló, eliminar.
 *
 * Qué se ofrece lo decide `ReglasDeBusqueda`. Cerrar y eliminar no tienen
 * vuelta atrás y piden confirmación en la misma pantalla.
 */
export function AccionesDeBusqueda({
  busqueda,
  esEjemplo = false,
}: {
  busqueda: BusquedaResumen;
  esEjemplo?: boolean;
}) {
  const acciones = ReglasDeBusqueda.acciones(busqueda.estado);
  const campos = { id: busqueda.id };

  return (
    <div className="flex flex-wrap items-start gap-2">
      {ReglasDeBusqueda.puedeEditar(busqueda.estado) && (
        <BotonEnlace href={`/empresa/busquedas/${busqueda.id}/editar`}>
          Editar
        </BotonEnlace>
      )}

      {acciones.map(({ accion, etiqueta }) =>
        accion === "cerrar" ? (
          <BotonConfirmado
            key={`${busqueda.estado}-${accion}`}
            accion={cambiarEstadoBusqueda}
            campos={{ ...campos, accion }}
            deshabilitado={esEjemplo}
            textos={{
              inicial: etiqueta,
              pregunta:
                "La búsqueda deja de recibir postulaciones y no se puede reabrir. Las postulaciones nuevas pasan a descartadas y les avisamos; las que estén en revisión o entrevista siguen su curso.",
              confirmar: "Sí, cerrarla",
              enCurso: "Cerrando…",
            }}
          />
        ) : (
          <BotonAccion
            key={`${busqueda.estado}-${accion}`}
            accion={cambiarEstadoBusqueda}
            campo="id"
            valor={busqueda.id}
            extras={{ accion }}
            variante="secundario"
            esEjemplo={esEjemplo}
            textos={{ inicial: etiqueta, ejemplo: etiqueta, ...TEXTOS[accion] }}
          />
        ),
      )}

      {ReglasDeBusqueda.puedeEliminar(busqueda.postulaciones) && (
        <BotonConfirmado
          accion={eliminarBusqueda}
          campos={campos}
          variante="fantasma"
          deshabilitado={esEjemplo}
          textos={{
            inicial: "Eliminar",
            pregunta:
              "Nadie se postuló todavía, así que se puede borrar del todo. No se puede deshacer.",
            confirmar: "Sí, eliminarla",
            enCurso: "Eliminando…",
          }}
        />
      )}
    </div>
  );
}
