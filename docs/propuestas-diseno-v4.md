# Propuesta de diseño, v4

Una sola propuesta, terminada. La v2 cambió la composición de raíz y se leyó
como otro producto; la v3 cambió tan poco que siguió sintiéndose genérica.
Esta parte de un criterio distinto: no «qué estilo elegimos» sino **qué
decisiones concretas toman los productos profesionales que se ven bien**.

- **Fecha:** 2026-09-13 · **Rama:** `main`, commit `30c7ed2`
- **Nada aplicado.** Todo en `docs/propuestas-diseno-v4/`, fuera de `src/`.
- **Abrí [`inicio.html`](./propuestas-diseno-v4/inicio.html)** con doble clic.
  Las cinco pantallas, la barra lateral completa, los cinco enlaces andando,
  el buscador filtrando y las pestañas cambiando de vista.
- **Revisado el 2026-09-13, tres veces.** §5: la barra lateral pasó a banda
  de tono propio y la columna de perfil se rehízo con contenido accionable.
  §6: se sacó la segunda tipografía «con carácter» después de mirar sitios
  reales. §7: **reescritura completa de superficie** — el ajuste de §6 no
  alcanzó, y esta vez se cambió tipografía, color y radio a la vez, con las
  skills de diseño instaladas como criterio explícito. Es el cambio que
  importa; lo que ven las capturas de este documento es el resultado de §7.

| Pantalla | Archivo | 1440 px | 390 px |
|---|---|---|---|
| Inicio | [`inicio.html`](./propuestas-diseno-v4/inicio.html) | [ver](./propuestas-diseno-v4/vista-inicio.png) | [ver](./propuestas-diseno-v4/movil-inicio.png) |
| Empleos | [`empleos.html`](./propuestas-diseno-v4/empleos.html) | [ver](./propuestas-diseno-v4/vista-empleos.png) | [ver](./propuestas-diseno-v4/movil-empleos.png) |
| Actividades | [`eventos.html`](./propuestas-diseno-v4/eventos.html) | [ver](./propuestas-diseno-v4/vista-eventos.png) | [ver](./propuestas-diseno-v4/movil-eventos.png) |
| Postulaciones | [`postulaciones.html`](./propuestas-diseno-v4/postulaciones.html) | [ver](./propuestas-diseno-v4/vista-postulaciones.png) | [ver](./propuestas-diseno-v4/movil-postulaciones.png) |
| Mi perfil | [`perfil.html`](./propuestas-diseno-v4/perfil.html) | [ver](./propuestas-diseno-v4/vista-perfil.png) | [ver](./propuestas-diseno-v4/movil-perfil.png) |

---

## 1. El criterio, antes de la propuesta

Las tres skills se usaron sobre el mismo objeto, no por separado:
`frontend-design` aporta qué delata un diseño generado, `ui-ux-pro-max` aporta
los datos de tipografía y las reglas de interacción, `web-design-guidelines`
aporta el piso verificable. Donde se contradicen, gana la que se puede medir.

Mirando productos profesionales bien resueltos —herramientas de
productividad, plataformas de desarrollo, paneles de datos— las decisiones que
se repiten no son de estilo. Son siete, y ninguna tiene que ver con elegir
entre «Flat» y «Soft UI»:

1. **La escala tipográfica no es la rampa por defecto.** Casi ningún producto
   bueno usa 12/14/16/20/24. Usan razones irregulares, con un salto grande
   reservado para un solo elemento, y compensan el tracking según el tamaño.
2. **El espacio en blanco tiene una razón, no un valor.** La distancia entre
   secciones es varias veces la distancia entre elementos de una misma
   sección. Ese contraste es lo que se lee como aire deliberado; el padding
   uniforme de 16 px en todos lados se lee como relleno.
3. **El acento aparece poco y siempre en el mismo tipo de lugar.** Ocupa un
   porcentaje chico de la superficie. Los botones primarios suelen ser tinta,
   no color de marca: el color se guarda para el estado y para el dato.
4. **Los neutros tienen temperatura elegida.** Gris cálido o gris frío, pero
   decidido y sostenido. El gris pizarra por defecto es el que hace que todo
   se parezca a todo.
5. **El borde estructura; la sombra se reserva.** Los productos pulidos usan
   sombra sólo para lo que realmente flota. La sombra gris suave debajo de
   cada tarjeta es la firma del kit genérico.
6. **Hay un gráfico propio.** No un ícono de librería: una forma que significa
   algo en este producto y en ningún otro. Es lo que más separa «producto» de
   «plantilla».
7. **Las microinteracciones son específicas.** Una cosa se mueve, no la
   tarjeta entera. El hover-lift en todo es el default generado.

> **Ninguna marca se copió.** Estas siete son observaciones sobre el tipo de
> decisión y el nivel de terminación, no sobre la identidad visual de nadie.
> El acento, la tipografía y el gráfico de LinkYouth se eligieron desde cero.

---

## 2. Qué rompe cada patrón genérico

### El kit de tarjetas SaaS → **cero sombras en toda la aplicación**

No hay una sola `box-shadow` en el CSS. Verificado en el navegador: en las
cinco pantallas, a 1440 y a 390, `document.querySelectorAll('*')` filtrado por
`boxShadow !== 'none'` devuelve **0**. Nada flota, así que la jerarquía tiene
que hacerla otra cosa — y eso obligó a resolverla de verdad:

| | Vacante | Actividad | Sección de perfil | Aviso y vacío |
|---|---|---|---|---|
| Superficie | blanca, borde, radio 10 | **ninguna** | ninguna | **ninguna** |
| Separador | — | regla de 1 px entre filas | regla de 2 px de tinta arriba | regla de 2 px a la izquierda |
| Título | 21 px Bricolage | 17 px | 21 px | 21 px |
| Canaleta | 96 px con el puntaje | 96 px con la fecha | 96 px con el ordinal | — |

Una actividad ya no es una tarjeta más chica: **no es una tarjeta**. Es una
fila sobre el lienzo. Y el estado vacío no tiene ni borde: es tipografía sobre
el fondo. Eso es lo que la v3 no terminó de hacer.

### El azul de librería → **frambuesa `#A3195B`**

No es azul, ni teal, ni violeta. Es un magenta profundo que no aparece por
defecto en ninguna paleta de la categoría, y que sostiene 6.76:1 sobre el
lienzo y 7.38:1 sobre blanco.

Y aparece poco. **Los botones primarios son tinta `#211D1B`**, no acento. El
frambuesa queda reservado para cuatro cosas: el puntaje de coincidencia, el
glifo, la sección activa de la navegación y el anillo de foco. Es el criterio
3 de arriba: el color se guarda para el dato, no se gasta en los botones.

La primera versión pintaba también los chips de habilidad que ya tenés. Con un
perfil completo eso teñía la pantalla entera de frambuesa y lo devaluaba.
**Se invirtió: ahora se marca lo que falta**, con borde punteado y texto
apagado — que además es el dato accionable, porque el glifo ya da el recuento.

### El gris pizarra → **neutros cálidos**

`#211D1B` de tinta, `#F6F5F2` de lienzo, `#938A85` de borde. Toda la escala
tiene un corrimiento hacia el rojo. Es lo que hace que el frambuesa se vea
integrado y no pegado encima.

### Los íconos de librería → **un glifo propio, que además es la marca**

La marca de LinkYouth es una grilla de seis celdas, cuatro llenas. El gráfico
de coincidencia **es la misma forma**: una celda por requisito del puesto,
llena si ya lo declaraste en tu perfil. Un puesto con seis requisitos dibuja
exactamente el logo; uno con tres dibuja medio.

No es decoración y no es un ícono: es el dato. Y es la única figura del
producto, así que aparece en el logo, en cada vacante y en ningún otro lado.
Ese acoplamiento entre identidad y dato es la decisión que no se puede copiar
a otro producto.

### La rampa 12/14/16/20/24 → **11 / 13 / 15 / 17 / 21 / 38**

Razón irregular, con el salto grande reservado al título de pantalla. Dos
familias variables, las dos de la base de `ui-ux-pro-max`:

- **Bricolage Grotesque** para títulos y cifras. Tiene ejes `opsz` (12–96) y
  `wdth` (75–100), y se usan de verdad: el `h1` renderiza con
  `font-variation-settings: "opsz" 48, "wdth" 92` — verificado en el
  navegador. Ajustar el tamaño óptico y estrechar un 8 % el título es
  exactamente el tipo de decisión que un producto genérico no toma.
- **Instrument Sans** para todo el texto de interfaz. Variable, con carácter,
  y no es la Inter que usa todo el mundo.

Cifras tabulares en todo el documento, tracking negativo creciente hacia
arriba de la escala (−0.032em a 38 px) y positivo en el rótulo de 11 px.

### El chrome de plantilla → **fuera los cinco**

Sin `uppercase tracking-wide` en ningún rótulo. Sin cadenas `A · B · C`. Sin
`→` en los botones. Sin negro teñido haciendo de negro: `#211D1B` es una
decisión de temperatura declarada. Sin monoespaciada para rótulos de dato —
la única monoespaciada del producto está en los nombres de archivo del aviso,
donde corresponde.

### El hover-lift → **una sola cosa se mueve**

- La sección activa de la navegación marca con una barra de 2 px que **crece
  desde el borde** (`transform: scaleY(0→1)`, 140 ms). La fila no se mueve.
- La vacante al pasar el puntero **sólo oscurece su borde**. No se levanta, no
  cambia de sombra, no escala.
- Las celdas del glifo entran escalonadas 40 ms al cargar la lista.
- Los botones transicionan `background-color` y nada más, 120 ms.
- Todo bajo `prefers-reduced-motion: reduce`, que anula animaciones y
  transiciones.

---

## 3. El puntaje, sin retroceder respecto de v3

Sigue siendo el protagonista de la vacante, y más que en v3:

- **40 px en Bricolage** con `opsz 48`, `wdth 88` y tracking −0.045em, en
  frambuesa — el número más grande de la pantalla después del título.
- **El glifo debajo**, que da la composición exacta: qué cubrís y qué no.
- **El recuento en palabras**: «6 de 6 requisitos».
- Los tres ocupan una canaleta propia de 96 px, la misma que usan la fecha en
  las actividades y el ordinal en la formación. Esa canaleta compartida es lo
  que alinea las tres pantallas de lista.

A 390 px la canaleta se convierte en una fila horizontal arriba del título.
**No desaparece en ningún ancho**, que era el defecto original.

---

## 4. Verificación

**axe-core: 0 violaciones en las cinco pantallas**, a la primera pasada
(34, 38, 29, 29 y 33 comprobaciones superadas).

**390 px: sin desborde horizontal en ninguna.** `scrollWidth === clientWidth
=== 375` en las cinco, con la fila de secciones desplazable y «Cerrar sesión»
alcanzable.

**Navegación probada recorriéndola**: al hacer clic en cada uno de los cinco
enlaces, la URL cambia, el `h1` cambia y el marcador de la sección activa
queda en `matrix(1,0,0,1,0,0)` —es decir, desplegado— en el ítem correcto.
El buscador de `/empleos` con «datos» deja 1 resultado y el conteo dice
«1 búsqueda abierta para «datos»».

**Contrastes medidos**, no estimados:

| Par | Ratio | Mínimo |
|---|---|---|
| tinta `#211D1B` / lienzo | 15.33:1 | 4.5 |
| tinta-2 `#4A4441` / superficie | 9.57:1 | 4.5 |
| tinta-3 `#6B6461` / lienzo | 5.32:1 | 4.5 |
| acento `#A3195B` / lienzo (enlace) | 6.76:1 | 4.5 |
| acento `#A3195B` / superficie | 7.38:1 | 4.5 |
| nav activa `#8E1657` / lienzo | 8.02:1 | 4.5 |
| blanco / tinta (botón primario) | 16.72:1 | 4.5 |
| botón deshabilitado `#4A4441` / `#FBFAF8` | 9.17:1 | 4.5 |
| rótulo de 11 px `#6B6461` / superficie | 5.80:1 | 4.5 |
| chip «te falta» `#6B6461` / `#FBFAF8` | 5.56:1 | 4.5 |
| aviso `#92400E` / lienzo | 6.50:1 | 4.5 |
| éxito `#15803D` / superficie | 5.02:1 | 4.5 |
| alerta `#B3261E` / superficie | 6.54:1 | 4.5 |
| **glifo lleno** `#A3195B` / superficie | 7.38:1 | 3.0 |
| **glifo vacío** `#938A85` / superficie | 3.38:1 | 3.0 |
| borde `#938A85` / superficie | 3.38:1 | 3.0 |
| borde `#938A85` / lienzo | 3.10:1 | 3.0 |
| borde punteado / `#FBFAF8` | 3.24:1 | 3.0 |
| anillo de foco / lienzo | 6.76:1 | 3.0 |
| nav inactiva `#4A4441` / banda `#E8E4DB` | 7.54:1 | 4.5 |
| nav activa `#8E1657` / banda | 6.89:1 | 4.5 |
| marca `#211D1B` / banda | 13.18:1 | 4.5 |
| ícono de nav `#6B6461` / banda | 4.57:1 | 3.0 |
| marcador activo `#A3195B` / banda | 5.81:1 | 3.0 |

### Dos cosas que hubo que corregir sobre la marcha

1. **El acento se desbordaba.** Marcar con frambuesa los requisitos que ya
   tenés pintaba casi toda la pantalla, porque el perfil de demostración
   cubre casi todo. Se invirtió a marcar lo que falta.
2. **Quedaba una sombra viva.** Los filtros de `/empleos` usaban
   `box-shadow: inset` como subrayado. Funcionalmente no es una elevación,
   pero contradecía la regla declarada, así que pasó a `border-bottom`. La
   cuenta de sombras en el navegador pasó de 1 a 0.

---

## 5. Revisión: la barra y la columna de perfil

Dos ajustes de layout, sin tocar paleta, tipografía, glifo ni la regla de
cero sombras.

### La barra lateral existía, pero era invisible

No se había perdido al construir v4: el `<nav>` estaba entero, con los cinco
enlaces, los íconos y el marcador de sección activa. El problema era otro.
Al sacar todas las sombras y todos los bordes, la columna quedó sobre el mismo
`#F6F5F2` del contenido, así que dejó de leerse como columna: los enlaces
flotaban al costado de la página sin nada que dijera dónde empieza y dónde
termina la navegación.

**La separación ahora la hace el tono, no una sombra ni un borde.** La banda
usa `--barra: #E8E4DB`, un escalón más oscuro que el lienzo y de la misma
temperatura cálida: 1.16:1 contra el fondo, suficiente para leerse como
superficie distinta sin convertirse en un bloque pesado.

Dos detalles de implementación que importan:

- **La banda sangra hasta los bordes del marco** (`margin` negativo que
  compensa el `padding` de `.marco`, más `min-height: 100dvh`), así llega
  arriba, abajo y hasta el borde izquierdo de la ventana. Pintar sólo el
  `<nav>` hubiera dejado un rectángulo de color flotando en el medio, que es
  justo lo que no se quería.
- **«Cerrar sesión» subió de `tinta-3` a `tinta-2`.** Sobre la banda,
  `tinta-3` daba 4.57:1: pasa, pero sin margen. Sobre el nuevo fondo los
  íconos se quedan en `tinta-3` porque son gráficos y les alcanza con 3:1.

A 390 px la banda ocupa el ancho completo (`x = 0`, `width = 375`) y queda
como una franja superior, con la fila de secciones desplazándose adentro.

### La columna de perfil existía, pero no decía nada útil

También estaba: `.dos-col` abría una tercera columna de 264 px a partir de
1280 px. Lo que mostraba era el nombre, el usuario, un número grande de
postulaciones y un botón. Nada accionable.

**Ahora muestra tres cosas, todas con el sistema de fila sin superficie:**

1. **Quién sos**, con el avatar chico a la izquierda y el nombre al lado.
2. **Lo que tenés cargado**: habilidades, áreas de interés y estudios como
   filas de etiqueta y valor, separadas por reglas de 1 px, con el número
   alineado a la derecha en Bricolage. Debajo, la razón por la que importa:
   cada cosa que cargues entra en el cálculo de compatibilidad de todas las
   vacantes. Eso conecta la columna con el glifo del feed.
3. **Postulaciones activas**: las que están en `pendiente` o `en_revision`,
   con su estado en frambuesa, el puesto y la empresa. Es lo que un
   postulante quiere tener a la vista mientras mira el feed.

**Sobre no copiar LinkedIn.** Se tomó el concepto —el perfil propio visible
mientras navegás— y nada más. En concreto, lo que se evitó: no hay foto de
portada, el avatar no está centrado ni es grande, no hay una fila de tres
estadísticas iguales (que además es el patrón que ya habíamos sacado de
`TarjetaUsuario`), y sobre todo **no hay tarjeta**: la columna es una
secuencia de filas sobre el lienzo, abierta por la misma regla de 2 px de
tinta que abre las secciones de `/perfil`. El único borde de la columna es
esa regla superior.

### Comportamiento a 390 px

La tercera columna no se oculta: se apila debajo del feed, a 343 px de ancho,
entera dentro del viewport. Se decidió no esconderla porque es contenido, no
adorno — pero queda al final del scroll, que es coherente con no haber
priorizado esa experiencia. Verificado en las cinco pantallas:
`scrollWidth === clientWidth === 375`, cero sombras, y «Cerrar sesión»
alcanzable dentro de la banda.

axe-core sigue en **0 violaciones en las cinco pantallas** después del cambio.

---

## 6. Segunda revisión: qué decía realmente un sitio profesional

La primera versión de v4 seguía leyéndose como hecha con IA. La razón no
salió de otra ronda de criterio abstracto — salió de abrir sitios reales y
mirarlos: [linear.app](https://linear.app), [ramp.com](https://ramp.com),
[jobs.ashbyhq.com/notion](https://jobs.ashbyhq.com/notion) y
[wellfound.com/jobs](https://wellfound.com/jobs), con capturas a 1440 px.
Ninguno se copió; se miraron para encontrar el patrón que se repite en los
cuatro y que v4 no tenía.

**El patrón: una sola familia tipográfica, y el peso hace el trabajo.**
El titular «Time is money. Save both.» de Ramp y el «The product development
system for teams and agents» de Linear están puestos en la misma grotesca
que el resto de la página, sólo que enorme y en negrita. Ninguno cambia de
tipo de letra para el título. Wellfound hace lo mismo: «Find what's next:»
es la misma fuente que el resto, más grande y más pesada.

v4 hacía lo contrario: **Bricolage Grotesque** para títulos y cifras,
**Instrument Sans** para el cuerpo — dos familias, con ejes variables
(`opsz`, `wdth`) ajustados a mano en once reglas distintas del CSS. Bricolage
Grotesque es una fuente con personalidad marcada a propósito: es
precisamente el tipo de elección — una tipografía elegida *por* su carácter,
para que la interfaz se sienta menos genérica — que termina leyéndose al
revés, como una decisión hecha para parecer una decisión.

**Se sacó Bricolage Grotesque entera.** Ahora hay una sola familia,
Instrument Sans, en todo el documento — títulos, cifras, cuerpo, chips,
navegación. Los títulos y las cifras grandes pasan a `font-weight: 700`,
sin ningún ajuste de eje variable. Fue una reescritura de doce reglas en
`estilo.css` (`h1,h2,h3`, `.t-38`, `.t-21`, `.marca-nombre`, `.puntaje`,
`.vacante h2`, `.cuando .dia`, `.vacio h2`, `.seccion h2`, `.titulo h1`,
`.destacado b`, `.datos-fila b`, `.retrato`, `.formacion .ord`) y el `<link>`
de Google Fonts de las cinco páginas, que pasó de dos familias con ejes
variables a una sola con cuatro pesos estáticos.

Lo demás de v4 no cambió, porque las mismas capturas de referencia lo
confirman en vez de contradecirlo:

- **El acento usado poco, pero visible donde aparece.** Wellfound usa un
  rosa/magenta muy similar en volumen al frambuesa de LinkYouth — en el
  eyebrow «OVER 130K REMOTE & LOCAL STARTUP JOBS» y en el logo — así que no
  hace falta diluirlo más.
- **Cero sombra no es un tell.** Ashby no usa ni una tarjeta: todo es texto
  con jerarquía tipográfica y una línea de metadatos separada por puntos
  medios — que es justo el patrón que v1 había marcado como sospechoso, y
  que acá, solo y sin el resto del paquete genérico, se ve perfectamente
  profesional. Ramp sí usa tarjetas, pero con borde de 1 px y sin sombra
  visible. Ninguno de los dos contradice la decisión de v4.
- **El glifo sigue siendo la decisión más defendible del documento.** Ningún
  sitio de referencia tiene un equivalente — es la pieza que hace que
  LinkYouth no se pueda confundir con ningún otro producto, que es
  exactamente el problema que el pedido original quería resolver.

### Verificación después del cambio

Se repitió la ronda completa: **axe-core en 0 violaciones en las cinco
pantallas**, sin desborde a 390 px (`scrollWidth === clientWidth === 375`),
cero `box-shadow` verificado en el navegador. Los contrastes de color no se
tocaron — el cambio es de familia y de peso, no de color — así que la tabla
de §4 sigue vigente sin remedir.

---

## 7. Reescritura completa: la superficie entera, no un ajuste

Después de §6, el diagnóstico seguía siendo el mismo: «es exactamente igual».
No lo era en el sentido literal (la tipografía había cambiado de familia),
pero el ajuste fue insuficiente: quedaban el radio de 10 px en cada tarjeta,
el acento magenta con aire a rosa de libreria, y los rellenos claros detras
de cada insignia. Esos tres, juntos, son los que un ojo entrenado lee como
"hecho con una herramienta", con independencia de que la tipografia ya fuera
otra.

Esta vez se usaron las skills de diseno instaladas como insumo, no como
referencia mental:

- **`design-taste-frontend`** - su lista de patrones baneados marca
  explicitamente lo que iba a hacer mal: *Fraunces* e *Instrument Serif*
  estan nombradas una por una como las dos serifas que un modelo de lenguaje
  elige por defecto cuando quiere "parecer editorial", y advierte contra el
  serif como salida por defecto en general. Se habia estado explorando
  Fraunces para esta ronda; se descarto por esto mismo, antes de escribir una
  sola linea de CSS. Tambien aporto la regla dura de forma ("shape
  consistency lock": un solo radio para toda la pagina, sin mezclarlo) y la
  de color ("maximo un acento, saturacion menor al 80%, nunca `-suave` como
  fondo salvo que el propio color lo pida").
- **`emil-design-eng`** - la curva de movimiento y el criterio de que anima y
  que no. De ahi sale `--ease-out: cubic-bezier(0.23,1,0.32,1)` en vez de un
  `ease` de sistema, y el `scale(.97)` en `:active` de los botones, que la
  version anterior no tenia.
- **`ui-ux-pro-max`**, contra la base de datos real de tipografias, para
  encontrar el par sans+mono.
- **`frontend-design`** y **`web-design-guidelines`**, ya cargadas en la
  sesion, para el piso de accesibilidad y la lista de tells que se venia
  usando desde v1.

### Los tres pedidos, uno por uno

**Sin bordes redondeados.** `--radio` y `--radio-chico` pasan de `10px`/`6px`
a `0px`, y son las dos unicas variables de radio del documento: todo lo que
antes las usaba (vacante, boton, chip, insignia, campo de texto) pasa a
esquina recta sin tocar el selector, solo el valor del token. Dos elementos
que no usaban la variable se ajustaron a mano: el avatar (`.retrato`,
`.retrato.chico`) era un circulo (`border-radius:50%`) y pasa a cuadrado neto
(una placa de identificacion, no una foto de perfil de red social) y la
insignia (`.insignia`) era una pildora (`border-radius:999px`) y pasa a
rectangulo. Verificado despues: `document.querySelectorAll('.vacante,
.boton, .chip, .insignia, .retrato, .evento, .glifo i')` filtrado por
`borderRadius !== '0px'` da **0** en las cinco pantallas.

**Sin colores pastel.** Se sacaron las cuatro variables `-suave`
(`--acento-suave`, `--exito-suave`, `--aviso-suave`, `--alerta-suave`) del
documento entero (no se renombraron, se eliminaron, y con ellas cualquier
fondo con tinte claro de color). La insignia, que antes tenia tres variantes
con relleno pastel (`acento-suave`, `exito-suave`, `alerta-suave`), pasa a
un solo criterio: contorno y texto del color que corresponde, **siempre**,
con una unica excepcion deliberada (la etiqueta "Pasantia") que pasa a
relleno solido y profundo, no lavado. Es la diferencia entre marcar un
estado (contorno) y marcar un tipo de contenido (relleno), y ahora se nota
esa diferencia en vez de que las dos usen la misma receta de fondo claro.

**Cambio de tipografia, con una funcion real.** Sale Instrument Sans, entra
**Public Sans** para toda la interfaz (la tipografia oficial del sistema de
diseno del gobierno de EE. UU., USWDS), elegida porque es exactamente lo
que una herramienta generativa no elige por defecto: no viene con ningun
paquete de arranque de IA, no tiene el aire "friendly SaaS" de las
grotescas que si aparecen en esos paquetes. Y se suma **JetBrains Mono**,
pero no como segunda tipografia de titulos (eso ya se probo en v3 con
Bricolage y fue exactamente el problema) sino reservada a una sola funcion:
las cifras que importan. El puntaje de compatibilidad, la fecha de un
evento, el numero de habilidades cargadas, el ordinal de cada formacion.
Sans para prosa, mono para dato: es un registro de instrumento tecnico, no
de marca de consumo, y es honesto con lo que cada tipo de contenido es.

**El acento deja de ser magenta.** De `#A3195B` (una frambuesa con
temperatura de rosa) a `#7A1230`, un vino/oxblood bastante mas oscuro y
menos saturado (mismo angulo de matiz en la rueda de color, pero corrido
hacia el color de un sello o de una tinta de firma, no de una marca de
consumo). Se usa exactamente donde se usaba antes: el puntaje, el glifo, la
seccion activa, los enlaces, el foco.

### Contrastes, medidos otra vez

Toda la paleta se recalculo, no se heredo ningun valor de §6, porque tanto
los neutros como el acento cambiaron.

| Par | Ratio | Minimo |
|---|---|---|
| tinta `#1A1814` / lienzo `#F1EFEA` | 15.43:1 | 4.5 |
| tinta-2 `#433E37` / superficie | 10.59:1 | 4.5 |
| tinta-3 `#645D51` / lienzo | 5.66:1 | 4.5 |
| acento `#7A1230` / lienzo | 9.34:1 | 4.5 |
| acento / superficie | 10.73:1 | 4.5 |
| acento-fuerte `#5C0E24` / lienzo | 11.84:1 | 4.5 |
| blanco / acento (insignia solida) | 10.73:1 | 4.5 |
| blanco / tinta (boton primario) | 17.73:1 | 4.5 |
| tinta-2 / superficie-2 (deshabilitado) | 8.34:1 | 4.5 |
| exito `#2F5D34` / lienzo | 6.68:1 | 4.5 |
| aviso `#8A4B12` / lienzo | 5.90:1 | 4.5 |
| alerta `#8C2318` / lienzo | 7.72:1 | 4.5 |
| borde `#847D70` / superficie | 3.72:1 | 3.0 |
| borde / lienzo | 3.23:1 | 3.0 |
| borde / superficie-2 | 3.98:1 (ver abajo) | 3.0 |
| borde-fuerte / superficie (hover) | 6.97:1 | 3.0 |
| tinta-2 / barra (nav inactiva) | 7.45:1 | 4.5 |
| acento-fuerte / barra (nav activa) | 9.57:1 | 4.5 |

La fila del borde contra `superficie-2` fallo en la primera pasada
(`2.93:1`, por debajo de 3:1) y se corrigio antes de escribir el CSS: el
tono bajo de `#8A8478` a `#847D70`, que resuelve las tres superficies
contra las que tiene que funcionar (blanco 3.72, lienzo 3.23, superficie-2
3.98) en vez de solo dos.

### Verificacion

Repetida completa, en una sesion de navegador nueva: **axe-core en 0
violaciones en las cinco pantallas** (34, 38, 29, 29 y 33 comprobaciones
superadas), sin desborde a 390 px (`scrollWidth === clientWidth === 375`),
cero `box-shadow`. Y dos verificaciones nuevas, especificas de este pedido:

- **Radio:** `[...document.querySelectorAll('.vacante,.boton,.chip,
  .insignia,.retrato,.evento,.glifo i')].map(e =>
  getComputedStyle(e).borderRadius).filter(r => r !== '0px').length` da
  **0** en las cinco pantallas, a 1440 y a 390.
- **Color y tipografia en vivo**, leidos con `getComputedStyle` en vez de
  asumidos: el puntaje de la primera vacante da
  `color: rgb(122, 18, 48)` (`#7A1230`, el acento nuevo) en
  `font-family: "JetBrains Mono"`; el nombre de marca da
  `font-family: "Public Sans"`; el avatar y el glifo dan
  `border-radius: 0px`.

---

## 8. Lo que falta para llevarlo al codigo

Esto es la referencia visual, no el camino de migración. Para aplicarlo:

- `globals.css`: reemplazar el bloque `@theme` completo, incluido `--barra`. Los tokens están
  medidos, no hace falta recalcular nada.
- `Tarjeta.tsx` deja de tener sentido como componente único: hay que partirlo
  en vacante (superficie) y fila (sin superficie).
- `TarjetaVacante`, `TarjetaEvento`, `TarjetaUsuario`, `EstadoVacio`,
  `AvisoOrigen`, `NubeTags` y `ListaFormacion` cambian de estructura.
- El glifo es un componente nuevo, y la marca tiene que usar el mismo.
- Hay que sumar las dos familias con `next/font/google` y sus ejes variables.
- Siguen abiertos los dos pendientes de `plan.md` y lo de
  `arquitectura.md` §7.6.
