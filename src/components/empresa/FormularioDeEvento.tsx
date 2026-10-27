"use client";

import Link from "next/link";
import { useActionState } from "react";

import { SelectorDeUbicacion } from "@/components/mapa/SelectorDeUbicacion";
import { Aviso } from "@/components/ui/AvisoOrigen";
import { Boton } from "@/components/ui/Boton";
import { CAMPO, Campo } from "@/components/ui/Campo";
import { EnfocarPrimerError } from "@/components/ui/EnfocarPrimerError";
import { MensajeDeAccion } from "@/components/ui/MensajeDeAccion";
import { SelectorDeOpciones } from "@/components/ui/SelectorDeOpciones";
import { valoresDeFormulario } from "@/components/ui/valoresDeFormulario";
import { guardarEvento } from "@/lib/acciones/eventosDeEmpresa";
import { FORMULARIO_INICIAL } from "@/lib/acciones/tipos";
import type { EventoDeEmpresa, OpcionCatalogo } from "@/lib/data/tipos";
import { ReglasDeEvento } from "@/lib/dominio/ReglasDeEvento";
import { ReglasDeRegistro } from "@/lib/dominio/ReglasDeRegistro";

const comoTexto = (n: number | null | undefined) =>
  n === null || n === undefined ? "" : String(n);

/**
 * Crear un evento o editarlo (RF4.1, RF4.2): título, descripción, día y hora
 * de Montevideo, dirección, ubicación en el mapa, imagen y áreas.
 *
 * Las coordenadas son opcionales y se eligen con `SelectorDeUbicacion`
 * buscando la dirección o marcando el punto en el mapa. Con ellas se muestra
 * el mapa embebido en el detalle y el evento aparece en el mapa general de
 * `/eventos`; con coordenadas o con dirección, «Cómo llegar» abre la
 * aplicación de mapas.
 */
export function FormularioDeEvento({
  evento,
  tags,
  minimo,
  esEjemplo = false,
}: {
  evento?: EventoDeEmpresa;
  tags: OpcionCatalogo[];
  /** Ahora, en hora de Montevideo, como valor de `datetime-local`. */
  minimo: string;
  esEjemplo?: boolean;
}) {
  const [estado, enviar, enCurso] = useActionState(
    guardarEvento,
    FORMULARIO_INICIAL,
  );
  const valor = valoresDeFormulario(estado);
  const error = estado.campos ?? {};
  const R = ReglasDeEvento;
  const editando = Boolean(evento);

  return (
    <form action={enviar} className="space-y-8">
      <EnfocarPrimerError estado={estado} />
      {evento && <input type="hidden" name="id" value={evento.id} />}

      <fieldset className="space-y-4">
        <legend className="text-[19px] font-bold text-tinta">El evento</legend>

        <Campo
          etiqueta="Título"
          ayuda="«Charla: cómo es un día en un equipo de datos»."
          error={error.titulo}
        >
          <input
            name="titulo"
            defaultValue={valor.texto("titulo", evento?.titulo ?? "")}
            required
            minLength={R.TITULO_MIN}
            maxLength={R.TITULO_MAX}
            aria-invalid={error.titulo ? true : undefined}
            className={`mt-1.5 ${CAMPO}`}
          />
        </Campo>

        <Campo
          etiqueta="Día y hora"
          ayuda="Hora de Uruguay."
          error={error.fechaHora}
        >
          <input
            name="fechaHora"
            type="datetime-local"
            defaultValue={valor.texto(
              "fechaHora",
              evento ? R.aHoraLocal(evento.fecha_hora) : "",
            )}
            min={minimo}
            required
            aria-invalid={error.fechaHora ? true : undefined}
            className={`mt-1.5 ${CAMPO}`}
          />
        </Campo>

        <Campo
          etiqueta="Descripción"
          ayuda={`De qué se trata, para quién es y qué hay que llevar. Entre ${R.DESCRIPCION_MIN} y ${R.DESCRIPCION_MAX} caracteres.`}
          error={error.descripcion}
        >
          <textarea
            name="descripcion"
            defaultValue={valor.texto("descripcion", evento?.descripcion ?? "")}
            required
            rows={5}
            minLength={R.DESCRIPCION_MIN}
            maxLength={R.DESCRIPCION_MAX}
            aria-invalid={error.descripcion ? true : undefined}
            className={`mt-1.5 resize-y ${CAMPO}`}
          />
        </Campo>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-[19px] font-bold text-tinta">Dónde</legend>

        <Campo
          etiqueta="Dirección (opcional)"
          ayuda="Calle, número y ciudad. Si es en línea, dejala vacía y poné el enlace en la descripción."
          error={error.direccion}
        >
          <input
            name="direccion"
            defaultValue={valor.texto("direccion", evento?.direccion ?? "")}
            maxLength={R.DIRECCION_MAX}
            autoComplete="street-address"
            aria-invalid={error.direccion ? true : undefined}
            className={`mt-1.5 ${CAMPO}`}
          />
        </Campo>

        <SelectorDeUbicacion
          latitudInicial={valor.texto("latitud", comoTexto(evento?.latitud))}
          longitudInicial={valor.texto("longitud", comoTexto(evento?.longitud))}
          errorLatitud={error.latitud}
          errorLongitud={error.longitud}
        />
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="text-[19px] font-bold text-tinta">
          Imagen y áreas
        </legend>

        <Campo
          etiqueta={
            evento?.imagen_url
              ? "Cambiar la imagen (opcional)"
              : "Imagen (opcional)"
          }
          ayuda="JPG, PNG o WebP de hasta 5 MB. Se ve en la tarjeta del evento."
          error={error.imagen}
        >
          <input
            name="imagen"
            type="file"
            accept={ReglasDeRegistro.FORMATOS_IMAGEN.join(",")}
            aria-invalid={error.imagen ? true : undefined}
            className={`mt-1.5 ${CAMPO} file:mr-3 file:rounded-control file:border-0 file:bg-realce file:px-3 file:py-1 file:text-[14px] file:text-tinta`}
          />
        </Campo>

        <SelectorDeOpciones
          nombre="tags"
          leyenda="Áreas del evento"
          ayuda="Con estas lo encuentran los jóvenes que tienen esos intereses."
          opciones={tags}
          inicial={valor.lista(
            "tags",
            (evento?.tags ?? []).map((t) => t.id),
          )}
          maximo={R.TAGS_MAX}
          error={error.tags}
          tono="acento"
        />
      </fieldset>

      {esEjemplo && (
        <Aviso titulo="Modo demostración">
          Con datos de ejemplo no hay base donde guardar el evento. El
          formulario se puede recorrer, pero el botón queda desactivado.
        </Aviso>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-filete pt-5 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={evento ? `/empresa/eventos/${evento.id}` : "/empresa/eventos"}
          className="text-[14px] font-medium text-acento underline-offset-4 hover:underline"
        >
          Volver sin guardar
        </Link>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <Boton type="submit" disabled={esEjemplo || enCurso}>
            {enCurso
              ? "Guardando…"
              : editando
                ? "Guardar cambios"
                : "Crear evento"}
          </Boton>
          <MensajeDeAccion estado={estado} className="max-w-sm sm:text-right" />
        </div>
      </div>
    </form>
  );
}
