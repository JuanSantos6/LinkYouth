# Correo: recuperación de contraseña y confirmación

Cómo salen los correos de LinkYouth y cómo se vuelve a armar si hay que
reinstalar Supabase en el servidor.

## Recorrido

1. La acción (`pedirRecuperacion`, `signUp`, `updateUser({ email })`) le pide
   el correo a GoTrue.
2. GoTrue lo manda por SMTP (Gmail, `smtp.gmail.com:587`, remitente
   `LinkYouth <linkyouth.uy@gmail.com>`), usando una plantilla en español.
3. El enlace de la plantilla lleva a
   `https://misvcl.tail3c384d.ts.net/auth/callback?token_hash=…&type=…`.
4. `src/app/auth/callback/route.ts` verifica el token con `verifyOtp` y
   redirige: recuperación → `/recuperar/nueva`; confirmación → `/login`;
   cambio de correo → `/perfil`.

## Por qué plantillas propias

El enlace por defecto de GoTrue apunta a `API_EXTERNAL_URL/verify`, que en
este servidor es la API de Supabase en la tailnet (`100.79.143.69:8000`): desde
el correo de cualquier persona no se llega. Con `{{ .TokenHash }}` el enlace
va directo a la aplicación, que sí es pública por el Funnel, y la API de
Supabase sigue sin exponerse.

## Dónde vive cada cosa

| Qué | Dónde |
| --- | --- |
| Plantillas (fuente) | `correo/plantillas/*.html` en este repositorio |
| Plantillas (las que lee GoTrue) | bucket público `correos` de Storage; GoTrue las pide a `http://storage:5000/object/public/correos/<archivo>` dentro de la red de Docker |
| Variables de GoTrue | `~/supabase-project/.env` (`SITE_URL`, `ADDITIONAL_REDIRECT_URLS`, `SMTP_*`) |
| Plantillas y asuntos | `~/supabase-project/docker-compose.yml`, servicio `auth`: `GOTRUE_MAILER_TEMPLATES_*` y `GOTRUE_MAILER_SUBJECTS_*` |
| Credenciales SMTP | `~/.linkyouth-smtp` (600). Nunca en el repositorio |

GoTrue no puede pedirle las plantillas a la aplicación: el firewall no deja
que un contenedor llegue al puerto 3000 del host. Storage está en la misma
red que GoTrue.

## Cambiar una plantilla

```bash
K=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' ~/LinkYouth/.env.local | cut -d= -f2-)
curl -X POST "http://127.0.0.1:8000/storage/v1/object/correos/recuperacion.html" \
  -H "Authorization: Bearer $K" -H "apikey: $K" -H "x-upsert: true" \
  -H "Content-Type: text/html; charset=utf-8" \
  --data-binary @correo/plantillas/recuperacion.html
```

GoTrue las vuelve a leer sin reiniciarse. Variables disponibles:
`{{ .SiteURL }}`, `{{ .TokenHash }}`, `{{ .Email }}`, `{{ .NewEmail }}`.

## Cambiar la configuración de GoTrue

```bash
cd ~/supabase-project
docker compose up -d --no-deps auth   # recrea solo GoTrue
```
