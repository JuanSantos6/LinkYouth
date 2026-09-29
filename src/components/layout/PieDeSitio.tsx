import Link from "next/link";

import { type Area, inicioDe } from "@/lib/navegacion";

import { IconoCodigo } from "./Iconos";
import { Marca } from "./Marca";

/**
 * Pie del sitio, en columnas como cualquier sitio profesional.
 *
 * Ningún enlace lleva a una página vacía: las que no existían se crearon en
 * versión simple y honesta (`/contacto`, y las secciones de publicación y de
 * planes en `/empresas`). Todos son públicos, así que el pie es el mismo para
 * cualquier tipo de cuenta.
 *
 * Redes: la única que figura es el repositorio del proyecto, porque es la
 * única que existe. Sumar íconos de Instagram o LinkedIn que no llevan a
 * ninguna cuenta sería decorar el pie con enlaces muertos. Cuando existan,
 * se agregan a `REDES`.
 */
const COLUMNAS = [
  {
    titulo: "LinkYouth",
    enlaces: [
      { href: "/#nosotros", etiqueta: "Nosotros" },
      { href: "/como-funciona", etiqueta: "Cómo funciona" },
      { href: "/#preguntas", etiqueta: "Preguntas frecuentes" },
    ],
  },
  {
    titulo: "Para jóvenes",
    enlaces: [
      { href: "/empleos", etiqueta: "Búsquedas" },
      { href: "/eventos", etiqueta: "Eventos" },
      { href: "/registro", etiqueta: "Crear cuenta" },
    ],
  },
  {
    titulo: "Para empresas",
    enlaces: [
      { href: "/empresas#publicar", etiqueta: "Publicar búsquedas" },
      { href: "/empresas#planes", etiqueta: "Planes y publicidad" },
      { href: "/contacto#empresas", etiqueta: "Contacto comercial" },
    ],
  },
  {
    titulo: "Ayuda y legales",
    enlaces: [
      { href: "/contacto", etiqueta: "Contacto" },
      { href: "/legales#terminos", etiqueta: "Términos de uso" },
      { href: "/legales#privacidad", etiqueta: "Privacidad" },
      { href: "/legales#accesibilidad", etiqueta: "Accesibilidad" },
    ],
  },
] as const;

const REDES = [
  {
    href: "https://github.com/JuanSantos6/LinkYouth",
    etiqueta: "GitHub: el código del proyecto",
    Icono: IconoCodigo,
  },
] as const;

export function PieDeSitio({ area = "publico" }: { area?: Area }) {
  return (
    <footer className="mt-20 border-t border-borde bg-superficie pb-24 md:pb-0">
      <div className="mx-auto max-w-[1180px] px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_repeat(4,1fr)]">
          <div className="flex flex-col gap-4">
            <Marca href={inicioDe(area)} alto={28} />
            <p className="max-w-xs text-[14px] leading-relaxed text-apagado">
              Primer empleo, pasantías y eventos para jóvenes en Uruguay. Tu
              ficha son tus habilidades, no un currículum.
            </p>
          </div>

          {COLUMNAS.map((columna) => (
            <nav key={columna.titulo} aria-label={columna.titulo}>
              <h2 className="text-[14px] font-bold text-tinta">
                {columna.titulo}
              </h2>
              <ul className="mt-3 space-y-2.5">
                {columna.enlaces.map((enlace) => (
                  <li key={enlace.href}>
                    <Link
                      href={enlace.href}
                      className="text-[14px] text-apagado transition-colors duration-150 hover:text-tinta hover:underline"
                    >
                      {enlace.etiqueta}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-borde pt-6">
          <p className="text-[13px] text-apagado">
            © 2026 LinkYouth. Un proyecto del Taller de Proyectos TIC de la
            Universidad de Montevideo.
          </p>

          <ul className="flex items-center gap-2" aria-label="Redes">
            {REDES.map(({ href, etiqueta, Icono }) => (
              <li key={href}>
                <a
                  href={href}
                  className="flex items-center gap-2 rounded-full border border-borde-control/60 px-3 py-1.5 text-[13px] text-tinta transition-colors duration-150 hover:bg-realce"
                >
                  <Icono className="h-4 w-4" />
                  {etiqueta}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
