"use client";

import { useState } from "react";

import { Etiqueta } from "@/components/ui/Etiqueta";
import type { OpcionCatalogo } from "@/lib/data/tipos";

type Visibilidad = "publica" | "oculta";

/**
 * Las habilidades que pide una búsqueda, cada una pública u oculta (RF3.1.6).
 *
 * Se elige como en `SelectorDeOpciones`: la habilidad se prende y se apaga.
 * Cada una elegida aparece abajo con dos opciones, «Pública» (se muestra en la
 * publicación, por defecto) y «Solo vos» (cuenta para la coincidencia pero no
 * llega a quien se postula). Viajan en dos campos ocultos,
 * `habilidades` y `habilidadesOcultas`, que la acción de servidor guarda en
 * tablas distintas; la base no deja que nadie más que la empresa lea la de
 * las ocultas.
 *
 * El mínimo y el máximo (públicas y ocultas juntas) los pone
 * `ReglasDeBusqueda` y los vuelve a comprobar la acción.
 */
export function SelectorDeHabilidades({
  opciones,
  publicas = [],
  ocultas = [],
  minimo = 0,
  maximo,
  error,
}: {
  opciones: OpcionCatalogo[];
  /** Ids elegidos al abrir el formulario: lo guardado, o lo que se mandó. */
  publicas?: string[];
  ocultas?: string[];
  minimo?: number;
  maximo?: number;
  error?: string;
}) {
  const [elegidas, setElegidas] = useState<Map<string, Visibilidad>>(
    () =>
      new Map([
        ...publicas.map((id) => [id, "publica"] as const),
        ...ocultas.map((id) => [id, "oculta"] as const),
      ]),
  );

  const faltan = Math.max(0, minimo - elegidas.size);
  const lleno = maximo !== undefined && elegidas.size >= maximo;
  const nombreDe = new Map(opciones.map((o) => [o.id, o.nombre]));

  function alternar(id: string) {
    setElegidas((previas) => {
      const nuevas = new Map(previas);
      if (nuevas.has(id)) nuevas.delete(id);
      else nuevas.set(id, "publica");
      return nuevas;
    });
  }

  function cambiar(id: string, visibilidad: Visibilidad) {
    setElegidas((previas) => new Map(previas).set(id, visibilidad));
  }

  const cuantasOcultas = [...elegidas.values()].filter(
    (v) => v === "oculta",
  ).length;
  const cuenta =
    faltan > 0
      ? `Elegiste ${elegidas.size}. ${faltan === 1 ? "Falta una." : `Faltan ${faltan}.`}`
      : `Elegiste ${elegidas.size}${maximo ? ` de hasta ${maximo}` : ""}${
          cuantasOcultas
            ? `, ${cuantasOcultas} ${cuantasOcultas === 1 ? "oculta" : "ocultas"}`
            : ""
        }.`;

  return (
    <fieldset aria-invalid={error ? true : undefined}>
      <legend className="text-[14px] font-medium text-tinta">
        Habilidades que pedís
      </legend>
      <p className="mt-1 text-[13px] text-apagado">
        Con estas se ordena a quienes se postulen. Las públicas se muestran en
        la publicación; las que marcás «Solo vos» cuentan igual, pero nadie más
        las ve.
      </p>

      <ul className="mt-2 flex flex-wrap gap-1.5">
        {opciones.map((opcion) => {
          const elegida = elegidas.has(opcion.id);
          return (
            <li key={opcion.id}>
              <button
                type="button"
                onClick={() => alternar(opcion.id)}
                aria-pressed={elegida}
                disabled={!elegida && lleno}
                className="rounded-full transition-opacity duration-150 hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {elegida ? (
                  <Etiqueta marcada="pedida">{opcion.nombre}</Etiqueta>
                ) : (
                  <Etiqueta>{opcion.nombre}</Etiqueta>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {elegidas.size > 0 && (
        <ul className="mt-4 divide-y divide-filete rounded-ficha border border-borde">
          {[...elegidas].map(([id, visibilidad]) => (
            <li
              key={id}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-3 py-2.5"
            >
              <span className="text-[14px] font-medium text-tinta">
                {nombreDe.get(id) ?? id}
              </span>
              <fieldset className="flex gap-1">
                <legend className="sr-only">
                  Quién ve «{nombreDe.get(id) ?? id}»
                </legend>
                {(
                  [
                    ["publica", "Pública"],
                    ["oculta", "Solo vos"],
                  ] as const
                ).map(([valor, texto]) => (
                  <label
                    key={valor}
                    className="cursor-pointer rounded-full border border-borde-control/60 px-3 py-1 text-[13px] text-tinta transition-colors duration-150 has-checked:border-acento has-checked:bg-lavanda has-checked:font-semibold has-checked:text-acento has-focus-visible:outline-2 has-focus-visible:outline-acento"
                  >
                    <input
                      type="radio"
                      name={`visibilidad-${id}`}
                      value={valor}
                      checked={visibilidad === valor}
                      onChange={() => cambiar(id, valor)}
                      className="sr-only"
                    />
                    {texto}
                  </label>
                ))}
              </fieldset>
            </li>
          ))}
        </ul>
      )}

      {[...elegidas].map(([id, visibilidad]) => (
        <input
          key={id}
          type="hidden"
          name={visibilidad === "oculta" ? "habilidadesOcultas" : "habilidades"}
          value={id}
        />
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
