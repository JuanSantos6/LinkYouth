# Demo de la defensa

## Restaurar la demo

Si algo se rompe el día de la defensa, esto deja la base como estaba al
cargarla: borra **todas** las cuentas y vuelve a crear las de
`scripts/demo/contenido.json`.

```bash
~/bin/respaldo-linkyouth.sh            # primero, un respaldo
cd ~/LinkYouth
node scripts/demo/sembrar.mjs --validar   # comprueba el contenido
node scripts/demo/sembrar.mjs --contar    # muestra lo que hay hoy y que
                                          # todas las cuentas estén confirmadas
node scripts/demo/sembrar.mjs --borrar-todo --confirmo \
  --correo-demo-joven=<correo real> --correo-demo-empresa=<correo real>
```

Tarda menos de un minuto. Todas las cuentas se crean con el correo confirmado
(`email_confirmed_at`): desde el 2026-10-20 GoTrue exige confirmar el correo
para iniciar sesión. Al terminar, el script lo comprueba y falla si alguna
quedó sin confirmar. Las contraseñas de las dos cuentas demo y la común
del resto quedan en `~/LinkYouth-credenciales-demo.txt` (600, fuera del
repositorio); si el archivo ya existe se reutilizan, así una recarga no
cambia lo que se anotó.

## Qué carga

5 empresas con logo (dibujos propios, sin parecido con marcas reales), 10
jóvenes con foto, intereses, habilidades y formación, 14 búsquedas (11
activas, 2 pausadas, 1 cerrada), 29 postulaciones en todos los estados, 6
eventos con dirección y coordenadas (3 futuros, uno cancelado y 2 pasados), 21
inscripciones y 10 reseñas. Empresas: Nube Sur (demo, tecnología), Tostadores
del Ceibo, Puerto Sur Logística, Clínica Parque Rodó y Agrotecnia El Trébol.

**Fotos.** Al final, la carga pone las fotos de Unsplash que ya están
elegidas en `scripts/fotos/fotos.json`: la de cada joven, las portadas de
empresa, las de los eventos y las de la página (portada, estados vacíos,
instituciones). No consulta la API de Unsplash, así que se puede recargar
cuantas veces haga falta. Cómo se eligieron: [`imagenes.md`](./imagenes.md).

Las postulaciones entran `pendiente` y avanzan por el mismo camino que en la
aplicación, así que los avisos al joven, el cierre de búsquedas y el aviso
de evento cancelado los escriben los disparadores de la base. Las fechas son
relativas al momento de la carga: los eventos futuros siempre son futuros.

Las cuentas demo (las que llevan `"demo": true`) están armadas para mostrar
todo: la joven tiene una postulación en cada estado y está inscripta a dos
eventos y al cancelado; la empresa tiene cuatro búsquedas con postulantes en
todos los estados, dos eventos con inscriptos y reseñas.

El contenido lo escribió Antigravity a partir de un formato fijo; el script
lo valida (catálogos cerrados, claves, unicidad, que las aceptadas no cubran
las posiciones) antes de tocar la base.
