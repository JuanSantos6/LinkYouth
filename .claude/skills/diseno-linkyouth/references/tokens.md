# Tokens

La fuente de verdad es `src/lib/diseno/tokens.ts`. De ahí salen las variables
CSS que emite `src/app/layout.tsx` y las opciones del selector de Ajustes.
`src/app/globals.css` deriva el resto.

## Por qué el doble nombre

Los valores viven en `:root` con prefijo `--ly-`, y `@theme inline` los expone
como utilidades de Tailwind (`--color-*`). El rodeo tiene motivo: Tailwind 4
solo emite las variables de `@theme` que alguna utilidad usa, así que un
`var(--color-acento)` escrito a mano en CSS —el anillo de foco, por ejemplo—
se quedaba sin valor y caía en `currentColor`.

**Regla:** en una clase de Tailwind usá `text-tinta`, `bg-papel`. En CSS a
mano usá `var(--ly-tinta)`, `var(--ly-papel)`.

## Los cinco valores

| Token     | Claro          | Oscuro           | Rol                    |
| --------- | -------------- | ---------------- | ---------------------- |
| `tinta`   | `#14231D`      | `#E7ECE6`        | Texto y fondos oscuros |
| `papel`   | `#EDF0EB`      | `#101A16`        | Fondo de página        |
| `apagado` | `#5C6B63`      | `#93A39A`        | Texto secundario       |
| `acento`  | según elección | versión luminosa | Acciones primarias     |
| `senal`   | `#FFB627`      | `#FFB627`        | **Solo lo acreditado** |

El ámbar no cambia nunca: ni con el tema ni con el acento. Es lo que lo
mantiene siendo una señal.

## Los cinco acentos

`pino` (por defecto), `marino`, `ciruela`, `ladrillo`, `grafito`. Cada uno
tiene dos valores: el de tema claro, que lleva texto claro encima, y el de
tema oscuro, que es el mismo tono más luminoso porque sobre fondo oscuro el
primero no llega al contraste mínimo.

Para agregar un color, se toca solo `ACENTOS` en `tokens.ts`:
`reglasDeAcento()` genera el CSS y el selector se actualiza solo.

## Derivados

Ninguno es un color nuevo; todos son `color-mix` de los de arriba.

| Token                          | Para qué                                                                                                        |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `superficie`                   | Fondo de una tarjeta                                                                                            |
| `realce`                       | Bloque dentro de una tarjeta, pie del sitio, campo deshabilitado                                                |
| `borde`                        | Borde de tarjeta. Decorativo                                                                                    |
| `borde-control`                | Borde de campo o botón. Llega a 3:1 contra el papel, que es lo que WCAG 1.4.11 pide para identificar un control |
| `filete`                       | Separador entre filas de un listado                                                                             |
| `sobre-acento`                 | Texto encima del acento                                                                                         |
| `acento-tenue` · `senal-tenue` | Fondos suaves de insignia                                                                                       |

## Tipografía

| Fuente              | Uso                                                                                     |
| ------------------- | --------------------------------------------------------------------------------------- |
| Bricolage Grotesque | Títulos y cifras. Eje óptico variable, `font-optical-sizing: auto`, tracking `-0.035em` |
| Instrument Sans     | Cuerpo, 15 px, interlínea 1.55                                                          |

La clase `.cifra` trata un número como elemento gráfico: tipografía de título,
tracking `-0.05em` y `tabular-nums`.

No hay familia monoespaciada cargada: para las tres rutas de archivo que la
necesitan alcanza la del sistema.

## Radios y elevación

| Token                     | Uso                                                    |
| ------------------------- | ------------------------------------------------------ |
| `rounded-control` (3 px)  | Botones, campos, etiquetas                             |
| `rounded-ficha` (4 px)    | Filas destacadas, bloques, avatares cuadrados          |
| `rounded-tarjeta` (10 px) | Solo la tarjeta de evento, que lleva imagen            |
| `shadow-elevada`          | La única sombra. Para lo que está realmente por encima |

## Tema y persistencia

`PreferenciasDeApariencia` (`src/lib/diseno/PreferenciasDeApariencia.ts`) lee
y escribe `data-tema` y `data-acento` en el elemento raíz, y los guarda en
`localStorage`. Un guion en línea en `layout.tsx` los aplica **antes del
primer pintado**: sin eso la pantalla arrancaría en claro y saltaría a oscuro
a la vista de todos.

Nada de esto lanza si el almacenamiento está bloqueado: la elección vale para
la sesión en curso y no persiste.
