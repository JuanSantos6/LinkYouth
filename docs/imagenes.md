# Imágenes

De dónde sale cada imagen de LinkYouth, con qué licencia y dónde vive. Cada
foto nueva se anota acá antes de usarse. Decisión y alternativas en
[`decisiones.md`](./decisiones.md), 2026-10-20.

## La regla

- **Solo Pexels o Unsplash.** Sus licencias permiten el uso comercial y la
  modificación, sin pagar y sin atribución obligatoria (igual la dejamos
  anotada acá). No permiten vender la foto tal cual ni sugerir que la
  persona retratada respalda el producto.
- **Descargadas y servidas desde el propio servidor**, en WebP. Nunca
  enlazadas a Pexels o Unsplash: la CSP no lo permite y le entregaría la IP
  de cada visitante a un tercero.
- **Elegidas mirándolas**: gente joven creíble para Uruguay, luz natural, sin
  logos ni texto legible.
- **Una foto de banco no se presenta como algo de LinkYouth que no pasó**:
  el equipo, un taller propio o una captura de la app siguen con
  `FotoProvisional` hasta tener la real.
- **Texto alternativo** descriptivo para cada una, en
  `scripts/imagenes/manifiesto.json`.

## Cómo se agrega o se cambia una foto

1. Anotarla en `scripts/imagenes/manifiesto.json` (página, autor, texto
   alternativo, encuadre) y en la tabla de abajo. Verificar autor y título en
   la página de la foto: **no** copiarlos de un buscador.
2. Descargar el original (no va al repositorio) y correr
   `node scripts/imagenes/preparar.mjs <carpeta con los originales>`: recorta,
   convierte a WebP y regenera `src/lib/imagenes.generado.ts`.
3. Si es de la demo, la próxima carga (`scripts/demo/sembrar.mjs`) la sube a
   Storage.

## Fotos

Todas con la **Licencia de Pexels** (<https://www.pexels.com/license/>).
Autor y título verificados en la página de cada foto el 2026-10-20.

| Espacio | Archivo | Autor | Original |
| --- | --- | --- | --- |
| `evento-ceibo-cata` | `scripts/demo/imagenes/evento-ceibo-cata.webp` | Tim Douglas | [Colleagues working on laptop in cafe](https://www.pexels.com/photo/6205494/) |
| `evento-cimiento-recorrida` | `scripts/demo/imagenes/evento-cimiento-recorrida.webp` | Pavel Danilyuk | [Man and Woman Holding a House Plan](https://www.pexels.com/photo/7937367/) |
| `evento-mirador-turismo` | `scripts/demo/imagenes/evento-mirador-turismo.webp` | Andrea Piacquadio | [Hospitable Woman Standing Behind Front Desk](https://www.pexels.com/photo/3771087/) |
| `evento-nube-taller-cv` | `scripts/demo/imagenes/evento-nube-taller-cv.webp` | fauxels | [Man Wearing Brown Suit Jacket](https://www.pexels.com/photo/3184339/) |
| `evento-puerto-puertas-abiertas` | `scripts/demo/imagenes/evento-puerto-puertas-abiertas.webp` | Tiger Lily | [Photo of Man Using Scanner](https://www.pexels.com/photo/4484151/) |
| `evento-trebol-sustentabilidad` | `scripts/demo/imagenes/evento-trebol-sustentabilidad.webp` | Magda Ehlers | [Drone Flying Over Agricultural Field in Rural Area](https://www.pexels.com/photo/34182315/) |
| `evento-vital-jornada` | `scripts/demo/imagenes/evento-vital-jornada.webp` | Tima Miroshnichenko | [Team of Doctors Having a Diagnostic Discussion](https://www.pexels.com/photo/5452193/) |
| `persona-bruno` | `scripts/demo/imagenes/persona-bruno.webp` | Italo Melo | [Portrait Photo of Smiling Man with His Arms Crossed Standing In Front of a Wall](https://www.pexels.com/photo/2379004/) |
| `persona-joaquin` | `scripts/demo/imagenes/persona-joaquin.webp` | Macx Converge | [Smiling Handsome Model](https://www.pexels.com/photo/17910791/) |
| `persona-lucia` | `scripts/demo/imagenes/persona-lucia.webp` | Andrea Piacquadio | [Woman in Yellow Shirt Holding Cellular phone](https://www.pexels.com/photo/3765114/) |
| `persona-mateo` | `scripts/demo/imagenes/persona-mateo.webp` | Monstera Production | [Handsome young ethnic guy looking at camera and smiling](https://www.pexels.com/photo/5384445/) |
| `persona-micaela` | `scripts/demo/imagenes/persona-micaela.webp` | Andrea Piacquadio | [Closeup Photo of Woman With Brown Coat and Gray Top](https://www.pexels.com/photo/733872/) |
| `persona-santiago` | `scripts/demo/imagenes/persona-santiago.webp` | Creation Hill | [Man In Red Jacket](https://www.pexels.com/photo/1681010/) |
| `persona-valentina` | `scripts/demo/imagenes/persona-valentina.webp` | Andrea Piacquadio | [Happy ethnic woman sitting at table with laptop](https://www.pexels.com/photo/3769021/) |
| `portada-busqueda` | `public/imagenes/portada-busqueda-{640,1280}.webp` | Roman Odintsov | [Young Man Using Laptop in a Cafe](https://www.pexels.com/photo/4925855/) |
| `portada-cierre` | `public/imagenes/portada-cierre-{640,1280}.webp` | fauxels | [Photo Of People Holding Each Other's Hands](https://www.pexels.com/photo/3184433/) |
| `portada-estudiantes` | `public/imagenes/portada-estudiantes-{640,1280}.webp` | Yan Krukau | [Three People in the Library](https://www.pexels.com/photo/8199634/) |
| `portada-feria` | `public/imagenes/portada-feria-{640,1280}.webp` | fauxels | [Photo of Three People Smiling While Having a Meeting](https://www.pexels.com/photo/3184338/) |
| `portada-pasante` | `public/imagenes/portada-pasante-{640,1280}.webp` | fauxels | [Colleagues Shaking each other's Hands](https://www.pexels.com/photo/3184291/) |
| `portada-primer-dia` | `public/imagenes/portada-primer-dia-{640,1280}.webp` | Yan Krukau | [Coworkers Looking at a Laptop Together](https://www.pexels.com/photo/7693685/) |
| `rubro-agro` | `public/imagenes/rubro-agro-{640,1280}.webp` | Gustavo Fring | [Elderly Man Noting While Standing on a Field](https://www.pexels.com/photo/4975384/) |
| `rubro-comercio` | `public/imagenes/rubro-comercio-{640,1280}.webp` | MART PRODUCTION | [Top View of Handmade Jewelry Lying on Wooden and Ceramic Trays](https://www.pexels.com/photo/7679889/) |
| `rubro-construccion` | `public/imagenes/rubro-construccion-{640,1280}.webp` | Mikael Blomkvist | [A Two Engineer Talking Together](https://www.pexels.com/photo/8961073/) |
| `rubro-gastronomia` | `public/imagenes/rubro-gastronomia-{640,1280}.webp` | Chevanon Photography | [Person Performing Coffee Art](https://www.pexels.com/photo/302899/) |
| `rubro-hoteleria-turismo` | `public/imagenes/rubro-hoteleria-turismo-{640,1280}.webp` | Quang Nguyen Vinh | [Women Standing at the Wooden Counter](https://www.pexels.com/photo/6876619/) |
| `rubro-logistica` | `public/imagenes/rubro-logistica-{640,1280}.webp` | Tiger Lily | [Warehouse with Concrete Floors](https://www.pexels.com/photo/4483610/) |
| `rubro-salud` | `public/imagenes/rubro-salud-{640,1280}.webp` | Tima Miroshnichenko | [Doctors working Together on a Research](https://www.pexels.com/photo/5452228/) |
| `rubro-tecnologia` | `public/imagenes/rubro-tecnologia-{640,1280}.webp` | cottonbro studio | [People Working Together](https://www.pexels.com/photo/6804071/) |

Las de `public/imagenes/` las sirve la aplicación (portada y cabecera de cada
búsqueda según el rubro). Las de `scripts/demo/imagenes/` las sube la carga
de la demo a Storage: fotos de perfil de 7 de los 15 jóvenes y de 7 de los 8
eventos.

## Personas de la demo

Los nombres, las biografías, los estudios y las postulaciones de la demo son
ficticios. Las fotos de perfil son de modelos de Pexels y **no representan a
esas personas**. Los 8 jóvenes sin foto muestran el avatar automático
(iniciales sobre un color de la paleta, fijo para cada cuenta), que es lo que
ve cualquier cuenta real sin foto.

## Logos de la demo

`scripts/demo/logos/*.svg`: dibujos propios, hechos para este proyecto, de
empresas inventadas. Formas geométricas simples y dos letras; ninguno copia
ni imita una marca real. La carga los convierte a WebP y los sube a Storage
como logo de cada empresa.

## Descartadas al verificar

- `8005397` (construcción): la página ya no existe en Pexels; sin página no
  hay licencia que verificar. La reemplaza `8961073`.
- Varias candidatas propuestas por número no correspondían a la foto
  descripta (aparecieron animales, objetos, paisajes): se descartaron al
  mirarlas.
