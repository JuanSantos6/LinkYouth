# Usuarios de prueba

Los crea `db/seed-usuarios-prueba.sql`. Se ejecuta en el **SQL Editor** de
Supabase, después de `schema.sql`, `politicas.sql` y `seed.sql`.

> **Estas contraseñas son públicas.** Están en este archivo y en el historial
> de git: cualquiera que lea el repositorio entra con ellas. Sirve mientras la
> base tenga solo datos inventados. En cuanto haya una persona real
> registrada, hay que borrar estas cuentas del proyecto.

## Jóvenes — contraseña `LinkYouth2026!`

| Nombre           | Usuario            | Correo                           | Perfil                         |
| ---------------- | ------------------ | -------------------------------- | ------------------------------ |
| Sofía Methol     | `sofia_prueba`     | `sofia.prueba@linkyouth.dev`     | Ingeniería en Computación      |
| Mateo Silveira   | `mateo_prueba`     | `mateo.prueba@linkyouth.dev`     | Front-end, Jóvenes a Programar |
| Valentina Rocha  | `valentina_prueba` | `valentina.prueba@linkyouth.dev` | Contabilidad                   |
| Joaquín Barreiro | `joaquin_prueba`   | `joaquin.prueba@linkyouth.dev`   | Atención al público → soporte  |
| Camila Ferreira  | `camila_prueba`    | `camila.prueba@linkyouth.dev`    | Diseño de Comunicación Visual  |

Entran a `/inicio`.

## Empresas — contraseña `Empresa2026!`

| Razón social    | Correo                        | Rubro                 |
| --------------- | ----------------------------- | --------------------- |
| Nube UY         | `rrhh@nube-uy.dev`            | Tecnología            |
| Sur Logística   | `talento@surlogistica.dev`    | Logística y transporte|
| Clínica Omega   | `personas@clinicaomega.dev`   | Salud                 |
| Granja La Flor  | `empleos@granjalaflor.dev`    | Agroindustria         |
| Estudio Brecha  | `rrhh@estudiobrecha.dev`      | Diseño y comunicación |

Entran a `/empresa`.

## Cómo se entra

El formulario de `/login` pide **correo**, no nombre de usuario: Supabase Auth
autentica contra el correo. El nombre de usuario es del perfil de LinkYouth y
sirve para identificar a la persona dentro de la plataforma, no para entrar.

El destino después de entrar lo decide `src/middleware.ts` leyendo
`cuentas.tipo` en la base — no la sesión, que la persona puede editar.

## Qué trae cada cuenta

Los cinco perfiles tienen cinco intereses cada uno (el mínimo de RF1.1.11),
habilidades declaradas y una formación. Sin eso la compatibilidad de toda
vacante daría 0 % y el feed se vería roto sin estarlo.

Los nombres de intereses y habilidades del script tienen que coincidir
**exactamente** con los de `db/seed.sql`: el `join` es por nombre, así que un
acento de más no da error, simplemente no inserta nada.
