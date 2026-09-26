import Link from "next/link";

import { BotonTema } from "@/components/layout/BotonTema";
import { EncabezadoFlotante } from "@/components/navegacion/EncabezadoFlotante";
import {
  MenuDesplegable,
  OPCION_MENU,
} from "@/components/navegacion/MenuDesplegable";
import {
  NavPrincipal,
  type Seccion,
} from "@/components/navegacion/NavPrincipal";
import { EnlaceTransicion } from "@/components/navegacion/Transiciones";
import { cerrarSesion } from "@/lib/acciones/auth";
import { type Area, inicioDe } from "@/lib/navegacion";

import { IconoAjustes, IconoAvisos, IconoPerfil, IconoSalir } from "./Iconos";
import { Marca } from "./Marca";

/**
 * Un solo menú por tipo de cuenta. Antes convivían la cabecera y una barra
 * lateral que repetían Empleos y Eventos; ahora las secciones están acá y, en
 * el teléfono, en las pestañas de abajo (postulante) o en el menú «Secciones».
 *
 * Una cuenta de empresa no ve Empleos ni Eventos del postulante: el
 * middleware la mandaría de vuelta a su panel (RF1.2).
 */
const SECCIONES: Record<Area, readonly Seccion[]> = {
  publico: [
    { href: "/empleos", etiqueta: "Empleos" },
    { href: "/eventos", etiqueta: "Eventos" },
    { href: "/empresas", etiqueta: "Empresas" },
    { href: "/como-funciona", etiqueta: "Cómo funciona" },
  ],
  postulante: [
    { href: "/inicio", etiqueta: "Inicio" },
    { href: "/empleos", etiqueta: "Empleos" },
    { href: "/eventos", etiqueta: "Eventos" },
    { href: "/postulaciones", etiqueta: "Mis postulaciones" },
  ],
  empresa: [
    { href: "/empresa", etiqueta: "Panel" },
    { href: "/empresa#busquedas", etiqueta: "Mis búsquedas" },
    { href: "/empresa#eventos", etiqueta: "Mis eventos" },
    { href: "/como-funciona", etiqueta: "Cómo funciona" },
  ],
};

const ICONO =
  "h-9 w-9 flex items-center justify-center rounded-full text-tinta transition-colors duration-150 hover:bg-realce";

function MenuSecciones({ secciones }: { secciones: readonly Seccion[] }) {
  return (
    <div className="md:hidden">
      <MenuDesplegable
        etiqueta="Secciones"
        alinear="derecha"
        boton={
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="mx-0.5 h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        }
      >
        {secciones.map(({ href, etiqueta }) =>
          href.startsWith("#") ? (
            <a key={href} href={href} role="menuitem" className={OPCION_MENU}>
              {etiqueta}
            </a>
          ) : (
            <EnlaceTransicion
              key={href}
              href={href}
              role="menuitem"
              className={OPCION_MENU}
            >
              {etiqueta}
            </EnlaceTransicion>
          ),
        )}
      </MenuDesplegable>
    </div>
  );
}

function MenuCuenta({ area }: { area: "postulante" | "empresa" }) {
  return (
    <MenuDesplegable
      etiqueta="Menú de tu cuenta"
      boton={
        <>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-lavanda">
            <IconoPerfil className="h-4 w-4" />
          </span>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="mr-1 h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </>
      }
    >
      {area === "postulante" ? (
        <>
          <EnlaceTransicion
            href="/perfil"
            role="menuitem"
            className={OPCION_MENU}
          >
            <IconoPerfil className="h-4 w-4" /> Mi perfil
          </EnlaceTransicion>
          <EnlaceTransicion
            href="/ajustes"
            role="menuitem"
            className={OPCION_MENU}
          >
            <IconoAjustes className="h-4 w-4" /> Ajustes
          </EnlaceTransicion>
        </>
      ) : (
        <EnlaceTransicion
          href="/empresa"
          role="menuitem"
          className={OPCION_MENU}
        >
          <IconoPerfil className="h-4 w-4" /> Panel de empresa
        </EnlaceTransicion>
      )}
      <hr className="mx-2 my-1 border-borde" />
      <form action={cerrarSesion}>
        <button type="submit" role="menuitem" className={OPCION_MENU}>
          <IconoSalir className="h-4 w-4" /> Cerrar sesión
        </button>
      </form>
    </MenuDesplegable>
  );
}

export function CabeceraGlobal({
  area = "postulante",
  umbralId,
  secciones: propias,
}: {
  area?: Area;
  /** En la portada: la cápsula aparece cuando este bloque llega arriba. */
  umbralId?: string;
  /** En la portada: anclas a sus propias secciones en vez de las rutas. */
  secciones?: readonly Seccion[];
}) {
  const secciones = propias ?? SECCIONES[area];

  return (
    <EncabezadoFlotante umbralId={umbralId}>
      <Marca href={inicioDe(area)} alto={26} />

      <NavPrincipal secciones={secciones} />

      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
        <BotonTema />

        {area === "publico" && (
          <>
            <MenuSecciones secciones={secciones} />
            <Link
              href="/login"
              className="hidden rounded-control px-3 py-2 text-[15px] font-medium text-tinta transition-colors duration-150 hover:bg-realce sm:block"
            >
              Entrar
            </Link>
            <Link
              href="/registro"
              className="rounded-control bg-mandarina px-3.5 py-2 text-[15px] font-semibold text-sobre-mandarina transition-[filter] duration-150 hover:brightness-[0.94]"
            >
              Crear cuenta
            </Link>
          </>
        )}

        {area === "postulante" && (
          <>
            <EnlaceTransicion href="/avisos" className={ICONO}>
              <IconoAvisos className="h-[18px] w-[18px]" />
              <span className="sr-only">Avisos</span>
            </EnlaceTransicion>
            <MenuCuenta area="postulante" />
          </>
        )}

        {area === "postulante" && propias && (
          <MenuSecciones secciones={secciones} />
        )}

        {area === "empresa" && (
          <>
            <MenuSecciones secciones={secciones} />
            <MenuCuenta area="empresa" />
          </>
        )}
      </div>
    </EncabezadoFlotante>
  );
}
