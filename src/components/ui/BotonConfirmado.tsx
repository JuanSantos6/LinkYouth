"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { Boton } from "@/components/ui/Boton";
import { MensajeDeAccion } from "@/components/ui/MensajeDeAccion";
import { ACCION_INICIAL, type EstadoAccion } from "@/lib/acciones/tipos";

/**
 * Un botón para lo que no tiene vuelta atrás: cerrar o eliminar una búsqueda,
 * cancelar un evento, descartar o seleccionar a alguien.
 *
 * El primer toque no hace nada todavía: abre una confirmación que dice qué va
 * a pasar, con el botón que lo hace y otro para volver. Un `confirm()` del
 * navegador haría lo mismo con un cuadro que no se puede estilizar, que en el
 * teléfono tapa la pantalla y que no dice nada que esta pantalla no sepa
 * decir mejor.
 *
 * Al abrir, el foco va al botón de confirmar; al volver o con Esc, regresa al
 * botón original. Quien navega con teclado no se pierde.
 */
export function BotonConfirmado({
  accion,
  campos,
  textos,
  variante = "secundario",
  deshabilitado = false,
}: {
  accion: (previo: EstadoAccion, datos: FormData) => Promise<EstadoAccion>;
  /** Los campos ocultos que lee la acción. */
  campos: Record<string, string>;
  textos: {
    /** El botón de entrada: «Cerrar búsqueda». */
    inicial: string;
    /** Qué va a pasar, en una o dos frases. */
    pregunta: string;
    /** El botón que lo hace: «Sí, cerrarla». */
    confirmar: string;
    enCurso: string;
  };
  variante?: "primario" | "secundario" | "fantasma";
  deshabilitado?: boolean;
}) {
  const [estado, enviar, enCurso] = useActionState(accion, ACCION_INICIAL);
  const [abierto, setAbierto] = useState(false);
  const entrada = useRef<HTMLButtonElement>(null);
  const confirmar = useRef<HTMLButtonElement>(null);
  const yaAbrio = useRef(false);

  useEffect(() => {
    if (abierto) {
      yaAbrio.current = true;
      confirmar.current?.focus();
    } else if (yaAbrio.current) {
      entrada.current?.focus();
    }
  }, [abierto]);

  if (!abierto) {
    return (
      <div className="flex flex-col items-start gap-1.5">
        <Boton
          ref={entrada}
          type="button"
          variante={variante}
          disabled={deshabilitado || estado.estado === "ok"}
          aria-expanded={false}
          onClick={() => setAbierto(true)}
        >
          {textos.inicial}
        </Boton>
        <MensajeDeAccion estado={estado} className="max-w-sm" />
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label={textos.inicial}
      onKeyDown={(evento) => {
        if (evento.key === "Escape" && !enCurso) setAbierto(false);
      }}
      className="w-full max-w-md animate-[ly-aparecer_200ms_cubic-bezier(0.2,0.7,0.2,1)] rounded-ficha border border-borde-control/70 bg-realce p-4"
    >
      <p className="text-[14px] leading-relaxed text-tinta">
        {textos.pregunta}
      </p>
      <form
        action={async (datos) => {
          await enviar(datos);
          setAbierto(false);
        }}
        className="mt-3 flex flex-wrap gap-2"
      >
        {Object.entries(campos).map(([nombre, valor]) => (
          <input key={nombre} type="hidden" name={nombre} value={valor} />
        ))}
        <Boton
          ref={confirmar}
          type="submit"
          variante="secundario"
          disabled={enCurso}
        >
          {enCurso ? textos.enCurso : textos.confirmar}
        </Boton>
        <Boton
          type="button"
          variante="fantasma"
          disabled={enCurso}
          onClick={() => setAbierto(false)}
        >
          No, volver
        </Boton>
      </form>
    </div>
  );
}
