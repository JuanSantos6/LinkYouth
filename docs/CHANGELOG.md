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

## 2026-09-14 (rama `claude/linkyouth-applicant-dashboard-eweeld`)

- **El rediseño «ficha técnica» absorbe todo lo funcional de `main`.** La rama
  traía la dirección visual y `main` había avanzado 28 commits con
  autenticación, registro de empresa, selección de tags, la auditoría de
  seguridad y los arreglos de accesibilidad. Se resolvieron 23 conflictos con
  un criterio fijo: la lógica viene de `main`, el lenguaje visual de la rama.
  Motivo: mantener las dos líneas separadas más tiempo significaba que cada
  arreglo había que hacerlo dos veces.

- **Paleta de cinco valores en todo lo que llegó de `main`.** Los componentes
  de autenticación, el selector de tags, el panel de empresa y los campos
  pasaron de la paleta azul a `tinta`/`papel`/`acento`/`senal`/`apagado`. El
  ámbar sigue apareciendo en dos lugares de toda la aplicación.

- **`BotonAccion` reemplaza a `BotonPostularse` y `BotonInscribirse`**, y usa
  `MensajeDeAccion` para anunciar el resultado. Se conserva el `esEjemplo` de
  `main`: sobre contenido de demostración el botón se deshabilita y lo dice,
  en vez de ofrecer una postulación que no tiene dónde guardarse.

- **`SelectorTags` reemplaza a `NubeTags`** (RF2.3, RF2.4.3). Se le quitó el
  rótulo en versalitas espaciadas, que es uno de los patrones prohibidos de la
  dirección.

- **Cabecera y pie saben de qué cuenta se trata.** Una cuenta de empresa ya no
  ve enlaces a las secciones del postulante: el middleware la rebotaría a su
  panel. `obtenerTipoCuenta()` resuelve la pregunta en una consulta.

- **Las tres pantallas públicas dejan de exigir sesión.** `/empresas`,
  `/como-funciona` y `/legales` entran en la lista `INFORMATIVAS` del
  middleware, separada de `ENTRADA`. Están enlazadas desde la cabecera y el
  pie, que aparecen en todas partes: pedir credenciales para leer qué es
  LinkYouth era un callejón sin salida.

- **`(sitio)/layout.tsx` se declara dinámico.** Leía la sesión desde un layout
  que Next prerenderizaba: la página quedaba congelada con el estado de quien
  no tiene sesión y le mostraba «Entrar» a alguien que ya había entrado.

- **Responsive verificado a 1440, 768 y 390 px.** En angosto: la cifra de
  compatibilidad encabeza la fila en vez de esconderse —es el dato que ordena
  el listado—, la fila de secciones se desplaza con anclaje, y el menú de sitio
  y el cierre de sesión quedan al alcance en la cabecera.

- **`e2e/auth.spec.ts` cubre la superficie nueva:** `/avisos` y `/ajustes`
  entre las privadas, las tres informativas entre las públicas.

---

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
