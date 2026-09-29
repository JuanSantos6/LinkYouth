import type { EmpresaResumen } from "@/lib/data/tipos";

import { PausaDeCinta } from "./PausaDeCinta";

/**
 * Cinta de logos de las organizaciones que publican, de borde a borde, que
 * se desplaza sola, continua e infinita.
 *
 * - La animación es CSS pura sobre `transform` (`.cinta-pista` en
 *   `globals.css`): la lista va dos veces seguida y la pista se corre la
 *   mitad de su ancho, así el final empalma con el principio. No corre
 *   JavaScript en cada cuadro.
 * - Se detiene al pasar el mouse o al recibir foco (la cinta es enfocable),
 *   y tiene un botón de pausa (WCAG 2.2.2). Con «reducir movimiento» queda
 *   quieta y muestra los logos una sola vez.
 * - Cada logo es solo una imagen: ni botón ni enlace. La segunda copia está
 *   oculta para lectores de pantalla, que leen cada organización una vez.
 *
 * Una empresa sin logo se muestra con una marca provisoria (sus iniciales).
 * Alcanza con un solo logo provisorio en la cinta para que se avise en
 * pantalla, aunque otras empresas ya hayan subido el suyo: ver
 * `docs/decisiones.md`.
 */
export function CintaDeOrganizaciones({
  empresas,
  deEjemplo,
}: {
  empresas: EmpresaResumen[];
  /** Las organizaciones mismas son de ejemplo, no salen de la base. */
  deEjemplo: boolean;
}) {
  const provisorios = empresas.filter(
    (empresa) => deEjemplo || !empresa.logo_url,
  ).length;
  const aviso =
    provisorios === 0
      ? "Organizaciones que ya publican búsquedas o eventos."
      : provisorios === empresas.length
        ? "Logos de ejemplo: todavía no hay empresas con permiso para mostrar su marca."
        : "Algunos logos son provisorios: esas empresas todavía no subieron su marca.";

  // Cada tramo tiene que ser más ancho que la pantalla para que no se vea el
  // empalme: con pocas organizaciones, la lista se repite dentro del tramo.
  const repeticiones = Math.max(
    1,
    Math.ceil(12 / Math.max(1, empresas.length)),
  );
  const tramo = Array.from({ length: repeticiones }, () => empresas).flat();

  return (
    <div className="cinta relative" data-pausada="false">
      <div
        tabIndex={0}
        role="region"
        aria-label="Organizaciones que publican en LinkYouth"
        className="cinta-ventana overflow-hidden py-6 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]"
      >
        <ul className="cinta-pista flex w-max items-center">
          {[0, 1].map((copia) =>
            tramo.map((empresa, indice) => (
              <li
                key={`${copia}-${indice}`}
                aria-hidden={
                  copia === 1 || indice >= empresas.length ? true : undefined
                }
                className="cinta-logo shrink-0 px-8 sm:px-12"
              >
                <Logo empresa={empresa} deEjemplo={deEjemplo} />
              </li>
            )),
          )}
        </ul>
      </div>

      <div className="mx-auto mt-2 flex max-w-[1180px] flex-wrap items-center justify-between gap-3 px-4 sm:px-6">
        <p
          className="text-[13.5px] text-apagado"
          data-aviso-cinta={provisorios > 0 ? "provisorios" : "reales"}
        >
          {aviso}
        </p>
        <PausaDeCinta />
      </div>
    </div>
  );
}

function Logo({
  empresa,
  deEjemplo,
}: {
  empresa: EmpresaResumen;
  deEjemplo: boolean;
}) {
  if (empresa.logo_url) {
    const nombre = deEjemplo
      ? `Logo de ejemplo de ${empresa.razon_social}`
      : `Logo de ${empresa.razon_social}`;
    return (
      // eslint-disable-next-line @next/next/no-img-element -- logo en Supabase Storage, fuera del optimizador
      <img
        src={empresa.logo_url}
        alt={nombre}
        className="h-10 w-auto max-w-[180px] object-contain"
      />
    );
  }

  const iniciales = empresa.razon_social
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0]?.toUpperCase())
    .join("");

  // Sin logo: una marca de ejemplo en el color del texto, para que la cinta
  // se lea como una fila de logos y no como una lista de tarjetas.
  return (
    <svg
      role="img"
      aria-label={`Logo provisorio de ${empresa.razon_social}`}
      data-logo-provisorio
      viewBox="0 0 220 48"
      className="h-10 w-auto text-apagado"
    >
      <rect
        x="1"
        y="4"
        width="40"
        height="40"
        rx="12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <text
        x="21"
        y="30"
        textAnchor="middle"
        fontSize="16"
        fontWeight="800"
        fill="currentColor"
        fontFamily="var(--fuente-titulo), sans-serif"
      >
        {iniciales}
      </text>
      <text
        x="54"
        y="31"
        fontSize="19"
        fontWeight="700"
        fill="currentColor"
        fontFamily="var(--fuente-titulo), sans-serif"
      >
        {empresa.razon_social}
      </text>
    </svg>
  );
}
