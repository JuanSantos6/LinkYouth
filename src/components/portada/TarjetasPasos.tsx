"use client";

import { useEffect, useId, useRef, useState } from "react";

import { FotoProvisional } from "./FotoProvisional";

export type Paso = {
  titulo: string;
  texto: string;
  foto: {
    que: string;
    tono: "turquesa" | "violeta" | "mandarina" | "mixto";
    semilla: number;
  };
};

/**
 * Una tarjeta de «Así funciona». Las tres miden exactamente lo mismo: el
 * título ocupa siempre dos líneas y el texto tres. Si el texto es más largo,
 * se corta con puntos suspensivos y aparece «Ver más», que expande solo esta
 * tarjeta con una transición suave; «Ver menos» la vuelve a cerrar.
 *
 * El botón lleva `aria-expanded` y apunta al texto con `aria-controls`. Sin
 * JavaScript, el texto se lee completo.
 */
function TarjetaPaso({ paso, numero }: { paso: Paso; numero: number }) {
  const texto = useRef<HTMLParagraphElement>(null);
  const [recortable, setRecortable] = useState(false);
  const [abierta, setAbierta] = useState(false);
  const [montada, setMontada] = useState(false);
  const id = useId();

  useEffect(() => setMontada(true), []);

  // Se mide después de que el recorte de tres líneas ya está aplicado.
  useEffect(() => {
    if (!montada) return;
    const medir = () => {
      const elemento = texto.current;
      if (!elemento || abierta) return;
      setRecortable(elemento.scrollHeight > elemento.clientHeight + 1);
    };
    medir();
    document.fonts?.ready.then(medir).catch(() => {});
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, [montada, abierta]);

  const alternar = () => {
    const elemento = texto.current;
    if (!elemento) return;
    const reducido = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const tresLineas = parseFloat(getComputedStyle(elemento).lineHeight) * 3;

    if (!abierta) {
      elemento.style.maxHeight = `${tresLineas}px`;
      setAbierta(true);
      requestAnimationFrame(() => {
        elemento.style.maxHeight = `${elemento.scrollHeight}px`;
        window.setTimeout(
          () => (elemento.style.maxHeight = "none"),
          reducido ? 0 : 220,
        );
      });
    } else {
      elemento.style.maxHeight = `${elemento.scrollHeight}px`;
      requestAnimationFrame(() => {
        elemento.style.maxHeight = `${tresLineas}px`;
        window.setTimeout(
          () => {
            setAbierta(false);
            elemento.style.maxHeight = "";
          },
          reducido ? 0 : 160,
        );
      });
    }
  };

  return (
    <article
      data-parallax-tarjeta
      className="flex flex-col overflow-hidden rounded-[24px] border border-borde bg-superficie will-change-transform"
    >
      <div className="aspect-[4/3]">
        <FotoProvisional {...paso.foto} />
      </div>
      <div className="flex flex-col gap-2 p-6">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-tinta font-titulo text-[15px] font-extrabold text-tinta"
        >
          {numero}
        </span>
        <h3 className="line-clamp-2 min-h-[2lh] text-[22px] leading-tight text-tinta">
          <span className="sr-only">Paso {numero}: </span>
          {paso.titulo}
        </h3>
        <p
          ref={texto}
          id={id}
          className={`text-[16px] leading-relaxed text-apagado transition-[max-height] duration-200 ease-out motion-reduce:transition-none ${
            montada && !abierta
              ? "line-clamp-3 min-h-[3lh]"
              : "min-h-[3lh] overflow-hidden"
          }`}
        >
          {paso.texto}
        </p>
        {/* El renglón del botón existe en las tres tarjetas, para que midan lo mismo. */}
        <div className="min-h-7">
          {montada && (recortable || abierta) && (
            <button
              type="button"
              aria-expanded={abierta}
              aria-controls={id}
              onClick={alternar}
              className="self-start rounded-sm text-[15px] font-semibold text-acento underline decoration-2 underline-offset-4 hover:decoration-[3px]"
            >
              {abierta ? "Ver menos" : "Ver más"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function TarjetasPasos({ pasos }: { pasos: Paso[] }) {
  return (
    <div className="grid items-start gap-5 md:grid-cols-3">
      {pasos.map((paso, indice) => (
        <TarjetaPaso key={paso.titulo} paso={paso} numero={indice + 1} />
      ))}
    </div>
  );
}
