"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  IconoAjustes,
  IconoEmpleos,
  IconoEventos,
  IconoInicio,
  IconoPerfil,
  IconoPostulaciones,
} from "./Iconos";

const SECCIONES = [
  { href: "/inicio", etiqueta: "Inicio", Icono: IconoInicio },
  { href: "/empleos", etiqueta: "Empleos", Icono: IconoEmpleos },
  { href: "/eventos", etiqueta: "Eventos", Icono: IconoEventos },
  {
    href: "/postulaciones",
    etiqueta: "Postulaciones",
    Icono: IconoPostulaciones,
  },
  { href: "/perfil", etiqueta: "Mi perfil", Icono: IconoPerfil },
  { href: "/ajustes", etiqueta: "Ajustes", Icono: IconoAjustes },
] as const;

/**
 * Secciones de tu cuenta.
 *
 * La activa se marca con un filete vertical, no con una píldora rellena: el
 * relleno pesa más que el propio texto y termina compitiendo con la acción
 * principal de la pantalla.
 *
 * En pantallas chicas pasa a ser una fila que se desplaza en horizontal. Con
 * seis secciones, esconderlas detrás de un menú cuesta más de lo que ahorra.
 */
export function BarraLateral() {
  const ruta = usePathname();

  return (
    <nav
      aria-label="Secciones de tu cuenta"
      // `min-w-0` deja que la fila se desplace por dentro en vez de
      // ensanchar la grilla: sin eso, la página entera se corre en horizontal.
      className="min-w-0 lg:sticky lg:top-20 lg:self-start"
    >
      <ul className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:gap-0 lg:overflow-visible lg:pb-0">
        {SECCIONES.map(({ href, etiqueta, Icono }) => {
          const activa = ruta === href || ruta.startsWith(`${href}/`);

          return (
            <li key={href} className="shrink-0 lg:shrink">
              <Link
                href={href}
                aria-current={activa ? "page" : undefined}
                className={`flex items-center gap-3 border-l-2 py-2.5 pl-3 pr-3 text-[14px] transition-colors duration-150 ${
                  activa
                    ? "border-acento font-medium text-tinta"
                    : "border-transparent text-apagado hover:text-tinta"
                }`}
              >
                <Icono
                  className={`h-[17px] w-[17px] ${
                    activa ? "text-acento" : "text-apagado"
                  }`}
                />
                {etiqueta}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
