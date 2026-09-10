"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
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
] as const;

/**
 * Navegación principal.
 *
 * En escritorio es una columna fija de 240 px; en pantallas chicas se
 * convierte en una fila que se desplaza en horizontal, sin menú desplegable
 * de por medio: con cinco secciones, esconderlas cuesta más de lo que ahorra.
 */
export function BarraLateral() {
  const ruta = usePathname();

  return (
    <nav
      aria-label="Secciones de LinkYouth"
      className="lg:sticky lg:top-6 lg:self-start"
    >
      <Link href="/inicio" className="mb-6 hidden items-center gap-2.5 lg:flex">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 items-center justify-center rounded-control bg-primario text-sm font-bold text-white"
        >
          LY
        </span>
        <span className="text-base font-bold tracking-tight text-tinta">
          LinkYouth
        </span>
      </Link>

      <ul className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {SECCIONES.map(({ href, etiqueta, Icono }) => {
          const activa = ruta === href || ruta.startsWith(`${href}/`);

          return (
            <li key={href} className="shrink-0 lg:shrink">
              <Link
                href={href}
                aria-current={activa ? "page" : undefined}
                className={`flex items-center gap-3 rounded-control px-3 py-2.5 text-sm transition-colors duration-150 ${
                  activa
                    ? "bg-primario-suave font-semibold text-primario-fuerte"
                    : "font-medium text-tinta-media hover:bg-superficie-suave hover:text-tinta"
                }`}
              >
                <Icono
                  className={`h-[18px] w-[18px] ${
                    activa ? "text-primario" : "text-tinta-tenue"
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
