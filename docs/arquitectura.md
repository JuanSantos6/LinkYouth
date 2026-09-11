# Arquitectura de LinkYouth

Cómo está armado el proyecto, por qué está armado así, y qué hace cada función
que existe hoy.

> **La capa de datos (`src/lib/data/`, `src/lib/acciones/`) está en
> reescritura. `db/schema.sql` y `db/politicas.sql` son la única fuente de
> verdad estable hoy.**

Este documento describe **el código que está escrito**, no el que falta. Para
lo que viene, mirá [`plan.md`](./plan.md). Para el historial de cambios,
[`CHANGELOG.md`](./CHANGELOG.md). Para las decisiones con sus alternativas
completas, [`decisiones.md`](./decisiones.md).

---

## 1. El panorama

LinkYouth es una aplicación Next.js 15 con App Router sobre Supabase. No hay
servidor propio: el navegador habla con Next.js, y Next.js habla con Postgres
a través de Supabase.

```
Navegador
   │
   │  HTML ya renderizado · Server Actions
   ▼
Next.js 15 (App Router)
   │
   ├─ Server Components ──▶ src/lib/data/       (lectura)
   ├─ Server Actions    ──▶ src/lib/acciones/   (escritura)
   └─ src/middleware.ts                         (refresco de sesión)
   │
   │  @supabase/ssr · clave anon · cookies de sesión
   ▼
Supabase / PostgreSQL
   │
   ├─ Tablas + Row Level Security   ← acá vive el control de acceso
   └─ Funciones y disparadores (integridad, notificaciones, baja lógica)
```

**La consecuencia más importante de este dibujo:** la clave `anon` viaja al
navegador, es pública por diseño, y cualquiera puede usarla para hablar
directo con la API de Supabase sin pasar por nuestra interfaz. Por eso *toda*
regla de acceso está escrita como política de RLS en la base. La interfaz
nunca es la barrera; es la comodidad.

---

## 2. Las cuatro reglas estructurales

Estas decisiones explican casi todo lo demás. Cada una tiene su entrada larga
en [`decisiones.md`](./decisiones.md).

### 2.1 Server Component por defecto

Una pantalla es un Server Component salvo que necesite estado o eventos del
navegador. Consecuencias prácticas:

- Las consultas corren en el servidor. Las credenciales y el SQL no llegan
  nunca al bundle del cliente.
- Los filtros y las pestañas se hacen con enlaces y `searchParams`, no con
  `useState`. El resultado queda en la URL: se puede compartir, y el botón de
  volver funciona.
- `"use client"` aparece en 5 archivos y siempre por la misma razón: hay un
  formulario, o hay que leer la ruta activa.

### 2.2 El control de acceso vive en la base

Ninguna regla de permisos está escrita en TypeScript. Están todas en
`db/politicas.sql` como políticas de RLS. El caso testigo son los tags ocultos
de una vacante (RF3.1.6, RNF5): viven en su propia tabla
`vacante_tags_ocultos`, cuya política de lectura habilita solo a la empresa
dueña de la vacante. No existe consulta del postulante que los alcance, ni por
descuido ni a propósito.

Las 49 políticas cubren las 18 tablas del esquema. Toda tabla tiene
`enable row level security`.

### 2.3 La lógica de negocio no vive en el componente

Un componente recibe datos y los muestra. El cálculo de compatibilidad, el
orden del feed y las reglas de estado de una postulación viven en clases
propias, en `src/lib/dominio/`.

La regla práctica: si estás por escribir un `if` sobre una regla de negocio
dentro de un `.tsx`, va en una clase. Antes de esta separación, `afinidad()`
se armaba dentro de `TarjetaVacante` y las etapas del proceso estaban
repartidas entre la página de postulaciones y `formato.ts`.

### 2.4 La aplicación tiene que poder arrancar sin base

Un clon recién hecho, sin `.env.local`, no debería romper: `leerCredenciales()`
devuelve `null` en vez de lanzar, y `createClient()` propaga ese `null` para
que quien consulta decida qué hacer.

Cómo se comporta la interfaz cuando no hay base es parte de lo que la
reescritura de la capa de datos tiene que volver a definir. La regla que se
mantiene: **si lo que se muestra no salió de la base, hay que decirlo en
pantalla**. Mostrar datos inventados sin aclararlo sería engañoso, y en una
demo a terceros es la diferencia entre una maqueta honesta y una mentira.

---

## 3. Cómo viajan los datos

Toda lectura entra por `src/lib/data/consultas.ts` y toda escritura por
`src/lib/acciones/`. Ninguna pantalla arma su propio cliente de Supabase.

**Lectura.** Cada consulta devuelve un `Resultado<T>`: los datos y de dónde
salieron. Si faltan las credenciales, si la consulta falla o si la tabla está
vacía, se responde con el contenido de `ejemplos.ts` y `origen: "ejemplo"`, y
la pantalla lo anuncia con `AvisoOrigen`. Es la implementación de la regla
§2.3.

**Escritura.** Cada acción lleva `"use server"`, valida los campos en el
servidor, comprueba que haya sesión y devuelve un `EstadoAccion` que el
formulario consume con `useActionState`. La acción no reemplaza a la política
de RLS: la acompaña. Quien decide es la base.

**Los tags ocultos.** Ninguna consulta menciona `vacante_tags_ocultos`, y no
hace falta que se cuide de hacerlo: la política de RLS ya se los niega a
cualquier sesión que no sea la empresa dueña de la vacante (RF3.1.6, RNF5).

**Los alias de tipo.** El esquema usa `text` + `check` en vez de enums de
Postgres, así que `supabase gen types` devuelve esas columnas como `string`.
Los alias (`TipoOportunidad`, `EstadoPostulacion`, `EstadoFormacion`…) viven
en `src/lib/data/tipos.ts` junto con una función de estrechamiento por cada
uno. No pueden vivir en `src/types/database.ts`: el próximo `gen types` los
pisaría.

---

## 4. El mapa de archivos

```
db/
  schema.sql              Tablas, restricciones, funciones y disparadores
  politicas.sql           Row Level Security (49 políticas, 18 tablas)

docs/                     SRS, decisiones, plan, changelog, este documento

src/app/
  layout.tsx              Layout raíz (lang="es", fuentes)
  page.tsx                Redirige al feed
  (app)/layout.tsx        Cabecera, barra lateral y pie
  (app)/inicio|empleos|eventos|postulaciones|
        perfil|ajustes|avisos/page.tsx  Las siete pantallas de la cuenta
  (sitio)/layout.tsx      Cabecera y pie, sin barra lateral
  (sitio)/empresas|como-funciona|
          legales/page.tsx                Las tres pantallas públicas
  (auth)/                 Vacía: login y registro pendientes

src/components/
  ui/                     Primitivas sin dominio
  layout/                 Estructura y navegación
  empleos/ eventos/ perfil/   Por dominio

src/lib/
  supabase/               Clientes y credenciales
  data/                   Lectura: tipos.ts, ejemplos.ts, consultas.ts
  acciones/               Escritura: perfil, postulaciones, eventos
  dominio/                Reglas de negocio: Compatibilidad, FeedDeVacantes,
                          ProcesoDePostulacion
  diseno/                 Tokens de color y preferencias de apariencia
  formato.ts              Fechas y etiquetas

src/types/database.ts     Tipos generados desde la base real
src/middleware.ts         Refresco de sesión en cada request
```

---

## 5. Catálogo de funciones

Cada entrada dice qué hace la función y, cuando no es obvio, por qué existe.

### 5.1 `src/lib/supabase/config.ts`

#### `leerCredenciales(): CredencialesSupabase | null`

Lee `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` del entorno.
Devuelve `null` si falta cualquiera de las dos, en vez de lanzar.

Es el único punto del código que toca esas variables. Que devuelva `null` en
lugar de fallar es lo que sostiene la regla §2.3.

#### `supabaseConfigurado(): boolean`

Azúcar sobre la anterior para cuando solo interesa el sí o el no.

### 5.2 `src/lib/supabase/client.ts`

#### `createClient()`

Cliente de Supabase para Client Components, con los tipos de `Database`
aplicados. Devuelve `null` si no hay credenciales.

### 5.3 `src/lib/supabase/server.ts`

#### `async createClient()`

Cliente para Server Components, Route Handlers y Server Actions. Lee y escribe
las cookies de sesión a través de `cookies()` de Next.js.

Es `async` porque en Next.js 15 `cookies()` pasó a ser asíncrono. El `setAll`
está envuelto en `try/catch` a propósito: un Server Component no puede
escribir cookies, y el middleware ya refrescó la sesión, así que ese error
específico se puede ignorar sin perder nada.

### 5.4 `src/middleware.ts`

#### `async middleware(request)`

Corre en cada request. Revalida el token de Supabase con `auth.getUser()` y
reescribe las cookies rotadas en la respuesta.

Si no hay credenciales, deja pasar el request intacto en vez de romper toda la
navegación. Hoy **no protege ninguna ruta**: solo refresca. La protección de
`(app)/` entra con el módulo de autenticación (ver `plan.md`, Hito 1).

#### `config`

El `matcher` excluye `_next/static`, `_next/image`, `favicon.ico` y los
archivos de imagen. Sin eso, el middleware correría en cada ícono y cada
fuente, y cada uno pagaría una revalidación de token.

### 5.5 `src/lib/formato.ts`

Funciones puras. No tocan la base ni el DOM. Todas usan `es-UY` y la zona
`America/Montevideo`, fijas: el servidor puede estar en cualquier huso, y la
fecha de un evento tiene que leerse igual para todos.

Importa sus alias de tipo de `src/lib/data/tipos.ts` (ver §3).

#### `fechaLarga(iso): string`

`"sábado 15 de octubre"`. Sin hora: la pone `hora()` y no se repite.

#### `fechaBloque(iso): { dia, mes }`

`{ dia: "15", mes: "OCT" }` para el bloque de fecha de una tarjeta de evento.

#### `hora(iso): string`

`"18:30"`. Reloj de 24 h: es el formato de una agenda. No hay rango porque
`eventos.fecha_hora` es un único instante: el esquema no guarda hora de fin.

#### `tiempoRelativo(iso): string`

`"hace 2 horas"`, `"hace 3 días"`. Escala sola de minutos a meses.

#### `etiquetaTipo(t)` · `etiquetaEstadoFormacion(e)`

Traducen los valores del esquema al texto de la interfaz. La etiqueta del
estado de una postulación ya no está acá: es una regla de negocio y vive en
`ProcesoDePostulacion` (§5.8).

#### `iniciales(texto): string`

Hasta dos iniciales en mayúscula, para el avatar sin foto.

### 5.6 `src/lib/data/`

#### `tipos.ts`

Alias de los conjuntos cerrados del esquema (`TipoOportunidad`,
`EstadoVacante`, `EstadoPostulacion`, `EstadoFormacion`, `EstadoEvento`,
`TipoCuenta`), cada uno con su constante `readonly` y su función de
estrechamiento (`comoTipoOportunidad`, `comoEstadoPostulacion`, …). Las
funciones convierten el `string` que devuelve Supabase y, si el valor no está
en el conjunto, caen en un respaldo en vez de romper la pantalla: eso solo
pasa si el esquema cambió y el código todavía no.

También define las formas que consume la interfaz — `Vacante`, `Evento`,
`PerfilCompleto`, `Formacion`, `PostulacionResumen`, `EmpresaResumen` — y el
envoltorio `Resultado<T>` con su `OrigenDatos`.

`Vacante` separa `tags` de `habilidades` porque el esquema los separa: son dos
catálogos distintos, y el matching de RF3.9 necesita distinguir «le interesa»
de «sabe hacer».

#### `ejemplos.ts`

Contenido de demostración con la forma exacta que devuelven las consultas:
`VACANTES_EJEMPLO`, `EVENTOS_EJEMPLO`, `PERFIL_EJEMPLO`,
`POSTULACIONES_EJEMPLO`. Solo usa campos que existen en `db/schema.sql`.

#### `consultas.ts`

`import "server-only"`: si alguna vez se importa desde un componente de
cliente, el build falla en vez de filtrar la consulta al navegador.

| Función | Devuelve | Requisito |
| --- | --- | --- |
| `obtenerVacantes(filtros?)` | `Resultado<Vacante[]>` | RF3.5.1. Filtra por tipo y busca por título. |
| `obtenerEventos(limite?)` | `Resultado<Evento[]>` | RF4.4.1. Solo eventos activos que todavía no ocurrieron. |
| `obtenerPerfilActual()` | `Resultado<PerfilCompleto>` | RF2.1. Sin sesión devuelve el perfil de ejemplo. |
| `obtenerPostulaciones()` | `Resultado<PostulacionResumen[]>` | RF3.7. |
| `obtenerVacantesPostuladas()` | `Set<string>` | RF3.6.2. Incluye las canceladas: la restricción única no mira el estado. |
| `obtenerEventosInscriptos()` | `Set<string>` | RF4.5. |

Las tres consultas grandes traen sus relaciones en un solo `select` anidado
(`empresas ( … )`, `vacante_tags_publicos ( tags ( nombre ) )`). Los tipos
generados traen los metadatos de las claves foráneas, así que TypeScript
infiere la forma del resultado sin ayuda. `nombresDe()` aplana esas tablas
puente a una lista de nombres ordenada.

Cuando el join con `empresas` viene vacío —la cuenta de la empresa fue dada de
baja y `cuenta_activa` la deja fuera— la fila se descarta con `flatMap` en vez
de mostrarse sin organizador.

### 5.7 `src/lib/acciones/`

Todas llevan `"use server"`, reciben `(estadoPrevio, FormData)` y devuelven
`EstadoAccion` (`{ estado, mensaje }`), que el formulario consume con
`useActionState`. `tipos.ts` exporta además `ACCION_INICIAL`, `SIN_SESION` y
`CLAVE_DUPLICADA` (el `23505` de Postgres).

| Función | Qué hace | Requisito |
| --- | --- | --- |
| `postularse` | Inserta la postulación. El estado inicial `pendiente` es el default de la columna. | RF3.6 |
| `cancelarPostulacion` | **Actualiza** el estado a `cancelada`. No borra la fila. | RF3.8 |
| `inscribirse` | Inserta en `inscripciones_evento`. | RF4.5 |
| `cancelarInscripcion` | Borra la inscripción. Acá sí se borra: la tabla no lleva estado y la política habilita el `delete` al dueño. | RF4.6 |
| `actualizarPerfil` | Actualiza nombre, apellido, país y biografía. | RF1.5, RF2.2 |

El mensaje de error nunca se muestra crudo cuando se lo puede traducir: el
`23505` de una postulación repetida se lee como «Ya te habías postulado a esta
búsqueda».

El límite de 600 caracteres de la biografía vive solo en `actualizarPerfil`:
`db/schema.sql` declara `bio` como `text` sin restricción, así que es una
decisión de producto, no del esquema.

### 5.8 `src/lib/dominio/`

Las reglas de negocio, fuera de los componentes (§2.3). Ninguna clase hereda
de otra: entre comparar etiquetas, ordenar un listado e interpretar un estado
no hay comportamiento compartido, y una jerarquía ahí sería decorativa.

#### `Compatibilidad`

`Compatibilidad.entre(vacante, perfil)` compara lo que pide la vacante —sus
tags públicos y sus habilidades— con lo que el perfil declara. Expone
`medible`, `porcentaje`, `alta` y `cubre(requisito)`.

Es una clase y no una función porque la pantalla necesita tres cosas del mismo
cálculo. Devolver solo el número obligaba a cada componente a rehacer la
comparación.

Solo mira datos públicos. El puntaje de RF3.9 usa los tags ocultos, se calcula
en la base y lo ve únicamente la empresa.

#### `FeedDeVacantes`

`FeedDeVacantes.armar(vacantes, perfil)` ordena por compatibilidad y, a
igualdad, por fecha. Marca **una sola** entrada como destacada, y solo si su
compatibilidad es alta: encabezar un listado flojo no es un logro.

#### `ProcesoDePostulacion`

`new ProcesoDePostulacion(estado)` responde qué significa ese estado para
quien postuló: `etiqueta`, `etapa`, `cancelable`, `cerradoSinPuesto`,
`aceptada` y `alcanzo(etapa)`. Las tres etapas visibles no son los cinco
estados de la base: `aceptada`, `rechazada` y `cancelada` caen todas en la
última.

### 5.9 `src/lib/diseno/`

#### `tokens.ts`

Fuente de verdad del color: los cinco valores base, los cinco acentos con su
versión clara y oscura, las claves de `localStorage` y `reglasDeAcento()`, que
genera el CSS de los acentos para inyectar una vez en el `<head>`. Agregar un
color es tocar solo `ACENTOS`.

#### `PreferenciasDeApariencia`

Lee y escribe `data-tema` y `data-acento` en el elemento raíz y los persiste.
`delDocumento()` la construye; `alternarTema()` y `cambiarAcento()` la
modifican. No lanza nunca: con el almacenamiento bloqueado la elección vale
para la sesión en curso.

### 5.10 Componentes

Rediseñados bajo la dirección «ficha técnica» (ver la skill
`.claude/skills/diseno-linkyouth`). Lo que la interfaz mostraba y el esquema
no guarda —salario, modalidad, ubicación, cupos, nivel de una habilidad, años
y acreditación de un estudio— sigue fuera: no se inventan columnas.

#### `ui/` — primitivas, sin dominio

| Componente | Props | Qué resuelve |
| --- | --- | --- |
| `Tarjeta` | `como?`, `elevada?`, + props del elemento | Superficie con borde. Ya no envuelve todo: las vacantes son filas con filetes. `elevada` solo para lo que está realmente por encima del plano. |
| `Boton` | `variante?`, + props de `<button>` | Botón de acción. |
| `BotonEnlace` | `variante?`, + props de `<Link>` | Mismo aspecto, pero navega. Separado del anterior porque un enlace no es un botón para un lector de pantalla. |
| `Avatar` | `nombre`, `url`, `tamano?`, `forma?` | Foto o iniciales. Reserva el espacio siempre, así la grilla no salta. Usa `<img>` y no `next/image` porque los archivos viven en Supabase Storage, con dominios variables. |
| `Etiqueta` | `children`, `coincide?` | Un tag o una habilidad. Lo que el perfil ya declara se marca con ✓ y más peso, nunca con relleno de color: seis etiquetas pintadas son un fondo, no una señal. |
| `Insignia` | `children`, `tono?` | Estado. `tono="acreditado"` es el único que usa ámbar, y solo para una postulación aceptada. |
| `EstadoVacio` | `titulo`, `descripcion`, `accion?` | Qué se ve cuando una lista viene vacía. Borde punteado: dice «acá va a haber algo» sin fingir que lo hay. |
| `MensajeDeAccion` | `estado` | El resultado de una acción, al lado del control. El error se distingue por peso, filete y la palabra «No se pudo»: la paleta no tiene rojo a propósito. |
| `AvisoOrigen` | `resultado` | Avisa en pantalla que lo que se ve es contenido de demostración, y por qué. Implementa la regla §2.3. |

#### `layout/` — estructura

| Componente | Props | Qué resuelve |
| --- | --- | --- |
| `CabeceraGlobal` | — | Barra superior fija en todas las pantallas: marca, navegación de sitio, avisos y avatar. Se reparte el trabajo con la lateral: acá está a dónde se puede ir en LinkYouth, allá las secciones de tu cuenta. |
| `PieDeSitio` | — | Cuatro columnas, copyright y el repositorio. Es la única red que figura, porque es la única que existe. |
| `Marca` | `href?` | El sello con las iniciales. Sin ámbar: un logo no acredita nada. |
| `BarraLateral` | — | Las seis secciones de la cuenta. `"use client"` solo para leer `usePathname()`. La activa lleva filete vertical, no píldora rellena. Lleva `min-w-0`: sin eso su fila desplazable ensancha el documento entero en el teléfono. |
| `Encabezado` | `titulo`, `descripcion?`, `acciones?` | Encabezado de sección. |
| `BuscadorVacantes` | `accion`, `valor?`, `placeholder?` | Formulario **GET**: el resultado queda en la URL, se comparte, y volver atrás funciona. Anda sin JavaScript. |
| `Iconos` | `className?` | Diez íconos SVG en línea, todos sobre grilla de 24 y trazo 1.75. Inline y no una librería: una dependencia entera para diez trazos no se paga sola. |

#### `empleos/` · `eventos/` · `perfil/` — por dominio

| Componente | Props | Qué resuelve |
| --- | --- | --- |
| `ListadoDeVacantes` | `feed`, `yaPostuladas` | La destacada suelta arriba y elevada; el resto, filas separadas por filetes. |
| `FilaVacante` | `entrada`, `yaPostulado?` | Una vacante. No es tarjeta. El porcentaje va en `.cifra` y nunca solo: al lado están las etiquetas que lo explican. |
| `BotonPostularse` | `vacanteId`, `yaPostulado?` | Postulación en un paso (RF3.6). Anuncia el resultado en una región `aria-live`. |
| `TarjetaEvento` | `evento`, `yaInscripto?` | Sí es tarjeta: tiene imagen y fecha propias. Sin imagen no se inventa una banda de color; el bloque de fecha pasa a ser el ancla. Sin cupos ni conteo de inscriptos: el esquema no guarda cupo y la RLS no deja contar las ajenas. |
| `BotonInscribirse` | `eventoId`, `yaInscripto?` | Inscripción a un evento (RF4.5). |
| `TarjetaUsuario` | `perfil`, `postulaciones` | Cabecera del perfil con métricas de actividad propia. |
| `FormularioPerfil` | `perfil` | Edición de los datos públicos (RF1.5, RF2.2). |
| `AvatarEditable` | `nombre`, `url` | Vista previa al elegir archivo. La subida a Storage no está implementada: el componente avisa qué falta en vez de simular que guardó. |
| `BotonCancelarPostulacion` | `postulacionId` | Cancela una postulación propia (RF3.8) pasándola a `cancelada`. No borra la fila. |
| `NubeTags` | `tags`, `habilidades` | Dos grupos separados, «lo que sabés hacer» y «hacia dónde querés ir», porque son dos catálogos distintos en el esquema. Sin nivel de dominio: `perfil_habilidades` es una tabla puente sin más columnas. |
| `ControlesDeApariencia` | — | Switch de tema y selector de acento. Lee el estado del elemento raíz al montarse: con su propio valor por defecto diría «claro» mientras la pantalla se ve oscura. |
| `ListaFormacion` | `formaciones` | Estudios declarados. Cuadro fijo a la izquierda con las iniciales de la institución, para que la lista se lea alineada. El esquema no guarda logo, años ni acreditación. |

#### Páginas

| Ruta | Función | Qué hace |
| --- | --- | --- |
| `/` | `Home` | Redirige a `/inicio`. |
| `/ajustes` | `PaginaAjustes` | Tema y color de la plataforma. |
| `/avisos` | `PaginaAvisos` | Bandeja de notificaciones (RF6.1). |
| `/empresas` · `/como-funciona` · `/legales` | — | Pantallas públicas, sin barra lateral. |
| `/inicio` | `PaginaInicio` | Feed combinado con pestañas por `searchParams`. Incluye `Pestanas` (privada). |
| `/empleos` | `PaginaEmpleos` | Listado con búsqueda y filtro por tipo. |
| `/eventos` | `PaginaEventos` | Agenda de eventos próximos. |
| `/postulaciones` | `PaginaPostulaciones` | Postulaciones propias con su recorrido de estados y la opción de cancelar. Incluye `pasoActual` y `Recorrido` (privadas). |
| `/perfil` | `PaginaPerfil` | Perfil propio y su edición. Incluye `Seccion` (privada). |

Las pantallas de `(app)/` que leen datos declaran
`export const dynamic = "force-dynamic"`: son por sesión, y cachearlas
mostraría el perfil de otro. `/ajustes` no lo necesita: su estado vive en el
navegador.

### 5.11 Funciones en la base

Definidas en `db/schema.sql`. Las seis fijan `set search_path = public,
pg_temp`: una función `security definer` sin `search_path` fijo es explotable
por quien pueda crear objetos en un esquema que preceda a `public`, y el
linter de Supabase lo reporta como `function_search_path_mutable`.

#### `set_actualizada_en() returns trigger`

`db/schema.sql:140` · Disparador `postulaciones_actualizada_en`
(`before update on postulaciones`).

Pone `actualizada_en = now()` en cada modificación. Está en la base y no en la
aplicación para que valga sin importar desde dónde venga la escritura.

#### `notificar_cambio_estado_postulacion() returns trigger`

`db/schema.sql:219` · `security definer` · Disparador
`postulaciones_notificar_cambio` (`after update on postulaciones`).

RF6.2. Crea la notificación cuando cambia el estado de una postulación.

Es `security definer` porque inserta en la cuenta del **postulante**, no en la
de quien ejecuta la acción: la empresa que cambia el estado no tiene permiso
para escribir en las notificaciones de otro.

No notifica cuando el estado nuevo es `cancelada`. Según `db/politicas.sql`,
esa es la única transición que hace el propio postulante, así que la
notificación le estaría avisando de su propia acción.

#### `validar_tipo_cuenta() returns trigger`

`db/schema.sql:252` · `security definer` · Disparadores
`perfiles_valida_tipo` y `empresas_valida_tipo`
(`before insert or update` en cada tabla).

Una cuenta es individual **o** empresa, nunca las dos. La función usa
`TG_TABLE_NAME` para saber desde cuál de las dos tablas se la llamó, y
verifica dos cosas: que `cuentas.tipo` coincida con la tabla, y que la cuenta
no tenga ya una fila en la otra.

Existe porque varias políticas de RLS confían en que `cuentas.tipo` dice la
verdad. Si se desincroniza, deja de ser un dato prolijo y pasa a ser un
problema de control de acceso.

#### `validar_cambio_tipo_cuenta() returns trigger`

`db/schema.sql:289` · `security definer` · Disparador
`cuentas_valida_cambio_tipo` (`before update on cuentas`).

Bloquea el cambio de `cuentas.tipo` cuando la cuenta ya tiene su fila de
detalle en `perfiles` o en `empresas`. Cierra el lado que el trigger anterior
no cubre: sin esto, `update cuentas set tipo = 'empresa'` sobre una cuenta con
perfil dejaba justo la desincronización que se quiere evitar.

#### `cuenta_activa(cuenta uuid) returns boolean`

`db/schema.sql:318` · `language sql` · `stable` · `security definer`.

Dice si una cuenta no está dada de baja. Las políticas de lectura de
`perfiles` y `empresas` la consultan en vez de leer `cuentas` directamente.

Es `security definer` por una razón concreta: `cuentas` tiene RLS que limita
cada fila a su dueño, así que una subquery común solo vería la cuenta propia y
ocultaría **todos** los demás perfiles. Es `stable` para que el planificador
la evalúe una vez por consulta y no una vez por fila.

#### `postulacion_identidad_inmutable() returns trigger`

`db/schema.sql:388` · Disparador `postulaciones_identidad_inmutable`
(`before update on postulaciones`).

Impide que un `update` cambie `perfil_id` o `vacante_id`. Sin esto, la empresa
dueña de la vacante podía reasignar la postulación a otro perfil y dispararle
una notificación que esa persona nunca pidió.

No se puede resolver en RLS: una política no ve la fila vieja, y una que
consulte su propia tabla para compararla falla con
`infinite recursion detected in policy for relation "postulaciones"`. El
disparador sí ve `old` y `new`.

#### Restricción `perfiles_mayor_de_edad`

`db/schema.sql:36`. No es una función, pero vale nombrarla: exige 18 años
cumplidos al registrarse (RF1.1.8).

```sql
check (fecha_nacimiento <= current_date - interval '18 years')
```

---

## 6. Cómo mantener este documento

Este catálogo está escrito a mano y no se regenera solo. Se desactualiza en
cuanto alguien agrega una función sin pasar por acá.

Cuando un cambio toca el código:

1. Si agrega, borra o cambia una función exportada → actualizá §5.
2. Si cambia cómo viajan los datos o una de las tres reglas → actualizá §2
   o §3.
3. Siempre → agregá la línea en [`CHANGELOG.md`](./CHANGELOG.md).
4. Si la decisión tuvo alternativas que valga la pena registrar → entrada en
   [`decisiones.md`](./decisiones.md).

---

## 7. Deudas conocidas

Cosas que hoy no cierran. Están acá para que se vean, no para que se olviden.

### 7.1 La interfaz perdió datos que el esquema no guarda

La reescritura de la capa de datos quitó de las pantallas todo lo que
`db/schema.sql` no tiene. Se quitó en vez de inventarse, pero la falta se nota:

| Dato | Dónde se mostraba | Estado |
| --- | --- | --- |
| Salario y moneda | Tarjeta de vacante | `vacantes` no tiene columnas de salario |
| Modalidad (presencial, híbrido, remoto) | Vacante y evento | No existe |
| Ubicación | Vacante y evento | No existe |
| Cupo y cantidad de inscriptos | Tarjeta de evento | No hay cupo; las inscripciones ajenas no se pueden contar por RLS |
| Hora de fin de un evento | Tarjeta de evento | `eventos.fecha_hora` es un instante |
| Nivel de dominio de una habilidad | Perfil | `perfil_habilidades` es una tabla puente sin más columnas |
| Categoría de un tag | Perfil | `tags` tiene solo `id` y `nombre` |
| Años y acreditación de un estudio | Formación | `formaciones` tiene institución, título y estado |
| Perfil o empresa verificada | Ficha de usuario, tarjeta de vacante | No existe |
| Ciudad y titular del perfil | Ficha de usuario | `perfiles` guarda país, no ciudad |

Ninguno es un olvido de la reescritura: son decisiones de alcance del esquema.
Si el equipo quiere alguno de vuelta, el camino es agregar la columna en
`db/schema.sql` primero. Para una plataforma de empleo, el salario y la
modalidad son los dos que más se van a extrañar.

### 7.2 El logo y la ilustración están pendientes

La marca es hoy un cuadro con las iniciales. Sirve y es consistente con la
dirección, pero es un marcador de posición: el proyecto no tiene identidad
gráfica propia. Lo mismo con los eventos sin imagen, que se apoyan en el
bloque de fecha.

### 7.3 El feed no distingue tags de habilidades al buscar

`obtenerVacantes` busca solo por título. El esquema permite filtrar por tag o
por habilidad —son tablas puente indexadas— pero eso pide una consulta con
`in` sobre la tabla puente, y el buscador de hoy es un `<input>` de texto
libre. Queda para cuando exista el filtro por etiqueta.

### 7.4 No hay autenticación

`(auth)/` está vacía. El middleware refresca la sesión pero no protege nada, y
`(app)/` es accesible sin iniciar sesión. Es el Hito 1 del plan.

### 7.5 La subida de archivos no existe

`AvatarEditable` muestra la vista previa y avisa que la subida falta. Los
logos de empresa e institución dependen de lo mismo.

### 7.6 La aplicación no distingue postulante de empresa

El esquema los separa con `cuentas.tipo`, pero la interfaz no lo mira en
ningún lado: ni en la navegación, ni en las rutas, ni en el layout. Definirlo
temprano sale barato; hacerlo cuando llegue el panel de empresa obliga a
rehacer la navegación.

### 7.7 El texto legal no lo revisó nadie con formación jurídica

`/legales` describe lo que la plataforma hace hoy con los datos, incluida la
transferencia internacional que implica alojarlos en us-east-2. Está escrito
para ser honesto, no para ser suficiente: antes de que LinkYouth salga a
producción, esos tres textos tienen que pasar por alguien que sepa de la Ley
N.º 18.331.
