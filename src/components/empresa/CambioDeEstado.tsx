import { BotonAccion } from "@/components/ui/BotonAccion";
import { BotonConfirmado } from "@/components/ui/BotonConfirmado";
import { cambiarEstadoPostulacion } from "@/lib/acciones/busquedas";
import type { EstadoPostulacion } from "@/lib/data/tipos";
import { EstadoParaEmpresa } from "@/lib/dominio/EstadoParaEmpresa";

const EN_CURSO: Partial<Record<EstadoPostulacion, string>> = {
  en_revision: "Pasando…",
  entrevista: "Citando…",
};

/**
 * Los pasos que la empresa puede dar con una postulación (RF3.4.3), según
 * `EstadoParaEmpresa`: solo hacia adelante. Revisar y citar se hacen con un
 * toque; seleccionar y descartar son finales y piden confirmación.
 *
 * La `key` lleva el estado actual: cuando la acción termina y la pantalla se
 * vuelve a leer, los botones del estado nuevo nacen limpios en vez de heredar
 * el «hecho» de los anteriores.
 */
export function CambioDeEstado({
  postulacionId,
  estado,
  nombre,
  esEjemplo = false,
}: {
  postulacionId: string;
  estado: EstadoPostulacion;
  /** Nombre de pila, para que la confirmación diga a quién le llega el aviso. */
  nombre: string;
  esEjemplo?: boolean;
}) {
  const siguientes = new EstadoParaEmpresa(estado).siguientes;
  if (siguientes.length === 0) return null;

  return (
    <div className="flex flex-wrap items-start gap-2">
      {siguientes.map(({ estado: destino, accion }) => {
        const key = `${estado}-${destino}`;
        const campos = { id: postulacionId, estado: destino };

        if (destino === "aceptada" || destino === "rechazada") {
          const selecciona = destino === "aceptada";
          return (
            <BotonConfirmado
              key={key}
              accion={cambiarEstadoPostulacion}
              campos={campos}
              variante={selecciona ? "secundario" : "fantasma"}
              deshabilitado={esEjemplo}
              textos={{
                inicial: accion,
                pregunta: selecciona
                  ? `Le avisamos a ${nombre} que su postulación fue aceptada. Es un estado final: después no se puede cambiar.`
                  : `Le avisamos a ${nombre} que no siguió en el proceso. Es un estado final: después no se puede cambiar.`,
                confirmar: selecciona ? "Sí, seleccionar" : "Sí, descartar",
                enCurso: selecciona ? "Seleccionando…" : "Descartando…",
              }}
            />
          );
        }

        return (
          <BotonAccion
            key={key}
            accion={cambiarEstadoPostulacion}
            campo="id"
            valor={postulacionId}
            extras={{ estado: destino }}
            variante="secundario"
            esEjemplo={esEjemplo}
            textos={{
              inicial: accion,
              ejemplo: accion,
              enCurso: EN_CURSO[destino] ?? "Guardando…",
              hecho: "Listo",
            }}
          />
        );
      })}
    </div>
  );
}
