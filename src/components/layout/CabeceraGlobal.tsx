import Link from "next/link";

import { IconoAvisos, IconoPerfil } from "./Iconos";
import { Marca } from "./Marca";

/**
 * Navegación de sitio, presente en todas las pantallas.
 *
 * Se reparte el trabajo con la barra lateral: acá está a dónde se puede ir en
 * LinkYouth —incluido lo que mira alguien que todavía no se registró—, y en la
 * lateral, las secciones de tu cuenta. Por eso «Empleos» y «Eventos» aparecen
 * en los dos lugares sin ser una repetición: uno es el sitio, el otro es tu
 * ficha.
 */
const SECCIONES = [
  { href: "/empleos", etiqueta: "Empleos" },
  { href: "/eventos", etiqueta: "Eventos" },
  { href: "/empresas", etiqueta: "Empresas" },
  { href: "/como-funciona", etiqueta: "Cómo funciona" },
] as const;

export function CabeceraGlobal() {
  return (
    <header className="sticky top-0 z-40 border-b border-borde bg-papel/92 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-6 px-4 sm:px-6">
        <Marca />

        {/*
          En pantallas chicas la fila se desplaza en horizontal en vez de
          esconderse: escondida, «Empresas» y «Cómo funciona» quedaban fuera
          de alcance desde el teléfono.
        */}
        <nav
          aria-label="Secciones de LinkYouth"
          className="min-w-0 flex-1 overflow-x-auto"
        >
          <ul className="flex items-center gap-1">
            {SECCIONES.map(({ href, etiqueta }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="block whitespace-nowrap rounded-control px-3 py-1.5 text-[14px] text-apagado transition-colors duration-150 hover:text-tinta"
                >
                  {etiqueta}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          <Link
            href="/avisos"
            className="flex h-9 w-9 items-center justify-center rounded-control text-apagado transition-colors duration-150 hover:bg-realce hover:text-tinta"
          >
            <IconoAvisos className="h-[18px] w-[18px]" />
            <span className="sr-only">Avisos</span>
          </Link>

          <Link
            href="/perfil"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-borde bg-realce text-apagado transition-colors duration-150 hover:text-tinta"
          >
            <IconoPerfil className="h-[18px] w-[18px]" />
            <span className="sr-only">Mi perfil</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
