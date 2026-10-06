"use client";

import { useCallback, useEffect, useState } from "react";

import { EnlaceDemo } from "@/components/EnlaceDemo";

import { FotoProvisional } from "./FotoProvisional";

export type Diapositiva = {
  antetitulo: string;
  titulo: string;
  texto: string;
  acciones: { href: string; etiqueta: string; primaria?: boolean }[];
  foto: {
    que: string;
    tono: "turquesa" | "violeta" | "mandarina" | "mixto";
    semilla: number;
  };
};

const INTERVALO = 6500;

/**
 * Slider de bienvenida de la portada: imagen con texto que cambia sola.
 *
 * WCAG 2.2.2 (pausar, detener, ocultar): hay botón de pausa, anterior,
 * siguiente y puntos para elegir. Se pausa solo mientras el mouse o el foco
 * del teclado están adentro, y con «reducir movimiento» arranca pausado.
 * Pausado, un lector de pantalla anuncia cada cambio; andando, no, para no
 * interrumpir.
 *
 * Sin JavaScript, las diapositivas quedan una al lado de la otra con scroll
 * horizontal: se leen todas.
 */
export function SliderBienvenida({
  diapositivas,
}: {
  diapositivas: Diapositiva[];
}) {
  const [montado, setMontado] = useState(false);
  const [actual, setActual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [enPausaTemporal, setEnPausaTemporal] = useState(false);

  useEffect(() => {
    setMontado(true);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      setPausado(true);
  }, []);

  const ir = useCallback(
    (indice: number) =>
      setActual((indice + diapositivas.length) % diapositivas.length),
    [diapositivas.length],
  );

  useEffect(() => {
    if (!montado || pausado || enPausaTemporal) return;
    const reloj = window.setInterval(
      () => setActual((i) => (i + 1) % diapositivas.length),
      INTERVALO,
    );
    return () => window.clearInterval(reloj);
  }, [montado, pausado, enPausaTemporal, diapositivas.length, actual]);

  const control =
    "flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-white/70 bg-[#15132A]/55 text-white backdrop-blur-md transition-colors duration-150 hover:bg-[#15132A]/80";

  return (
    <div
      className="absolute inset-0"
      aria-roledescription="carrusel"
      aria-label="Bienvenida a LinkYouth"
      onMouseEnter={() => setEnPausaTemporal(true)}
      onMouseLeave={() => setEnPausaTemporal(false)}
      onFocus={() => setEnPausaTemporal(true)}
      onBlur={(evento) => {
        if (!evento.currentTarget.contains(evento.relatedTarget as Node))
          setEnPausaTemporal(false);
      }}
    >
      <div
        aria-live={pausado ? "polite" : "off"}
        className={
          montado
            ? "absolute inset-0"
            : "sin-barra absolute inset-0 flex snap-x snap-mandatory overflow-x-auto"
        }
      >
        {diapositivas.map((diapositiva, indice) => {
          const activa = !montado || indice === actual;
          const Titulo = indice === 0 ? "h1" : "h2";

          return (
            <article
              key={diapositiva.titulo}
              aria-roledescription="diapositiva"
              aria-label={`${indice + 1} de ${diapositivas.length}`}
              aria-hidden={montado ? !activa : undefined}
              inert={montado && !activa ? true : undefined}
              data-activa={activa}
              className={
                montado
                  ? "diapositiva absolute inset-0"
                  : "relative h-full w-full shrink-0 snap-start"
              }
            >
              <div className="diapositiva-imagen absolute inset-0">
                <FotoProvisional {...diapositiva.foto} rotuloArriba={false} />
              </div>

              <div className="diapositiva-texto absolute bottom-32 left-4 right-4 grid max-w-[620px] gap-3 rounded-[24px] bg-[#15132A]/80 p-6 text-white backdrop-blur-md sm:left-[max(24px,calc((100%-1180px)/2))] sm:p-8">
                <p className="text-[14px] font-semibold text-[#CFF7F4]">
                  {diapositiva.antetitulo}
                </p>
                <Titulo className="text-[32px] leading-[1.05] font-extrabold text-white sm:text-[48px]">
                  {diapositiva.titulo}
                </Titulo>
                <p className="text-[16px] text-[#E6E3F2] sm:text-[17px]">
                  {diapositiva.texto}
                </p>
                <div className="mt-1 flex flex-wrap gap-2.5">
                  {diapositiva.acciones.map((accion) =>
                    accion.primaria ? (
                      <EnlaceDemo
                        key={accion.href}
                        href={accion.href}
                        className="rounded-control bg-mandarina px-4 py-2.5 text-[15px] font-semibold text-[#1E1A38] transition-[filter] duration-150 hover:brightness-[0.94]"
                      >
                        {accion.etiqueta}
                      </EnlaceDemo>
                    ) : (
                      <EnlaceDemo
                        key={accion.href}
                        href={accion.href}
                        className="rounded-control border-[1.5px] border-white/60 bg-white/10 px-4 py-2.5 text-[15px] font-semibold text-white transition-colors duration-150 hover:bg-white/20"
                      >
                        {accion.etiqueta}
                      </EnlaceDemo>
                    ),
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {montado && (
        <div className="absolute right-4 bottom-16 z-[2] flex items-center gap-2 sm:right-[max(24px,calc((100%-1180px)/2))]">
          <button
            type="button"
            className={control}
            onClick={() => setPausado((valor) => !valor)}
            aria-label={
              pausado
                ? "Reanudar el cambio automático"
                : "Pausar el cambio automático"
            }
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-[18px] w-[18px]"
            >
              {pausado ? (
                <path d="M8 5l11 7-11 7z" fill="currentColor" />
              ) : (
                <path
                  d="M8 5v14M16 5v14"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
          <button
            type="button"
            className={control}
            onClick={() => ir(actual - 1)}
            aria-label="Diapositiva anterior"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-[18px] w-[18px]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <div
            role="group"
            aria-label="Elegir diapositiva"
            className="flex gap-1 rounded-full bg-[#15132A]/55 px-2 py-1.5 backdrop-blur-md"
          >
            {diapositivas.map((_, indice) => (
              <button
                key={indice}
                type="button"
                onClick={() => ir(indice)}
                aria-label={`Ir a la diapositiva ${indice + 1} de ${diapositivas.length}`}
                aria-current={indice === actual}
                className="flex h-7 w-7 items-center justify-center"
              >
                <span
                  className={`block h-2.5 rounded-full border-[1.5px] border-white transition-[width,background-color] duration-200 ${
                    indice === actual ? "w-5 bg-white" : "w-2.5"
                  }`}
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            className={control}
            onClick={() => ir(actual + 1)}
            aria-label="Diapositiva siguiente"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-[18px] w-[18px]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
