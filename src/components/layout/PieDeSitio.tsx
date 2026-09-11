import Link from "next/link";

import { IconoCodigo } from "./Iconos";
import { Marca } from "./Marca";

const COLUMNAS = [
  {
    titulo: "Plataforma",
    enlaces: [
      { href: "/empleos", etiqueta: "Empleos y pasantías" },
      { href: "/eventos", etiqueta: "Eventos" },
      { href: "/postulaciones", etiqueta: "Mis postulaciones" },
      { href: "/perfil", etiqueta: "Mi perfil" },
    ],
  },
  {
    titulo: "LinkYouth",
    enlaces: [
      { href: "/como-funciona", etiqueta: "Cómo funciona" },
      { href: "/empresas", etiqueta: "Para empresas" },
      { href: "/avisos", etiqueta: "Avisos" },
      { href: "/ajustes", etiqueta: "Ajustes" },
    ],
  },
  {
    titulo: "Legales",
    enlaces: [
      { href: "/legales#terminos", etiqueta: "Términos de uso" },
      { href: "/legales#privacidad", etiqueta: "Privacidad de tus datos" },
      { href: "/legales#accesibilidad", etiqueta: "Accesibilidad" },
    ],
  },
] as const;

/**
 * Pie del sitio.
 *
 * La única red que figura es el repositorio del proyecto, porque es la única
 * que existe de verdad. Sumar íconos de LinkedIn o Instagram que no llevan a
 * ninguna cuenta sería decorar el pie con enlaces muertos.
 */
export function PieDeSitio() {
  return (
    <footer className="mt-16 border-t border-borde bg-realce">
      <div className="mx-auto max-w-[1320px] px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Marca />
            <p className="mt-3 max-w-xs text-[14px] leading-relaxed text-apagado">
              Primer empleo, formación y networking para jóvenes. Tu perfil son
              tus habilidades acreditadas, no un currículum.
            </p>
          </div>

          {COLUMNAS.map((columna) => (
            <nav key={columna.titulo} aria-label={columna.titulo}>
              <h2 className="text-[14px] font-semibold text-tinta">
                {columna.titulo}
              </h2>
              <ul className="mt-3 space-y-2">
                {columna.enlaces.map((enlace) => (
                  <li key={enlace.href}>
                    <Link
                      href={enlace.href}
                      className="text-[14px] text-apagado transition-colors duration-150 hover:text-tinta"
                    >
                      {enlace.etiqueta}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-borde pt-6">
          <p className="text-[13px] text-apagado">
            © 2026 LinkYouth. Todos los derechos reservados. Montevideo,
            Uruguay.
          </p>

          <a
            href="https://github.com/JuanSantos6/LinkYouth"
            className="flex items-center gap-2 text-[13px] text-apagado transition-colors duration-150 hover:text-tinta"
          >
            <IconoCodigo className="h-4 w-4" />
            El código del proyecto
          </a>
        </div>
      </div>
    </footer>
  );
}
