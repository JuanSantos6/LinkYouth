import { EnlaceDemo } from "@/components/EnlaceDemo";
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

import { Marca } from "./Marca";

/** En el teléfono, las secciones de la portada van en un menú desplegable. */
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
        {secciones.map(({ href, etiqueta }) => (
          <a key={href} href={href} role="menuitem" className={OPCION_MENU}>
            {etiqueta}
          </a>
        ))}
      </MenuDesplegable>
    </div>
  );
}

/**
 * Encabezado de la portada.
 *
 * Logo, anclas a las secciones de la página, botón de tema (claro / oscuro /
 * como el sistema) y los botones «Entrar» y «Crear cuenta». En esta versión
 * de presentación no hay sesión, así que esos dos botones son de
 * demostración (`EnlaceDemo`): responden al clic pero no navegan.
 */
export function CabeceraGlobal({
  secciones,
}: {
  secciones: readonly Seccion[];
}) {
  return (
    <EncabezadoFlotante>
      <Marca href="#arriba" alto={26} />

      <NavPrincipal secciones={secciones} />

      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
        <BotonTema />
        <MenuSecciones secciones={secciones} />
        <EnlaceDemo
          href="/login"
          className="hidden rounded-control px-3 py-2 text-[15px] font-medium text-tinta transition-colors duration-150 hover:bg-realce sm:block"
        >
          Entrar
        </EnlaceDemo>
        <EnlaceDemo
          href="/registro"
          className="rounded-control bg-mandarina px-3.5 py-2 text-[15px] font-semibold text-sobre-mandarina transition-[filter] duration-150 hover:brightness-[0.94]"
        >
          Crear cuenta
        </EnlaceDemo>
      </div>
    </EncabezadoFlotante>
  );
}
