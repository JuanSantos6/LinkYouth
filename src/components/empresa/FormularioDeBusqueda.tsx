"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { Aviso } from "@/components/ui/AvisoOrigen";
import { Boton } from "@/components/ui/Boton";
import { CAMPO, Campo } from "@/components/ui/Campo";
import { MensajeDeAccion } from "@/components/ui/MensajeDeAccion";
import { SelectorDeOpciones } from "@/components/ui/SelectorDeOpciones";
import { guardarBusqueda } from "@/lib/acciones/busquedas";
import { FORMULARIO_INICIAL } from "@/lib/acciones/tipos";
import {
  type BusquedaCompleta,
  type Catalogos,
  MODALIDADES,
} from "@/lib/data/tipos";
import {
  ETIQUETA_MODALIDAD,
  ReglasDeBusqueda,
} from "@/lib/dominio/ReglasDeBusqueda";

import { valoresDeFormulario } from "./valores";

const ids = (opciones: { id: string }[] = []) => opciones.map((o) => o.id);

/**
 * Publicar una búsqueda o editarla (RF3.1, RF3.2).
 *
 * Los límites salen de `ReglasDeBusqueda` y la acción los vuelve a comprobar:
 * los atributos del campo avisan antes de mandar, la acción decide. Las
 * habilidades se marcan en violeta y no en turquesa: en las pantallas de
 * empresa son «habilidades declaradas», y el turquesa dice «acreditado».
 */
export function FormularioDeBusqueda({
  busqueda,
  catalogos,
  esEjemplo = false,
}: {
  /** La búsqueda a editar; sin ella, el formulario publica una nueva. */
  busqueda?: BusquedaCompleta;
  catalogos: Catalogos;
  /** Catálogo o búsqueda de demostración: no hay base donde guardar. */
  esEjemplo?: boolean;
}) {
  const [estado, enviar, enCurso] = useActionState(
    guardarBusqueda,
    FORMULARIO_INICIAL,
  );
  const valor = valoresDeFormulario(estado);
  const error = estado.campos ?? {};

  const [modalidad, setModalidad] = useState(
    valor.texto("modalidad", busqueda?.modalidad ?? ""),
  );
  const pideUbicacion = ReglasDeBusqueda.pideUbicacion(modalidad);
  const editando = Boolean(busqueda);
  const R = ReglasDeBusqueda;

  return (
    <form action={enviar} className="space-y-8">
      {busqueda && <input type="hidden" name="id" value={busqueda.id} />}

      <fieldset className="space-y-4">
        <legend className="text-[19px] font-bold text-tinta">
          La búsqueda
        </legend>

        <Campo
          etiqueta="Título"
          ayuda="Como lo diría alguien del equipo: «Desarrollador/a front-end junior»."
          error={error.titulo}
        >
          <input
            name="titulo"
            defaultValue={valor.texto("titulo", busqueda?.titulo ?? "")}
            required
            minLength={R.TITULO_MIN}
            maxLength={R.TITULO_MAX}
            aria-invalid={error.titulo ? true : undefined}
            className={`mt-1.5 ${CAMPO}`}
          />
        </Campo>

        <div className="grid gap-4 sm:grid-cols-3">
          <Campo etiqueta="Tipo" error={error.tipo}>
            <select
              name="tipo"
              defaultValue={valor.texto("tipo", busqueda?.tipo ?? "empleo")}
              required
              aria-invalid={error.tipo ? true : undefined}
              className={`mt-1.5 ${CAMPO}`}
            >
              <option value="empleo">Empleo</option>
              <option value="pasantia">Pasantía</option>
            </select>
          </Campo>

          <Campo etiqueta="Modalidad" error={error.modalidad}>
            <select
              name="modalidad"
              value={modalidad}
              onChange={(evento) => setModalidad(evento.target.value)}
              required
              aria-invalid={error.modalidad ? true : undefined}
              className={`mt-1.5 ${CAMPO}`}
            >
              <option value="" disabled>
                Elegí una
              </option>
              {MODALIDADES.map((m) => (
                <option key={m} value={m}>
                  {ETIQUETA_MODALIDAD[m]}
                </option>
              ))}
            </select>
          </Campo>

          <Campo
            etiqueta="Posiciones"
            ayuda="Cuántas personas vas a tomar."
            error={error.posiciones}
          >
            <input
              name="posiciones"
              type="number"
              inputMode="numeric"
              defaultValue={valor.texto(
                "posiciones",
                String(busqueda?.posiciones ?? 1),
              )}
              required
              min={R.POSICIONES_MIN}
              max={R.POSICIONES_MAX}
              aria-invalid={error.posiciones ? true : undefined}
              className={`mt-1.5 ${CAMPO}`}
            />
          </Campo>
        </div>

        <Campo
          etiqueta={pideUbicacion ? "Ubicación" : "Ubicación (opcional)"}
          ayuda={
            pideUbicacion
              ? "Barrio o ciudad: «Ciudad Vieja, Montevideo»."
              : "En remota no hace falta. Si pedís que viva en algún lugar, ponelo acá."
          }
          error={error.ubicacion}
        >
          <input
            name="ubicacion"
            defaultValue={valor.texto("ubicacion", busqueda?.ubicacion ?? "")}
            required={pideUbicacion}
            maxLength={R.UBICACION_MAX}
            aria-invalid={error.ubicacion ? true : undefined}
            className={`mt-1.5 ${CAMPO}`}
          />
        </Campo>

        <Campo
          etiqueta="Descripción"
          ayuda={`Qué va a hacer la persona, con quién y qué va a aprender. Entre ${R.DESCRIPCION_MIN} y ${R.DESCRIPCION_MAX} caracteres.`}
          error={error.descripcion}
        >
          <textarea
            name="descripcion"
            defaultValue={valor.texto(
              "descripcion",
              busqueda?.descripcion ?? "",
            )}
            required
            rows={7}
            minLength={R.DESCRIPCION_MIN}
            maxLength={R.DESCRIPCION_MAX}
            aria-invalid={error.descripcion ? true : undefined}
            className={`mt-1.5 resize-y ${CAMPO}`}
          />
        </Campo>
      </fieldset>

      <fieldset className="space-y-6">
        <legend className="text-[19px] font-bold text-tinta">
          A quién buscás
        </legend>

        <SelectorDeOpciones
          nombre="habilidades"
          leyenda="Habilidades que pedís"
          ayuda="Con estas se ordena a quienes se postulen: ves cuántas declara cada persona."
          opciones={catalogos.habilidades}
          inicial={valor.lista("habilidades", ids(busqueda?.habilidades))}
          minimo={R.HABILIDADES_MIN}
          maximo={R.HABILIDADES_MAX}
          error={error.habilidades}
          tono="acento"
          textoMarca="pedida"
        />

        <SelectorDeOpciones
          nombre="tags"
          leyenda="Áreas de la búsqueda"
          ayuda="Se muestran en la publicación y ayudan a que la encuentre quien tiene esos intereses."
          opciones={catalogos.tags}
          inicial={valor.lista("tags", ids(busqueda?.tags))}
          maximo={R.TAGS_MAX}
          error={error.tags}
          tono="acento"
          textoMarca="elegida"
        />

        <SelectorDeOpciones
          nombre="tagsOcultos"
          leyenda="Intereses clave (solo los ves vos)"
          ayuda="No se muestran en la publicación ni a quien se postula. Te sirven para ver, entre tus postulantes, quiénes tienen los intereses que más te importan."
          opciones={catalogos.tags}
          inicial={valor.lista("tagsOcultos", ids(busqueda?.tagsOcultos))}
          maximo={R.OCULTOS_MAX}
          error={error.tagsOcultos}
          tono="acento"
          textoMarca="interés clave"
        />
      </fieldset>

      {esEjemplo && (
        <Aviso titulo="Modo demostración">
          Con datos de ejemplo no hay base donde guardar la búsqueda. El
          formulario se puede recorrer, pero el botón queda desactivado.
        </Aviso>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-filete pt-5 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={
            busqueda
              ? `/empresa/busquedas/${busqueda.id}`
              : "/empresa/busquedas"
          }
          className="text-[14px] font-medium text-acento underline-offset-4 hover:underline"
        >
          Volver sin guardar
        </Link>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <Boton type="submit" disabled={esEjemplo || enCurso}>
            {enCurso
              ? editando
                ? "Guardando…"
                : "Publicando…"
              : editando
                ? "Guardar cambios"
                : "Publicar búsqueda"}
          </Boton>
          <MensajeDeAccion estado={estado} className="max-w-sm sm:text-right" />
        </div>
      </div>
    </form>
  );
}
