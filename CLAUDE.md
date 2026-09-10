# LinkYouth

Plataforma de primer empleo, formación y networking para jóvenes.
Next.js 15 (App Router) + TypeScript strict + Tailwind CSS 4 + Supabase.

La especificación funcional está en `docs/01_preamble.md`; las decisiones de
arquitectura, en `docs/decisiones.md`. Cada requisito tiene número (RF3.6,
RNF5…) y el código los cita en los comentarios: usá esos números al explicar
un cambio.

## Antes de escribir código

Estas dos skills tienen prioridad sobre el criterio general, porque contienen
las decisiones ya tomadas del proyecto:

- **Interfaz** (pantallas, componentes, estilos, textos):
  `.claude/skills/diseno-linkyouth/SKILL.md`.
- **Datos** (esquema, migraciones, RLS, consultas, acciones):
  `.claude/skills/datos-linkyouth/SKILL.md`.

## Mapa

```
db/                    Migraciones y seeds SQL. Ver db/README.md.
docs/                  SRS y decisiones técnicas.
src/app/(app)/         Pantallas de la aplicación (inicio, empleos, eventos,
                       postulaciones, perfil).
src/components/        ui/ primitivas · layout/ estructura · empleos/ eventos/
                       perfil/ por dominio.
src/lib/data/          Lectura: consultas.ts, ejemplos.ts, tipos.ts.
src/lib/acciones/      Escritura: acciones de servidor.
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
