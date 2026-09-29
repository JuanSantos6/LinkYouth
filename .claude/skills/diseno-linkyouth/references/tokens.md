# Tokens

La fuente de verdad del color es `src/lib/diseno/tokens.ts` (con el contraste
de cada par) y `src/app/globals.css` (las variables `--ly-*`). Tienen que
decir lo mismo.

## Por qué el doble nombre

Los valores viven en `:root` como `--ly-*` y `@theme inline` los expone como
utilidades de Tailwind (`bg-papel`, `text-acento`…). Tailwind 4 solo emite
las variables de `@theme` que alguna utilidad usa; declaradas en `:root`
existen siempre, también para el CSS escrito a mano.

**Regla:** en una clase de Tailwind, `text-tinta`. En CSS a mano,
`var(--ly-tinta)`.

## Contrastes medidos (WCAG 2.1)

| Par | Claro | Oscuro |
| --- | --- | --- |
| tinta / papel | 15,5:1 | 16,2:1 |
| apagado / papel | 6,4:1 | 8,6:1 |
| acento (violeta texto) / blanco | 6,2:1 | 7,9:1 sobre papel |
| tinta sobre mandarina | 5,0:1 | 7,8:1 |
| tinta sobre turquesa | 9,8:1 | 10,6:1 |
| tinta sobre coincide-fondo | 14,1:1 | — |
| turquesa-texto / blanco | 5,2:1 | — |
| alerta / blanco | 6,6:1 | 6,6:1 |
| borde-control / papel | 3,3:1 | 4,6:1 |
| violeta (forma) / blanco | 3,9:1 | — |

Vidrio (86 %): con contenido negro detrás, tinta 12:1 y apagado 5:1; en
oscuro, con blanco detrás, 10,8:1 y 5,7:1.

## Derivados

`realce`, `borde` y `filete` son neutros fijos por tema (no `color-mix`), para
que el contraste medido no dependa del navegador.

## Tipografía

| Fuente | Uso |
| --- | --- |
| Red Hat Display | Títulos y cifras, 500–800, tracking `-0.02em` |
| Red Hat Text | Cuerpo, 15 px, interlínea 1,55 |

`.cifra` trata un número como elemento gráfico: Display 800, tracking
`-0.04em`, `tabular-nums`.

## Radios y sombras

| Token | Uso |
| --- | --- |
| `rounded-control` (10 px) | Botones, campos |
| `rounded-ficha` (12 px) | Bloques, avatares cuadrados, fecha de evento |
| `rounded-tarjeta` (16 px) | Tarjetas |
| `rounded-full` | Etiquetas, filtros, cápsulas, pestañas |
| `shadow-elevada` | Tarjeta clickeable al pasar el mouse |
| `shadow-flotante` | Menús, cápsula de vidrio |

## Tiempos

`--ly-entrar`: 200 ms `cubic-bezier(.2,.7,.2,1)`. `--ly-salir`: 150 ms
`cubic-bezier(.4,0,1,1)`. Todo lo que se abre y se cierra los usa.

## Tema y persistencia

`PreferenciasDeApariencia` lee y escribe `data-tema` en `<html>` y lo guarda
en `localStorage` (`linkyouth.tema`). «Sistema» no guarda nada. El guion en
línea de `layout.tsx` lo aplica antes del primer pintado. Nada de esto lanza
si el almacenamiento está bloqueado.
