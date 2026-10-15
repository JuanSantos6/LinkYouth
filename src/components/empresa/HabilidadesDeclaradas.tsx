import { Etiqueta } from "@/components/ui/Etiqueta";
import type { CoincidenciaDeCandidato } from "@/lib/dominio/CoincidenciaDeCandidato";

/**
 * Las habilidades que declara una persona, con las que pide la búsqueda
 * marcadas en violeta (y «pedida» para lectores de pantalla). Primero las
 * pedidas: son las que la empresa vino a mirar.
 *
 * Se llaman «habilidades declaradas» en todas las pantallas de empresa: las
 * carga la persona y la plataforma todavía no las verifica.
 */
export function HabilidadesDeclaradas({
  habilidades,
  coincidencia,
  titulo = "Habilidades declaradas",
}: {
  habilidades: string[];
  coincidencia?: CoincidenciaDeCandidato;
  titulo?: string;
}) {
  if (habilidades.length === 0) {
    return (
      <p className="text-[13.5px] text-apagado">
        Todavía no declaró habilidades.
      </p>
    );
  }

  const pedida = (h: string) => coincidencia?.pide(h) ?? false;
  const ordenadas = [...habilidades].sort(
    (a, b) => Number(pedida(b)) - Number(pedida(a)),
  );

  return (
    <div>
      <p className="sr-only">{titulo}:</p>
      <ul className="flex flex-wrap gap-1.5">
        {ordenadas.map((habilidad) => (
          <li key={habilidad}>
            {pedida(habilidad) ? (
              <Etiqueta marcada="pedida en la búsqueda">{habilidad}</Etiqueta>
            ) : (
              <Etiqueta>{habilidad}</Etiqueta>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
