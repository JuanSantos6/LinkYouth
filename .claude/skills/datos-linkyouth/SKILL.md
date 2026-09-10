---
name: datos-linkyouth
description: "Modelo de datos de LinkYouth sobre Supabase: esquema, Row Level Security, tipos, consultas y acciones de servidor. Usar antes de tocar cualquier cosa que lea o escriba datos en este proyecto: agregar o cambiar una tabla o columna, escribir una migración, definir permisos, crear una consulta o una acción, o regenerar src/types/database.ts. Disparadores: base de datos, Supabase, migración, SQL, RLS, políticas, tags ocultos, matching, postulaciones, vacantes, eventos, perfiles."
---

# Datos de LinkYouth

El esquema vive en `db/migrations/` y está documentado en `db/README.md`.
Antes de cambiar nada, leelo: el modelo sigue los requisitos de
`docs/01_preamble.md` y cada tabla apunta a un RF concreto.

## Las cuatro reglas del proyecto

1. **El control de acceso vive en la base.** La clave `anon` de Supabase es
   pública por diseño. Toda regla se escribe como política de RLS en
   `db/migrations/0002_rls.sql`. Una comprobación en el componente no es un
   permiso: es una comodidad visual.

2. **Los tags ocultos no salen nunca.** RF3.1.6 y RNF5. Viven en su propia
   tabla, `vacante_tags_ocultos`, sin política de lectura para postulantes.
   El único camino a ellos es `puntaje_matching()`, que corre con
   `security definer` y devuelve un número, jamás las etiquetas. **No agregues
   una consulta, una vista ni un `select` que los alcance desde la vista del
   postulante**, por conveniente que parezca.

3. **Español, sin tildes, en minúscula.** Tablas y columnas: `perfiles`,
   `razon_social`, `creado_en`. Toda tabla lleva `creado_en`; las que se
   editan, `actualizado_en` con su disparador.

4. **Los tipos siguen al esquema, no al revés.** Si cambiás una tabla,
   actualizá `src/types/database.ts` en el mismo commit, o regeneralo:
   `npx supabase gen types typescript --project-id <ID> > src/types/database.ts`.

## Agregar o cambiar una tabla

1. Escribí una migración nueva, numerada, en `db/migrations/`. **Nunca edites
   una migración ya aplicada**: la base de otra persona ya la corrió.
2. Habilitá RLS y escribí sus políticas en la misma migración. Una tabla con
   RLS habilitada y sin políticas es una tabla que nadie puede leer; una tabla
   sin RLS es una tabla que puede leer cualquiera. Las dos son errores.
3. Actualizá `src/types/database.ts`.
4. Actualizá la tabla de `db/README.md` con el RF que cubre.
5. Si hace falta contenido de ejemplo, agregalo a `db/seed/` de forma
   idempotente (`on conflict`, o `where not exists`).

## Leer datos

Toda lectura pasa por `src/lib/data/consultas.ts` y devuelve un `Resultado`:

```ts
type Resultado<T> = {
  datos: T;
  origen: "supabase" | "ejemplo";
  error?: string;
};
```

Cuando faltan credenciales, la consulta falla o la tabla está vacía, se
responde con los datos de `src/lib/data/ejemplos.ts` y `origen: "ejemplo"`, y
la pantalla lo anuncia con `AvisoOrigen`. Esto permite trabajar la interfaz sin
base cargada **sin que eso se confunda jamás con datos reales**.

Los datos de ejemplo tienen exactamente la forma de las vistas
`vacantes_feed` y `eventos_agenda`. Si cambia una vista, cambian los dos.

Reglas de consulta:

- Los Server Components llaman a estas funciones; no crean su propio cliente.
- `createClient()` devuelve `null` sin credenciales. Manejá ese caso, no lo
  fuerces con `!`.
- Evitá `select` anidados con relaciones: hacé consultas simples y componé el
  resultado en TypeScript. Es más legible y no depende de metadatos de tipos.

## Escribir datos

Toda escritura es una acción de servidor en `src/lib/acciones/`, con
`"use server"`, y devuelve `EstadoAccion`. Patrón:

1. Leer y validar los campos del `FormData`. La validación corre en el
   servidor aunque el campo ya tenga `maxLength`.
2. `createClient()`; si es `null`, devolver `SIN_SESION`.
3. `supabase.auth.getUser()`; sin usuario, `SIN_SESION`.
4. Escribir. La RLS es la que decide de verdad: la acción no reemplaza la
   política, la acompaña.
5. `revalidatePath()` de las rutas afectadas.
6. Devolver un mensaje en español, entendible por quien lo va a leer. El
   código `23505` de Postgres se traduce a «Ya te habías postulado a esta
   búsqueda», no se muestra crudo.

## Lo que resuelve la base y no hay que reimplementar

- **RF3.3.2 y RF3.3.3**: al cubrirse las posiciones, la vacante se cierra sola
  y las postulaciones pendientes pasan a rechazadas (disparador
  `postulaciones_cierran_vacante`).
- **RF6.2**: cada cambio de estado de una postulación crea la notificación
  (disparador `postulaciones_notifican`).
- **RF3.6.2**: una sola postulación por persona y vacante (restricción única).
- **RF3.1.2**: el título no se repite entre las vacantes activas de una
  empresa (índice único parcial).

Si te encontrás escribiendo esa lógica en TypeScript, ya está en la base:
duplicarla es garantizar que en algún momento las dos versiones difieran.
