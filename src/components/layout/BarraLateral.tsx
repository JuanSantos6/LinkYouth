"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cerrarSesion } from "@/lib/acciones/auth";

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
 *
 * La marca y el cierre de sesión se ven en los dos tamaños. Antes eran
 * `hidden lg:…`, así que desde un teléfono no había forma de cerrar sesión.
 * En angosto comparten una fila —marca a la izquierda, salida a la derecha—;
 * en escritorio el `lg:contents` disuelve esa fila y el `order` devuelve cada
 * pieza a su lugar de siempre, arriba y abajo de la lista.
 *
 * El `min-w-0` del `nav` no es decorativo: sin él la fila de secciones impone
 * su ancho máximo a la columna y empuja la página entera a 574 px dentro de un
 * viewport de 390. Con él, el ancho que sobra se desplaza dentro de la lista,
 * que es de lo que se trata el `overflow-x-auto`.
 */
export function BarraLateral() {
  const ruta = usePathname();

  return (
    <nav
      aria-label="Secciones de LinkYouth"
      className="flex min-w-0 flex-col lg:sticky lg:top-6 lg:self-start"
    >
      <div className="mb-3 flex items-center justify-between gap-3 lg:contents">
        <Link
          href="/inicio"
          className="flex items-center gap-2.5 lg:order-1 lg:mb-6"
        >
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

        <form action={cerrarSesion} className="shrink-0 lg:order-3 lg:mt-6">
          <button
            type="submit"
            className="rounded-control px-3 py-2.5 text-sm font-medium text-tinta-media transition-[color,background-color] duration-150 hover:bg-superficie-suave hover:text-tinta lg:w-full lg:text-left"
          >
            Cerrar sesión
          </button>
        </form>
      </div>

      <ul className="flex snap-x snap-mandatory gap-1 overflow-x-auto scroll-px-1 pb-1 lg:order-2 lg:snap-none lg:flex-col lg:overflow-visible lg:pb-0">
        {SECCIONES.map(({ href, etiqueta, Icono }) => {
          const activa = ruta === href || ruta.startsWith(`${href}/`);

          return (
            <li key={href} className="shrink-0 snap-start lg:shrink">
              <Link
                href={href}
                aria-current={activa ? "page" : undefined}
                className={`flex items-center gap-3 rounded-control px-3 py-2.5 text-sm transition-[color,background-color] duration-150 ${
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
