"use client";

import { useActionState } from "react";

import { Boton } from "@/components/ui/Boton";
import { CAMPO, Campo } from "@/components/ui/Campo";
import { EnfocarPrimerError } from "@/components/ui/EnfocarPrimerError";
import { MensajeDeAccion } from "@/components/ui/MensajeDeAccion";
import { valoresDeFormulario } from "@/components/ui/valoresDeFormulario";
import { agregarFormacion } from "@/lib/acciones/formacion";
import { FORMULARIO_INICIAL } from "@/lib/acciones/tipos";
import { ESTADOS_FORMACION } from "@/lib/data/tipos";
import { etiquetaEstadoFormacion } from "@/lib/formato";

const LARGO_MAXIMO = 120;

/**
 * Sumar un estudio en curso o finalizado al perfil propio (RF2.4.1).
 *
 * Conserva lo escrito cuando la acción devuelve un error por campo y lleva el
 * foco al primer control inválido. Al guardar bien, `agregarFormacion`
 * revalida `/perfil` y devuelve el estado sin `valores`, así que el formulario
 * queda limpio para cargar otro estudio.
 */
export function FormularioDeFormacion({
  esEjemplo = false,
}: {
  esEjemplo?: boolean;
}) {
  const [estado, enviar, enCurso] = useActionState(
    agregarFormacion,
    FORMULARIO_INICIAL,
  );
  const valor = valoresDeFormulario(estado);
  const error = estado.campos ?? {};

  return (
    <form
      action={enviar}
      className="space-y-4 border-t border-filete pt-5"
      aria-label="Agregar estudio"
    >
      <EnfocarPrimerError estado={estado} />

      <h3 className="text-[15px] font-semibold text-tinta">Agregar estudio</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Campo
            etiqueta="Institución"
            ayuda={
              error.institucion
                ? undefined
                : "Por ejemplo: Facultad de Ingeniería (Udelar), UTU, ORT."
            }
          >
            <input
              name="institucion"
              defaultValue={valor.texto("institucion", "")}
              required
              maxLength={LARGO_MAXIMO}
              aria-invalid={error.institucion ? true : undefined}
              aria-describedby={
                error.institucion ? "error-institucion" : undefined
              }
              className={`mt-1.5 ${CAMPO}`}
            />
          </Campo>
          {error.institucion && (
            <p
              id="error-institucion"
              className="mt-1 text-[13px] font-medium text-alerta"
            >
              {error.institucion}
            </p>
          )}
        </div>

        <div>
          <Campo
            etiqueta="Título o carrera"
            ayuda={
              error.titulo
                ? undefined
                : "Qué estás estudiando o qué terminaste."
            }
          >
            <input
              name="titulo"
              defaultValue={valor.texto("titulo", "")}
              required
              maxLength={LARGO_MAXIMO}
              aria-invalid={error.titulo ? true : undefined}
              aria-describedby={error.titulo ? "error-titulo" : undefined}
              className={`mt-1.5 ${CAMPO}`}
            />
          </Campo>
          {error.titulo && (
            <p
              id="error-titulo"
              className="mt-1 text-[13px] font-medium text-alerta"
            >
              {error.titulo}
            </p>
          )}
        </div>
      </div>

      <div className="sm:max-w-xs">
        <Campo etiqueta="Estado">
          <select
            name="estado"
            defaultValue={valor.texto("estado", "en_curso")}
            required
            aria-invalid={error.estado ? true : undefined}
            aria-describedby={error.estado ? "error-estado" : undefined}
            className={`mt-1.5 ${CAMPO}`}
          >
            {ESTADOS_FORMACION.map((opcion) => (
              <option key={opcion} value={opcion}>
                {etiquetaEstadoFormacion(opcion)}
              </option>
            ))}
          </select>
        </Campo>
        {error.estado && (
          <p
            id="error-estado"
            className="mt-1 text-[13px] font-medium text-alerta"
          >
            {error.estado}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <MensajeDeAccion estado={estado} />
        <Boton
          type="submit"
          variante="secundario"
          disabled={esEjemplo || enCurso}
        >
          {enCurso ? "Agregando…" : "Agregar estudio"}
        </Boton>
      </div>
    </form>
  );
}
