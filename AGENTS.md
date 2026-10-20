# Instrucciones para agentes externos (Antigravity / Gemini)

Este archivo lo leen los agentes que trabajan en LinkYouth por delegación de
Claude Code. Claude Code decide y revisa; vos ejecutás la tarea que te pasaron
en `tarea.md`.

## Reglas del proyecto

- Seguí **todas** las reglas de `CLAUDE.md` (raíz del repo). Leelo antes de
  empezar.
- Para cualquier pantalla, componente, estilo o texto de interfaz, seguí
  `.claude/skills/diseno-linkyouth/SKILL.md`. Tiene prioridad sobre tu criterio
  general.
- Español rioplatense en la interfaz, en los comentarios y en los nombres.

## Rama

- Trabajá **solo** en la rama que te indicaron en la tarea (`gemini/<tarea>`).
  No cambies de rama, no crees ramas nuevas, no hagas `git checkout` de otra.
- **Nunca** hagas `git push`, `git merge`, `git rebase` ni abras pull requests.
  Tampoco hagas commits: Claude Code revisa y commitea.

## Archivos prohibidos

Nunca crees, modifiques ni borres nada en:

- `db/` (esquema, políticas RLS, migraciones, semillas)
- cualquier migración o política de Row Level Security, esté donde esté
- `src/middleware.ts`
- `src/lib/seguridad/`
- `.env*`, `AGENTS.md`, `GEMINI.md`, `CLAUDE.md`, `.claude/`

Si la tarea parece requerir tocar alguno de estos, **frená** y explicalo en el
resumen final en lugar de hacerlo.

## Al terminar

Terminá siempre escribiendo un resumen de lo hecho:

1. Archivos modificados y qué cambió en cada uno.
2. Comandos que corriste y su resultado (`npm run lint`, `npm run typecheck`).
3. Lo que no pudiste hacer o dejaste dudoso, y por qué.
