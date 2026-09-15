"use client";

import { useState } from "react";

import { Etiqueta } from "@/components/ui/Etiqueta";
import { ReglasDeRegistro } from "@/lib/dominio/ReglasDeRegistro";
import type { OpcionCatalogo } from "@/lib/data/tipos";

/**
 * Elección de intereses dentro del registro (RF1.1.11).
 *
 * No es el `SelectorTags` del perfil: aquel guarda cada toque con una acción de
 * servidor porque el perfil ya existe. Acá todavía no hay perfil ni sesión, así
 * que lo elegido viaja con el resto del formulario, en campos ocultos.
 *
 * El mínimo lo pone `ReglasDeRegistro` y lo vuelve a comprobar la acción de
 * servidor. Acá el contador está para que se vea cuánto falta mientras se
 * elige, no para decidir.
 */
export function SelectorIntereses({
  opciones,
  esEjemplo = false,
}: {
  opciones: OpcionCatalogo[];
  /** El catálogo salió de `ejemplos.ts`: sus ids no existen en la base. */
  esEjemplo?: boolean;
}) {
  const [elegidos, setElegidos] = useState<string[]>([]);

  const minimo = ReglasDeRegistro.TAGS_MINIMOS;
  const faltan = Math.max(0, minimo - elegidos.length);

  function alternar(id: string) {
    setElegidos((previos) =>
      previos.includes(id)
        ? previos.filter((elegido) => elegido !== id)
        : [...previos, id],
    );
  }

  return (
    <fieldset disabled={esEjemplo}>
      <legend className="text-[14px] font-medium text-tinta">
        Áreas de interés
      </legend>

      <p className="mt-1 text-[13px] text-apagado">
        Elegí al menos {minimo}. Con esto armamos tu feed: sin intereses, todas
        las vacantes te aparecen igual de lejos.
      </p>

      <ul className="mt-2 flex flex-wrap gap-1.5">
        {opciones.map((opcion) => {
          const elegido = elegidos.includes(opcion.id);

          return (
            <li key={opcion.id}>
              <button
                type="button"
                onClick={() => alternar(opcion.id)}
                aria-pressed={elegido}
                className="rounded-control transition-opacity duration-150 hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Etiqueta coincide={elegido}>{opcion.nombre}</Etiqueta>
              </button>
            </li>
          );
        })}
      </ul>

      {/*
       * Lo elegido viaja como campos ocultos y no como estado del cliente: el
       * formulario se manda con una acción de servidor, que lee `FormData`.
       */}
      {elegidos.map((id) => (
        <input key={id} type="hidden" name="tags" value={id} />
      ))}

      <p
        aria-live="polite"
        className={`mt-2 text-[13px] ${faltan > 0 ? "text-tinta" : "text-apagado"}`}
      >
        {esEjemplo
          ? "Con datos de demostración no se puede elegir: estos intereses no existen en la base."
          : faltan > 0
            ? `Elegiste ${elegidos.length}. ${
                faltan === 1 ? "Falta una." : `Faltan ${faltan}.`
              }`
            : `Elegiste ${elegidos.length}.`}
      </p>
    </fieldset>
  );
}
