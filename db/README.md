# Base de datos

Esquema PostgreSQL de LinkYouth sobre Supabase. Los archivos se aplican en
orden y son idempotentes salvo `migrations/0001_esquema.sql`, que crea los
tipos y las tablas una sola vez.

```
db/
  migrations/
    0001_esquema.sql          Tablas, indices, disparadores
    0002_rls.sql              Row Level Security y funciones de permiso
    0003_vistas_y_matching.sql  Vistas del feed y calculo de compatibilidad
  seed/
    0001_tags.sql             Catalogo de tags (RF2.3.1)
    0002_demo.sql             Empresas, vacantes y eventos de ejemplo
```

## Aplicar el esquema

### Desde el panel de Supabase

1. Entrá a **SQL Editor** en el proyecto.
2. Pegá y ejecutá cada archivo en el orden de arriba.

### Desde la CLI

```bash
npx supabase link --project-ref <PROJECT_ID>
npx supabase db push --file db/migrations/0001_esquema.sql
npx supabase db push --file db/migrations/0002_rls.sql
npx supabase db push --file db/migrations/0003_vistas_y_matching.sql
npx supabase db push --file db/seed/0001_tags.sql
npx supabase db push --file db/seed/0002_demo.sql
```

## Regenerar los tipos

`src/types/database.ts` describe este esquema a mano para que la aplicación
compile sin conexión. Cuando el esquema esté aplicado conviene regenerarlo
desde la base real:

```bash
npx supabase gen types typescript --project-id <PROJECT_ID> > src/types/database.ts
```

## Modelo de datos

| Tabla                    | Requisito    | Rol                                             |
| ------------------------ | ------------ | ----------------------------------------------- |
| `perfiles`               | RF1.1, RF2   | Datos públicos del postulante                   |
| `empresas`               | RF1.2, RF7   | Cuenta institucional                            |
| `tags`                   | RF2.3        | Catálogo único de etiquetas                     |
| `perfil_tags`            | RF2.3        | Tags públicos del postulante, con nivel 1–5     |
| `formaciones`            | RF2.4        | Estudios declarados, con logo de la institución |
| `vacantes`               | RF3.1        | Oportunidades publicadas                        |
| `vacante_tags`           | RF3.1.5      | Tags públicos de la vacante                     |
| `vacante_tags_ocultos`   | RF3.1.6      | Tags privados usados solo para el matching      |
| `postulaciones`          | RF3.6, RF3.7 | Postulación y su estado                         |
| `eventos`, `evento_tags` | RF4.1        | Eventos institucionales                         |
| `inscripciones`          | RF4.5        | Inscripción a un evento                         |
| `notificaciones`         | RF6.1        | Bandeja del postulante                          |

## Decisiones que conviene tener presentes

**Los tags ocultos viven en su propia tabla.** RNF5 exige que nunca lleguen al
postulante, ni siquiera por la API. Con una tabla aparte, la política de
lectura habilita solo a la empresa dueña de la vacante: no hay consulta del
postulante que pueda alcanzarlos por descuido. El puntaje se calcula en
`puntaje_matching()`, que corre con `security definer` y devuelve un número,
nunca las etiquetas.

**`empresas.cuenta_id` es opcional.** Permite cargar organizaciones de
catálogo antes de que exista la cuenta que las opera, que es lo que hace el
seed de demostración. Al registrarse la empresa, se le asocia su usuario.

**El control de acceso vive en la base.** La clave `anon` es pública por
diseño, así que toda regla de acceso está escrita como política de RLS. La
interfaz nunca es la única barrera.

**Los cierres automáticos son disparadores.** RF3.3.2 y RF3.3.3 (cerrar la
vacante al cubrir las posiciones y rechazar lo pendiente) y RF6.2 (notificar
el cambio de estado) se resuelven en la base para que valgan sin importar
desde dónde venga la escritura.
