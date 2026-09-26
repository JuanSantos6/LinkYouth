"use client";

import { usePathname } from "next/navigation";

import {
  IconoEmpleos,
  IconoEventos,
  IconoInicio,
  IconoPostulaciones,
} from "@/components/layout/Iconos";

import { EnlaceTransicion } from "./Transiciones";

const PESTANAS = [
  { href: "/inicio", etiqueta: "Inicio", Icono: IconoInicio },
  { href: "/empleos", etiqueta: "Empleos", Icono: IconoEmpleos },
  { href: "/eventos", etiqueta: "Eventos", Icono: IconoEventos },
  {
    href: "/postulaciones",
    etiqueta: "Postulaciones",
    Icono: IconoPostulaciones,
  },
] as const;

/**
 * Pestañas de abajo en el teléfono, para la cuenta del postulante: las cuatro
 * secciones al alcance del pulgar. Es la misma cápsula de vidrio que el
 * encabezado flotante. La marca de la activa se desliza de una pestaña a la
 * otra (solo `transform`), y la activa lleva además peso y `aria-current`.
 */
export function BarraPestanas() {
  const ruta = usePathname();
  const activa = PESTANAS.findIndex(
    ({ href }) => ruta === href || ruta.startsWith(`${href}/`),
  );

  return (
    <nav
      aria-label="Secciones de tu cuenta"
      style={{ viewTransitionName: "pestanas" }}
      className="vidrio fixed inset-x-3 bottom-[calc(12px+env(safe-area-inset-bottom,0px))] z-40 rounded-full px-1.5 py-1.5 md:hidden"
    >
      <ul className="relative grid grid-cols-4">
        {activa >= 0 && (
          <li
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-1/4 transition-transform duration-200 ease-out"
            style={{ transform: `translateX(${activa * 100}%)` }}
          >
            <span className="mx-auto mt-0.5 block h-[3px] w-6 rounded-full bg-violeta" />
          </li>
        )}
        {PESTANAS.map(({ href, etiqueta, Icono }, indice) => {
          const esActiva = indice === activa;
          return (
            <li key={href}>
              <EnlaceTransicion
                href={href}
                aria-current={esActiva ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 rounded-full px-1 pt-2 pb-1 text-[11px] ${
                  esActiva ? "font-bold text-tinta" : "font-medium text-apagado"
                }`}
              >
                <Icono className="h-5 w-5" />
                {etiqueta}
              </EnlaceTransicion>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
