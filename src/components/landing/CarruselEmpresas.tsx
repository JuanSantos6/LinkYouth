"use client";

import { useEffect, useRef, useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import type { EmpresaResumen } from "@/lib/data/tipos";

/**
 * Las organizaciones que ya publican en LinkYouth.
 *
 * No se mueve solo. Un carrusel que avanza por su cuenta obliga a leer al
 * ritmo de otro y es de lo primero que molesta a quien usa lector de pantalla
 * o tiene activado el movimiento reducido; acá el desplazamiento es siempre
 * una acción de quien mira, con las flechas, el dedo o la rueda.
 *
 * Las flechas aparecen **solo cuando hay adónde ir**, y cada una se apaga al
 * llegar a su extremo. Con cuatro organizaciones en una pantalla de escritorio
 * la fila entra entera: `scrollBy` no tiene margen para desplazar y el
 * navegador, correctamente, no hace nada. Un botón que responde al clic sin
 * que pase nada se lee como un botón roto, y acá lo que faltaba era decir que
 * no había nada que mostrar.
 *
 * Es `"use client"` por las flechas y por la medición. Sin JavaScript la fila
 * sigue funcionando: se desplaza igual con el dedo y con la rueda, y el
 * anclaje la deja alineada.
 */
export function CarruselEmpresas({ empresas }: { empresas: EmpresaResumen[] }) {
  const pista = useRef<HTMLUListElement>(null);

  // Arranca en los dos extremos a la vez, que es como se ve una fila que entra
  // entera: así el servidor no dibuja unas flechas que la primera medición del
  // navegador va a esconder.
  const [borde, setBorde] = useState({ inicio: true, fin: true });

  useEffect(() => {
    const contenedor = pista.current;
    if (!contenedor) return;

    function medir() {
      if (!contenedor) return;
      const margen = contenedor.scrollWidth - contenedor.clientWidth;

      // Un píxel de tolerancia: con zoom del navegador o anchos fraccionarios,
      // `scrollLeft` no llega nunca al máximo exacto y la flecha derecha
      // quedaría encendida para siempre sin poder avanzar.
      setBorde({
        inicio: contenedor.scrollLeft <= 1,
        fin: contenedor.scrollLeft >= margen - 1,
      });
    }

    medir();
    contenedor.addEventListener("scroll", medir, { passive: true });

    // El margen depende del ancho, así que hay que volver a medir cuando la
    // ventana cambia de tamaño y cuando entran o salen tarjetas.
    const observador = new ResizeObserver(medir);
    observador.observe(contenedor);

    return () => {
      contenedor.removeEventListener("scroll", medir);
      observador.disconnect();
    };
  }, [empresas.length]);

  // Estar en los dos extremos al mismo tiempo solo puede significar que no hay
  // desborde: la fila entra entera y no hay nada que desplazar.
  const hayDesborde = !(borde.inicio && borde.fin);

  function desplazar(direccion: 1 | -1) {
    const contenedor = pista.current;
    if (!contenedor) return;

    contenedor.scrollBy({
      // Un ancho de pantalla menos un poco, para que la tarjeta del borde
      // quede a la vista y se entienda que la fila siguió, no que saltó.
      left: direccion * Math.min(contenedor.clientWidth * 0.8, 480),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }

  return (
    <div className="relative">
      <ul
        ref={pista}
        tabIndex={0}
        aria-label="Organizaciones que publican en LinkYouth"
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-1 scroll-smooth pb-2 sin-barra motion-reduce:scroll-auto"
      >
        {empresas.map((empresa) => (
          <li
            key={empresa.id}
            className="w-56 shrink-0 snap-start rounded-ficha border border-borde bg-superficie p-4"
          >
            <Avatar
              nombre={empresa.razon_social}
              url={empresa.logo_url}
              forma="cuadrado"
            />
            <p className="mt-3 text-[15px] font-medium text-tinta">
              {empresa.razon_social}
            </p>
            <p className="mt-0.5 text-[13px] text-apagado">{empresa.rubro}</p>
          </li>
        ))}
      </ul>

      {hayDesborde && (
        <div className="mt-3 flex justify-end gap-2">
          <Flecha
            hacia={-1}
            apagada={borde.inicio}
            onClick={() => desplazar(-1)}
          />
          <Flecha hacia={1} apagada={borde.fin} onClick={() => desplazar(1)} />
        </div>
      )}
    </div>
  );
}

/**
 * Una de las dos flechas.
 *
 * Apagada no se esconde: sigue ocupando su lugar para que la fila de controles
 * no se mueva bajo el dedo justo cuando se la está usando.
 */
function Flecha({
  hacia,
  apagada,
  onClick,
}: {
  hacia: 1 | -1;
  apagada: boolean;
  onClick: () => void;
}) {
  const anterior = hacia === -1;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={apagada}
      className="flex h-9 w-9 items-center justify-center rounded-control border border-borde-control text-tinta transition-[color,border-color,opacity] duration-150 hover:border-tinta disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-borde-control"
    >
      <span aria-hidden="true">{anterior ? "←" : "→"}</span>
      <span className="sr-only">
        {anterior ? "Ver las anteriores" : "Ver las siguientes"}
      </span>
    </button>
  );
}
