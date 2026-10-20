/**
 * Confirmación de lo que se acaba de hacer en la pantalla anterior: «La
 * búsqueda quedó publicada». Llega por `searchParams` (`?guardada=1`) porque
 * la acción redirige al terminar y el estado del formulario no viaja con la
 * redirección.
 *
 * `role="status"` para que un lector de pantalla lo anuncie al llegar.
 */
export function AvisoDeResultado({
  children,
  tono = "ok",
}: {
  children: React.ReactNode;
  tono?: "ok" | "error";
}) {
  return (
    <p
      role="status"
      className={`animate-[ly-aparecer_200ms_cubic-bezier(0.2,0.7,0.2,1)] rounded-ficha border-l-2 px-4 py-3 text-[14.5px] ${
        tono === "error"
          ? "border-alerta bg-realce font-medium text-alerta"
          : "border-acento bg-lavanda text-tinta"
      }`}
    >
      {tono === "error" && <span className="font-semibold">No se pudo: </span>}
      {children}
    </p>
  );
}
