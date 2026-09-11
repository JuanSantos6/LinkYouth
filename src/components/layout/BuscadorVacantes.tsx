import { IconoBusqueda } from "./Iconos";

/**
 * Búsqueda del listado. Es un formulario GET: el resultado queda en la URL, se
 * puede compartir y volver atrás funciona. No necesita JavaScript para andar.
 */
export function BuscadorVacantes({
  accion,
  valor = "",
  placeholder = "Buscar por puesto",
}: {
  accion: string;
  valor?: string;
  placeholder?: string;
}) {
  return (
    <form action={accion} role="search" className="relative">
      <IconoBusqueda className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-apagado" />
      <input
        type="search"
        name="q"
        defaultValue={valor}
        placeholder={placeholder}
        aria-label="Buscar oportunidades"
        className="w-full rounded-control border border-borde-control bg-superficie py-2 pl-9 pr-3 text-[14px] text-tinta placeholder:text-apagado focus:border-acento focus:outline-none"
      />
    </form>
  );
}
