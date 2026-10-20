import Link from "next/link";

import { CampanaDeAvisos } from "@/components/avisos/CampanaDeAvisos";
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
import { contarAvisosSinLeer } from "@/lib/data/consultas";
import { type Area, inicioDe } from "@/lib/navegacion";

import {
  IconoAjustes,
  IconoAvisos,
  IconoPerfil,
  IconoResenias,
  IconoSalir,
} from "./Iconos";
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
  // Sin «Cómo funciona»: es la presentación para quien todavía no tiene
  // cuenta, y una empresa con sesión ya está adentro (Etapa 2).
  empresa: [
    { href: "/empresa", etiqueta: "Panel" },
    { href: "/empresa/busquedas", etiqueta: "Mis búsquedas" },
    { href: "/empresa/eventos", etiqueta: "Mis eventos" },
    { href: "/empresa/candidatos", etiqueta: "Candidatos" },
  ],
};

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
        <>
          <EnlaceTransicion
            href="/empresa/perfil"
            role="menuitem"
            className={OPCION_MENU}
          >
            <IconoPerfil className="h-4 w-4" /> Perfil de la empresa
          </EnlaceTransicion>
          <EnlaceTransicion
            href="/empresa/avisos"
            role="menuitem"
            className={OPCION_MENU}
          >
            <IconoAvisos className="h-4 w-4" /> Avisos
          </EnlaceTransicion>
          <EnlaceTransicion
            href="/empresa/resenias"
            role="menuitem"
            className={OPCION_MENU}
          >
            <IconoResenias className="h-4 w-4" /> Reseñas recibidas
          </EnlaceTransicion>
          <EnlaceTransicion
            href="/empresa/cuenta"
            role="menuitem"
            className={OPCION_MENU}
          >
            <IconoAjustes className="h-4 w-4" /> Cuenta
          </EnlaceTransicion>
        </>
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

export async function CabeceraGlobal({
  area = "postulante",
  secciones: propias,
}: {
  area?: Area;
  /** En la portada: anclas a sus propias secciones en vez de las rutas. */
  secciones?: readonly Seccion[];
}) {
  const secciones = propias ?? SECCIONES[area];
  const avisosSinLeer = area === "publico" ? 0 : await contarAvisosSinLeer();

  return (
    <EncabezadoFlotante>
      <Marca href={inicioDe(area)} alto={26} />

      <NavPrincipal secciones={secciones} />

      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
        {area !== "publico" && <BotonTema />}

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
            <CampanaDeAvisos href="/avisos" sinLeer={avisosSinLeer} />
            <MenuCuenta area="postulante" />
          </>
        )}

        {area === "postulante" && propias && (
          <MenuSecciones secciones={secciones} />
        )}

        {area === "empresa" && (
          <>
            <CampanaDeAvisos href="/empresa/avisos" sinLeer={avisosSinLeer} />
            <MenuSecciones secciones={secciones} />
            <MenuCuenta area="empresa" />
          </>
        )}
      </div>
    </EncabezadoFlotante>
  );
}
