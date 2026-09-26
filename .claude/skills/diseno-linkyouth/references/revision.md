# Revisión antes de dar por terminada una pantalla

## Sistema

1. Ningún color, radio ni sombra escrito a mano: todo sale de los tokens.
2. Una sola mandarina (el botón principal).
3. Violeta y turquesa del logo solo como forma o relleno, nunca como texto.
4. Ningún componente nuevo que duplique algo de `src/components/ui/`.
5. Ninguna regla de negocio dentro del `.tsx`: va en `src/lib/dominio/`.

## Estados

6. Lista vacía con `EstadoVacio`; datos de ejemplo con `AvisoOrigen`; carga
   con `loading.tsx`.
7. Los botones que envían se deshabilitan mientras corre y anuncian el
   resultado con `MensajeDeAccion`.

## Accesibilidad

8. Ningún estado se lee solo por color (mirala en escala de grises).
9. Recorré con Tab: el foco se ve siempre y llega a todo.
10. Menús y desplegables: `aria-expanded`, Esc, el foco vuelve.
11. axe-core sin violaciones AA, en claro y en oscuro.

## Movimiento

12. Nada aparece de golpe: 200 ms al abrir, 150 ms al cerrar.
13. Con «reducir movimiento», todo instantáneo y en su estado final.
14. Solo `transform` y `opacity`.

## Responsive y temas

15. A 390 px no hay desborde (`document.documentElement.scrollWidth === 390`).
16. A 1440 px el contenido no se estira de más (`max-w-[1180px]`).
17. Probá la pantalla en tema claro y oscuro, y con el tema del sistema.

## Cómo comprobarlo

```bash
npm run lint && npm run typecheck && npm run build
npx playwright test
npm run start   # y mirá la pantalla, no solo el build
```
