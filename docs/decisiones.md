# Decisiones técnicas

Registro de las decisiones de arquitectura y tecnología de LinkYouth. Cada
entrada deja asentado qué se decidió, qué alternativas se evaluaron y por qué
se eligió esa opción.

---

## 2026-10-22 — Fotos de Unsplash por hotlink, elegidas una vez

Reemplaza «servidas desde el propio servidor, nunca enlazadas» de la decisión
del 2026-10-20.

**Decisión.** Las fotos salen de la API de Unsplash y se muestran con la URL
que devuelve (`images.unsplash.com`), como exigen sus directrices, con la
atribución al fotógrafo y a Unsplash y el aviso a `download_location`. Se
eligen una sola vez con `scripts/fotos/`: **una consulta por categoría**
(retratos, trabajo, instituciones, eventos, portada; seis en total) cuyos 30
resultados se reparten entre los lugares de la categoría sin repetir foto,
elegidas mirando una hoja de contactos por categoría. URL, autor y enlaces
quedan en `fotos.json` (en el repositorio) y en la base; la página nunca
consulta la API. Los avisos de descarga van después, en segundo plano. La
CSP suma solo `images.unsplash.com`.

**Alternativas.** *Seguir descargándolas y sirviéndolas nosotros*: lo
prohíben las directrices de la API. *Consultar la API en cada visita*:
imposible con 50 consultas por hora y le pondría a Unsplash en el camino de
cada página. *Una consulta por lugar* (68 lugares): más de dos horas de
espera por el límite. *Esperar a cada aviso de descarga antes de mostrar*:
bloqueaba la carga sin ganar nada.

**Por qué.** Cumplir las condiciones de la API con 47 consultas, en una
corrida, sin esperas. El costo: cada visitante le pide las fotos a Unsplash
(su IP llega a un tercero), que es lo que la decisión anterior evitaba; las
fotos propias quedan de respaldo si la base no tiene las de Unsplash.

## 2026-10-22 — La compatibilidad es solo de la empresa

**Decisión.** El joven no ve compatibilidad ni coincidencias: sin el medidor
«Tenés 3 de 4», sin las ✓ sobre los requisitos que ya tiene, sin «La que más
coincide con vos» ni «Te falta». Lo que pide una búsqueda se muestra tal
cual. La coincidencia se ve solo en las pantallas de empresa
(`CoincidenciaDeCandidato`), como pide RF3.9.2 («visible únicamente para la
empresa»). El listado del joven sigue ordenado con lo más afín primero, sin
número ni marca.

**Alternativas.** *Dejarle al joven la comparación con lo público* (la de
antes): no filtraba nada oculto, pero contradecía RF3.9.2 y lo pidió el
equipo explícitamente. *Ordenar el listado por fecha*: más neutro, pero
pierde la recomendación sin que eso exponga ningún puntaje; queda como
opción si se prefiere.

**Por qué.** El puntaje es una herramienta de selección de la empresa; para
el joven, ver «2 de 5» frente a una búsqueda desalentaba postularse a algo
que la empresa igual podía querer.

## 2026-10-22 — Habilidades ocultas en su propia tabla

**Decisión.** La empresa marca cada habilidad pedida como «Pública» o «Solo
vos» (RF3.1.6). Las ocultas van a `vacante_habilidades_ocultas`, con las
mismas políticas que `vacante_tags_ocultos`, y cuentan para la coincidencia
igual que las públicas.

**Alternativas.** *Una columna `oculta` en `vacante_habilidades`*: esa tabla
se lee sin sesión y RLS decide filas, no columnas; la fila oculta viajaría a
cualquiera. *Una vista que filtre*: la tabla seguiría abierta debajo. *Dejar
ocultos solo los intereses*: era lo que había, y la empresa no podía pedir
una habilidad sin publicarla.

**Por qué.** Es el mismo razonamiento de RNF5 que ya protegía los tags
ocultos: lo que el postulante no tiene que ver no tiene que existir para su
sesión.

## 2026-10-20 — Fotos de banco libres y avatar automático

Reemplaza la regla «nada de fotos de banco» de la decisión del 2026-09-27
(«Recreo»), que dejaba la portada con recuadros provisionales.

**Decisión.** Fotos de Pexels o Unsplash (uso comercial permitido, sin
atribución obligatoria), elegidas mirándolas, recortadas y convertidas a
WebP (640 y 1280 px) por `scripts/imagenes/preparar.mjs` y servidas desde
el propio servidor. Fuente, autor y licencia de cada una en
[`imagenes.md`](./imagenes.md). Las de la demo (personas y eventos) se suben
a Storage como cualquier foto de usuario; los logos de la demo son dibujos
propios. Quien no tiene foto ni logo ve un avatar con sus iniciales sobre un
color de la paleta que sale del id de la cuenta.

**Alternativas.** *Seguir con `FotoProvisional`*: honesto pero vacío para la
defensa. *Enlazar las fotos a Unsplash o Pexels*: abre la CSP y le entrega
la IP de cada visitante a un tercero. *Generar imágenes con IA*: personas
que no existen con defectos visibles, y la licencia de uso es menos clara.
*Avatares ilustrados de un servicio externo*: otro tercero. *Color del
avatar por nombre*: cambia si la persona cambia de nombre y repite color
entre homónimos.

**Por qué.** Fotos reales con licencia clara, sin terceros en tiempo de
ejecución, y ninguna cuenta sin imagen. Lo que todavía no existe (el equipo,
un taller propio, la captura de la app) sigue rotulado como provisional.

## 2026-10-20 — Avisos de los dos lados y correos con una cola en la base

**Decisión.** Los disparadores escriben el aviso y, para los tres casos
importantes (seleccionado, descartado, postulación recibida), una fila en
`correos_pendientes`; la aplicación la despacha por SMTP con nodemailer
justo después de la acción (`after()`), con la clave de servicio. La
empresa recibe avisos por postulación e inscripción con nuevos disparadores
`after insert`.

**Alternativas.** *Mandar el correo desde la acción de servidor, sin cola*:
se pierde si la acción falla después del `update`, y no cubre los cambios
que hace la base sola (cerrar una búsqueda rechaza las pendientes).
*`pg_net` o una Edge Function disparada por la base*: mete otro servicio y
otra superficie en Supabase, que no se publica. *Un proceso aparte en PM2
que lea la cola cada minuto*: un servicio más para mantener en el servidor;
queda como opción si `after()` no alcanza. *Un correo por cada aviso*:
llena la casilla de cosas menores; los demás avisos quedan en la campana.

**Por qué.** El aviso y su correo nacen en la misma transacción, así que no
hay correo de algo que no pasó ni cambio sin correo. La cola guarda
`cuenta_id` y no la dirección: el correo se busca al mandarlo. Nadie la lee
desde la API (RLS sin políticas, sin permisos para `anon` ni
`authenticated`).

## 2026-10-20 — Mapa embebido con Leaflet y OpenStreetMap

Reemplaza la decisión 6 de la Etapa 2 («Mapa con un enlace a
OpenStreetMap»), que había elegido el enlace para no tocar la CSP.

**Decisión.** Mapas embebidos con Leaflet 1.9.4 y las teselas estándar de
OpenStreetMap (`tile.openstreetmap.org`), con la atribución visible. La CSP
abre `img-src` a ese único origen, que vive en `src/lib/mapa/teselas.ts` y
lo comparten el mapa y la política. La búsqueda de direcciones (Nominatim) la
hace el servidor, con una acción solo para empresas: `connect-src` sigue en
`'self'`. «Cómo llegar» abre la app de mapas del teléfono sin pasar por
Google: Mapas de Apple en iOS, `geo:` en Android (deja elegir la app) e
indicaciones de OpenStreetMap en la computadora.

**Alternativas.** *Seguir con el enlace*: no deja ver los eventos en un mapa
ni elegir el lugar tocándolo, que es lo que pide el uso desde el celular.
*Google Maps*: pide clave y facturación, y abre `script-src` y `frame-src` a
Google. *MapLibre con teselas vectoriales*: más pesado (≈ 200 kB más) y
necesita un servidor de estilos o de teselas propio. *Teselas de CARTO u
otro proveedor con tema oscuro*: suma un tercero con sus propias
condiciones; el modo oscuro se resuelve con un filtro CSS sobre las
teselas. *Geocodificar desde el navegador*: abre `connect-src` a Nominatim y
no permite cumplir su límite de una consulta por segundo ni identificar la
aplicación.

**Por qué.** Es el cambio mínimo de la CSP que permite el mapa: solo
imágenes, de un solo origen, sin scripts ni conexiones de terceros. El
costo es que el navegador de quien abre un mapa le pide las teselas a
OpenStreetMap (y le entrega su IP); por eso el mapa carga recién cuando
entra en pantalla, y las páginas sin mapa no le piden nada.

## 2026-10-20 — Eliminar la cuenta anonimizando

**Decisión.** `eliminar_mi_cuenta()` borra los datos personales y conserva
postulaciones y reseñas sin nada que identifique; `auth.users` se bloquea y
se le reemplazan correo y contraseña, pero la fila queda.

**Alternativas.** *Borrar la fila de `auth.users`*: la cascada se lleva
postulaciones y reseñas, que nunca se borran, y la empresa perdería su
historial. *Marcar `cuentas.eliminada` y nada más*: los datos personales
seguirían en la base.

**Por qué.** Cumple RF1.7.5 (los datos asociados a la persona desaparecen)
sin romper la regla de no borrar postulaciones ni reseñas.

## 2026-10-20 — Correo y acceso con nombre de usuario

### 1. Los enlaces del correo van a la aplicación, con `token_hash`

**Decisión.** Plantillas propias de GoTrue que enlazan a `/auth/callback`
con `token_hash`, servidas desde un bucket público de Storage. Detalle en
[`correo.md`](./correo.md).

**Alternativas.** *El enlace por defecto de GoTrue*: apunta a la API de
Supabase, que solo escucha en la tailnet; habría que publicarla por el Funnel
y cambiar `API_EXTERNAL_URL`, que también es el emisor de los JWT. *Servir
las plantillas desde la aplicación*: GoTrue no llega al puerto 3000 del host.

**Por qué.** No expone nada nuevo y es el recorrido que recomienda Supabase
para aplicaciones con el servidor de por medio.

### 2. Nombre de usuario → correo, con la clave de servicio en el servidor

**Decisión.** `correoDeUsuario` en `src/lib/supabase/admin.ts`
(`server-only`).

**Alternativas.** *Una función `security definer` abierta a `anon`*: le
devolvería a cualquiera el correo de cualquier nombre de usuario. *Una
función que valide la contraseña en la base*: obliga a reimplementar el
inicio de sesión de GoTrue.

**Por qué.** El correo nunca sale del servidor y GoTrue sigue siendo quien
valida la contraseña. Un nombre inexistente da el mismo mensaje que una
contraseña mala.

## 2026-10-20 — Vitest para los tests unitarios del dominio

**Decisión.** Los tests unitarios usan Vitest (`npm test`, archivos
`src/**/*.test.ts` junto a la clase que prueban). Los e2e siguen en Playwright.

**Alternativas.** *`node:test` con `--experimental-transform-types`*: no suma
dependencias, pero no resuelve el alias `@/` y obliga a importar con extensión
`.ts`, lo que pide cambiar `tsconfig.json`. *Jest*: necesita un transformador
para TypeScript y ESM y es más lento de configurar.

**Por qué.** Vitest lee TypeScript y ESM sin configuración extra, resuelve el
alias con tres líneas y es lo que recomienda la documentación de Next.js.

## 2026-10-15 — Etapa 2: el lado de la empresa

Migración `db/migraciones/005-etapa2-empresa.sql`, ya incluida en
`db/schema.sql` y `db/politicas.sql`. Seis decisiones con alternativas reales.

### 1. Los datos de una persona, por una función y no abriendo `perfiles`

**Decisión.** La empresa lee nombre, usuario, país, bio y foto de una persona
con `candidatos_de_mi_empresa(ids)`, `security definer`, que devuelve solo a
quienes se postularon (sin retirarse) o se inscribieron a algo suyo.

**Alternativas.** *Una política de select sobre `perfiles` para la empresa*:
abre la fila entera, incluida la fecha de nacimiento, y una política sobre
`perfiles` que consulte `postulaciones` arriesga recursión con las políticas
de esa tabla. *Una vista*: hereda los privilegios de su dueño y es justo lo
que en H13 dejó modificar perfiles sin sesión.

**Por qué.** La función expone siete columnas y nada más, y la condición
queda escrita en un solo lugar.

### 2. Borrar una búsqueda solo si nadie se postuló

**Decisión.** Política `vacantes_borro_las_mias_sin_postulaciones`. Con
postulaciones, la búsqueda se cierra.

**Alternativas.** *No permitir borrar nunca*: una búsqueda publicada por error
quedaría para siempre en el listado. *Borrar con sus postulaciones*: contradice
la regla de no borrar nunca filas de `postulaciones`.

### 3. Cerrar una búsqueda rechaza solo las pendientes

**Decisión.** El disparador de RF3.3.3 pasa a `rechazada` las postulaciones
`pendiente` y avisa. Las que están en revisión o entrevista siguen.

**Alternativas.** *Rechazar todas*: la empresa puede cerrar la búsqueda
porque ya eligió entre quienes entrevistó, y rechazar en bloque a esas
personas les mandaría un «no fuiste seleccionada» antes de tiempo. *No tocar
ninguna*: quien se postuló y nadie miró quedaría esperando una respuesta que
no llega.

### 4. Recomendados entre los postulantes propios (opción «a»)

**Decisión.** El panel recomienda, entre quienes se postularon a búsquedas
activas y siguen en proceso, a los que declaran más habilidades pedidas
(`ResumenDePanel.recomendados`). Candidatos (RF7.3) busca en el mismo
conjunto.

**Alternativa descartada por ahora (opción «b»).** Recomendar a cualquier
joven de la plataforma. Exige que la empresa lea datos de quien no se
postuló, que es lo que cerró H1. Para hacerlo bien hace falta que cada joven
acepte ser visible (una columna de consentimiento en `perfiles` y una política
que la mire). Queda como mejora futura (`arquitectura.md` §7.11).

### 5. «Habilidades declaradas», en violeta

**Decisión.** En las pantallas de empresa las habilidades se llaman
«habilidades declaradas» y se marcan con `Etiqueta marcada` (violeta, ✓). La
coincidencia se muestra como dos cuentas («3 de 4 habilidades pedidas · 1 de 2
intereses clave»), sin porcentaje.

**Alternativas.** *El turquesa del joven*: en «Recreo» el turquesa dice «ya lo
tenés», y frente a una empresa se leería como habilidad comprobada; la
plataforma no comprueba ninguna. *Un porcentaje combinado*: esconde cuánto
pesa cada parte.

### 6. Mapa con un enlace a OpenStreetMap, coordenadas guardadas

**Decisión.** El evento guarda `direccion`, `latitud` y `longitud`; la
pantalla muestra «Ver en el mapa», un enlace a OpenStreetMap (con el punto si
hay coordenadas, buscando la dirección si no).

**Alternativas.** *Un mapa embebido (Leaflet, Google Maps)*: obliga a abrir la
política de contenido y hace que el navegador de cada visitante le pida datos
a un tercero; Google Maps además pide clave y facturación. *Solo dirección,
sin coordenadas*: no alcanza para el mapa único de eventos del joven, que es
la mejora siguiente.

### Además

- **El formulario de consultas se sacó** y el canal es un correo
  (`src/lib/contacto.ts`): un formulario que parece enviar y no envía deja a
  alguien esperando. Se sacaron también los enlaces a GitHub del pie, Contacto
  y Legales.
- **«Cómo funciona» no se le muestra a la empresa con sesión** (menú, pie,
  middleware): es la presentación para quien todavía no tiene cuenta.
- **Interfaz: «Recreo»**, por coherencia con las pantallas del joven, aunque
  el pedido original describía la paleta anterior.

## 2026-10-06 — Los datos de cada joven los ven él y las empresas a las que se postuló

**Decisión.** `perfil_tags`, `perfil_habilidades` y `formaciones` dejan de
leerse con `using (true)`: cada joven ve lo suyo, y una empresa ve los de un
joven solo mientras tenga una postulación no cancelada a una vacante suya
(`es_postulante_de_mi_empresa`). `resenias` la leen quien la escribió y la
empresa reseñada. `perfiles_publicos` queda en `id` y `nombre_usuario`, de
solo lectura. Para la ficha de institución se agrega `formaciones_publicas`
(institución y título, sin `perfil_id`). Migración
`db/migraciones/003-h1-datos-de-jovenes.sql`; hallazgos H1, H6 y H13 de
`docs/publicacion-y-seguridad.md`.

**Por qué ahora.** La app se publica en internet y el registro está abierto
y se autoconfirma: "con sesión" equivalía a "cualquiera". La auditoría
encontró además que, con los privilegios por defecto de Supabase, la vista
`perfiles_publicos` dejaba modificar perfiles sin sesión (H13).

**Alternativas consideradas.**

- *Mantener la lectura entre usuarios (RF2.5) y la de reseñas (RF8.2).* Es lo
  que pedía la especificación, pero ninguna pantalla actual muestra datos de
  otro joven ni reseñas, así que cerrar no rompe nada y abrir expone a todos.
  Cuando exista la pantalla, se abre lo que esa pantalla necesite.
- *Que la empresa vea a quien se postuló aunque haya cancelado.* Descartado:
  cancelar es retirar la postulación, y con ella el permiso de verlo.
- *Darle a la empresa también la fila de `perfiles` del postulante.* Ninguna
  pantalla la usa todavía (el panel solo cuenta postulaciones); se agrega con
  la lista de postulantes.
- *Reemplazar `perfiles_publicos` por una función `nombre_usuario_ocupado()`.*
  Expone menos (ni ids ni nombres de usuario), pero cambia el código del
  registro. Queda como mejora; mientras Supabase no se publique, la vista
  mínima alcanza.

---

## 2026-09-27 — Sistema de diseño «Recreo»: identidad a partir del logo oficial

**Decisión.** Se reemplaza la dirección «ficha técnica» por el sistema
«Recreo», aprobado sobre una página de muestras y una demo de portada:

- **Paleta que nace del logo oficial (versión 3).** Violeta del logo
  (`#8C66FA`) como color de marca; turquesa del logo (`#19DDD2`) para «esto ya
  lo tenés»; mandarina (`#F25C1A`) solo en el botón principal. Neutros de base
  (papel `#F7F6FB`, tinta `#1E1A38`). Donde el violeta o el turquesa se usan
  como texto, van en versiones oscuras que cumplen AA (`#6541E0`, `#0A7A73`).
  Contrastes medidos en `src/lib/diseno/tokens.ts`.
- **Una sola paleta**: se saca el selector de cinco colores de Ajustes.
- **Tipografía Red Hat** (Display para títulos, Text para leer).
- **Tema**: sigue al sistema por defecto; un botón visible en el encabezado
  lo cambia a mano (sistema → claro → oscuro) y se recuerda en el navegador.
- **Navegación**: un solo menú por tipo de cuenta, sin barra lateral; en el
  teléfono, pestañas abajo para el postulante. La empresa no ve Empleos ni
  Eventos. El encabezado se vuelve una cápsula de vidrio al bajar.
- **Movimiento**: 200 ms al abrir y 150 ms al cerrar en toda la app; cambio de
  pantalla con `document.startViewTransition`; filtros con indicador que se
  desliza; los anillos del isotipo se unen al postularse; esqueletos de carga.
- **Portada narrativa** con GSAP 3.13 + ScrollTrigger + Lenis, solo en la
  página principal.

**Alternativas consideradas.**

- *Mantener «ficha técnica» (verde pino y ámbar, casi sin radio).* Coherente,
  pero se leía como una oficina de registro: distante para alguien de 19 años
  y «hecha por IA» según el pedido.
- *Rondas anteriores del equipo* (rama `docs/propuestas-diseno-v2-v6`): azul
  cielo (no se distinguía de cualquier dashboard, y es el color de LinkedIn),
  teal (competía con el verde de éxito), violeta con Space Grotesk (cansaba en
  texto largo), crema con serif y terracota (el estilo más asociado al diseño
  generado), celeste con IBM Plex (sobrio pero frío).
- *Primera versión de «Recreo» con lima y un logo nuevo.* Se descartó al
  aparecer el logo oficial: la paleta tenía que nacer de él, y el logo lo
  decide el equipo.
- *Transiciones con `experimental.viewTransition` de Next 15.5.* Es
  experimental; `EnlaceTransicion` usa la API del navegador directamente y
  navega normal donde no existe.
- *Animaciones de CSS ligadas al scroll (`animation-timeline`) en la portada.*
  Sin peso extra, pero no andan en Firefox ni en Safari que sigue en uso, y
  fijar una sección mientras se transforma pide JavaScript. GSAP (28 KB),
  ScrollTrigger (18 KB) y Lenis (5 KB) comprimidos se cargan con `import()`
  solo en la portada.

**Motivo.** El público son jóvenes y la plataforma tiene que ser creíble para
las empresas: la calidez va en los acentos y en los detalles (el logo, los
anillos, los textos cercanos), y la seriedad en los neutros, la jerarquía y
la accesibilidad. Que la paleta salga del logo hace que marca y producto se
lean como una sola cosa.

**Consecuencias y cosas que quedan escritas acá a propósito.**

- **El logo en SVG es una reconstrucción.** `public/marca/*.svg` se redibujó a
  partir de la lámina `LOGO_LINKYOUTH.jpg` (versión 3), midiendo la geometría
  y los colores sobre la imagen; el texto es Plus Jakarta Sans 800 convertida
  a trazos (licencia OFL), la más parecida a la lámina. Si aparecen los
  archivos originales del diseñador, reemplazan a estos. **La lámina JPG no
  se versiona**: es una referencia.
- **Las opiniones de la portada son de ejemplo.** No hay personas usando
  LinkYouth todavía; cada tarjeta dice «Ejemplo · no es una opinión real» y
  los nombres son «[Nombre de ejemplo]». Se reemplazan por opiniones
  verdaderas, con permiso de quien las da.
- **Fotos reales que faltan** (hoy son `FotoProvisional`, rotuladas):
  jóvenes estudiando juntos en la universidad; el equipo de una empresa
  uruguaya recibiendo a su pasante; un taller de LinkYouth en la Universidad
  de Montevideo; el equipo de LinkYouth; una captura real de la ficha en el
  teléfono; una persona joven mirando búsquedas en la computadora; un primer
  día de trabajo; jóvenes en una feria de empleo. Nada de fotos de banco.
- **El panel de empresa solo lee.** Muestra búsquedas, postulaciones
  recibidas y eventos con las políticas de RLS existentes. Publicar (RF3.1) y
  responder postulaciones (RF3.4) quedan pendientes en `docs/plan.md`.
- **Contacto es honesto.** No hay casilla ni tabla para consultas: la página
  lo dice y ofrece el repositorio como canal. Hace falta un correo del equipo.
- **Redes**: el pie solo enlaza el repositorio, la única que existe.
- **El encabezado progresivo usa `requestAnimationFrame` y no ScrollTrigger.**
  Con ScrollTrigger habría que cargar GSAP en toda la app para un solo efecto;
  un cálculo por cuadro que escribe `--p` hace lo mismo sin dependencias. El
  progreso se deriva siempre de `window.scrollY`, así que no hay estado que
  pueda quedar trabado.
- **Los logos de la cinta «Quiénes publican» son de ejemplo.** Las empresas
  de prueba no tienen logo y ninguna empresa real autorizó a mostrar el suyo:
  la cinta dibuja una marca de ejemplo con las iniciales y lo dice debajo.
  Alcanza con **una** marca provisoria para que el aviso aparezca, aunque
  otras empresas ya tengan logo (2026-09-29): se descartó avisar solo cuando
  todos son provisorios, porque dejaba marcas inventadas sin anunciar.
  **Mostrar el logo real de una organización requiere su autorización
  expresa**, por escrito, antes de cargarlo en `empresas.logo_url`.
- **«Mantener la sesión iniciada» sin tocar Supabase.** `@supabase/ssr` escribe
  las cookies de sesión con 400 días de duración. Sin la casilla, el login
  deja una cookie de sesión `ly-recordar=0`, y mientras exista, el cliente del
  servidor y el middleware escriben las cookies de Supabase sin `maxAge` ni
  `expires` (`src/lib/supabase/sesion.ts`): se borran al cerrar el navegador,
  también cuando el middleware renueva el token. Se descartó acortar la
  duración del token en Supabase, porque afectaría a todas las cuentas por
  igual, y guardar la preferencia en `localStorage`, porque el servidor no la
  ve. La cookie no lleva `secure` porque la app también se sirve por HTTP en la
  red interna, igual que las de Supabase.
- **Las pestañas «Busco trabajo» y «Soy empresa» del login no deciden a dónde
  se entra.** Lo decide `cuentas.tipo` (RF1.2). Si no coinciden, se entra
  igual a la sección que corresponde, con un aviso (`avisoPorPestana`). Así la
  pestaña no se puede usar para entrar a la mitad equivocada.
- **Los visitantes sin sesión no ven el botón de tema**: siguen al sistema. El
  botón es de la cuenta.
- **El tema se recuerda por navegador**, no por persona. Para que siga a la
  cuenta en todos los dispositivos habría que guardarlo en `perfiles`.

---

## 2026-09-26 — Empleos y eventos se leen sin sesión; lo que piden los avisos se reabre

**Decisión.** `/empleos`, el detalle `/empleos/[id]` y `/eventos` se leen sin
sesión. Lo que pide cuenta es postularse o inscribirse: sin sesión esos botones
llevan a `/registro?next=…` y, con la cuenta creada, se vuelve a la vacante o
al listado de eventos. Para que el aviso se lea completo, `vacante_tags_publicos`,
`vacante_habilidades` y `evento_tags` vuelven a estar abiertas a `anon`. **Esto ajusta lo hecho en el
PR #6**, que las había cerrado con `to authenticated` junto con las tablas de
datos de personas. Los tags ocultos (`vacante_tags_ocultos`) siguen cerrados.

**Qué dicen los requerimientos.** Nada obliga a tener sesión para ver
vacantes o eventos, y nada lo permite explícitamente. RF3.1.8 dice que la
vacante publicada «queda visible para los usuarios individuales», que se lee
como a quién va dirigida —postulantes, no empresas— y no como una prohibición
para visitantes. RF3.5 y RF4.4 filtran «por tags/intereses del usuario»: la
personalización necesita un perfil; el listado, no. RF3.6 y RF4.5 —postularse,
inscribirse— sí son acciones de un usuario. RNF5 exige que los tags ocultos no
se expongan «ni siquiera a través de la API».

**Alternativas consideradas.**

- *Dejar las dos pantallas detrás del login*, como estaban. Era lo que
  generaba el problema de navegación que motivó el cambio: «Ver búsquedas
  abiertas», «Empleos» y «Eventos» mandaban a `/login` a alguien que solo
  quería ver qué hay, sin explicarle por qué.
- *Llevar esos botones directo a crear cuenta con un mensaje.* Es honesto,
  pero pide la cuenta antes de mostrar nada: la persona tiene que registrarse
  para saber si le interesa registrarse.
- *Abrir las pantallas pero dejar cerradas las etiquetas.* Las vacantes
  llegarían sin decir qué piden y los eventos sin sus temas: justo lo que una
  persona mira para decidir si le sirve.

**Motivo.** Lo que S-3 cerró fue el padrón: datos de personas unidos por
`perfil_id`. `vacante_tags_publicos`, `vacante_habilidades` y `evento_tags` no
tienen nada de eso: dicen qué pide un aviso que la propia empresa publicó para que se lea, igual
que `vacantes` y `eventos`, que ya estaban abiertas. Cerrarlas no protegía a
nadie; solo dejaba el aviso incompleto. Los tags ocultos son otra cosa —el
criterio interno de la empresa, que RNF5 manda no mostrar— y su política sigue
exigiendo ser la empresa dueña.

**Consecuencia.**

- Sin sesión no hay compatibilidad: el feed se ordena por fecha, no muestra el
  porcentaje —un «0 %» en cada fila diría algo falso— y ofrece crear la cuenta
  para verlo.
- `db/verificar-raspado-anonimo.sh` lista qué tiene que estar abierto y qué
  cerrado, y falla en los dos sentidos.
- El `next` del login viene de la URL, así que `destinoSeguro()` solo acepta
  rutas internas: si no, `/login?next=https://…` sería un redirector abierto.
  Y como el `redirect()` de una Server Action no pasa por el middleware,
  `iniciarSesion` y `registrarse` comprueban además que la ruta sea de la
  mitad de la aplicación que le toca a la cuenta.
- `vacante_habilidades` no estaba en la primera versión de este cambio. La
  prueba en el navegador mostró la consecuencia —sin sesión, la vacante
  mostraba sus tags pero ninguna de las habilidades que pide— y se sumó con el
  mismo criterio: es un dato del aviso, no de una persona. Lo que sí queda
  cerrado es `perfil_habilidades`, qué habilidades declaró cada persona.

---

## 2026-09-26 — Los catálogos `tags` y `habilidades` son públicos a propósito

**Decisión.** De las nueve políticas de «lectura pública» que alcanzaban a
`anon` (S-3), se cierran siete con `to authenticated`: `perfil_tags`,
`perfil_habilidades`, `formaciones`, `vacante_tags_publicos`,
`vacante_habilidades`, `evento_tags` y `resenias`. Las de `tags` y
`habilidades` quedan sin cláusula `to`, abiertas también para quien no tiene
sesión.

**Alternativas consideradas.**

- *Cerrar las nueve, como proponía la primera versión del arreglo.* Se probó
  contra la base: con el cambio, `anon` ve 0 de 36 tags y 0 de 20
  habilidades. `/registro` lee el catálogo sin sesión (`obtenerCatalogos()`),
  recibe una lista vacía, cae al catálogo de ejemplo y `SelectorIntereses`
  deshabilita la selección porque esos ids no existen en la base. Nadie
  podría elegir los cinco intereses que exige RF1.1.11, o sea, nadie podría
  registrarse.
- *Cerrar las nueve y servir el catálogo del registro desde el servidor* con
  una función `security definer` o la clave de servicio. Funciona, pero agrega
  una puerta con privilegios elevados para proteger algo que no necesita
  protección, y el resultado para `anon` es el mismo: ver la lista.

**Motivo.** Lo que S-3 cerraba era el *padrón*: quién es cada persona, qué le
interesa, qué sabe hacer, dónde estudió y qué dijeron de ella, todo unido por
`perfil_id`. `tags` y `habilidades` no llevan `perfil_id` ni ningún dato de
una persona. Son la lista fija de opciones (36 y 20 filas), cargada por seed y
sin escritura desde la app; es lo mismo que cualquiera ve en pantalla al abrir
el formulario de registro. Abrirlos no expone a nadie. Lo que sí revela algo
—qué persona eligió qué opción— vive en `perfil_tags` y `perfil_habilidades`,
y esas dos quedan cerradas.

**Consecuencia.** `db/verificar-raspado-anonimo.sh` controla las dos cosas: que
las siete tablas con datos de personas no se vean sin sesión, y que los dos
catálogos *sí* se vean. Si alguien «completa» el arreglo cerrando también los
catálogos, el script falla y avisa que se rompe el registro. Si alguna vez un
catálogo pasara a llevar datos de una persona —por ejemplo, etiquetas creadas
por los usuarios—, esta decisión deja de valer y hay que revisarla.

---

## 2026-09-15 — Cero filas es error al editar, y éxito al prender o apagar una etiqueta

**Decisión.** Toda escritura termina en `.select(…)`. `actualizarPerfil` y
`cancelarPostulacion` devuelven error cuando no se tocó ninguna fila. Las
cuatro acciones de etiquetas, no: ahí cero filas es un éxito.

**Alternativas consideradas.**

- Tratar cero filas como error en las seis, por simetría.
- Dejar las etiquetas como estaban, sin `.select(…)`.

**Motivo.** La asimetría no es un descuido. Editar el perfil o cancelar una
postulación son operaciones sobre una fila concreta: si no se tocó ninguna, la
operación no ocurrió y decir «Perfil actualizado.» es mentir. Prender o apagar
una etiqueta es otra cosa: la operación describe un estado final, no un cambio.
Sacar una etiqueta que ya no estaba deja el perfil exactamente como lo pidió el
clic.

Tratarlo como error ahí rompe algo concreto. `SelectorTags` mantiene estado
optimista, y revierte la etiqueta si la acción falla. Con cero filas como
error, un doble clic haría que la interfaz apagara una etiqueta que en la base
quedó bien — que es exactamente el problema que ya evita la absorción del
`23505` del lado del insert. La simetría bonita rompería la pantalla.

Dejarlas sin `.select(…)` se descartó porque la idempotencia pasaba de
casualidad: nadie miraba las filas, y funcionaba porque `error` venía en
`null`. Ahora está escrita y comentada.

**Consecuencia.** Las consultas de etiquetas seleccionan `perfil_id` y no `id`:
`perfil_tags` y `perfil_habilidades` tienen clave compuesta y no tienen columna
`id`. Un `.select("id")` copiado de las acciones de formación fallaría.

---

## 2026-09-15 — El medidor de contraseña usa rojo, amarillo y verde

**Decisión.** Agregar tres tokens —`--ly-fuerza-baja`, `--ly-fuerza-media`,
`--ly-fuerza-alta`— fuera de la paleta de cinco valores, usados únicamente por
el medidor de contraseña, y acompañados siempre de la palabra «Débil», «Media»
o «Fuerte».

**Alternativas consideradas.**

- Pintar la barra con `acento` y variar cuánto se llena, sin cambiar de color.
- Usar el ámbar de `senal` para el nivel intermedio.
- Sustituir la barra por una lista de requisitos con marcas de verificación.

**Motivo.** La primera es la más fiel al sistema y la peor para lo que el
medidor tiene que comunicar: llenar más o menos una barra del mismo color dice
«vas por la mitad», no «esto es riesgoso». El semáforo es una convención que la
gente ya sabe leer sin que nadie se la explique, y esta es la única pantalla de
la aplicación donde hace falta comunicar riesgo.

La segunda queda descartada por la regla del ámbar: `senal` significa
«acreditado» y aparece dos veces en toda la aplicación. Usarlo acá lo
convertiría en decoración y le sacaría el significado en los dos lugares donde
sí lo tiene.

La tercera se hace igual —la lista de requisitos está debajo de la barra— pero
sola no alcanza: leer tres renglones para saber si la contraseña sirve es más
trabajo que mirar una barra.

Los tokens quedan encerrados en el medidor por la misma razón que el ámbar: si
aparecen en otro lado, dejan de significar. Y el color nunca va solo, porque
quien no distingue el rojo del verde tiene que poder leer lo mismo
(WCAG 1.4.1).

---

## 2026-09-15 — La institución educativa se identifica por su nombre

**Decisión.** Derivar el identificador de `/institucion/[id]` del nombre de la
institución, y decir en la propia pantalla que la ficha está incompleta.

**Alternativas consideradas.**

- Agregar una tabla `instituciones` a `db/schema.sql`, con logo y clave
  estable, y apuntar `formaciones` a ella.
- No enlazar la institución: dejarla como texto, que es lo que era.

**Motivo.** La primera es la solución correcta y es una decisión de esquema. El
equipo fijó que `db/schema.sql` es el esquema que se mantiene, y agregarle una
tabla desde una tarea de interfaz lo convierte en algo que cada uno extiende
cuando le hace falta — el mismo criterio que se aplicó a las columnas de
salario y al formulario de consultas.

La segunda deja la pantalla más honesta pero menos útil: la institución es
justamente el dato que alguien quiere seguir para ver quién más estudia ahí.

El identificador derivado es lo que se puede hacer sin tocar el esquema, con
dos límites que quedan escritos en la pantalla y en la deuda 7.8: dos grafías
del mismo lugar son dos instituciones, y el enlace no es permanente.

---

## 2026-09-15 — El tipo de cuenta se exige por existencia de fila, no por `cuentas.tipo`

**Decisión.** Las políticas de insert exigen el tipo de cuenta con
`exists (select 1 from perfiles where id = auth.uid())` del lado individual, y
la inversa contra `empresas` del lado empresa. No se consulta `cuentas.tipo` ni
se agrega ninguna función a la base.

**Alternativas consideradas.**

- Consultar `cuentas.tipo` desde cada política.
- Una función `es_individual()` / `es_empresa()` con `security definer`.
- Dejarlo solo en el código, en un guardia por acción.
- El tipo como claim del JWT, con un auth hook de Supabase.

**Motivo.** El disparador `validar_tipo_cuenta` de `db/schema.sql` ya garantiza
que una cuenta tiene fila en `perfiles` **o** en `empresas`, nunca en las dos.
Con esa garantía, «existe mi fila en `perfiles`» y «soy individual» son la
misma proposición, así que preguntarle a `cuentas.tipo` es consultar una tabla
de más para obtener un dato que la tabla de destino ya contiene.

Leer `cuentas` tiene además un problema propio: su RLS limita cada fila a su
dueño, que es justamente lo que obligó a que `cuenta_activa()` fuera
`security definer`. Preguntar por `perfiles` y `empresas` no necesita ese
rodeo, porque las dos políticas de lectura involucradas dejan ver la fila
propia y esa es la única que la subconsulta mira. Menos superficie
`security definer` es menos superficie que auditar.

La función nueva se descartó por lo mismo: encapsular un `exists` de una línea
que se usa en siete políticas no agrega ninguna garantía, y sí agrega un objeto
más al esquema y un salto más al leerlo.

Dejarlo solo en el código estaba descartado de entrada por `CLAUDE.md`: el
control de acceso vive en la base. El guardia de `src/lib/acciones/sesion.ts`
existe igual, pero no decide —traduce el rechazo a una frase y cubre el caso
que RLS no puede informar, que es el `update` sobre cero filas—.

El claim en el JWT es la respuesta correcta si esto llega a pesar: resuelve el
tipo sin tocar la base. Hoy no se justifica —es una consulta por escritura, y
el middleware ya paga una por navegación— y agregarlo obliga a manejar la
invalidación del token cuando el tipo cambia. Queda anotado como salida, igual
que en `src/middleware.ts`.

**Consecuencia.** Las tablas hijas no repiten la condición: `evento_tags` y las
tres de vacante ya exigen ser dueño del evento o de la vacante, y con estas
políticas una vacante o un evento solo puede tener dueño empresa. `resenias`
queda cubierta por la misma cadena, porque exige una postulación previa y
`postulaciones.perfil_id` apunta a `perfiles`.

Las tres políticas del alta (`cuentas_creo_la_mia`, `perfiles_creo_el_mio`,
`empresas_creo_la_mia`) quedan sin la condición a propósito: exigir una fila
que el propio insert está creando dejaría a todo el mundo afuera del registro.

---

## 2026-09-14 — El catálogo lleva `id`; `PerfilCompleto` sigue llevando nombres

**Decisión.** `obtenerCatalogos()` devuelve `{ id, nombre }` porque las
acciones escriben `perfil_tags` y `perfil_habilidades`, que guardan `id`.
`PerfilCompleto.tags` y `.habilidades` quedan como `string[]`.

**Alternativas consideradas.**

- Pasar `PerfilCompleto.tags` a `{ id, nombre }[]`, que era el plan inicial.
- Resolver nombre → `id` dentro de cada acción, con una lectura extra por clic.

**Motivo.** `PerfilCompleto.tags` no lo consume solo el perfil: también
`/empleos` y `/inicio` se lo pasan a `TarjetaVacante` como `tagsPerfil` para
marcar qué coincide, y `TarjetaUsuario` cuenta habilidades. Ninguno de esos
usos necesita el `id` —comparan y muestran nombres— así que cambiarles la
forma era tocar cinco archivos fuera del perfil, más `ejemplos.ts`, para que
todos hicieran `.map((t) => t.nombre)` y volvieran al punto de partida.

El `id` viaja donde hace falta, que es el catálogo. La correspondencia entre
los dos lados la garantiza el esquema: `tags.nombre` y `habilidades.nombre`
son `unique`, así que marcar por nombre la opción ya elegida no es una
heurística, es una clave.

Resolver nombre → `id` en la acción se descartó por lo obvio: agrega una
lectura por clic para recuperar un dato que el componente ya tenía.

**Consecuencia.** El día que exista el perfil público de otro usuario (RF2.5),
que es de solo lectura, le sirve `PerfilCompleto` tal cual está: muestra
nombres y no necesita ningún `id`.

---

## 2026-09-13 — Latencia de ~800 ms en producción: investigada, no resuelta

**Decisión.** No seguir optimizando la latencia de navegación por ahora.

**Diagnóstico.** Cada navegación hace dos viajes de red **en serie** a Supabase
—uno del middleware y otro de la página—, cada uno con unos 240 ms de latencia
base por la distancia geográfica a la región us-east-2. Bajar de cinco a dos las
llamadas a `auth.getUser()` en `/inicio` no movió la latencia percibida —una
mejora del 2 %, dentro del ruido de la medición— porque esas llamadas ya corrían
en paralelo, no en serie. Sí redujo el consumo de la API de Auth, que importa
por los límites del plan gratuito.

**Alternativas consideradas.**

- Un Auth Hook que escriba el tipo de cuenta como claim del JWT, para que el
  middleware no consulte `cuentas` en cada pedido.
- Que la página no revalide la sesión que el middleware ya validó.
- Mover el proyecto de Supabase a una región más cercana.

**Motivo.** El Auth Hook toca la pieza de seguridad más sensible del proyecto.
Saltear la revalidación de la página baja la garantía que da `auth.getUser()`,
que es justamente verificar el token contra el servidor. Cambiar de región es
una migración grande para un beneficio chico en esta etapa —y la decisión de
us-east-2 ya está tomada por otros motivos.

Unos 800 ms no son un problema real para un proyecto de facultad con usuarios
de prueba. Se revisita si aparecen usuarios reales quejándose de lentitud.

---

## 2026-09-12 — Un selector en `/registro`, no una ruta aparte para empresa

**Decisión.** Los dos registros comparten la ruta `/registro` y se eligen con
`?tipo=empresa`. La página decide qué formulario montar; el resto de la pantalla
—encabezado, tarjeta, enlace a iniciar sesión, layout de `(auth)`— es uno solo.

**Alternativas consideradas.**

- Una ruta `/registro/empresa` con su propia página.
- Un interruptor con `useState` dentro de la página.

**Motivo.** Los dos formularios no comparten casi ningún campo: individual pide
nombre, apellido, nombre de usuario, país y fecha de nacimiento; empresa pide
razón social, rubro, descripción y logo. Lo único común es el correo y la
contraseña. Pero sí comparten *todo lo que los rodea*, y eso es lo que una ruta
aparte obliga a duplicar: el `h1`, la `Tarjeta`, el pie con el enlace a `/login`
y la metadata. Duplicarlo significa que el día que cambie el texto del pie haya
que acordarse de dos archivos.

El interruptor con estado del cliente queda descartado por la regla de
`CLAUDE.md`: filtros y pestañas se hacen con enlaces y `searchParams`. Así
`/registro?tipo=empresa` es una URL que se puede compartir, el botón de atrás
funciona, y la página sigue siendo un Server Component.

---

## 2026-09-12 — El tipo de cuenta se lee de `cuentas`, nunca de `user_metadata`

**Decisión.** Tanto el middleware como el login resuelven a qué mitad de la
aplicación pertenece una sesión consultando `cuentas.tipo`, con una consulta por
request.

**Alternativas consideradas.**

- Guardar `tipo` en `user_metadata` durante el `signUp` y leerlo del JWT, sin
  tocar la base.
- Un claim propio en el JWT, vía auth hook de Supabase.

**Motivo.** `user_metadata` lo puede reescribir el propio usuario con
`auth.updateUser`. Usarlo para decidir a qué panel entra sería dejar que cada
uno elija su tipo de cuenta: un postulante se pone `tipo: 'empresa'` y entra al
panel. `cuentas.tipo` en cambio está protegido por RLS y por el disparador
`validar_cambio_tipo_cuenta`, que bloquea el cambio cuando la cuenta ya tiene
fila de detalle.

Los datos del formulario **sí** siguen viajando en `user_metadata`, porque son
el acarreo que permite completar el alta en el primer login cuando la
confirmación por correo está activada. La distinción importa: metadata como
transporte de un formulario está bien; metadata como fuente de permisos, no.

El claim propio en el JWT es la solución correcta a escala y evita la consulta
por request, pero exige configurar un auth hook en el proyecto de Supabase, que
es infraestructura que hoy no está. Queda anotado en el código con un comentario
`ponytail:` que nombra el techo y el camino de salida.

---

## 2026-09-12 — El perfil público se sirve por una vista, no por la tabla

**Decisión.** Sacar `perfiles` del alcance de lectura de la API y publicar
RF2.5 a través de la vista `perfiles_publicos`, que enumera las columnas
publicables. La política de la tabla queda en `to authenticated using
(auth.uid() = id)`: solo la fila propia, completa.

**Alternativas consideradas.**

- Dejar la política como estaba y confiar en que la aplicación no pida
  `fecha_nacimiento`.
- `grant select (columnas...) on perfiles` en vez de una vista.
- Mover `fecha_nacimiento` a una tabla aparte con su propio RLS.

**Motivo.** RLS es control por fila, no por columna: `perfiles_lectura_publica
using (cuenta_activa(id))` autorizaba la fila entera, y sin cláusula `to`
alcanzaba también al rol `anon`. Como la `ANON_KEY` viaja al navegador por
diseño, cualquiera podía consultar PostgREST directamente y bajar nombre,
apellido, país y fecha de nacimiento exacta de todos los usuarios. Que la
interfaz no muestre esa columna no es una defensa: el atacante no usa la
interfaz.

El `grant` por columnas resuelve lo mismo en una línea, pero no deja rastro
legible de *qué* es público y *por qué*: el día que alguien agregue una columna
a `perfiles`, el grant no se actualiza solo y nadie se entera. La vista enumera
las columnas de forma explícita, así que sumar una es una decisión visible en el
diff. Mover la columna a otra tabla era la solución más limpia en el papel, pero
obliga a un join en el registro y a tocar el constraint
`perfiles_mayor_de_edad`, que hoy vive en la misma fila.

La vista corre sin `security_invoker`, es decir con los permisos de su dueño, y
por lo tanto saltea el RLS de `perfiles`. Es deliberado: es lo que permite que un
visitante sin sesión lea un perfil público ahora que la tabla se limita a la fila
propia. El filtro de cuentas dadas de baja, que antes hacía la política, pasó al
`where` de la vista.

---

## 2026-09-12 — Los estados finales de una postulación se bloquean en un disparador

**Decisión.** Agregar `postulacion_transicion_valida()`, un disparador `before
update` que impide salir de `aceptada`, `rechazada` o `cancelada`.

**Alternativas consideradas.**

- Extender el `with check` de `postulaciones_transiciones_permitidas`.
- Resolverlo en las acciones de servidor, antes del `update`.

**Motivo.** La política acota el estado *destino* pero no puede mirar el
*origen*: RLS no ve `OLD`. Sin eso, la empresa dueña de la vacante podía tomar
una postulación que el postulante había cancelado (RF3.8) y moverla a
`aceptada`, reabriendo un proceso del que la persona se había bajado y
disparándole la notificación de RF6.2 por un cambio que nunca pidió. Una
política que leyera `postulaciones` para comparar caería en «infinite recursion
detected in policy for relation», el mismo motivo por el que
`postulacion_identidad_inmutable` ya es un disparador y no una política.

Resolverlo en las acciones de servidor lo dejaría afuera de la base, contra la
regla de `CLAUDE.md` de que el control de acceso vive en la base: una empresa con
la `ANON_KEY` puede llamar a PostgREST sin pasar por la aplicación.

## 2026-09-12 — La navegación angosta se desplaza, no se pliega

**Decisión.** En viewports angostos la barra lateral sigue siendo una fila de
cinco secciones que se desplaza en horizontal, ahora con `min-w-0` en el `nav`
y `snap-x snap-mandatory` en la lista. La marca y «Cerrar sesión» comparten
una fila arriba; en `lg` el `lg:contents` del contenedor la disuelve y `order`
devuelve cada pieza a su lugar.

**Alternativas consideradas.**

- Un menú desplegable para las cinco secciones en angosto.
- Una barra inferior fija estilo aplicación nativa.
- Dejar la fila como estaba y sumarle solo una señal visual de que hay más.

**Motivo.** El desplegable esconde cinco destinos detrás de un toque y obliga
a un componente con estado, `aria-expanded` y cierre por foco: es la opción
que más código agrega y la que más se aleja del layout de escritorio, que era
justamente lo que había que tocar lo menos posible. La barra inferior es mejor
ergonomía en un teléfono, pero es otra estructura, no una variante de esta.
La tercera no arreglaba nada: el problema no era solo la falta de señal, era
que la fila estiraba la grilla entera a 574 px y el desplazamiento horizontal
ni siquiera existía.

Queda anotado que el `scroll-snap` ordena el recorrido pero no agrega por sí
mismo una señal de que hay más secciones: en escritorio la da la barra de
desplazamiento, en un teléfono la da el recorte del último ítem visible. Si
hace falta algo más explícito, es un degradado en el borde derecho, no un
cambio de estructura.

---

## 2026-09-12 — El borde sube a contraste de control, y arrastra al hover

**Decisión.** `--color-borde` pasa de `#e5e7eb` a `#7d8795` (3.64:1 contra
blanco, 3.39:1 contra el lienzo) y `--color-borde-fuerte` de `#d1d5db` a
`#667085`.

**Alternativas consideradas.**

- Un token nuevo solo para los bordes que delimitan controles, dejando
  `--color-borde` como está para los separadores decorativos.
- Subir solo el borde del campo en la clase `CAMPO` y el de `.tarjeta`.

**Motivo.** Las dos alternativas evitan que los separadores internos de las
tarjetas se vuelvan más pesados, que es el efecto secundario real de este
cambio. Se descartaron porque los dos lugares que hay que arreglar —el campo
y la tarjeta— leen del mismo token, y partirlo en dos obliga a decidir, en
cada uso de `border-borde` que ya existe, a cuál de los dos pertenece. Esa
clasificación es parte de la revisión de tono que está pendiente; hasta que se
haga, un solo token que cumple 1.4.11 es preferible a dos que hay que repartir
a mano.

`--color-borde-fuerte` no se tocó por gusto: es el hover de esos mismos
bordes. Si `borde` sube y `borde-fuerte` se queda en `#d1d5db`, pasar el
puntero **aclara** el borde en vez de oscurecerlo.

---

## 2026-09-12 — La protección de rutas vive en el middleware

**Decisión.** Controlar el acceso a `(app)/` en `src/middleware.ts`: si hay
credenciales de Supabase y no hay sesión, redirigir a `/login`, salvo en las
rutas de `PUBLICAS` (`/login`, `/registro`). `obtenerPerfilActual` conserva un
`redirect("/login")` propio como segunda barrera.

**Alternativas consideradas.**

- Un chequeo de sesión en cada una de las cinco `page.tsx` de `(app)/`.
- Solo el guard en `obtenerPerfilActual`, sin tocar el middleware.
- Seguir sin protección y confiar en RLS.

**Motivo.** El middleware es el único punto por el que pasan las cinco
pantallas: un guard ahí es un diff más chico que cinco, y no se puede olvidar
al agregar la sexta. Poner el control solo en `obtenerPerfilActual` protegía
`/inicio`, `/empleos` y `/perfil`, pero dejaba `/eventos` y `/postulaciones`
abiertas, que es peor que no tener nada porque parece resuelto. RLS sigue
siendo la defensa de los datos —ninguna de estas rutas podía leer filas
ajenas— pero no impedía que un desconocido recorriera las pantallas y viera
`PERFIL_EJEMPLO` presentado como su propio perfil.

El caso «sin credenciales» queda expresamente afuera del control: sin Supabase
no hay sesión posible, y la regla §2.3 pide que la aplicación se pueda
recorrer igual con los datos de ejemplo.

---

## 2026-09-10 — Los alias del esquema viven en la capa de datos

**Decisión.** Declarar los conjuntos cerrados del esquema (`TipoOportunidad`,
`EstadoPostulacion`, `EstadoFormacion`, `EstadoVacante`, `EstadoEvento`,
`TipoCuenta`) en `src/lib/data/tipos.ts`, cada uno con una constante
`readonly` y una función de estrechamiento que convierte el `string` que
devuelve Supabase.

**Alternativas consideradas.**

- Agregarlos a mano a `src/types/database.ts`.
- Migrar el esquema de `text` + `check` a enums de Postgres, para que
  `gen types` los genere solo.
- Convivir con `string` en toda la aplicación.

**Motivo.** `src/types/database.ts` se regenera con `supabase gen types`: todo
lo que se le agregue a mano se pierde en la próxima corrida, y el que lo
pierda va a ser alguien que no estuvo en esta conversación. Migrar a enums de
Postgres arregla el problema de raíz, pero un enum es caro de cambiar —agregar
un valor es `alter type`, quitarlo obliga a recrearlo— y el equipo ya eligió
`check` a propósito. Convivir con `string` deja pasar `estado === "en_revison"`
sin que nadie se entere: el error tipográfico se descubre en producción.

Las funciones de estrechamiento no lanzan: si aparece un valor que no está en
el conjunto, devuelven un respaldo. Ese caso solo existe si el esquema cambió
y el código todavía no, y en ese momento es mejor una pantalla con un estado
por defecto que una pantalla en blanco.

---

## 2026-09-10 — Un `select` anidado en vez de varias consultas sueltas

**Decisión.** Traer la empresa y las tablas puente de tags y habilidades en el
mismo `select` de la vacante o del evento, y aplanarlas en TypeScript.

**Alternativas consideradas.**

- Una consulta por tabla y componer el resultado con `Map` en la aplicación.
- Crear vistas en la base que devuelvan la fila ya aplanada.

**Motivo.** Los tipos generados traen los metadatos de las claves foráneas, así
que TypeScript infiere la forma del `select` anidado sin ayuda: se pierde el
tipado si uno arma el join a mano. Además evita el problema N+1 sin escribir
nada especial. Las vistas eran la otra opción razonable —de hecho el esquema
descartado las usaba— pero agregan superficie a mantener en SQL y hay que
acordarse de `security_invoker` para que la RLS siga vigente; con el `select`
anidado, cada tabla aplica su propia política sin que haya que recordarlo.

El costo es que las consultas quedan más largas de leer. Se paga.

---

## 2026-09-10 — La interfaz se recorta al esquema, no al revés

**Decisión.** Quitar de las pantallas todo dato que `db/schema.sql` no guarda
—salario, modalidad, ubicación, cupos, nivel de las habilidades, categoría de
los tags, años y acreditación de los estudios, perfiles verificados— en vez de
agregar esas columnas para sostener el diseño.

**Alternativas consideradas.**

- Agregar las columnas al esquema y seguir mostrando todo.
- Dejar los campos en la interfaz con valores fijos o vacíos.

**Motivo.** El esquema está aplicado en Supabase y es el acuerdo del equipo;
cambiarlo desde una tarea de front-end lo convierte en algo que cada quien
extiende cuando le hace falta. Dejar los campos con valores fijos es peor:
una tarjeta que dice «USD 1.500 a 2.000» sin que ese dato exista en ningún
lado es una mentira con formato de dato.

La lista completa de lo que se perdió quedó en `arquitectura.md` §7.1, con el
señalamiento de que salario y modalidad son los dos que más se van a extrañar
en una plataforma de empleo. La decisión de agregarlos es del equipo, y el
camino es el esquema primero.

---

## 2026-09-08 — Next.js en lugar de React solo

**Decisión.** Construir la aplicación con Next.js 15 usando App Router, en
lugar de una SPA de React con Vite y un router del lado del cliente.

**Alternativas consideradas.**

- React + Vite + React Router (SPA pura).
- Remix.
- Astro con islas de React.

**Motivo.** LinkYouth publica avisos de empleo, cursos y eventos: contenido que
tiene que ser indexable y cargar rápido en dispositivos modestos. El renderizado
en servidor de Next.js da SEO y buen primer pintado sin trabajo extra. El App
Router permite leer datos desde Server Components, así las credenciales de
Supabase y las consultas quedan del lado del servidor. Además, los Route
Handlers cubren la necesidad de endpoints puntuales sin montar un servidor
aparte, y el despliegue en Vercel es directo. React solo obligaría a sumar y
mantener por separado router, capa de datos y una solución de SSR.

---

## 2026-09-08 — Supabase en lugar de un backend propio

**Decisión.** Usar Supabase como backend: base de datos PostgreSQL, autenticación
y storage administrados.

**Alternativas consideradas.**

- Backend propio (Node.js/Express o NestJS) con PostgreSQL y un ORM.
- Firebase.
- Otros BaaS sobre PostgreSQL (Appwrite, Nhost).

**Motivo.** El equipo es chico y el objetivo es llegar al MVP sin gastar tiempo
en infraestructura. Supabase entrega auth, base de datos y storage listos para
usar, y expone PostgreSQL de verdad: SQL estándar, claves foráneas y consultas
complejas para el matching por tags, sin quedar atado a un modelo de documentos
como el de Firebase. Row Level Security permite escribir las reglas de acceso
junto al esquema, en un solo lugar. Si en el futuro hace falta migrar, al ser
PostgreSQL estándar el volcado de datos es portable. Un backend propio daría más
control, pero sumaría trabajo de operación que hoy no aporta al producto.

---

## 2026-09-08 — TypeScript en modo strict

**Decisión.** TypeScript con `strict: true` desde el primer commit.

**Alternativas consideradas.**

- JavaScript sin tipos.
- TypeScript con `strict: false` y endurecimiento gradual.

**Motivo.** El dominio tiene muchas entidades relacionadas (postulantes,
empresas, vacantes, tags, tags ocultos, eventos) y el código se genera en buena
parte con asistencia de IA: los tipos son la red que detecta los errores de
integración temprano. El modo strict evita `null` y `undefined` no controlados,
que son la fuente habitual de fallos al leer datos de Supabase. Activarlo desde
el comienzo cuesta poco; endurecerlo después obliga a corregir código ya escrito.
Los tipos de las tablas se van a generar desde el esquema real, así la base de
datos y la aplicación no se desfasan.

---

## 2026-09-08 — Región us-east-2 (Ohio) para la base de datos

**Decisión.** Alojar el proyecto de Supabase en la región **us-east-2 (Ohio)**.
Los datos quedan alojados en Estados Unidos.

**Alternativas consideradas.**

- Regiones de Sudamérica (sa-east-1, São Paulo).
- Regiones de la Unión Europea (eu-central-1, eu-west-1).

**Motivo.** us-east-2 es una de las regiones más estables y económicas de
Supabase, con buena disponibilidad de funciones y soporte. La latencia adicional
frente a São Paulo es aceptable para una aplicación web con este perfil de uso.

**Consecuencia a tener presente.** Los datos personales de los usuarios se
alojan fuera del país. Esto tiene que quedar declarado en la política de
privacidad y en los términos de uso, y hay que revisarlo contra la normativa de
protección de datos personales aplicable antes de salir a producción. Si esa
revisión lo exige, la decisión se revisa y el proyecto se migra a otra región.

---

## 2026-09-09 — Tags y habilidades como catálogos separados

**Decisión.** Modelar los tags (intereses) y las habilidades (conocimientos
técnicos) como dos catálogos separados: las tablas `tags` y `habilidades`, con
sus respectivas tablas puente `perfil_tags` / `perfil_habilidades` y
`vacante_tags_publicos` / `vacante_habilidades`.

**Alternativas consideradas.**

- Una única tabla `tags` con una columna `categoria` que distinga interés de
  habilidad.

**Motivo.** El matching de vacantes (RF3.9) necesita distinguir afinidad
(interés) de competencia (habilidad técnica): son dos señales distintas y pesan
distinto al calcular el puntaje de compatibilidad. Mezclarlas en una sola tabla
con una columna discriminadora degrada esa señal, porque obliga a filtrar por
`categoria` en cada consulta de matching y hace fácil que un error de filtrado
sume un interés como si fuera una competencia comprobada.

---

## 2026-09-09 — Reseñas habilitadas por postulación en cualquier estado

**Decisión.** Puede publicar una reseña de una empresa cualquier perfil que
tenga al menos una postulación a esa empresa, sin importar el estado de la
postulación.

**Alternativas consideradas.**

- Exigir que exista al menos una postulación en estado `aceptada`.

**Motivo.** En una plataforma de primer empleo la mayoría de los usuarios va a
acumular más rechazos que contrataciones. Exigir el estado `aceptada` dejaría la
sección de reseñas vacía durante meses, justo cuando más falta hace para que la
plataforma resulte útil. La experiencia del proceso de selección —tiempos de
respuesta, trato, claridad de la vacante— es información valiosa aunque la
postulación no haya prosperado.

---

## 2026-09-10 — Exclusividad perfil/empresa validada en la base

**Decisión.** Agregar la función `validar_tipo_cuenta()` y los triggers
`perfiles_valida_tipo` y `empresas_valida_tipo` en `db/schema.sql`, para que la
base rechace toda fila de `perfiles` o `empresas` que no coincida con
`cuentas.tipo` o que duplique una cuenta ya registrada en la otra tabla.

**Alternativas consideradas.**

- Confiar en que el código de la aplicación nunca cree ambas filas para la misma
  cuenta.

**Motivo.** Sin esta validación en la base, un bug en el registro podría dejar
una cuenta con datos en las dos tablas, o con `cuentas.tipo` desincronizado de
dónde está realmente su fila. Varias políticas de RLS asumen que `cuentas.tipo`
es siempre correcto, así que una inconsistencia ahí no queda como un dato
prolijo de más: se convierte en un problema de control de acceso. La regla vive
donde no se puede esquivar, sin importar qué cliente escriba.

---

## 2026-09-10 — Endurecimiento del esquema y las políticas RLS

**Decisión.** Cerrar cinco huecos detectados en la revisión de `db/schema.sql` y
`db/politicas.sql`:

1. Fijar `set search_path = public, pg_temp` en todas las funciones, y marcar
   como `security definer` las que validan integridad entre tablas.
2. Extender los triggers de validación de tipo de cuenta a `update`, y bloquear
   el cambio de `cuentas.tipo` cuando la cuenta ya tiene su fila de detalle.
3. Impedir con un trigger que un `update` sobre `postulaciones` cambie
   `perfil_id` o `vacante_id`.
4. Hacer que `cuentas.eliminada` tenga efecto real: las políticas de lectura de
   `perfiles` y `empresas` pasan de `using (true)` a `using (cuenta_activa(id))`.
5. Agregar índices sobre las claves foráneas y sobre el lado inverso de las
   tablas puente.

**Alternativas consideradas.**

- Dejar el `search_path` sin fijar, como estaba: es el valor por omisión y el
  esquema no crea objetos fuera de `public`.
- Resolver la inmutabilidad de `postulaciones` dentro de la propia política de
  RLS, comparando contra la fila existente.
- Filtrar las cuentas dadas de baja en las consultas de la aplicación en vez de
  en la política.
- Dejar los índices para más adelante, cuando haya volumen real que medir.

**Motivo.** Una función `security definer` sin `search_path` fijo es
explotable: quien pueda crear objetos en un esquema que preceda a `public`
secuestra la resolución de nombres y ejecuta código con los permisos del dueño
de la función. El linter de Supabase lo reporta como
`function_search_path_mutable`.

La inmutabilidad de `postulaciones` no se puede expresar en RLS: una política
no ve la fila vieja, y una que consulte su propia tabla para compararla falla
con `infinite recursion detected in policy for relation`. El trigger sí ve
`old` y `new`, así que la regla vive ahí.

Filtrar las bajas en la aplicación deja la regla del lado equivocado: cualquier
consulta que se olvide del filtro expone datos de cuentas dadas de baja, y hoy
`eliminada` no tiene ningún efecto en ninguna parte. La función `cuenta_activa`
es `security definer` porque `cuentas` tiene RLS que limita cada fila a su
dueño: una subquery común solo vería la cuenta propia y ocultaría todos los
demás perfiles.

Los índices no son una optimización prematura en este esquema. Postgres no
indexa las claves foráneas por su cuenta, y varias políticas de RLS ejecutan
`exists (select 1 from vacantes ...)` una vez por fila evaluada: sin índice,
cada lectura de una tabla hija recorre la tabla padre entera. El costo aparece
en la primera demo con datos de prueba, no en producción.

---

## 2026-09-10 — La plataforma es solo para mayores de 18 años

**Decisión.** LinkYouth admite únicamente personas de 18 años cumplidos. La
regla vive en el esquema, como restricción de la tabla `perfiles`:

```sql
check (fecha_nacimiento <= current_date - interval '18 years')
```

**Alternativas consideradas.**

- Admitir desde los 14 años, que es la otra lectura posible del SRS.
- Admitir desde los 14 con consentimiento de un adulto responsable.

**Motivo.** El SRS se contradecía: RF1.1.8 exige edad mayor o igual a 18,
mientras que RNF6 (línea 527) y la sección de Restricciones (línea 551) hablan
de tratamiento de datos personales de menores «a partir de los 14 años». Las
dos cosas no pueden ser ciertas a la vez, y la diferencia no es de detalle:
define quién puede registrarse y bajo qué encuadre legal.

Se resuelve a favor de RF1.1.8. Admitir menores obligaría a un circuito de
consentimiento del adulto responsable, a un tratamiento diferenciado de sus
datos y a revisar la decisión de alojar la base fuera del país con un estándar
más exigente. Nada de eso está en el alcance del MVP, y construirlo a medias
sería peor que no admitir menores.

**Consecuencia.** Las menciones a los 14 años en `docs/01_preamble.md` (líneas
527 y 551) quedan sin efecto. Conviene corregirlas en la próxima revisión del
SRS para que no vuelvan a leerse como un requisito vigente.

---

## 2026-09-11 — El alta se completa en la sesión, no en un disparador

**Decisión.** `registrarse()` crea las filas de `cuentas` y `perfiles` desde
la propia Server Action, con la sesión que devuelve `signUp`. Si el proyecto
de Supabase tiene activada la confirmación por correo, el `signUp` devuelve
usuario pero **no** sesión: en ese caso los datos del perfil quedan guardados
en `user_metadata` y el alta se completa en el primer inicio de sesión.
`completarAlta()` es la misma función en los dos caminos, e ignora el
conflicto por clave primaria, así que llamarla de más no hace nada.

**Alternativas consideradas.**

- Un disparador `on insert on auth.users` con `security definer`, que es el
  patrón que recomienda Supabase.
- Exigir que el proyecto tenga la confirmación por correo desactivada, y
  crear las filas siempre en el registro.
- Guardar el perfil en `user_metadata` y crearlo desde un route handler en
  `/auth/callback`.

**Motivo.** Sin sesión, `auth.uid()` es nulo y las políticas
`cuentas_creo_la_mia` y `perfiles_creo_el_mio` —que exigen `auth.uid() = id`—
rechazan las dos inserciones. Cualquier solución tiene que resolver ese hueco.

El disparador en `auth.users` es la opción más robusta y la que dejaría el
alta atómica, pero obliga a modificar `db/schema.sql`, que esta historia tenía
prohibido tocar. Queda como la mejora natural cuando se decida abrir el
esquema: convierte el alta en una sola operación y elimina la ventana en la
que existe un usuario en `auth.users` sin fila en `perfiles`.

Depender de que la confirmación esté desactivada hace que el registro se rompa
en silencio apenas alguien la active en el panel — y viene activada por
omisión en los proyectos nuevos.

El route handler en `/auth/callback` resuelve el mismo caso, pero agrega una
ruta más para el único momento en que hace falta; el inicio de sesión ya
pasa por la acción que puede hacerlo.

**Consecuencia a tener presente.** Entre el `signUp` y el primer inicio de
sesión existe un usuario en `auth.users` sin fila en `perfiles`. No puede
navegar la aplicación —no tiene sesión—, pero el correo ya quedó tomado. Si
nunca confirma, esa cuenta queda huérfana.

**Consecuencia a tener presente.** El nombre de usuario lo garantiza el
índice único de `perfiles`, que con la confirmación por correo activada se
evalúa recién en el primer inicio de sesión. Para que nadie se entere tan
tarde, `registrarse()` consulta `perfiles` antes del `signUp` y corta ahí el
caso común. Queda la carrera: dos registros simultáneos con el mismo nombre
pasan los dos la verificación, y el segundo choca contra el índice al entrar.

La verificación previa lee a través de `perfiles_lectura_publica`, que filtra
por `cuenta_activa(id)`. Un nombre tomado por una cuenta dada de baja no
aparece, así que la verificación lo da por libre y el choque vuelve a caer en
el índice único. Es el mismo caso raro de siempre, con la misma defensa.

## 2026-10-09 — CSP con nonce por request, no con `'unsafe-inline'` ni hashes

**Decisión.** La Content-Security-Policy se arma en el middleware con un nonce
nuevo en cada request y `'strict-dynamic'`. Next lee el nonce del header del
request y se lo pone a sus propios scripts; el script de tema de `layout.tsx`
lo toma de `x-nonce`. Los estilos quedan con `'unsafe-inline'`.

**Alternativas consideradas.**

- `script-src 'self' 'unsafe-inline'`: no rompe nada, pero no frena un XSS,
  que es para lo que existe la CSP.
- Hashes de los scripts en línea: Next genera scripts distintos en cada
  página (los datos de RSC), así que no hay una lista fija de hashes.
- Empezar con `Content-Security-Policy-Report-Only`: es lo que proponía la
  auditoría del 2026-09-12. Se descartó porque la política se probó antes en
  Chromium real sobre todas las pantallas, sin violaciones.

**Motivo.** Todas las rutas ya eran dinámicas (`ƒ` en el build), así que el
nonce no le cuesta caché a ninguna página. Los estilos en línea no ejecutan
código, y React escribe atributos `style` que no admiten nonce.

## 2026-10-09 — Cookies de sesión: `Secure` solo cuando el request llegó por HTTPS

**Decisión.** Las cookies de Supabase y `ly-recordar` se escriben siempre con
`HttpOnly` y `SameSite=Lax`, y con `Secure` solo si el request llegó por HTTPS
(`X-Forwarded-Proto: https`, que pone Tailscale Funnel y conserva el WAF).

**Alternativas consideradas.**

- `Secure` siempre.
- `Secure` nunca (como estaba).
- Prefijo `__Host-` en el nombre de la cookie.

**Motivo.** La app se usa por dos caminos: HTTPS por el Funnel y `http://` por
la tailnet. Con `Secure` siempre, el navegador descarta la cookie en el acceso
por `http://` y no se puede entrar; sin `Secure`, la cookie podría viajar en
claro si alguien forzara una URL `http://` del dominio público. `__Host-`
exige `Secure` y tiene el mismo problema. `X-Forwarded-Proto` lo pueden
falsificar desde la tailnet, pero lo único que logran es que su propia cookie
salga `Secure` en HTTP: se perjudican solos. Ver `docs/seguridad.md`.

