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
      <p className="text-[14px] text-apagado">
        Todavía no elegiste intereses ni habilidades. Son la base con la que la
        plataforma te acerca vacantes y eventos.
      </p>
    );
  }

  const grupos = [
    {
      titulo: "Lo que sabés hacer",
      elementos: habilidades,
    },
    {
      titulo: "Hacia dónde querés ir",
      elementos: tags,
    },
  ].filter((grupo) => grupo.elementos.length > 0);

  return (
    <div className="divide-y divide-filete">
      {grupos.map(({ titulo, elementos }) => (
        <section key={titulo} className="py-4 first:pt-0 last:pb-0">
          <h3 className="text-[14px] font-medium text-tinta">{titulo}</h3>

          <ul className="mt-2.5 flex flex-wrap gap-1.5">
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
