---
name: delegar-a-gemini
description: Delegar a Antigravity CLI (comando agy) una tarea larga y de bajo riesgo de LinkYouth —pantallas, componentes, textos, estilos, tests, documentación, refactors mecánicos— para ahorrar tokens. Claude Code decide y revisa; agy ejecuta en un worktree aparte. Nunca para base de datos, RLS, autenticación, seguridad ni migraciones.
---

# Delegar a Antigravity (agy)

Claude Code decide, redacta la tarea y revisa. Antigravity escribe el código en
un worktree propio, en una rama `gemini/<tarea>`. Nada llega a `main` sin pull
request y sin revisión humana.

## Cuándo usarla

**Sí:** tareas largas y de bajo riesgo: pantallas y componentes, textos de
interfaz, estilos, tests, documentación, refactors mecánicos.

**Nunca:** base de datos (`db/`), migraciones, políticas RLS, autenticación,
`src/middleware.ts`, `src/lib/seguridad/`, ni nada de seguridad. Eso lo hace
Claude Code directamente.

Si la tarea es corta (menos de un par de archivos), hacela vos: el armado del
worktree y la revisión cuestan más que lo que se ahorra.

## Cómo funciona agy (verificado con `agy --help`, versión 1.4.3)

- `agy -p "<prompt>"`: modo no interactivo; imprime la respuesta y sale.
- `--print-timeout <duración>`: tiempo máximo del modo `-p` (por ejemplo, `20m`).
- `--mode accept-edits`: aprueba solo las ediciones de archivos. **Usá este.**
- `--sandbox`: restricciones de terminal. **Usalo siempre.**
- `--dangerously-skip-permissions` existe, pero el clasificador de permisos de
  Claude Code lo bloquea. No lo uses.
- agy lee `AGENTS.md` y `GEMINI.md` de la raíz del workspace. En este repo
  `GEMINI.md` es un enlace simbólico a `AGENTS.md`, y agy lo carga una sola vez.

## Procedimiento

Variables: `T=<tarea>` (kebab-case, corto), `W=../ly-gemini-$T`,
`L=../ly-gemini-logs/$T` (la tarea y los logs viven **fuera** del worktree, así
no terminan en el commit).

### 1. Worktree

```bash
git fetch origin
git worktree add ../ly-gemini-$T -b gemini/$T --no-track origin/main
cd ../ly-gemini-$T
ln -s ../LinkYouth/node_modules node_modules   # lint, typecheck y build andan así
test -f AGENTS.md || { cp ../LinkYouth/AGENTS.md .; ln -s AGENTS.md GEMINI.md; }
```

`--no-track` es obligatorio: sin él la rama sigue a `origin/main`. Si
`AGENTS.md` todavía no está en `main`, copialo pero **no** lo incluyas en el
commit. No copies `.env.local`: el build no lo necesita.

### 2. Redactar `$L/tarea.md`

```markdown
# Tarea: <título>

Rama: gemini/<tarea> (ya estás en ella; no cambies de rama).

## Objetivo

<qué y por qué, citando RF/RNF si aplica. "Si algo ya está bien, dejalo.">

## Archivos involucrados

- <rutas exactas>
- docs/CHANGELOG.md (una línea con qué cambió y por qué)

## Criterios de aceptación

- <verificables, uno por línea>
- No hace falta que corras lint ni typecheck: los corre quien revisa.

## Qué NO tocar

- Cualquier archivo fuera de los de arriba.
- db/, migraciones, RLS, src/middleware.ts, src/lib/seguridad/, .env*,
  AGENTS.md, GEMINI.md, CLAUDE.md, .claude/.
- No hagas commit, push ni merge.

Terminá con el resumen que pide AGENTS.md.
```

Con `--sandbox` y `accept-edits` agy no puede correr `npm`; por eso la
verificación la hacés vos.

### 3. Ejecutar

Desde el worktree, en segundo plano si va a tardar más de un par de minutos:

```bash
s=$(date +%s)
timeout 1500 agy -p "$(cat $L/tarea.md)" --mode accept-edits --sandbox \
  --print-timeout 20m > $L/agy.log 2>&1
echo "exit=$? segundos=$(( $(date +%s)-s ))"
```

**Cuota agotada:** si el log menciona `quota`, `RESOURCE_EXHAUSTED`, `429` o
`rate limit`, avisale al usuario y hacé la tarea vos en el mismo worktree.

### 4. Revisar

```bash
git branch --show-current          # tiene que ser gemini/$T
git log --oneline origin/main..HEAD # tiene que estar vacío: agy no commitea
git status --short
git diff                            # leelo completo, línea por línea
git status --porcelain | grep -E ' (db/|src/middleware\.ts|src/lib/seguridad/|\.env|AGENTS\.md|GEMINI\.md|CLAUDE\.md|\.claude/)' \
  && echo "TOCÓ ARCHIVOS PROHIBIDOS"
npm run lint && npm run typecheck && npm run build
```

Ignorá `AGENTS.md` y `GEMINI.md` como sin seguimiento si los copiaste en el
paso 1. Revisá el diff contra `CLAUDE.md` y la skill `diseno-linkyouth`: la
lógica de negocio no va en un `.tsx`, Server Component por defecto, los tags
ocultos nunca llegan al postulante, español rioplatense.

Si tocó un archivo prohibido: `git checkout -- <archivo>` y anotalo en el
informe.

### 5. Una sola corrección

Si algo falla, devolvéselo **una vez** con un prompt nuevo, en el mismo worktree:
la tarea original más una sección `## Corrección` con el error exacto (salida
de lint/typecheck/build o el problema del diff). Guardá la salida en
`$L/agy-correccion.log`. Si vuelve a fallar, terminalo vos.

### 6. Cerrar

```bash
git add <solo los archivos de la tarea>   # nunca `git add -A`
git commit -m "<tipo>: <qué> (delegado a Antigravity)"
git push -u origin gemini/$T
gh pr create --base main --head gemini/$T --title "..." --body "..."
```

La descripción del PR dice explícitamente: **"El código lo escribió Antigravity
(agy) y lo revisó Claude Code"**, con qué se verificó (lint, typecheck, build,
archivos prohibidos) y qué corrigió Claude Code, si corrigió algo.

**Nunca hagas merge a `main`.** Lo hace una persona.

Si no hubo cambios, no hay commit ni PR: borrá el worktree y la rama.

```bash
cd ../LinkYouth
git worktree remove ../ly-gemini-$T   # --force si quedaron AGENTS.md o GEMINI.md copiados
git branch -D gemini/$T                # solo si no se pusheó
```

### 7. Informe al usuario

Tiempo de agy, si respetó las reglas (rama, archivos prohibidos, sin commits),
si el diff era correcto, qué corregiste vos y el enlace al PR.
