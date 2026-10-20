import Link from "next/link";

import { CORREO_DE_CONTACTO, enlaceDeCorreo } from "@/lib/contacto";
import { type Area, inicioDe, OCULTAS_PARA_EMPRESA } from "@/lib/navegacion";

import { IconoCorreo } from "./Iconos";
import { Marca } from "./Marca";

/**
 * Pie del sitio, en columnas como cualquier sitio profesional.
 *
 * Ningún enlace lleva a una página vacía ni a una que el middleware rebote. Por
 * eso las columnas dependen del área: a una empresa con sesión no se le ofrecen
 * las búsquedas del postulante ni «Crear cuenta» —la mandarían de vuelta a su
 * panel— ni «Cómo funciona», que es la presentación para quien todavía no
 * tiene cuenta (Etapa 2). En su lugar, accesos a su propia cuenta.
 *
 * Contacto: el correo de `src/lib/contacto.ts`. Antes figuraba el repositorio
 * del proyecto en GitHub; se sacó de la interfaz, que no es lugar para el
 * código fuente.
 */
type Columna = {
  titulo: string;
  enlaces: readonly { href: string; etiqueta: string }[];
};

const LINKYOUTH: Columna = {
  titulo: "LinkYouth",
  enlaces: [
    { href: "/#nosotros", etiqueta: "Nosotros" },
    { href: "/como-funciona", etiqueta: "Cómo funciona" },
    { href: "/#preguntas", etiqueta: "Preguntas frecuentes" },
  ],
};

const PARA_JOVENES: Columna = {
  titulo: "Para jóvenes",
  enlaces: [
    { href: "/empleos", etiqueta: "Búsquedas" },
    { href: "/eventos", etiqueta: "Eventos" },
    { href: "/registro", etiqueta: "Crear cuenta" },
  ],
};

const PARA_EMPRESAS: Columna = {
  titulo: "Para empresas",
  enlaces: [
    { href: "/empresas#publicar", etiqueta: "Publicar búsquedas" },
    { href: "/empresas#planes", etiqueta: "Planes y publicidad" },
    { href: "/contacto#empresas", etiqueta: "Contacto comercial" },
  ],
};

const AYUDA: Columna = {
  titulo: "Ayuda y legales",
  enlaces: [
    { href: "/contacto", etiqueta: "Contacto" },
    { href: "/legales#terminos", etiqueta: "Términos de uso" },
    { href: "/legales#privacidad", etiqueta: "Privacidad" },
    { href: "/legales#accesibilidad", etiqueta: "Accesibilidad" },
  ],
};

const TU_EMPRESA: Columna = {
  titulo: "Tu empresa",
  enlaces: [
    { href: "/empresa", etiqueta: "Panel" },
    { href: "/empresa/busquedas", etiqueta: "Mis búsquedas" },
    { href: "/empresa/eventos", etiqueta: "Mis eventos" },
    { href: "/empresa/candidatos", etiqueta: "Candidatos" },
    { href: "/empresa/avisos", etiqueta: "Avisos" },
    { href: "/empresa/perfil", etiqueta: "Perfil de la empresa" },
    { href: "/empresa/resenias", etiqueta: "Reseñas recibidas" },
    { href: "/empresa/cuenta", etiqueta: "Cuenta" },
  ],
};

const COLUMNAS: Record<Area, readonly Columna[]> = {
  publico: [LINKYOUTH, PARA_JOVENES, PARA_EMPRESAS, AYUDA],
  postulante: [LINKYOUTH, PARA_JOVENES, PARA_EMPRESAS, AYUDA],
  empresa: [
    {
      ...LINKYOUTH,
      enlaces: LINKYOUTH.enlaces.filter(
        ({ href }) => !OCULTAS_PARA_EMPRESA.includes(href),
      ),
    },
    TU_EMPRESA,
    PARA_EMPRESAS,
    AYUDA,
  ],
};

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

          {COLUMNAS[area].map((columna) => (
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

          <a
            href={enlaceDeCorreo()}
            className="flex items-center gap-2 rounded-full border border-borde-control/60 px-3 py-1.5 text-[13px] text-tinta transition-colors duration-150 hover:bg-realce"
          >
            <IconoCorreo className="h-4 w-4" />
            {CORREO_DE_CONTACTO}
          </a>
        </div>
      </div>
    </footer>
  );
}
