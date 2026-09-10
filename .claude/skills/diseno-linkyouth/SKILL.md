---
name: diseno-linkyouth
description: "Sistema de diseño de la interfaz de LinkYouth. Usar SIEMPRE antes de crear o modificar cualquier pantalla, componente, estilo o texto de interfaz de este proyecto: define la paleta, la tipografía, la elevación, el espaciado, los patrones de tarjeta, formulario y estado vacío, las reglas de accesibilidad y el tono de la redacción en español rioplatense. Disparadores: nueva página, nuevo componente, 'que se vea más profesional', 'mejorar el diseño', ajustar colores, tipografía, espaciados, tarjetas, botones, formularios o textos de la interfaz."
---

# Diseño de LinkYouth

LinkYouth es una plataforma de primer empleo. Quien la usa está en un momento
de ansiedad: busca trabajo por primera vez. La interfaz tiene que transmitir
**calma, orden y confianza institucional**, no entusiasmo. Ese es el criterio
que resuelve la mayoría de las dudas de diseño de este proyecto.

Referencia mental: Stripe, Linear y las pantallas de un banco serio. **No**:
paneles gamer, modo oscuro con neón, degradados saturados, sombras difusas,
emojis en la interfaz, microanimaciones que llamen la atención.

## Antes de escribir una línea de estilo

1. Leé `src/app/globals.css`. Ahí están todos los tokens.
2. Mirá si el componente ya existe en `src/components/ui/`.
3. Recién entonces escribí algo nuevo.

Un color escrito a mano (`text-blue-600`, `#2563EB`, `bg-gray-100`) es un
error, salvo que sea un caso puntual documentado con un comentario que
explique por qué el token no alcanza. Las clases del proyecto salen de los
tokens: `bg-lienzo`, `bg-superficie`, `text-tinta`, `text-tinta-media`,
`text-tinta-suave`, `border-borde`, `text-primario`, `bg-primario-suave`,
`rounded-control`, `rounded-tarjeta`, `shadow-tarjeta`.

El detalle de cada token está en `references/tokens.md`.

## Las siete reglas que hacen que se vea profesional

1. **Una sola familia de superficies.** Todo bloque usa la clase `.tarjeta`:
   fondo blanco, borde de 1 px, radio `rounded-tarjeta`, `shadow-tarjeta`. Si
   una tarjeta necesita destacarse, se destaca por posición o por tamaño, no
   por una sombra más grande.

2. **El color se gana.** Gris para el 95 % de la interfaz; azul solo para la
   acción principal, el estado activo de la navegación y los datos que
   coinciden con el perfil. Verde, ámbar y rojo solo para estado real
   (aceptada, cupos por agotarse, error). Una pantalla con tres acentos
   compitiendo es una pantalla mal jerarquizada.

3. **Jerarquía por peso y tamaño, no por color.** Título en `font-bold
text-tinta`, dato secundario en `text-sm text-tinta-media`, metadato en
   `text-xs text-tinta-suave`. Nunca se pinta un texto de azul para que se lea
   más importante.

4. **Espaciado en múltiplos de 4.** Dentro de una tarjeta: `p-5` o `p-6`.
   Entre tarjetas de una lista: `space-y-4`. Entre bloques de una página:
   `space-y-5`. Entre un rótulo y su campo: `mt-1.5`.

5. **El movimiento es funcional.** `transition-colors duration-150` en lo
   interactivo; como mucho `translateY(-1px)` en una tarjeta que lleva a otro
   lado. Nada pulsa, nada rebota, nada aparece con retraso escalonado.

6. **Nunca solo color.** Todo estado se comunica además con texto o forma: el
   tag que coincide lleva un ✓, el nivel de habilidad lleva `4/5` al lado de
   la barra, la insignia de estado dice la palabra. Es accesibilidad y también
   es lo que hace que la pantalla se entienda en una captura en blanco y negro.

7. **Ningún vacío en blanco.** Toda lista que puede venir vacía usa
   `EstadoVacio` con qué pasó y qué hacer. Todo dato de demostración se
   anuncia con `AvisoOrigen`.

## Patrones ya resueltos

No los reinventes; están en `src/components/`.

| Necesidad                     | Componente                                              |
| ----------------------------- | ------------------------------------------------------- |
| Superficie de contenido       | `ui/Tarjeta`                                            |
| Tag de habilidad              | `ui/Etiqueta` (`tono="coincide"` si el perfil lo tiene) |
| Estado, modalidad, tipo       | `ui/Insignia`                                           |
| Foto o logo, con o sin imagen | `ui/Avatar`                                             |
| Acción                        | `ui/Boton` / `ui/BotonEnlace`                           |
| Lista vacía                   | `ui/EstadoVacio`                                        |
| Datos de ejemplo              | `ui/AvisoOrigen`                                        |
| Encabezado de sección         | `layout/Encabezado`                                     |
| Ícono                         | `layout/Iconos` (SVG en línea, nunca una librería)      |

Cómo componerlos y qué decisiones ya están tomadas en cada uno:
`references/componentes.md`.

## Estructura de una pantalla

```
(app)/<seccion>/page.tsx      Server Component. Lee datos, arma el layout.
  └── Encabezado              Título + bajada. Siempre primero.
  └── AvisoOrigen             Solo si el resultado no vino de Supabase.
  └── filtros / pestañas      Enlaces con URL propia, no estado del cliente.
  └── <section> con la lista  space-y-4, o EstadoVacio.
```

La columna derecha (ficha del usuario) se abre solo en el feed. En perfil y en
formularios, el contenido ocupa el ancho completo: no se repite al costado lo
que se está editando en el centro.

**Server Component por defecto.** `"use client"` solo cuando hace falta estado
o un evento del navegador: un botón que envía una acción, un campo de archivo,
una vista previa. Un filtro o una pestaña se hacen con enlaces y `searchParams`,
así el resultado queda en la URL y funciona sin JavaScript.

## Cómo se escriben los textos

Español rioplatense, voseo, segunda persona. Frases cortas. Se explica qué pasa
y qué se puede hacer.

- Bien: «Todavía no te postulaste a ninguna búsqueda.»
- Mal: «No se han encontrado postulaciones asociadas al usuario.»
- Bien: «Vas a ver el estado en «Postulaciones».»
- Mal: «¡Postulación enviada con éxito! 🎉»

Nada de signos de exclamación, nada de emojis, nada de mayúsculas para gritar.
Los botones dicen la acción en primera persona: «Postularme», «Inscribirme»,
«Guardar cambios».

## Antes de dar por terminada una pantalla

Recorré `references/revision.md`. Son doce puntos concretos: contraste, foco
de teclado, ancho de 390 px, estado vacío, estado de carga, textos, tokens.
