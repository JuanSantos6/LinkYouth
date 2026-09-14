"use client";

import { useOptimistic, useState, useTransition } from "react";

import { Etiqueta } from "@/components/ui/Etiqueta";
import {
  agregarHabilidad,
  agregarTag,
  quitarHabilidad,
  quitarTag,
} from "@/lib/acciones/perfil";
import type { EstadoAccion } from "@/lib/acciones/tipos";
import type { Catalogos, OpcionCatalogo } from "@/lib/data/tipos";

/**
 * Elección de intereses y habilidades del perfil propio (RF2.3, RF2.4.3).
 *
 * Reemplaza a `NubeTags`, que mostraba lo ya elegido y nada más. Acá se ve el
 * catálogo entero y se marca lo propio, porque los dos catálogos son cerrados:
 * elegir es prender y apagar opciones que ya existen, no escribir texto libre.
 *
 * Van en dos grupos separados porque `db/schema.sql` los guarda en catálogos
 * distintos: `tags` es «me interesa» y `habilidades` es «sé hacer». El
 * matching de RF3.9 necesita esa distinción, así que la interfaz no los
 * mezcla.
 *
 * Es `"use client"` por una razón que no se resuelve con enlaces y
 * `searchParams`: la selección no navega a ningún lado, y necesita el estado
 * optimista para que el chip responda al toque sin esperar el viaje al
 * servidor.
 */
export function SelectorTags({
  catalogos,
  tags,
  habilidades,
  esEjemplo = false,
}: {
  catalogos: Catalogos;
  /** Nombres de los tags que el perfil ya tiene. */
  tags: string[];
  /** Nombres de las habilidades que el perfil ya tiene. */
  habilidades: string[];
  /** El catálogo salió de `ejemplos.ts`: sus ids no existen en la base. */
  esEjemplo?: boolean;
}) {
  return (
    <div className="space-y-6">
      <Grupo
        titulo="Habilidades"
        ayuda="Lo que sabés hacer."
        opciones={catalogos.habilidades}
        elegidas={habilidades}
        agregar={agregarHabilidad}
        quitar={quitarHabilidad}
        esEjemplo={esEjemplo}
      />

      <Grupo
        titulo="Áreas de interés"
        ayuda="Hacia dónde querés ir."
        opciones={catalogos.tags}
        elegidas={tags}
        agregar={agregarTag}
        quitar={quitarTag}
        esEjemplo={esEjemplo}
      />
    </div>
  );
}

/**
 * Un catálogo con sus opciones prendidas y apagadas.
 *
 * Cada grupo tiene su propio estado optimista y su propio mensaje de error: un
 * fallo al guardar una habilidad no tiene por qué revertir ni ensuciar lo que
 * pasa en el otro grupo.
 */
function Grupo({
  titulo,
  ayuda,
  opciones,
  elegidas,
  agregar,
  quitar,
  esEjemplo,
}: {
  titulo: string;
  ayuda: string;
  opciones: OpcionCatalogo[];
  elegidas: string[];
  agregar: (id: string) => Promise<EstadoAccion>;
  quitar: (id: string) => Promise<EstadoAccion>;
  esEjemplo: boolean;
}) {
  const [error, setError] = useState("");
  const [, iniciarTransicion] = useTransition();

  // El estado optimista se deriva de `elegidas`, que viene del servidor. Eso
  // es lo que hace que revertir sea automático: el valor optimista solo existe
  // mientras dura la transición, así que si la acción falla —y por lo tanto no
  // hubo `revalidatePath`— React vuelve a `elegidas` tal cual estaba y el chip
  // se apaga solo. No hay que deshacer nada a mano.
  const [elegidasAhora, alternarOptimista] = useOptimistic(
    elegidas,
    (previas: string[], nombre: string) =>
      previas.includes(nombre)
        ? previas.filter((elegida) => elegida !== nombre)
        : [...previas, nombre],
  );

  function alternar(opcion: OpcionCatalogo) {
    const estaElegida = elegidasAhora.includes(opcion.nombre);

    iniciarTransicion(async () => {
      alternarOptimista(opcion.nombre);
      setError("");

      const resultado = estaElegida
        ? await quitar(opcion.id)
        : await agregar(opcion.id);

      if (resultado.estado === "error") setError(resultado.mensaje);
    });
  }

  return (
    <section>
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-tinta-suave">
        {titulo}
      </h3>
      <p className="mt-0.5 text-xs text-tinta-suave">
        {ayuda} Tocá una etiqueta para sumarla o sacarla.
      </p>

      <ul className="mt-2 flex flex-wrap gap-1.5">
        {opciones.map((opcion) => {
          const elegida = elegidasAhora.includes(opcion.nombre);

          return (
            <li key={opcion.id}>
              <button
                type="button"
                onClick={() => alternar(opcion)}
                aria-pressed={elegida}
                disabled={esEjemplo}
                className="rounded-control transition-opacity duration-150 hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Etiqueta tono={elegida ? "coincide" : "neutra"}>
                  {opcion.nombre}
                </Etiqueta>
              </button>
            </li>
          );
        })}
      </ul>

      <p
        aria-live="polite"
        className={`mt-2 text-xs ${error ? "text-alerta" : "text-tinta-suave"}`}
      >
        {error ||
          (esEjemplo
            ? "Con datos de demostración no se puede elegir: no hay base donde guardarlo."
            : elegidasAhora.length === 0
              ? "Todavía no elegiste ninguna."
              : `Elegiste ${elegidasAhora.length}.`)}
      </p>
    </section>
  );
}
