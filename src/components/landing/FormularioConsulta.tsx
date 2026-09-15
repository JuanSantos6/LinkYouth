"use client";

import { useActionState } from "react";

import { Boton } from "@/components/ui/Boton";
import { CAMPO, Campo } from "@/components/ui/Campo";
import { MensajeDeAccion } from "@/components/ui/MensajeDeAccion";
import { Aviso } from "@/components/ui/AvisoOrigen";
import { enviarConsulta } from "@/lib/acciones/consultas";
import { ACCION_INICIAL } from "@/lib/acciones/tipos";

/**
 * Formulario de consultas.
 *
 * El aviso de arriba está **antes** del formulario, no después de enviarlo:
 * decirle a alguien que su mensaje no llegó a ninguna parte recién cuando ya
 * lo escribió es hacerle perder el tiempo dos veces. Cuando exista la tabla o
 * la casilla, se saca el aviso y la acción devuelve un «ok».
 */
export function FormularioConsulta() {
  const [estado, enviar, enCurso] = useActionState(
    enviarConsulta,
    ACCION_INICIAL,
  );

  return (
    <div className="space-y-4">
      <Aviso titulo="Este formulario todavía no entrega">
        No hay casilla ni base configurada para recibir consultas, así que el
        mensaje no va a llegar a nadie. Mientras tanto, la vía que sí funciona
        es el repositorio del proyecto, que está abierto al pie de la página.
      </Aviso>

      <form action={enviar} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Tu nombre">
            <input
              name="nombre"
              autoComplete="name"
              required
              minLength={2}
              className={`mt-1.5 ${CAMPO}`}
            />
          </Campo>

          <Campo etiqueta="Correo electrónico">
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              className={`mt-1.5 ${CAMPO}`}
            />
          </Campo>
        </div>

        <Campo etiqueta="Tu consulta" ayuda="Hasta 1000 caracteres.">
          <textarea
            name="mensaje"
            rows={5}
            required
            minLength={10}
            maxLength={1000}
            className={`mt-1.5 resize-y ${CAMPO}`}
          />
        </Campo>

        <div className="flex flex-wrap items-center justify-end gap-4">
          <MensajeDeAccion estado={estado} />
          <Boton type="submit" disabled={enCurso}>
            {enCurso ? "Enviando…" : "Enviar consulta"}
          </Boton>
        </div>
      </form>
    </div>
  );
}
