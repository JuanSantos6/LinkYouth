# Componentes

## Botones

- `primario`: mandarina con texto tinta, semibold. Uno por pantalla.
- `secundario`: superficie con `border-borde-control`.
- `fantasma`: sin borde, fondo `realce` al pasar el mouse.
- Al presionar, bajan 1 px. Deshabilitados: fondo `realce`, texto `apagado`
  (nunca opacidad sola: el texto de carga tiene que leerse).

## Tarjeta de vacante (`empleos/FilaVacante`)

Clickeable entera hacia el detalle; el botón de postularse queda por encima
(`relative z-10`). A la derecha, el `Medidor` y la acción. La destacada (la
que más coincide, una o ninguna) lleva borde tinta y «La que más coincide con
vos» con ✓ turquesa. Sin sesión no hay medidor y «Postularme» lleva a crear
cuenta.

## Detalle de vacante

Dos columnas en escritorio; la acción queda fija a la derecha
(`lg:sticky lg:top-24`) con el medidor, lo que falta y «Qué pasa después»
(`ETAPAS` de `ProcesoDePostulacion`).

## Evento (`eventos/TarjetaEvento`)

Tarjeta con imagen opcional y bloque de fecha en lavanda (día en `.cifra`,
mes en `acento`).

## Medidor (`ui/Medidor`)

Un segmento por requisito. Rellenos: turquesa con borde `turquesa-texto`.
Siempre con el texto «Tenés X de Y».

## Filtro deslizante (`ui/FiltroDeslizante`)

Enlaces con `searchParams` y una marca tinta que se desliza a la opción
activa (`transform`). Sin JavaScript, la activa lleva el fondo directo.

## Menús (`navegacion/MenuDesplegable`)

Botón con `aria-haspopup`, `aria-expanded`; panel `role="menu"` con
`.emergente`. Esc, clic afuera y elegir cierran; el foco vuelve al botón;
las flechas recorren.

## Encabezado (`layout/CabeceraGlobal` + `navegacion/EncabezadoFlotante`)

`fixed`, altura 64 px, con un separador de 64 px en el flujo. Progreso `--p`
de 0 a 1 en los primeros 120 px de scroll, con curva ease-out, recalculado
siempre desde la posición real. En 0: barra integrada, sin radio, con una
línea abajo. En 1: cápsula de hasta 1180 px, radio 32 px, vidrio al 86 %,
borde fino y sombra (los dos últimos en pseudo-elementos, animados solo con
`opacity`). Con «reducir movimiento», 0 o 1 sin intermedios.

## Acceso (`auth/TarjetaDeAcceso`)

Tarjeta de 440 px (560 px en el registro), radio 28 px, sombra suave, con el
logo y el tema arriba, título cálido, formulario, enlace alternativo y vuelta
a la página principal. Fondo de `(auth)/layout.tsx`: dos manchas muy suaves
de turquesa y violeta y los anillos del isotipo, casi transparentes.

## Pestañas del teléfono (`navegacion/BarraPestanas`)

Solo postulante, `md:hidden`. Cápsula de vidrio fija abajo, con la marca de
la activa que se desliza. El pie tiene `pb-24` en el teléfono para que la
cápsula no tape el final.

## Pie (`layout/PieDeSitio`)

Columnas LinkYouth, Para jóvenes, Para empresas, Ayuda y legales, y Redes.
Solo enlaces a páginas que existen. Redes: solo las que existen de verdad.

## Portada (`src/app/page.tsx` + `components/portada/`)

`SliderBienvenida` (con pausa), panel `#nosotros` que sube y cubre la
bienvenida, `TarjetasPasos` (mismo tamaño, «Ver más»), bloque de búsquedas
que se recorta con `clip-path`, carruseles con flechas, opiniones de ejemplo,
preguntas con `DetallesSuaves`, llamada final con «Volver arriba» (`#arriba`).
Las animaciones viven solo en `AnimacionesDePortada`.

## Estados

- Lista vacía: `EstadoVacio`, con los dos anillos del isotipo sin unir.
- Carga: `EsqueletoDePantalla` en `loading.tsx`.
- Datos de ejemplo: `AvisoOrigen` (una línea discreta, no un cartel).
- Resultado de una acción: `MensajeDeAccion` (ya es `aria-live`).
