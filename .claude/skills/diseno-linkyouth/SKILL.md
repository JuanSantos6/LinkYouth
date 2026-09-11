---
name: diseno-linkyouth
description: "Sistema de diseño de la interfaz de LinkYouth, bajo la dirección «ficha técnica». Usar SIEMPRE antes de crear o modificar cualquier pantalla, componente, estilo o texto de interfaz de este proyecto: define la paleta de cinco valores, la tipografía, la elevación, el espaciado, los patrones de listado y tarjeta, la lista de lo prohibido, las reglas de accesibilidad y el tono de la redacción en español rioplatense. Disparadores: nueva página, nuevo componente, 'que se vea más profesional', 'mejorar el diseño', modo oscuro, color de acento, ajustar colores, tipografía, espaciados, listados, tarjetas, botones, formularios o textos de la interfaz."
---

# Diseño de LinkYouth

LinkYouth acredita habilidades en vez de leer un currículum. El vocabulario
visual tiene que ser el del **registro sellado**: una ficha que se acredita,
no un feed que se scrollea.

Quien usa la plataforma está buscando su primer trabajo. La interfaz transmite
orden y confianza institucional, no entusiasmo.

## Antes de escribir una línea de estilo

1. Leé `src/lib/diseno/tokens.ts`. Es la fuente de verdad del color.
2. Leé `src/app/globals.css`, que deriva de esos tokens todo lo demás.
3. Mirá si el componente ya existe en `src/components/ui/`.

Un color escrito a mano (`text-blue-600`, `#2563EB`, `bg-gray-100`) es un
error. Las utilidades salen de los tokens: `bg-papel`, `bg-superficie`,
`bg-realce`, `text-tinta`, `text-apagado`, `text-acento`, `border-borde`,
`border-borde-control`, `border-filete`, `bg-senal-tenue`.

## La paleta: cinco valores

| Token     | Rol                                                                |
| --------- | ------------------------------------------------------------------ |
| `tinta`   | Texto y fondos oscuros                                             |
| `papel`   | Fondo de página                                                    |
| `acento`  | Acciones primarias. Lo elige quien usa la app, entre cinco colores |
| `senal`   | **Ámbar. Solo lo acreditado**                                      |
| `apagado` | Texto secundario                                                   |

Todo lo demás —`superficie`, `realce`, `borde`, `filete`, `sobre-acento`,
los tenues— se **deriva** de esos cinco con `color-mix`. No inventes un gris
nuevo: si te falta un valor, es casi siempre una mezcla de los que ya hay.

**El ámbar es la única audacia del diseño.** Cada vez que aparece significa
«esto está validado». Hoy aparece en dos lugares de toda la aplicación: el
canto vertical de la vacante destacada y la insignia de una postulación
aceptada. No lo uses para nada más —ni en el logo, ni en un ícono, ni para
«dar color»—: si decora, deja de significar.

En tema oscuro los tokens no cambian de nombre, cambian de valor: `tinta`
sigue siendo el color del texto y `papel` el del fondo.

## Prohibido

Son los tics que delatan una plantilla. Si aparece alguno, la pantalla no está
terminada:

- **Rótulos en VERSALITAS espaciadas** encima de los títulos. No agregan
  información: el título ya dice dónde estás.
- **Monoespaciada como decoración.** Solo se usa para código, rutas de archivo
  y versiones reales, que se copian y se pegan.
- **Acentuar una sola palabra del titular** en otro color o en itálica.
- **Marcadores numerados 01 / 02 / 03**, salvo que el contenido sea de verdad
  una secuencia.
- **Flechas → pegadas** al texto de botones y enlaces.
- **La misma sombra gris debajo de todo.** Hay una sola sombra,
  `shadow-elevada`, y se reserva para lo que está realmente por encima del
  plano.
- **Cadenas de metadatos unidas con puntos medios.** Separá con espacio.
- **El mismo radio de esquina en todo.** El radio dice la jerarquía:
  `rounded-control` (3 px) para controles, `rounded-ficha` (4 px) para filas y
  bloques, `rounded-tarjeta` (10 px) solo para la tarjeta de evento, que lleva
  imagen.

## La forma comunica el contenido

- **Las vacantes son un listado con filetes, no tarjetas.** La más compatible
  se despega: canto vertical ámbar y elevación real. Una sola, o ninguna
  destaca.
- **Los eventos sí son tarjetas**, porque tienen imagen y fecha propias. Esa
  diferencia de forma es intencional: hay que distinguir de un vistazo una
  oferta de una actividad.
- **El menú lateral marca la sección activa con un filete vertical**, no con
  una píldora rellena.
- **Los números grandes** —compatibilidad, día del evento— son elemento
  gráfico: clase `.cifra`, tipografía de título, tracking cerrado.

## Tipografía

Bricolage Grotesque en títulos (eje óptico activo, tracking cerrado) e
Instrument Sans en el cuerpo. Se cargan con `next/font` en
`src/app/layout.tsx`: nunca agregues un `<link>` a Google Fonts.

## Movimiento

Solo el que responde a una acción de la persona: abrir, confirmar, expandir,
cambiar de tema. **Nada de entradas con fade-and-slide ni de transiciones de
hover en cada tarjeta.** `prefers-reduced-motion` apaga todo, y el anillo de
foco nunca se desvanece: aparece instantáneo.

## Accesibilidad

- **Nunca solo color.** Lo que coincide lleva una marca de verificación; los
  errores se distinguen por peso, por un filete y por la palabra «No se
  pudo». La paleta no tiene rojo a propósito.
- **3:1 en el borde de un control.** Los campos y los botones usan
  `border-borde-control`, más fuerte que el `border-borde` de las tarjetas,
  que es decorativo.
- **Foco visible siempre**, con el color del acento.
- **390 px sin desborde horizontal.** Cuidado con los ítems de grilla: sin
  `min-w-0`, un hijo con `overflow-x-auto` ensancha la página entera.

## Patrones ya resueltos

| Necesidad               | Componente                                            |
| ----------------------- | ----------------------------------------------------- |
| Superficie con borde    | `ui/Tarjeta` (`elevada` solo para lo destacado)       |
| Tag o habilidad         | `ui/Etiqueta` (`coincide` si el perfil ya lo declara) |
| Estado                  | `ui/Insignia`                                         |
| Foto o logo             | `ui/Avatar`                                           |
| Acción                  | `ui/Boton` · `ui/BotonEnlace`                         |
| Resultado de una acción | `ui/MensajeDeAccion`                                  |
| Lista vacía             | `ui/EstadoVacio`                                      |
| Datos de ejemplo        | `ui/AvisoOrigen`                                      |
| Encabezado de pantalla  | `layout/Encabezado`                                   |
| Cabecera y pie          | `layout/CabeceraGlobal` · `layout/PieDeSitio`         |
| Ícono                   | `layout/Iconos` (SVG en línea, nunca una librería)    |

Detalle en `references/tokens.md` y `references/componentes.md`.

## La lógica no vive en el componente

Un componente recibe datos y los muestra. El cálculo de compatibilidad, el
orden del feed y las reglas de estado viven en `src/lib/dominio/`:
`Compatibilidad`, `FeedDeVacantes`, `ProcesoDePostulacion`. Si estás por
escribir un `if` sobre una regla de negocio dentro de un `.tsx`, va en una
clase.

**Server Component por defecto.** `"use client"` solo con estado o eventos del
navegador. Los filtros y las pestañas se hacen con enlaces y `searchParams`.

## Cómo se escriben los textos

Español rioplatense, voseo, frase normal (no Title Case). El botón dice qué
pasa al tocarlo y el aviso posterior usa la misma palabra: «Postularme» →
«Postulación enviada».

- Bien: «Todavía no te postulaste a ninguna búsqueda.»
- Mal: «No se han encontrado postulaciones asociadas al usuario.»

Los estados vacíos invitan a hacer algo. Los errores explican qué pasó y cómo
seguir, sin pedir disculpas. Nada de signos de exclamación ni emojis.

## Antes de dar por terminada una pantalla

Recorré `references/revision.md`.
