import { Marca } from "@/components/layout/Marca";

import { GrupoDeMenus, MenuDeAcceso } from "./MenuDeAcceso";

/**
 * Cabecera de la portada.
 *
 * El menú navega dentro de la misma página: son anclas, no rutas. Alguien que
 * todavía no se registró no tiene secciones propias adónde ir, y mandarlo a
 * otra pantalla para volver enseguida es hacerle perder el hilo.
 *
 * Hasta 1024 px las anclas bajan a una segunda fila. Compartiendo la primera
 * con los dos botones de acceso quedaban en 36 px de ancho en el teléfono y en
 * 104 px en una tablet: el menú estaba, pero no se podía usar. Esconderlo
 * detrás de un botón cuesta más de lo que ahorra —son cinco anclas—, así que
 * ocupa su propia fila y se desplaza en horizontal.
 */
const SECCIONES = [
  { href: "#que-es", etiqueta: "Qué es" },
  { href: "#como-funciona", etiqueta: "Cómo funciona" },
  { href: "#empresas", etiqueta: "Empresas" },
  { href: "#preguntas", etiqueta: "Preguntas" },
  { href: "#contacto", etiqueta: "Contacto" },
];

export const ENTRAR = [
  {
    href: "/login",
    etiqueta: "Busco trabajo",
    ayuda: "Entrá a tu perfil y a tus postulaciones.",
  },
  {
    href: "/login?tipo=empresa",
    etiqueta: "Ofrezco trabajo",
    ayuda: "Entrá al panel de tu organización.",
  },
];

export const CREAR_CUENTA = [
  {
    href: "/registro",
    etiqueta: "Soy joven y busco trabajo",
    ayuda: "Armás tu ficha con habilidades, sin currículum.",
  },
  {
    href: "/registro?tipo=empresa",
    etiqueta: "Represento a una organización",
    ayuda: "Publicás búsquedas y eventos.",
  },
];

export function CabeceraLanding() {
  return (
    <header className="sticky top-0 z-40 border-b border-borde bg-papel/92 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-x-3 px-4 py-2 sm:px-6 lg:h-14 lg:flex-nowrap lg:gap-6 lg:py-0">
        <Marca href="#que-es" />

        {/*
         * Los dos menús comparten grupo para que no puedan estar abiertos a la
         * vez: abiertos los dos, sus paneles se pisaban uno al otro.
         */}
        <GrupoDeMenus className="ml-auto flex shrink-0 items-center gap-2 lg:order-3 lg:ml-0">
          <MenuDeAcceso etiqueta="Ingresar" opciones={ENTRAR} />
          <MenuDeAcceso
            etiqueta="Crear cuenta"
            opciones={CREAR_CUENTA}
            destacado
          />
        </GrupoDeMenus>

        <nav
          aria-label="Secciones de esta página"
          className="order-last w-full min-w-0 overflow-x-auto lg:order-2 lg:w-auto lg:flex-1"
        >
          <ul className="flex items-center gap-1">
            {SECCIONES.map(({ href, etiqueta }) => (
              <li key={href}>
                <a
                  href={href}
                  className="block whitespace-nowrap rounded-control px-3 py-1.5 text-[14px] text-apagado transition-[color,background-color] duration-150 hover:text-tinta"
                >
                  {etiqueta}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
