"use client";

import { useActionState } from "react";

import { Boton } from "@/components/ui/Boton";
import { CAMPO, Campo } from "@/components/ui/Campo";
import { EnfocarPrimerError } from "@/components/ui/EnfocarPrimerError";
import { MensajeDeAccion } from "@/components/ui/MensajeDeAccion";
import { valoresDeFormulario } from "@/components/ui/valoresDeFormulario";
import { guardarResultadoDeTest } from "@/lib/acciones/interviewLab";
import { FORMULARIO_INICIAL } from "@/lib/acciones/tipos";
import type { ResultadoDeTest } from "@/lib/data/tipos";
import {
  type ClaveDeTestOpcional,
  LARGO_MAXIMO_PUNTAJE,
  LARGO_MAXIMO_RESULTADO,
} from "@/lib/dominio/InterviewLab";

/**
 * Cargar o cambiar el resultado de un test de JobCannon (migración 010):
 * nivel o puntaje y el resultado principal, los dos opcionales.
 *
 * Conserva lo escrito si la acción devuelve un error, como el resto de los
 * formularios. Sin resultado ofrece la casilla de mostrarlo (sin marcar);
 * editando no la muestra: la visibilidad se cambia con el interruptor.
 */
export function FormularioDeResultadoDeTest({
  test,
  guardado,
  esEjemplo = false,
}: {
  test: ClaveDeTestOpcional;
  guardado: ResultadoDeTest | null;
  esEjemplo?: boolean;
}) {
  const [estado, enviar, enCurso] = useActionState(
    guardarResultadoDeTest,
    FORMULARIO_INICIAL,
  );
  const valor = valoresDeFormulario(estado);
  const error = estado.campos ?? {};
  const id = (campo: string) => `${test}-${campo}`;

  return (
    <form
      action={enviar}
      className="space-y-4"
      aria-label={guardado ? "Cambiar resultado" : "Cargar resultado"}
    >
      <EnfocarPrimerError estado={estado} />
      <input type="hidden" name="test" value={test} />

      <Campo
        etiqueta="Nivel o puntaje (opcional)"
        ayuda="Por ejemplo: «Excepcional» o «24 de 30»."
        error={error.puntaje}
      >
        <input
          id={id("puntaje")}
          name="puntaje"
          defaultValue={valor.texto("puntaje", guardado?.puntaje ?? "")}
          maxLength={LARGO_MAXIMO_PUNTAJE}
          aria-invalid={error.puntaje ? true : undefined}
          className={`mt-1.5 ${CAMPO}`}
        />
      </Campo>

      <Campo
        etiqueta="Resultado principal (opcional)"
        ayuda="Lo más importante que te dijo el test, en una o dos frases."
        error={error.resultado}
      >
        <textarea
          id={id("resultado")}
          name="resultado"
          rows={2}
          defaultValue={valor.texto("resultado", guardado?.resultado ?? "")}
          maxLength={LARGO_MAXIMO_RESULTADO}
          aria-invalid={error.resultado ? true : undefined}
          className={`mt-1.5 resize-y ${CAMPO}`}
        />
      </Campo>

      {!guardado && (
        <label className="flex cursor-pointer items-start gap-2.5 text-[15px] text-tinta">
          <input
            type="checkbox"
            name="visible"
            value="si"
            defaultChecked={valor.texto("visible", "") === "si"}
            className="mt-1 h-4 w-4 accent-[var(--ly-violeta-texto)]"
          />
          <span>
            Mostrar a las empresas a las que me postulo
            <span className="block text-[13px] text-apagado">
              Lo podés cambiar cuando quieras.
            </span>
          </span>
        </label>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3">
        <MensajeDeAccion estado={estado} />
        <Boton
          type="submit"
          variante="secundario"
          disabled={esEjemplo || enCurso}
        >
          {enCurso ? "Guardando…" : "Guardar resultado"}
        </Boton>
      </div>
    </form>
  );
}
