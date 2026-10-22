"use client";

import { usePathname } from "next/navigation";

import {
  IconoEmpleos,
  IconoEventos,
  IconoInicio,
  IconoInterviewLab,
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
  // «Interview Lab» no entra en una quinta parte de 390 px: se parte en dos
  // líneas. Se ve «Lab» y el nombre accesible es el completo, que contiene
  // la palabra visible (WCAG 2.5.3).
  {
    href: "/interview-lab",
    etiqueta: "Lab",
    nombre: "Interview Lab",
    Icono: IconoInterviewLab,
  },
] as const;

/**
 * Pestañas de abajo en el teléfono, para la cuenta del postulante: las cinco
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
      <ul className="relative grid grid-cols-5">
        {activa >= 0 && (
          <li
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-1/5 transition-transform duration-200 ease-out"
            style={{ transform: `translateX(${activa * 100}%)` }}
          >
            <span className="mx-auto mt-0.5 block h-[3px] w-6 rounded-full bg-violeta" />
          </li>
        )}
        {PESTANAS.map((pestana, indice) => {
          const { href, etiqueta, Icono } = pestana;
          const nombre = "nombre" in pestana ? pestana.nombre : undefined;
          const esActiva = indice === activa;
          return (
            <li key={href}>
              <EnlaceTransicion
                href={href}
                aria-current={esActiva ? "page" : undefined}
                aria-label={nombre}
                className={`flex flex-col items-center gap-0.5 rounded-full px-1 pt-2 pb-1 text-[11px] whitespace-nowrap ${
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
