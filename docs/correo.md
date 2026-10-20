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

## Correos de aviso (RF6.3, migración 007)

Además de los de GoTrue, la aplicación manda por el mismo SMTP tres correos,
y solo esos: al joven cuando lo **seleccionan** o lo **descartan**, y a la
empresa cuando **recibe una postulación**. El resto de los avisos (revisión,
entrevista, inscripciones, eventos cancelados) queda solo en la campana.

1. Un disparador de la base escribe el aviso en `notificaciones` y, si es
   uno de los tres, el correo en `correos_pendientes`, en la misma
   transacción (`avisar()` en `db/schema.sql`).
2. La acción que causó el cambio (`postularse`, `cambiarEstadoPostulacion`,
   `cambiarEstadoBusqueda` al cerrar) llama a `despacharCorreos()` con
   `after()`: la respuesta no espera a Gmail.
3. `despacharCorreos()` (`src/lib/correo/despachar.ts`) reclama la cola con
   `reclamar_correos_pendientes` (dos despachos a la vez no mandan lo mismo),
   busca el correo de cada cuenta en GoTrue con la clave de servicio y lo
   manda con nodemailer. Lo que falla se reintenta en el próximo despacho,
   hasta 5 veces.
4. No se manda a cuentas dadas de baja ni a dominios reservados
   (`example.com`, `.invalid`, `.test`…): la demo y los e2e los usan. Se
   cierran con `ultimo_error = 'omitido: …'`. La carga de la demo cierra
   también los que generó ella (`omitido: carga de la demo`).

Variables, en `~/LinkYouth/.env.local` (600): `SMTP_HOST`, `SMTP_PORT`,
`SMTP_USER`, `SMTP_PASS` (copiadas de `~/.linkyouth-smtp`),
`CORREO_REMITENTE` y `URL_PUBLICA` (la dirección pública, para los enlaces).
Sin ellas no sale ningún correo y los avisos siguen en la página.

Para mirar la cola:

```bash
docker exec supabase-db psql -U postgres -d postgres -c \
  "select creado_en, asunto, enviado_en, intentos, ultimo_error
   from correos_pendientes order by creado_en desc limit 20"
```

## Cambiar la configuración de GoTrue

```bash
cd ~/supabase-project
docker compose up -d --no-deps auth   # recrea solo GoTrue
```
