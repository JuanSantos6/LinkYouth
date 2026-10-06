"use client";

import { useEffect, useRef } from "react";

/** Recorrido de scroll en el que el encabezado pasa de barra a cápsula. */
const RECORRIDO = 120;

/** Acelera al principio y se asienta al final (ease-out cúbica). */
const curva = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Encabezado que arriba de todo está integrado a la página y, con el primer
 * píxel de scroll, se va transformando de a poco en una cápsula de vidrio:
 * se separa de los bordes, redondea las esquinas, gana transparencia,
 * desenfoque y sombra. En los primeros 120 px llega a su forma final; al
 * volver arriba hace el camino inverso.
 *
 * El progreso (0 a 1) se calcula **siempre desde la posición real del
 * scroll** y se escribe en la variable CSS `--p` (`globals.css` hace el
 * resto). Se recalcula al hacer scroll (un solo `requestAnimationFrame` por
 * cuadro), al montar, al volver con el botón atrás
 * (también desde la caché del navegador) y al cambiar el tamaño de la
 * ventana: no hay estado guardado que pueda quedar trabado.
 *
 * Con «reducir movimiento» no hay intermedios: 0 arriba de todo, 1 apenas
 * se baja. Sin JavaScript queda la barra integrada.
 */
export function EncabezadoFlotante({
  children,
}: {
  children: React.ReactNode;
}) {
  const encabezado = useRef<HTMLElement>(null);

  useEffect(() => {
    const elemento = encabezado.current;
    if (!elemento) return;

    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)");
    let pedido = 0;
    let ultimo = -1;

    const actualizar = () => {
      pedido = 0;
      const y = Math.max(0, window.scrollY);
      const progreso = reducido.matches
        ? y > 0
          ? 1
          : 0
        : curva(Math.min(1, y / RECORRIDO));
      const redondeado = Math.round(progreso * 1000) / 1000;
      if (redondeado === ultimo) return;
      ultimo = redondeado;
      elemento.style.setProperty("--p", String(redondeado));
      elemento.dataset.flotante = String(redondeado > 0);
    };

    const programar = () => {
      if (!pedido) pedido = requestAnimationFrame(actualizar);
    };

    actualizar();
    window.addEventListener("scroll", programar, { passive: true });
    window.addEventListener("resize", programar);
    window.addEventListener("popstate", programar);
    window.addEventListener("pageshow", programar);
    reducido.addEventListener("change", programar);

    return () => {
      cancelAnimationFrame(pedido);
      window.removeEventListener("scroll", programar);
      window.removeEventListener("resize", programar);
      window.removeEventListener("popstate", programar);
      window.removeEventListener("pageshow", programar);
      reducido.removeEventListener("change", programar);
    };
  }, []);

  return (
    <>
      <header
        ref={encabezado}
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
