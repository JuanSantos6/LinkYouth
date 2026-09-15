# Revisión antes de dar por terminada una pantalla

## Dirección

1. Ningún patrón de la lista de prohibidos: versalitas espaciadas,
   monoespaciada decorativa, palabra acentuada en el titular, marcadores
   numerados, flechas en botones, la misma sombra en todo, puntos medios entre
   metadatos, el mismo radio para todo.
2. El ámbar aparece solo donde algo está acreditado. Contá sus usos: si son
   más de dos o tres en la pantalla, dejó de ser una señal.
3. Un solo botón primario por pantalla.

## Sistema

4. Ningún color, radio ni sombra escrito a mano: todo sale de los tokens.
5. Ningún componente nuevo que duplique algo de `src/components/ui/`.
6. Ninguna regla de negocio dentro del `.tsx`: va en `src/lib/dominio/`.

## Estados

7. La lista vacía usa `EstadoVacio`; los datos de ejemplo, `AvisoOrigen`.
8. Los botones que envían algo se deshabilitan mientras corre y anuncian el
   resultado con `MensajeDeAccion`, que ya es `aria-live`.

## Accesibilidad

9. Ningún estado se lee solo por color. Comprobalo mirando la pantalla en
   escala de grises.
10. Recorré con Tab: el foco se ve siempre, con el color del acento, y
    aparece instantáneo.
11. Los campos y botones usan `border-borde-control`.

## Responsive y temas

12. A 390 px no hay desborde horizontal
    (`document.documentElement.scrollWidth === 390`). Si algo desborda, buscá
    un ítem de grilla sin `min-w-0`.
13. Probá la pantalla en tema oscuro y con al menos dos acentos distintos.

## Cómo comprobarlo de verdad

```bash
npm run lint && npm run typecheck && npm run build
npm run start   # y mirá la pantalla, no solo el build
```

Mirar la pantalla no es opcional: el build compila igual un anillo de foco que
tarda 150 ms en tomar color, un listado que ensancha la página en el teléfono
y una pared de etiquetas ámbar. Los tres pasaron por acá.
