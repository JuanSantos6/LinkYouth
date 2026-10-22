# Registro de cambios

Todo cambio que toca el código o el esquema deja una línea acá, con el motivo.
Lo más reciente arriba.

**Qué va acá y qué no.** Acá va *qué* cambió y *por qué*, en una o dos líneas.
Las decisiones que tuvieron alternativas reales y merecen quedar
argumentadas van además a [`decisiones.md`](./decisiones.md), y desde acá se
las enlaza. La arquitectura vigente está en
[`arquitectura.md`](./arquitectura.md).

Cada entrada lleva el hash del commit para poder ir al diff.

---

## 2026-10-22 — Sesión, imágenes y panel de empresa

- **Habilidades públicas u ocultas** (migración 008,
  `SelectorDeHabilidades`, `vacante_habilidades_ocultas`): en el formulario
  de búsqueda cada habilidad pedida se marca «Pública» o «Solo vos»
  (RF3.1.6). Antes solo los intereses podían ser ocultos. Por qué una tabla:
  [`decisiones.md`](./decisiones.md), 2026-10-22.
- **Fotos de Unsplash por hotlink** (migración 008, `scripts/fotos/`,
  `src/lib/unsplash.ts`, `src/lib/data/fotos.ts`, CSP): una consulta por
  categoría (seis en total, 48 consultas con los avisos), hoja de contactos por categoría y 41 fotos
  elegidas mirándolas (los 10 jóvenes, portadas de empresa, instituciones,
  eventos, la portada y los estados vacíos), con «Foto de … en Unsplash» y la
  lista en `/legales#fotos`. Avisos de descarga en segundo plano
  (`avisar-descargas.mjs`). La página lee la base, nunca la API; sin foto,
  respaldo propio o avatar con iniciales. Por qué:
  [`decisiones.md`](./decisiones.md), 2026-10-22.
- **Demo más chica**: 10 jóvenes y 5 empresas (14 búsquedas, 29
  postulaciones en los seis estados, 6 eventos, 21 inscripciones, 10
  reseñas), y la recarga carga las fotos de `scripts/fotos/fotos.json` sin
  consultar la API. Las fotos de Pexels de personas y eventos se borraron.
- **La compatibilidad es solo de la empresa** (`FilaVacante`,
  `/empleos/[id]`, `FeedDeVacantes`, textos de la portada y de «Cómo
  funciona»): el joven ya no ve el medidor, las ✓ ni «La que más coincide con
  vos» (RF3.9.2). `Medidor` se borró. e2e en `e2e/compatibilidad.spec.ts`
  (RLS con la clave pública, pantallas del joven y de la empresa, formulario).
- **Con sesión, `/` lleva al panel** (`src/middleware.ts`, `PORTADA` y
  `correspondeA` en `src/lib/navegacion.ts`): la empresa a `/empresa` y el
  joven a `/inicio`. Antes la portada se renderizaba igual y la cabecera de
  una empresa mostraba el menú público («Nosotros», «Cómo funciona»,
  «Búsquedas»…). e2e en `e2e/sesion.spec.ts` para los dos tipos de cuenta.
- **Panel de empresa con jerarquía** (`src/app/empresa/page.tsx`): arriba el
  saludo y las dos acciones (publicar búsqueda, crear evento); después las
  cifras en tarjetas compactas; después «Para revisar», las postulaciones
  nuevas (`ResumenDePanel.nuevosParaRevisar`); y al final el resto. Se veía
  amontonado: mucho texto de ayuda, todo con el mismo peso.
- **Postulantes de una búsqueda agrupados por estado**
  (`src/app/empresa/busquedas/[id]/page.tsx`, `agruparPorEstado`,
  `TarjetaDePostulante`): sin el filtro con desplazamiento horizontal; todos
  los estados a la vista con su contador, tablero por columnas en escritorio
  y secciones plegables en el teléfono. Con el filtro solo se veía un estado
  a la vez y había que deslizar para encontrar los demás.
- **Ficha del postulante en secciones** (`…/postulantes/[postulacionId]`):
  foto, datos y acciones arriba; compatibilidad, habilidades, intereses,
  formación (con `ImagenDeInstitucion`, iniciales por ahora, nunca el logo
  real) y biografía, cada una en su tarjeta. Se leía como un solo bloque.

## 2026-10-20 — Imágenes en toda la página

- **Fotos de Pexels, verificadas y servidas desde el servidor**
  (`scripts/imagenes/`, `public/imagenes/`, `src/lib/imagenes.ts`): 14 para
  la página (portada y una por rubro) y 14 para la demo (7 personas, 7
  eventos), en WebP de 640 y 1280 px (1,1 MB en total para la página). agy las
  propuso y las eligió mirándolas; el autor y la página de cada una se
  verificaron contra Pexels (4 autores estaban mal anotados y una foto ya no
  existía). Registro en [`imagenes.md`](./imagenes.md). Por qué fotos de
  banco ahora: [`decisiones.md`](./decisiones.md), 2026-10-20.
- **Avatar automático** (`src/lib/diseno/avatar.ts`): iniciales sobre un par
  de tokens de la paleta elegido por un hash del id de la cuenta, así el
  color no cambia con el nombre y nadie queda sin imagen.
- **Carga de la demo con imágenes** (`scripts/demo/sembrar.mjs`): logos SVG
  propios de las 8 empresas, foto para 7 de los 15 jóvenes (los otros 8
  muestran el avatar automático, como cualquier cuenta sin foto) y para 7 de
  los 8 eventos; todo como WebP en Storage, guardado con ruta relativa.
- **`obtenerIdentidadDeSesion()`** y `empresa_id` en `PostulacionResumen`:
  los datos que faltaban para el avatar del menú y el color de la empresa en
  «Mis postulaciones».
- **Skill de diseño**: la regla «nada de fotos de banco» pasa a «fotos de
  Pexels o Unsplash, verificadas y propias del servidor; lo que sería propio
  de LinkYouth sigue provisional».
- **`e2e/empresa.spec.ts`**: 60 s para el recorrido de todas las pantallas de
  empresa, que en desarrollo compila cada una.
- **`Avatar` con color determinista por semilla y tamaño `xs`** (`src/components/ui/Avatar.tsx`): recibe `semilla` (el id de la cuenta o el nombre) y usa `colorDeAvatar` tanto en las iniciales como detrás de la imagen para que ninguna cuenta quede sin imagen ni con un hueco roto si la foto falla.
- **Avatar de la sesión en la cabecera** (`src/components/layout/AvatarDeLaSesion.tsx`, `src/components/layout/CabeceraGlobal.tsx`): componente servidor asíncrono en su propio `<Suspense>` que consulta `obtenerIdentidadDeSesion()` y muestra el avatar en `MenuCuenta` con `IconoPerfil` como respaldo, sin volver asíncrona `CabeceraGlobal`.
- **Unificación de avatares e iniciales** (`CintaDeOrganizaciones`, `TarjetaUsuario`, `FilaVacante`, `AvatarEditable`, `ListaFormacion`, `FilaDePostulante`, `FormularioDePerfilDeEmpresa` y pantallas de joven y empresa): se pasa `semilla` en todos los usos de `Avatar` y se reemplazan las iniciales dibujadas a mano por `Avatar`.
- **Fotos reales en la portada y componente `Foto`** (`src/components/ui/Foto.tsx`, `src/app/page.tsx`, `SliderBienvenida.tsx`, `TarjetasPasos.tsx`): se reemplaza `FotoProvisional` por fotos WebP propias (`portada-estudiantes`, `portada-pasante`, `portada-busqueda`, `portada-primer-dia`, `portada-feria`, `portada-cierre`) con prioridad en la primera diapositiva y velo oscuro para contraste AA, manteniendo `FotoProvisional` en los tres espacios que requieren fotos propias (equipo, taller en la UM y captura de la ficha).
- **Cabeceras por rubro y atributos de imagen en eventos** (`src/app/(app)/empleos/[id]/page.tsx`, `src/app/(app)/organizaciones/[id]/page.tsx`, `TarjetaEvento.tsx`, `/eventos/[id]`, `/empresa/eventos/[id]`): se suma la foto de `imagenDeRubro` cuando el rubro tiene imagen asociada, y se completan `alt` descriptivo, dimensiones y `loading="lazy"` en las fotos de eventos.
- **Ilustraciones en estados vacíos** (`src/components/ui/Ilustracion.tsx`, `src/components/ui/EstadoVacio.tsx` y todas las pantallas con `EstadoVacio`): cinco SVG en el estilo del isotipo (`postulaciones`, `avisos`, `eventos`, `busquedas`, `personas`) coloreados con tokens de tema.

## 2026-10-20 — Avisos para los dos lados

- **Por qué no se veían** (diagnóstico): no era RLS ni faltaban datos del
  joven (había 61 avisos); la empresa no tenía ningún disparador que le
  escribiera, ni campana ni bandeja, y la campana del joven no mostraba
  cuántos había sin leer. Además el texto decía «fue aceptada» y el enlace
  llevaba a la lista entera.
- **Migración 007** (`db/migraciones/007-avisos-y-correos.sql`): avisos a la
  empresa por postulación e inscripción, textos con palabras («Te
  seleccionaron en…», «no siguió adelante») y enlace a la postulación, y
  cola `correos_pendientes`. Aplicada en el servidor;
  `db/verificar-007.sql` da 12/12 y `verificar-etapa2.sql` sigue en 25/25
  (se actualizó el texto esperado). Por qué una cola:
  [`decisiones.md`](./decisiones.md), 2026-10-20.
- **Correos por SMTP** (`src/lib/correo/`, nodemailer 7.0.9): solo
  seleccionado, descartado y postulación recibida, para no mandar un correo
  por cada aviso menor. Detalle en [`correo.md`](./correo.md).
- **`e2e/avisos.spec.ts`**: los avisos de los dos lados, la campana, el
  enlace a la postulación y la cola de correos. La carga de la demo cierra
  sin mandar los correos que generan sus propias postulaciones.
- **Campana con contador en `CabeceraGlobal` (`CampanaDeAvisos`, RF6.1)**:
  muestra la cantidad de avisos sin leer en la cabecera tanto para el joven
  (`/avisos`) como para la empresa (`/empresa/avisos`), con blanco táctil de
  44×44 px y nombre accesible de `TipoDeAviso.nombreDeLaCampana`, para que no
  haga falta entrar a la bandeja a ciegas.
- **Bandeja compartida `BandejaDeAvisos` y pantalla `/empresa/avisos` (RF6.1,
  RF6.2)**: extrae el listado con rótulo y tono según `TipoDeAviso` (destacando
  los avisos sin leer de `logro` y `baja`), enlaces con texto según el destino y
  estados vacíos propios de cada cuenta, sumando «Avisos» al menú y al pie de la
  empresa.
- **Anclas por postulación en `/postulaciones` (RF3.7, RF6.2)**: cada fila lleva
  `id="postulacion-<id>"`, `scroll-mt-28` y resaltado `:target` en lavanda para
  que el enlace del aviso lleve directo a la postulación sin que la cabecera la
  tape.

## 2026-10-20 — Mapa de eventos

- **CSP, búsqueda de direcciones y «Cómo llegar»** (`src/lib/mapa/teselas.ts`,
  `src/lib/acciones/geocodificacion.ts`, `ReglasDeEvento.comoLlegar`,
  `obtenerEvento`): `img-src` se abre solo a `tile.openstreetmap.org`; la
  búsqueda de direcciones la hace el servidor para no abrir `connect-src`.
  Por qué y alternativas en [`decisiones.md`](./decisiones.md), 2026-10-20.
  Se borra `EnlaceAlMapa`.
- **Mapa embebido con Leaflet y teselas de OpenStreetMap (`MapaInteractivo`,
  RF4.1, RF4.4)**: carga diferida con `IntersectionObserver` + `import("leaflet")`,
  esqueleto y respaldo sin JS, marcadores en SVG con los colores de la marca,
  gestos táctiles que no atrapan el scroll del celular, filtro en modo oscuro y
  respeto por `prefers-reduced-motion`. Por qué: reemplaza el viejo enlace
  externo `EnlaceAlMapa` por un mapa propio en la pantalla sin depender de
  Google Maps ni ralentizar la carga inicial.
- **Mapa general en `/eventos` y detalle en `/eventos/[id]` (RF4.4, RF4.5,
  RF4.6)**: mapa único arriba del listado con emergentes armados con nodos del
  DOM y conteo de eventos sin coordenadas; pantalla nueva `/eventos/[id]` con
  su `loading.tsx`, mapa del punto, botón `ComoLlegar` según `User-Agent` y
  acción de inscribirse o cancelar inscripción; `TarjetaEvento` pasa a ser
  clickeable entera hacia el detalle.
- **Detalle de evento de la empresa (`/empresa/eventos/[id]`) y selector en el
  formulario (`SelectorDeUbicacion`, `FormularioDeEvento`, RF4.1, RF4.2)**:
  muestra el mapa embebido y `ComoLlegar` en el detalle de la empresa, y
  reemplaza los campos manuales de latitud y longitud por un buscador con
  `buscarDireccion` y marcación táctil/arrastrable sobre el mapa con
  `direccionDePunto`.

## 2026-10-20 — Nivel 2: base de datos, acciones y confirmación de correo

- **Migración 006** (`db/migraciones/006-cuenta-y-perfil-publico.sql`):
  reseñas públicas sin autor (RF8.2), perfil público de persona con sesión
  (RF2.5), eliminar la cuenta anonimizando (RF1.7) y avisos que solo admiten
  cambiar `leida` (RF6.1). Por qué: abrir las tablas habría expuesto quién
  escribió cada reseña y datos personales de los jóvenes. Aplicada en el
  servidor; `db/verificar-006.sql` da 9/9.
- **Acciones** `cuenta.ts`, `formacion.ts`, `avisos.ts`, `resenias.ts` y
  lecturas `data/publico.ts`, que usan las pantallas de las dos secciones de
  abajo. `e2e/nivel2.spec.ts` recorre todo el Nivel 2 (6/6).
- **Confirmación de correo obligatoria**: `MAILER_AUTOCONFIRM` desactivado
  en GoTrue, una vez comprobado que el correo de prueba llega.
- **`docs/plan.md`**: lo que queda como trabajo futuro, con el motivo.

## 2026-10-20 — Formación en el perfil, avisos leídos y perfil público de persona

- **Alta y baja de formación en `/perfil` (RF2.4.1, RF2.4.2)**:
  `FormularioDeFormacion` para sumar estudios en curso o finalizados sin perder
  lo escrito ante un error, y `BotonConfirmado` en `ListaFormacion` para quitar
  un estudio propio con confirmación en pantalla.
- **Avisos leídos en `/avisos` (RF6.1)**: `BotonMarcarTodosLeidos` en el
  encabezado cuando hay notificaciones sin leer, `BotonMarcarAvisoLeido` por
  fila y marcado al abrir el enlace del aviso (`EnlaceDeAviso`), conectados a
  `marcarAvisosLeidos`.
- **Perfil público de persona en `/personas/[usuario]` (RF2.5, RF2.1.1)**:
  pantalla nueva con `loading.tsx` y enlace «Ver mi perfil público» desde
  `/perfil`. Muestra solo foto (o iniciales), `@nombre_usuario`, biografía e
  intereses, sin nombre, apellido, edad ni país.
## 2026-10-20 — Ajustes de cuenta y perfil público de empresa con reseñas

- **Ajustes de cuenta para joven (`/ajustes`) y empresa (`/empresa/cuenta`)
  (RF1.5, RF1.7)**: cambio de nombre de usuario (joven), contraseña, correo y
  baja definitiva de la cuenta con advertencia de pérdida de datos y
  confirmación con contraseña y la palabra `ELIMINAR`, compartiendo los
  formularios de `src/components/ajustes/`.
- **Perfil público de empresa y reseñas anónimas en `/organizaciones/[id]`
  (RF2.5, RF8.1, RF8.2)**: muestra datos de la organización, búsquedas activas,
  promedio y listado de reseñas (`Estrellas` extraído a `ui/`), formulario
  `FormularioDeResenia` para jóvenes que se postularon, y enlaces desde el
  detalle de vacante y las tarjetas de evento.
## 2026-10-20 — Datos de la demo

- **`scripts/demo/sembrar.mjs` y `contenido.json`**: carga reproducible de la
  demo de la defensa (borra todas las cuentas y crea 8 empresas, 15 jóvenes,
  20 búsquedas, 40 postulaciones, 8 eventos y 16 reseñas, ficticios y
  uruguayos). Por qué: los datos de prueba no mostraban cada función, y hace
  falta poder restaurar la demo en un minuto. Ver [`demo.md`](./demo.md).

## 2026-10-20 — Formularios que no pierden datos

- **Los formularios de registro conservan lo escrito ante un error (RF1.1,
  RF1.2)**: `registrarse` y `registrarEmpresa` devuelven `EstadoFormulario` con
  el error del campo que falló y los valores enviados (sin contraseñas), y
  `EnfocarPrimerError` lleva el foco al primer control con `aria-invalid="true"`
  para que un error de validación no obligue a cargar todo el alta de nuevo.
  Lo escribió Antigravity; lo revisó Claude Code.
- **`e2e/registro.spec.ts`**: provoca un error del registro de empresa y del
  de joven (razón social y nombre de usuario repetidos) y comprueba que todo
  sigue escrito, salvo las contraseñas, con el error junto al campo y el foco
  en él. No crea cuentas: el error corta antes del `signUp`.
- **Tests del pie de página** (`auth.spec.ts`, `rediseno.spec.ts`): seguían
  pidiendo la columna «Redes», que ya no existe, y un solo enlace «LinkYouth».

## 2026-10-20 — Ajustes antes del cierre

- **`Compatibilidad` cuenta una vez cada requisito** (RF3.5.2): «Inglés» como
  habilidad y «inglés» como tag hacían que el medidor dijera «Tenés 2 de 2» con
  un porcentaje de 50. Lo encontró el test escrito el mismo día.
- **Hooks de graphify** (`.claude/settings.json`): si `graphify` no está
  instalado, salen sin error. Antes fallaban en cada Bash, Grep, Read y Glob.
- **`e2e/empresa.spec.ts`**: el circuito de la empresa con datos reales (las
  ocho pantallas sin datos de ejemplo, publicar una búsqueda, postulación del
  joven, revisión → entrevista → seleccionada con su aviso, crear y cancelar un
  evento). Por qué: es el recorrido de la defensa y no tenía ninguna red.
- **Prettier** en `como-funciona/page.tsx` y `AnimacionesDePortada.tsx`, los
  dos archivos que no pasaban `format:check`.
## 2026-10-20 — Recuperación de contraseña, correo y acceso con usuario

- **`/recuperar`, `/recuperar/nueva` y `/auth/callback` (RF1.8)**: pedir el
  enlace, elegir la contraseña nueva y verificar los enlaces del correo. El
  correo sale por Gmail con plantillas en español. Por qué: no había ninguna
  forma de recuperar el acceso. Decisión en [`decisiones.md`](./decisiones.md)
  y armado en [`correo.md`](./correo.md).
- **Acceso con nombre de usuario (RF1.3.1)**: el campo del login acepta correo
  o nombre de usuario; el correo se resuelve en el servidor con la clave de
  servicio (`src/lib/supabase/admin.ts`). Un usuario inexistente da el mismo
  mensaje que una contraseña mala.
- **Playwright en el puerto 3100** y `e2e/recuperacion.spec.ts`: en el
  servidor el 3000 es producción, y esta suite escribe en la base (una cuenta
  descartable que borra al terminar).

## 2026-10-20 — Delegación a Antigravity y tests del dominio

- **`AGENTS.md`, `GEMINI.md` y skill `delegar-a-gemini`**: reglas para que
  Antigravity CLI (`agy`) trabaje en tareas de bajo riesgo dentro de un
  worktree `gemini/<tarea>`, sin tocar `db/`, RLS, middleware ni seguridad, y
  sin push ni merge. Por qué: ahorrar tokens en trabajo mecánico sin ceder la
  revisión. `GEMINI.md` es un enlace a `AGENTS.md` para que no haya dos copias
  que se desincronicen.
- **Vitest** (`vitest.config.mts`, script `npm test`): runner de tests
  unitarios; hasta ahora solo había e2e con Playwright. Decisión en
  [`decisiones.md`](./decisiones.md), 2026-10-20.
- **`src/lib/dominio/Compatibilidad.test.ts` (RF3.5.2)**: tests del cálculo de
  compatibilidad entre vacante y perfil, para cubrir las reglas del dominio
  sin depender de la interfaz.

## 2026-10-15 — Etapa 2: el lado de la empresa

Rama `feat/etapa2-empresa`. Decisiones en [`decisiones.md`](./decisiones.md),
2026-10-15; guion de prueba en el servidor en
[`prueba-etapa2.md`](./prueba-etapa2.md).

- **Migración 005** (`300216c`): modalidad, ubicación y pausa de búsquedas,
  título único entre las activas (RF3.1.2), etapa «entrevista», dirección y
  coordenadas de eventos, sitio web de la empresa, borrado de búsquedas sin
  postulaciones, `candidatos_de_mi_empresa`, cierre automático al cubrir
  posiciones (RF3.3.2), rechazo de pendientes al cerrar (RF3.3.3), aviso de
  evento cancelado (RF4.3.2) y aviso al joven con el título de la búsqueda.
  Porque el esquema no tenía cómo publicar ni gestionar nada desde la empresa.
- **Inscribirse solo a eventos activos y futuros**: la política lo exige; antes
  se podía por API a uno cancelado o pasado.
- **`db/verificar-etapa2.sql`**: 25 comprobaciones de RLS y disparadores que no
  dejan datos (terminan en `rollback`).
- **Capa de datos y acciones de empresa** (`f59964b`): `empresa.ts`,
  `comun.ts`, `busquedas.ts`, `eventosDeEmpresa.ts`, `perfilDeEmpresa.ts` y las
  clases de dominio que validan y ordenan.
- **Sin «Cómo funciona» ni GitHub para la empresa** (`3739200`): menú, pie,
  middleware; Contacto, Legales y el pie muestran un correo. El formulario de
  consultas se sacó porque no entregaba los mensajes.
- **Pantallas** (`a11a5ca`…`0001089`): panel con datos reales; Mis búsquedas
  (crear, editar, pausar, cerrar, eliminar, postulantes ordenados por
  coincidencia, ficha y cambio de estado); Mis eventos (crear, editar,
  cancelar, inscriptos, mapa); Candidatos por intereses (RF7.3); Perfil de la
  empresa; Reseñas recibidas (RF7.4); carga, error y «no encontrado».
- **Del lado del joven** (`e949587`): modalidad y ubicación en las vacantes,
  dirección y «Ver en el mapa» en los eventos.
- **Componentes nuevos**: `SelectorDeOpciones` (lo usa también el registro),
  `BotonConfirmado`; `Campo` muestra errores por campo y `Etiqueta` suma la
  marca en violeta.

## 2026-10-06 — La app, lista para publicarse con Tailscale Funnel

- **Las fotos las sirve la app, no Supabase.** `rewrite` de
  `/storage/v1/object/public/*` hacia `127.0.0.1:8000` y rutas relativas al
  guardar y al mostrar (`rutaDeImagen`): Supabase no se publica en internet y
  una URL `http://100.79.143.69:8000/…` no la abre nadie de afuera.
  `NEXT_PUBLIC_SUPABASE_URL` no cambia.
- **Cabeceras:** se suman `Permissions-Policy`, `Strict-Transport-Security` y
  `X-Robots-Tag: noindex`, más `robots.txt` con `Disallow: /`, y se quita
  `X-Powered-By` (H8).
- **La ficha de institución lee `formaciones_publicas`**, porque desde H1
  `formaciones` ya no se lee entera.
- **Migración 004:** el bucket `avatars` acepta hasta 2 MB y solo JPG, PNG y
  WebP (H7). La app ya lo validaba, pero se salteaba llamando a Storage directo.

## 2026-10-06 — Datos de jóvenes cerrados entre usuarios (H1, H6, H13)

- **Cada joven ve sus intereses, habilidades y formaciones; una empresa, los
  de quienes se postularon a sus vacantes.** Antes cualquiera con sesión los
  leía todos, y el registro es abierto. Migración 003, aplicada el 2026-10-06.
  Ver [`decisiones.md`](./decisiones.md).
- **`perfiles_publicos` expone solo `id` y `nombre_usuario` y es de solo
  lectura.** Tenía nombre, apellido, bio y foto a la vista sin sesión, y por
  los privilegios por defecto dejaba modificar perfiles sin sesión.
- **`verificar-raspado-anonimo.sh` prueba también que `anon` no escriba por la
  vista**, que es lo que dejó pasar H13 sin que nadie lo notara.

## 2026-09-29 — Aviso de logos provisorios en la cinta

- **La cinta avisa en cuanto hay un logo provisorio, no solo cuando lo son
  todos.** Antes, con una sola empresa con logo, las demás seguían con la marca
  de iniciales y el aviso desaparecía: se mostraban marcas inventadas como si
  fueran reales. Ahora cada marca de iniciales se llama «Logo provisorio de…» y
  el aviso distingue entre todos provisorios, algunos y ninguno. El test e2e
  dejó de depender de qué empresas subieron logo en la base: compara el aviso
  con los logos que la cinta dibujó.

## 2026-09-27 — Rediseño «Recreo» (rama `feat/rediseno-juvenil`)

- **Cinta de organizaciones en lugar del carrusel con flechas.** Logos
  seguidos que se desplazan solos, de borde a borde, con animación CSS solo
  de `transform`. Se detiene con el mouse o el foco, tiene botón de pausa y con
  «reducir movimiento» queda quieta. Los logos son de ejemplo y lo dice: los
  reales requieren autorización de cada empresa.
- **Pestañas «Busco trabajo» y «Soy empresa» en iniciar sesión y en crear
  cuenta**, con textos propios. Si se entra por la que no corresponde, se
  llega igual a la sección correcta con un aviso («Tu cuenta es de empresa,
  así que te llevamos a tu panel»). Motivo: separar la entrada sin permitir
  que la pestaña decida el acceso (RF1.2).
- **«Mantener la sesión iniciada».** Sin marcarla, la sesión termina al cerrar
  el navegador (`src/lib/supabase/sesion.ts`).
- **Los visitantes ya no ven el botón de tema** en la cabecera ni en el login:
  la cabecera sin sesión es «Entrar» y «Crear cuenta».

- **El encabezado se transforma de a poco, desde el primer píxel.** Antes
  cambiaba de golpe al llegar al segundo bloque y a veces quedaba trabado
  como cápsula, porque dependía de un IntersectionObserver que podía quedar
  desfasado al navegar. Ahora `EncabezadoFlotante` calcula un progreso de 0 a
  1 en los primeros 120 px, siempre desde la posición real del scroll (al
  cargar, al navegar, al volver atrás y al cambiar el tamaño), y el CSS
  interpola con `--p` la separación, el radio, la transparencia, el
  desenfoque, el borde y la sombra. Arriba de todo vuelve a quedar integrado.
  Igual en la portada y en la app.

- **Iniciar sesión y crear cuenta, en una tarjeta.** `TarjetaDeAcceso`
  centrada sobre un fondo con formas muy suaves de turquesa y violeta, con el
  logo, un título cálido, y la vuelta a la página principal. La contraseña se
  puede mostrar u ocultar (`EntradaContrasenia`, con `aria-label`), en el
  login y en el registro. Los mensajes de error entran con un fundido.
  «¿Olvidaste tu contraseña?» no aparece porque RF1.8 no está implementado.

- **Identidad nueva a partir del logo oficial.** Paleta de un solo juego:
  violeta del logo como marca, turquesa del logo para «ya lo tenés»,
  mandarina solo en el botón principal, neutros de base. Tipografía Red Hat.
  Se saca el selector de color de Ajustes. Motivo: el diseño anterior se leía
  distante y genérico para un público joven.
  → [`decisiones.md`](./decisiones.md)

- **Logo oficial en SVG** (`public/marca/`, favicon en `src/app/icon.svg`),
  reconstruido a partir de la lámina. Reemplaza al cuadrado «LY» dibujado en
  código y al favicon de Next.js.

- **Tema claro y oscuro que sigue al sistema**, con un botón visible en el
  encabezado que lo cambia a mano y se recuerda en el navegador.

- **Un solo menú por tipo de cuenta, sin barra lateral.** Encabezado que se
  vuelve cápsula de vidrio al bajar; pestañas abajo en el teléfono para el
  postulante; la empresa ya no ve Empleos ni Eventos. Motivo: dos menús que
  repetían secciones confundían.

- **Transiciones en toda la app** (200 ms al abrir, 150 ms al cerrar), cambio
  de pantalla con View Transitions, filtros con indicador que se desliza,
  anillos que se unen al postularse y esqueletos de carga en las pantallas
  que leen de la base. Con «reducir movimiento», todo instantáneo.

- **Vacantes como tarjetas clickeables** con medidor «Tenés X de Y»;
  **detalle** con la acción fija y «Qué pasa después»; **perfil** con una guía
  de lo que le falta a la ficha (`CompletitudDeFicha`).

- **Panel de empresa con datos reales, en modo lectura**
  (`obtenerPanelDeEmpresa`, `ResumenDePanel`): búsquedas con cantidad de
  postulaciones y eventos. Publicar (RF3.1) y responder (RF3.4) quedan
  pendientes en `plan.md`.

- **Portada narrativa**, solo en la página principal, con GSAP, ScrollTrigger
  y Lenis cargados con `import()`: slider de bienvenida con pausa, panel que
  emerge, tarjetas con parallax del mismo tamaño y «Ver más», imagen que se
  recorta en carrusel de búsquedas, opiniones de ejemplo rotuladas, preguntas
  que se despliegan suave y «Volver arriba» al principio de la página.

- **Pie completo y página de Contacto.** Ningún enlace del pie lleva a una
  página vacía: se crearon `/contacto` (honesta: el formulario todavía no
  entrega) y las secciones «Publicar búsquedas» y «Planes y publicidad» en
  `/empresas`.

- **Vacantes y eventos de prueba** en `db/seed-vacantes-eventos-prueba.sql`
  (se borran con `db/borrar-vacantes-eventos-prueba.sql`).

- **Tests**: `e2e/rediseno.spec.ts` (pie sin enlaces vacíos, tema, tarjetas
  del mismo tamaño, «Ver más», pausa del slider, opiniones rotuladas).

---

## 2026-09-26

- **Sin sesión ya no se queda encerrado entre el login y las pantallas
  privadas.** El logo del login llevaba a `/como-funciona` —que comparte el
  título con la portada— y el de las pantallas públicas a `/inicio`, que el
  middleware rebotaba a `/login`: no había camino a la portada. Ahora el logo
  lleva a `/` sin sesión y al inicio de la cuenta con ella (`inicioDe()` en
  `src/lib/navegacion.ts`; `Marca` exige el destino), el login tiene «Volver a
  la página principal» y el pie sin sesión ofrece solo enlaces públicos más
  «Página principal».
  → [`decisiones.md`](./decisiones.md)

- **Después de entrar se vuelve a la pantalla pedida.** El middleware manda a
  `/login?next=/ruta`, y `iniciarSesion` y `registrarse` vuelven ahí.
  `destinoSeguro()` solo acepta rutas internas, para que `next` no sirva de
  redirector abierto, y `correspondeA()` descarta un `next` de la otra mitad de
  la aplicación: el `redirect()` de una Server Action no pasa por el
  middleware, y una empresa que entraba con `?next=/perfil` terminaba viendo la
  pantalla del postulante.

- **`/empleos` y `/eventos` se leen sin sesión, y existe `/empleos/[id]`.**
  Sin sesión no hay porcentaje de compatibilidad, hay una invitación a crear
  cuenta («Creá tu cuenta para ver cuánto coincidís con cada búsqueda») y
  «Postularme» e «Inscribirme» llevan a `/registro?next=…`. El detalle de
  vacante (RF3.5.3, el «ver más» del feed) no existía: es también la pantalla
  a la que se vuelve después de crear la cuenta.
  → [`decisiones.md`](./decisiones.md)

- **`vacante_tags_publicos`, `vacante_habilidades` y `evento_tags` vuelven a
  estar abiertas a `anon`.** Ajusta el PR #6, que las había cerrado: son datos
  del aviso, no de una persona, y sin ellas las vacantes se veían sin decir qué
  piden —ni sus tags ni las habilidades que requieren—. Los tags
  ocultos siguen cerrados. `db/verificar-raspado-anonimo.sh` pasa a listar qué
  tiene que quedar abierto y qué cerrado, y falla en los dos sentidos.
  → [`decisiones.md`](./decisiones.md)

- **`/como-funciona` deja de decir que no hay registro ni inicio de sesión.**
  La sección «En qué estamos» afirmaba que el registro y el inicio de sesión
  «todavía no están», cuando ya funcionan para personas y empresas. Ahora lo
  dice, y avisa que algunas pantallas pueden mostrar contenido de
  demostración mientras la base no tenga búsquedas ni eventos.

---

## 2026-09-15 — La migración del bucket se puede correr dos veces (rama `claude/linkyouth-applicant-dashboard-eweeld`)

- **`db/migraciones/002-bucket-avatars.sql` borra cada política antes de
  crearla.** `create policy` no admite `if not exists`, así que la segunda
  corrida moría en la primera política que ya estaba — y una migración que
  falla a la mitad deja la base en un estado que hay que desarmar a mano.

---

## 2026-09-15 — Los menús de acceso se abren con el mouse y el carrusel dice cuándo no hay nada que desplazar (rama `claude/linkyouth-applicant-dashboard-eweeld`)

- **«Ingresar» y «Crear cuenta» ya no pueden estar abiertos a la vez.** Eran
  dos `<details>` independientes: con los dos abiertos, los paneles se pisaban.
  Ahora comparten un `GrupoDeMenus` que sabe cuál está abierto, así abrir uno
  cierra el otro sin que ninguno tenga que enterarse de que el otro existe.

- **Se abren al pasar el mouse.** El panel cuelga de un envoltorio con relleno
  superior en vez de margen: con margen quedaba un hueco de seis píxeles entre
  el botón y el panel, y el menú se cerraba justo cuando el mouse lo estaba
  cruzando para llegar.

- **El hover no alcanza, así que conviven tres caminos**, y los tres salieron
  de probarlos en un navegador de verdad:
  - Con mouse, el clic ya no cierra el panel que el hover acaba de abrir.
  - En un teléfono el toque termina con un `pointerleave`, que cerraba el menú
    en el mismo gesto que lo abría. Los manejadores de puntero filtran por tipo.
  - Un toque también enfoca el botón, y entre ese `focus` y el `click` que
    viene después el menú se abría y se cerraba solo. Ahora abre por foco
    únicamente cuando es `:focus-visible`, que es el foco que llega por
    tabulador.
  - `Escape` devuelve el foco al botón, y ese foco de teclado lo reabría al
    instante. Una bandera ignora ese foco puntual.

- **Las flechas del carrusel aparecen solo si hay adónde ir.** No estaban
  rotas: con cuatro organizaciones en una pantalla de escritorio la fila entra
  entera —`scrollWidth` es idéntico a `clientWidth`— y `scrollBy` no tiene
  margen para desplazar. Un botón que responde al clic sin que pase nada se lee
  como un botón roto. Ahora la fila de flechas se esconde cuando no hay
  desborde y cada flecha se apaga al llegar a su extremo.

- **La barra de desplazamiento del carrusel se esconde** con la utilidad
  `.sin-barra`. Va solo donde hay otra forma visible de moverse: sin las
  flechas, esconderla le sacaría a la persona la única señal de que la fila
  sigue hacia el costado.

---

## 2026-09-15 — Registro con seguridad, ficha unificada y baja de inscripción (rama `claude/linkyouth-applicant-dashboard-eweeld`)

- **`empresas` tiene columna `rut`, única y opcional.** Una empresa se
  identifica por su RUT, no por su razón social, que se puede repetir entre
  jurisdicciones. Es opcional porque las empresas dadas de alta antes de la
  columna no lo tienen y no hay valor razonable que inventarles
  (`db/migraciones/001-empresas-rut.sql`). El formato lo valida la aplicación y
  no un `check`: doce dígitos es la forma uruguaya y la plataforma no descarta
  abrirse a otros países.

- **El registro mide la fuerza de la contraseña mientras se escribe.** Antes el
  único requisito eran seis caracteres, y quien ponía `123456` se enteraba de
  que era mala cuando ya era tarde. Ahora son ocho a sesenta y cuatro, con
  mayúscula y número. El tope no es de seguridad: bcrypt trunca en 72 bytes, y
  más allá de ahí los caracteres extra no cuentan — aceptarlos sería mentir.
  El color del medidor está [argumentado en `decisiones.md`](./decisiones.md).

- **La contraseña se pide dos veces y la privacidad se acepta a mano.** Un
  error de tipeo en el único campo dejaba a alguien afuera de su propia cuenta
  sin forma de saber qué había escrito. El checkbox nunca viene marcado: un
  consentimiento que viene puesto no es un consentimiento.

- **La mayoría de edad se rechaza antes de crear el usuario.** La regla la
  sigue decidiendo el `check` `perfiles_mayor_de_edad`; lo que cambia es que el
  campo de fecha no deja elegir un día posterior y la acción corta antes. Sin
  eso quedaba una fila en `auth.users` que nunca iba a poder tener perfil.

- **Al registrarse hay que elegir al menos cinco intereses (RF1.1.11).** Sin
  ellos la compatibilidad de RF3.9 no tiene con qué comparar: el feed abría con
  todas las vacantes en 0 % y parecía roto sin estarlo.

- **La foto de perfil y el logo se suben a Supabase Storage.** Cierra a medias
  la deuda 7.4: suben, pero un fallo de subida no corta el alta y queda solo en
  el registro del servidor. Para cuando corre, la cuenta ya existe, y devolver
  un error dejaría a la persona reintentando contra un correo ya registrado.

- **`TarjetaUsuario` es un solo bloque.** Los respiros entre identidad, estudio,
  números y habilidades eran tan grandes que en el teléfono parecían cuatro
  tarjetas apiladas. Ahora comparten superficie y se separan con filetes.

- **La institución educativa es un enlace a `/institucion/[id]`.** Es el dato
  que alguien quiere seguir para ver quién más estudia ahí. No hay tabla de
  instituciones: el identificador se deriva del nombre y la página dice en
  pantalla qué le falta ([decisión](./decisiones.md), deuda 7.8).

- **Los eventos tienen botón de cancelar inscripción (RF4.6).** La acción de
  servidor existía desde el principio y el botón no, así que anotarse era
  irreversible sin entrar a la base.

---

## 2026-09-15 — Usuarios de prueba (rama `claude/linkyouth-applicant-dashboard-eweeld`)

- **`db/seed-usuarios-prueba.sql` crea cinco postulantes y cinco empresas con
  contraseña conocida.** Hasta ahora no había forma de probar el inicio de
  sesión ni el feed a mano: había que registrarse cada vez, y un perfil recién
  creado no tiene intereses, así que la compatibilidad de toda vacante daba
  0 % y el listado se veía roto sin estarlo.
  El script escribe directo en `auth.users` porque el pedido era pegarlo en el
  SQL Editor de Supabase, donde no se puede usar la Admin API. Es el esquema
  interno de GoTrue y puede cambiar entre versiones: queda anotado en la
  cabecera del archivo.

- **Las contraseñas van en claro en `docs/usuarios-prueba.md`**, que es para lo
  que se pidieron. Ambos archivos advierten que esto sirve solo mientras la
  base tenga datos inventados y que hay que borrar estas cuentas en cuanto se
  registre una persona real.

- **Los intereses y habilidades del seed se verifican contra el catálogo de
  `db/seed.sql`.** Se asignan con un `join` por nombre, y un `join` que no
  encuentra nada no falla: inserta cero filas en silencio. Once nombres no
  existían en el catálogo, con lo que tres perfiles habrían quedado por debajo
  del mínimo de cinco intereses de RF1.1.11 sin ningún error visible.

- **`formaciones` se inserta con un guardia `where not exists`.** No tiene
  restricción única, así que `on conflict do nothing` no la protegía y correr
  el script dos veces duplicaba los estudios de cada perfil.

---

## 2026-09-15

- **Se acabó el éxito falso sobre filas ajenas o inexistentes (S-2).**
  `cancelarPostulacion` y `actualizarPerfil` terminan en `.select("id")` y
  devuelven error si no se tocó ninguna fila.
  Motivo: un `update` que RLS deja pasar sin encontrar la fila no falla,
  devuelve cero filas. Cancelar la postulación de otro respondía «Postulación
  cancelada.» sin haber cambiado nada, y editar el perfil sin fila respondía
  «Perfil actualizado.». Además de mentirle al usuario, le confirma a quien
  sondea que la operación funcionó.
  → [`decisiones.md`](./decisiones.md)

- **Siete políticas de «lectura pública» dejan de alcanzar a `anon` (S-3).**
  `perfil_tags`, `perfil_habilidades`, `formaciones`, `vacante_tags_publicos`,
  `vacante_habilidades`, `evento_tags` y `resenias` pasan a
  `to authenticated`. La condición `using (true)` no cambia.
  Motivo: sin cláusula `to`, una política alcanza también al rol `anon`, y la
  `ANON_KEY` viaja al navegador por diseño. Con esa clave y PostgREST se podía
  bajar el padrón entero —cada perfil con sus intereses, habilidades, estudios
  y reseñas, unidos por `perfil_id`— sin cuenta y sin límite. Es la misma forma
  de problema que CN-001, que cerró la columna pero dejó abierta la superficie.
  `perfiles_publicos` queda afuera a propósito: `registrarse()` la lee sin
  sesión para avisar que un nombre de usuario ya está tomado.
  Los catálogos `tags` y `habilidades` también: la primera versión del arreglo
  los cerraba, y `/registro` —que los lee sin sesión— se quedaba sin intereses
  para elegir. Siguen abiertos a `anon` a propósito.
  → [`decisiones.md`](./decisiones.md)

- **`db/verificar-raspado-anonimo.sh`.** Cuenta con la `ANON_KEY` cuántas filas
  de esas siete tablas se ven sin sesión, y falla también si los catálogos
  `tags` y `habilidades` dejan de verse, porque eso rompe el registro.
  Motivo: la señal del arreglo es sutil y se presta a leerla mal. Cuando un rol
  no tiene política de select, Postgres no devuelve error sino cero filas con
  HTTP 200, así que una tabla cerrada y una vacía se ven idénticas desde
  afuera. El script marca como NO CONCLUYENTE las que estaban vacías e incluye
  la consulta a `pg_policies`, que es la respuesta autoritativa.

- **El tipo de cuenta se exige en RLS, no solo en el middleware.** Las
  políticas de insert de `postulaciones`, `perfil_tags`, `perfil_habilidades`,
  `formaciones` e `inscripciones_evento` ahora piden
  `exists (select 1 from perfiles where id = auth.uid())`; las de `vacantes` y
  `eventos`, la inversa contra `empresas`. Las siete pasan además a
  `to authenticated`.
  Motivo: dos auditorías independientes —la interna y Cyber Neo— encontraron lo
  mismo. El middleware reparte por tipo de cuenta, pero eso protege la
  navegación por URL y no el endpoint: los ids de las Server Actions viajan en
  los chunks de `/_next/static`, que el `matcher` excluye, así que una cuenta
  de empresa podía invocar `postularse()` por POST contra `/empresa`. Lo único
  que lo frenaba era la clave foránea `perfil_id -> perfiles` —integridad
  referencial, no control de acceso— y no cubría la dirección inversa, que es
  la que va a importar en el Hito 6.
  → [`decisiones.md`](./decisiones.md)

- **Guardia de sesión compartido en `src/lib/acciones/sesion.ts`.**
  `sesionDePostulante()` reemplaza el preámbulo —cliente, `SIN_CONFIGURAR`,
  `getUser()`, `SIN_SESION`— que estaba repetido en las seis acciones de
  escritura, y le suma el chequeo de tipo de cuenta.
  Motivo: con el chequeo repetido serían seis lugares donde acordarse de
  agregarlo. Además tapa un caso que RLS no puede informar: un `update` sobre
  una fila que la política no deja ver no falla, devuelve cero filas, así que
  `actualizarPerfil` invocada por una cuenta de empresa respondía «Perfil
  actualizado.» sin haber tocado nada.

- **El `42501` de RLS deja de salir crudo a la pantalla.** `mensajeDeError()`
  lo traduce a «No tenés permiso para hacer esto.».
  Motivo: el mensaje de Postgres nombra la tabla y la política, que es
  justamente el mapa que necesita quien está sondeando la base.

- **El cuerpo del verificador va por la entrada estándar, no por `argv`.** Con
  `-d "$cuerpo"` el bloque de las acciones de empresa devolvía `PGRST102`
  («Empty or invalid json») en lugar de `42501`.
  Motivo: en Windows `curl` suele ser el binario nativo (`/mingw64/bin/curl`),
  así que los argumentos cruzan una conversión de code page al pasar de bash al
  proceso. El título de prueba llevaba tilde, el byte llegaba corrupto y
  PostgREST rechazaba el cuerpo antes de evaluar la política — o sea que la
  prueba nunca llegaba a la base y se leía como si el fix no funcionara. La
  autoprueba suma un caso con tilde para que no vuelva en silencio.

- **`db/verificar-politicas.sh`.** Comprueba contra la base que el rechazo
  viene de la política (`42501`) y no de la clave foránea (`23503`).
  Motivo: la diferencia entre el fix y el bug no se ve leyendo el SQL, se ve en
  el código que devuelve Postgres, y hasta ahora no había forma de comprobarlo
  sin armar las llamadas a mano. Va contra PostgREST y no contra la aplicación
  porque el guardia de `sesion.ts` corta antes de llegar a la base. Trae
  `AUTOPRUEBA=si`, que lo ejercita sin ninguna cuenta usando la clave anónima
  como token, con un control negativo para probar que sabe dar rojo.

- **`arquitectura.md` §2.2 corregida, deuda §7.5 cerrada.** La sección decía
  «Ninguna regla de permisos está escrita en TypeScript», y dejó de ser cierto
  cuando `ad8f55c` puso el reparto por tipo en el middleware. Se corrigió la
  frase en vez de borrarla, con la formulación que sí se sostiene: la base
  decide, el código explica.

## 2026-09-14

- **El perfil deja elegir intereses y habilidades del catálogo (RF2.3,
  RF2.4.3).** Hasta ahora `NubeTags` mostraba las etiquetas ya elegidas y no
  había forma de elegirlas desde la aplicación: las filas de `perfil_tags` y
  `perfil_habilidades` había que cargarlas a mano desde el SQL Editor. Lo
  reemplaza `SelectorTags`, que muestra los dos catálogos completos —36 tags y
  20 habilidades, una lectura de cada tabla— y prende y apaga cada opción con
  `agregarTag` / `quitarTag` / `agregarHabilidad` / `quitarHabilidad`. La base
  no cambió: las políticas de insert y delete propios ya estaban escritas.
- **La etiqueta responde al toque y vuelve sola si la acción falla.** El
  estado optimista se deriva de lo que manda el servidor, así que no hay nada
  que deshacer a mano: si la acción devuelve error no hubo `revalidatePath`, y
  React vuelve al valor anterior. Verificado forzando una falla en la acción.
- **El `23505` del doble clic se absorbe en vez de mostrarse.** Dos clics en
  el mismo tick leen el mismo estado base y mandan dos inserts iguales; el
  segundo choca con la clave primaria. La fila quedó como la quería quien hizo
  clic, así que devolver error ahí revertiría una etiqueta que sí está
  guardada.
- **`PerfilCompleto` sigue devolviendo nombres y no `{ id, nombre }`.** El
  `id` viaja solo en el catálogo, que es donde hace falta. Por qué, y qué se
  descartó, en [`decisiones.md`](./decisiones.md).

## 2026-09-13

- **Latencia de navegación investigada y no resuelta.** Los ~800 ms por
  navegación son dos viajes de red en serie a Supabase, a ~240 ms cada uno por
  la distancia a us-east-2. Se descartan por ahora el Auth Hook, saltear la
  revalidación de sesión y cambiar de región.
  Motivo: no es un problema real con usuarios de prueba, y las tres opciones
  cuestan seguridad o una migración grande.
  → [decisiones.md](./decisiones.md)

- **Una sola validación de sesión por navegación.** `obtenerPerfilActual`,
  `obtenerPostulaciones`, `obtenerVacantesPostuladas` y
  `obtenerEventosInscriptos` reciben el id del usuario como parámetro opcional;
  si no viene, lo resuelven como antes. `/inicio` y `/empleos` lo resuelven una
  vez con `obtenerUsuarioId()` y lo pasan.
  Motivo: `/inicio` hacía cinco `auth.getUser()` —cuatro de las lecturas más la
  del middleware— para una sola navegación, a ~240 ms de ida y vuelta cada una.
  Ahora hace dos.
  **La latencia casi no cambia** (870 ms a 854 ms de mediana): las cuatro
  llamadas ya corrían dentro de un `Promise.all`, así que costaban un viaje, no
  cuatro. Lo que baja es la carga contra el servidor de auth y el consumo de
  límites, no el tiempo que espera una persona.

- **El registro sin confirmar muestra una pantalla propia, no un formulario
  vacío.** Cuando `registrarse()` o `registrarEmpresa()` devuelven `ok` —el
  `signUp` anduvo pero no dejó sesión— el formulario se reemplaza por
  `RegistroPendiente`, con el correo al que se envió.
  Motivo: React limpia los campos al volver la acción, así que quedaba una
  pantalla en blanco con una línea verde arriba del botón. Se lee como «no pasó
  nada, probá de nuevo», y reintentar choca contra el correo ya registrado.
  El camino con sesión activa no cambia: sigue redirigiendo a /inicio o /empresa
  según `cuentas.tipo`, sin pasar por acá.

- **`BotonPostularse` e `BotonInscribirse` se fusionan en `ui/BotonAccion`.**
  Eran el mismo componente con tres textos cambiados: idéntico `useActionState`,
  idéntico `<form>` con un campo oculto, idéntica región `aria-live`. Solo
  diferían en el nombre del campo y en la variante visual, ahora props.
  Motivo: era el hallazgo crítico de la auditoría de organización, y el cambio
  anterior —el `esEjemplo`— lo cobró: hubo que hacer el mismo arreglo dos veces
  y acordarse de las dos. Refactor puro, sin cambio de comportamiento.

- **Postularse e inscribirse quedan deshabilitados sobre contenido de
  demostración.** `TarjetaVacante` y `TarjetaEvento` reciben `esEjemplo` y lo
  pasan al botón, que se muestra apagado y dice «Disponible cuando haya vacantes
  reales» / «…eventos reales» en vez de «Postularme» / «Inscribirme». El origen
  sale del `Resultado` que las páginas ya tenían; antes se quedaba en el nivel
  de la página y no bajaba a la tarjeta.
  Motivo: `AvisoOrigen` avisa una sola vez, arriba de la lista, y deja de verse
  al scrollear. Quien llegaba a la quinta tarjeta hacía clic y se llevaba un
  error de la base sobre una vacante que no existe. El estado se comunica por
  texto y no solo por el color del botón apagado.

## 2026-09-12

- **Registro de cuentas de empresa (RF1.2).** `registrarEmpresa()` en
  `src/lib/acciones/auth.ts`, con el mismo recorrido que `registrarse()`:
  chequeo de razón social duplicada antes del `signUp`, después las filas de
  `cuentas` (`tipo = 'empresa'`) y `empresas`. El formulario vive en
  `/registro?tipo=empresa`, no en una ruta aparte.
  → [`decisiones.md`](./decisiones.md)

- **La sesión distingue el tipo de cuenta.** `cuentas.tipo` pasa a tener
  consumidores: el login redirige a `/inicio` o a `/empresa` según el tipo, y el
  middleware impide que una cuenta entre a la mitad de la aplicación que no le
  corresponde. Se lee de la base y no de `user_metadata`, que el propio usuario
  puede reescribir.
  Motivo: cierra la mitad de la deuda 7.5, que declaraba `TIPOS_CUENTA` sin que
  nadie lo usara.
  → [`decisiones.md`](./decisiones.md)

- **`/empresa` existe como placeholder.** Layout propio —sin la barra lateral
  del postulante, que no le sirve— y una página que dice que el panel llega en
  el Hito 6. Lo único que sostiene hoy es que una empresa aterrice en algún lado
  propio al iniciar sesión.

- **`comoTipoCuenta()` en `src/lib/data/tipos.ts`.** Completa la familia de
  estrechamientos del archivo. El respaldo es `individual`, el tipo con menos
  alcance: ante un valor desconocido la sesión cae en la aplicación del
  postulante, nunca en el panel de empresa.

- **Primeros tests del proyecto: `e2e/auth.spec.ts`, con Playwright.** Nueve
  casos sobre el guard de rutas del middleware y las cabeceras de CN-002.
  `playwright.config.ts` levanta y baja `npm run dev` solo; `npm run test:e2e`
  los corre.
  Motivo: los dos arreglos de seguridad de hoy se verificaron a mano, con
  capturas, y esa verificación no se puede repetir sola. Los tests se probaron
  desactivando el guard a propósito para confirmar que se ponen rojos —
  escribir un test que nunca se vio fallar no prueba nada.
  Hallazgo del experimento: solo `/eventos` y `/postulaciones` dependen
  únicamente del middleware. `/inicio`, `/empleos` y `/perfil` siguen
  redirigiendo sin él, porque `obtenerPerfilActual()` tiene su propio
  `redirect("/login")`. Son dos barreras, como se había buscado.
  El flujo de registro y login queda fuera hasta que exista un Supabase de
  test: ver `plan.md`, Hito 1.

- **La verificación previa de `nombre_usuario` lee la vista, no la tabla.**
  `registrarse()` consulta `perfiles_publicos` en lugar de `perfiles`.
  Motivo: quien se registra todavía no tiene sesión, y desde CN-001 la tabla
  solo es legible por `authenticated` y acotada a la fila propia. Contra la
  tabla la consulta devolvía `null` siempre —sin error— y el chequeo quedaba
  apagado en silencio: el choque volvía a aparecer recién en el primer inicio de
  sesión, que es justo lo que `a855925` había corregido. El índice único sigue
  siendo la defensa final.

- **`fecha_nacimiento` deja de ser legible por cualquiera (CN-001).** `perfiles`
  sale del alcance de lectura de la API: la política pasa a `to authenticated
  using (auth.uid() = id)` y RF2.5 se sirve por la vista nueva
  `perfiles_publicos`, sin esa columna.
  Motivo: RLS no distingue columnas y la política vieja no declaraba rol, así que
  con la `ANON_KEY` del bundle se podía bajar la fecha de nacimiento exacta de
  todos los usuarios desde PostgREST.
  → [`decisiones.md`](./decisiones.md)

- **Cabeceras de seguridad en `next.config.ts` (CN-002).** `X-Frame-Options:
  DENY`, `X-Content-Type-Options: nosniff` y `Referrer-Policy:
  strict-origin-when-cross-origin`. El archivo estaba vacío y Next no manda
  ninguna por su cuenta. La CSP queda pendiente: necesita calibrarse en
  `Report-Only` primero.

- **Una postulación en estado final ya no se puede reabrir (CN-003).** Disparador
  `postulacion_transicion_valida`: de `aceptada`, `rechazada` o `cancelada` no se
  sale.
  Motivo: la empresa podía revivir una postulación que el postulante había
  cancelado. RLS no ve `OLD`, así que la regla va en un disparador.
  → [`decisiones.md`](./decisiones.md)

- **`postcss` sin vulnerabilidades conocidas.** `"overrides": { "postcss":
  "^8.5.23" }` sube la transitiva de 8.4.31 a 8.5.28 en las dos ramas del árbol.
  `npm audit` baja de 2 (1 high, 1 moderate) a 0.
  Motivo: el fix que proponía npm era `next@16.3.5`, un salto de major en medio
  del MVP. El override arregla lo mismo sin mover `next`.

- **La marca y «Cerrar sesión» dejan de estar ocultas en móvil.** En
  `BarraLateral` eran `hidden lg:flex` / `hidden lg:block`: desde un teléfono
  no había ninguna forma de cerrar sesión. Ahora comparten una fila en angosto
  y `lg:contents` + `order` las devuelve a su lugar de siempre en escritorio.
  Motivo: era una función sin camino, no un detalle de presentación.

- **La fila de secciones se desplaza en vez de desbordar la página.** El `nav`
  lleva `min-w-0` y la lista `snap-x snap-mandatory`. Sin el `min-w-0`, los
  556 px de las cinco secciones estiraban la grilla entera a 574 px dentro de
  un viewport de 390 y «Mi perfil» quedaba fuera de la pantalla, sin scroll
  horizontal que la alcanzara. Ver [`decisiones.md`](./decisiones.md).

- **El foco de teclado vuelve a verse.** Se saca `focus:outline-none` de
  `CAMPO` y de `BuscadorVacantes`: la utilidad vive en la capa `utilities` y
  pisaba el `:focus-visible` de `globals.css`, así que todos los campos de la
  aplicación quedaban sin anillo de foco. Además `Boton` enumera las
  propiedades de su transición en lugar de usar `transition-colors`, que en
  Tailwind 4 incluye `outline-color` y hacía que el anillo tardara 150 ms y
  arrancara blanco sobre el azul del botón primario.

- **`--color-borde` pasa de `#e5e7eb` a `#7d8795`.** Daba 1.24:1 contra la
  superficie blanca y 1.16:1 contra el lienzo, cuando WCAG 1.4.11 pide 3:1
  para el contorno de un control: los campos no se leían como campos ni las
  tarjetas como tarjetas. `--color-borde-fuerte` acompaña a `#667085` para que
  el hover siga oscureciendo el borde y no aclarándolo.

- **El botón deshabilitado deja de apoyarse en la opacidad.** `disabled:`
  pasa a fondo `superficie-suave` con texto `tinta-media` (7.36:1) en lugar de
  blanco sobre `tinta-tenue` al 70 % (2.58:1).
  Motivo: ahí viven «Entrando…», «Creando la cuenta…» y «Ya te postulaste»,
  que son justo los textos que hay que poder leer.

- **Semántica: se cae el `role="tab"` y aparece el `<main>` que faltaba.** Las
  pestañas de `/inicio` son enlaces de navegación y se marcan con
  `aria-current="page"`, no con un patrón ARIA de pestañas que prometía un
  `tabpanel` inexistente; los filtros de `/empleos` corrigen
  `aria-current="true"` por `"page"`; los layouts de `(app)/` y `(auth)/`
  envuelven el contenido en `<main>`. axe-core pasa de 2 violaciones a 0 en
  `/login` y `/registro`.

- **Las imágenes de `Avatar` y `TarjetaEvento` declaran `width`/`height`.** Las
  clases reservaban el espacio recién con la hoja de estilos aplicada; el
  atributo lo reserva desde el HTML.

- **`SIN_CONFIGURAR` vuelve, separada de `SIN_SESION`.** El `if (!supabase)` de
  las cinco acciones devuelve «La conexión con Supabase no está configurada.
  Cargá las credenciales en .env.local.»; el `if (!user)` sigue con «Necesitás
  iniciar sesión para hacer esto.».
  Motivo: unificarlas más temprano hoy —mismo día— ahorraba una constante y
  costaba un diagnóstico: a quien no cargó `.env.local` le decía que iniciara
  sesión, que es el único camino que no lo arregla.

- **Se borra el código sin consumidor.** `src/lib/supabase/client.ts` entero
  (ningún archivo lo importaba: todo es Server Component), `supabaseConfigurado()`
  de `config.ts` y la prop `acciones` de `Encabezado`, que ninguna de las cinco
  pantallas pasaba.
  Motivo: cada export sin uso es una promesa que alguien va a creer. El catálogo
  de `arquitectura.md` §5 los documentaba como si estuvieran en servicio.

- **`cancelarInscripcion` y `TIPOS_CUENTA` se dejan, pero anotados.** El primero
  implementa RF4.6 y espera su botón; los segundos son la mitad declarada de la
  deuda 7.5. Quedan registrados en `plan.md` (Hito 4 e Hito 6) para que no se
  vuelvan a leer como huérfanos.

- **`AvatarEditable` deja de inventar su propio cartel de aviso.** Se extrajo
  `Aviso` de `AvisoOrigen` —la caja con el ícono y el tono «atención»— y ahora
  los dos la usan.
  Motivo: era el único lugar de la aplicación que se armaba un aviso propio.
  No se lo pasó por `AvisoOrigen` directamente porque ese componente habla de
  lecturas de la base («cargá las credenciales, aplicá schema.sql») y lo que
  `AvatarEditable` avisa es que falta Supabase Storage: mismo aspecto, otro
  texto.

- **`ui/` puede conocer `Resultado`, y solo eso.** `arquitectura.md` §5.7
  declaraba que `ui/` no toca el dominio mientras `AvisoOrigen` importaba de
  `lib/data/`. Se documenta como la única excepción, con el motivo.
  Motivo: una regla que el código ya viola en un punto se deja de leer entera.

- **Las rutas de `(app)/` dejan de ser accesibles sin sesión.** El middleware
  redirige a `/login` a quien entre sin usuario, salvo en `/login` y
  `/registro`; `obtenerPerfilActual` hace lo mismo como segunda barrera y ya no
  devuelve `PERFIL_EJEMPLO` en ese caso.
  Motivo: desde que existe el login, devolver el perfil de demostración a quien
  no inició sesión es mostrarle un perfil inventado como si fuera suyo. El
  control va en el middleware porque es el único punto por el que pasan las
  cinco pantallas.
  → [`decisiones.md`](./decisiones.md)

- **`SIN_SESION` y `SIN_CONFIGURAR` se unifican en una sola constante.** El
  texto de `SIN_SESION` decía que RF1.3 «todavía no está implementado», lo que
  dejó de ser cierto; ahora dice «Necesitás iniciar sesión para hacer esto.» y
  la usan las cinco acciones (`auth`, `perfil`, `eventos`, `postulaciones`).
  Motivo: eran dos constantes para el mismo desenlace —no hay sesión utilizable
  y la salida es iniciar sesión— y ya habían divergido en el texto.

- **`arquitectura.md` se pone al día con la autenticación.** §4 y §5.4 dejan de
  decir que `(auth)/` está vacía y que el middleware no protege nada; §5.7 suma
  `registrarse`, `iniciarSesion` y `cerrarSesion`; §5.8 suma `Campo`,
  `FormularioLogin`, `FormularioRegistro` y las páginas `/login` y `/registro`;
  la deuda 7.3 pasa de «no hay autenticación» a lo que queda afuera (registro
  de empresa, recuperación de contraseña).
  Motivo: el catálogo está escrito a mano y no se regenera solo.

## 2026-09-11

- **Registro e inicio de sesión para cuentas individuales** (RF1.1, RF1.3).
  Pantallas `/registro` y `/login` en `src/app/(auth)/`, con `registrarse()`,
  `iniciarSesion()` y `cerrarSesion()` en `src/lib/acciones/auth.ts`.
  Motivo: era el Hito 1 del plan y lo que desbloquea todo lo demás — hasta
  ahora ninguna consulta tenía sesión y todas caían en datos de ejemplo.
  El registro de empresa, la recuperación de contraseña y la protección de
  rutas quedan fuera.
  → [`decisiones.md`](./decisiones.md) por cómo se resuelve la confirmación
  por correo.

- **El nombre de usuario repetido se detecta antes de crear la cuenta.** El
  registro consulta `perfiles` por `nombre_usuario` antes del `signUp`.
  Motivo: sin eso el choque aparecía al insertar en `perfiles`, que con la
  confirmación por correo activada ocurre en el primer inicio de sesión — la
  persona se enteraba después de haberse registrado. No elimina la carrera
  entre dos registros simultáneos; el índice único sigue siendo la defensa
  final.

- **Los errores de la base llegan traducidos, no crudos.** El `23514` del
  constraint `perfiles_mayor_de_edad` se lee como «Tenés que ser mayor de 18
  años para registrarte», y el `23505` de `nombre_usuario` como «Ese nombre
  de usuario ya está en uso». El login responde lo mismo ante contraseña
  incorrecta y correo inexistente.
  Motivo: la edad la valida la base y el código solo traduce su respuesta, así
  que la regla vive en un solo lugar. Distinguir los dos errores de login
  revelaría qué direcciones están registradas.

- **`Campo` y `CAMPO` pasan a `src/components/ui/Campo.tsx`.** Estaban
  privados dentro de `FormularioPerfil`.
  Motivo: los tres formularios los necesitan; extraerlos evitó dos copias.

- **`db/seed.sql` deja de borrar filas.** Se quitó el bloque de limpieza que
  hacía `delete from tags` y `delete from habilidades` con los nombres de dos
  versiones anteriores del catálogo.
  Motivo: las cuatro tablas puente referencian esas tablas
  `on delete cascade`, así que correr el seed sobre una base con datos se
  llevaría los intereses de cada perfil, las habilidades de cada vacante y los
  tags ocultos del matching de RF3.9, en silencio. Queda como inserts puros
  con `on conflict (nombre) do nothing`.
  → `1d36cf5`

- **`README.md` corregido tras la migración a `schema.sql`.** Mandaba a
  ejecutar cinco archivos de `db/migrations/` y `db/seed/` borrados en
  `6b6bf86`, enlazaba a `db/README.md` (también borrado) y listaba la skill
  `datos-linkyouth`. El flujo real es `schema.sql`, `politicas.sql` y
  `seed.sql`, en ese orden.

- `e5e3050` — **Catálogo de tags y habilidades** en `db/seed.sql`: 36 tags de
  interés y 20 habilidades técnicas (RF2.3, RF1.1.11, RF2.4.3, RF2.4.4).
  Motivo: `perfil_tags` y `perfil_habilidades` apuntan a catálogos cerrados
  que el usuario no crea, así que sin seed no hay nada que elegir en el
  perfil.
  Entrada agregada después del hecho: el commit fue directo a `main`, sin rama
  ni PR, y sin pasar por acá.

- **Se saca de `arquitectura.md` la nota de «capa de datos en reescritura».**
  Motivo: la reescritura terminó en `dd2685c`; la nota contradecía a §3 y §5,
  que ya describen esa capa funcionando. De paso, `CLAUDE.md` decía «cuatro
  reglas estructurales» y §2 tiene tres.

## 2026-09-10

- **`src/types/database.ts` queda fuera de Prettier.** Se agregó a
  `.prettierignore`.
  Motivo: lo genera `supabase gen types` sin punto y coma. Formatearlo cambia
  485 líneas y la próxima regeneración las revierte, así que el archivo
  aparecía modificado en cada `npm run format` sin que nadie lo hubiera
  tocado.

- **La capa de datos se reescribe contra `db/schema.sql`.** `src/lib/data/`
  (`tipos.ts`, `ejemplos.ts`, `consultas.ts`) y `src/lib/acciones/`
  (`perfil.ts`, `postulaciones.ts`, `eventos.ts`) vuelven a existir, ahora
  contra el esquema vigente: `inscripciones_evento`, `vacante_tags_publicos`,
  `vacante_habilidades`, `perfil_habilidades` y `bio`/`foto_url`. Los 18
  `// TODO: reconectar contra db/schema.sql` quedaron resueltos y el proyecto
  vuelve a compilar.
  Motivo: era el Hito 0.1 del plan y lo que bloqueaba todo lo demás.
  Cierra las deudas 7.1, 7.2 y 7.3 anteriores.

- **Los alias de tipo del esquema viven en `src/lib/data/tipos.ts`.** Cada
  conjunto cerrado (`TipoOportunidad`, `EstadoPostulacion`, `EstadoFormacion`,
  `EstadoVacante`, `EstadoEvento`, `TipoCuenta`) va con su función de
  estrechamiento.
  Motivo: el esquema usa `text` + `check`, así que `gen types` los devuelve
  como `string`. No pueden vivir en `src/types/database.ts` porque el próximo
  `gen types` los pisaría.
  → [`decisiones.md`](./decisiones.md)

- **`cancelarPostulacion` pasa a ser un cambio de estado.** Actualiza a
  `cancelada` en vez de borrar la fila.
  Motivo: de `postulaciones` no se borra nada, y la política
  `postulaciones_transiciones_permitidas` habilita justamente esa transición
  al postulante. Cierra la contradicción que quedó registrada como deuda 7.3.

- **La interfaz deja de mostrar lo que el esquema no guarda.** Se quitaron
  salario, modalidad, ubicación, cupos y conteo de inscriptos, nivel de
  dominio y categoría de las etiquetas, y años, acreditación y logo de las
  instituciones. También la insignia de «verificado» y su ícono, que quedó sin
  uso.
  Motivo: no inventar columnas. La lista completa quedó en `arquitectura.md`
  §7.1 para que el equipo decida cuáles vale la pena agregar al esquema; para
  una plataforma de empleo, salario y modalidad son las dos que más se van a
  extrañar.

- **El perfil muestra intereses y habilidades por separado.** `tags` y
  `habilidades` son dos catálogos distintos en el esquema, y la tarjeta de
  vacante los presenta igual: «áreas de interés» y «habilidades».
  Motivo: el comentario de `db/schema.sql` lo dice explícitamente — el
  matching de RF3.9 necesita distinguir «le interesa» de «sabe hacer».
  Mezclarlos en la interfaz habría borrado esa distinción.

- **Se resuelve el conflicto entre los dos esquemas de base.** El equipo
  decidió mantener `db/schema.sql` + `db/politicas.sql`; `db/migrations/` y
  `db/seed/` se eliminaron.
  Motivo: `schema.sql` es el esquema que está aplicado en Supabase.
  `supabase gen types` sobre la base real lo confirma — devuelve `cuentas`,
  `inscripciones_evento`, `vacante_tags_publicos` y `cuenta_activa`. El de
  `migrations/` nunca corrió contra una base real.
  Arrastró la eliminación de `src/lib/data/` y `src/lib/acciones/`, que
  consultaban tablas y columnas inexistentes en el esquema vigente, y de la
  skill `datos-linkyouth`, que lo documentaba. 18 imports quedaron marcados
  con `// TODO: reconectar contra db/schema.sql`. El proyecto no compila
  hasta que esa capa se reescriba: es un estado conocido.
  → `6b6bf86`

- **Documentación corregida tras esa decisión.** `arquitectura.md` reemplaza
  el catálogo de la capa de datos por una nota de reescritura, y documenta
  las seis funciones que sí existen en `db/schema.sql`:
  `set_actualizada_en`, `notificar_cambio_estado_postulacion`,
  `validar_tipo_cuenta`, `validar_cambio_tipo_cuenta`, `cuenta_activa` y
  `postulacion_identidad_inmutable`. El Hito 0.1 del plan pasa de resolver el
  conflicto de esquemas a reescribir la capa de datos.

- **Se resuelve la contradicción de la edad del SRS**: la plataforma admite
  solo mayores de 18 años.
  Motivo: RF1.1.8 y RNF6 se contradecían, y la diferencia define quién puede
  registrarse. Admitir menores exigiría consentimiento de un adulto
  responsable y un encuadre legal más estricto, fuera del alcance del MVP.
  La regla vive en `db/schema.sql` como la restricción
  `perfiles_mayor_de_edad`.
  → [decisiones.md](./decisiones.md)

- **Documentación del proyecto.** Se agregan `docs/arquitectura.md` (mapa,
  reglas estructurales y catálogo de todas las funciones), este `CHANGELOG.md`
  y `docs/plan.md` (hoja de ruta hasta el MVP).
  Motivo: el proyecto pasó de un esqueleto a 40 archivos de código sin que
  quedara escrito en ningún lado qué hace cada pieza ni por qué.

- **Se detectan dos esquemas de base incompatibles** conviviendo en `db/`:
  `schema.sql` + `politicas.sql` contra `db/migrations/`. Queda registrado en
  `arquitectura.md` §7.1 y como primera tarea del plan. No se resuelve en este
  cambio.

- `ef0db5f`, luego aplastado en `a9a32dc` — **Mayoría de edad como check
  constraint** (RF1.1.8). `perfiles_mayor_de_edad` exige 18 años cumplidos.
  Motivo: el requisito lo pide y no estaba implementado en ninguna capa.

- `24023f6` — **`graphify-out/` al `.gitignore`; diagrama del esquema
  versionado** en `docs/diagrama-esquema.png`.
  Motivo: la salida de graphify se regenera a demanda y ensuciaba cada diff;
  el diagrama sí es documentación del proyecto.

- `ff89039` — **Trigger de exclusividad perfil/empresa por cuenta.**
  Una cuenta no puede tener fila en `perfiles` y en `empresas` a la vez, ni
  una fila que no coincida con `cuentas.tipo`.
  Motivo: varias políticas de RLS asumen que `cuentas.tipo` es correcto; si se
  desincroniza, deja de ser un dato prolijo y pasa a ser un problema de
  control de acceso.
  → [decisiones.md](./decisiones.md)

- `07fd36b` — **Endurecimiento del esquema y las políticas RLS.** Cinco
  cambios en un commit:
  - `set search_path = public, pg_temp` en todas las funciones.
    Motivo: una función `security definer` sin `search_path` fijo es
    explotable; el linter de Supabase lo marca `function_search_path_mutable`.
  - Los triggers de validación de tipo corren también en `update`, y
    `cuentas.tipo` queda bloqueado si la cuenta ya tiene fila de detalle.
    Motivo: los triggers eran solo `before insert` y el tipo se podía cambiar
    después.
  - Trigger que impide cambiar `perfil_id` o `vacante_id` de una postulación.
    Motivo: la empresa dueña de la vacante podía reasignar la postulación a
    otro perfil y dispararle una notificación que esa persona nunca pidió.
    No se puede resolver en RLS: una política no ve la fila vieja, y una que
    consulte su propia tabla falla con `infinite recursion detected in policy`.
  - La notificación de cambio de estado ya no se dispara cuando el propio
    postulante cancela. Motivo: le avisaba de su propia acción.
  - `cuentas.eliminada` pasa a tener efecto: `perfiles` y `empresas` se leen a
    través de `cuenta_activa()`. Motivo: el campo existía y ninguna política
    lo consultaba, así que la baja lógica no ocultaba nada.
  - 17 índices sobre claves foráneas y el lado inverso de las tablas puente.
    Motivo: Postgres no indexa las FK por su cuenta y las políticas de RLS
    corren un `exists()` por fila evaluada.
  → [decisiones.md](./decisiones.md)

- `a9f15a9` — **Se califica `empresa_id` en la política de reseñas.**
  `v.empresa_id = empresa_id` resolvía contra `vacantes v` y no contra la fila
  de `resenias`, así que la condición era `v.empresa_id = v.empresa_id`.
  Motivo: cualquiera con una postulación a *cualquier* empresa podía reseñar a
  *cualquier* otra.

- `9b81c4a` — **Esquema de base de datos y políticas RLS** (RF1–RF4, RF6–RF8).
  Primera versión de `db/schema.sql` y `db/politicas.sql`.

## 2026-09-09

- **Decisiones de modelado registradas**: tags y habilidades como catálogos
  separados, y reseñas habilitadas por postulación en cualquier estado.
  → [decisiones.md](./decisiones.md)

## 2026-09-08

- `8ff166a` — **Esqueleto inicial**: Next.js 15 con App Router, TypeScript en
  modo strict, Tailwind CSS, clientes de Supabase con `@supabase/ssr`,
  middleware de refresco de sesión y pantalla de verificación de conexión.
  → [decisiones.md](./decisiones.md)

- `96df4bd` — SRS del proyecto y configuración inicial de Claude Code.
