# LinkYouth

Plataforma digital de primer empleo, formación y networking para jóvenes.
Conecta a postulantes que buscan su primera experiencia laboral, prácticas
profesionales o instancias de formación con empresas y organizaciones que
publican oportunidades.

> Estado actual: **MVP en construcción**. Están el esquema de base de datos
> completo (RF1 a RF6), la vista del postulante —feed de vacantes y eventos,
> seguimiento de postulaciones y perfil— y el sistema de diseño de la
> interfaz. Falta el módulo de autenticación (RF1) y el panel de empresa (RF7).

La especificación funcional completa está en [`docs/`](./docs).

## Stack

| Capa                 | Tecnología                                |
| -------------------- | ----------------------------------------- |
| Framework            | Next.js 15 (App Router)                   |
| Lenguaje             | TypeScript en modo `strict`               |
| Estilos              | Tailwind CSS 4 con tokens propios         |
| Backend              | Supabase (PostgreSQL, auth y storage)     |
| Integración Supabase | `@supabase/supabase-js` + `@supabase/ssr` |
| Calidad de código    | ESLint + Prettier                         |

## Estructura del proyecto

```
db/
  schema.sql             Tablas, restricciones, funciones y disparadores
  politicas.sql          Row Level Security
  seed.sql               Catálogo de tags y habilidades
docs/                    SRS, arquitectura, decisiones, plan y changelog
src/
  app/
    layout.tsx           Layout raíz: idioma, tipografías, metadata
    globals.css          Sistema de diseño (tokens de color, radio, sombra)
    page.tsx             Entrada: redirige al feed
    (app)/
      layout.tsx         Estructura: navegación fija + contenido
      inicio/            Feed de vacantes y eventos (RF3.5, RF4.4)
      empleos/           Búsqueda y filtros de oportunidades (RF3.5)
      eventos/           Agenda de eventos institucionales (RF4.4)
      postulaciones/     Estado de las postulaciones propias (RF3.7)
      perfil/            Perfil, habilidades y formación (RF2)
  components/
    ui/                  Primitivas: tarjeta, etiqueta, insignia, avatar…
    layout/              Navegación, encabezado, íconos, buscador
    empleos/ eventos/ perfil/   Componentes por dominio
  lib/
    data/                Lectura: consultas, tipos y datos de ejemplo
    acciones/            Escritura: acciones de servidor
    supabase/            Clientes de navegador y de servidor
    formato.ts           Fechas, salarios y etiquetas en es-UY
  types/database.ts      Tipos del esquema
  middleware.ts          Refresca la sesión de Supabase en cada request
.claude/skills/          Skills del proyecto (ver más abajo)
```

## Requisitos previos

- Node.js 20 o superior
- npm
- Un proyecto de Supabase creado (región **us-east-2 / Ohio**)

## Instalación

```bash
npm install
cp .env.local.example .env.local   # y completá los valores
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

**La aplicación levanta sin credenciales.** En ese caso muestra contenido de
demostración con un cartel que lo aclara en pantalla, así se puede trabajar la
interfaz antes de tener la base cargada.

## Variables de entorno

| Variable                        | Dónde se obtiene                                              |
| ------------------------------- | ------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase Dashboard > Project Settings > API > Project URL     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard > Project Settings > API > `anon` `public` |

`.env.local` está ignorado por Git y nunca debe versionarse. La clave `anon` es
pública por diseño: el control de acceso real se hace con Row Level Security en
la base de datos.

## Base de datos

Desde el **SQL Editor** de Supabase se ejecutan estos tres archivos, en este
orden:

```
db/schema.sql      Tablas, restricciones, funciones y disparadores
db/politicas.sql   Row Level Security
db/seed.sql        Catálogo de tags y habilidades
```

`seed.sql` son inserts con `on conflict (nombre) do nothing`: correrlo de
nuevo agrega lo que falte y no toca lo que ya está. **Nunca borra filas de
`tags` ni de `habilidades`** — las tablas puente las referencian
`on delete cascade`, así que un borrado se llevaría los intereses de cada
perfil y los tags ocultos de cada vacante.

Sobre una base donde el esquema ya corrió, `create policy` falla con
`already exists`: hay que hacer `drop policy` o `alter policy` antes.

Después conviene regenerar los tipos:

```bash
npx supabase gen types typescript --project-id <PROJECT_ID> > src/types/database.ts
```

## Skills del proyecto

En `.claude/skills/` viven las decisiones ya tomadas, para que cualquier
persona —o cualquier asistente de IA— trabaje con el mismo criterio en vez de
improvisar uno nuevo por pantalla:

| Skill              | Para qué                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------- |
| `diseno-linkyouth` | Sistema de diseño: paleta, tipografía, elevación, espaciado, componentes, accesibilidad y tono de los textos. |
| `graphify`         | Grafo de conocimiento del repositorio.                                                                        |

## Otros comandos

```bash
npm run build         # Build de producción
npm run start         # Sirve el build de producción
npm run lint          # ESLint
npm run typecheck     # Chequeo de tipos
npm run format        # Formatea con Prettier
npm run format:check  # Verifica el formato sin escribir
```
