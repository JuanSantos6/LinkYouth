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

Toda regla de permisos se decide en `db/politicas.sql`, como política de RLS.
El caso testigo son los tags ocultos de una vacante (RF3.1.6, RNF5): viven en
su propia tabla `vacante_tags_ocultos`, cuya política de lectura habilita solo
a la empresa dueña de la vacante. No existe consulta del postulante que los
alcance, ni por descuido ni a propósito.

Las 59 políticas cubren las 23 tablas del esquema. Toda tabla tiene
`enable row level security`.

**Qué significa «lectura pública».** Significa «cualquier usuario con sesión»,
no «cualquiera». Siete políticas de select decían `using (true)` sin cláusula
`to`, y sin `to` una política alcanza también al rol `anon` — y la `ANON_KEY`
viaja al navegador por diseño, así que con ella y PostgREST se bajaba el padrón
entero sin cuenta y sin límite. Desde el 2026-09-15 las siete llevan
`to authenticated`; la condición no cambió. El 2026-09-26 tres de ellas
—`vacante_tags_publicos`, `vacante_habilidades` y `evento_tags`— volvieron a
abrirse (ver abajo).

Siguen alcanzando a `anon`, a propósito: los catálogos `tags` y `habilidades`,
que `/registro` lee **sin sesión** para ofrecer los intereses y que no son datos
de nadie; `vacantes` y `eventos` activos, que son el aviso en sí y no datos de
una persona, con lo que el aviso dice que pide (`vacante_tags_publicos`,
`vacante_habilidades`, `evento_tags`), porque desde el 2026-09-26 `/empleos` y `/eventos` se leen sin
sesión; y la vista `perfiles_publicos`,
que `registrarse()` lee **sin sesión** para avisar que un nombre de usuario ya
está tomado. Las demás políticas sin `to` acotan la fila por `auth.uid()`, así
que para `anon` no devuelven nada.

**Corrección del 2026-09-15.** Hasta esta fecha esta sección decía *«Ninguna
regla de permisos está escrita en TypeScript»*. Dejó de ser cierto y conviene
decir por qué, porque la frase se leía como permiso para no mirar el código al
auditar permisos.

Hay dos lugares en TypeScript que participan del control de acceso, y ninguno
de los dos **decide**:

- `src/middleware.ts` reparte por `cuentas.tipo` y manda a cada cuenta a su
  mitad de la aplicación. Es navegación, no autorización de datos: protege qué
  URL se abre, no qué escritura se acepta. Una Server Action no vive en una
  ruta propia —se invoca por POST contra cualquier ruta, con un id que viaja
  en los chunks de `/_next/static`, que el `matcher` excluye—, así que el
  middleware no la cubre.
- `src/lib/acciones/sesion.ts` comprueba que quien invoca una acción de
  postulante tenga fila en `perfiles`. Existe por dos motivos, y ninguno es
  decidir el permiso: traducir el rechazo a una frase en vez de un error crudo
  de Postgres, y tapar el caso que RLS no puede informar —un `update` sobre
  una fila que la política no deja ver no falla, devuelve cero filas, y eso se
  leía en pantalla como éxito—.

La regla misma está en las políticas de insert de `postulaciones`,
`perfil_tags`, `perfil_habilidades`, `formaciones`, `inscripciones_evento`
(`exists (select 1 from perfiles where id = auth.uid())`) y de `vacantes` y
`eventos` (la inversa, contra `empresas`). Si se borrara todo el TypeScript de
arriba, el permiso seguiría siendo el mismo; lo que se perdería es el mensaje.

**Lado empresa (Etapa 2, migración 005).** Lo mismo vale para las acciones de
empresa: `sesionDeEmpresa()` da el mensaje, la base decide. Cada empresa lee y
modifica solo sus búsquedas, eventos y las postulaciones e inscripciones que
recibió; borrar una búsqueda lo permite la política
`vacantes_borro_las_mias_sin_postulaciones` solo si nadie se postuló; las
transiciones de una postulación las limita `postulaciones_transiciones_permitidas`
(la empresa solo lleva a `en_revision`, `entrevista`, `aceptada` o
`rechazada`) y el disparador `postulacion_transicion_valida`. Los datos de una
persona —nombre, bio, foto— la empresa los lee con `candidatos_de_mi_empresa`,
solo de quien se postuló o se inscribió a algo suyo (§5.10). Las 25
comprobaciones de `db/verificar-etapa2.sql` lo prueban con sesiones simuladas.

La formulación correcta de la regla, entonces: **la base decide, el código
explica**. Ver [`decisiones.md`](./decisiones.md).

### 2.3 La aplicación tiene que poder arrancar sin base

Un clon recién hecho, sin `.env.local`, no debería romper: `leerCredenciales()`
devuelve `null` en vez de lanzar, y `createClient()` propaga ese `null` para
que quien consulta decida qué hacer.

Cómo se comporta la interfaz cuando no hay base es parte de lo que la
reescritura de la capa de datos tiene que volver a definir. La regla que se
mantiene: **si lo que se muestra no salió de la base, hay que decirlo en
pantalla**. Mostrar datos inventados sin aclararlo sería engañoso, y en una
demo a terceros es la diferencia entre una maqueta honesta y una mentira.

### 2.4 La lógica de negocio no vive en el componente

Un componente recibe datos y los muestra. El cálculo de compatibilidad, el
orden del feed y las reglas de estado de una postulación viven en clases
propias, en `src/lib/dominio/`.

La regla práctica: si estás por escribir un `if` sobre una regla de negocio
dentro de un `.tsx`, va en una clase. Antes de esta separación, la afinidad se
armaba dentro de la tarjeta de vacante y las etapas del proceso estaban
repartidas entre la página de postulaciones y `formato.ts`.

---

## 3. Cómo viajan los datos

Toda lectura entra por `src/lib/data/` —`consultas.ts` para el joven y lo
público, `empresa.ts` para el panel de empresa, con lo común en `comun.ts`— y
toda escritura por `src/lib/acciones/`. Ninguna pantalla arma su propio
cliente de Supabase.

**Lectura.** Cada consulta devuelve un `Resultado<T>`: los datos y de dónde
salieron. Si faltan las credenciales, si la consulta falla o si la tabla está
vacía, se responde con el contenido de `ejemplos.ts` y `origen: "ejemplo"`, y
la pantalla lo anuncia con `AvisoOrigen`. Es la implementación de la regla
§2.3.

**Escritura.** Cada acción lleva `"use server"`, valida los campos en el
servidor, comprueba que haya sesión y devuelve un `EstadoAccion` que el
formulario consume con `useActionState`. Los formularios largos de empresa
devuelven un `EstadoFormulario`: además del mensaje, el error de cada campo y
lo que se había escrito, para que un error no borre el formulario. Al guardar
bien, redirigen al detalle con `?guardada=1` o `?guardado=1`, que la pantalla
convierte en un aviso. La acción no reemplaza a la política
de RLS: la acompaña. Quien decide es la base.

**Los tags y las habilidades ocultas.** Solo `src/lib/data/empresa.ts`
menciona `vacante_tags_ocultos` y `vacante_habilidades_ocultas` (migración
008), para que la empresa dueña los vea y edite (RF3.1.6, RF3.2.2). Ninguna
consulta del joven los pide, y aunque lo hiciera la política de RLS se los
niega a cualquier sesión que no sea la empresa dueña (RNF5).
`e2e/compatibilidad.spec.ts` lo comprueba con la clave pública, con y sin
sesión.

**La compatibilidad.** La calcula `CoincidenciaDeCandidato` y se muestra solo
en las pantallas de empresa (RF3.9.2). Del lado del joven, `Compatibilidad`
sigue existiendo solo para ordenar el listado (lo más afín primero), sin
número ni marcas.

**Las fotos de Unsplash** (2026-10-22). Las elige `scripts/fotos/` una vez,
con seis consultas a la API, y las guarda en `fotos` y `lugares_con_foto`; la
aplicación las lee de la base (`src/lib/data/fotos.ts`) y el navegador las
pide directo a `images.unsplash.com` (hotlink, como piden sus directrices; es
el único origen de imágenes de afuera en la CSP además de las teselas). La
clave de la API vive en `~/.linkyouth-unsplash` y solo la usan los scripts.

**Las fotos de Storage.** El navegador nunca le habla a Supabase: Supabase no se publica
en internet. Las fotos y logos se guardan y se muestran como rutas relativas
(`/storage/v1/object/public/avatars/…`, ver `rutaDeImagen`) y la propia app las
trae de Storage por la red interna con el `rewrite` de `next.config.ts`. El
middleware deja pasar esas rutas sin pedir sesión.

**Los avisos y los correos.** Ningún código de la aplicación escribe un
aviso: los escriben los disparadores de la base cuando cambia una
postulación, alguien se postula o se inscribe, o se cancela un evento. Los
tres avisos importantes dejan además un correo en `correos_pendientes`, que
la aplicación despacha por SMTP después de responder (`after()` y
`src/lib/correo/`). Es el único lugar donde el servidor usa la clave de
servicio sin que lo pida una persona por su nombre de usuario. Ver
`docs/correo.md`.

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
  politicas.sql           Row Level Security (55 políticas, 21 tablas)
  migraciones/            Cambios para una base ya creada (001 a 005)
  verificar-etapa2.sql    25 comprobaciones de RLS del lado empresa

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
  empresa/                Área de empresa: panel, busquedas/, eventos/,
                          candidatos/, perfil/, resenias/ (Etapa 2)

src/components/
  ui/                     Primitivas sin dominio
  layout/                 Estructura y navegación
  auth/ empleos/ empresa/ eventos/ landing/ perfil/   Por dominio

src/lib/
  supabase/               Cliente de servidor y credenciales
  data/                   Lectura: tipos.ts, ejemplos.ts, comun.ts,
                          consultas.ts (joven y público), empresa.ts
  acciones/               Escritura: auth, perfil, postulaciones, eventos,
                          busquedas, eventosDeEmpresa, perfilDeEmpresa
  contacto.ts             Correo de contacto, único para toda la interfaz
  formato.ts              Fechas, etiquetas, afinidad

src/types/database.ts     Tipos generados desde la base real
src/middleware.ts         Refresco de sesión y control de acceso a las rutas
```

---

## 5. Catálogo de funciones

Cada entrada dice qué hace la función y, cuando no es obvio, por qué existe.

### 5.1 `src/lib/supabase/config.ts`

#### `leerCredenciales(): CredencialesSupabase | null`

Lee `SUPABASE_URL` y `SUPABASE_ANON_KEY` del entorno (sin `NEXT_PUBLIC_`: el
navegador no habla con Supabase; ver `docs/seguridad.md`).
Devuelve `null` si falta cualquiera de las dos, en vez de lanzar.

Es el único punto del código que toca esas variables. Que devuelva `null` en
lugar de fallar es lo que sostiene la regla §2.3.

### 5.1b `src/lib/supabase/rutaDeImagen.ts`

#### `rutaDeImagen(url): string | null`

Convierte la URL de una imagen pública de Storage en ruta relativa, mirando el
camino y no el origen: sirve también para las URLs absolutas que ya estaban
guardadas (`http://<ip interna>:8000/…`). La vista previa `blob:` vuelve tal
cual, y desde el 2026-10-22 también las de `images.unsplash.com`, que se
muestran por hotlink; cualquier otra URL —un logo en otro sitio— devuelve
`null`, para que la portada no le pida imágenes a terceros en nombre de cada visitante (Fase 3 del
incidente 2026-10-08, `docs/seguridad.md`). La usan `Avatar`,
`CintaDeOrganizaciones`, `TarjetaEvento`, `subirImagenDePerfil` y
`logoDeLaCuenta` (alta de empresa).

### 5.2 `src/lib/supabase/server.ts`

#### `async createClient({ recordar? })`

Cliente para Server Components, Route Handlers y Server Actions. Lee y escribe
las cookies de sesión a través de `cookies()` de Next.js. Si la persona no
eligió «Mantener la sesión iniciada» (cookie `ly-recordar=0`, o `recordar:
false` en el mismo request del login), escribe las cookies de Supabase sin
`maxAge` ni `expires`: son de sesión.

#### `sesion.ts`

`COOKIE_RECORDAR`, `recuerdaSesion(valor)`, `esConexionSegura(protocolo)` y
`opcionesDeCookie(opciones, recordar, segura)`, que usan el cliente del
servidor y el middleware para que las cookies renovadas respeten la
preferencia. `opcionesDeCookie` además las marca siempre `httpOnly` y
`sameSite: "lax"`, y `secure` cuando el request llegó por HTTPS
(`X-Forwarded-Proto`, que ponen el Funnel y el WAF). Solo importa tipos: corre
también en Edge.

Es `async` porque en Next.js 15 `cookies()` pasó a ser asíncrono. El `setAll`
está envuelto en `try/catch` a propósito: un Server Component no puede
escribir cookies, y el middleware ya refrescó la sesión, así que ese error
específico se puede ignorar sin perder nada.

### 5.2b `src/lib/supabase/admin.ts`

`server-only`. El único lugar del código con la clave de servicio, que saltea
RLS.

#### `crearClienteDeServicio()`

Cliente con `SUPABASE_SERVICE_ROLE_KEY`, sin sesión persistida. `null` si
falta la clave.

#### `async correoDeUsuario(nombreUsuario): string | null`

El correo de la cuenta con ese nombre de usuario (comparación exacta, como el
índice único). Lo usa `iniciarSesion` para RF1.3.1. El correo nunca sale del
servidor: una vista o una función `security definer` que hiciera lo mismo le
daría a cualquiera el correo de cualquier persona.

### 5.3 `src/middleware.ts`

#### `async middleware(request)`

Corre en cada request. Revalida el token de Supabase con `auth.getUser()`,
reescribe las cookies rotadas en la respuesta y **manda a `/login?next=…` a
quien entre sin sesión** a una pantalla que la pide. `next` es la ruta pedida,
para volver a ella después de entrar. Sin sesión quedan abiertas `ENTRADA`,
`INFORMATIVAS` y `EXPLORABLES`.

Con sesión, `/login` y `/registro` mandan al `next` si es una ruta interna que
le corresponde a ese tipo de cuenta, y si no, al inicio de la cuenta. Desde el
2026-10-22, `/` (`PORTADA`) también: con sesión la portada no se muestra, la
empresa va a `/empresa` y el joven a `/inicio`. Así ninguna cuenta con sesión
ve el menú de anclas de la portada («Nosotros», «Cómo funciona»…).

El control vive acá y no repetido en cada `page.tsx` porque es el único punto
por el que pasan todas las pantallas de `(app)/`. Las cookies que el refresco
acaba de reescribir se copian a la redirección: si se perdieran, el próximo
request intentaría refrescar un token ya descartado.

Si no hay credenciales, deja pasar el request intacto en vez de romper toda la
navegación: sin Supabase no hay sesión posible y la aplicación tiene que poder
recorrerse igual con los datos de ejemplo (§2.3).

Todo eso vive en `controlDeAcceso(request)`. `middleware` lo envuelve: genera
un nonce, se lo pasa a Next en el header `Content-Security-Policy` del request
(Next se lo pone a sus `<script>`) y en `x-nonce` (lo lee `layout.tsx` para su
script de tema), y agrega la misma política a la respuesta, sea cual sea la
salida —página, redirección o la vía sin credenciales—.

### 5.3b `src/lib/seguridad/csp.ts`

#### `generarNonce(): string` · `politicaDeContenido(nonce): string` · `CABECERA_NONCE`

`generarNonce` devuelve 16 bytes aleatorios en base64, uno por request.
`politicaDeContenido` arma la CSP: scripts solo con ese nonce más
`'strict-dynamic'` (sin `'unsafe-inline'`), estilos con `'unsafe-inline'`
(React escribe atributos `style`), imágenes del mismo origen más `data:`,
`blob:`, el servidor de teselas del mapa (`ORIGEN_DE_TESELAS`, 2026-10-20) y
`https://images.unsplash.com` (`ORIGEN_DE_UNSPLASH`, 2026-10-22),
`connect-src 'self'` (el navegador no habla con Supabase),
`frame-ancestors 'none'`. En desarrollo suma `'unsafe-eval'` y `ws:` para el
refresco en caliente. `CABECERA_NONCE` (`x-nonce`) es el header interno con el
que el middleware le pasa el nonce a los Server Components; no sale al
navegador. Ver `docs/decisiones.md`, 2026-10-09.

#### `RECUPERACION` · `CONTRASENIA_NUEVA`

`/auth/callback` y `/recuperar` pasan siempre, con o sin sesión, antes de
separar las dos mitades: no son de ninguna. `/recuperar/nueva` exige sesión
(la abre el enlace del correo) de cualquier tipo de cuenta; sin ella, vuelve a
`/recuperar`.

#### `ENTRADA` · `INFORMATIVAS` · `EXPLORABLES`

Tres listas. `ENTRADA` (`/login`, `/registro`) es pública sin sesión y deja de
tener sentido con ella. `INFORMATIVAS` (`/`, `/empresas`, `/como-funciona`,
`/legales`) se lee siempre y por los dos tipos de cuenta: están enlazadas desde
la cabecera y el pie, que aparecen en todas las pantallas, y mandar a `/login`
a alguien que toca «Cómo funciona» sería pedirle credenciales para leer un
folleto. `EXPLORABLES` (`/empleos`, `/empleos/[id]`, `/eventos`) se lee sin
sesión desde el 2026-09-26: lo que pide cuenta es postularse o inscribirse, y
cada botón lleva a `/registro?next=…` en vez de hacerlo.

`INFORMATIVAS` y `EXPLORABLES` viven en `src/lib/navegacion.ts`, junto con
`inicioDe(area)` —a dónde lleva el logo—, `destinoSeguro()` —que descarta un
`next` que no sea una ruta interna, para que el parámetro no sirva de
redirector abierto— y `correspondeA()`. Esta última existe porque el
`redirect()` de una Server Action renderiza el destino en la misma respuesta
sin pasar por el middleware: `iniciarSesion` y `registrarse` tienen que
comprobar por su cuenta que el `next` sea de la mitad de la aplicación que le
toca a la cuenta. `PORTADA` (`/`) nunca le corresponde a una cuenta con
sesión, así `/login?next=/` entra al panel y no a la portada.

#### `config`

El `matcher` excluye `_next/static`, `_next/image`, `favicon.ico` y los
archivos de imagen. Sin eso, el middleware correría en cada ícono y cada
fuente, y cada uno pagaría una revalidación de token.

### 5.3c `src/lib/mapa/teselas.ts`

`ORIGEN_DE_TESELAS`, `URL_DE_TESELAS`, `ATRIBUCION`, `ZOOM_MAXIMO`,
`CENTRO_POR_DEFECTO` (Montevideo), `ZOOM_POR_DEFECTO` y `ZOOM_DE_UN_PUNTO`.
Un solo lugar para el servidor de teselas: lo leen el mapa y la CSP, que así
no pueden quedar en desacuerdo. Ver `docs/decisiones.md`, 2026-10-20.

### 5.3d `src/lib/imagenes.ts` · `src/lib/unsplash.ts` · `src/lib/data/fotos.ts`

`ImagenDePagina`: `{ src, srcSet?, ancho, alto, alt, color?, credito? }`.
`imagen(espacio)` e `imagenDeRubro(rubro)` dan las fotos propias de
`public/imagenes/` (o `null` si el rubro no tiene foto: no se muestra la de
otro), desde `imagenes.generado.ts`, que escribe `scripts/imagenes/preparar.mjs`.
`lugarDeRubro(rubro)` da la clave `rubro:<slug>`.

`src/lib/unsplash.ts` (puro, servidor y navegador): `ORIGEN_DE_UNSPLASH`,
`esDeUnsplash(url)`, `urlConTamanio(url, ancho, { alto?, encuadre? })` (los
parámetros de imgix de la misma URL), `conReferencia(enlace)` (`utm_source` y
`utm_medium=referral`), `creditoDe(fila)` e `imagenDeUnsplash(fila)`.

`src/lib/data/fotos.ts` (2026-10-22): las fotos de Unsplash que eligió
`scripts/fotos/`, leídas de la base y nunca de la API.
`obtenerLugaresConFoto()` (con `cache`, una consulta por request),
`imagenDeLugar(lugar, respaldo)`, `creditosDe(urls)`, `conCreditos(items)`
(le suma `credito` a cada evento), `fotosDeInstituciones(nombres)` y
`obtenerTodasLasFotos()` (la lista de `/legales#fotos`). Sin base o sin la
tabla, todo da vacío y cada pantalla usa su respaldo: la foto propia, la
ilustración o el avatar con iniciales. Ver `docs/imagenes.md`.

### 5.4 `src/lib/formato.ts`

Funciones puras. No tocan la base ni el DOM. Todas usan `es-UY` y la zona
`America/Montevideo`, fijas: el servidor puede estar en cualquier huso, y la
fecha de un evento tiene que leerse igual para todos.

Importa sus alias de tipo de `src/lib/data/tipos.ts` (ver §3).

#### `fechaLarga(iso): string`

`"sábado 15 de octubre"`. Sin hora: la pone `hora()` y no se repite.

#### `fechaConAnio(iso): string`

`"22 de octubre de 2026"`, para fechas que pueden ser de otro año (cuándo se
cargó el resultado de personalidad).

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
`PerfilCompleto` (con `personalidad: PersonalidadDeclarada | null`, migración
009), `Formacion`, `PostulacionResumen`, `EmpresaResumen` — y el
envoltorio `Resultado<T>` con su `OrigenDatos`.

Del lado empresa (Etapa 2): `Modalidad` con `MODALIDADES` y `comoModalidad`;
`PerfilDeEmpresa`; `BusquedaResumen` (con `postulaciones` y `nuevas`) y
`BusquedaCompleta` (con habilidades, tags y tags ocultos como `OpcionCatalogo`,
porque el formulario necesita los ids); `DatosDeCandidato`,
`PostulacionRecibida` (con `persona: null` si se retiró), `EventoDeEmpresa`
(con `direccion`, `latitud`, `longitud` e `inscriptos`), `Inscripto`,
`ReseniaRecibida`, `Recomendado` y `PanelDeEmpresa`. `Vacante` suma
`modalidad` y `ubicacion`, y `Evento`, `direccion`, `latitud` y `longitud`.

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
`POSTULACIONES_EJEMPLO`, `CATALOGOS_EJEMPLO`, y del lado empresa
`EMPRESA_PROPIA_EJEMPLO`, `BUSQUEDAS_EJEMPLO` (una activa, una pausada, una
cerrada), `POSTULACIONES_RECIBIDAS_EJEMPLO`, `EVENTOS_DE_EMPRESA_EJEMPLO`,
`INSCRIPTOS_EJEMPLO` y `RESENIAS_EJEMPLO`. Solo usa campos que existen en
`db/schema.sql`. Los `id` de `CATALOGOS_EJEMPLO` son inventados, así que
`SelectorTags` no deja elegir cuando el origen es «ejemplo».

#### `comun.ts`

Lo que comparten `consultas.ts` y `empresa.ts`: `ClienteSupabase`, los motivos
`SIN_CREDENCIALES`, `TABLA_VACIA` y `SIN_SESION`, `ejemplo(datos, error)`,
`nombresDe(filas, catalogo)`, `obtenerUsuarioId()` (que `consultas.ts`
reexporta) y `resolverUsuarioId(supabase, usuarioId?)`.

#### `consultas.ts`

`import "server-only"`: si alguna vez se importa desde un componente de
cliente, el build falla en vez de filtrar la consulta al navegador.

| Función | Devuelve | Requisito |
| --- | --- | --- |
| `obtenerVacantes(filtros?)` | `Resultado<Vacante[]>` | RF3.5.1. Filtra por tipo y busca por título. |
| `obtenerVacante(id)` | `Resultado<Vacante> \| null` | RF3.5.3. Una vacante activa para su detalle. Comparte `select` y armado con `obtenerVacantes`. |
| `obtenerEventos(limite?)` | `Resultado<Evento[]>` | RF4.4.1. Solo eventos activos que todavía no ocurrieron. |
| `obtenerEvento(id)` | `Resultado<Evento> \| null` | RF4.4. Un evento para `/eventos/[id]`; `null` si no existe o no se ve. Los ids de ejemplo abren el contenido de demostración. |
| `obtenerPerfilActual()` | `Resultado<PerfilCompleto>` | RF2.1. Sin sesión devuelve el perfil de ejemplo. Trae también `personalidad` (migración 009), `null` si no la cargó. |
| `obtenerPostulaciones()` | `Resultado<PostulacionResumen[]>` | RF3.7. |
| `obtenerVacantesPostuladas()` | `Set<string>` | RF3.6.2. Incluye las canceladas: la restricción única no mira el estado. |
| `obtenerEventosInscriptos()` | `Set<string>` | RF4.5. |
| `obtenerAvisos(usuarioId?, limite?)` | `Resultado<Aviso[]>` | RF6.1. Sirve para las dos cuentas. Las filas las crean los disparadores de la base: `notificaciones` no tiene política de insert, así que ningún navegador puede fabricar un aviso. |
| `obtenerIdentidadDeSesion()` | `IdentidadDeSesion \| null` | Nombre, foto o logo e id de la sesión, para el avatar del menú de la cuenta. Joven o empresa según la fila que exista. |
| `contarAvisosSinLeer(usuarioId?)` | `number` | RF6.1. El contador de la campana; 0 sin sesión o sin base. |
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

#### `empresa.ts`

La lectura del lado empresa (Etapa 2). Mismo contrato que `consultas.ts`: un
`Resultado`, y contenido de demostración sin credenciales. Sin sesión manda a
`/login`. Los `.eq("empresa_id", …)` ordenan la consulta; quien decide qué se
ve es RLS. Los datos de cada persona salen de `candidatos_de_mi_empresa`, y
sus habilidades, intereses y formación de sus tablas, en tres lecturas en
paralelo para todas las personas a la vez (`armarPostulaciones`, privada).

| Función | Devuelve | Requisito |
| --- | --- | --- |
| `obtenerEmpresaPropia(usuarioId?)` | `Resultado<PerfilDeEmpresa>` | RF7.1. |
| `obtenerBusquedas(usuarioId?)` | `Resultado<BusquedaCompleta[]>` | RF7.1.1. Todas, de la más nueva a la más vieja, con cuántas postulaciones y cuántas nuevas. |
| `obtenerBusqueda(id, usuarioId?)` | `Resultado<BusquedaCompleta> \| null` | Una propia, con sus tags ocultos (RF3.1.6). `null` si no existe o no es suya. |
| `obtenerPostulacionesRecibidas(vacanteId, usuarioId?)` | `Resultado<PostulacionRecibida[]>` | RF3.4.1. |
| `obtenerEventosDeEmpresa(usuarioId?)` | `Resultado<EventoDeEmpresa[]>` | RF4. Con cuántos inscriptos. |
| `obtenerEventoDeEmpresa(id, usuarioId?)` | `Resultado<EventoDeEmpresa> \| null` | Un evento propio. |
| `obtenerInscriptos(eventoId, usuarioId?)` | `Resultado<Inscripto[]>` | Quiénes se inscribieron. |
| `obtenerReseniasRecibidas(usuarioId?)` | `Resultado<ReseniaRecibida[]>` | RF7.4. Sin el nombre de quien la escribió. |
| `obtenerPostulantesPropios(usuarioId?)` | `Resultado<{ postulacion, busqueda }[]>` | RF7.3. Postulantes no retirados de todas las búsquedas propias. |
| `obtenerPanelDeEmpresa(usuarioId?)` | `Resultado<PanelDeEmpresa>` | RF7. Perfil, búsquedas, eventos y las postulaciones en curso de las búsquedas activas, para recomendar. Si una lectura cae en el ejemplo, el panel entero lo es. |
| `obtenerPersonalidadCompartida(perfilId, usuarioId?)` | `string \| null` | Migración 009. El código («INTJ-T») del resultado de personalidad que la persona compartió, o `null`. Lo filtra la política de `perfil_personalidad`. Fuera de `armarPostulaciones` a propósito: solo lo usa la ficha del postulante, así no entra en la coincidencia, los filtros ni el orden. |

#### `publico.ts`

Lo que se ve de otra cuenta. `obtenerOrganizacion(id)` (RF2.5, RF8.2): datos
de la empresa, sus búsquedas activas, sus reseñas por `resenias_de_empresa()`
—sin autor— y `puedeReseniar`, que solo decide si se muestra el formulario
(la política de insert es la que manda). `obtenerPerfilPublico(usuario)`
(RF2.5): `perfil_publico()`, solo con sesión.

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

`tipos.ts` exporta además `EstadoFormulario` (el resultado de un formulario
largo: `campos` con el error de cada uno y `valores` con lo que se mandó),
`FORMULARIO_INICIAL`, `valoresDe(formData)`, `SIN_EMPRESA`, `ACCION_INICIAL`, `CLAVE_DUPLICADA` (el `23505` de
Postgres), `POLITICA_RLS` (el `42501`) y las tres respuestas de «no se puede
seguir», que son **distintas a propósito**:

- `SIN_CONFIGURAR` para el `if (!supabase)`: faltan las credenciales de
  Supabase. Quien no cargó `.env.local` no tiene ningún inicio de sesión que
  hacer, y mandarlo a iniciarlo lo hace buscar el problema donde no está.
- `SIN_SESION` para el `if (!user)`: el cliente se creó bien y no hay nadie
  autenticado.
- `SIN_PERFIL` para el guardia de tipo de cuenta: hay sesión, pero no es una
  cuenta de postulante con perfil creado. Decirle «iniciá sesión» a alguien
  que ya la tiene lo manda a buscar el problema al lugar equivocado.

#### `personalidad.ts` (migración 009)

El resultado del test de 16Personalities que carga el joven. Las tres pasan
por `sesionDePostulante()`.

| Función | Firma | Qué hace |
| --- | --- | --- |
| `guardarPersonalidad` | `(EstadoFormulario, FormData)` | Carga o cambia el tipo (`letras` de la lista y `variante` A o T, armados con `TipoDePersonalidad.armar`) con un `upsert`. Lleva `visible` («si»). Con error devuelve `campos` y `valores`. La fecha de carga la pone la base. |
| `cambiarVisibilidadDePersonalidad` | `(EstadoAccion, FormData)` | El interruptor «Mostrar a las empresas a las que me postulo»: cambia solo `visible_para_empresas`. |
| `borrarPersonalidad` | `()` | Borra el resultado; el perfil vuelve a «Sin completar». |

#### `cuenta.ts` (RF1.5, RF1.7)

| Función | Qué hace |
| --- | --- |
| `cambiarNombreDeUsuario` | Actualiza `perfiles.nombre_usuario`; el `23505` es «ya está en uso». |
| `cambiarContrasenia` | Comprueba la actual con un cliente aparte, sin cookies, y guarda la nueva con `auth.updateUser`. |
| `cambiarCorreo` | Con la contraseña actual, pide el cambio a GoTrue; queda hecho al abrir el enlace (`/auth/callback`, tipo `email_change`). |
| `eliminarCuenta` | Contraseña y la palabra ELIMINAR; `eliminar_mi_cuenta()` anonimiza en la base, y con la clave de servicio se reemplazan correo y contraseña de `auth.users`, se bloquea la cuenta y se borran sus imágenes. La fila de `auth.users` no se borra: su cascada se llevaría postulaciones y reseñas. |

#### `geocodificacion.ts`

`buscarDireccion(texto)` y `direccionDePunto(latitud, longitud)` devuelven
`{ estado: "ok", lugares }` o `{ estado: "error", mensaje }`. Consultan
Nominatim desde el servidor (un `User-Agent` propio, una consulta por
segundo por proceso, solo Uruguay al buscar) y solo para cuentas de empresa,
para que el servidor no quede de intermediario abierto. Las usa
`SelectorDeUbicacion` (RF4.1).

#### `src/lib/correo/` (no son acciones)

`despacharCorreos(limite?)` (`despachar.ts`, `server-only`): manda la cola
`correos_pendientes` por SMTP (RF6.3); nunca lanza. `armarCorreo`,
`enlaceAbsoluto` y `esDireccionDePrueba` (`plantilla.ts`): asunto, texto y
HTML del correo, con los enlaces solo a rutas propias. Ver `docs/correo.md`.

#### `formacion.ts` · `avisos.ts` · `resenias.ts`

`agregarFormacion` y `quitarFormacion(id)` (RF2.4); `marcarAvisosLeidos(id?)`
(RF6.1), uno o todos, para las dos cuentas; `publicarResenia` (RF8.1), que
valida con `ReglasDeResenia` y traduce el `42501` de la política
`resenias_solo_quien_postulo` a «podés reseñar después de postularte».

#### `recuperacion.ts` (RF1.8)

| Función | Qué hace |
| --- | --- |
| `pedirRecuperacion` | Pide a GoTrue el correo de recuperación. Responde lo mismo exista o no la cuenta: decirlo serviría para averiguar quién está registrado. |
| `guardarContraseniaNueva` | Con la sesión que abrió el enlace, valida con `FuerzaDeContrasenia` y guarda la contraseña con `auth.updateUser`. Vuelve a `/inicio` con el aviso `contrasenia-nueva`. |

`iniciarSesion` (en `auth.ts`) acepta en el campo `email` el correo o el
nombre de usuario (RF1.3.1): sin «@» lo resuelve `correoDeUsuario`. Si no
existe, sigue con un correo imposible para que el mensaje sea el mismo que con
una contraseña equivocada.

#### `sesion.ts`

El preámbulo compartido de las acciones de postulante. No lleva `"use server"`:
no es una acción, la usan las acciones.

| Función | Devuelve | Qué resuelve |
| --- | --- | --- |
| `sesionDePostulante()` | `{ ok: true, sesion } \| { ok: false, error }` | Cliente, sesión y tipo de cuenta en un solo lugar. Las seis acciones de escritura repetían las mismas cuatro líneas de preámbulo; con el chequeo de tipo hubieran sido seis lugares donde acordarse de agregarlo. |
| `mensajeDeError(error)` | `string` | Traduce el `42501` a «No tenés permiso para hacer esto.». El resto de los códigos los traduce cada acción, que es la que sabe qué significa un `23505` en su contexto. |

Que exista fila en `perfiles` equivale a ser cuenta individual: el disparador
`validar_tipo_cuenta` garantiza que una cuenta tiene fila en `perfiles` o en
`empresas`, nunca en las dos. Por eso el guardia no consulta `cuentas.tipo` ni
hace falta una función nueva en la base. Cuesta una consulta por escritura;
si pesa, el tipo va como claim del JWT con un auth hook (misma nota que en
`src/middleware.ts`).

`sesionDeEmpresa()` es el equivalente para las acciones de empresa (Etapa 2):
exige fila en `empresas`. Mismo criterio: da el mensaje, la regla está en RLS.

| Función | Qué hace | Requisito |
| --- | --- | --- |
| `registrarse` | Crea el usuario en `auth.users` y, con la sesión del `signUp`, las filas de `cuentas` y `perfiles`. Chequea el `nombre_usuario` repetido antes de crear nada. Si el proyecto pide confirmación por correo el `signUp` no devuelve sesión: los datos quedan en `user_metadata` y el alta se completa en el primer login, que es cuando RLS tiene el `auth.uid()` que exige. | RF1.1 |
| `iniciarSesion` | Autentica y, si el alta había quedado pendiente, la completa. Responde lo mismo ante contraseña incorrecta y correo inexistente: distinguirlos revelaría qué direcciones están registradas. | RF1.3 |
| `cerrarSesion` | `signOut()` y redirección a `/login`. | RF1.3.5 |
| `postularse` | Inserta la postulación. El estado inicial `pendiente` es el default de la columna. | RF3.6 |
| `cancelarPostulacion` | **Actualiza** el estado a `cancelada`. No borra la fila. | RF3.8 |
| `inscribirse` | Inserta en `inscripciones_evento`. | RF4.5 |
| `cancelarInscripcion` | Borra la inscripción. Acá sí se borra: la tabla no lleva estado y la política habilita el `delete` al dueño. La usa `TarjetaEvento`. | RF4.6 |
| `actualizarPerfil` | Actualiza nombre, apellido, país y biografía. | RF1.5, RF2.2 |
| `agregarTag` / `quitarTag` | Insertan o borran una fila de `perfil_tags`. | RF2.3 |
| `agregarHabilidad` / `quitarHabilidad` | Insertan o borran una fila de `perfil_habilidades`. | RF2.4.3 |

**Acciones de empresa** (Etapa 2). Todas empiezan por `sesionDeEmpresa()` y
validan con la clase de dominio que corresponde antes de escribir.

| Función | Qué hace | Requisito |
| --- | --- | --- |
| `guardarBusqueda` (`busquedas.ts`) | Crea o edita una búsqueda con habilidades públicas y ocultas, áreas y tags ocultos. Comprueba el título repetido entre las activas antes de escribir (el índice único es la defensa final). Una nueva se crea pausada, se cargan las tablas puente y recién ahí se activa: nadie ve una búsqueda a medio cargar. Una vez creada, nunca vuelve al formulario (reintentar la duplicaría): redirige al detalle, con `falto=` si algo quedó sin hacer. | RF3.1, RF3.1.2, RF3.1.6, RF3.2 |
| `cambiarEstadoBusqueda` | Pausar, reactivar o cerrar, según `ReglasDeBusqueda`. Cerrar es final y la base rechaza las pendientes (RF3.3.3). | RF3.3 |
| `eliminarBusqueda` | Borra una búsqueda sin postulaciones; con postulaciones la política no lo deja y el mensaje propone cerrarla. | — |
| `cambiarEstadoPostulacion` | Lleva una postulación al estado siguiente, solo hacia adelante (`EstadoParaEmpresa`). La base avisa a la persona. | RF3.4.3, RF6.2 |
| `guardarEvento` (`eventosDeEmpresa.ts`) | Crea o edita un evento: hora de Montevideo, dirección, coordenadas, áreas e imagen. Si el evento se guardó pero faltó algo, redirige con `falto=` en vez de volver al formulario y duplicarlo. | RF4.1, RF4.2 |
| `cancelarEvento` | Lo pasa a `cancelado`; la base avisa a los inscriptos. | RF4.3 |
| `actualizarPerfilDeEmpresa` (`perfilDeEmpresa.ts`) | Razón social, RUT (sin repetir), rubro, descripción, sitio web y logo. | RF1.2, RF7.1 |

El mensaje de error nunca se muestra crudo cuando se lo puede traducir: el
`23505` de una postulación repetida se lee como «Ya te habías postulado a esta
búsqueda», y el `23514` del constraint `perfiles_mayor_de_edad` como «Tenés que
ser mayor de 18 años para registrarte». La regla de edad vive solo en la base
(RF1.1.8); el código traduce su respuesta y no la reimplementa.

Toda escritura termina en un **`.select(…)`**, y eso es lo que distingue «no se
tocó ninguna fila» de «salió bien». Sin él, un `update` o un `delete` que RLS
deja pasar sin encontrar la fila no devuelve error: la respuesta es un éxito
vacío, y la pantalla lo muestra como que se guardó algo que no se guardó.
`actualizarPerfil` y `cancelarPostulacion` devuelven error en ese caso.

Las cuatro acciones de etiquetas comparten `cambiarVinculo`, y ahí cero filas
es **deliberadamente un éxito**. Las dos direcciones son idempotentes: agregar
una etiqueta que ya estaba choca con la clave primaria `(perfil_id, tag_id)` y
**absorbe el `23505`**; sacar una que ya no estaba toca cero filas. En los dos
casos el perfil quedó como lo pidió el clic, y devolver error haría que el
estado optimista de `SelectorTags` revirtiera una etiqueta que sí quedó bien.
Las consultas seleccionan `perfil_id` y no `id`: las dos tablas puente tienen
clave compuesta y no llevan columna `id`.

El límite de 600 caracteres de la biografía vive solo en `actualizarPerfil`:
`db/schema.sql` declara `bio` como `text` sin restricción, así que es una
decisión de producto, no del esquema.

### 5.7 `src/lib/dominio/`

Las reglas de negocio, fuera de los componentes (§2.4). Ninguna clase hereda
de otra: entre comparar etiquetas, ordenar un listado e interpretar un estado
no hay comportamiento compartido, y una jerarquía ahí sería decorativa.

#### `Compatibilidad`

`Compatibilidad.entre(vacante, perfil)` compara lo que pide la vacante —sus
tags públicos y sus habilidades— con lo que el perfil declara. Expone
`medible`, `porcentaje`, `alta`, `cubre(requisito)`, `cantidadCubierta`,
`cantidadRequerida` y `faltantes`.

Desde el 2026-10-22 **no se muestra**: el joven no ve compatibilidad ni
coincidencias (RF3.9.2). Solo la usa `FeedDeVacantes` para ordenar.

Solo mira datos públicos. La coincidencia que ve la empresa, con los tags
ocultos (RF3.9), es otra clase: `CoincidenciaDeCandidato`.

#### `CompletitudDeFicha`

`CompletitudDeFicha.de(perfil)` dice qué le falta a una ficha y por qué
importa cada cosa: intereses (al menos `TAGS_MINIMOS`), habilidades,
biografía y formación. `pasos`, `hechos`, `total`, `completa`. La usa la guía
de arriba de `/perfil`.

#### `ResumenDePanel`

`new ResumenDePanel(panel)` da los números y listas del panel de empresa:
`busquedasActivas`, `postulantesNuevos`, `posicionesAbiertas`,
`eventosProximos`, `recomendados` (hasta cuatro postulantes propios en
proceso, con al menos una habilidad pedida, de más a menos coincidencia) y
`faltaEnElPerfil`, y `nuevosParaRevisar(limite = 5)`: las postulaciones
`pendiente` de las búsquedas activas, de la más reciente a la más vieja, que
el panel muestra en «Para revisar» (2026-10-22). Qué cuenta como «activa»,
«nuevo», «próximo» o «recomendado» es una regla de negocio, y vive acá.

#### `CoincidenciaDeCandidato`

`CoincidenciaDeCandidato.entre(busqueda, persona)`: cuántas de las
habilidades pedidas declara la persona y cuántos de los intereses clave (tags
ocultos) tiene, como dos cuentas separadas y sin porcentaje (RF3.4.2, RF3.9).
`declara`, `pide`, `esInteresClave`, `habilidadesQueNoDeclara`,
`habilidadesCubiertas`, `habilidadesPedidas`, `interesesClaveCubiertos`,
`interesesClave`, `comparar(a, b)`, `ordenar(busqueda, postulaciones)` y
`requisitosDe(busqueda)`, que arma lo pedido con las habilidades públicas y
las ocultas juntas (migración 008): las ocultas cuentan igual.

#### `TipoDePersonalidad`

Los 16 tipos de 16Personalities con su nombre en español y su grupo
(Analistas NT, Diplomáticos NF, Centinelas SJ, Exploradores SP), y las
variantes A (asertiva) y T (turbulenta). `de(codigo)` lee lo que guarda la
base («INTJ-T») y devuelve `null` si no es uno de los 32 códigos; `armar
(letras, variante)` arma lo que eligió el joven; `opciones()` da la lista
agrupada del formulario. Getters `codigo`, `nombreDelGrupo`,
`nombreDeLaVariante`. El nombre no se guarda en la base: sale de acá. No lo
usa `Compatibilidad` ni `CoincidenciaDeCandidato` (decisiones, 2026-10-22).

#### `EstadoParaEmpresa`

`new EstadoParaEmpresa(estado)`: cómo nombra la empresa cada estado (Nueva, En
revisión, Entrevista, Seleccionada, Descartada, Se retiró), `tono`, `esNueva`,
`seRetiro`, `final`, `siguientes` (con el texto del botón) y
`puedePasarA(destino)`. Solo hacia adelante. Exporta `ESTADOS_PARA_EMPRESA`
y `agruparPorEstado(items, estadoDe)`: los grupos del tablero de postulantes
de una búsqueda, en ese orden, con los vacíos, y «Se retiró» al final solo si
hay alguien (2026-10-22).

#### `ReglasDeBusqueda`

Límites de una búsqueda (título, descripción, ubicación, posiciones,
habilidades públicas y ocultas contadas juntas, áreas, intereses clave; una
habilidad no puede ser pública y oculta a la vez), `pideUbicacion(modalidad)`,
`validar(datos)`, `acciones(estado)`, `estadoTras(estado, accion)`,
`puedeEliminar(postulaciones)` y `puedeEditar(estado)`. Exporta
`ETIQUETA_MODALIDAD`, `ETIQUETA_ESTADO_BUSQUEDA` y el tipo `ErroresDeCampo`.

#### `TipoDeAviso`

`new TipoDeAviso(tipo)` con `etiqueta` y `tono` (`logro`, `baja`, `novedad`,
`neutro`) para cada `notificaciones.tipo`; los avisos viejos (`postulacion`,
`evento`) se leen como genéricos. `textoDelContador(n)` («9+») y
`nombreDeLaCampana(n)` («Avisos, 3 sin leer»).

#### `ReglasDeEvento`

Límites de un evento, `deHoraLocal(texto)` y `aHoraLocal(iso)` (la hora de
Montevideo, calculada con `Intl` y no con «-03:00» fijo), `leerCoordenada`,
`validar(datos, ahora?)`, `tieneUbicacion(evento)`,
`comoLlegar(evento, plataforma)` (Mapas de Apple, `geo:` o indicaciones de
OpenStreetMap según el sistema; `null` sin coordenadas ni dirección),
`plataformaDe(userAgent)`,
`momento(evento, ahora?)` (próximo, pasado o cancelado) y
`puedeModificar(evento, ahora?)`. Exporta `MOMENTOS_DE_EVENTO`.

#### `ReglasDePerfilDeEmpresa`

`normalizarSitio(texto)` (completa `https://`) y `validar(datos)`, con el RUT
por `ReglasDeRegistro`.

#### `BuscadorDeCandidatos`

RF7.3 entre los postulantes propios: `agrupar(filas)` junta las postulaciones
de cada persona, `intereses(candidatos)` cuenta los intereses presentes y
`filtrar(candidatos, intereses)` deja a quienes tienen todos los elegidos.

#### `ResumenDeResenias`

`total`, `promedio` y `promedioTexto` de las reseñas recibidas (RF7.4).

#### `FeedDeVacantes`

`FeedDeVacantes.armar(vacantes, perfil)` ordena por compatibilidad y, a
igualdad, por fecha. Desde el 2026-10-22 ya no destaca ninguna («La que más
coincide con vos»): la compatibilidad no se le muestra al joven (RF3.9.2).

#### `ProcesoDePostulacion`

`new ProcesoDePostulacion(estado)` responde qué significa ese estado para quien
postuló: `etiqueta`, `etapa`, `cancelable`, `cerradoSinPuesto`, `aceptada` y
`alcanzo(etapa)`. Las tres etapas visibles no son los seis estados de la base:
`entrevista` es parte de la revisión, y `aceptada`, `rechazada` y `cancelada`
caen todas en la última.

#### `FuerzaDeContrasenia`

`new FuerzaDeContrasenia(texto)` responde qué tan buena es y por qué:
`requisitos`, `puntaje`, `nivel`, `segmentos`, `etiqueta`, `esAceptable` y
`motivoDelRechazo`. La usan las dos capas —el medidor del formulario y
`registrarse()`—, y que sea la misma clase es lo que impide que el navegador
acepte una contraseña que el servidor rechaza.

El puntaje no mide entropía: cuenta requisitos cumplidos. Una barra verde no
promete que la contraseña sea buena, promete que cumple lo que la plataforma
pide.

#### `ReglasDeRegistro`

Los límites del registro, como miembros estáticos: `EDAD_MINIMA`,
`LARGO_NOMBRE`, `TAGS_MINIMOS`, `PESO_MAXIMO_IMAGEN`, `FORMATOS_IMAGEN`, más
`fechaMaximaDeNacimiento(hoy)`, `tieneEdadSuficiente(fecha, hoy)`,
`normalizarRut`, `rutValido` y `problemaDeImagen(archivo)`.

Cada límite existe tres veces en el recorrido —atributo del `<input>`,
comprobación en la acción, restricción de la base— y las tres tienen que decir
el mismo número. La clase no reemplaza a ninguna de las tres capas: les da el
número.

`fechaMaximaDeNacimiento` recibe el día en vez de leer el reloj a propósito: el
servidor y el navegador pueden estar en husos distintos, y una fecha calculada
dos veces con dos relojes es una diferencia de hidratación.

#### `Institucion`

`new Institucion(nombre)` deriva el identificador de URL (`id`), las
iniciales del recuadro y `correspondeA(id)`.

**No hay tabla de instituciones.** `formaciones.institucion` es texto libre, así
que el identificador se deriva del nombre. Dos grafías del mismo lugar son dos
instituciones distintas, y el identificador cambia si alguien corrige el
nombre: no se puede guardar ni compartir como enlace permanente (deuda 7.8).

### 5.8 `src/lib/diseno/`

#### `tokens.ts`

Paleta «Recreo» (2026-09-27): `CLARO` y `OSCURO`, con el contraste medido de
cada par en comentarios; `TEMAS` (`sistema`, `claro`, `oscuro`),
`TEMA_POR_DEFECTO`, `CLAVE_TEMA`, `esTema()` y `temaSiguiente()`, el orden en
que el botón del encabezado recorre los temas. Los mismos valores están en
`globals.css` como `--ly-*`. Ya no hay acentos elegibles.

#### `avatar.ts`

`colorDeAvatar(semilla)` → `{ fondo, texto }`: un par de clases de tokens de
`COLORES_DE_AVATAR` (5 pares, AA en los dos temas, sin mandarina ni alerta)
elegido por un hash FNV-1a de la semilla. La semilla es el id de la cuenta:
el color no cambia si cambia el nombre. Lo usa `Avatar`.

#### `PreferenciasDeApariencia`

Lee y escribe `data-tema` en `<html>` y lo guarda en `localStorage`.
«Sistema» borra el atributo y la clave, y el CSS sigue a
`prefers-color-scheme`. `tema`, `seVeOscuro` y `cambiarTema()`. No lanza
nunca: con el almacenamiento bloqueado, la elección vale para la visita.

### 5.9 Componentes

Reconectados contra `db/schema.sql`. Lo que la interfaz mostraba y el esquema
no guarda —salario, cupos, nivel de dominio de una
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
| `Tarjeta` | `como?`, `elevada?`, + props del elemento | Superficie con borde, radio de tarjeta. `elevada` solo para lo que está realmente por encima del plano. |
| `Boton` | `variante?`, + props de `<button>` | Botón de acción. `primario` es mandarina con texto tinta y es el único lugar de la app con mandarina: uno por pantalla. Baja 1 px al presionar. |
| `BotonEnlace` | `variante?`, + props de `<Link>` | Mismo aspecto, pero navega. Separado del anterior porque un enlace no es un botón para un lector de pantalla. |
| `Avatar` | `nombre`, `url?`, `semilla?`, `tamano?`, `forma?` | Foto o iniciales con color determinista (`colorDeAvatar(semilla ?? nombre)`), incluido detrás del `<img>` por si falla la carga. Tamaños `xs` (28 px), `sm`, `md`, `lg`. Reserva el espacio siempre, así la grilla no salta. Usa `<img>` y no `next/image` porque los archivos viven en Supabase Storage, con dominios variables. |
| `Foto` | `imagen`, `sizes`, `prioridad?`, `className?` | Una `ImagenDePagina` (de Unsplash por hotlink o propia) con `srcSet`, dimensiones intrínsecas y `object-cover`. Con `prioridad`, `loading="eager"` y `fetchPriority="high"`. Si trae `credito`, lleva encima «Foto de Autor en Unsplash» con los dos enlaces (`CreditoDeFoto`). |
| `FotoConCredito` | `url`, `alt`, `ancho`, `alto`, `credito?`, `className?` | La foto guardada en una fila (evento, portada de empresa): de Storage, o de Unsplash en el tamaño justo y con su crédito encima. |
| `Ilustracion` | `variante`, `className?` | Cinco ilustraciones SVG de 96 px en el estilo del isotipo (`postulaciones`, `avisos`, `eventos`, `busquedas`, `personas`) con tokens del tema (`fill-lavanda`, `stroke-violeta`, `stroke-turquesa`) para acompañar estados vacíos. |
| `Etiqueta` | `children`, `coincide?`, `marcada?` | Un tag o una habilidad, en píldora. Lo que el perfil ya declara va en turquesa (suave en claro) con ✓ y un texto para lectores de pantalla: nunca solo color. `marcada` la marca en violeta con ✓ y ese texto: es la de las pantallas de empresa, donde el turquesa no se usa en habilidades declaradas. |
| `Insignia` | `children`, `tono?` | Estado. `tono="acreditado"` es turquesa, para lo ya logrado (postulación aceptada o seleccionada). Una búsqueda activa va en `acento`. Siempre con palabra. |
| `SelectorDeOpciones` | `nombre`, `leyenda`, `opciones`, `inicial?`, `minimo?`, `maximo?`, `error?`, `tono?`, … | Elegir varias opciones de un catálogo como etiquetas que se prenden; lo elegido viaja en campos ocultos. Contador en `aria-live`. Lo usan el registro (`SelectorIntereses`) y los formularios de empresa (`tono="acento"`). |
| `BotonConfirmado` | `accion`, `campos`, `textos`, `variante?`, `deshabilitado?` | Para lo que no tiene vuelta atrás: el primer toque abre la confirmación en la misma pantalla; el foco va al botón que confirma y vuelve con Esc. |
| `Campo` | `etiqueta`, `ayuda?`, `error?`, `children` | Etiqueta, control y texto de ayuda. El `<label>` envuelve al control, así que el foco llega al hacer clic en el texto sin `htmlFor`. Exporta además la constante `CAMPO` con las clases del `<input>`, que comparten los tres formularios. |
| `BotonAccion` | `accion`, `campo`, `valor`, `textos`, `variante?`, `hecho?`, `esEjemplo?`, `celebrar?`, `extras?` | Dispara una acción de servidor sobre un ítem y anuncia el resultado en una región `aria-live`. Con `celebrar`, al salir bien aparecen los anillos del isotipo uniéndose (`ConexionAnillos`). No conoce vacantes ni eventos. |
| `EstadoVacio` | `titulo`, `descripcion`, `accion?`, `nivel?`, `ilustracion?` | Qué se ve cuando una lista viene vacía. Arriba, la foto de Unsplash del lugar `vacio:<ilustracion>` con su crédito, o la ilustración propia si no hay. Asíncrono desde el 2026-10-22: solo en Server Components. Nunca un blanco: siempre qué pasó y qué se puede hacer. |
| `Aviso` | `titulo?`, `children` | Aviso discreto: una línea con filete a la izquierda. Lo que la aplicación aclara sobre sí misma se ve igual, sin dominar la pantalla. |
| `MensajeDeAccion` | `estado`, `className?` | El resultado de una acción, al lado del control. El error se distingue por peso, filete y la palabra «No se pudo»: la paleta no tiene rojo a propósito. |
| `AvisoOrigen` | `resultado` | Avisa en pantalla que lo que se ve es contenido de demostración, y por qué. Implementa la regla §2.3. |
| `FiltroDeslizante` | `opciones`, `etiqueta` | Filtros y pestañas como enlaces con `searchParams`; la marca de la activa se desliza (`transform`). Sin JavaScript, funciona igual. |
| `DetallesSuaves` | `resumen`, `children`, `abiertoAlInicio?` | Un `<details>` que se despliega y se pliega con transición. Sin JavaScript, un `<details>` común. |
| `EsqueletoDePantalla` | `tarjetas?`, `columnas?` | Silueta de carga para los `loading.tsx`. |
| `ConexionAnillos` | — | Los dos anillos del isotipo uniéndose: la única «celebración» de la app. |
| `EnfocarPrimerError` | `estado` | Cuando la acción devuelve errores por campo (`estado.campos`), lleva el foco al primer elemento con `aria-invalid="true"` dentro del `<form>`. |
| `valoresDeFormulario` | `estado` | Qué mostrar en cada campo de un formulario largo: lo mandado si hubo error, lo guardado si no. |
| `Estrellas` | `valor` | Cinco estrellas dibujadas con el puntaje en texto (`sr-only`) para lectores de pantalla. Lo usan `/empresa/resenias` y `/organizaciones/[id]`. |

#### `layout/` — estructura

| Componente | Props | Qué resuelve |
| --- | --- | --- |
| `CabeceraGlobal` | `area?`, `umbralId?`, `secciones?` | Un solo menú por tipo de cuenta, dentro de `EncabezadoFlotante`. La empresa no ve Empleos ni Eventos del postulante. A la derecha: tema, y según el área, Entrar y Crear cuenta, o avisos y el menú de la cuenta (`AvatarDeLaSesion`). En el teléfono, el menú «Secciones». La portada pasa sus propias anclas en `secciones`. |
| `AvatarDeLaSesion` | — | Servidor asíncrono dentro de su propio `<Suspense>`: llama a `obtenerIdentidadDeSesion()` y muestra el `Avatar` (`xs`, 28 px) de quien tiene la sesión en el botón del menú de cuenta, con `IconoPerfil` en círculo lavanda como respaldo. |
| `PieDeSitio` | `area?` | Columnas por área: a una empresa, «Tu empresa» en lugar de «Para jóvenes» y sin «Cómo funciona». Abajo, el correo de contacto. Ningún enlace lleva a una página vacía. |
| `Marca` | `href`, `variante?`, `alto?` | Logo oficial desde `public/marca/`: la versión clara y la oscura como imágenes, y el CSS muestra la del tema (`.logo-claro`, `.logo-oscuro`). Imágenes y no SVG en línea para no repetir ids de degradado si aparece dos veces. |
| `Encabezado` | `titulo`, `descripcion?` | Encabezado de sección. |
| `BotonTema` | `className?` | Botón visible del tema: sistema → claro → oscuro. Lee el estado de `<html>` al montarse. |
| `BuscadorVacantes` | `accion`, `valor?`, `placeholder?` | Formulario **GET**: el resultado queda en la URL, se comparte, y volver atrás funciona. Anda sin JavaScript. |
| `Iconos` | `className?` | Trece íconos SVG en línea, todos sobre grilla de 24 y trazo 1.75. Inline y no una librería: una dependencia entera para doce trazos no se paga sola. |

#### `navegacion/` — menús y transiciones (clientes)

| Componente | Props | Qué resuelve |
| --- | --- | --- |
| `EncabezadoFlotante` | `children` | Encabezado fijo que, con el primer píxel de scroll, se transforma de a poco en cápsula de vidrio (progreso 0–1 en 120 px, curva ease-out) y vuelve a integrarse arriba. El progreso se calcula siempre desde `window.scrollY` —al hacer scroll con un `requestAnimationFrame` por cuadro, al montar, al cambiar de ruta, con `popstate`, `pageshow` y `resize`— y se escribe en `--p`; el CSS hace el resto. Deja un separador de 64 px en el flujo. |
| `NavPrincipal` | `secciones` | Las secciones del encabezado en escritorio; la activa con peso, filete violeta y `aria-current`. Las anclas (`#…`) van como `<a>` común. |
| `MenuDesplegable` | `boton`, `etiqueta`, `alinear?`, `children` | Menú con `aria-expanded`, Esc, clic afuera, flechas y foco de vuelta al botón. Se abre con `.emergente`. Exporta `OPCION_MENU`. |
| `BarraPestanas` | — | Pestañas de abajo del postulante en el teléfono, en cápsula de vidrio, con la marca de la activa que se desliza. |
| `AvisoDeLlegada` | — | Aviso al llegar desde la pestaña del login que no correspondía (`?aviso=`). Se cierra solo, se anuncia y limpia la URL. En los layouts de `(app)` y `empresa`. |
| `ProveedorDeTransiciones` | `children` | En el layout raíz: envuelve la navegación en `document.startViewTransition`, con tope de 800 ms. Sin soporte o con «reducir movimiento», navega normal. |
| `EnlaceTransicion` | props de `<Link>` | Un `Link` que cambia de pantalla con transición. Modificadores y anclas quedan como siempre. |

#### `portada/` — solo la página principal

| Componente | Props | Qué resuelve |
| --- | --- | --- |
| `AnimacionesDePortada` | — | Carga GSAP, ScrollTrigger y Lenis con `import()` y arma las animaciones ligadas al scroll: bienvenida que se opaca, tarjetas con parallax, recorte de la imagen de búsquedas, bloques que aparecen. Inercia solo con mouse o trackpad; con «reducir movimiento» no carga nada. |
| `SliderBienvenida` | `diapositivas` | Slider que cambia solo, con pausa, anterior, siguiente y puntos (WCAG 2.2.2). Sin JavaScript, scroll horizontal. |
| `TarjetasPasos` | `pasos` | Las tres tarjetas de «Así funciona», del mismo tamaño; «Ver más» / «Ver menos» con `aria-expanded`. |
| `Carrusel` | `etiqueta`, `children`, `claro?`, `controlesArriba?`, `className?` | Fila con `scroll-snap` y flechas que aparecen con JavaScript. |
| `FotoProvisional` | `que`, `tono?`, `semilla?`, `src?`, `conRotulo?` | Espacio para una foto real, con una composición provisional rotulada. Con `src`, la foto con `object-fit: cover`. Exporta también `RotuloFotoProvisional`. |

#### `auth/` · `empleos/` · `eventos/` · `perfil/` — por dominio

| Componente | Props | Qué resuelve |
| --- | --- | --- |
| `FormularioLogin` | `siguiente?`, `tipo?` | Correo y contraseña (RF1.3). `"use client"` por `useActionState`. |
| `PestanasDeCuenta` | `activo`, `destinos` | «Busco trabajo» / «Soy empresa» en login y registro, como enlaces con `?tipo=empresa`. |
| `TarjetaDeAcceso` | `titulo`, `bajada?`, `children`, `alternativa`, `ancha?` | La tarjeta centrada de iniciar sesión y crear cuenta: logo, tema, título, formulario, enlace alternativo y vuelta a la página principal. |
| `EntradaContrasenia` | props de `<input>` | Campo de contraseña con botón para mostrarla u ocultarla (`aria-label`, `aria-pressed`, `aria-controls`). |
| `FormularioRegistro` | — | Alta de cuenta individual (RF1.1). Los campos son exactamente las columnas obligatorias de `perfiles`, más el correo y la contraseña que van a `auth.users`. La mayoría de edad la exige la base: acá el campo es un `type="date"` común y el mensaje llega desde la acción. |
| `RegistroPendiente` | `email`, `mensaje` | Reemplaza al formulario cuando el registro salió bien pero falta confirmar el correo. Antes ese caso dejaba campos vacíos con una línea verde, que se lee como «no pasó nada» y empuja a reintentar un registro que no se puede repetir. |
| `ListadoDeVacantes` | `feed`, `yaPostuladas`, `esEjemplo?`, `conSesion?` | Tarjetas apiladas; la que más coincide va primera y destacada. |
| `FilaVacante` | `entrada`, `yaPostulado?`, `esEjemplo?`, `conSesion?` | Una vacante como tarjeta clickeable entera hacia el detalle; el botón de postularse queda por encima. Muestra lo que pide sin marcar coincidencias: la compatibilidad es solo de la empresa (RF3.9.2, 2026-10-22). |
| `TarjetaEvento` | `evento`, `yaInscripto?`, `esEjemplo?`, `conSesion?` | Tarjeta clickeable entera hacia `/eventos/[id]`, con imagen opcional, bloque de fecha en lavanda y dirección. Exporta también `AccionDeInscripcion` (inscribirse une los anillos; cancelar inscripción la revierte). |
| `eventos/ComoLlegar` | `evento` | Botón secundario «Cómo llegar» (RF4.4): lee `User-Agent` con `headers()` y delega en `ReglasDeEvento.comoLlegar` el enlace a Mapas de Apple, `geo:` o indicaciones de OpenStreetMap. No aparece si no hay coordenadas ni dirección. |
| `mapa/MapaInteractivo` | `puntos`, `respaldoSinJs?`, `etiqueta?` | Mapa embebido con Leaflet y teselas de OpenStreetMap (RF4.1, RF4.4). Carga diferida con `IntersectionObserver`, esqueleto y dirección sin JS, marcador SVG en violeta de marca, gestos táctiles que no atrapan el scroll del celular y emergentes armados con nodos del DOM. |
| `mapa/SelectorDeUbicacion` | `latitudInicial?`, `longitudInicial?`, `errorLatitud?`, `errorLongitud?` | Selector de coordenadas para `FormularioDeEvento` (RF4.1, RF4.2): buscador con `buscarDireccion`, resultados elegibles y mapa interactivo con marcador arrastrable que consulta `direccionDePunto` y completa la dirección si estaba vacía. |
| `TarjetaUsuario` | `perfil`, `postulaciones` | Cabecera del perfil con métricas de actividad propia. |
| `FormularioPerfil` | `perfil` | Edición de los datos públicos (RF1.5, RF2.2). |
| `AvatarEditable` | `nombre`, `url` | Vista previa al elegir archivo. La subida a Storage no está implementada: el componente avisa qué falta en vez de simular que guardó. |
| `BotonCancelarPostulacion` | `postulacionId` | Cancela una postulación propia (RF3.8) pasándola a `cancelada`. No borra la fila. |
| `SelectorTags` | `catalogos`, `tags`, `habilidades`, `esEjemplo?` | Elección de intereses y habilidades (RF2.3, RF2.4.3). Reemplaza a `NubeTags`, que solo mostraba lo ya elegido: los dos catálogos son cerrados, así que elegir es prender y apagar opciones que ya existen. Dos grupos separados, «lo que sabés hacer» y «hacia dónde querés ir», porque son dos catálogos distintos en el esquema. `"use client"` por el estado optimista, que es lo que hace que la etiqueta responda al toque y vuelva sola si la acción falla. Sin nivel de dominio: `perfil_habilidades` es una tabla puente sin más columnas. |
| `ImagenDeInstitucion` | `nombre`, `url?`, `tamanio?` | La imagen de una institución educativa: una foto genérica de campus o aula si la hay (`fotosDeInstituciones`), y si no, sus iniciales sobre un color de la paleta (`colorDeAvatar` del id de `Institucion`). Nunca el logo real (2026-10-22). |
| `landing/CintaDeOrganizaciones` | `empresas`, `deEjemplo` | Cinta de logos de borde a borde que se desplaza sola (CSS, solo `transform`); se detiene con el mouse o el foco. Logos como imagen, sin enlace. Marca provisoria (iniciales) si no hay logo; el aviso de abajo aparece en cuanto hay una sola. `deEjemplo` indica que las organizaciones mismas son de ejemplo. |
| `landing/PausaDeCinta` | — | Botón de pausa de la cinta (WCAG 2.2.2): marca `data-pausada`. |
| `landing/PreguntasFrecuentes` | — | Seis preguntas, cada una un `DetallesSuaves`. |
| `ListaFormacion` | `formaciones`, `esEjemplo?` | Estudios declarados y opción de quitar cada uno con confirmación (`BotonConfirmado`, RF2.4.2). Cuadro fijo a la izquierda con las iniciales de la institución, para que la lista se lea alineada. El esquema no guarda logo, años ni acreditación. |
| `FormularioDeFormacion` | `esEjemplo?` | Sumar un estudio en curso o finalizado al perfil propio (RF2.4.1), con errores por campo y valores conservados. |
| `InsigniaDePersonalidad` | `tipo`, `tamano?` (`grande` \| `compacta`), `etiqueta?` | El ícono propio del grupo (SVG de trazo sobre pares de tokens, sin imitar a 16Personalities), debajo el nombre del tipo («Arquitecto») y debajo las letras («INTJ-T»); grupo y variante en palabras para lectores de pantalla. `grande` en el perfil; `compacta`, en fila, en la ficha del postulante. Migración 009. |
| `SeccionPersonalidad` | `personalidad`, `esEjemplo?` | «Personalidad (opcional)» del perfil: «Hacer el test» (abre 16personalities.com/es en otra pestaña), la aclaración de que es declarado y no entra en la compatibilidad, y «Completado» con la insignia, el interruptor y las opciones de cambiar o borrar, o «Sin completar» con el formulario. |
| `FormularioDePersonalidad` | `guardado`, `visibleActual?`, `esEjemplo?` | Elegir el tipo de una lista de 16 agrupada y la variante A o T, sin escribir nada; muestra la insignia como va a quedar. Sin resultado ofrece la casilla de mostrarlo (sin marcar); editando, conserva la visibilidad. Conserva lo elegido ante un error. `"use client"` por la vista previa. |
| `InterruptorDeVisibilidad` | `visible`, `esEjemplo?` | Botón `role="switch"` en un formulario (anda sin JavaScript) que muestra u oculta el resultado a las empresas a las que se postuló. El estado va en palabras («Sí» / «No»). |
| `avisos/CampanaDeAvisos` | `href`, `sinLeer` | Botón redondo de 44×44 px en la cabecera con el ícono de avisos, contador de no leídos (`TipoDeAviso.textoDelContador`) y nombre accesible `TipoDeAviso.nombreDeLaCampana(sinLeer)` (RF6.1). |
| `avisos/CampanaDeAvisosDeLaSesion` | `href` | La campana con el número leído de la base (`contarAvisosSinLeer`), dentro de su propio `Suspense`: la cabecera se manda entera y el contador llega después. Es la que usa `CabeceraGlobal`. |
| `avisos/BandejaDeAvisos` | `avisos`, `descripcion?`, `descripcionVacia?` | Bandeja compartida entre joven y empresa: rótulo e ícono según `TipoDeAviso` (`logro`, `baja`, `novedad`, `neutro`), resaltado de no leídos y acciones para marcarlos o abrir el destino (RF6.1, RF6.2). |
| `avisos/ControlesDeAviso` | — | `BotonMarcarTodosLeidos`, `BotonMarcarAvisoLeido` y `EnlaceDeAviso` (con texto según el destino y blanco de 44 px) para marcar avisos como leídos (RF6.1). |
| `ListaFormacion` | `formaciones` | Estudios declarados. Cuadro fijo a la izquierda con las iniciales de la institución, para que la lista se lea alineada. El esquema no guarda logo, años ni acreditación. |
| `ajustes/FormularioNombreDeUsuario` | `actual?` | Cambio de nombre de usuario de una cuenta individual (RF1.5.1). |
| `ajustes/FormularioContrasenia` | — | Cambio de contraseña confirmando la actual y midiendo la fuerza de la nueva con `CampoContrasenia` (RF1.5.2). |
| `ajustes/FormularioCorreo` | `correoActual?` | Cambio de correo electrónico confirmando la contraseña actual (RF1.5.3). |
| `ajustes/FormularioEliminarCuenta` | `tipo?` | Baja definitiva y anonimización de la cuenta tras advertir qué se pierde y confirmar contraseña y `ELIMINAR` (RF1.7). |
| `resenias/FormularioDeResenia` | `empresaId` | Publicar una reseña anónima (1 a 5 estrellas y comentario) sobre una empresa en la que la persona se postuló (RF8.1). |

#### `empresa/` — pantallas de empresa (Etapa 2)

| Componente | Props | Qué resuelve |
| --- | --- | --- |
| `FormularioDeBusqueda` | `busqueda?`, `catalogos`, `esEjemplo?` | Publicar o editar una búsqueda. Errores por campo y valores que no se pierden (`valoresDeFormulario`). |
| `SelectorDeHabilidades` | `opciones`, `publicas?`, `ocultas?`, `minimo?`, `maximo?`, `error?` | Las habilidades que pide la búsqueda, cada una «Pública» o «Solo vos» (RF3.1.6). Manda `habilidades` y `habilidadesOcultas`. `"use client"` por la elección. |
| `AccionesDeBusqueda` | `busqueda`, `esEjemplo?` | Editar, pausar, reactivar, cerrar y eliminar, según `ReglasDeBusqueda`. |
| `TarjetaDePostulante` | `postulacion`, `coincidencia`, `href` | Una persona en el tablero de postulantes de una búsqueda: foto, nombre, cuántas pedidas declara y hace cuánto. Entra en una columna angosta. Reemplazó a `FilaDePostulante` (2026-10-22). |
| `CambioDeEstado` | `postulacionId`, `estado`, `nombre`, `esEjemplo?` | Los pasos siguientes de una postulación; seleccionar y descartar con confirmación. |
| `Coincidencia` | `coincidencia` | «Declara 3 de 4 habilidades pedidas · 1 de 2 intereses clave». |
| `HabilidadesDeclaradas` | `habilidades`, `coincidencia?`, `titulo?` | Las habilidades declaradas, con las pedidas primero y marcadas en violeta. |
| `InsigniaDeBusqueda` | `estado` | Activa, Pausada o Cerrada. |
| `FormularioDeEvento` | `evento?`, `tags`, `minimo`, `esEjemplo?` | Crear o editar un evento. |
| `FormularioDePerfilDeEmpresa` | `empresa`, `esEjemplo?` | El perfil de la empresa. |
| `AvisoDeResultado` | `children`, `tono?` | La confirmación que llega por `?guardada=1` después de redirigir. |
| `valoresDeFormulario` | `estado` | Qué mostrar en cada campo: lo mandado si hubo error, lo guardado si no. |

#### Páginas

| Ruta | Función | Qué hace |
| --- | --- | --- |
| `/` | `Portada` | Portada narrativa: slider de bienvenida, panel que emerge, «Así funciona», búsquedas abiertas, quiénes publican, opiniones de ejemplo, preguntas y llamada final. La única pantalla con animaciones ligadas al scroll. |
| `/login` | `PaginaLogin` | Inicio de sesión. Layout propio de `(auth)/`: una columna centrada, sin barra lateral. |
| `/registro` | `PaginaRegistro` | Alta de cuenta individual. |
| `/recuperar` | `PaginaRecuperar` | RF1.8: pide el correo y manda el enlace. `?motivo=vencido` explica por qué hay que pedir otro. |
| `/recuperar/nueva` | `PaginaContraseniaNueva` | RF1.8.4: elegir y confirmar la contraseña nueva, con la sesión del enlace. |
| `/auth/callback` | `GET` (route handler) | Verifica el `token_hash` de los correos de GoTrue (recuperación, confirmación, cambio de correo) y redirige con una ruta relativa: detrás del Funnel el servidor se ve como `localhost`. Ver `docs/correo.md`. |
| `/inicio` | `PaginaInicio` | Feed combinado con pestañas por `searchParams`. Incluye `Pestanas` (privada). |
| `/empleos` | `PaginaEmpleos` | Listado con búsqueda y filtro por tipo. Se lee sin sesión: sin compatibilidad, con una invitación a crear cuenta. |
| `/empleos/[id]` | `PaginaVacante` | Detalle de una vacante (RF3.5.3). Se lee sin sesión; «Postularme» lleva a crear cuenta y vuelve acá. |
| `/eventos` | `PaginaEventos` | Agenda de eventos próximos con mapa único arriba del listado (RF4.4). Se lee sin sesión; «Inscribirme» lleva a crear cuenta. |
| `/eventos/[id]` | `PaginaDetalleEvento` | Detalle de un evento para el joven (RF4.4, RF4.5, RF4.6): descripción completa, mapa con su marcador, «Cómo llegar» e inscripción. Se lee con o sin sesión. |
| `/postulaciones` | `PaginaPostulaciones` | Postulaciones propias con su recorrido de estados y la opción de cancelar. Incluye `pasoActual` y `Recorrido` (privadas). |
| `/perfil` | `PaginaPerfil` | Perfil propio, su edición y enlace a `/personas/<usuario>`. Incluye `Seccion` (privada). |
| `/personas/[usuario]` | `PaginaPerfilPublico` | Perfil público de una persona con sesión (RF2.5, RF2.1.1): foto, `@nombre_usuario`, biografía e intereses, sin nombre, apellido, edad ni país. |
| `/avisos` | `PaginaAvisos` | Bandeja de notificaciones y marcado como leído de un aviso o de todos (RF6.1). |
| `/ajustes` | `PaginaAjustes` | Tema y color de la plataforma. |
| `/perfil` | `PaginaPerfil` | Perfil propio y su edición. Incluye `Seccion` (privada). |
| `/avisos` | `PaginaAvisos` | Bandeja de notificaciones (RF6.1). |
| `/ajustes` | `PaginaAjustes` | Tema de la plataforma y ajustes de cuenta del joven: nombre de usuario, contraseña, correo y eliminar cuenta (RF1.5, RF1.7). |
| `/organizaciones/[id]` | `PaginaOrganizacion` | Perfil público de una empresa con sus búsquedas activas, sus reseñas anónimas con promedio y el formulario para reseñarla si corresponde (RF2.5, RF8.1, RF8.2). Se lee con o sin sesión. |
| `/empresas` · `/como-funciona` · `/legales` | — | Pantallas públicas, en `(sitio)/`. Se leen con o sin sesión, salvo `/como-funciona`, que para una empresa con sesión redirige a `/empresa`. |
| `/empresa` | `PaginaEmpresa` | Panel: búsquedas activas, postulantes nuevos, posiciones, próximos eventos y postulantes recomendados (RF7). |
| `/empresa/busquedas` | `PaginaBusquedas` | Mis búsquedas, con filtro por estado. `nueva`, `[id]` (postulantes ordenados por coincidencia), `[id]/editar` y `[id]/postulantes/[postulacionId]` (ficha y cambio de estado). RF3.1–RF3.4. |
| `/empresa/eventos` | `PaginaEventos` | Próximos, pasados y cancelados. `nuevo`, `[id]` (inscriptos, mapa, cancelar) y `[id]/editar`. RF4. |
| `/empresa/candidatos` | `PaginaCandidatos` | Postulantes propios filtrables por intereses (RF7.3). |
| `/empresa/avisos` | `PaginaAvisosDeEmpresa` | Bandeja de avisos de la empresa: nuevas postulaciones e inscripciones a eventos (RF6.1). |
| `/empresa/perfil` | `PaginaPerfilDeEmpresa` | Perfil de la empresa (RF7.1). |
| `/empresa/resenias` | `PaginaResenias` | Reseñas recibidas, anónimas (RF7.4). |
| `/empresa/cuenta` | `PaginaCuentaEmpresa` | Ajustes de cuenta de la empresa: contraseña, correo y eliminar cuenta (RF1.5, RF1.7). |
| `/contacto` | `PaginaContacto` | El correo de `src/lib/contacto.ts` y el contacto comercial. Sin formulario: no hay dónde recibir los mensajes. Pública. |

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

#### Funciones y disparadores de la Etapa 2 (migración 005)

- **`candidatos_de_mi_empresa(ids uuid[])`** (`db/politicas.sql`, `security
  definer`, `search_path ''`): nombre, usuario, país, bio y foto de las
  personas de `ids` que se postularon (sin retirarse) o se inscribieron a algo
  de la empresa de la sesión. Revocada a `public` y `anon`. Es la única forma
  en que la empresa lee datos de `perfiles`, que solo deja leer la fila propia.
- **`notificar_cambio_estado_postulacion()`**, reescrita: el aviso al joven
  dice el título de la búsqueda y el estado en palabras («pasó a la etapa de
  entrevista», «no fue seleccionada»), con enlace a `/postulaciones`.
- **`cerrar_vacante_al_cubrir_posiciones()`** · disparador
  `postulaciones_cerrar_vacante_al_cubrir`: al aceptar tantas personas como
  posiciones, la búsqueda se cierra (RF3.3.2).
- **`rechazar_pendientes_al_cerrar()`** · disparador
  `vacantes_rechazar_pendientes_al_cerrar`: al cerrar una búsqueda, las
  postulaciones `pendiente` pasan a `rechazada` y se avisa; las que están en
  revisión o entrevista siguen su curso (RF3.3.3).
- **`notificar_cancelacion_evento()`** · disparador
  `eventos_notificar_cancelacion`: avisa a cada inscripto (RF4.3.2).

#### Migración 007: avisos para los dos lados y correos

- **`correos_pendientes`**: la cola de correos (RF6.3). RLS sin políticas y
  sin permisos para `anon` ni `authenticated`.
- **`avisar(destino, tipo, texto, enlace, asunto?)`** (`security definer`,
  no se puede llamar desde la API): el único lugar que escribe avisos; con
  `asunto`, encola además el correo.
- **`notificar_cambio_estado_postulacion()`**, reescrita: tipos propios
  (`postulacion_seleccionada`, `postulacion_descartada`…), texto con la
  búsqueda y la empresa, enlace `/postulaciones#postulacion-<id>`; correo al
  seleccionar y al descartar.
- **`notificar_postulacion_recibida()`** · `postulaciones_notificar_recibida`
  y **`notificar_inscripcion_recibida()`** ·
  `inscripciones_notificar_recibida`: avisos a la empresa, con enlace a la
  postulación o al evento; correo solo por la postulación.
- **`reclamar_correos_pendientes(limite)`**: solo `service_role`; reparte la
  cola con `for update skip locked`.

Verificación: `db/verificar-007.sql` (12 comprobaciones, termina en
`ROLLBACK`).

#### Migración 006: cuenta y perfil público

- `resenias_de_empresa(empresa) returns table (id, calificacion, comentario,
  creada_en)`: `security definer`, abierta a `anon`. Sin `perfil_id`: la
  reseña pública no dice quién la escribió (RF8.2).
- `perfil_publico(usuario) returns table (id, nombre_usuario, foto_url, bio,
  tags)`: solo `authenticated`. Lo que RF2.1.1 llama datos públicos; nombre,
  apellido, nacimiento y país quedan afuera (H1).
- `eliminar_mi_cuenta() returns void`: anonimiza la cuenta de quien la llama
  (RF1.7). Joven: perfil sin datos, intereses, habilidades, formación,
  inscripciones y avisos borrados, postulaciones en curso a `cancelada`.
  Empresa: datos fuera, búsquedas a `cerrada`, eventos futuros a
  `cancelado` (los disparadores avisan). Las reseñas quedan.
- `notificaciones`: `update` solo de la columna `leida`.

Verificación: `db/verificar-006.sql` (9 comprobaciones, termina en
`ROLLBACK`).

#### Migración 008: habilidades ocultas y fotos

- `vacante_habilidades_ocultas`: las habilidades que una búsqueda pide sin
  publicarlas (RF3.1.6). Mismas tres políticas que `vacante_tags_ocultos`
  (solo la empresa dueña lee, agrega y borra) y sin permisos para `anon`.
  Tabla aparte y no una columna en `vacante_habilidades`, que se lee sin
  sesión: RLS decide filas, no columnas.
- `fotos` (atribución de cada URL de Unsplash) y `lugares_con_foto` (las
  fotos de los lugares fijos de la página): lectura para `anon` y
  `authenticated`, escritura solo con `service_role`. `empresas.portada_url`.
- `eliminar_mi_cuenta()` borra también `portada_url`.

Verificación: `db/verificar-008.sql` (8 comprobaciones, termina en
`ROLLBACK`).

#### Migración 009: personalidad declarada

- `perfil_personalidad` (`perfil_id`, `tipo`, `cargada_en`,
  `visible_para_empresas` en `false` por defecto): el resultado del test de
  16Personalities que carga el joven. `check` con los 16 tipos y la variante
  -A o -T. Tabla aparte de `perfiles` para que la visibilidad sea una
  política: el joven ve, carga, edita y borra lo suyo; una empresa lo lee
  solo si está visible, la cuenta está activa y la persona se postuló a una
  de sus búsquedas sin cancelar (`es_postulante_de_mi_empresa`). Sin
  permisos para `anon`.
- `personalidad_fecha_de_carga()`: disparador que pone `cargada_en` al
  cargar y al cambiar el tipo, y no la deja tocar a mano.
- `eliminar_mi_cuenta()` borra también el resultado.

Verificación: `db/verificar-009.sql` (16 comprobaciones como joven, como
empresa con y sin postulantes y sin sesión; termina en `ROLLBACK`).

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
| Modalidad (presencial, híbrido, remoto) | Vacante | **Resuelta en la Etapa 2** (`vacantes.modalidad`) |
| Ubicación | Vacante y evento | **Resuelta en la Etapa 2** (`vacantes.ubicacion`; `eventos.direccion`, `latitud`, `longitud`) |
| Cupo y cantidad de inscriptos | Tarjeta de evento | No hay cupo; el joven no ve cuántos se inscribieron (la empresa sí, en su evento) |
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

El registro de empresa entró con la Etapa 2. La recuperación de contraseña y
la confirmación de correo entraron el 2026-10-20 (`/recuperar`,
`/auth/callback`, `docs/correo.md`). Sigue en pie una parte: con la
confirmación activada, el alta de `cuentas` y `perfiles` se completa en el
primer inicio de sesión y no al confirmar, porque esa lógica vive en
`iniciarSesion`.

### 7.4 La subida de archivos sube, pero falla en silencio

**Resuelta a medias el 2026-09-15.** `src/lib/supabase/almacenamiento.ts` sube
la foto de perfil y el logo al bucket `avatars`
(`db/migraciones/002-bucket-avatars.sql`), y los dos registros traen su
`<input type="file">`.

Lo que queda abierto es qué pasa cuando la subida falla. Para cuando corre, la
cuenta ya existe: devolver un error dejaría el formulario diciendo que el
registro no anduvo, y el segundo intento chocaría con un correo ya registrado.
Así que el fallo se anota en el registro del servidor, la cuenta se crea igual
y la persona no se entera hasta que entra a su perfil y no ve su foto.

La salida es un aviso en la pantalla de destino, que hoy no existe: `/inicio` no
tiene dónde recibirlo. `AvatarEditable` sigue siendo el camino para cargarla
después.

### 7.5 La aplicación no distingue postulante de empresa — resuelta

Resuelta en dos tiempos, las dos partes ya cerradas.

La navegación la cerró `ad8f55c`: registro de empresa, área `/empresa` con
layout propio y reparto del middleware según `cuentas.tipo`.

El endpoint lo cerró el 2026-09-15. Lo que faltaba no se veía desde la
interfaz: el middleware protege la navegación por URL, no la invocación de una
Server Action, cuyos ids son públicos en `/_next/static` —ruta que el
`matcher` excluye—. Una cuenta de empresa podía invocar `postularse()` por
POST contra `/empresa`. Lo frenaba la clave foránea `perfil_id -> perfiles`,
que es integridad referencial y no control de acceso, y que no cubría la
dirección inversa. Ahora la exigencia está en las políticas de insert (§2.2) y
hay un guardia en `src/lib/acciones/sesion.ts` para el mensaje.

Las acciones del lado empresa llegaron en la Etapa 2, con su guardia
`sesionDeEmpresa()`.

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

### 7.8 Las instituciones educativas no tienen tabla

`formaciones.institucion` es texto libre. `/institucion/[id]` reconstruye la
ficha agrupando las formaciones que nombran el mismo lugar, con un
identificador derivado del nombre (`src/lib/dominio/Institucion.ts`).

Tres consecuencias, todas visibles en la pantalla:

1. «UTU» y «U.T.U.» son dos instituciones distintas.
2. El identificador cambia si alguien corrige el nombre, así que el enlace no
   es permanente.
3. No hay logo, descripción ni contacto, porque no hay columnas donde
   estuvieran. La página lo dice en pantalla en vez de rellenar con texto
   inventado.

La salida es una tabla `instituciones` con clave estable, y `formaciones`
apuntando a ella. Es una decisión de esquema que el equipo todavía no tomó.

### 7.9 Contenido provisional de la portada

Con el rediseño «Recreo» (2026-09-27) y la incorporación de fotos reales
(2026-10-20), la portada quedó con tres cosas que esperan contenido propio,
todas rotuladas en pantalla:

1. **Fotos propias.** Desde el 2026-10-22 todos los espacios de la portada
   tienen foto de Unsplash, elegida para no presentarse como algo de
   LinkYouth: un aula en lugar de «el equipo», un taller cualquiera, alguien
   con el teléfono sin la pantalla de la app. `FotoProvisional` queda solo de
   respaldo, si la base no tiene las fotos. Las fotos del equipo y de un taller
   propio siguen pendientes. Ver `docs/imagenes.md`.
2. **Opiniones.** Son de ejemplo y lo dicen en cada tarjeta. Se reemplazan
   por opiniones verdaderas, con permiso.
3. **Canal de contacto.** Desde la Etapa 2, `/contacto`, el pie y Legales
   muestran el correo de `src/lib/contacto.ts`. **Hoy es una dirección
   provisoria de dominio reservado** (`contacto@linkyouth.example`): falta que
   el equipo confirme la definitiva y la cambie en ese único lugar.

### 7.10 El tema se recuerda por navegador

La elección de tema vive en `localStorage`. Para que acompañe a la persona en
todos sus dispositivos haría falta una columna en `perfiles`. No se hizo
porque es un cambio de esquema.

### 7.11 Pendientes de la Etapa 2 (lado empresa)

1. **Recomendados solo entre postulantes propios.** El panel recomienda a
   quienes ya se postularon (opción «a»). Recomendar a jóvenes que no se
   postularon (opción «b») exige que cada joven acepte ser visible para las
   empresas, con una columna de consentimiento y una política nueva. Ver
   `decisiones.md`, Etapa 2.
2. **Cambiar el día o el lugar de un evento no avisa a los inscriptos.** Solo
   la cancelación tiene disparador (RF4.3.2). La pantalla de edición lo dice.
3. **Cerrar una búsqueda rechaza solo las pendientes** (RF3.3.3). Quien está
   en revisión o entrevista sigue en proceso hasta que la empresa decida.
4. **El formulario de consultas se sacó.** No había dónde entregar los
   mensajes; vuelve cuando exista una tabla o un servicio de correo
   (historial de git: `src/components/landing/FormularioConsulta.tsx` y
   `src/lib/acciones/consultas.ts`).
5. ~~**Mapa único de eventos para el joven.**~~ Resuelto el 2026-10-20: mapa
   en `/eventos`, en cada detalle y para elegir el lugar en el formulario.
6. **La prueba de punta a punta corre en el servidor.** En el entorno de
   desarrollo de la Etapa 2 no había Supabase (sin GoTrue ni PostgREST): se
   probaron las políticas sobre Postgres 16 con sesiones simuladas
   (`db/verificar-etapa2.sql`) y las pantallas con datos de demostración. El
   recorrido con cuentas reales está en `docs/prueba-etapa2.md`.
7. **Orden de títulos en el feed del joven.** `/empleos` y `/eventos` pasan de
   `h1` a `h3` (axe, `heading-order`, moderado). Viene de antes de la Etapa 2.
