# Imágenes

De dónde sale cada imagen de LinkYouth, con qué licencia y dónde vive.
Decisiones y alternativas en [`decisiones.md`](./decisiones.md), 2026-10-20 y
2026-10-22.

## La regla

- **Unsplash, por hotlink.** Las directrices de su API piden mostrar la foto
  con la URL que devuelve (`images.unsplash.com`), atribuir al fotógrafo y a
  Unsplash con enlace (`utm_source=linkyouth&utm_medium=referral`) y avisar a
  `download_location` al usarla. La CSP solo deja ese origen.
- **Elegidas una vez, no en cada visita.** `scripts/fotos/` hace una consulta
  por categoría y la página lee de la base lo que se eligió. La clave de la
  API vive en `~/.linkyouth-unsplash` y no sale de los scripts.
- **Elegidas mirándolas**, con una hoja de contactos por categoría: gente
  joven creíble para Uruguay, luz natural, sin logos ni texto legible, sin
  series repetidas.
- **Una foto de banco no se presenta como algo de LinkYouth que no pasó**:
  en «Nosotros» va un aula, no «el equipo»; las instituciones reales llevan
  una foto genérica de campus o aula, **nunca su logo**.
- **Ninguna cuenta sin imagen**: sin foto, `Avatar` con iniciales sobre un
  color de la paleta; sin foto de Unsplash en un lugar, la propia de
  `public/imagenes/` o la ilustración.

## Cómo se eligen (menos de 50 consultas, una corrida)

```bash
node scripts/fotos/buscar.mjs        # 1 consulta por categoría → hojas en ~/.cache/linkyouth-fotos/hojas/
# mirar cada hoja y anotar número y texto alternativo en scripts/fotos/elegidas.json
node scripts/fotos/registrar.mjs     # sin API: escribe scripts/fotos/fotos.json
node scripts/fotos/cargar.mjs        # sin API: fotos, lugares y cuentas de la demo en la base
nohup node scripts/fotos/avisar-descargas.mjs > ~/.cache/linkyouth-fotos/avisos.log 2>&1 &
```

Las categorías y sus lugares están en `scripts/fotos/categorias.json`. La
recarga de la demo (`scripts/demo/sembrar.mjs`) llama a `cargar.mjs` al
final, así nunca pierde las fotos ni consulta la API.

Al revisarlas en pantalla se cambió la de «Nosotros» (en la miniatura se veía
solo un escritorio y en grande mostraba a dos personas, que junto a ese texto
se leen como el equipo): va un aula vacía, y la Universidad Católica pasó a un
auditorio de la búsqueda de eventos. La elección del 2026-10-22: 6 consultas (la de «trabajo» se repitió porque la
primera trajo solo oficinas) y 42 avisos de descarga, 48 en total. Ceibo (café), Vital (clínica) y
Trébol (agro) quedaron entonces con la foto propia de su rubro; el 2026-10-27
se resolvió con búsquedas por rubro (ver más abajo). Las búsquedas
usan siempre la foto propia de su rubro, y «Postularte», en la portada, la
propia.

### Elección del 2026-10-27: personas y portadas de empresa

Pedido: personas de 18 a 30 años en contexto (estudiando, en la universidad,
en la oficina, en un taller), de aspecto profesional y natural, una foto
distinta por perfil y con el género del nombre; y para cada empresa un lugar
de trabajo de su rubro, sin ilustraciones ni logos inventados. 11 búsquedas
(una por género y contexto, y una por rubro) y 16 avisos de descarga: 27 en
total, de las 50 de la hora. Se miró cada hoja de contactos y se descartaron
las fotos con texto legible, marcas visibles (una campera con su logo en el
pecho, remeras estampadas) o cara tapada o muy lejana. En la cinta de la
portada cada organización se muestra con la foto de su rubro y su nombre, y
un aviso dice que las fotos ilustran el rubro: no son los lugares reales de
las empresas de la demo, que conservan sus nombres.

## Fotos de Unsplash

| Lugar | Autor | Foto |
| --- | --- | --- |
| `empresa:nube` | [Austin Distel](https://unsplash.com/@austindistel) | [Oficina de coworking luminosa con dos personas trabajando en sus escritorios.](https://unsplash.com/photos/three-men-sitting-on-chair-beside-tables-mpN7xjKQ_Ns) |
| `empresa:puerto` | [Centre for Ageing Better](https://unsplash.com/@ageing_better) | [Dos personas con chalecos reflectantes conversando en un pasillo de depósito.](https://unsplash.com/photos/women-walking-through-warehouse-aisle-ZlOlRnWk8zU) |
| `evento:ceibo-cata` | [Antenna](https://unsplash.com/@antenna) | [Grupo pequeño conversando en una sala cálida con cuadros en las paredes.](https://unsplash.com/photos/people-sitting-on-chair-ohNCIiKVT1g) |
| `evento:nube-charla` | [wes lewis](https://unsplash.com/@westhmus) | [Público joven sentado y sonriendo durante una charla.](https://unsplash.com/photos/diverse-group-at-professional-seminar-zt6OxRORM2g) |
| `evento:nube-taller-cv` | [Timur Shakerzianov](https://unsplash.com/@shaker_jpg) | [Jóvenes tomando notas sentados en un taller, en una sala luminosa.](https://unsplash.com/photos/a-group-of-people-sitting-in-a-room-mYNR1upvnZM) |
| `evento:puerto-puertas-abiertas` | [Dwayne joe](https://unsplash.com/@spliff_dj_joe) | [Personas sentadas en mesas largas escuchando una presentación.](https://unsplash.com/photos/audience-attentively-listening-during-a-presentation-in-person-conference-presentation-VA9MqBGCYXM) |
| `evento:trebol-sustentabilidad` | [Antenna](https://unsplash.com/@antenna) | [Público sentado en un auditorio escuchando con atención.](https://unsplash.com/photos/people-watching-at-a-room-FDV1BaKNKEo) |
| `evento:vital-jornada` | [Timur Shakerzianov](https://unsplash.com/@shaker_jpg) | [Asistentes atentos durante un seminario en una sala con ventanales.](https://unsplash.com/photos/adults-attending-workshop-in-sunlit-room-yCs7YTwEw2w) |
| `institucion:instituto-anglo-uruguayo` | [Vishnu Mehra](https://unsplash.com/@sanskritiuni) | [Salón de clases luminoso con estudiantes en sus bancos.](https://unsplash.com/photos/students-attending-a-lecture-in-a-modern-classroom-v3P_spLsOH0) |
| `institucion:liceo-n-35-iava` | [Spencer Liao](https://unsplash.com/@spencerliao) | [Salón de clase con pupitres celestes junto a una ventana.](https://unsplash.com/photos/empty-classroom-chairs-with-desks-9alfSW-szT4) |
| `institucion:plan-ceibal-jovenes-a-programar` | [Nhan Hoang](https://unsplash.com/@httnhan) | [Espacio de estudio con mesas y sillas, en penumbra.](https://unsplash.com/photos/empty-modern-office-space-with-tables-and-chairs-j3eaegN9j_g) |
| `institucion:universidad-catolica-del-uruguay` | [Wan San Yip](https://unsplash.com/@wansan_99) | [Auditorio universitario lleno de estudiantes sentados.](https://unsplash.com/photos/people-sitting-on-chair-inside-room-ID1yWa1Wpx0) |
| `institucion:universidad-de-la-republica` | [Dominic Kurniawan Suryaputra](https://unsplash.com/@d_ks11) | [Césped de un campus universitario con estudiantes sentados al sol.](https://unsplash.com/photos/a-group-of-people-sitting-on-top-of-a-lush-green-field-EhGw-i_Eamg) |
| `institucion:universidad-de-montevideo` | [Dom Fou](https://unsplash.com/@domlafou) | [Auditorio universitario con una pantalla al frente y filas de asientos.](https://unsplash.com/photos/people-sitting-on-chair-in-front-of-computer-YRMWVcdyhmI) |
| `institucion:utu-escuela-superior-de-administracion` | [Thuy Duong Nguyen](https://unsplash.com/@duonguyen) | [Aula con muchas sillas y mesas de madera, vacía.](https://unsplash.com/photos/a-young-girl-sitting-in-a-classroom-with-a-book-frGf5WHXzZI) |
| `institucion:utu-escuela-superior-de-la-construccion` | [Thuy Duong Nguyen](https://unsplash.com/@duonguyen) | [Bancos de madera de un aula, vistos de cerca.](https://unsplash.com/photos/a-row-of-wooden-chairs-in-a-room-3GlPOH56ZdY) |
| `institucion:utu-instituto-tecnologico-superior` | [Zsófia Hajnal](https://unsplash.com/@zsofiahajnal) | [Salón de clases largo con filas de sillas y ventanales.](https://unsplash.com/photos/empty-lecture-hall-with-rows-of-seats-I8PUo5Xk8DU) |
| `persona:agustina` | [Brooke Cagle](https://unsplash.com/@brookecagle) | [Joven con gorro de lana amarillo y anteojos atendiendo en una cafetería.](https://unsplash.com/photos/woman-holding-clear-drinking-glass-9fHMo1-5Io8) |
| `persona:camila` | [Rodrigo Rodrigues | WOLF Λ R T](https://unsplash.com/@wolfart32) | [Joven con anteojos sonriendo en una biblioteca, con un libro abierto.](https://unsplash.com/photos/woman-sitting-at-table-with-book-and-tablet-GLhMTHw9A9U) |
| `persona:facundo` | [Elvis Kaiser](https://unsplash.com/@rmndphoto) | [Joven con anteojos y buzo marrón escribiendo en un cuaderno al aire libre.](https://unsplash.com/photos/man-in-brown-long-sleeve-shirt-sitting-on-green-plastic-chair-reading-book-lqeuAjM05RI) |
| `persona:florencia` | [Rodrigo Rodrigues | WOLF Λ R T](https://unsplash.com/@wolfart32) | [Joven rubia sonriendo frente a su computadora en una oficina luminosa.](https://unsplash.com/photos/young-woman-working-on-a-laptop-in-an-office-AM2o6g---8o) |
| `persona:joaquin` | [Timothy Barlin](https://unsplash.com/@timbar) | [Joven con campera oscura y remera a rayas, mirando a cámara frente a tablas de madera en un depósito.](https://unsplash.com/photos/man-standing-beside-wood-planks-FGaknWvNbBk) |
| `persona:lucia` | [Jonathan Borba](https://unsplash.com/@jonathanborba) | [Joven con campera roja concentrada frente a una computadora portátil.](https://unsplash.com/photos/a-person-in-a-red-coat-QVCtOcqeZnI) |
| `persona:mateo` | [Mushvig Niftaliyev](https://unsplash.com/@mushvig95) | [Joven con auriculares al cuello trabajando en una computadora portátil, con camisa blanca.](https://unsplash.com/photos/a-man-sitting-at-a-table-using-a-laptop-computer-C7Fw5hsDfe8) |
| `persona:santiago` | [Farzan Farzadi](https://unsplash.com/@farzanfarzadi) | [Joven con barba y campera de jean tomando notas en una biblioteca.](https://unsplash.com/photos/a-man-sitting-at-a-table-writing-in-a-book-l9u27wEYU_I) |
| `persona:sofia` | [Humble Lamb](https://unsplash.com/@humblelamb) | [Joven de pelo claro leyendo un libro abierto, con un cárdigan blanco.](https://unsplash.com/photos/woman-reading-book-in-cafe-2g3R-W-NFI0) |
| `persona:valentina` | [Hannah Olinger](https://unsplash.com/@hannaholinger) | [Joven escribiendo en un cuaderno junto a una ventana luminosa.](https://unsplash.com/photos/woman-sitting-in-front-of-black-table-writing-on-white-book-near-window-NXiIVnzBwZ8) |
| `empresa:ceibo` | [Battlecreek Coffee Roasters](https://unsplash.com/@battlecreekcoffeeroasters) | [Tostador de café trabajando junto a su máquina en un local con azulejos blancos.](https://unsplash.com/photos/man-in-blue-collared-shirt-operating-gray-and-blue-machine-wH7Vosd0f48) |
| `empresa:trebol` | [Vitaly Gariev](https://unsplash.com/@silverkblack) | [Dos personas con delantal revisando una tablet dentro de un invernadero.](https://unsplash.com/photos/two-people-working-in-a-greenhouse-with-plants-p4w1Novu1PY) |
| `empresa:vital` | [Cdn Pages](https://unsplash.com/@cdnpagesca) | [Recepción de una clínica, con profesionales de la salud atendiendo.](https://unsplash.com/photos/woman-in-white-long-sleeve-shirt-holding-white-printer-paper-xM_1ZYHOc9E) |
| `portada:bienvenida` | [Vitaly Gariev](https://unsplash.com/@silverkblack) | [Grupo de jóvenes estudiando juntos alrededor de una computadora.](https://unsplash.com/photos/diverse-group-of-students-collaborating-around-a-laptop--X4Qx4_4iMU) |
| `portada:busqueda` | [Brooke Cagle](https://unsplash.com/@brookecagle) | [Tres jóvenes conversando con computadoras en la mesa de un café.](https://unsplash.com/photos/three-people-sitting-in-front-of-table-laughing-together-g1Kr4Ozfoac) |
| `portada:cierre` | [Mimi Thian](https://unsplash.com/@mimithian) | [Cuatro jóvenes sonriendo frente a una computadora en un espacio de trabajo.](https://unsplash.com/photos/four-people-watching-on-white-macbook-on-top-of-glass-top-table-vdXMSiX-n6M) |
| `portada:empresas` | [Chidera Faustina Okeke](https://unsplash.com/@thefourthwxll) | [Dos jóvenes trabajando con computadoras en una mesa, en una sala luminosa.](https://unsplash.com/photos/two-women-studying-together-at-a-table-with-laptop-2FDdgn0-W_o) |
| `portada:eventos` | [Dámaris Azócar](https://unsplash.com/@az_damariss) | [Joven con micrófono hablando frente a un público en un salón.](https://unsplash.com/photos/a-woman-standing-in-front-of-a-crowd-holding-a-microphone-NK02ShlfWDM) |
| `portada:feria` | [Vitaly Gariev](https://unsplash.com/@silverkblack) | [Grupo de jóvenes mirando juntos la pantalla de una computadora.](https://unsplash.com/photos/diverse-group-of-students-gathered-around-laptop-kp7qkHTgSKc) |
| `portada:ficha` | [Vitaly Gariev](https://unsplash.com/@silverkblack) | [Joven usando el teléfono junto a una computadora, en un living.](https://unsplash.com/photos/young-woman-using-phone-at-desk-with-laptop-QpuRvyYQ5kA) |
| `portada:nosotros` | [Changbok Ko](https://unsplash.com/@kochangbok) | [Aula universitaria vacía con filas de bancos de madera y ventanas a un costado.](https://unsplash.com/photos/empty-university-lecture-hall-desks-F8t2VGnI47I) |
| `portada:preguntas` | [Vitaly Gariev](https://unsplash.com/@silverkblack) | [Joven de pelo rizado trabajando en una computadora, con una taza al lado.](https://unsplash.com/photos/young-woman-working-on-a-laptop-at-home-WrevB3gLLBs) |
| `vacio:avisos` | [Vitaly Gariev](https://unsplash.com/@silverkblack) | [Rincón tranquilo con una pared de ladrillo, una mesa y una computadora.](https://unsplash.com/photos/a-woman-working-on-a-laptop-in-bed-r0fS01RQZ_M) |
| `vacio:busquedas` | [Vitaly Gariev](https://unsplash.com/@silverkblack) | [Joven concentrado escribiendo en una computadora, junto a una lámpara.](https://unsplash.com/photos/man-working-on-laptop-at-a-desk-a1ymWTTqUuE) |
| `vacio:eventos` | [Shane Ryan Herilalaina](https://unsplash.com/@alekseyryan) | [Joven sentada en un sillón junto a una ventana, con una computadora en la mesa.](https://unsplash.com/photos/young-woman-sitting-in-armchair-with-laptop-on-table-1nCP49ekPvw) |
| `vacio:personas` | [Julio Lopez](https://unsplash.com/@juliolopez) | [Joven escribiendo en una computadora junto a una ventana.](https://unsplash.com/photos/woman-wearing-headphones-works-on-a-laptop-by-window-NLuDzsdyQ6M) |
| `vacio:postulaciones` | [Mimi Thian](https://unsplash.com/@mimithian) | [Manos sobre el teclado de una computadora portátil.](https://unsplash.com/photos/person-touching-and-pointing-macbook-pro-ZKBzlifgkgw) |

## Fotos propias (respaldo)

Todas con la **Licencia de Pexels** (<https://www.pexels.com/license/>).
Autor y título verificados en la página de cada foto el 2026-10-20.

| Espacio | Archivo | Autor | Original |
| --- | --- | --- | --- |
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

Las sirve la aplicación desde `public/imagenes/`: la cabecera de cada
búsqueda según el rubro, y el respaldo de cada lugar de la portada sin foto
de Unsplash.

## Personas de la demo

Los nombres, las biografías, los estudios y las postulaciones de la demo son
ficticios. Las fotos de perfil son retratos de Unsplash y **no representan a
esas personas**. Una cuenta real sin foto ve el avatar automático (iniciales
sobre un color de la paleta, fijo para cada cuenta).

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
