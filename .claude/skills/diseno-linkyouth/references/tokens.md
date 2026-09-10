# Tokens

Todos viven en `@theme` dentro de `src/app/globals.css`. Tailwind genera las
utilidades a partir de ahí, así que el token y la clase siempre coinciden.

## Superficies

| Token              | Valor     | Cuándo                                                                                             |
| ------------------ | --------- | -------------------------------------------------------------------------------------------------- |
| `lienzo`           | `#f6f7f9` | Fondo de la página. Nunca blanco puro: hace que las tarjetas se despeguen sin necesidad de sombra. |
| `superficie`       | `#ffffff` | Toda tarjeta, campo de formulario, menú.                                                           |
| `superficie-suave` | `#f9fafb` | Fondo de un bloque dentro de una tarjeta (una fila de habilidad, un tag neutro).                   |
| `borde`            | `#e5e7eb` | Borde por defecto y separadores.                                                                   |
| `borde-fuerte`     | `#d1d5db` | Borde en hover, o barra apagada de un medidor.                                                     |

## Texto

Cuatro pesos de gris, y no más. Si hace falta un quinto, el problema es la
jerarquía, no la paleta.

| Token         | Valor     | Cuándo                                 |
| ------------- | --------- | -------------------------------------- |
| `tinta`       | `#101828` | Títulos y datos principales.           |
| `tinta-media` | `#475467` | Texto corrido, descripciones.          |
| `tinta-suave` | `#667085` | Metadatos: fecha, ubicación, cantidad. |
| `tinta-tenue` | `#98a2b3` | Íconos apagados, placeholders.         |

## Acción

| Token             | Valor     | Cuándo                                                         |
| ----------------- | --------- | -------------------------------------------------------------- |
| `primario`        | `#1d4ed8` | Botón principal, ícono activo, enlace.                         |
| `primario-fuerte` | `#1e40af` | Hover del botón principal y texto sobre fondo suave.           |
| `primario-suave`  | `#eff4ff` | Fondo del ítem activo de la navegación y del tag que coincide. |
| `primario-borde`  | `#c7d7fe` | Borde de esos mismos elementos.                                |

## Estado

Cada uno viene en trío `color / -suave / -borde`, pensados para una insignia:
texto en el fuerte, fondo en el suave, borde en el intermedio. Ese trío ya está
contrastado sobre blanco.

| Familia  | Cuándo                                                             |
| -------- | ------------------------------------------------------------------ |
| `exito`  | Postulación aceptada, institución acreditada, alta compatibilidad. |
| `aviso`  | Cupos por agotarse, contenido de demostración, algo pendiente.     |
| `alerta` | Error de formulario, postulación no seleccionada.                  |

## Tipografía

Plus Jakarta Sans para todo, JetBrains Mono solo para números que se comparan
en columna (`4/5`, un puntaje). Se cargan con `next/font` en
`src/app/layout.tsx`: nunca agregues una etiqueta `<link>` a Google Fonts.

Escala en uso, y alcanza:

| Clase                 | Uso                                                           |
| --------------------- | ------------------------------------------------------------- |
| `text-xl font-bold`   | Título de página.                                             |
| `text-base font-bold` | Título de tarjeta o de sección.                               |
| `text-sm`             | Texto corrido y campos.                                       |
| `text-xs`             | Metadatos, insignias, rótulos.                                |
| `text-[11px]`         | Rótulo en versalitas de un grupo (`uppercase tracking-wide`). |

El `letter-spacing` negativo ya está aplicado en `globals.css` para `body` y
para los títulos. No lo repitas por componente.

## Radios y elevación

| Token                     | Uso                                                                 |
| ------------------------- | ------------------------------------------------------------------- |
| `rounded-control` (8 px)  | Botones, campos, tags, ítems de navegación.                         |
| `rounded-tarjeta` (14 px) | Tarjetas y contenedores.                                            |
| `shadow-tarjeta`          | Reposo de toda tarjeta.                                             |
| `shadow-elevada`          | Hover de una tarjeta interactiva, o algo que flota sobre otra cosa. |
| `shadow-flotante`         | Reservada para menús y diálogos. Hoy no se usa.                     |

Nada de `rounded-full` salvo en avatares de persona y en insignias.

## Lo que no existe a propósito

- **Modo oscuro.** No está implementado. Si se agrega, se agrega redefiniendo
  estos tokens en un solo lugar, no salpicando `dark:` por los componentes.
- **Paleta de grises de Tailwind.** `bg-gray-50`, `text-slate-600` y compañía
  no se usan: rompen la coherencia con los tokens.
- **Sombras de color.** Un `box-shadow` azul o verde es la marca más rápida de
  una interfaz que no se tomó en serio.
