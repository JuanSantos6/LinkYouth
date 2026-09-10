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
   ├─ Server Components ──▶ src/lib/data/consultas.ts   (lectura)
   ├─ Server Actions    ──▶ src/lib/acciones/*.ts       (escritura)
   └─ src/middleware.ts                                 (refresco de sesión)
   │
   │  @supabase/ssr · clave anon · cookies de sesión
   ▼
Supabase / PostgreSQL
   │
   ├─ Tablas + Row Level Security   ← acá vive el control de acceso
   ├─ Vistas (vacantes_feed, eventos_agenda)
   └─ Funciones y disparadores (matching, notificaciones, integridad)
```

**La consecuencia más importante de este dibujo:** la clave `anon` viaja al
navegador, es pública por diseño, y cualquiera puede usarla para hablar
directo con la API de Supabase sin pasar por nuestra interfaz. Por eso *toda*
regla de acceso está escrita como política de RLS en la base. La interfaz
nunca es la barrera; es la comodidad.

---

## 2. Las cuatro reglas estructurales

Estas cuatro decisiones explican casi todo lo demás. Cada una tiene su entrada
larga en [`decisiones.md`](./decisiones.md).

### 2.1 Server Component por defecto

Una pantalla es un Server Component salvo que necesite estado o eventos del
navegador. Consecuencias prácticas:

- Las consultas corren en el servidor. Las credenciales y el SQL no llegan
  nunca al bundle del cliente.
- Los filtros y las pestañas se hacen con enlaces y `searchParams`, no con
  `useState`. El resultado queda en la URL: se puede compartir, y el botón de
  volver funciona.
- `"use client"` aparece en 5 archivos y siempre por la misma razón: hay un
  formulario con `useActionState`, o hay que leer la ruta activa.

### 2.2 El control de acceso vive en la base

Ninguna regla de permisos está escrita en TypeScript. Están todas en
`db/migrations/0002_rls.sql` como políticas de RLS. El caso testigo son los
tags ocultos de una vacante (RF3.1.6, RNF5): viven en su propia tabla
`vacante_tags_ocultos`, cuya política de lectura habilita solo a la empresa
dueña. No existe consulta del postulante que los alcance, ni por descuido ni
a propósito.

El puntaje de compatibilidad que sí necesita cruzarlos se calcula dentro de
`puntaje_matching()`, que corre con `security definer` y devuelve un número.
Las etiquetas nunca salen de la función.

### 2.3 La aplicación arranca sin base

Un clon recién hecho, sin `.env.local`, levanta y se puede recorrer entero.
No hay pantalla en blanco ni error de conexión. Esto no es una comodidad
suelta: es lo que permite revisar la interfaz sin tener credenciales.

El mecanismo es el tipo `Resultado<T>`, que acompaña cada lectura con su
procedencia:

```ts
type Resultado<T> = {
  datos: T;
  origen: "supabase" | "ejemplo";
  error?: string;
};
```

Cuando faltan credenciales, la lectura falla, o la tabla está vacía, la
consulta devuelve el contenido de `src/lib/data/ejemplos.ts` con
`origen: "ejemplo"`.

### 2.4 Los datos de ejemplo se anuncian en pantalla

Toda pantalla que muestre un `Resultado` con `origen: "ejemplo"` renderiza
`<AvisoOrigen>`, que dice en pantalla que es contenido de demostración y por
qué. Mostrar datos inventados sin aclararlo sería engañoso, y en una demo a
terceros es la diferencia entre una maqueta honesta y una mentira.

---

## 3. Cómo viaja un dato

### Lectura

```
PaginaEmpleos (Server Component)
  └─ obtenerVacantes({ busqueda, tipo })      src/lib/data/consultas.ts
       ├─ createClient()                      src/lib/supabase/server.ts
       │    └─ leerCredenciales()             src/lib/supabase/config.ts
       │         └─ null si falta .env.local  ──▶ VACANTES_EJEMPLO
       └─ select * from vacantes_feed         (vista, RLS activa)
            └─ Resultado<Vacante[]>
                 ├─ <AvisoOrigen resultado={...}>   si origen === "ejemplo"
                 └─ <TarjetaVacante vacante={...}>  una por fila
```

### Escritura

```
<BotonPostularse>  ("use client")
  └─ useActionState(postularse, ACCION_INICIAL)
       └─ postularse(estadoPrevio, FormData)   src/lib/acciones/postulaciones.ts
            ├─ createClient() + auth.getUser()
            ├─ insert into postulaciones       (RLS decide si pasa)
            ├─ revalidatePath("/empleos"), ...
            └─ EstadoAccion { estado, mensaje } ──▶ región aria-live
```

Toda acción de servidor devuelve el mismo tipo `EstadoAccion`, y el formulario
lo muestra en una región `aria-live`. El resultado de una acción llega igual a
quien navega con lector de pantalla.

---

## 4. El mapa de archivos

```
db/
  migrations/0001_esquema.sql            Tipos, tablas, índices, disparadores
  migrations/0002_rls.sql                Row Level Security
  migrations/0003_vistas_y_matching.sql  Vistas del feed y compatibilidad
  seed/0001_tags.sql                     Catálogo de tags (RF2.3.1)
  seed/0002_demo.sql                     Empresas, vacantes y eventos de ejemplo
  schema.sql, politicas.sql              ⚠ Esquema anterior — ver §7

docs/                                    SRS, decisiones, plan, este documento

src/app/
  layout.tsx                             Layout raíz (lang="es", fuentes)
  page.tsx                               Landing y verificación de conexión
  (app)/layout.tsx                       Estructura con barra lateral
  (app)/inicio|empleos|eventos|
        postulaciones|perfil/page.tsx    Las cinco pantallas
  (auth)/                                Vacía: login y registro pendientes

src/components/
  ui/                                    Primitivas sin dominio
  layout/                                Estructura y navegación
  empleos/ eventos/ perfil/              Por dominio

src/lib/
  supabase/                              Clientes y credenciales
  data/                                  Lectura: consultas, tipos, ejemplos
  acciones/                              Escritura: acciones de servidor
  formato.ts                             Fechas, salarios, etiquetas

src/types/database.ts                    Tipos del esquema, escritos a mano
src/middleware.ts                        Refresco de sesión en cada request
```

---

## 5. Catálogo de funciones

Cada entrada dice qué hace la función y, cuando no es obvio, por qué existe.
Las funciones privadas de un módulo aparecen solo si entender el módulo las
necesita.

### 5.1 `src/lib/supabase/config.ts`

#### `leerCredenciales(): CredencialesSupabase | null`

Lee `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` del entorno.
Devuelve `null` si falta cualquiera de las dos, en vez de lanzar.

Es el único punto del código que toca esas variables. Que devuelva `null` en
lugar de fallar es lo que sostiene la regla §2.3: quien llama decide qué hacer
sin que se caiga el render.

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

#### `fechaLarga(iso): string`

`"sábado 15 de octubre"`. Sin hora: la pone `rangoHorario` y no se repite.

#### `fechaBloque(iso): { dia, mes }`

`{ dia: "15", mes: "OCT" }` para el bloque de fecha de una tarjeta de evento.

#### `rangoHorario(inicio, fin): string`

`"18:30 a 20:30"`, o solo la hora de inicio si no hay fin. Reloj de 24 h: es
el formato de una agenda.

#### `tiempoRelativo(iso): string`

`"hace 2 horas"`, `"hace 3 días"`. Escala sola de minutos a meses.

#### `rangoSalarial(min, max, moneda): string | null`

`"USD 1.500 a 2.000 por mes"`. Devuelve `null` cuando la vacante no publica
salario, para que la tarjeta omita la línea entera en lugar de mostrar un
guión.

#### `etiquetaModalidad(m)` · `etiquetaTipo(t)` · `etiquetaEstadoPostulacion(e)`

Traducen los valores del enum al texto de la interfaz.
`etiquetaEstadoPostulacion` no es una traducción literal: `rechazada` se
muestra como **"No seleccionada"** y `pendiente` como **"Enviada"**. Es
deliberado — el estado se lo lee alguien que buscaba ese trabajo.

#### `iniciales(texto): string`

Hasta dos iniciales en mayúscula, para el avatar sin foto.

#### `afinidad(tagsVacante, tagsPerfil): number`

Porcentaje de los tags **públicos** de la vacante que el postulante ya tiene
(RF3.5.2). Compara en minúsculas. Devuelve `0` si la vacante no declara tags.

Esta es la afinidad que se muestra en pantalla, y solo mira tags públicos. No
confundir con `puntaje_matching()` (§5.9), que es el cálculo real de RF3.9,
corre en la base y sí cruza los tags ocultos.

### 5.6 `src/lib/data/consultas.ts`

Capa de lectura. Marcada `import "server-only"`: importarla desde un Client
Component es un error de compilación, no un problema en producción.

Todas devuelven `Resultado<T>`. Ante credenciales faltantes, error de lectura
o tabla vacía, responden con datos de ejemplo y el motivo en `error`.

#### `async obtenerVacantes(filtros): Promise<Resultado<Vacante[]>>`

RF3.5.1. Lee la vista `vacantes_feed`, solo `estado = 'activa'`, de la más
reciente a la más vieja. `filtros` acepta `busqueda` (texto libre), `tipo`
(empleo o pasantía) y `limite` (20 por omisión).

El filtrado sobre los datos de ejemplo replica el mismo criterio, para que la
búsqueda funcione igual con base y sin base.

#### `async obtenerEventos(limite = 12): Promise<Resultado<Evento[]>>`

RF4.4.1. Vista `eventos_agenda`, solo publicados y solo futuros
(`inicia_en >= now()`), del más próximo en adelante.

#### `async obtenerPerfilActual(): Promise<Resultado<PerfilCompleto>>`

RF2.1. Perfil de la sesión activa con sus tags y su formación.

Hace cuatro consultas: el perfil, sus `perfil_tags` y sus `formaciones` en
paralelo, y después el catálogo `tags` para resolver los nombres. Sin sesión
iniciada devuelve el perfil de demostración, que es lo que hoy permite
recorrer la pantalla de perfil antes de que exista el login.

#### `async obtenerPostulaciones(): Promise<Resultado<PostulacionResumen[]>>`

RF3.7. Postulaciones propias con su estado, de la más nueva a la más vieja.

Resuelve los datos de la vacante en una segunda consulta y los cruza en
memoria. Si una vacante ya no está, muestra `"Vacante dada de baja"` en vez de
dejar la fila rota.

#### `async obtenerVacantesPostuladas(): Promise<Set<string>>`

RF3.6.2. Ids de las vacantes a las que la sesión ya se postuló. Devuelve un
`Set` porque su único uso es `has()` por cada tarjeta del feed.

Es la única consulta que **no** devuelve `Resultado`: sin sesión devuelve un
`Set` vacío, y un feed sin marcas de "ya te postulaste" es correcto, no
degradado.

#### `ejemplo(datos, error)` *(privada)*

Arma el `Resultado` de reserva. Existe para que las cinco consultas usen la
misma forma.

### 5.7 `src/lib/acciones/`

Server Actions. Todas reciben `(estadoPrevio, FormData)` y devuelven
`EstadoAccion`, que es la firma que espera `useActionState`.

Todas verifican sesión y devuelven `SIN_SESION` si no hay. Eso es defensa en
profundidad, no el control de acceso: el control real lo hace RLS.

#### `async actualizarPerfil(_, datos): Promise<EstadoAccion>` — `perfil.ts`

RF1.5 y RF2.2. Actualiza nombre, apellido, titular, biografía, ciudad y país.

Valida largos **en el servidor** (titular ≤ 120, biografía ≤ 600): el
`maxlength` del campo es comodidad del navegador, no una validación. Los
campos vacíos se guardan como `null`, no como cadena vacía. Revalida
`/perfil`.

#### `async postularse(_, datos): Promise<EstadoAccion>` — `postulaciones.ts`

RF3.6. Inserta la postulación; el estado inicial `pendiente` lo pone el
`default` de la columna (RF3.6.4).

Traduce el error `23505` (violación de unicidad) a *"Ya te habías postulado a
esta búsqueda"*. Ese caso lo resuelve la restricción única de la tabla
(RF3.6.2), no una consulta previa: entre el chequeo y el insert hay una
carrera, y la base no la tiene. Revalida `/inicio`, `/empleos` y
`/postulaciones`.

#### `async cancelarPostulacion(_, datos): Promise<EstadoAccion>` — `postulaciones.ts`

RF3.8. Cancela una postulación propia.

⚠ **Hoy hace `DELETE`, y eso contradice la regla de `CLAUDE.md`** que dice que
nunca se borran filas de `postulaciones` y que los estados se actualizan. Ver
§7.2.

#### `async inscribirse(_, datos): Promise<EstadoAccion>` — `eventos.ts`

RF4.5. Inscribe a la sesión activa a un evento. Mismo trato del error `23505`.
Revalida `/eventos` e `/inicio`.

#### `EstadoAccion` · `ACCION_INICIAL` · `SIN_SESION` — `tipos.ts`

El tipo que devuelve toda acción y sus dos valores constantes. `SIN_SESION`
dice explícitamente que el módulo de autenticación (RF1.3) no está hecho
todavía, en vez de fingir un error genérico.

### 5.8 Componentes

#### `ui/` — primitivas, sin dominio

| Componente | Props | Qué resuelve |
| --- | --- | --- |
| `Tarjeta` | `como?`, `interactiva?`, + props del elemento | Superficie base. Borde, radio y sombra salen de un solo lugar. Polimórfica: `como="article"` cambia la etiqueta sin duplicar estilos. |
| `Boton` | `variante?`, + props de `<button>` | Botón de acción. |
| `BotonEnlace` | `variante?`, + props de `<Link>` | Mismo aspecto, pero navega. Separado del anterior porque un enlace no es un botón para un lector de pantalla. |
| `Avatar` | `nombre`, `url`, `tamano?`, `forma?` | Foto o iniciales. Reserva el espacio siempre, así la grilla no salta. Usa `<img>` y no `next/image` porque los archivos viven en Supabase Storage, con dominios variables. |
| `Etiqueta` | `children`, `tono?` | El tag de habilidad. Con `tono="coincide"` marca un tag que el perfil ya tiene. |
| `Insignia` | `children`, `tono?` | Estado: modalidad, tipo de contrato, estado de una postulación. |
| `EstadoVacio` | `titulo`, `descripcion`, `accion?` | Qué se ve cuando una lista viene vacía. Nunca un blanco: siempre qué pasó y qué se puede hacer. |
| `AvisoOrigen` | `resultado` | Implementa la regla §2.4. Devuelve `null` cuando `origen === "supabase"`, así se puede poner en toda pantalla sin condicionar. |

#### `layout/` — estructura

| Componente | Props | Qué resuelve |
| --- | --- | --- |
| `BarraLateral` | — | Navegación de las cinco secciones. `"use client"` solo para leer `usePathname()` y marcar la activa. Columna fija de 240 px en escritorio; fila que se desplaza en pantallas chicas, sin menú desplegable: con cinco secciones, esconderlas cuesta más de lo que ahorra. |
| `Encabezado` | `titulo`, `descripcion?`, `acciones?` | Encabezado de sección. |
| `BuscadorVacantes` | `accion`, `valor?`, `placeholder?` | Formulario **GET**: el resultado queda en la URL, se comparte, y volver atrás funciona. Anda sin JavaScript. |
| `Iconos` | `className?` | Nueve íconos SVG inline (`IconoInicio`, `IconoEmpleos`, `IconoEventos`, `IconoPostulaciones`, `IconoPerfil`, `IconoBusqueda`, `IconoUbicacion`, `IconoVerificado`, `IconoCamara`). Inline y no una librería: son nueve, y una dependencia entera para eso no se paga sola. |

#### `empleos/` · `eventos/` · `perfil/` — por dominio

| Componente | Props | Qué resuelve |
| --- | --- | --- |
| `TarjetaVacante` | `vacante`, `tagsPerfil?`, `yaPostulado?` | Una vacante en el feed. Muestra el porcentaje de compatibilidad solo si la vacante declara tags, y siempre junto al detalle de cuáles coinciden: un número suelto no se puede verificar. |
| `BotonPostularse` | `vacanteId`, `yaPostulado?` | Postulación en un paso (RF3.6). Anuncia el resultado en una región `aria-live`. |
| `TarjetaEvento` | `evento` | Deliberadamente distinta de la de vacante: cabecera con franja de color, bloque de fecha destacado, cupo como dato principal. Hay que distinguir de un vistazo una oferta de una actividad. |
| `BotonInscribirse` | `eventoId` | Inscripción a un evento (RF4.5). |
| `TarjetaUsuario` | `perfil`, `postulaciones` | Cabecera del perfil con métricas de actividad propia. |
| `FormularioPerfil` | `perfil` | Edición de los datos públicos (RF1.5, RF2.2). |
| `AvatarEditable` | `nombre`, `url` | Vista previa al elegir archivo. ⚠ **La subida a Storage no está implementada**: el componente avisa qué falta en vez de simular que guardó. |
| `NubeTags` | `tags` | Tags agrupados por categoría. El nivel se muestra con una barra **y** en texto: apoyarse solo en el largo de la barra deja afuera a quien no la puede comparar de un vistazo. |
| `ListaFormacion` | `formaciones` | Estudios declarados. Cuadro fijo para el logo, con iniciales cuando no hay: la lista se lee igual de alineada en los dos casos. |

#### Páginas

| Ruta | Función | Qué hace |
| --- | --- | --- |
| `/` | `Home` | Landing y verificación de conexión con Supabase. |
| `/inicio` | `PaginaInicio` | Feed combinado con pestañas por `searchParams`. Incluye `Pestanas` (privada). |
| `/empleos` | `PaginaEmpleos` | Listado con búsqueda y filtro por tipo. |
| `/eventos` | `PaginaEventos` | Agenda de eventos próximos. |
| `/postulaciones` | `PaginaPostulaciones` | Postulaciones propias con su recorrido de estados. Incluye `pasoActual` y `Recorrido` (privadas). |
| `/perfil` | `PaginaPerfil` | Perfil propio y su edición. Incluye `Seccion` (privada). |

Las cinco pantallas de `(app)/` declaran
`export const dynamic = "force-dynamic"`: leen datos por sesión, y cachearlas
mostraría el perfil de otro.

### 5.9 Funciones en la base

Definidas en `db/migrations/0003_vistas_y_matching.sql`.

#### `afinidad_publica(vacante uuid, perfil uuid) returns smallint`

Porcentaje de los tags **visibles** de la vacante que el postulante ya tiene.
Es el número que la interfaz muestra como "% compatible". No toca los tags
ocultos, así que corre con permisos normales.

Es el equivalente en SQL de `afinidad()` (§5.5). Existen las dos porque la
interfaz ya tiene los tags en memoria al pintar el feed y no vale la pena un
viaje a la base por tarjeta.

#### `puntaje_matching(vacante uuid, perfil uuid) returns smallint`

RF3.9. El cálculo real: cruza los tags **ocultos** de la vacante con los tags
públicos del postulante y pondera por el peso que cargó la empresa.

Corre con `security definer` porque necesita leer `vacante_tags_ocultos`, que
ninguna sesión de postulante puede consultar (RNF5). Devuelve solo el número.
El puntaje es visible únicamente para la empresa dueña de la vacante (RF3.9.2).

#### Vistas `vacantes_feed` y `eventos_agenda`

Aplanan empresa y tags públicos para que la aplicación lea una fila por
vacante o por evento y no arme el join en el cliente. Declaradas
`security_invoker`, así la RLS de las tablas de origen sigue vigente para
quien consulta.

---

## 6. Cómo mantener este documento

Este catálogo está escrito a mano y no se regenera solo. Se desactualiza en
cuanto alguien agrega una función sin pasar por acá.

Cuando un cambio toca el código:

1. Si agrega, borra o cambia una función exportada → actualizá §5.
2. Si cambia cómo viajan los datos o una de las cuatro reglas → actualizá §2
   o §3.
3. Siempre → agregá la línea en [`CHANGELOG.md`](./CHANGELOG.md).
4. Si la decisión tuvo alternativas que valga la pena registrar → entrada en
   [`decisiones.md`](./decisiones.md).

---

## 7. Deudas conocidas

Cosas que hoy no cierran. Están acá para que se vean, no para que se olviden.

### 7.1 Hay dos esquemas de base de datos en `db/`

`db/schema.sql` + `db/politicas.sql` y `db/migrations/` describen esquemas
**distintos e incompatibles**. Ejemplos de la divergencia:

| | `schema.sql` | `migrations/` |
| --- | --- | --- |
| Inscripciones | `inscripciones_evento` | `inscripciones` |
| Tags de vacante | `vacante_tags_publicos` | `vacante_tags` |
| Estado de evento | `activo` / `cancelado` | `publicado` / `cancelado` |
| Estado de postulación | incluye `cancelada` | no la incluye |
| Cuentas | tabla `cuentas` con `tipo` | `empresas.cuenta_id` |
| Tipos | `text` + `check` | enums de Postgres |

`src/types/database.ts` y todo el código de `src/lib/` siguen a
`migrations/`. Los archivos `schema.sql` y `politicas.sql` son de la etapa
anterior y **hoy no los usa nadie**, pero siguen versionados y en
`db/README.md` no figuran.

Hay que decidir cuál queda y borrar el otro. Está como primera tarea del
[`plan.md`](./plan.md).

### 7.2 `cancelarPostulacion` borra la fila

`src/lib/acciones/postulaciones.ts` hace `DELETE`. `CLAUDE.md` dice que de
`postulaciones` nunca se borran filas y que los estados se actualizan. Además
`EstadoPostulacion` en `src/types/database.ts` no tiene el valor `cancelada`,
así que hoy no habría a qué estado pasarla.

Las dos salidas: agregar `cancelada` al enum y hacer `UPDATE`, o cambiar la
regla de `CLAUDE.md`. La primera conserva el dato para las métricas de RF7.

### 7.3 No hay autenticación

`(auth)/` está vacía. El middleware refresca la sesión pero no protege nada,
y `(app)/` es accesible sin iniciar sesión. Todas las consultas caen en datos
de ejemplo. Es el Hito 1 del plan.

### 7.4 La subida de archivos no existe

`AvatarEditable` muestra la vista previa y avisa que la subida falta. Los
logos de empresa e institución dependen de lo mismo.

### 7.5 `src/types/database.ts` está escrito a mano

Refleja `db/migrations/` según lo que se escribió, no según lo que la base
tiene. Cuando el esquema esté aplicado hay que regenerarlo:

```bash
npx supabase gen types typescript --project-id <PROJECT_ID> > src/types/database.ts
```
