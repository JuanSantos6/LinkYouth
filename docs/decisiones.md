# Decisiones técnicas

Registro de las decisiones de arquitectura y tecnología de LinkYouth. Cada
entrada deja asentado qué se decidió, qué alternativas se evaluaron y por qué
se eligió esa opción.

---

## 2026-09-14 — La lógica de `main`, el diseño de la rama

**Decisión.** Al integrar las dos líneas de trabajo, resolver cada conflicto
con un criterio fijo: la funcionalidad se toma de `main` y el lenguaje visual
de la rama de rediseño. Después, un barrido de tokens lleva todo lo que vino
de `main` a la paleta nueva.

**Alternativas consideradas.**

- Rehacer el rediseño encima de `main`, componente por componente.
- Portar la funcionalidad a mano dentro de la rama, sin merge.

**Motivo.** Las dos alternativas tiran trabajo: la primera pierde las
decisiones de diseño que ya estaban tomadas y verificadas, la segunda pierde
el historial de `main` y con él las razones de cada arreglo de seguridad y
accesibilidad. El merge conserva los dos y deja el criterio explícito, que es
lo que hace que un conflicto no se resuelva a ojo.

El barrido de tokens fue mecánico a propósito —un mapa del sistema viejo al
nuevo, aplicado con un script— y después se revisó a mano lo que el mapa no
puede decidir: el botón primario, el borde de los campos y el rótulo en
versalitas que traía el selector de tags.

---

## 2026-09-14 — La cabecera y el pie preguntan de qué cuenta se trata

**Decisión.** Que `CabeceraGlobal` y `PieDeSitio` reciban un `area` y cambien
sus enlaces según sea público, postulante o empresa.

**Alternativas consideradas.**

- Una cabecera y un pie iguales para todos.
- Un layout distinto para cada mitad, con su propia cabecera.

**Motivo.** El middleware manda a una cuenta de empresa a su panel apenas pide
una sección del postulante. Con la cabecera única, esa cuenta veía «Mi perfil»
y «Avisos» y cada clic la devolvía al lugar donde estaba: un menú que promete
lo que no puede cumplir. Duplicar el layout arreglaba eso y traía el problema
de siempre —dos cabeceras que se van separando—, así que la diferencia queda
en un parámetro y la estructura sigue siendo una sola.

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
