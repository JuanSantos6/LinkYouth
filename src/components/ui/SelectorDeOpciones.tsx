"use client";

import { useState } from "react";

import { Etiqueta } from "@/components/ui/Etiqueta";
import type { OpcionCatalogo } from "@/lib/data/tipos";

/**
 * Elección de varias opciones de un catálogo cerrado, como etiquetas que se
 * prenden y se apagan. Lo elegido viaja en campos ocultos con `nombre`, porque
 * el formulario se manda con una acción de servidor que lee `FormData`.
 *
 * El mínimo y el máximo los pone la regla de negocio de quien lo usa y los
 * vuelve a comprobar la acción de servidor. Acá el contador está para que se
 * vea cuánto falta o cuánto queda mientras se elige, no para decidir.
 *
 * `tono`: «coincide» (turquesa) es el del joven, que elige lo que ya tiene;
 * «acento» es el de la empresa, donde el turquesa no se usa en habilidades.
 */
export function SelectorDeOpciones({
  nombre,
  leyenda,
  ayuda,
  opciones,
  inicial = [],
  minimo = 0,
  maximo,
  error,
  tono = "coincide",
  textoMarca = "elegida",
  deshabilitado = false,
  avisoDeshabilitado,
}: {
  nombre: string;
  leyenda: string;
  ayuda?: string;
  opciones: OpcionCatalogo[];
  /** Ids elegidos al abrir el formulario: lo guardado, o lo que se mandó. */
  inicial?: string[];
  minimo?: number;
  maximo?: number;
  error?: string;
  tono?: "coincide" | "acento";
  /** Lo que lee un lector de pantalla en cada opción elegida. */
  textoMarca?: string;
  deshabilitado?: boolean;
  /** Por qué no se puede elegir, cuando está deshabilitado. */
  avisoDeshabilitado?: string;
}) {
  const [elegidos, setElegidos] = useState<string[]>(inicial);

  const faltan = Math.max(0, minimo - elegidos.length);
  const lleno = maximo !== undefined && elegidos.length >= maximo;

  function alternar(id: string) {
    setElegidos((previos) =>
      previos.includes(id)
        ? previos.filter((elegido) => elegido !== id)
        : [...previos, id],
    );
  }

  const cuenta =
    deshabilitado && avisoDeshabilitado
      ? avisoDeshabilitado
      : faltan > 0
        ? `Elegiste ${elegidos.length}. ${faltan === 1 ? "Falta una." : `Faltan ${faltan}.`}`
        : lleno
          ? `Elegiste ${elegidos.length}, el máximo.`
          : `Elegiste ${elegidos.length}${maximo ? ` de hasta ${maximo}` : ""}.`;

  return (
    <fieldset disabled={deshabilitado} aria-invalid={error ? true : undefined}>
      <legend className="text-[14px] font-medium text-tinta">{leyenda}</legend>

      {ayuda && <p className="mt-1 text-[13px] text-apagado">{ayuda}</p>}

      <ul className="mt-2 flex flex-wrap gap-1.5">
        {opciones.map((opcion) => {
          const elegido = elegidos.includes(opcion.id);

          return (
            <li key={opcion.id}>
              <button
                type="button"
                onClick={() => alternar(opcion.id)}
                aria-pressed={elegido}
                disabled={!elegido && lleno}
                className="rounded-full transition-opacity duration-150 hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {elegido && tono === "acento" ? (
                  <Etiqueta marcada={textoMarca}>{opcion.nombre}</Etiqueta>
                ) : (
                  <Etiqueta coincide={elegido}>{opcion.nombre}</Etiqueta>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {elegidos.map((id) => (
        <input key={id} type="hidden" name={nombre} value={id} />
      ))}

      <p
        aria-live="polite"
        className={`mt-2 text-[13px] ${
          error
            ? "font-medium text-alerta"
            : faltan > 0
              ? "text-tinta"
              : "text-apagado"
        }`}
      >
        {error ?? cuenta}
      </p>
    </fieldset>
  );
}
