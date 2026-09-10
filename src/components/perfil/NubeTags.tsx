import { Etiqueta } from "@/components/ui/Etiqueta";

/**
 * Intereses y habilidades del perfil (RF2.3, RF2.4.3).
 *
 * Van en dos grupos separados porque `db/schema.sql` los guarda en catálogos
 * distintos: `tags` es «me interesa» y `habilidades` es «sé hacer». El
 * matching de RF3.9 necesita esa distinción, así que la interfaz no los
 * mezcla.
 *
 * No hay nivel de dominio ni categoría: `perfil_tags` y `perfil_habilidades`
 * son tablas puente sin más columnas que las dos claves.
 */
export function NubeTags({
  tags,
  habilidades,
}: {
  tags: string[];
  habilidades: string[];
}) {
  if (tags.length === 0 && habilidades.length === 0) {
    return (
      <p className="text-sm text-tinta-suave">
        Todavía no elegiste intereses ni habilidades. Son la base con la que la
        plataforma te acerca vacantes y eventos.
      </p>
    );
  }

  const grupos = [
    {
      titulo: "Habilidades",
      ayuda: "Lo que sabés hacer.",
      elementos: habilidades,
    },
    {
      titulo: "Áreas de interés",
      ayuda: "Hacia dónde querés ir.",
      elementos: tags,
    },
  ].filter((grupo) => grupo.elementos.length > 0);

  return (
    <div className="space-y-5">
      {grupos.map(({ titulo, ayuda, elementos }) => (
        <section key={titulo}>
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-tinta-suave">
            {titulo}
          </h3>
          <p className="mt-0.5 text-xs text-tinta-suave">{ayuda}</p>

          <ul className="mt-2 flex flex-wrap gap-1.5">
            {elementos.map((elemento) => (
              <li key={elemento}>
                <Etiqueta>{elemento}</Etiqueta>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
