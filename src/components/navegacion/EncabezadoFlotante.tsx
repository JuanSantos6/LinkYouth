"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Encabezado que arriba de todo ocupa el ancho completo y, al bajar, se
 * transforma en una cápsula de vidrio separada de los bordes.
 *
 * El cambio lo dispara un IntersectionObserver, no un evento de scroll:
 * mientras la persona desplaza no corre nada, solo una vez al cruzar el
 * umbral. Por defecto el umbral son los primeros 24 px de la página; la
 * portada pasa `umbralId` para que la cápsula aparezca cuando el panel cubre
 * la bienvenida.
 *
 * Sin JavaScript queda la barra completa, sólida. Con «reducir movimiento» el
 * cambio es instantáneo (`globals.css`). Sin `backdrop-filter`, el vidrio es
 * sólido (`.vidrio`).
 */
export function EncabezadoFlotante({
  children,
  umbralId,
}: {
  children: React.ReactNode;
  umbralId?: string;
}) {
  const centinela = useRef<HTMLDivElement>(null);
  const [flotante, setFlotante] = useState(false);

  useEffect(() => {
    const objetivo = umbralId
      ? document.getElementById(umbralId)
      : centinela.current;
    if (!objetivo || !("IntersectionObserver" in window)) return;

    const observador = new IntersectionObserver(
      ([entrada]) => {
        setFlotante(
          umbralId
            ? entrada.boundingClientRect.top < 72
            : !entrada.isIntersecting,
        );
      },
      umbralId
        ? { rootMargin: "-72px 0px 0px 0px", threshold: [0, 1] }
        : undefined,
    );
    observador.observe(objetivo);
    return () => observador.disconnect();
  }, [umbralId]);

  return (
    <>
      <div
        ref={centinela}
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 h-6 w-px"
      />
      <header
        data-flotante={flotante}
        className="cabecera-flotante fixed inset-x-0 top-0 z-50"
      >
        <div className="cabecera-barra mx-auto flex h-16 items-center gap-3 px-4 sm:gap-5 sm:px-6">
          {children}
        </div>
      </header>
      <div aria-hidden="true" className="h-16" />
    </>
  );
}
