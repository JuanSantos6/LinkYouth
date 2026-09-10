// TODO: reconectar contra db/schema.sql
import type { TagDePerfil } from "@/lib/data/tipos";
import type { CategoriaTag } from "@/types/database";

const CATEGORIAS: Record<CategoriaTag, string> = {
  tecnologia: "Tecnología",
  diseno: "Diseño",
  datos: "Datos",
  negocios: "Negocios",
  idiomas: "Idiomas",
  habilidades_blandas: "Habilidades blandas",
};

const ORDEN: CategoriaTag[] = [
  "tecnologia",
  "diseno",
  "datos",
  "negocios",
  "idiomas",
  "habilidades_blandas",
];

/**
 * Habilidades del perfil agrupadas por categoría (RF2.3).
 *
 * El nivel se representa con una barra corta y también en texto: apoyarse
 * solo en la longitud de una barra deja afuera a quien no la puede comparar
 * de un vistazo.
 */
export function NubeTags({ tags }: { tags: TagDePerfil[] }) {
  if (tags.length === 0) {
    return (
      <p className="text-sm text-tinta-suave">
        Todavía no elegiste habilidades. Son la base con la que la plataforma te
        acerca vacantes.
      </p>
    );
  }

  const porCategoria = ORDEN.map((categoria) => ({
    categoria,
    tags: tags.filter((tag) => tag.categoria === categoria),
  })).filter((grupo) => grupo.tags.length > 0);

  return (
    <div className="space-y-5">
      {porCategoria.map(({ categoria, tags: tagsDeCategoria }) => (
        <section key={categoria}>
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-tinta-suave">
            {CATEGORIAS[categoria]}
          </h3>

          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {tagsDeCategoria.map((tag) => (
              <li
                key={tag.slug}
                className="flex items-center justify-between gap-3 rounded-control border border-borde bg-superficie-suave px-3 py-2"
              >
                <span className="truncate text-sm font-medium text-tinta">
                  {tag.nombre}
                </span>

                <span className="flex shrink-0 items-center gap-2">
                  <span className="flex gap-0.5" aria-hidden="true">
                    {[1, 2, 3, 4, 5].map((paso) => (
                      <span
                        key={paso}
                        className={`h-1.5 w-3 rounded-full ${
                          paso <= tag.nivel ? "bg-primario" : "bg-borde-fuerte"
                        }`}
                      />
                    ))}
                  </span>
                  <span className="font-mono text-xs text-tinta-suave">
                    {tag.nivel}/5
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
