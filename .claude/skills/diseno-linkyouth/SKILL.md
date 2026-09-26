---
name: diseno-linkyouth
description: "Sistema de diseño de la interfaz de LinkYouth, «Recreo»: paleta nacida del logo oficial (violeta de marca, turquesa de «ya lo tenés», mandarina solo en el botón principal, neutros de base), tipografía Red Hat, logo en SVG, tema claro/oscuro que sigue al sistema, encabezado flotante de vidrio, transiciones de 150–300 ms, portada narrativa con GSAP y Lenis, accesibilidad AA y tono en español rioplatense. Usar SIEMPRE antes de crear o modificar cualquier pantalla, componente, estilo o texto de interfaz de este proyecto. Disparadores: nueva página, nuevo componente, colores, tema oscuro, logo, tipografía, espaciados, tarjetas, botones, formularios, menús, animaciones, transiciones, portada, textos de la interfaz."
---

# Diseño de LinkYouth — «Recreo»

LinkYouth es una plataforma seria de primer empleo cuyo público son jóvenes.
La interfaz tiene que ser cálida y joven para quien busca su primer trabajo,
y creíble para la empresa que publica. **Los neutros son la base; los colores
son acentos y cada uno significa algo.**

Decisión completa, con alternativas y contrastes medidos:
`docs/decisiones.md`, 2026-09-27.

## Antes de escribir una línea de estilo

1. `src/lib/diseno/tokens.ts`: los valores de la paleta, con su contraste.
2. `src/app/globals.css`: los mismos valores como variables `--ly-*`, las
   utilidades de Tailwind que salen de ellas y los estilos compartidos
   (vidrio, esqueleto, plegable, emergente, portada).
3. `src/components/ui/`: el componente que buscás casi seguro ya existe.

Un color escrito a mano (`text-blue-600`, `#2563EB`) es un error. Las únicas
excepciones son las fotos provisionales y el texto sobre fotos oscuras de la
portada, donde el fondo no depende del tema.

## La paleta

| Token | Claro | Oscuro | Para qué |
| --- | --- | --- | --- |
| `tinta` | `#1E1A38` | `#F3F1FA` | Texto, botón secundario activo |
| `papel` | `#F7F6FB` | `#15132A` | Fondo de página |
| `superficie` | `#FFFFFF` | `#1F1C38` | Tarjetas |
| `apagado` | `#5B5770` | `#B4B0C9` | Texto secundario |
| `violeta` | `#8C66FA` | `#9D7BFF` | **Marca**, del logo: menú activo, indicadores. **Nunca texto** |
| `acento` (violeta texto) | `#6541E0` | `#B39DFF` | Enlaces, foco, texto de acento |
| `turquesa` | `#19DDD2` | `#19DDD2` | **«Ya lo tenés»**, del logo: medidor, coincidencias. Siempre con ✓ o texto |
| `coincide-fondo` | `#C8F5F2` | `#19DDD2` | Etiqueta que coincide (suave en claro) |
| `turquesa-texto` | `#0A7A73` | `#19DDD2` | Borde e ícono de lo que ya tenés |
| `mandarina` | `#F25C1A` | `#FF8A4C` | **Solo el botón principal**, con texto tinta |
| `lavanda` | `#EFEAFF` | `#2C2752` | Fondo suave: fecha de evento, invitación |
| `alerta` | `#B8123F` | `#FF7A99` | Errores, siempre con «No se pudo» |
| `borde-control` | `#8A86A0` | `#817C9C` | Borde de campo o botón (3:1) |

Reglas de uso:

- **La mandarina aparece una vez por pantalla**: el botón principal. Si hay
  dos botones naranjas, uno sobra.
- **El violeta del logo no se usa para texto** (3,9:1). Para texto, `acento`.
- **El turquesa del logo no se usa para texto** (1,7:1). Va de relleno con
  tinta encima, o como `turquesa-texto`.
- **El color nunca va solo**: lo que coincide lleva ✓ y un texto para
  lectores de pantalla; los errores llevan la palabra; el medidor dice
  «Tenés 3 de 4».

## Tema

Tres estados: **sistema** (por defecto, no escribe nada en `<html>`),
**claro** y **oscuro** (`data-tema` en `<html>`). El botón del encabezado
(`BotonTema`) recorre los tres y la elección se guarda en el navegador
(`PreferenciasDeApariencia`). Ajustes ofrece lo mismo. **No hay selector de
color**: la paleta es una sola.

Cada bloque de tema en `globals.css` repite los valores oscuros dos veces
(por sistema y por elección). Si cambiás uno, cambiá los dos.

## Logo

El oficial, versión 3: dos anillos unidos por una barra, degradado de
turquesa a violeta. Los archivos están en `public/marca/` y son una
**reconstrucción en SVG** de la lámina (ver decisiones). Siempre con
`<Marca href=…>`, que muestra la versión clara u oscura según el tema. El
favicon es `src/app/icon.svg`. No dibujes el logo a mano en un componente.

## Tipografía

Red Hat Display en títulos y cifras (500–800), Red Hat Text en el cuerpo
(400–600), con `next/font` en `src/app/layout.tsx`. Las variables van en
`<html>`: si van en `<body>`, los tokens de `@theme` quedan inválidos y se ve
la fuente de respaldo.

Escala: 40 / 32 / 28 / 20 / 17 / 15 / 13 px. `h1` de pantalla en 28–32 px
extrabold; título de tarjeta 19 px.

## Forma

- Radios: `rounded-control` (10 px) en botones y campos, `rounded-ficha`
  (12 px) en bloques, `rounded-tarjeta` (16 px) en tarjetas, `rounded-full`
  en etiquetas, filtros y cápsulas.
- Sombras: `shadow-elevada` para lo que se levanta al pasar el mouse **y
  lleva a algún lado**; `shadow-flotante` para menús y la cápsula. Nada más.
- **Vacantes y eventos son tarjetas.** La vacante es clickeable entera (el
  título se estira con `after:absolute after:inset-0`) y el botón de
  postularse queda por encima. Los eventos llevan la fecha en lavanda.

## Navegación

- **Un solo menú por tipo de cuenta** (`CabeceraGlobal`). No hay barra
  lateral. La empresa no ve Empleos ni Eventos del postulante.
- En el teléfono, el postulante tiene **pestañas abajo** (`BarraPestanas`);
  público y empresa, el menú «Secciones».
- El encabezado arriba de todo es una barra completa; al bajar se vuelve
  **cápsula de vidrio** (`EncabezadoFlotante`, con IntersectionObserver, no
  con eventos de scroll). El vidrio (`.vidrio`) tiene 86 % de opacidad para
  que el texto cumpla AA con cualquier contenido detrás, y sin
  `backdrop-filter` es sólido.

## Movimiento

Nada aparece de golpe, y nada se mueve si no responde a algo que hiciste.

| Qué | Cómo |
| --- | --- |
| Abrir | 200 ms, `cubic-bezier(.2,.7,.2,1)` (`--ly-entrar`) |
| Cerrar | 150 ms, `cubic-bezier(.4,0,1,1)` (`--ly-salir`) |
| Menú, panel emergente | clase `.emergente` + `data-abierto` |
| Desplegable (preguntas, «Ver más») | `.plegable` + `data-abierto`, o `DetallesSuaves` |
| Cambio de pantalla | `EnlaceTransicion` (`document.startViewTransition`) |
| Filtros y pestañas | `FiltroDeslizante`: la marca se desliza |
| Postularse, inscribirse | `BotonAccion celebrar`: los anillos se unen |
| Carga | `loading.tsx` con `EsqueletoDePantalla` |

Solo `transform` y `opacity` (y `clip-path` en la portada). Con
`prefers-reduced-motion`, todo instantáneo: lo resuelve `globals.css`.

**La portada es la única pantalla con animaciones ligadas al scroll** (GSAP +
ScrollTrigger + Lenis, cargados con `import()` en
`AnimacionesDePortada`). No los uses en otra pantalla.

## Accesibilidad (WCAG 2.1 AA)

- Contraste AA en texto, 3:1 en bordes de control y formas que informan.
- Foco visible siempre, instantáneo, con `acento`.
- Todo control con nombre accesible; menús con `aria-expanded` y Esc;
  carruseles automáticos con pausa (2.2.2).
- 390 px sin desborde horizontal.
- Todo el contenido se lee sin JavaScript.

## Contenido honesto

- Los datos de ejemplo se anuncian con `AvisoOrigen`.
- **Fotos**: nada de fotos de banco. Mientras no haya fotos propias,
  `FotoProvisional` con un rótulo que dice qué foto va.
- **Opiniones**: no se inventan. Las de la portada son de ejemplo y lo dicen
  en cada tarjeta.
- Ningún enlace lleva a una página vacía ni a una función que no existe.

## Cómo se escriben los textos

Español rioplatense, voseo, frase normal. El botón dice qué pasa y el aviso
usa la misma palabra: «Postularme» → «Postulación enviada». Los estados
vacíos invitan a hacer algo; los errores explican qué pasó y cómo seguir.
Sin signos de exclamación ni emojis.

## Patrones ya resueltos

| Necesidad | Componente |
| --- | --- |
| Botón / enlace con forma de botón | `ui/Boton` · `ui/BotonEnlace` |
| Acción de servidor sobre un ítem | `ui/BotonAccion` |
| Tag o habilidad | `ui/Etiqueta` (`coincide`) |
| Estado | `ui/Insignia` |
| Compatibilidad | `ui/Medidor` |
| Filtros, pestañas | `ui/FiltroDeslizante` |
| Desplegable | `ui/DetallesSuaves` |
| Carga | `ui/Esqueleto` |
| Lista vacía | `ui/EstadoVacio` |
| Datos de ejemplo | `ui/AvisoOrigen` |
| Logo | `layout/Marca` |
| Cabecera, pie | `layout/CabeceraGlobal` · `layout/PieDeSitio` |
| Menú que se abre | `navegacion/MenuDesplegable` |
| Enlace con transición | `navegacion/EnlaceTransicion` |
| Tema | `layout/BotonTema` |
| Foto que falta | `portada/FotoProvisional` |

Detalle en `references/tokens.md`, `references/componentes.md` y, antes de
dar algo por terminado, `references/revision.md`.
