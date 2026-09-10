# Revisión antes de dar por terminada una pantalla

Doce puntos. Si alguno falla, la pantalla no está lista.

## Coherencia

1. Ningún color, radio ni sombra escrito a mano: todo sale de los tokens.
2. Ningún componente nuevo que duplique algo de `src/components/ui/`.
3. Espaciados en múltiplos de 4. Listas con `space-y-4`, bloques con `space-y-5`.

## Jerarquía

4. Un solo botón `primario` por pantalla.
5. El título de la página es el único `text-xl`; los de tarjeta, `text-base`.
6. Ningún texto pintado de azul para parecer importante.

## Estados

7. La lista vacía muestra `EstadoVacio`.
8. Los datos de demostración muestran `AvisoOrigen`.
9. Los botones que envían algo se deshabilitan mientras corre y avisan el
   resultado en un `aria-live`.

## Accesibilidad

10. Todo estado se lee sin color: hay texto, ícono o forma que lo acompaña.
    Comprobalo mirando la pantalla en escala de grises.
11. Recorré la pantalla con Tab: el foco se ve siempre (el anillo está en
    `globals.css`) y el orden sigue la lectura. Los íconos decorativos llevan
    `aria-hidden`; los que informan, un `<span class="sr-only">`.

## Responsive

12. A 390 px de ancho no hay desborde horizontal, la navegación se puede usar y
    ninguna acción queda fuera de la pantalla.

## Cómo comprobarlo de verdad

```bash
npm run lint && npm run typecheck && npm run build
npm run start   # y mirar la pantalla, no solo el build
```

Mirar la pantalla no es opcional: el build compila igual una tarjeta con un
bloque de fecha tapado por su cabecera.
