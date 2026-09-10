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
   ├─ Server Components ──▶ src/lib/data/       (lectura — en reescritura)
   ├─ Server Actions    ──▶ src/lib/acciones/   (escritura — en reescritura)
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

## 2. Las tres reglas estructurales

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

### 2.3 La aplicación tiene que poder arrancar sin base

Un clon recién hecho, sin `.env.local`, no debería romper: `leerCredenciales()`
devuelve `null` en vez de lanzar, y `createClient()` propaga ese `null` para
que quien consulta decida qué hacer.

Cómo se comporta la interfaz cuando no hay base es parte de lo que la
reescritura de la capa de datos tiene que volver a definir. La regla que se
mantiene: **si lo que se muestra no salió de la base, hay que decirlo en
pantalla**. Mostrar datos inventados sin aclararlo sería engañoso, y en una
demo a terceros es la diferencia entre una maqueta honesta y una mentira.

---

## 3. Estado de la capa de datos

`src/lib/data/` y `src/lib/acciones/` **están vacías**. Sus archivos
consultaban tablas y columnas de un esquema que se descartó
(`inscripciones` en vez de `inscripciones_evento`, `vacante_tags` en vez de
`vacante_tags_publicos`, vistas y enums que no existen), y se eliminaron en el
commit `6b6bf86`.

Consecuencias hoy:

- **El proyecto no compila.** Es un estado conocido, no una regresión.
- 18 imports quedaron rotos en 14 archivos de `src/app/(app)/` y
  `src/components/`, cada uno marcado con
  `// TODO: reconectar contra db/schema.sql`.
- Los componentes y las pantallas **se conservan enteros**: su maquetación,
  sus estilos y sus decisiones de accesibilidad son independientes del
  esquema.

Este documento no describe esa capa hasta que la reescritura termine.
Documentar funciones que están siendo reemplazadas ahora mismo sería peor que
no documentarlas: quien las leyera trabajaría contra una foto vieja.

---

## 4. El mapa de archivos

```
db/
  schema.sql              Tablas, restricciones, funciones y disparadores
  politicas.sql           Row Level Security (49 políticas, 18 tablas)

docs/                     SRS, decisiones, plan, changelog, este documento

src/app/
  layout.tsx              Layout raíz (lang="es", fuentes)
  page.tsx                Landing y verificación de conexión
  (app)/layout.tsx        Estructura con barra lateral
  (app)/inicio|empleos|eventos|
        postulaciones|perfil/page.tsx   Las cinco pantallas
  (auth)/                 Vacía: login y registro pendientes

src/components/
  ui/                     Primitivas sin dominio
  layout/                 Estructura y navegación
  empleos/ eventos/ perfil/   Por dominio

src/lib/
  supabase/               Clientes y credenciales
  data/                   Lectura — vacía, en reescritura
  acciones/               Escritura — vacía, en reescritura
  formato.ts              Fechas, salarios, etiquetas

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

> Este módulo importa alias de tipo (`TipoOportunidad`, `ModalidadTrabajo`,
> `EstadoPostulacion`) que los tipos generados ya no exportan. Ver §7.2.

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

Traducen los valores del esquema al texto de la interfaz.
`etiquetaEstadoPostulacion` no es una traducción literal: `rechazada` se
muestra como **"No seleccionada"** y `pendiente` como **"Enviada"**. Es
deliberado — el estado se lo lee alguien que buscaba ese trabajo.

#### `iniciales(texto): string`

Hasta dos iniciales en mayúscula, para el avatar sin foto.

#### `afinidad(tagsVacante, tagsPerfil): number`

Porcentaje de los tags **públicos** de la vacante que el postulante ya tiene
(RF3.5.2). Compara en minúsculas. Devuelve `0` si la vacante no declara tags.

Solo mira tags públicos, así que puede correr en el cliente sin riesgo: los
tags ocultos nunca entran en este cálculo.

### 5.6 Componentes

Se conservan enteros. Sus imports de tipos apuntan a módulos que se
eliminaron, marcados con el TODO (§3).

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
| `AvisoOrigen` | `resultado` | Avisa en pantalla que lo que se ve es contenido de demostración. Implementa la regla §2.3. Su prop depende de un tipo que la reescritura tiene que redefinir. |

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
| `AvatarEditable` | `nombre`, `url` | Vista previa al elegir archivo. La subida a Storage no está implementada: el componente avisa qué falta en vez de simular que guardó. |
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

### 5.7 Funciones en la base

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

### 7.1 La capa de datos está vacía

Ver §3. Es la deuda que bloquea todo lo demás: hasta que se reescriba, el
proyecto no compila. Es el ítem 0.1 del [`plan.md`](./plan.md).

### 7.2 Los alias de tipo del esquema no existen

`src/types/database.ts` se genera con `supabase gen types typescript`. Como el
esquema usa `text` + `check` en vez de enums de Postgres, Supabase genera esas
columnas como `string`: no hay `TipoOportunidad`, `CategoriaTag`,
`ModalidadTrabajo`, `EstadoPostulacion` ni `EstadoFormacion`.

Cinco archivos los importan y hoy no compilan por eso:

```
src/lib/formato.ts
src/app/(app)/empleos/page.tsx
src/app/(app)/postulaciones/page.tsx
src/components/perfil/ListaFormacion.tsx
src/components/perfil/NubeTags.tsx
```

Hay que decidir dónde viven esos alias. No pueden vivir en `database.ts`: el
próximo `gen types` los pisa. Va con la reescritura de la capa de datos.

### 7.3 `cancelarPostulacion` borraba la fila

La acción que existía hacía `DELETE`, y `CLAUDE.md` dice que de
`postulaciones` nunca se borran filas. El archivo ya no está, así que la
contradicción no está en el código hoy — pero la reescritura tiene que
resolverla, no repetirla: `db/schema.sql` sí acepta el estado `cancelada`.

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
