# LinkYouth

Plataforma de primer empleo, formación y networking para jóvenes.
Next.js 15 (App Router) + TypeScript strict + Tailwind CSS 4 + Supabase.

La especificación funcional está en `docs/01_preamble.md`; las decisiones de
arquitectura, en `docs/decisiones.md`. Cada requisito tiene número (RF3.6,
RNF5…) y el código los cita en los comentarios: usá esos números al explicar
un cambio.

## Antes de escribir código

Para la interfaz (pantallas, componentes, estilos, textos), la skill
`.claude/skills/diseno-linkyouth/SKILL.md` tiene prioridad sobre el criterio
general: contiene las decisiones de diseño ya tomadas.

Para los datos, la referencia es el esquema mismo: `db/schema.sql` y
`db/politicas.sql`. Leelos completos antes de escribir una consulta.

## Mapa

```
db/schema.sql          Esquema de la base: tablas, funciones, disparadores.
db/politicas.sql       Row Level Security.
docs/                  SRS y decisiones técnicas.
src/app/(app)/         Pantallas de la aplicación (inicio, empleos, eventos,
                       postulaciones, perfil).
src/components/        ui/ primitivas · layout/ estructura · empleos/ eventos/
                       perfil/ por dominio.
src/lib/data/          Lectura. Vacía: pendiente de reescribir.
src/lib/acciones/      Escritura. Vacía: pendiente de reescribir.
src/lib/supabase/      Clientes de navegador y de servidor.
src/types/database.ts  Tipos del esquema.
```

## Reglas que no se negocian

- **Server Component por defecto.** `"use client"` solo con estado o eventos
  del navegador. Filtros y pestañas se hacen con enlaces y `searchParams`.
- **Los tags ocultos de una vacante no llegan nunca al postulante** (RF3.1.6,
  RNF5).
- **El control de acceso vive en la base**, como política de RLS.
- **Los datos de ejemplo se anuncian en pantalla** con `AvisoOrigen`. Nunca se
  muestran como si fueran reales.
- **Español rioplatense** en la interfaz, en los comentarios y en los nombres
  del esquema.

## Estado de la capa de datos

`src/lib/data/` y `src/lib/acciones/` están vacías. Sus archivos consultaban
un esquema que se descartó y se eliminaron. Las páginas de `src/app/(app)/` y
varios componentes quedaron con imports rotos, marcados con
`// TODO: reconectar contra db/schema.sql`.

Hasta que esa capa se reescriba contra `db/schema.sql`, el proyecto **no
compila**. Es un estado conocido, no una regresión.

## Comandos

```bash
npm run dev        npm run build      npm run start
npm run lint       npm run typecheck  npm run format
```

Antes de dar algo por terminado: `npm run lint && npm run typecheck && npm run build`,
y mirá la pantalla en el navegador.

## graphify

Este proyecto tiene un grafo de conocimiento en `graphify-out/` cuando está
generado.

- Para preguntas sobre el código, corré primero `graphify query "<pregunta>"`
  si existe `graphify-out/graph.json`. Usá `graphify path "<A>" "<B>"` para
  relaciones y `graphify explain "<concepto>"` para conceptos puntuales.
- Si existe `graphify-out/wiki/index.md`, usalo para navegar en vez de leer el
  código a mano.
- Leé `graphify-out/GRAPH_REPORT.md` solo para una revisión amplia de
  arquitectura.
- Después de modificar código, corré `graphify update .` para mantener el
  grafo al día.

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
