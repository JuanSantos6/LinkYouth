"use client";

import { useActionState, useState } from "react";

import { InsigniaDePersonalidad } from "@/components/perfil/InsigniaDePersonalidad";
import { Boton } from "@/components/ui/Boton";
import { CAMPO, Campo } from "@/components/ui/Campo";
import { EnfocarPrimerError } from "@/components/ui/EnfocarPrimerError";
import { MensajeDeAccion } from "@/components/ui/MensajeDeAccion";
import { valoresDeFormulario } from "@/components/ui/valoresDeFormulario";
import { guardarPersonalidad } from "@/lib/acciones/personalidad";
import { FORMULARIO_INICIAL } from "@/lib/acciones/tipos";
import {
  TipoDePersonalidad,
  VARIANTES,
} from "@/lib/dominio/TipoDePersonalidad";

const OPCIONES = TipoDePersonalidad.opciones();

/**
 * Cargar o cambiar el resultado del test (migración 009).
 *
 * El tipo se elige de la lista de los 16, agrupada, y la variante con dos
 * opciones: nada se escribe a mano. Al elegir, se ve la insignia como va a
 * quedar. Conserva lo elegido si la acción devuelve un error, como el resto
 * de los formularios (`valoresDeFormulario`).
 *
 * `visibleActual` existe cuando ya hay un resultado: editar el tipo no
 * cambia lo que el joven decidió sobre mostrarlo. Sin resultado, el
 * formulario ofrece la casilla, que arranca sin marcar.
 */
export function FormularioDePersonalidad({
  guardado,
  visibleActual,
  esEjemplo = false,
}: {
  /** El código guardado («INTJ-T»), o `null`. */
  guardado: string | null;
  visibleActual?: boolean;
  esEjemplo?: boolean;
}) {
  const [estado, enviar, enCurso] = useActionState(
    guardarPersonalidad,
    FORMULARIO_INICIAL,
  );
  const valor = valoresDeFormulario(estado);
  const error = estado.campos ?? {};
  const actual = TipoDePersonalidad.de(guardado);

  const [letras, setLetras] = useState(
    valor.texto("letras", actual?.letras ?? ""),
  );
  const [variante, setVariante] = useState(
    valor.texto("variante", actual?.variante ?? ""),
  );
  const vista = TipoDePersonalidad.armar(letras, variante);
  const editando = visibleActual !== undefined;

  return (
    <form
      action={enviar}
      className="space-y-4"
      aria-label={editando ? "Cambiar resultado" : "Cargar resultado"}
    >
      <EnfocarPrimerError estado={estado} />

      <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-start">
        <div className="space-y-4">
          <Campo
            etiqueta="Tu tipo"
            ayuda="El que te dio el test, por nombre y letras."
            error={error.letras}
          >
            <select
              name="letras"
              defaultValue={valor.texto("letras", actual?.letras ?? "")}
              onChange={(e) => setLetras(e.target.value)}
              required
              aria-invalid={error.letras ? true : undefined}
              className={`mt-1.5 ${CAMPO}`}
            >
              <option value="" disabled>
                Elegí de la lista
              </option>
              {OPCIONES.map((grupo) => (
                <optgroup key={grupo.grupo} label={grupo.titulo}>
                  {grupo.tipos.map((t) => (
                    <option key={t.letras} value={t.letras}>
                      {t.nombre} ({t.letras})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Campo>

          <fieldset aria-invalid={error.variante ? true : undefined}>
            <legend className="text-[14px] font-medium text-tinta">
              Variante
            </legend>
            <p className="text-[13px] text-apagado">
              La letra después del guion: -A o -T.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(Object.keys(VARIANTES) as (keyof typeof VARIANTES)[]).map(
                (v) => (
                  <label
                    key={v}
                    className="flex cursor-pointer items-center gap-2 rounded-ficha border border-borde-control/70 px-3.5 py-2.5 text-[15px] text-tinta transition-colors duration-150 hover:border-tinta has-[:checked]:border-acento has-[:checked]:bg-lavanda"
                  >
                    <input
                      type="radio"
                      name="variante"
                      value={v}
                      defaultChecked={
                        valor.texto("variante", actual?.variante ?? "") === v
                      }
                      onChange={() => setVariante(v)}
                      required
                      className="accent-[var(--ly-violeta-texto)]"
                    />
                    <span>
                      <span className="font-semibold">-{v}</span> {VARIANTES[v]}
                    </span>
                  </label>
                ),
              )}
            </div>
            {error.variante && (
              <p className="mt-1 text-[13px] font-medium text-alerta">
                {error.variante}
              </p>
            )}
          </fieldset>

          {editando ? (
            <input
              type="hidden"
              name="visible"
              value={visibleActual ? "si" : "no"}
            />
          ) : (
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
        </div>

        <div
          aria-live="polite"
          className="flex min-h-40 min-w-44 flex-col items-center justify-center rounded-ficha border border-dashed border-borde-control/70 p-4"
        >
          {vista ? (
            <>
              <span className="mb-3 text-[12px] font-semibold tracking-wide text-apagado uppercase">
                Así va a quedar
              </span>
              <InsigniaDePersonalidad tipo={vista} />
            </>
          ) : (
            <span className="text-center text-[13.5px] text-apagado">
              {letras
                ? "Elegí la variante para ver cómo queda."
                : "Elegí tu tipo para ver cómo queda."}
            </span>
          )}
        </div>
      </div>

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
