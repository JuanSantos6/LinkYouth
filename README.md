# LinkYouth

Plataforma digital de primer empleo, formación y networking para jóvenes.
Conecta a postulantes que buscan su primera experiencia laboral, prácticas
profesionales o instancias de formación con empresas y organizaciones que
publican oportunidades.

> Estado actual: **andamiaje inicial**. El proyecto todavía no implementa
> funcionalidad de negocio. Solo están la estructura base, la configuración
> y una pantalla que verifica la conexión con Supabase.

La especificación funcional completa está en [`docs/`](./docs).

## Stack

| Capa | Tecnología |
| --- | --- |
| Framework | Next.js 15 (App Router) |
| Lenguaje | TypeScript en modo `strict` |
| Estilos | Tailwind CSS 4 |
| Backend | Supabase (base de datos PostgreSQL, auth y storage) |
| Integración Supabase | `@supabase/supabase-js` + `@supabase/ssr` |
| Calidad de código | ESLint + Prettier |

## Estructura del proyecto

```
db/                        Migraciones y scripts SQL (vacío por ahora)
docs/                      Documentación del proyecto y decisiones técnicas
src/
  app/
    layout.tsx             Layout raíz (idioma "es", metadata "LinkYouth")
    page.tsx               Landing provisoria y verificación de conexión
    (auth)/                Rutas de autenticación (vacía por ahora)
    (app)/                 Rutas de la aplicación autenticada (vacía por ahora)
  components/ui/           Componentes de interfaz reutilizables (vacía por ahora)
  lib/supabase/
    client.ts              Cliente de Supabase para el navegador
    server.ts              Cliente de Supabase para Server Components y Route Handlers
  types/
    database.ts            Tipos de la base de datos (se generan desde el esquema)
  middleware.ts            Refresca la sesión de Supabase en cada request
```

## Requisitos previos

- Node.js 20 o superior
- npm
- Un proyecto de Supabase creado (región **us-east-2 / Ohio**)

## Instalación

```bash
npm install
```

## Variables de entorno

1. Copiá el archivo de ejemplo:

   ```bash
   cp .env.local.example .env.local
   ```

2. Completá los valores en `.env.local`:

   | Variable | Dónde se obtiene |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard > Project Settings > API > Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard > Project Settings > API > Project API keys > `anon` `public` |

`.env.local` está ignorado por Git y nunca debe versionarse. La clave `anon`
es pública por diseño: el control de acceso real se hace con Row Level
Security en la base de datos.

## Servidor de desarrollo

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000). La pantalla muestra el
título **LinkYouth** y si la conexión con Supabase funcionó o falló.

## Otros comandos

```bash
npm run build         # Build de producción
npm run start         # Sirve el build de producción
npm run lint          # ESLint
npm run typecheck     # Chequeo de tipos de TypeScript
npm run format        # Formatea con Prettier
npm run format:check  # Verifica el formato sin escribir
```

## Tipos de la base de datos

`src/types/database.ts` es un placeholder. Cuando exista el esquema, los
tipos se regeneran desde Supabase:

```bash
npx supabase gen types typescript --project-id <PROJECT_ID> > src/types/database.ts
```
