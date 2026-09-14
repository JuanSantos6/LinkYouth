import Link from "next/link";

type Opcion = {
  href: string;
  etiqueta: string;
  ayuda: string;
};

/**
 * Botón que despliega las dos puertas de entrada: la del postulante y la de
 * la empresa.
 *
 * Es un `<details>` y no un menú con estado: el navegador ya sabe abrir y
 * cerrar una divulgación, la enfoca con teclado y la anuncia a un lector de
 * pantalla. Escribirlo con `useState` significaría mandar JavaScript al
 * navegador para reimplementar —peor— algo que viene resuelto.
 */
export function MenuDeAcceso({
  etiqueta,
  opciones,
  destacado = false,
}: {
  etiqueta: string;
  opciones: Opcion[];
  /** El de crear cuenta, que es la acción principal de la portada. */
  destacado?: boolean;
}) {
  const boton = destacado
    ? "bg-acento text-sobre-acento hover:bg-tinta"
    : "border border-borde-control text-tinta hover:border-tinta";

  return (
    <details className="relative">
      <summary
        className={`flex cursor-pointer list-none items-center gap-1.5 whitespace-nowrap rounded-control px-3 py-1.5 text-[14px] font-medium transition-[color,background-color,border-color] duration-150 [&::-webkit-details-marker]:hidden ${boton}`}
      >
        {etiqueta}
        <span aria-hidden="true" className="text-[10px]">
          ▾
        </span>
      </summary>

      <ul className="absolute right-0 z-50 mt-1.5 w-64 rounded-ficha border border-borde bg-superficie p-1 shadow-elevada">
        {opciones.map((opcion) => (
          <li key={opcion.href}>
            <Link
              href={opcion.href}
              className="block rounded-control px-3 py-2.5 transition-[background-color] duration-150 hover:bg-realce"
            >
              <span className="block text-[14px] font-medium text-tinta">
                {opcion.etiqueta}
              </span>
              <span className="mt-0.5 block text-[13px] text-apagado">
                {opcion.ayuda}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
