"use client";

import { SelectorDeOpciones } from "@/components/ui/SelectorDeOpciones";
import { ReglasDeRegistro } from "@/lib/dominio/ReglasDeRegistro";
import type { OpcionCatalogo } from "@/lib/data/tipos";

/**
 * Elección de intereses dentro del registro (RF1.1.11).
 *
 * No es el `SelectorTags` del perfil: aquel guarda cada toque con una acción de
 * servidor porque el perfil ya existe. Acá todavía no hay perfil ni sesión, así
 * que lo elegido viaja con el resto del formulario, en campos ocultos: de eso
 * se ocupa `SelectorDeOpciones`, que comparte con los formularios de empresa.
 *
 * El mínimo lo pone `ReglasDeRegistro` y lo vuelve a comprobar la acción de
 * servidor.
 */
export function SelectorIntereses({
  opciones,
  inicial = [],
  error,
  esEjemplo = false,
}: {
  opciones: OpcionCatalogo[];
  /** Ids de intereses ya elegidos, para conservarlos si el envío dio error. */
  inicial?: string[];
  error?: string;
  /** El catálogo salió de `ejemplos.ts`: sus ids no existen en la base. */
  esEjemplo?: boolean;
}) {
  const minimo = ReglasDeRegistro.TAGS_MINIMOS;

  return (
    <SelectorDeOpciones
      nombre="tags"
      leyenda="Áreas de interés"
      ayuda={`Elegí al menos ${minimo}. Con esto armamos tu feed: sin intereses, todas las vacantes te aparecen igual de lejos.`}
      opciones={opciones}
      inicial={inicial}
      minimo={minimo}
      error={error}
      deshabilitado={esEjemplo}
      avisoDeshabilitado="Con datos de demostración no se puede elegir: estos intereses no existen en la base."
    />
  );
}
