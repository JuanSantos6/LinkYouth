/** Cinco estrellas dibujadas, con el número dicho en palabras para quien no las ve. */
export function Estrellas({ valor }: { valor: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      <span className="sr-only">{valor} de 5</span>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          aria-hidden="true"
          viewBox="0 0 24 24"
          className={`h-4 w-4 ${n <= valor ? "fill-violeta" : "fill-borde"}`}
        >
          <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z" />
        </svg>
      ))}
    </span>
  );
}
