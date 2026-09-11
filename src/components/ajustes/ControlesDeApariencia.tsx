"use client";

import { useEffect, useState } from "react";

import { PreferenciasDeApariencia } from "@/lib/diseno/PreferenciasDeApariencia";
import {
  ACENTOS,
  ACENTO_POR_DEFECTO,
  NOMBRES_DE_ACENTO,
  TEMA_POR_DEFECTO,
  type NombreDeAcento,
  type Tema,
} from "@/lib/diseno/tokens";

/**
 * Switch de tema y selector de color.
 *
 * El estado real vive en el elemento raíz, donde ya lo dejó el guion que corre
 * antes del primer pintado. Este componente lo lee al montarse y lo refleja:
 * si arrancara con su propio valor por defecto, el control diría «claro»
 * mientras la pantalla se ve oscura.
 */
export function ControlesDeApariencia() {
  const [preferencias, setPreferencias] =
    useState<PreferenciasDeApariencia | null>(null);
  const [tema, setTema] = useState<Tema>(TEMA_POR_DEFECTO);
  const [acento, setAcento] = useState<NombreDeAcento>(ACENTO_POR_DEFECTO);

  useEffect(() => {
    const actuales = PreferenciasDeApariencia.delDocumento();
    setPreferencias(actuales);
    setTema(actuales.tema);
    setAcento(actuales.acento);
  }, []);

  const enOscuro = tema === "oscuro";

  return (
    <div className="divide-y divide-filete">
      <section className="flex flex-wrap items-center justify-between gap-4 py-5 first:pt-0">
        <div>
          <h2 className="text-[16px] font-semibold text-tinta">Modo oscuro</h2>
          <p className="mt-1 max-w-md text-[14px] text-apagado">
            Cambia el fondo y el texto de toda la aplicación. Se recuerda en
            este navegador.
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enOscuro}
          aria-label="Modo oscuro"
          disabled={!preferencias}
          onClick={() => setTema(preferencias?.alternarTema() ?? tema)}
          className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors duration-150 disabled:opacity-50 ${
            enOscuro
              ? "border-acento bg-acento"
              : "border-borde-control bg-realce"
          }`}
        >
          <span
            aria-hidden="true"
            className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full transition-[left] duration-150 ${
              enOscuro ? "left-6 bg-sobre-acento" : "left-1 bg-apagado"
            }`}
          />
        </button>
      </section>

      <section className="py-5 last:pb-0">
        <h2 className="text-[16px] font-semibold text-tinta">
          Color de la plataforma
        </h2>
        <p className="mt-1 max-w-md text-[14px] text-apagado">
          Cambia los botones, los enlaces y los resaltados. El ámbar de lo
          acreditado no cambia: es lo que te dice qué está validado.
        </p>

        <fieldset className="mt-4">
          <legend className="sr-only">Elegí un color</legend>

          <div className="flex flex-wrap gap-2">
            {NOMBRES_DE_ACENTO.map((nombre) => {
              const elegido = nombre === acento;

              return (
                <label
                  key={nombre}
                  className={`flex cursor-pointer items-center gap-2 rounded-control border px-3 py-2 text-[14px] transition-colors duration-150 ${
                    elegido
                      ? "border-tinta text-tinta"
                      : "border-borde-control text-apagado hover:text-tinta"
                  }`}
                >
                  <input
                    type="radio"
                    name="acento"
                    value={nombre}
                    checked={elegido}
                    disabled={!preferencias}
                    onChange={() => {
                      preferencias?.cambiarAcento(nombre);
                      setAcento(nombre);
                    }}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 rounded-full border border-borde-control"
                    style={{
                      backgroundColor:
                        ACENTOS[nombre][enOscuro ? "oscuro" : "claro"],
                    }}
                  />
                  {ACENTOS[nombre].etiqueta}
                </label>
              );
            })}
          </div>
        </fieldset>
      </section>
    </div>
  );
}
