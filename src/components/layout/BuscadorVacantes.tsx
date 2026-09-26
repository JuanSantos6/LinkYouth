import { IconoBusqueda } from "./Iconos";

/**
 * Búsqueda del feed. Es un formulario GET: el resultado queda en la URL, se
 * puede compartir y volver atrás funciona. No necesita JavaScript para andar.
 */
export function BuscadorVacantes({
  accion,
  valor = "",
  placeholder = "Buscar por puesto, empresa o habilidad",
}: {
  accion: string;
  valor?: string;
  placeholder?: string;
}) {
  return (
    <form action={accion} role="search" className="relative">
      <IconoBusqueda className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-apagado" />
      <input
        type="search"
        name="q"
        defaultValue={valor}
        placeholder={placeholder}
        aria-label="Buscar oportunidades"
        className="w-full rounded-full border border-borde-control bg-superficie py-2.5 pl-10 pr-4 text-[15px] text-tinta placeholder:text-apagado transition-[border-color] duration-150 focus:border-acento"
      />
    </form>
  );
}
