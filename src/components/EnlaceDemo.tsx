"use client";

import { useState, type MouseEvent, type ReactNode } from "react";

/**
 * Enlace de demostración.
 *
 * En esta versión de presentación solo existe la portada: no hay páginas de
 * registro, login ni empleos. Este componente se ve y responde igual que un
 * enlace de verdad (hover, foco, animación al clic), pero no navega.
 *
 * - Si `href` es un ancla de la misma página (`#preguntas`), funciona normal
 *   y hace scroll suave hasta la sección.
 * - Si es cualquier otra ruta, se cancela la navegación y el botón hace un
 *   pequeño «latido» (`.enlace-demo` en `globals.css`).
 */
export function EnlaceDemo({
  href,
  className = "",
  children,
  ...resto
}: {
  href: string;
  className?: string;
  children: ReactNode;
  role?: string;
  "aria-label"?: string;
}) {
  const [latido, setLatido] = useState(0);
  const esAncla = href.startsWith("#");

  function alHacerClic(evento: MouseEvent<HTMLAnchorElement>) {
    if (esAncla) return;
    evento.preventDefault();
    // Cambiar la clave reinicia la animación aunque se haga clic seguido.
    setLatido((n) => n + 1);
  }

  return (
    <a
      href={esAncla ? href : "#"}
      onClick={alHacerClic}
      data-latido={latido === 0 ? undefined : latido % 2 ? "a" : "b"}
      title={esAncla ? undefined : "Versión de presentación: solo la portada"}
      className={`enlace-demo ${className}`}
      {...resto}
    >
      {children}
    </a>
  );
}
