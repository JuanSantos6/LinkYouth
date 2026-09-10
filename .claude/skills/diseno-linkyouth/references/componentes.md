# Componentes

Qué resuelve cada uno y qué decisión ya está tomada adentro, para no volver a
discutirla en cada pantalla.

## `ui/Tarjeta`

Superficie base. Acepta `como` (por defecto `div`; usá `article` para una
tarjeta de contenido y `section` para un bloque con título) e `interactiva`,
que suma la reacción al puntero.

```tsx
<Tarjeta como="article" interactiva className="p-5">
  …
</Tarjeta>
```

`interactiva` solo si la tarjeta entera lleva a algún lado. Una tarjeta que
solo contiene un botón no es interactiva: el que reacciona es el botón.

## `ui/Etiqueta`

Tag de habilidad. `tono="coincide"` cuando el postulante ya tiene ese tag:
agrega fondo azul suave y un ✓ con texto para lector de pantalla.

Es el átomo más repetido de la aplicación, porque el producto no usa
currículum: los tags **son** el perfil. Que se lean rápido en una lista larga
importa más que cualquier otro detalle visual.

## `ui/Insignia`

Estado en una palabra. Tonos: `neutro`, `primario`, `exito`, `aviso`,
`alerta`. Siempre lleva texto; el color acompaña, no reemplaza.

## `ui/Avatar`

Foto de persona (`forma="redondo"`) o logo de empresa o institución
(`forma="cuadrado"`). Sin imagen muestra las iniciales, con el mismo tamaño:
la grilla nunca cambia de alto según haya foto o no. Tamaños `sm`, `md`, `lg`.

Usa `<img>` a propósito, no `next/image`: las imágenes vienen de Supabase
Storage con dominios variables. El `eslint-disable` puntual está documentado
en el archivo.

## `ui/Boton` y `ui/BotonEnlace`

Variantes: `primario` (una sola por pantalla, la acción que importa),
`secundario` (acción alternativa), `fantasma` (acción terciaria). `BotonEnlace`
es lo mismo pero navega: si la acción cambia de página, va enlace, no botón
con `onClick`.

## `ui/EstadoVacio`

Título, explicación y una acción opcional. Toda lista que puede venir vacía lo
usa. Un espacio en blanco deja a la persona sin saber si falló algo o si
todavía no hay nada.

## `ui/AvisoOrigen`

Recibe un `Resultado` y se muestra solo si `origen === "ejemplo"`. Deja claro
que lo que se ve es demostración y por qué (faltan credenciales, la tabla está
vacía, la consulta falló). **Nunca lo saques para que la pantalla quede más
limpia**: mostrar datos inventados sin decirlo es engañar a quien mira.

## `layout/BarraLateral`

Navegación principal. Es `"use client"` únicamente por `usePathname`, que
marca la sección activa. En escritorio es columna fija; abajo de `lg` pasa a
una fila que se desplaza en horizontal. Con cinco secciones, un menú
desplegable cuesta más de lo que ahorra.

## `layout/Iconos`

SVG en línea sobre grilla de 24, trazo 1.75, puntas redondeadas. Un ícono
nuevo copia esa base o va a desentonar. No agregues una librería de íconos por
cinco trazos.

## Formularios

Patrón en `perfil/FormularioPerfil`:

- Rótulo visible siempre (nunca solo `placeholder`).
- Ayuda debajo del campo, en `text-xs text-tinta-suave`.
- El botón de envío se deshabilita mientras corre y cambia el texto
  («Guardando…»).
- El resultado se anuncia en un `<p aria-live="polite">` al lado del botón.
- La validación corre también en el servidor, en la acción. El `maxLength` del
  campo es comodidad, no control.

## Acciones de servidor

Toda acción devuelve `EstadoAccion` (`src/lib/acciones/tipos.ts`) y el
componente la consume con `useActionState`. El mensaje de error se muestra tal
cual al lado del control que lo provocó; nunca en un cartel global lejos de la
causa.
