# Verificación de requerimientos — rediseño «Recreo»

Lista armada **antes** de cambiar la interfaz, con cada requerimiento de
`docs/01_preamble.md`, y completada al final, uno por uno. Rama
`feat/rediseno-juvenil`, 2026-09-27.

Cómo se verificó:

- **e2e**: `npx playwright test` (31 pruebas, `e2e/auth.spec.ts` y
  `e2e/rediseno.spec.ts`).
- **recorrido**: prueba en Chromium real contra el build, con las cuentas de
  prueba y los datos de `db/seed-vacantes-eventos-prueba.sql`; lo que creó se
  borró al terminar.
- **axe**: axe-core, reglas WCAG 2.0/2.1/2.2 A y AA, 18 pantallas en claro y
  en oscuro: 0 violaciones.
- **código**: la función existe y el rediseño no la tocó más que en estilo.

«No implementado» significa que tampoco existía antes del rediseño: no se
quitó nada.

## RF1 — Usuarios y autenticación

| Requisito | Antes | Después | Cómo se verificó |
| --- | --- | --- | --- |
| RF1.1 Registrar usuario individual (con 5 intereses) | ✔ | ✔ | recorrido: registro a 390 px, llega a `/inicio` |
| RF1.1.12 / RF1.2.10 Consentimiento de privacidad | ✔ | ✔ | recorrido (casilla obligatoria) |
| RF1.2 Registrar empresa | ✔ | ✔ | e2e `/registro` abre; código sin cambios de lógica |
| RF1.3 Iniciar sesión, redirigir por tipo | ✔ | ✔ | recorrido joven → `/inicio`, empresa → `/empresa`; e2e `?next` |
| RF1.4 Cerrar sesión | ✔ | ✔ | recorrido: menú de la cuenta → «Cerrar sesión» → `/login` |
| RF1.5 Modificar usuario individual | ✔ | ✔ | recorrido: cambio de interés guardado y revertido |
| RF1.6 Modificar empresa | ✗ | ✗ | no implementado |
| RF1.7 Eliminar cuenta | ✗ | ✗ | no implementado |
| RF1.8 Recuperar contraseña | ✗ | ✗ | no implementado |

## RF2 — Perfil

| Requisito | Antes | Después | Cómo se verificó |
| --- | --- | --- | --- |
| RF2.1 Ver perfil propio | ✔ | ✔ | recorrido `/perfil`, más la guía de ficha nueva |
| RF2.2 Editar biografía | ✔ | ✔ | código (`FormularioPerfil` sin cambios de lógica) |
| RF2.3 Tags/intereses | ✔ | ✔ | recorrido: interés que se prende y se apaga |
| RF2.4 Formación y habilidades | ✔ | ✔ | código (`ListaFormacion`, `SelectorTags`) |
| RF2.5 Ver perfil de otro / empresa | parcial | parcial | `/institucion/[id]` sin cambios |

## RF3 — Empleo y postulaciones

| Requisito | Antes | Después | Cómo se verificó |
| --- | --- | --- | --- |
| RF3.1 Publicar vacante | ✗ | ✗ | pendiente anotado en `plan.md` y en el panel |
| RF3.1.6 / RNF5 Tags ocultos nunca al postulante | ✔ | ✔ | `db/verificar-raspado-anonimo.sh`: 0 de 15 filas visibles sin sesión |
| RF3.2 / RF3.3 Modificar y cerrar vacante | ✗ | ✗ | no implementado |
| RF3.4 Gestionar postulaciones recibidas | ✗ | lectura | panel: cantidad por búsqueda (recorrido: pasó de 0 a 1) |
| RF3.5 Feed de oportunidades | ✔ | ✔ | e2e y recorrido `/empleos`, filtros por tipo |
| RF3.5.3 Detalle («ver más») | ✔ | ✔ | recorrido `/empleos/[id]` |
| RF3.6 Postularse | ✔ | ✔ | recorrido: «Ya te postulaste», fila creada |
| RF3.6.2 No postularse dos veces | ✔ | ✔ | recorrido: la vacante ya postulada muestra «Ya te postulaste» |
| RF3.7 Estado de las postulaciones | ✔ | ✔ | recorrido `/postulaciones` |
| RF3.8 Cancelar postulación | ✔ | ✔ | recorrido: «Cancelada» |
| RF3.9 Compatibilidad | pública | pública | medidor «Tenés X de Y» con `Compatibilidad` |

## RF4 — Eventos

| Requisito | Antes | Después | Cómo se verificó |
| --- | --- | --- | --- |
| RF4.1–RF4.3 Crear, modificar, cancelar evento | ✗ | ✗ | no implementado (el panel lista los eventos propios) |
| RF4.4 Ver eventos | ✔ | ✔ | e2e `/eventos` sin sesión; recorrido con sesión |
| RF4.5 Inscribirse | ✔ | ✔ | recorrido: inscripción creada |
| RF4.6 Cancelar inscripción | ✔ | ✔ | recorrido: baja |

## RF5 a RF10

| Requisito | Antes | Después | Cómo se verificó |
| --- | --- | --- | --- |
| RF5 Preparación de entrevistas | ✗ | ✗ | no implementado |
| RF6.1 / RF6.2 Avisos | ✔ | ✔ | axe y captura `/avisos`; acceso desde el encabezado |
| RF6.3–RF6.5 | ✗ | ✗ | no implementado |
| RF7 Panel de empresa | cartel | lectura | recorrido `/empresa`: búsquedas, postulaciones, eventos |
| RF8 Reseñas, RF9 Chat, RF10 | ✗ | ✗ | no implementado |

## Requerimientos no funcionales

| Requisito | Cómo se cumple | Cómo se verificó |
| --- | --- | --- |
| RNF1 Rendimiento (< 2 s) | Esqueletos de carga; GSAP y Lenis solo en la portada, con `import()`; animaciones con `transform` y `opacity` | build: portada 127 kB de primera carga, el resto 121–125 kB |
| RNF2 Usabilidad y responsive | Un solo menú, pestañas en el teléfono, detalle con acción fija, guía de ficha | sin desborde a 390 px en todas las pantallas (claro y oscuro); capturas a 390 y 1440 |
| RNF3 Fiabilidad | Sin cambios en acciones ni esquema | e2e |
| RNF4 Mantenibilidad | Reglas nuevas en `src/lib/dominio/` (`CompletitudDeFicha`, `ResumenDePanel`); skill y docs actualizados | lint y typecheck |
| RNF5 Seguridad | Sin cambios de RLS; el panel cuenta postulaciones sin traer datos de quién se postuló; `next` validado | verificador de raspado, e2e de `?next` externo |
| RNF6 Privacidad | Consentimiento en el registro intacto; `/legales` enlazada desde el pie | e2e |
| RNF7 Navegadores | View Transitions y `backdrop-filter` con alternativa; GSAP en lugar de CSS ligado al scroll | código: `@supports` da fondo sólido sin `backdrop-filter`, y `EnlaceTransicion` navega normal sin `startViewTransition`. No se probó en un navegador viejo |

## Accesibilidad (pedido del rediseño)

| Criterio | Resultado |
| --- | --- |
| Contraste AA | axe: 0 violaciones en 18 pantallas × 2 temas; texto sobre fotos calculado a mano para el peor caso (≥ 5,3:1) |
| Teclado | Tab en `/empleos`: todos los elementos con anillo de foco; menús con Esc y flechas |
| Color nunca solo | ✓ y texto oculto en coincidencias, «Tenés X de Y», «No se pudo» en errores |
| WCAG 2.2.2 | Slider con pausa, anterior, siguiente y puntos; se pausa con foco o mouse |
| Movimiento reducido | Todo instantáneo; sin GSAP ni Lenis; slider pausado |
| Sin JavaScript | Portada legible entera; carruseles con scroll nativo; preguntas como `<details>` |
