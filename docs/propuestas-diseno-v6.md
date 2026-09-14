# Propuesta de diseño, v6: blanco y celeste, con portada

Pivote de piel sobre la estructura de v4, más el banner de portada. La
arquitectura de tres columnas no se tocó.

- **Fecha:** 2026-09-13 · **Rama:** `main`, commit `30c7ed2`
- **Nada aplicado.** Todo en `docs/propuestas-diseno-v6/`, fuera de `src/`.
- **Abrí [`inicio.html`](./propuestas-diseno-v6/inicio.html)** con doble clic.

| Pantalla | Archivo | 1440 px | 390 px |
|---|---|---|---|
| Inicio | [`inicio.html`](./propuestas-diseno-v6/inicio.html) | [ver](./propuestas-diseno-v6/vista-inicio.png) | [ver](./propuestas-diseno-v6/movil-inicio.png) |
| Empleos | [`empleos.html`](./propuestas-diseno-v6/empleos.html) | [ver](./propuestas-diseno-v6/vista-empleos.png) | [ver](./propuestas-diseno-v6/movil-empleos.png) |
| Actividades | [`eventos.html`](./propuestas-diseno-v6/eventos.html) | [ver](./propuestas-diseno-v6/vista-eventos.png) | [ver](./propuestas-diseno-v6/movil-eventos.png) |
| Postulaciones | [`postulaciones.html`](./propuestas-diseno-v6/postulaciones.html) | [ver](./propuestas-diseno-v6/vista-postulaciones.png) | [ver](./propuestas-diseno-v6/movil-postulaciones.png) |
| Mi perfil | [`perfil.html`](./propuestas-diseno-v6/perfil.html) | [ver](./propuestas-diseno-v6/vista-perfil.png) | [ver](./propuestas-diseno-v6/movil-perfil.png) |

Detalles: [la portada a 390 px](./propuestas-diseno-v6/movil-ficha.png) ·
[el glifo con requisitos faltantes](./propuestas-diseno-v6/detalle-glifo.png)

---

## 1. Lo que no se tocó

- Los cuatro niveles de jerarquía (vacante con superficie, actividad en fila,
  sección de documento, aviso y vacío sin nada).
- El glifo de marca y su acoplamiento con el gráfico de coincidencia.
- El puntaje como protagonista de la vacante.
- Las tres columnas: navegación a la izquierda, feed al centro, ficha a la
  derecha.
- Cero sombra en todo el documento.
- La mono reservada a las cifras.
- **La navegación sigue siendo una lista iterable.** `SECCIONES` en
  `datos.js` es un arreglo de objetos y la barra se arma con un `map` sobre
  él. Agregar una sección nueva es agregar una línea al arreglo: no hay
  ningún ítem escrito a mano en el HTML.

---

## 2. El celeste: por qué este y no el azul de siempre

Es la pregunta que importa, así que la respondo con medidas, no con
adjetivos.

### Primero medí qué es «el azul genérico»

Tomé los diez azules más repetidos de la industria y les saqué matiz,
saturación y luminosidad (HSL):

| | H | S | L |
|---|---|---|---|
| Tailwind `blue-600` | 221 | 83 | 53 |
| Tailwind `blue-500` | 217 | 91 | 60 |
| Tailwind `sky-500` | 199 | 89 | 48 |
| Tailwind `indigo-500` | 239 | 84 | 67 |
| Bootstrap `primary` | 216 | 98 | 52 |
| Stripe | 243 | 100 | 68 |
| Linear | 234 | 56 | 60 |
| Facebook | 214 | 89 | 52 |
| LinkedIn | 210 | 90 | 40 |
| Material `blue-700` | 210 | 79 | 46 |

El hallazgo no es el matiz. El matiz se dispersa entre 199 y 243, casi un
cuarto de la rueda. **Lo que los diez comparten es la luminosidad: todos
viven entre L 40 y L 68.** Ninguno baja de 40.

Y hay una razón concreta para eso: en todos esos productos el azul es **el
relleno del botón primario**, y un botón relleno tiene que resaltar contra un
fondo claro. Eso obliga a un azul medio. Un azul oscuro de verdad se vería
como un botón apagado.

### El celeste de LinkYouth

`#12506E` — **H 200, S 72, L 25**.

Contra el vecino más cercano del cluster, `sky-500` `#0EA5E9` (H 199, S 89,
L 48): prácticamente el mismo matiz, **la mitad de luminosidad y menos
saturación**. Uno es un celeste brillante de botón; el otro es una tinta de
petróleo. Puestos uno al lado del otro no se parecen en nada, aunque el matiz
los hermane.

**La luminosidad es la que lo saca del cluster, y es consecuencia del rol, no
una decisión estética arbitraria.** El azul de LinkYouth puede vivir en L 25
porque nunca tiene que resaltar como relleno grande: es tinta. Aparece en 13
reglas del CSS, y casi todas son de trazo fino o texto — el puntaje, las
celdas llenas del glifo, el marcador de la sección activa, los enlaces, el
anillo de foco, el título de pantalla, el borde inferior de la pestaña
activa.

### Lo que devolvió la base de `ui-ux-pro-max`, y por qué no lo usé tal cual

Busqué en el dominio `color` de la skill. Resultado honesto: **casi todos los
azules de la base son tokens de Tailwind literales.** `#0284C7` es `sky-600`,
`#0891B2` es `cyan-600`, `#06B6D4` es `cyan-500`, `#1E40AF` es `blue-800`,
`#1E3A8A` es `blue-900`. Elegir de ahí era exactamente caer en el problema.

El único valor que no es un token de librería fue `#1E3A5F`, etiquetado
«Research Lab / University Department» — muy a propósito para una plataforma
de estudiantes, y además ya fuera del cluster (H 214, S 52, L 25). Lo
descarté por dos motivos: H 214 es el centro exacto del matiz de Tailwind
`blue`, y a esa saturación baja el resultado es un navy institucional, que es
un cliché por derecho propio — el color de todo portal de gobierno, banco y
estudio jurídico.

Me corrí a H 200: el borde verdoso del rango, contra un navy que se va a
215-220. Es la diferencia entre una tinta de carta náutica y un azul
corporativo.

### El plano celeste

El celeste claro que pediste existe, pero en un solo lugar: **la banda de
navegación** (`#CCDFEC`, H 204, S 46, L 86). Es la única superficie de color
de la aplicación. Todo lo demás es blanco (`#FFFFFF`) sobre casi blanco
(`#F2F5F8`).

Esto importa por dos razones. Una, es la lectura literal de «blanco y
celeste». Dos, **ningún SaaS pinta la barra lateral de celeste** — las pintan
de gris, de blanco, o las dejan sin fondo. Esa banda es, en la práctica, lo
que más diferencia la pantalla de un producto genérico, más que el matiz del
acento.

### El riesgo que no te voy a ocultar

El oxblood de la ronda anterior tenía una ventaja que este celeste no tiene:
nadie más lo usa. El azul, por más que esté a L 25 y en H 200, arrastra una
familiaridad de base que un vino no arrastra. Lo que sostiene la diferencia
acá no es que el matiz sea exótico — es el registro de luminosidad, la
disciplina de rol (el azul es tinta, no relleno) y el plano celeste de la
barra.

Y hay un cambio que empuja en contra: pediste el acento también en los
botones primarios, así que el botón dejó de ser tinta casi negra y pasó a ser
el azul. Es un botón azul relleno, que es justo la convención del cluster. Lo
compensa que a L 25 lee como un azul de tinta, muy lejos del `blue-600` de
librería. Lo señalo porque es la decisión de este documento que más se acerca
al patrón que estamos evitando.

---

## 3. El banner de portada

Implementado como lo pediste, sin suavizarlo: ancho completo del panel
derecho, alto de banner, avatar montado sobre el borde inferior.

**Es un degradado, no una foto, porque no hay dónde guardar una foto.**
`db/schema.sql` no tiene columna de portada. El HTML lleva el comentario con
la migración que haría falta:

```sql
alter table perfiles add column portada_url text;
```

y el archivo iría al mismo bucket de Supabase Storage que ya usa `foto_url`.
El degradado ocupa exactamente el lugar y el alto que va a ocupar la imagen,
así que el layout no se mueve el día que exista.

Dos decisiones de ejecución:

- **Sólo el avatar se monta sobre la portada, no el nombre.** La primera
  versión subía toda la fila y el nombre quedaba sobre el degradado, en tinta
  oscura sobre azul oscuro. Se corrigió: el avatar sube 34 px, el nombre
  queda debajo del borde, sobre blanco.
- **El avatar lleva un marco blanco de 3 px** en vez de una sombra, que sería
  la solución de LinkedIn. Es lo que lo separa del degradado sin romper la
  regla de cero sombras.

**Consecuencia que conviene saber:** con una portada arriba, la ficha dejó de
poder ser una secuencia de filas sueltas sobre el lienzo y pasó a ser una
superficie con borde. El banner necesita un contenedor que lo contenga. Es el
único lugar del documento donde el sistema de «filas sin superficie» cede, y
cede por el banner.

A 390 px la portada baja de 96 px a 64 px y el avatar la acompaña. No se
oculta: la ficha se apila debajo del feed, a 343 px de ancho, entera dentro
del viewport.

---

## 4. Tipografía: se probaron tres, gana IBM Plex

No la arrastré. Rendericé la misma pantalla con cada candidata y comparé.

**Public Sans** quedó descartada primero, y por un motivo concreto de esta
paleta: es la tipografía oficial del sistema de diseño del gobierno de los
Estados Unidos (USWDS). Sobre el crema y el oxblood de la ronda anterior eso
no se notaba. Sobre **fondo blanco con un azul institucional** reproduce el
aspecto de un portal de gobierno, que es su propio cliché y bastante peor que
el del azul de SaaS.

**Hanken Grotesk** fue la primera elección de esta ronda. Es limpia, humanista
y no pertenece a ningún sistema de gobierno ni viene en ningún paquete de
arranque. Pero puesta al lado de la alternativa no dice nada: es correcta y
anodina.

**IBM Plex Sans + IBM Plex Mono** es lo que quedó, y no por gusto:

- **Es una superfamilia.** El texto y las cifras comparten esqueleto, así que
  el puntaje de 36 px no parece pegado de otra fuente. Antes el par era
  Hanken + JetBrains Mono, dos familias sin relación: funcionaba, pero el
  número y el texto venían de dos lugares distintos.
- **Entra más texto por línea.** La descripción de la primera vacante pasa de
  cuatro líneas a tres con el mismo ancho de columna y el mismo cuerpo.
- **Tiene punto de vista sin ser rara.** La `a` de doble piso, la `e` de lados
  planos y la `g` le dan un registro de ingeniería que acompaña al azul de
  petróleo y a la retícula del glifo.

Sobre el riesgo de repetir el error de Public Sans: IBM Plex es la tipografía
corporativa de IBM, sí, pero los productos de IBM viven en Carbon, que es
mayormente modo oscuro con un azul `#0f62fe` y grises fríos. Plex sobre blanco
con petróleo y una banda celeste no se lee como un producto de IBM. Public
Sans + navy + blanco sí reproducía literalmente el aspecto de un sitio del
USWDS, porque esos sitios usan exactamente esa combinación.

Ajuste que trajo el cambio: IBM Plex Sans llega hasta el peso 700, no 800. Las
tres reglas que pedían 800 (`.t-38`, `.marca-nombre`, `.titulo h1`) pasaron a
700 para no depender de que el navegador sintetice un peso que no existe.

---

## 5. Esquinas rectas: reevaluadas, se mantienen

Lo pediste explícitamente como una decisión a tomar con criterio y no por
inercia, así que la miré de nuevo con la paleta nueva.

Se mantienen en 0. El argumento: el giro de temperatura fue de cálido a frío
y de crema a papel blanco. Ese registro es más técnico que el anterior —
carta náutica, plano, ficha impresa — y la esquina recta lo acompaña mejor de
lo que acompañaba al crema. Redondear ahora sería moverse hacia el «friendly
SaaS» justo cuando la paleta se volvió más precisa.

Un detalle donde la esquina recta paga: el avatar cuadrado montado sobre la
portada. La versión circular de ese patrón es inmediatamente reconocible como
LinkedIn; la cuadrada es la misma idea de composición con otra voz.

Verificado: `borderRadius !== '0px'` da **0** elementos sobre
`.vacante, .boton, .chip, .insignia, .retrato, .retrato-marco, .portada,
.evento, .glifo i` en las cinco pantallas, a 1440 y a 390.

---

## 6. El glifo en la nueva temperatura

Lo revisé como pediste y necesitó un ajuste.

Antes las celdas vacías eran contorno sobre fondo transparente. Sobre el
papel blanco frío eso quedaba demasiado tenue: el glifo perdía la lectura de
retícula. **Ahora la celda vacía se rellena con el celeste de la banda**
(`#CCDFEC`), así el glifo es lleno/vacío en vez de sólido/contorno, y se lee
como una cuadrícula completada. Es además el segundo lugar donde aparece el
celeste claro, lo que ata el glifo al plano de navegación.

Un caso borde que apareció al hacerlo: **dentro de la banda celeste, la celda
vacía del logo desaparecía**, porque su relleno es el mismo color que la
banda. La regla `.marca .glifo i:not(.llena){background:var(--superficie)}`
le pone fondo blanco sólo ahí. La primera versión de esa regla no tenía el
`:not(.llena)` y pintaba de blanco también las celdas llenas: el logo salía
entero blanco. Corregido y verificado leyendo el color de las seis celdas en
el navegador.

Los íconos de navegación no necesitaron cambios: son trazo en `currentColor`
y heredan la tinta, que da 6.34:1 sobre blanco y 4.63:1 sobre la banda.

---

## 7. Contrastes medidos

Paleta recalculada entera. Ningún valor heredado.

| Par | Ratio | Mínimo |
|---|---|---|
| tinta `#0F1A21` / lienzo `#F2F5F8` | 16.13:1 | 4.5 |
| tinta / blanco | 17.65:1 | 4.5 |
| tinta-2 `#3B4C58` / blanco | 8.90:1 | 4.5 |
| tinta-3 `#50626E` / lienzo | 5.79:1 | 4.5 |
| acento `#12506E` / blanco | 8.76:1 | 4.5 |
| acento / lienzo (título, enlaces) | 8.00:1 | 4.5 |
| acento-fuerte `#0C3A51` / lienzo | 11.03:1 | 4.5 |
| blanco / acento (botón primario) | 8.76:1 | 4.5 |
| tinta-2 / superficie-2 (deshabilitado) | 7.39:1 | 4.5 |
| éxito `#0F6355` / blanco | 7.15:1 | 4.5 |
| éxito / lienzo | 6.54:1 | 4.5 |
| alerta `#9E1C3C` / blanco | 7.82:1 | 4.5 |
| alerta / lienzo | 7.15:1 | 4.5 |
| aviso (= acento `#12506E`) / lienzo | 8.00:1 | 4.5 |
| **sobre la banda celeste** | | |
| tinta-2 / banda `#CCDFEC` (nav inactiva) | 6.50:1 | 4.5 |
| acento-fuerte / banda (nav activa) | 8.81:1 | 4.5 |
| tinta / banda (marca) | 12.89:1 | 4.5 |
| tinta-3 / banda (íconos y texto menor) | 4.63:1 | 4.5 |
| **no textuales** | | |
| borde `#647C8E` / blanco | 4.36:1 | 3.0 |
| borde / lienzo | 3.99:1 | 3.0 |
| borde / superficie-2 | 3.62:1 | 3.0 |
| borde / banda celeste | 3.18:1 | 3.0 |
| acento / banda (glifo y marca) | 6.39:1 | 3.0 |
| anillo de foco / lienzo | 8.00:1 | 3.0 |
| **la portada** | | |
| marco blanco del avatar / `#12506E` (inicio del degradado) | 8.76:1 | 3.0 |
| marco blanco del avatar / `#0C3A51` (38 % del degradado) | 11.03:1 | 3.0 |
| borde de la ficha / lienzo | 3.99:1 | 3.0 |

Sobre la portada: **no lleva texto.** Es un `div` vacío con
`aria-hidden="true"`, verificado en el navegador (`textContent.length === 0`),
así que no hay contraste de texto que medir sobre el degradado. Lo que sí hay
que garantizar es el límite del avatar contra el fondo, y para eso está el
marco blanco, que contrasta 8.76:1 y 11.03:1 contra los dos tramos oscuros
del degradado — el avatar se apoya sobre esa zona, no sobre el tramo celeste
claro del extremo opuesto.

Dos valores fallaron en la primera pasada y se corrigieron antes de escribir
el CSS: el borde daba 2.89:1 contra el lienzo y 2.31:1 contra la banda, y
tinta-3 daba 3.88:1 contra la banda. Se ajustaron a `#647C8E` y `#50626E`,
que resuelven las cuatro superficies (blanco, lienzo, superficie-2 y banda)
en vez de dos.

---

## 8. Revisión: los tres colores sueltos y el botón corrido

### Los estados quedaron fuera de la paleta

Al cambiar la piel me quedaron tres colores de la versión cálida sin tocar, y
se notaban: verde `#1F6B43`, ámbar `#8A4B12` y rojo `#A32319`, todos en la
mitad cálida de la rueda, pegados sobre un esquema azul.

El peor de los tres era el ámbar, porque es el del cartel de «Contenido de
demostración» y **ese cartel aparece en las cinco pantallas**. Era la única
mancha cálida de toda la interfaz y estaba en todos lados.

Los tres se corrieron a la mitad fría:

| | antes | H | ahora | H |
|---|---|---|---|---|
| éxito | `#1F6B43` | 148 | `#0F6355` | 170 |
| alerta | `#A32319` | 4 | `#9E1C3C` | 345 |
| aviso | `#8A4B12` | 29 | `#12506E` (el acento) | 200 |

El verde se corrió a pino/teal y el rojo de anaranjado a carmín: siguen
leyéndose como éxito y como error, pero ahora pertenecen a la misma familia
que el acento en vez de ser tokens de librería pegados encima.

El aviso es un caso aparte: **pasó a ser el acento**, sin color propio. El
único uso que tiene hoy es un cartel informativo, no una advertencia, y en
tinta azul se integra en vez de gritar. Queda anotado en el CSS que si más
adelante aparece una advertencia de verdad va a necesitar su propio tono,
porque hoy no hay ninguno reservado.

### El botón «Ver mi perfil» estaba corrido

Había dos reglas para `.ficha .boton` peleando entre sí. Una venía del
sistema anterior, sin portada:

```css
.ficha .boton{margin-bottom:18px;width:calc(100% - 32px)}   /* la del banner */
.ficha .boton{margin-top:24px;width:100%}                    /* la vieja */
```

La segunda gana por orden, así que el botón tomaba `width:100%` **y además**
los `margin-left/right:16px` que le pone la regla general de los hijos de la
ficha. Resultado: 32 px más ancho que el espacio disponible, corrido hacia la
derecha y desbordando el borde de la tarjeta.

Se borró la regla vieja y la que queda no usa `calc`:

```css
.ficha .boton{display:flex;margin-top:24px;margin-bottom:18px;width:auto}
```

`display:flex` lo vuelve un elemento de bloque, así que ocupa el ancho
disponible menos los márgenes laterales por sí solo, sin aritmética que
mantener sincronizada con el padding. Medido después: 17 px de margen a cada
lado a 1440 px y 15 px a cada lado a 390 px, simétrico en los dos.

---

## 9. Verificación

En sesión de navegador nueva, las cinco pantallas:

- **axe-core: 0 violaciones** (34, 38, 29, 29 y 33 comprobaciones superadas).
- **390 px sin desborde:** `scrollWidth === clientWidth === 375` en las
  cinco. La portada baja a 64 px, la ficha entra a 343 px, «Cerrar sesión»
  queda alcanzable.
- **Cero `box-shadow`** y **cero radios distintos de 0**, en los dos anchos.
- **Navegación probada recorriéndola:** los cinco enlaces cambian de página y
  mueven `aria-current` al ítem correcto.
- **Paleta y tipografía leídas del navegador**, no asumidas: el puntaje da
  `rgb(18,80,110)` en `"IBM Plex Mono"`, el título da `rgb(18,80,110)`, la
  banda da `rgb(204,223,236)`, el lienzo `rgb(242,245,248)`, la tarjeta
  blanco, el `h1` en `"IBM Plex Sans"` con peso 700, y las seis celdas del logo dan
  `[acento, acento, blanco, acento, blanco, acento]`.

Un error propio que vale registrar: al insertar el comentario de la portada
metí acentos graves alrededor de `perfiles` y `db/schema.sql` **dentro de un
template literal de JavaScript**, lo que cortó la cadena y dejó las cinco
pantallas en blanco. Se detectó al mirar la captura, no al leer el código.

---

## 10. Lo que falta para llevarlo al código

- `globals.css`: reemplazar el bloque `@theme` completo. Los tokens están
  medidos.
- La portada necesita la columna `perfiles.portada_url` y la subida al bucket
  de Storage. Hasta entonces el degradado es el estado por defecto — que
  además sirve como respaldo para el perfil que nunca suba una.
- `Tarjeta.tsx` sigue sin poder ser un componente único: vacante es
  superficie, actividad es fila.
- El glifo es un componente nuevo, y la marca tiene que usar el mismo.
- IBM Plex Sans e IBM Plex Mono con `next/font/google`.
- Siguen abiertos los dos pendientes de `plan.md` y lo de
  `arquitectura.md` §7.6.
