# Registro de cambios

Todo cambio que toca el código o el esquema deja una línea acá, con el motivo.
Lo más reciente arriba.

**Qué va acá y qué no.** Acá va *qué* cambió y *por qué*, en una o dos líneas.
Las decisiones que tuvieron alternativas reales y merecen quedar
argumentadas van además a [`decisiones.md`](./decisiones.md), y desde acá se
las enlaza. La arquitectura vigente está en
[`arquitectura.md`](./arquitectura.md).

Cada entrada lleva el hash del commit para poder ir al diff.

---

## 2026-09-10

- **Documentación del proyecto.** Se agregan `docs/arquitectura.md` (mapa,
  reglas estructurales y catálogo de todas las funciones), este `CHANGELOG.md`
  y `docs/plan.md` (hoja de ruta hasta el MVP).
  Motivo: el proyecto pasó de un esqueleto a 40 archivos de código sin que
  quedara escrito en ningún lado qué hace cada pieza ni por qué.

- **Se detectan dos esquemas de base incompatibles** conviviendo en `db/`:
  `schema.sql` + `politicas.sql` contra `db/migrations/`. Queda registrado en
  `arquitectura.md` §7.1 y como primera tarea del plan. No se resuelve en este
  cambio.

- `ef0db5f`, luego aplastado en `a9a32dc` — **Mayoría de edad como check
  constraint** (RF1.1.8). `perfiles_mayor_de_edad` exige 18 años cumplidos.
  Motivo: el requisito lo pide y no estaba implementado en ninguna capa.

- `24023f6` — **`graphify-out/` al `.gitignore`; diagrama del esquema
  versionado** en `docs/diagrama-esquema.png`.
  Motivo: la salida de graphify se regenera a demanda y ensuciaba cada diff;
  el diagrama sí es documentación del proyecto.

- `ff89039` — **Trigger de exclusividad perfil/empresa por cuenta.**
  Una cuenta no puede tener fila en `perfiles` y en `empresas` a la vez, ni
  una fila que no coincida con `cuentas.tipo`.
  Motivo: varias políticas de RLS asumen que `cuentas.tipo` es correcto; si se
  desincroniza, deja de ser un dato prolijo y pasa a ser un problema de
  control de acceso.
  → [decisiones.md](./decisiones.md)

- `07fd36b` — **Endurecimiento del esquema y las políticas RLS.** Cinco
  cambios en un commit:
  - `set search_path = public, pg_temp` en todas las funciones.
    Motivo: una función `security definer` sin `search_path` fijo es
    explotable; el linter de Supabase lo marca `function_search_path_mutable`.
  - Los triggers de validación de tipo corren también en `update`, y
    `cuentas.tipo` queda bloqueado si la cuenta ya tiene fila de detalle.
    Motivo: los triggers eran solo `before insert` y el tipo se podía cambiar
    después.
  - Trigger que impide cambiar `perfil_id` o `vacante_id` de una postulación.
    Motivo: la empresa dueña de la vacante podía reasignar la postulación a
    otro perfil y dispararle una notificación que esa persona nunca pidió.
    No se puede resolver en RLS: una política no ve la fila vieja, y una que
    consulte su propia tabla falla con `infinite recursion detected in policy`.
  - La notificación de cambio de estado ya no se dispara cuando el propio
    postulante cancela. Motivo: le avisaba de su propia acción.
  - `cuentas.eliminada` pasa a tener efecto: `perfiles` y `empresas` se leen a
    través de `cuenta_activa()`. Motivo: el campo existía y ninguna política
    lo consultaba, así que la baja lógica no ocultaba nada.
  - 17 índices sobre claves foráneas y el lado inverso de las tablas puente.
    Motivo: Postgres no indexa las FK por su cuenta y las políticas de RLS
    corren un `exists()` por fila evaluada.
  → [decisiones.md](./decisiones.md)

- `a9f15a9` — **Se califica `empresa_id` en la política de reseñas.**
  `v.empresa_id = empresa_id` resolvía contra `vacantes v` y no contra la fila
  de `resenias`, así que la condición era `v.empresa_id = v.empresa_id`.
  Motivo: cualquiera con una postulación a *cualquier* empresa podía reseñar a
  *cualquier* otra.

- `9b81c4a` — **Esquema de base de datos y políticas RLS** (RF1–RF4, RF6–RF8).
  Primera versión de `db/schema.sql` y `db/politicas.sql`.

## 2026-09-09

- **Decisiones de modelado registradas**: tags y habilidades como catálogos
  separados, y reseñas habilitadas por postulación en cualquier estado.
  → [decisiones.md](./decisiones.md)

## 2026-09-08

- `8ff166a` — **Esqueleto inicial**: Next.js 15 con App Router, TypeScript en
  modo strict, Tailwind CSS, clientes de Supabase con `@supabase/ssr`,
  middleware de refresco de sesión y pantalla de verificación de conexión.
  → [decisiones.md](./decisiones.md)

- `96df4bd` — SRS del proyecto y configuración inicial de Claude Code.
