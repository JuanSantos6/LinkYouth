# Plan hasta el MVP

Cómo seguimos. Alcance: la **Fase 1** del SRS — RF1 a RF4, RF6 a RF8
funcionando contra Supabase real. Los chats (RF9) y la fase avanzada con IA
(RF10) quedan fuera.

El orden no es caprichoso: cada hito depende del anterior. Sin autenticación
no hay perfil propio, y sin perfil propio el matching no tiene contra qué
comparar.

**Cómo leer cada hito.** *Qué entra* es el alcance. *Qué no entra* está para
evitar que el hito se estire. *Terminado cuando* es la condición que se puede
verificar; si no se puede verificar, el hito no está cerrado.

---

## Hito 0 — Poner la casa en orden

Antes de escribir una línea de funcionalidad nueva.

> **Resuelto el 2026-09-10:** los dos esquemas de base incompatibles. El
> equipo decidió mantener `db/schema.sql` + `db/politicas.sql`, que es el que
> está aplicado en Supabase. `db/migrations/` y `db/seed/` se eliminaron en
> `6b6bf86`, junto con la capa de datos que dependía de ellos.

### 0.1 Reescribir la capa de datos contra `schema.sql` ✔

> **Resuelto el 2026-09-10.** `src/lib/data/` y `src/lib/acciones/` se
> reescribieron contra `db/schema.sql`: consultas con `select` anidado sobre
> las tablas puente reales, alias de tipo en `src/lib/data/tipos.ts` con su
> función de estrechamiento, y `cancelarPostulacion` como cambio de estado a
> `cancelada` en lugar de un `DELETE`. Los 18 `TODO` quedaron resueltos y
> `lint`, `typecheck` y `build` vuelven a pasar.
>
> Lo que la interfaz mostraba y el esquema no guarda —salario, modalidad,
> ubicación, cupos, niveles, años de estudio, verificación— se quitó de las
> pantallas en vez de inventarse. Está listado en `arquitectura.md` §7.1 para
> que el equipo decida si alguna de esas columnas tiene que existir.


---

## Hito 1 — Autenticación (RF1)

Lo que desbloquea todo lo demás. **Parcialmente resuelto**: el hito no se cierra
hasta que entren la recuperación de contraseña y los tests del flujo que escribe
en la base.

**Ya resuelto**

- ✔ Registro de postulante (RF1.1) y de empresa (RF1.2). Las dos altas crean la
  fila de `cuentas` más la de `perfiles` o `empresas` en el mismo flujo, y las
  dos toleran la confirmación por correo dejando los datos en `user_metadata`.
- ✔ Inicio y cierre de sesión (RF1.3, RF1.4).
- ✔ Protección de rutas en `src/middleware.ts`, con la sesión y además con el
  tipo de cuenta: cada mitad de la aplicación es inaccesible para el otro tipo.
- ✔ `cuentas.tipo` consumido de verdad, no solo declarado. Cierra la mitad de
  la deuda 7.5 de `arquitectura.md`.
- ✔ Tests e2e del control de acceso, en `e2e/auth.spec.ts`.

**Qué falta**

- **Tests e2e del registro y el login.** Los de control de acceso ya están en
  `e2e/auth.spec.ts`; falta el flujo que escribe en la base. No se escribieron
  todavía porque el único proyecto de Supabase es el que usa la aplicación: una
  suite que registre usuarios dejaría cuentas huérfanas en cada corrida y se
  bloquearía sola contra el límite de 2 correos por hora del plan gratuito.
  Antes hace falta un proyecto de Supabase de test, o `supabase start` local.
- **Recuperación de contraseña (RF1.6).** La pantalla `/recuperar` no está
  implementada. `login` y `registro` ya existen en `src/app/(auth)/`.
- El panel de empresa propiamente dicho. Hoy `/empresa` es un placeholder que
  solo dice que está en construcción: el contenido es el Hito 6 entero.
- **Route handler `/auth/callback` para el intercambio de código de Supabase.**
  No existe todavía. No bloquea el flujo actual: `iniciarSesion()` usa
  `signInWithPassword` directo y no depende de que un enlace deje la sesión
  abierta. Hace falta si más adelante se suma inicio de sesión por magic link o
  por OAuth, donde Supabase vuelve con un código que hay que intercambiar.

**Qué no entra**

- Inicio de sesión con proveedores externos (Google, LinkedIn). No está en el
  SRS para Fase 1.
- Verificación de identidad de empresas (RF1.7). Va con el Hito 6.

**Terminado cuando** se puede crear una cuenta, cerrar el navegador, volver a
entrar y ver el perfil propio; y entrar a `/perfil` sin sesión redirige a
`/login`.

**Ojo con esto.** Al registrarse hay que crear la fila de `perfiles` en la
misma transacción, o al menos verificar que quedó creada. Un usuario en
`auth.users` sin fila en `perfiles` es un fantasma: inicia sesión y no tiene
adónde ir.

---

## Hito 2 — Perfil y tags (RF2)

**Qué entra**

- `obtenerPerfilActual()` leyendo la sesión real en vez del perfil de ejemplo.
- Selección de tags contra el catálogo, con nivel 1–5 (RF2.3).
- Alta, edición y baja de formación (RF2.4).
- Subida de foto a Supabase Storage, completando `AvatarEditable` (RF2.1.4).
- Perfil público de otro usuario (RF2.5), leyendo la vista `perfiles_publicos`.
- **`FormularioPerfil` no muestra `fecha_nacimiento`, aunque el dato existe y se
  lee correctamente.** El comentario del componente dice que se muestra sin poder
  editarse, pero el código solo hace eso con `nombre_usuario`. Verificado el
  2026-09-12: la política `perfiles_veo_el_mio_completo` deja al dueño leer la
  columna y `obtenerPerfilActual` la trae; falta el campo en pantalla. Es una
  mejora de interfaz, no de seguridad: quedó fuera de la rama de la auditoría a
  propósito.

**Qué no entra**

- Que el usuario cree tags nuevos. El catálogo es cerrado por diseño: si cada
  uno inventa el suyo, el matching de RF3.9 deja de cruzar nada.

**Terminado cuando** un usuario puede completar su perfil entero —datos, foto,
tags, formación— y ver cómo lo ve otro.

**Antes de empezar:** hay que crear el bucket de Storage y su política de
acceso. La foto de perfil es pública para lectura y escribible solo por su
dueño.

---

## Hito 3 — Vacantes y postulaciones (RF3)

El corazón del producto.

**Qué entra**

- Publicación de vacante por parte de la empresa, con tags públicos y ocultos
  (RF3.1).
- Edición y cierre de vacante, manual y automático al cubrir las posiciones
  (RF3.2, RF3.3).
- Filtros del feed: tipo, modalidad, ubicación (RF3.5).
- Postulación y cancelación reales (RF3.6, RF3.8) — ya están escritas, hay que
  verificarlas contra la base.
- Seguimiento del estado por parte del postulante (RF3.7).
- Cambio de estado por parte de la empresa (RF3.4.3).
- **Implementar el cálculo de compatibilidad (RF3.9).** `db/schema.sql` tiene
  la tabla `vacante_tags_ocultos` y su RLS, pero **no** la función que cruza
  esos tags con los del perfil: hay que escribirla. Tiene que correr con
  `security definer` y devolver solo el número — las etiquetas no pueden
  salir de la función (RNF5). El puntaje se muestra solo del lado de la
  empresa (RF3.9.2).

**Qué no entra**

- El motor de recomendación de RF10.2. El matching de RF3.9 es un puntaje por
  vacante, no un sistema de recomendación.

**Terminado cuando** una empresa publica una vacante, un postulante se
postula, la empresa ve el puntaje y cambia el estado, y el postulante ve el
cambio reflejado.

**Ojo con esto.** La prueba que no se puede saltear: iniciar sesión como
postulante e intentar leer `vacante_tags_ocultos` directo contra la API de
Supabase con la clave `anon`. Tiene que devolver vacío. Es RNF5, y la única
forma de saber que se cumple es intentar romperlo.

---

## Hito 4 — Eventos (RF4)

**Qué entra**

- Alta, edición y cancelación de evento por la empresa (RF4.1, RF4.2, RF4.3).
- Inscripción y baja del postulante (RF4.5, RF4.6). Las dos acciones de
  servidor ya existen —`inscribirse()` y `cancelarInscripcion()` en
  `src/lib/acciones/eventos.ts`—: **falta el botón de cancelar inscripción a
  un evento, la acción del servidor ya existe.** Hasta que lo tenga,
  `cancelarInscripcion` queda exportada sin consumidor.
- Control de cupo: no se puede pasar del límite.
- Listado de inscriptos para la empresa dueña.

**Qué no entra**

- El chat grupal automático del evento (RF9.5). Es Fase 2.

**Terminado cuando** una empresa publica un evento con cupo, se llena, y el
siguiente que intenta inscribirse recibe un mensaje claro en vez de un error.

---

## Hito 5 — Notificaciones (RF6)

**Qué entra**

- Bandeja de notificaciones (RF6.1): listado, marcar como leída, contador de
  no leídas en la barra lateral.
- Verificar que el disparador de cambio de estado (RF6.2) escribe lo que la
  interfaz espera.
- Notificación de evento próximo.

**Qué no entra**

- Notificaciones por correo. El SRS no las pide para Fase 1.
- Tiempo real con Supabase Realtime. Primero que funcione recargando; si
  después molesta, se agrega.

**Terminado cuando** cambiar el estado de una postulación desde la cuenta de
la empresa hace aparecer la notificación en la cuenta del postulante.

---

## Hito 6 — Panel de empresa (RF7)

**Qué entra**

- Rutas propias de empresa, separadas de las del postulante.
- Listado de vacantes propias con su cantidad de postulantes.
- Detalle de postulantes de una vacante, ordenados por puntaje de matching.
- Perfil de empresa editable (RF7.1).
- Verificación de identidad de empresa (RF1.7).

**Qué no entra**

- Métricas y reportes. No están en Fase 1.

**Terminado cuando** una empresa entra, ve sus vacantes, abre una y revisa a
sus postulantes ordenados por compatibilidad.

**Ojo con esto.** Acá aparece la pregunta que hoy el código no responde: ¿cómo
sabe la interfaz si la sesión es de un postulante o de una empresa, y adónde
la manda al entrar? Conviene resolverlo en el Hito 1 aunque el panel recién
llegue acá.

`src/lib/data/tipos.ts` ya declara `TIPOS_CUENTA` y `TipoCuenta` (`'individual'`
/ `'empresa'`), pero **ningún archivo los usa todavía**: son la mitad hecha de
la deuda 7.5 de `arquitectura.md`. Se dejan a propósito, para que el día que se
mire `cuentas.tipo` el conjunto cerrado ya esté declarado en un solo lugar y no
aparezca un `string` suelto en la navegación.

---

## Hito 7 — Reseñas (RF8)

**Qué entra**

- Publicar reseña de una empresa donde se postuló (RF8.1).
- Listado de reseñas en el perfil público de la empresa, con promedio (RF8.2).
- Respuesta de la empresa a una reseña (RF7.4).

**Terminado cuando** un postulante reseña una empresa donde se postuló, la
reseña aparece en el perfil público, y la empresa puede responderla.

**Ojo con esto.** Verificar que la política corregida en `a9f15a9` hace lo que
promete: intentar reseñar una empresa donde **no** hubo postulación tiene que
fallar.

---

## Pendientes de interfaz

Defectos con arreglo conocido, sin hito propio. Los dos salieron de prototipar
la jerarquía de tarjetas en [`propuestas-diseno-v3.md`](./propuestas-diseno-v3.md).

- **Salto de nivel de encabezado.** `TarjetaVacante.tsx:64` y
  `TarjetaEvento.tsx:84` usan `h3` directo bajo el `h1` de la página, sin `h2`
  intermedio.
- **Contraste insuficiente.** `tinta-tenue` (`#98a2b3`) en
  `postulaciones/page.tsx` da 2.58:1 contra blanco en el texto de los pasos
  futuros, por debajo del 4.5:1 mínimo para texto normal.

---

## Lo que hay que decidir en el camino

Ninguna de estas dos tiene respuesta hoy, y las dos van a frenar el trabajo
cuando se llegue.

> **Resuelto el 2026-09-10:** la contradicción de la edad del SRS. La
> plataforma admite solo mayores de 18 años. La regla ya está en
> `db/schema.sql` como restricción `perfiles_mayor_de_edad`. Ver
> [decisiones.md](./decisiones.md).

**Datos alojados en Estados Unidos.** La base está en `us-east-2`. Antes de
que entre el primer usuario real hay que tener la política de privacidad y los
términos de uso, y revisar el encuadre contra la ley 18.331. Está en
`decisiones.md` como consecuencia pendiente.

**Postulante y empresa en la misma sesión.** El esquema los separa, pero la
aplicación todavía no distingue el tipo de cuenta en ningún lado: ni en la
navegación, ni en las rutas, ni en el layout. Definirlo en el Hito 1 sale
barato; hacerlo en el Hito 6 obliga a rehacer la navegación.

---

## Cómo se trabaja cada hito

1. Rama desde `main`: `feat/<hito>`.
2. El cambio de esquema se edita en `db/schema.sql` o `db/politicas.sql`, y se
   aplica a mano en el SQL Editor de Supabase. Ojo: `create policy` falla con
   `already exists` sobre una base ya migrada; hace falta `drop policy` o
   `alter policy` antes.
3. Los tipos se regeneran después de aplicar el cambio:
   `npx supabase gen types typescript --project-id <PROJECT_ID> > src/types/database.ts`
4. Antes de dar algo por terminado: `npm run lint && npm run typecheck && npm
   run build`, y mirar la pantalla en el navegador.
5. Entrada en [`CHANGELOG.md`](./CHANGELOG.md), siempre.
6. Si el cambio agrega o cambia funciones exportadas, actualizar §5 de
   [`arquitectura.md`](./arquitectura.md).
7. Si hubo alternativas que valga la pena registrar, entrada en
   [`decisiones.md`](./decisiones.md).
