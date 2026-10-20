import type { CoincidenciaDeCandidato } from "@/lib/dominio/CoincidenciaDeCandidato";

/**
 * Las dos cuentas de `CoincidenciaDeCandidato`, en palabras: «Declara 3 de 4
 * habilidades pedidas · 1 de 2 intereses clave». Sin porcentaje y sin color
 * de logro: son habilidades declaradas, nadie las acreditó todavía.
 */
export function Coincidencia({
  coincidencia,
}: {
  coincidencia: CoincidenciaDeCandidato;
}) {
  const partes: string[] = [];

  if (coincidencia.habilidadesPedidas > 0) {
    partes.push(
      `Declara ${coincidencia.habilidadesCubiertas} de ${coincidencia.habilidadesPedidas} ${coincidencia.habilidadesPedidas === 1 ? "habilidad pedida" : "habilidades pedidas"}`,
    );
  }
  if (coincidencia.interesesClave > 0) {
    partes.push(
      `${coincidencia.interesesClaveCubiertos} de ${coincidencia.interesesClave} ${coincidencia.interesesClave === 1 ? "interés clave" : "intereses clave"}`,
    );
  }
  if (partes.length === 0) return null;

  return (
    <p className="text-[13.5px] text-tinta">
      {partes.map((parte, i) => (
        <span key={parte}>
          {i > 0 && (
            <span aria-hidden="true" className="px-1.5 text-apagado">
              ·
            </span>
          )}
          {i > 0 && <span className="sr-only">, </span>}
          {parte}
        </span>
      ))}
    </p>
  );
}
