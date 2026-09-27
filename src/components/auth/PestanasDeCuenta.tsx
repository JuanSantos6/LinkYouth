import Link from "next/link";

export type TipoDeAcceso = "individual" | "empresa";

/**
 * Las dos entradas, bien visibles, en iniciar sesión y en crear cuenta:
 * «Busco trabajo» y «Soy empresa». Son enlaces (`?tipo=empresa`), así que
 * cada una tiene su URL, se puede compartir y el botón atrás funciona.
 *
 * En el login la pestaña solo adapta los textos: a qué sección se entra lo
 * decide el tipo real de la cuenta (RF1.2).
 */
export function PestanasDeCuenta({
  activo,
  destinos,
}: {
  activo: TipoDeAcceso;
  destinos: Record<TipoDeAcceso, string>;
}) {
  const opciones: { tipo: TipoDeAcceso; etiqueta: string }[] = [
    { tipo: "individual", etiqueta: "Busco trabajo" },
    { tipo: "empresa", etiqueta: "Soy empresa" },
  ];

  return (
    <nav
      aria-label="Tipo de cuenta"
      className="grid grid-cols-2 gap-1 rounded-full bg-realce p-1"
    >
      {opciones.map(({ tipo, etiqueta }) => {
        const elegida = tipo === activo;
        return (
          <Link
            key={tipo}
            href={destinos[tipo]}
            aria-current={elegida ? "page" : undefined}
            className={`rounded-full px-3 py-2.5 text-center text-[15px] font-semibold transition-[background-color,color,box-shadow] duration-200 ${
              elegida
                ? "bg-superficie text-tinta shadow-[0_1px_3px_rgb(30_26_56/0.15)] ring-1 ring-borde-control/60"
                : "text-apagado hover:text-tinta"
            }`}
          >
            {etiqueta}
          </Link>
        );
      })}
    </nav>
  );
}
