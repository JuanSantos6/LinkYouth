# Decisiones técnicas

Registro de las decisiones de arquitectura y tecnología de LinkYouth. Cada
entrada deja asentado qué se decidió, qué alternativas se evaluaron y por qué
se eligió esa opción.

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
