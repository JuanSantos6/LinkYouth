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

## 2026-09-11

- **Rediseño bajo la dirección «ficha técnica».** La interfaz pasa del kit de
  tarjetas SaaS a un vocabulario de registro sellado: paleta de cinco valores
  (`tinta`, `papel`, `acento`, `senal`, `apagado`) con todo lo demás derivado
  por `color-mix`, Bricolage Grotesque en títulos e Instrument Sans en el
  cuerpo, y radios distintos según la jerarquía.
  Motivo: el diseño anterior funcionaba pero no tenía identidad — azul por
  defecto de dashboard, mismo radio y misma sombra para todo, rótulos en
  versalitas y metadatos unidos con puntos medios.
  → [`decisiones.md`](./decisiones.md)

- **El ámbar significa una sola cosa.** Aparece en dos lugares de toda la
  aplicación: el canto de la vacante destacada y la insignia de una
  postulación aceptada.
  Motivo: en la primera versión del rediseño lo llevaba cada etiqueta que
  coincidía con el perfil, y una vacante que pide seis cosas se convertía en
  una pared ámbar. Lo que coincide ahora se distingue por peso y por la marca
  de verificación.

- **Las vacantes dejan de ser tarjetas.** Son un listado con filetes; la más
  compatible se despega con canto vertical ámbar y elevación real. Los eventos
  siguen siendo tarjetas porque tienen imagen y fecha propias.
  Motivo: la forma comunica el contenido. Todo troceado en rectángulos
  idénticos no deja distinguir una oferta de una actividad.

- **La lógica de negocio sale de los componentes.** Tres clases nuevas en
  `src/lib/dominio/`: `Compatibilidad` (qué pide la vacante contra qué declara
  el perfil), `FeedDeVacantes` (orden y destacada) y `ProcesoDePostulacion`
  (etiqueta, etapa y si se puede cancelar).
  Motivo: el cálculo de afinidad vivía dentro de `TarjetaVacante` y las reglas
  de estado dentro de la página de postulaciones, repartidas entre el
  componente y `formato.ts`. Ahí es donde una regla se desincroniza sin que
  nadie lo note.

- **Cabecera y pie en todas las pantallas**, y cinco pantallas nuevas:
  `/ajustes`, `/avisos`, `/empresas`, `/como-funciona` y `/legales`.
  Motivo: la navegación del header pedía Empresas y Cómo funciona, y la
  campana y la columna Legales del pie pedían un destino. Se escribieron como
  páginas reales en vez de dejar enlaces muertos.

- **Modo oscuro y color de plataforma, persistidos.** Cinco acentos —pino,
  marino, ciruela, ladrillo, grafito— definidos en `src/lib/diseno/tokens.ts`,
  de donde salen tanto el CSS como el selector de Ajustes. Un guion en línea
  aplica la preferencia antes del primer pintado.
  Motivo: sin ese guion la pantalla arranca en claro y salta a oscuro a la
  vista de todos.

- **Tres defectos que encontró la revisión visual y el build no.**
  1. La barra lateral ensanchaba el documento a 667 px en el teléfono: es un
     ítem de grilla y sin `min-w-0` su fila desplazable empuja la página.
  2. El anillo de foco se desvanecía en 150 ms desde el color del texto,
     porque `transition-colors` de Tailwind incluye `outline-color`.
  3. El borde de campos y botones estaba en 1.43:1 contra el papel, debajo del
     3:1 que pide WCAG 1.4.11 para identificar un control. Se agregó
     `borde-control`, derivado más fuerte que el borde decorativo de las
     tarjetas.

- **La skill `diseno-linkyouth` refleja la dirección nueva**, con la lista de
  lo prohibido y la revisión de trece puntos.

---

## 2026-09-10

- **`src/types/database.ts` queda fuera de Prettier.** Se agregó a
  `.prettierignore`.
  Motivo: lo genera `supabase gen types` sin punto y coma. Formatearlo cambia
  485 líneas y la próxima regeneración las revierte, así que el archivo
  aparecía modificado en cada `npm run format` sin que nadie lo hubiera
  tocado.

- **La capa de datos se reescribe contra `db/schema.sql`.** `src/lib/data/`
  (`tipos.ts`, `ejemplos.ts`, `consultas.ts`) y `src/lib/acciones/`
  (`perfil.ts`, `postulaciones.ts`, `eventos.ts`) vuelven a existir, ahora
  contra el esquema vigente: `inscripciones_evento`, `vacante_tags_publicos`,
  `vacante_habilidades`, `perfil_habilidades` y `bio`/`foto_url`. Los 18
  `// TODO: reconectar contra db/schema.sql` quedaron resueltos y el proyecto
  vuelve a compilar.
  Motivo: era el Hito 0.1 del plan y lo que bloqueaba todo lo demás.
  Cierra las deudas 7.1, 7.2 y 7.3 anteriores.

- **Los alias de tipo del esquema viven en `src/lib/data/tipos.ts`.** Cada
  conjunto cerrado (`TipoOportunidad`, `EstadoPostulacion`, `EstadoFormacion`,
  `EstadoVacante`, `EstadoEvento`, `TipoCuenta`) va con su función de
  estrechamiento.
  Motivo: el esquema usa `text` + `check`, así que `gen types` los devuelve
  como `string`. No pueden vivir en `src/types/database.ts` porque el próximo
  `gen types` los pisaría.
  → [`decisiones.md`](./decisiones.md)

- **`cancelarPostulacion` pasa a ser un cambio de estado.** Actualiza a
  `cancelada` en vez de borrar la fila.
  Motivo: de `postulaciones` no se borra nada, y la política
  `postulaciones_transiciones_permitidas` habilita justamente esa transición
  al postulante. Cierra la contradicción que quedó registrada como deuda 7.3.

- **La interfaz deja de mostrar lo que el esquema no guarda.** Se quitaron
  salario, modalidad, ubicación, cupos y conteo de inscriptos, nivel de
  dominio y categoría de las etiquetas, y años, acreditación y logo de las
  instituciones. También la insignia de «verificado» y su ícono, que quedó sin
  uso.
  Motivo: no inventar columnas. La lista completa quedó en `arquitectura.md`
  §7.1 para que el equipo decida cuáles vale la pena agregar al esquema; para
  una plataforma de empleo, salario y modalidad son las dos que más se van a
  extrañar.

- **El perfil muestra intereses y habilidades por separado.** `tags` y
  `habilidades` son dos catálogos distintos en el esquema, y la tarjeta de
  vacante los presenta igual: «áreas de interés» y «habilidades».
  Motivo: el comentario de `db/schema.sql` lo dice explícitamente — el
  matching de RF3.9 necesita distinguir «le interesa» de «sabe hacer».
  Mezclarlos en la interfaz habría borrado esa distinción.

- **Se resuelve el conflicto entre los dos esquemas de base.** El equipo
  decidió mantener `db/schema.sql` + `db/politicas.sql`; `db/migrations/` y
  `db/seed/` se eliminaron.
  Motivo: `schema.sql` es el esquema que está aplicado en Supabase.
  `supabase gen types` sobre la base real lo confirma — devuelve `cuentas`,
  `inscripciones_evento`, `vacante_tags_publicos` y `cuenta_activa`. El de
  `migrations/` nunca corrió contra una base real.
  Arrastró la eliminación de `src/lib/data/` y `src/lib/acciones/`, que
  consultaban tablas y columnas inexistentes en el esquema vigente, y de la
  skill `datos-linkyouth`, que lo documentaba. 18 imports quedaron marcados
  con `// TODO: reconectar contra db/schema.sql`. El proyecto no compila
  hasta que esa capa se reescriba: es un estado conocido.
  → `6b6bf86`

- **Documentación corregida tras esa decisión.** `arquitectura.md` reemplaza
  el catálogo de la capa de datos por una nota de reescritura, y documenta
  las seis funciones que sí existen en `db/schema.sql`:
  `set_actualizada_en`, `notificar_cambio_estado_postulacion`,
  `validar_tipo_cuenta`, `validar_cambio_tipo_cuenta`, `cuenta_activa` y
  `postulacion_identidad_inmutable`. El Hito 0.1 del plan pasa de resolver el
  conflicto de esquemas a reescribir la capa de datos.

- **Se resuelve la contradicción de la edad del SRS**: la plataforma admite
  solo mayores de 18 años.
  Motivo: RF1.1.8 y RNF6 se contradecían, y la diferencia define quién puede
  registrarse. Admitir menores exigiría consentimiento de un adulto
  responsable y un encuadre legal más estricto, fuera del alcance del MVP.
  La regla vive en `db/schema.sql` como la restricción
  `perfiles_mayor_de_edad`.
  → [decisiones.md](./decisiones.md)

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
