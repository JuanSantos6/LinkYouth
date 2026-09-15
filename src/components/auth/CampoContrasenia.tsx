"use client";

import { useState } from "react";

import { CAMPO, Campo } from "@/components/ui/Campo";
import {
  FuerzaDeContrasenia,
  LARGO_MAXIMO,
  LARGO_MINIMO,
  type Nivel,
} from "@/lib/dominio/FuerzaDeContrasenia";

/** Un color por nivel. Los tokens viven encerrados en este medidor. */
const COLOR: Record<Nivel, string> = {
  debil: "bg-fuerza-baja",
  media: "bg-fuerza-media",
  fuerte: "bg-fuerza-alta",
};

const COLOR_TEXTO: Record<Nivel, string> = {
  debil: "text-fuerza-baja",
  media: "text-fuerza-media",
  fuerte: "text-fuerza-alta",
};

/**
 * Contraseña y su confirmación, con el medidor en vivo (RF1.1, RNF5).
 *
 * El medidor no valida: la acción de servidor vuelve a hacer la misma cuenta
 * con la misma clase y es la que rechaza. Acá está para que nadie se entere de
 * que su contraseña no sirve recién después de mandar el formulario.
 *
 * Es `"use client"` porque la barra tiene que moverse mientras se escribe, que
 * es exactamente lo que un enlace con `searchParams` no puede hacer.
 *
 * La barra nunca comunica sola: al lado va la palabra —«Débil», «Media»,
 * «Fuerte»— y debajo los requisitos que faltan. Quien no distingue el rojo del
 * verde lee lo mismo que el resto.
 */
export function CampoContrasenia() {
  const [valor, setValor] = useState("");
  const [confirmacion, setConfirmacion] = useState("");

  const fuerza = new FuerzaDeContrasenia(valor);
  const nivel = fuerza.nivel;

  // El aviso aparece recién cuando hay algo escrito en la confirmación: de lo
  // contrario grita «no coinciden» apenas se empieza a tipear el primer campo.
  const noCoinciden = confirmacion.length > 0 && confirmacion !== valor;

  return (
    <div className="space-y-4">
      <Campo etiqueta="Contraseña">
        <input
          type="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={LARGO_MINIMO}
          maxLength={LARGO_MAXIMO}
          value={valor}
          onChange={(evento) => setValor(evento.target.value)}
          aria-describedby="requisitos-contrasenia"
          className={`mt-1.5 ${CAMPO}`}
        />
      </Campo>

      {valor.length > 0 && (
        <div>
          <div className="flex items-center gap-3">
            <div
              className="flex h-1 flex-1 gap-1"
              role="img"
              aria-label={`Seguridad de la contraseña: ${fuerza.etiqueta.toLowerCase()}`}
            >
              {[0, 1, 2].map((segmento) => (
                <span
                  key={segmento}
                  className={`h-full flex-1 rounded-control transition-colors duration-150 ${
                    segmento < fuerza.segmentos ? COLOR[nivel] : "bg-filete"
                  }`}
                />
              ))}
            </div>

            <span
              aria-hidden
              className={`text-[13px] font-medium ${COLOR_TEXTO[nivel]}`}
            >
              {fuerza.etiqueta}
            </span>
          </div>

          <ul id="requisitos-contrasenia" className="mt-2 space-y-0.5">
            {fuerza.requisitos.map((requisito) => (
              <li
                key={requisito.texto}
                className={`text-[13px] ${
                  requisito.cumple ? "text-apagado" : "text-tinta"
                }`}
              >
                <span aria-hidden className="mr-1.5">
                  {requisito.cumple ? "✓" : "○"}
                </span>
                {requisito.texto}
                <span className="sr-only">
                  {requisito.cumple ? " (cumplido)" : " (falta)"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Campo etiqueta="Repetir la contraseña">
        <input
          type="password"
          name="password_confirmacion"
          autoComplete="new-password"
          required
          maxLength={LARGO_MAXIMO}
          value={confirmacion}
          onChange={(evento) => setConfirmacion(evento.target.value)}
          aria-invalid={noCoinciden || undefined}
          className={`mt-1.5 ${CAMPO} ${noCoinciden ? "border-fuerza-baja" : ""}`}
        />
      </Campo>

      <p aria-live="polite" className="text-[13px] text-tinta">
        {noCoinciden ? "Las dos contraseñas no coinciden." : ""}
      </p>
    </div>
  );
}
