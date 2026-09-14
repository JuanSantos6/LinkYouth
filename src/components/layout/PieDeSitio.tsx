import Link from "next/link";

import { IconoCodigo } from "./Iconos";
import { Marca } from "./Marca";

const PLATAFORMA_POSTULANTE = [
  { href: "/empleos", etiqueta: "Empleos y pasantías" },
  { href: "/eventos", etiqueta: "Eventos" },
  { href: "/postulaciones", etiqueta: "Mis postulaciones" },
  { href: "/perfil", etiqueta: "Mi perfil" },
];

/**
 * Una cuenta de empresa no puede entrar a las secciones del postulante: el
 * middleware la manda a su panel. Ofrecerle esos enlaces sería mandarla a
 * rebotar.
 */
const PLATAFORMA_EMPRESA = [
  { href: "/empresa", etiqueta: "Panel de empresa" },
  { href: "/empresas", etiqueta: "Qué ofrece LinkYouth" },
];

const COLUMNAS = [
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
export function PieDeSitio({
  area = "postulante",
}: {
  area?: "publico" | "postulante" | "empresa";
}) {
  const columnas = [
    {
      titulo: "Plataforma",
      enlaces: area === "empresa" ? PLATAFORMA_EMPRESA : PLATAFORMA_POSTULANTE,
    },
    ...COLUMNAS,
  ];

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

          {columnas.map((columna) => (
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
