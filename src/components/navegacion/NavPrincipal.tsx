export type Seccion = { href: string; etiqueta: string };

/**
 * Las secciones del encabezado. En la portada son anclas de la misma página
 * (`#nosotros`, `#preguntas`…): un `<a>` común, que desplaza suave con Lenis
 * (`AnimacionesDePortada`) o con `scroll-behavior`.
 */
export function NavPrincipal({ secciones }: { secciones: readonly Seccion[] }) {
  return (
    <nav
      aria-label="Secciones de LinkYouth"
      className="hidden min-w-0 flex-1 md:block"
    >
      <ul className="flex items-center gap-1">
        {secciones.map(({ href, etiqueta }) => (
          <li key={href}>
            <a
              href={href}
              className="block whitespace-nowrap rounded-full px-3 py-2 text-[15px] font-medium text-tinta transition-colors duration-150 hover:bg-realce"
            >
              {etiqueta}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
