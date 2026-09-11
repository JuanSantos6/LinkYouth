# Decisiones técnicas

Registro de las decisiones de arquitectura y tecnología de LinkYouth. Cada
entrada deja asentado qué se decidió, qué alternativas se evaluaron y por qué
se eligió esa opción.

---

## 2026-09-11 — Dirección de diseño «ficha técnica»

**Decisión.** Adoptar un vocabulario visual de registro sellado: paleta de
cinco valores con el ámbar reservado a lo acreditado, radios distintos según
la jerarquía, las vacantes como listado con filetes y los eventos como
tarjetas.

**Alternativas consideradas.**

- Seguir con el kit de tarjetas y solo cambiar la paleta.
- Un rediseño más expresivo, con degradados y fotografía.

**Motivo.** El diseño anterior era correcto y anónimo: el azul por defecto de
cualquier dashboard, todo el contenido troceado en rectángulos idénticos y la
misma sombra gris debajo de cada uno. Cambiar solo el color no arreglaba eso,
porque el problema era la forma. La dirección elegida además dice algo cierto
del producto: LinkYouth acredita habilidades en vez de leer un currículum, y
un registro se lee distinto de un feed.

Lo expresivo se descartó por el usuario: alguien buscando su primer trabajo
está ansioso, y la interfaz tiene que transmitir orden, no entusiasmo.

---

## 2026-09-11 — El ámbar solo para lo acreditado

**Decisión.** Que el ámbar aparezca en dos lugares de toda la aplicación: el
canto de la vacante destacada y la insignia de una postulación aceptada.

**Alternativas consideradas.**

- Pintar de ámbar cada etiqueta que el perfil ya declara.
- Usarlo también en el logo, como remate de marca.

**Motivo.** La primera versión hacía lo primero, y la revisión visual lo
mostró: con un perfil que coincide con casi todo, cada fila era una pared
ámbar. El color seguía siendo técnicamente correcto —marcaba lo acreditado—
pero a esa densidad dejaba de leerse como señal y pasaba a leerse como fondo.
Lo que coincide se distingue ahora por peso y por la marca de verificación,
que además no depende del color.

El remate en el logo se sacó por la misma regla: un logo no acredita nada, y
el ámbar puesto en cualquier lado deja de decir algo donde sí importa.

---

## 2026-09-11 — Los tokens en `:root` y `@theme inline`

**Decisión.** Declarar los valores en `:root` con prefijo `--ly-` y exponerlos
a Tailwind con `@theme inline`, en vez de declararlos directamente dentro de
`@theme`.

**Alternativas consideradas.**

- Declarar todo dentro de `@theme`, que es lo que muestra la documentación.
- Repetir los valores: una copia para las utilidades y otra para el CSS a mano.

**Motivo.** Tailwind 4 emite únicamente las variables de `@theme` que alguna
utilidad usa. Con la primera versión, `var(--color-acento)` escrito a mano en
la regla del anillo de foco se quedaba sin valor y caía en `currentColor`: el
foco tomaba el color del texto del enlace. El rodeo cuesta doce líneas y
garantiza que las variables existan siempre. Repetir los valores era la otra
salida, y es la que garantiza que en algún momento discrepen.

---

## 2026-09-11 — Clases de dominio en vez de funciones sueltas

**Decisión.** Mover la lógica de negocio de los componentes a tres clases:
`Compatibilidad`, `FeedDeVacantes` y `ProcesoDePostulacion`.

**Alternativas consideradas.**

- Dejarla como funciones puras en `formato.ts`.
- Una clase base común de la que hereden las tres.

**Motivo.** `afinidad()` devolvía un número, pero la pantalla necesitaba tres
cosas del mismo cálculo: el porcentaje, si una etiqueta puntual coincide y si
el total alcanza para destacar la vacante. Con una función suelta, cada
componente rehacía la comparación por su cuenta. Una clase deja que el
resultado se calcule una vez y se consulte de varias maneras.

No hay clase base: entre comparar etiquetas, ordenar un listado e interpretar
un estado no hay comportamiento real compartido, y una jerarquía ahí sería
decorativa.

---

## 2026-09-11 — Páginas reales para los enlaces del header y del pie

**Decisión.** Escribir `/empresas`, `/como-funciona`, `/legales` y `/avisos`
como páginas con contenido verdadero, en vez de dejar los enlaces inertes o
sacarlos de la navegación.

**Alternativas consideradas.**

- Enlaces marcados como pendientes.
- Limitar el header a las dos secciones que ya existían.

**Motivo.** La cabecera se ve en todas las pantallas, y dos enlaces muertos
ahí minan justamente la sensación de registro serio que busca la dirección. El
contenido dice lo que el proyecto hace hoy y lo que todavía no —el panel de
empresa no existe, la autenticación tampoco—, así que las páginas informan sin
prometer de más.

`/legales` era además una deuda del proyecto: RNF6 y RF1.1.12 exigen política
de privacidad, y la decisión de alojar los datos en us-east-2 tiene una
consecuencia que había que dejar escrita donde la lea un usuario.

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

