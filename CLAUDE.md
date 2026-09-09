## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Modelo de datos

El esquema completo está en `db/schema.sql` y las políticas de seguridad en
`db/politicas.sql`. Leé ambos archivos completos antes de generar cualquier
código que toque la base de datos.

Reglas fijas:
- Nunca se borran filas de `postulaciones`, `resenias` ni `eventos`. Los
  estados se actualizan, no se eliminan registros.
- Los tags ocultos de una vacante (`vacante_tags_ocultos`) nunca se incluyen
  en ninguna consulta que pueda ver un usuario individual.
- Las transiciones de estado en `postulaciones` están restringidas por RLS: el
  postulante solo puede pasar a `cancelada`, la empresa solo a
  `en_revision`/`aceptada`/`rechazada`.
