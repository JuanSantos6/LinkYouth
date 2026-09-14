# Arquitectura de LinkYouth

Cómo está armado el proyecto, por qué está armado así, y qué hace cada función
que existe hoy.

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
dentro de un `.tsx`, va en una clase. Antes de esta separación, la afinidad se
armaba dentro de la tarjeta de vacante y las etapas del proceso estaban
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
  page.tsx                Portada pública: qué es, cómo funciona, empresas,
                          preguntas frecuentes y consultas
  (app)/layout.tsx        Cabecera, barra lateral y pie
  (app)/inicio|empleos|eventos|postulaciones|
        perfil|avisos|ajustes/page.tsx  Las siete pantallas de la cuenta
  (sitio)/layout.tsx      Cabecera y pie, sin barra lateral
  (sitio)/empresas|como-funciona|
          legales/page.tsx                Las tres pantallas públicas
  (auth)/layout.tsx       Columna centrada, con la marca
  (auth)/login|registro/page.tsx        Inicio de sesión y alta (RF1.1, RF1.3)
  empresa/                Panel de empresa (placeholder del Hito 6)

src/components/
  ui/                     Primitivas sin dominio
  layout/                 Estructura y navegación
  auth/ empleos/ eventos/ landing/ perfil/   Por dominio

src/lib/
  supabase/               Cliente de servidor y credenciales
  data/                   Lectura: tipos.ts, ejemplos.ts, consultas.ts
  acciones/               Escritura: auth, perfil, postulaciones, eventos
  formato.ts              Fechas, etiquetas, afinidad

src/types/database.ts     Tipos generados desde la base real
src/middleware.ts         Refresco de sesión y control de acceso a las rutas
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

### 5.2 `src/lib/supabase/server.ts`

#### `async createClient()`

Cliente para Server Components, Route Handlers y Server Actions. Lee y escribe
las cookies de sesión a través de `cookies()` de Next.js.

Es `async` porque en Next.js 15 `cookies()` pasó a ser asíncrono. El `setAll`
está envuelto en `try/catch` a propósito: un Server Component no puede
escribir cookies, y el middleware ya refrescó la sesión, así que ese error
específico se puede ignorar sin perder nada.

### 5.3 `src/middleware.ts`

#### `async middleware(request)`

Corre en cada request. Revalida el token de Supabase con `auth.getUser()`,
reescribe las cookies rotadas en la respuesta y **manda a `/login` a quien
entre sin sesión**, salvo a las rutas de `PUBLICAS` (`/login`, `/registro`).

El control vive acá y no repetido en cada `page.tsx` porque es el único punto
por el que pasan las cinco pantallas de `(app)/`. Las cookies que el refresco
acaba de reescribir se copian a la redirección: si se perdieran, el próximo
request intentaría refrescar un token ya descartado.

Si no hay credenciales, deja pasar el request intacto en vez de romper toda la
navegación: sin Supabase no hay sesión posible y la aplicación tiene que poder
recorrerse igual con los datos de ejemplo (§2.3).

#### `ENTRADA` · `INFORMATIVAS`

Dos listas, no una. `ENTRADA` (`/login`, `/registro`) es pública sin sesión y
deja de tener sentido con ella. `INFORMATIVAS` (`/empresas`,
`/como-funciona`, `/legales`) se lee siempre y por los dos tipos de cuenta:
están enlazadas desde la cabecera y el pie, que aparecen en todas las
pantallas, y mandar a `/login` a alguien que toca «Cómo funciona» sería
pedirle credenciales para leer un folleto.

#### `config`

El `matcher` excluye `_next/static`, `_next/image`, `favicon.ico` y los
archivos de imagen. Sin eso, el middleware correría en cada ícono y cada
fuente, y cada uno pagaría una revalidación de token.

### 5.4 `src/lib/formato.ts`

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

#### `etiquetaTipo(t)` · `etiquetaEstadoPostulacion(e)` · `etiquetaEstadoFormacion(e)`

Traducen los valores del esquema al texto de la interfaz.
`etiquetaEstadoPostulacion` no es una traducción literal: `rechazada` se
muestra como **"No seleccionada"**, `pendiente` como **"Enviada"** y
`cancelada` como **"Cancelada por vos"**. Es deliberado — el estado se lo lee
alguien que buscaba ese trabajo.

#### `iniciales(texto): string`

Hasta dos iniciales en mayúscula, para el avatar sin foto.

#### `afinidad(requisitos, propios): number`

Porcentaje de los requisitos de la vacante — sus tags **públicos** más sus
habilidades — que el postulante ya declara (RF3.5.2). Compara en minúsculas y
devuelve `0` si la vacante no pide nada.

No es el puntaje de matching de RF3.9: ese usa los tags ocultos, se calcula en
la base y lo ve solo la empresa. Este número solo mira datos públicos, así que
puede correr en cualquier lado sin riesgo.

### 5.5 `src/lib/data/`

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

`Catalogos` y `OpcionCatalogo` son la excepción a que la capa de datos entregue
solo nombres: llevan el `id`, porque es lo que `perfil_tags` y
`perfil_habilidades` guardan y lo que necesitan las acciones que escriben ahí.
`PerfilCompleto.tags` sigue siendo `string[]` a propósito — ver la entrada del
2026-09-14 en [`decisiones.md`](./decisiones.md).

#### `ejemplos.ts`

Contenido de demostración con la forma exacta que devuelven las consultas:
`VACANTES_EJEMPLO`, `EVENTOS_EJEMPLO`, `PERFIL_EJEMPLO`,
`POSTULACIONES_EJEMPLO`, `CATALOGOS_EJEMPLO`. Solo usa campos que existen en
`db/schema.sql`. Los `id` de `CATALOGOS_EJEMPLO` son inventados, así que
`SelectorTags` no deja elegir cuando el origen es «ejemplo».

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
| `obtenerAvisos(usuarioId?, limite?)` | `Resultado<Aviso[]>` | RF6.1. Las filas las crea el disparador de la base: `notificaciones` no tiene política de insert, así que ningún navegador puede fabricar un aviso. |
| `obtenerTipoCuenta(usuarioId?)` | `TipoCuenta \| null` | En qué mitad de la aplicación está la sesión. La cabecera y el pie lo necesitan para no ofrecerle a una cuenta de empresa enlaces que el middleware le va a rebotar. |
| `obtenerCatalogos()` | `Resultado<Catalogos>` | RF2.3, RF2.4.3. Los dos catálogos cerrados enteros, sin filtro ni paginado: 36 tags y 20 habilidades. |

Las tres consultas grandes traen sus relaciones en un solo `select` anidado
(`empresas ( … )`, `vacante_tags_publicos ( tags ( nombre ) )`). Los tipos
generados traen los metadatos de las claves foráneas, así que TypeScript
infiere la forma del resultado sin ayuda. `nombresDe()` aplana esas tablas
puente a una lista de nombres ordenada.

Cuando el join con `empresas` viene vacío —la cuenta de la empresa fue dada de
baja y `cuenta_activa` la deja fuera— la fila se descarta con `flatMap` en vez
de mostrarse sin organizador.

### 5.6 `src/lib/acciones/`

Todas llevan `"use server"`, reciben `(estadoPrevio, FormData)` y devuelven
`EstadoAccion` (`{ estado, mensaje }`), que el formulario consume con
`useActionState`. Hay dos excepciones a la firma:

- `cerrarSesion()` no recibe ni devuelve nada: no hay estado que mostrar, así
  que va como `action` de un `<form>` sin `useActionState`.
- `agregarTag`, `quitarTag`, `agregarHabilidad` y `quitarHabilidad` reciben un
  `id` suelto y no un `FormData`. No salen de un formulario: las llama el
  `onClick` de una etiqueta, dentro de un `useTransition` que sostiene el
  estado optimista. Un `<form>` por etiqueta serían 56 formularios en la
  pantalla de perfil, cada uno con su campo oculto, para un dato que el
  componente ya tiene en la mano.

`tipos.ts` exporta además `ACCION_INICIAL`, `CLAVE_DUPLICADA` (el `23505` de
Postgres) y las dos respuestas de «no se puede seguir», que son **distintas a
propósito**:

- `SIN_CONFIGURAR` para el `if (!supabase)`: faltan las credenciales de
  Supabase. Quien no cargó `.env.local` no tiene ningún inicio de sesión que
  hacer, y mandarlo a iniciarlo lo hace buscar el problema donde no está.
- `SIN_SESION` para el `if (!user)`: el cliente se creó bien y no hay nadie
  autenticado.

| Función | Qué hace | Requisito |
| --- | --- | --- |
| `registrarse` | Crea el usuario en `auth.users` y, con la sesión del `signUp`, las filas de `cuentas` y `perfiles`. Chequea el `nombre_usuario` repetido antes de crear nada. Si el proyecto pide confirmación por correo el `signUp` no devuelve sesión: los datos quedan en `user_metadata` y el alta se completa en el primer login, que es cuando RLS tiene el `auth.uid()` que exige. | RF1.1 |
| `iniciarSesion` | Autentica y, si el alta había quedado pendiente, la completa. Responde lo mismo ante contraseña incorrecta y correo inexistente: distinguirlos revelaría qué direcciones están registradas. | RF1.3 |
| `cerrarSesion` | `signOut()` y redirección a `/login`. | RF1.3.5 |
| `postularse` | Inserta la postulación. El estado inicial `pendiente` es el default de la columna. | RF3.6 |
| `cancelarPostulacion` | **Actualiza** el estado a `cancelada`. No borra la fila. | RF3.8 |
| `inscribirse` | Inserta en `inscripciones_evento`. | RF4.5 |
| `cancelarInscripcion` | Borra la inscripción. Acá sí se borra: la tabla no lleva estado y la política habilita el `delete` al dueño. Hoy **sin consumidor**: no hay UI de cancelación de eventos. | RF4.6 |
| `enviarConsulta` | Valida la consulta de la portada. **No la entrega**: no hay tabla ni casilla. Devuelve `error` con la explicación en vez de un «gracias» falso. | — |
| `actualizarPerfil` | Actualiza nombre, apellido, país y biografía. | RF1.5, RF2.2 |
| `agregarTag` / `quitarTag` | Insertan o borran una fila de `perfil_tags`. | RF2.3 |
| `agregarHabilidad` / `quitarHabilidad` | Insertan o borran una fila de `perfil_habilidades`. | RF2.4.3 |

El mensaje de error nunca se muestra crudo cuando se lo puede traducir: el
`23505` de una postulación repetida se lee como «Ya te habías postulado a esta
búsqueda», y el `23514` del constraint `perfiles_mayor_de_edad` como «Tenés que
ser mayor de 18 años para registrarte». La regla de edad vive solo en la base
(RF1.1.8); el código traduce su respuesta y no la reimplementa.

Las cuatro acciones de etiquetas comparten `cambiarVinculo`, que además
**absorbe el `23505`**: dos clics en el mismo tick mandan dos inserts iguales y
el segundo choca con la clave primaria `(perfil_id, tag_id)`. La fila quedó
como la quería quien hizo clic, así que devolver error ahí haría que la
interfaz revirtiera una etiqueta que sí está guardada.

El límite de 600 caracteres de la biografía vive solo en `actualizarPerfil`:
`db/schema.sql` declara `bio` como `text` sin restricción, así que es una
decisión de producto, no del esquema.

### 5.7 `src/lib/dominio/`

Las reglas de negocio, fuera de los componentes (§2.3). Ninguna clase hereda
de otra: entre comparar etiquetas, ordenar un listado e interpretar un estado
no hay comportamiento compartido, y una jerarquía ahí sería decorativa.

#### `Compatibilidad`

`Compatibilidad.entre(vacante, perfil)` compara lo que pide la vacante —sus
tags públicos y sus habilidades— con lo que el perfil declara. Expone
`medible`, `porcentaje`, `alta` y `cubre(requisito)`.

Es una clase y no una función porque la pantalla necesita tres cosas del mismo
cálculo: el número, si una etiqueta puntual coincide y si el total alcanza para
destacar la vacante. Devolver solo el porcentaje obligaba a cada componente a
rehacer la comparación.

Solo mira datos públicos. El puntaje de RF3.9 usa los tags ocultos, se calcula
en la base y lo ve únicamente la empresa.

#### `FeedDeVacantes`

`FeedDeVacantes.armar(vacantes, perfil)` ordena por compatibilidad y, a
igualdad, por fecha. Marca **una sola** entrada como destacada, y solo si su
compatibilidad es alta: encabezar un listado flojo no es un logro.

#### `ProcesoDePostulacion`

`new ProcesoDePostulacion(estado)` responde qué significa ese estado para quien
postuló: `etiqueta`, `etapa`, `cancelable`, `cerradoSinPuesto`, `aceptada` y
`alcanzo(etapa)`. Las tres etapas visibles no son los cinco estados de la base:
`aceptada`, `rechazada` y `cancelada` caen todas en la última.

### 5.8 `src/lib/diseno/`

#### `tokens.ts`

Fuente de verdad del color: los cinco valores base, los cinco acentos con su
versión clara y oscura, las claves de `localStorage` y `reglasDeAcento()`, que
genera el CSS de los acentos para inyectar una vez en el `<head>`. Agregar un
color es tocar solo `ACENTOS`.

#### `PreferenciasDeApariencia`

Lee y escribe `data-tema` y `data-acento` en el elemento raíz y los persiste.
`delDocumento()` la construye; `alternarTema()` y `cambiarAcento()` la
modifican. No lanza nunca: con el almacenamiento bloqueado, la elección vale
para la sesión en curso.

### 5.9 Componentes

Reconectados contra `db/schema.sql`. Lo que la interfaz mostraba y el esquema
no guarda —salario, modalidad, ubicación, cupos, nivel de dominio de una
habilidad, años y acreditación de un estudio— se quitó en vez de inventarse.

#### `ui/` — primitivas, sin dominio

Nada de acá importa de `src/lib/data/`, con **una sola excepción**:
`AvisoOrigen` recibe un `Resultado` y por lo tanto conoce el tipo `OrigenDatos`.
Se queda igual: el aviso de contenido de demostración no pertenece a ninguna
pantalla en particular —lo usan las cinco, y es la implementación de la regla
§2.3— así que moverlo a una carpeta de dominio lo ataría a un dominio que no
tiene. La excepción está acotada a un tipo de solo lectura y se documenta acá
para que no se lea como permiso general.

| Componente | Props | Qué resuelve |
| --- | --- | --- |
| `Tarjeta` | `como?`, `elevada?`, + props del elemento | Superficie con borde. Ya no envuelve todo: las vacantes son filas con filetes. `elevada` solo para lo que está realmente por encima del plano. |
| `Boton` | `variante?`, + props de `<button>` | Botón de acción. La transición enumera sus propiedades: `transition-colors` incluye `outline-color` y hacía que el anillo de foco tardara 150 ms en tomar color. |
| `BotonEnlace` | `variante?`, + props de `<Link>` | Mismo aspecto, pero navega. Separado del anterior porque un enlace no es un botón para un lector de pantalla. |
| `Avatar` | `nombre`, `url`, `tamano?`, `forma?` | Foto o iniciales. Reserva el espacio siempre, así la grilla no salta. Usa `<img>` y no `next/image` porque los archivos viven en Supabase Storage, con dominios variables. |
| `Etiqueta` | `children`, `coincide?` | Un tag o una habilidad. Lo que el perfil ya declara se marca con ✓ y más peso, nunca con relleno de color: seis etiquetas pintadas son un fondo, no una señal. |
| `Insignia` | `children`, `tono?` | Estado. `tono="acreditado"` es el único que usa ámbar, y solo para una postulación aceptada. |
| `Campo` | `etiqueta`, `ayuda?`, `children` | Etiqueta, control y texto de ayuda. El `<label>` envuelve al control, así que el foco llega al hacer clic en el texto sin `htmlFor`. Exporta además la constante `CAMPO` con las clases del `<input>`, que comparten los tres formularios. |
| `BotonAccion` | `accion`, `campo`, `valor`, `textos`, `variante?`, `hecho?`, `esEjemplo?` | Dispara una acción de servidor sobre un ítem y anuncia el resultado en una región `aria-live`. Sale de fusionar `BotonPostularse` e `BotonInscribirse`, que diferían solo en el nombre del campo oculto y en la variante. No conoce vacantes ni eventos; de `src/lib/` solo importa `EstadoAccion`, no `src/lib/data/`. |
| `EstadoVacio` | `titulo`, `descripcion`, `accion?` | Qué se ve cuando una lista viene vacía. Nunca un blanco: siempre qué pasó y qué se puede hacer. |
| `Aviso` | `titulo?`, `children` | Caja de aviso: filete a la izquierda y fondo de realce. Todo lo que la aplicación aclara sobre sí misma se ve igual. El filete hace el trabajo que en otra paleta haría un amarillo: acá el ámbar significa «acreditado» y no se presta para otra cosa. |
| `MensajeDeAccion` | `estado`, `className?` | El resultado de una acción, al lado del control. El error se distingue por peso, filete y la palabra «No se pudo»: la paleta no tiene rojo a propósito. |
| `AvisoOrigen` | `resultado` | Avisa en pantalla que lo que se ve es contenido de demostración, y por qué. Implementa la regla §2.3. |

#### `layout/` — estructura

| Componente | Props | Qué resuelve |
| --- | --- | --- |
| `CabeceraGlobal` | `area?` | Barra superior fija en todas las pantallas: marca, navegación de sitio y los accesos de la cuenta. `area` decide qué ofrece: entrar si no hay sesión, avisos y perfil para un postulante, solo salir para una empresa —a la que el middleware rebotaría de las secciones del postulante—. |
| `PieDeSitio` | `area?` | Cuatro columnas, copyright y el repositorio, que es la única red que existe. La columna «Plataforma» cambia según el tipo de cuenta, por el mismo motivo. |
| `Marca` | `href?` | El sello con las iniciales. Sin ámbar: un logo no acredita nada. |
| `BarraLateral` | — | Las seis secciones de la cuenta. `"use client"` solo para leer `usePathname()`. La activa lleva filete vertical, no píldora rellena. El `min-w-0` no es decorativo: sin él la fila de secciones empuja la página entera a 574 px dentro de un viewport de 390. |
| `Encabezado` | `titulo`, `descripcion?` | Encabezado de sección. |
| `BuscadorVacantes` | `accion`, `valor?`, `placeholder?` | Formulario **GET**: el resultado queda en la URL, se comparte, y volver atrás funciona. Anda sin JavaScript. |
| `Iconos` | `className?` | Doce íconos SVG en línea, todos sobre grilla de 24 y trazo 1.75. Inline y no una librería: una dependencia entera para doce trazos no se paga sola. |

#### `auth/` · `empleos/` · `eventos/` · `perfil/` — por dominio

| Componente | Props | Qué resuelve |
| --- | --- | --- |
| `FormularioLogin` | — | Correo y contraseña (RF1.3). `"use client"` por `useActionState`. |
| `FormularioRegistro` | — | Alta de cuenta individual (RF1.1). Los campos son exactamente las columnas obligatorias de `perfiles`, más el correo y la contraseña que van a `auth.users`. La mayoría de edad la exige la base: acá el campo es un `type="date"` común y el mensaje llega desde la acción. |
| `RegistroPendiente` | `email`, `mensaje` | Reemplaza al formulario cuando el registro salió bien pero falta confirmar el correo. Antes ese caso dejaba campos vacíos con una línea verde, que se lee como «no pasó nada» y empuja a reintentar un registro que no se puede repetir. |
| `ListadoDeVacantes` | `feed`, `yaPostuladas`, `esEjemplo?` | La destacada suelta arriba y elevada; el resto, filas separadas por filetes. |
| `FilaVacante` | `entrada`, `yaPostulado?`, `esEjemplo?` | Una vacante. No es tarjeta. El porcentaje va en `.cifra` y nunca solo: al lado están las etiquetas que lo explican. En pantalla angosta encabeza la fila en vez de esconderse, porque es el dato que ordena el listado. |
| `TarjetaEvento` | `evento`, `yaInscripto?`, `esEjemplo?` | Sí es tarjeta: tiene imagen y fecha propias, y esa diferencia de forma con la vacante es intencional. Sin imagen no se inventa una banda de color; el bloque de fecha pasa a ser el ancla. Sin cupos ni conteo de inscriptos: el esquema no guarda cupo y la RLS no deja contar las ajenas. |
| `TarjetaUsuario` | `perfil`, `postulaciones` | Cabecera del perfil con métricas de actividad propia. |
| `FormularioPerfil` | `perfil` | Edición de los datos públicos (RF1.5, RF2.2). |
| `AvatarEditable` | `nombre`, `url` | Vista previa al elegir archivo. La subida a Storage no está implementada: el componente avisa qué falta en vez de simular que guardó. |
| `BotonCancelarPostulacion` | `postulacionId` | Cancela una postulación propia (RF3.8) pasándola a `cancelada`. No borra la fila. |
| `SelectorTags` | `catalogos`, `tags`, `habilidades`, `esEjemplo?` | Elección de intereses y habilidades (RF2.3, RF2.4.3). Reemplaza a `NubeTags`, que solo mostraba lo ya elegido: los dos catálogos son cerrados, así que elegir es prender y apagar opciones que ya existen. Dos grupos separados, «lo que sabés hacer» y «hacia dónde querés ir», porque son dos catálogos distintos en el esquema. `"use client"` por el estado optimista, que es lo que hace que la etiqueta responda al toque y vuelva sola si la acción falla. Sin nivel de dominio: `perfil_habilidades` es una tabla puente sin más columnas. |
| `landing/CabeceraLanding` | — | Cabecera de la portada: anclas a la misma página y los dos menús de acceso. Hasta 1024 px las anclas bajan a su propia fila, porque compartiendo la primera quedaban en 36 px. |
| `landing/MenuDeAcceso` | `etiqueta`, `opciones`, `destacado?` | Las dos puertas de entrada, joven y organización. Es un `<details>`: abrir, cerrar y enfocar con teclado ya los resuelve el navegador. |
| `landing/CarruselEmpresas` | `empresas` | Las organizaciones que publican. No se mueve solo: avanza con las flechas, el dedo o la rueda. `"use client"` solo por el `scrollBy` de las dos flechas; sin JavaScript la fila se desplaza igual. |
| `landing/PreguntasFrecuentes` | — | Seis preguntas, cada una un `<details>`. |
| `landing/FormularioConsulta` | — | Consultas de la portada. El aviso de que todavía no entrega va **antes** del formulario, no después de enviarlo. |
| `ListaFormacion` | `formaciones` | Estudios declarados. Cuadro fijo a la izquierda con las iniciales de la institución, para que la lista se lea alineada. El esquema no guarda logo, años ni acreditación. |

#### Páginas

| Ruta | Función | Qué hace |
| --- | --- | --- |
| `/` | `Portada` | Portada pública. Cabecera con anclas a la misma página, carrusel de organizaciones, preguntas frecuentes y formulario de consultas. |
| `/login` | `PaginaLogin` | Inicio de sesión. Layout propio de `(auth)/`: una columna centrada, sin barra lateral. |
| `/registro` | `PaginaRegistro` | Alta de cuenta individual. |
| `/inicio` | `PaginaInicio` | Feed combinado con pestañas por `searchParams`. Incluye `Pestanas` (privada). |
| `/empleos` | `PaginaEmpleos` | Listado con búsqueda y filtro por tipo. |
| `/eventos` | `PaginaEventos` | Agenda de eventos próximos. |
| `/postulaciones` | `PaginaPostulaciones` | Postulaciones propias con su recorrido de estados y la opción de cancelar. Incluye `pasoActual` y `Recorrido` (privadas). |
| `/perfil` | `PaginaPerfil` | Perfil propio y su edición. Incluye `Seccion` (privada). |
| `/avisos` | `PaginaAvisos` | Bandeja de notificaciones (RF6.1). |
| `/ajustes` | `PaginaAjustes` | Tema y color de la plataforma. |
| `/empresas` · `/como-funciona` · `/legales` | — | Pantallas públicas, en `(sitio)/`. Se leen con o sin sesión. |
| `/empresa` | `PaginaEmpresa` | Panel de empresa: hoy, el cartel de que llega en el Hito 6. |

Las cinco pantallas de `(app)/` declaran
`export const dynamic = "force-dynamic"`: leen datos por sesión, y cachearlas
mostraría el perfil de otro.

### 5.10 Funciones en la base

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

### 7.2 El feed no distingue tags de habilidades al buscar

`obtenerVacantes` busca solo por título. El esquema permite filtrar por tag o
por habilidad —son tablas puente indexadas— pero eso pide una consulta con
`in` sobre la tabla puente, y el buscador de hoy es un `<input>` de texto
libre. Queda para cuando exista el filtro por etiqueta.

### 7.3 La autenticación cubre solo la cuenta individual

Resuelto el Hito 1: `(auth)/login` y `(auth)/registro` existen, `auth.ts` tiene
`registrarse`, `iniciarSesion` y `cerrarSesion`, y el middleware manda a
`/login` a quien entre a `(app)/` sin sesión.

Queda afuera: el registro de empresa (`cuentas.tipo = 'empresa'`), la
recuperación de contraseña y la confirmación de correo como paso propio —hoy,
si el proyecto de Supabase la tiene activada, el alta de `cuentas` y `perfiles`
se completa recién en el primer inicio de sesión.

### 7.4 La subida de archivos no existe

`AvatarEditable` muestra la vista previa y avisa que la subida falta. Los
logos de empresa e institución dependen de lo mismo.

### 7.5 La aplicación no distingue postulante de empresa

El esquema los separa con `cuentas.tipo`, pero la interfaz no lo mira en
ningún lado: ni en la navegación, ni en las rutas, ni en el layout. Definirlo
temprano sale barato; hacerlo cuando llegue el panel de empresa obliga a
rehacer la navegación.

### 7.6 Quedan hallazgos de la auditoría de interfaz sin cerrar

La revisión del 2026-09-12 cerró el foco de teclado, el contraste de bordes y
de estados deshabilitados, la navegación en móvil y los landmarks. Quedaron
abiertos, porque dependen de la revisión de tono pendiente o de una decisión
de producto:

- `TarjetaVacante` y `TarjetaEvento` usan `interactiva`, que las levanta al
  pasar el puntero, pero ninguna de las dos es un enlace: prometen una
  navegación que no existe.
- `BotonCancelarPostulacion` ejecuta al primer clic, sin confirmación ni
  ventana para deshacer, y la transición a `cancelada` no tiene vuelta atrás
  para el postulante.
- Los errores de formulario se anuncian en una sola región al pie, no al lado
  del campo, y al enviar no se enfoca el primero que falló.
- La insignia de compatibilidad es `hidden sm:block`: el dato que diferencia
  al producto no se ve en un teléfono.
- Los blancos táctiles rondan los 36-40 px, por debajo de los 44 px
  recomendados.
- El ancho de la columna de contenido cambia entre pantallas (`max-w-4xl`,
  `max-w-3xl`, la grilla de `/inicio`).
- Las cinco pantallas de `(app)/` no se pudieron revisar en pantalla: exigen
  sesión y la auditoría se hizo sin crear cuentas. Lo listado acá sale de
  leer el código.

### 7.7 La etiqueta seleccionable mide 24 px de alto

`SelectorTags` reusa `ui/Etiqueta` como superficie del botón, así que el blanco
de toque queda en 24 px de alto: por debajo de los 44 px que pide una pantalla
táctil. Se dejó así a propósito —agrandarla cambia el tamaño de la etiqueta en
toda la aplicación, y el rediseño está pausado— pero es lo primero a corregir
cuando se retome. Con teclado y con puntero no hay problema: el
`:focus-visible` global marca el foco y el objetivo es igual de grande que
cualquier otra etiqueta de la aplicación.
