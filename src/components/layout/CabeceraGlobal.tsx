import Link from "next/link";

import { cerrarSesion } from "@/lib/acciones/auth";

import { IconoAvisos, IconoPerfil, IconoSalir } from "./Iconos";
import { Marca } from "./Marca";

/**
 * Navegación de sitio, presente en todas las pantallas.
 *
 * Se reparte el trabajo con la barra lateral: acá está a dónde se puede ir en
 * LinkYouth —incluido lo que mira alguien que todavía no se registró—, y en la
 * lateral, las secciones de tu cuenta. Por eso «Empleos» y «Eventos» aparecen
 * en los dos lugares sin ser una repetición: uno es el sitio, el otro es tu
 * ficha.
 *
 * En pantallas chicas la fila de secciones se desplaza en horizontal en vez de
 * esconderse: escondida, «Empresas» y «Cómo funciona» quedaban fuera de
 * alcance desde el teléfono. Lo mismo vale para cerrar sesión, que es la
 * acción que no puede depender del ancho de la pantalla.
 */
const SECCIONES = [
  { href: "/empleos", etiqueta: "Empleos" },
  { href: "/eventos", etiqueta: "Eventos" },
  { href: "/empresas", etiqueta: "Empresas" },
  { href: "/como-funciona", etiqueta: "Cómo funciona" },
] as const;

const ACCION_ICONO =
  "flex h-9 w-9 items-center justify-center rounded-control text-apagado transition-[color,background-color] duration-150 hover:bg-realce hover:text-tinta";

export function CabeceraGlobal({
  area = "postulante",
}: {
  /**
   * En qué mitad de la aplicación está quien mira.
   *
   * Sin sesión la cabecera ofrece entrar, no salir: un botón de cerrar sesión
   * para alguien que no la tiene no hace nada. Y una cuenta de empresa no ve
   * los accesos a avisos ni a perfil, que son secciones del postulante: el
   * middleware la rebotaría a su panel.
   */
  area?: "publico" | "postulante" | "empresa";
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-borde bg-papel/92 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-3 px-4 sm:gap-6 sm:px-6">
        <Marca />

        <nav
          aria-label="Secciones de LinkYouth"
          className="min-w-0 flex-1 overflow-x-auto"
        >
          <ul className="flex items-center gap-1">
            {SECCIONES.map(({ href, etiqueta }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="block whitespace-nowrap rounded-control px-3 py-1.5 text-[14px] text-apagado transition-[color,background-color] duration-150 hover:text-tinta"
                >
                  {etiqueta}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          {area === "postulante" && (
            <>
              <Link href="/avisos" className={ACCION_ICONO}>
                <IconoAvisos className="h-[18px] w-[18px]" />
                <span className="sr-only">Avisos</span>
              </Link>

              <Link
                href="/perfil"
                className={`${ACCION_ICONO} rounded-full border border-borde bg-realce`}
              >
                <IconoPerfil className="h-[18px] w-[18px]" />
                <span className="sr-only">Mi perfil</span>
              </Link>
            </>
          )}

          {area === "publico" ? (
            <Link
              href="/login"
              className="whitespace-nowrap rounded-control px-3 py-1.5 text-[14px] font-medium text-tinta transition-[color,background-color] duration-150 hover:bg-realce"
            >
              Entrar
            </Link>
          ) : (
            <form action={cerrarSesion}>
              <button type="submit" className={ACCION_ICONO}>
                <IconoSalir className="h-[18px] w-[18px]" />
                <span className="sr-only">Cerrar sesión</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}
