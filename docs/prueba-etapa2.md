# Prueba de la Etapa 2 en el servidor

Guion paso a paso para aplicar la migración 005, verificar las políticas de
seguridad y recorrer el lado de la empresa con cuentas reales. Está pensado
para correrlo **sin tocar los servicios PM2 de LinkYouth (puertos 3000 y
4000) ni los contenedores de Supabase**: la rama se prueba en el puerto 3100.

Tiempo estimado: 40 minutos.

Los comandos suponen el Supabase autoalojado con el contenedor de Postgres
llamado `supabase-db`. Si se llama distinto, `docker ps` lo dice. Todo lo SQL
se puede correr también en Supabase Dashboard > SQL Editor.

---

## 1. Respaldo

```bash
docker exec supabase-db pg_dump -U postgres -d postgres -Fc \
  > ~/respaldo-antes-de-005-$(date +%F).dump
ls -lh ~/respaldo-antes-de-005-*.dump      # tiene que pesar más de 0
```

Para volver atrás, si hiciera falta:
`docker exec -i supabase-db pg_restore -U postgres -d postgres --clean < ~/respaldo-….dump`.

## 2. Comprobación previa

El índice de títulos únicos no se puede crear si ya hay dos búsquedas
activas con el mismo título en la misma empresa. Esta consulta tiene que
volver **vacía**:

```bash
docker exec -i supabase-db psql -U postgres -d postgres <<'SQL'
select empresa_id, lower(btrim(titulo)) as titulo, count(*)
from vacantes where estado = 'activa'
group by 1, 2 having count(*) > 1;
SQL
```

Si devuelve filas, pausá una de cada par desde la base
(`update vacantes set estado = 'cerrada' where id = '…';`) antes de seguir.

## 3. Aplicar la migración 005

Desde la carpeta del repositorio, en la rama `feat/etapa2-empresa`:

```bash
git fetch origin feat/etapa2-empresa
git switch feat/etapa2-empresa      # o un worktree aparte, ver §5
docker exec -i supabase-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
  < db/migraciones/005-etapa2-empresa.sql
```

Tiene que terminar en `COMMIT` sin ningún `ERROR`. Es idempotente: correrla
una segunda vez también termina en `COMMIT` y no cambia nada (sirve para
comprobarlo).

## 4. Verificar las políticas de seguridad (RLS)

```bash
docker exec -i supabase-db psql -U postgres -d postgres \
  < db/verificar-etapa2.sql
```

Esperado: 25 líneas `✓ 01 …` a `✓ 25 …` y al final
`TODO EN ORDEN: 25 verificaciones`. Si algo no se cumple, se corta con
`FALLA NN: …` y dice cuál. **No deja datos**: corre en una transacción que
termina en `ROLLBACK`.

Qué comprueba, actuando como cada usuario con su sesión simulada igual que la
API de Supabase:

| N.º | Regla |
| --- | --- |
| 01 | Sin sesión se ven las búsquedas activas y no las pausadas |
| 02 | Sin sesión no se puede pedir la lista de candidatos |
| 03 | Un joven se postula a una búsqueda activa |
| 04 | Un joven no se puede postular a una búsqueda pausada |
| 05 | Un joven no puede crear búsquedas |
| 06 | Un joven no ve los tags ocultos (RF3.1.6, RNF5) |
| 07 | Un joven no obtiene datos de nadie con la función de candidatos |
| 08 | Un joven no puede cambiar su postulación salvo para cancelarla |
| 09 | Inscribirse solo a eventos activos y futuros |
| 10 | Un joven no ve las postulaciones de otro |
| 11 | La empresa B no ve búsquedas pausadas, postulantes, tags ocultos, habilidades ni inscriptos de A |
| 12 | La empresa B no edita, borra ni crea nada a nombre de A |
| 13 | La empresa A ve sus búsquedas, incluida la pausada, y no las pausadas de B |
| 14 | La empresa A ve los tags ocultos de sus búsquedas |
| 15 | La empresa A obtiene los datos de sus dos postulantes y de nadie más |
| 16 | La función de candidatos no expone la fecha de nacimiento |
| 17 | La empresa A ve quién se inscribió a sus eventos |
| 18 | Se borra una búsqueda sin postulaciones; con postulaciones, no |
| 19 | No se repite el título entre búsquedas activas de la misma empresa (RF3.1.2) |
| 20 | La empresa pasa una postulación a entrevista y no puede volverla a nueva |
| 21 | La empresa edita su perfil y la base rechaza un sitio web inválido |
| 22 | Al cubrir las posiciones la búsqueda se cierra y las pendientes pasan a rechazada (RF3.3.2, RF3.3.3) |
| 23 | El aviso al joven nombra la búsqueda, usa palabras y enlaza a /postulaciones |
| 24 | Cancelar un evento avisa a quienes estaban inscriptos (RF4.3.2) |
| 25 | Un joven solo ve sus propios avisos |

Consultas sueltas para mirar a mano, si se quiere:

```sql
-- Las políticas nuevas o cambiadas por 005
select tablename, policyname, cmd, roles
from pg_policies
where policyname in (
  'vacantes_borro_las_mias_sin_postulaciones',
  'postulaciones_transiciones_permitidas',
  'inscripciones_me_inscribo_yo')
order by 1;

-- La función de candidatos: solo `authenticated` puede ejecutarla
select grantee, privilege_type
from information_schema.routine_privileges
where routine_name = 'candidatos_de_mi_empresa';
-- Esperado: aparece authenticated; no aparecen anon ni PUBLIC.

-- Los tres disparadores nuevos
select tgname from pg_trigger
where tgname in ('postulaciones_cerrar_vacante_al_cubrir',
                 'vacantes_rechazar_pendientes_al_cerrar',
                 'eventos_notificar_cancelacion');

-- Sin sesión no se leen los tags ocultos (tiene que dar 0 filas)
begin;
set local role anon;
select count(*) from vacante_tags_ocultos;
rollback;
```

## 5. Levantar la rama en el puerto 3100

Sin tocar PM2. Lo más limpio es un worktree aparte, así la carpeta que usa
PM2 queda como está:

```bash
cd ~/LinkYouth                                   # la carpeta de siempre
git worktree add ../LinkYouth-etapa2 feat/etapa2-empresa
cd ../LinkYouth-etapa2
cp ../LinkYouth/.env.local .env.local            # mismas credenciales
npm ci
npm run build
npx next start -p 3100
```

Abrí `http://<servidor>:3100`. Al terminar: `Ctrl+C`, y
`git worktree remove ../LinkYouth-etapa2`.

> Mientras la migración 005 esté aplicada, la versión de `main` en el puerto
> 3000 sigue funcionando: las columnas nuevas son opcionales y ninguna
> pantalla vieja depende de lo que cambió. Lo único que verá distinto es el
> texto de los avisos nuevos.

## 6. Recorrido de punta a punta

Cuentas de `docs/usuarios-prueba.md`: empresa **Nube UY** (`rrhh@nube-uy.dev`)
y **Sur Logística** (`talento@surlogistica.dev`), jóvenes **Sofía**
(`sofia.prueba@linkyouth.dev`) y **Mateo** (`mateo.prueba@linkyouth.dev`).

**Todo lo que se cree lleva «[E2E]» al principio del título**: es lo que
usa el script de limpieza del paso 7.

Tené abierta la consola del navegador (F12) y la terminal del paso 5: al
final de cada bloque, ninguna de las dos tiene que mostrar errores.

### A. Empresa: perfil y navegación (Nube UY)

1. Entrá como Nube UY. Llegás a `/empresa`: el panel con tus búsquedas,
   postulantes nuevos y próximos eventos. No dice «Contenido de
   demostración».
2. El menú tiene Panel, Mis búsquedas, Mis eventos y Candidatos. **No** hay
   «Cómo funciona» ni en el menú ni en el pie. Escribí `/como-funciona` en la
   barra: te devuelve a `/empresa`.
3. En el pie no hay enlaces a GitHub; abajo está el correo de contacto.
4. Menú de la cuenta > Perfil de la empresa. Anotá el RUT y el sitio actuales.
   Poné como sitio `nube-uy.dev` y guardá: queda `https://nube-uy.dev`.
5. Cambiá el RUT por el de Sur Logística (míralo en su perfil o en la base):
   el error aparece **sobre el campo RUT** y no se guarda. Volvé a poner el
   RUT original.

### B. Empresa: publicar una búsqueda

1. Mis búsquedas > Publicar búsqueda. Mandá el formulario vacío: el navegador
   marca los campos obligatorios.
2. Completá título «[E2E] Analista de datos junior», tipo Empleo, modalidad
   Híbrida, 1 posición, ubicación «Montevideo», una descripción de una línea
   corta (menos de 40 caracteres) y ninguna habilidad. Publicá: vuelve con
   «Revisá los campos marcados», el error al lado de la descripción y de las
   habilidades, **y lo que escribiste sigue ahí**.
3. Completá la descripción, elegí las habilidades SQL y Planillas de cálculo,
   un área, y un interés clave (por ejemplo «Datos»). Publicá: llegás al
   detalle con «la búsqueda está publicada».
4. Publicá otra búsqueda con el **mismo título**: el error de título repetido
   aparece sobre el campo (RF3.1.2).
5. Editá la búsqueda: cambiá la ubicación y guardá. El cambio se ve.

### C. Joven: ver y postularse (Sofía)

1. En otra ventana privada, entrá como Sofía. En Empleos aparece «[E2E]
   Analista de datos junior», con «Híbrida» y la ubicación.
2. En el detalle **no** aparece el interés clave que cargó la empresa (los
   tags ocultos no llegan al joven, RF3.1.6).
3. Postulate.

### D. Empresa: postulantes y estados (Nube UY)

1. El panel muestra 1 postulante nuevo. Si Sofía declara SQL o Planillas, la
   ves en «Postulantes recomendados».
2. Entrá a la búsqueda: Sofía aparece con «Nueva», «Declara N de 2
   habilidades pedidas» y sus habilidades en violeta, no en turquesa.
3. Abrí su ficha: nombre, bio, habilidades declaradas, intereses y formación.
4. «Pasar a revisión». Después «Citar a entrevista».
5. En la ventana de Sofía: Avisos dice «Tu postulación a «[E2E] Analista de
   datos junior» pasó a la etapa de entrevista.» y Postulaciones muestra
   «Entrevista».
6. Como empresa, «Seleccionar» > aparece la confirmación > «Sí,
   seleccionar». Como la búsqueda tenía 1 posición, **se cierra sola**
   (RF3.3.2): en Mis búsquedas figura «Cerrada». Sofía recibe «fue aceptada».

### E. Empresa: pausar, cerrar y eliminar

1. Publicá «[E2E] Pasantía de soporte» (cualquier dato válido). Pausala: el
   joven ya no la ve en Empleos. Reactivala: vuelve a verse.
2. Con Mateo, postulate. Como empresa, cerrala: la confirmación explica qué
   pasa. Mateo recibe «no fue seleccionada» (RF3.3.3).
3. Publicá «[E2E] Para borrar» y eliminala sin que nadie se postule: vuelve
   al listado con «La búsqueda se eliminó». En una búsqueda con
   postulaciones, «Eliminar» no aparece.

### F. Empresa: eventos

1. Mis eventos > Crear evento. Probá una fecha pasada: error sobre la fecha.
   Probá latitud sin longitud: error sobre las coordenadas.
2. Creá «[E2E] Charla de datos» para dentro de una semana, con dirección
   «Av. 18 de Julio 1453, Montevideo», latitud `-34,9037`, longitud
   `-56,1786` y una imagen JPG de menos de 2 MB.
3. En el detalle, «Ver en el mapa» abre OpenStreetMap en el punto.
4. Como Sofía, en Eventos aparece con la dirección y «Ver en el mapa».
   Inscribite.
5. Como empresa, el evento muestra 1 inscripto con su nombre.
6. Cancelá el evento (con confirmación). Sofía recibe «Se canceló el evento
   «[E2E] Charla de datos».» y el evento ya no está en su lista.

### G. Candidatos y reseñas

1. Candidatos lista a Sofía y Mateo con sus intereses; elegí un interés y la
   lista se achica; «Quitar filtros» la restablece.
2. Reseñas recibidas: si no hay, el estado vacío lo explica.

### H. Aislamiento entre empresas (Sur Logística)

1. Entrá como Sur Logística. En Mis búsquedas **no** aparecen las «[E2E]» de
   Nube UY.
2. Pegá en la barra la dirección del detalle de una búsqueda de Nube UY
   (`/empresa/busquedas/<id>`): «No encontramos lo que buscabas».
3. Lo mismo con `/empresa/eventos/<id>` del evento de Nube UY.
4. Como Sofía, escribí `/empresa`: te devuelve a `/inicio`.

### I. Pantallas

En un teléfono (o con el modo responsive del navegador a 390 px) y con el
tema oscuro, recorré el panel, una búsqueda, la ficha de un postulante y un
evento: nada se sale de la pantalla y todo se lee.

## 7. Limpiar

1. Volvé el perfil de Nube UY a como estaba (RUT y sitio que anotaste en A.4).
2. Borrá lo creado:

```bash
docker exec -i supabase-db psql -U postgres -d postgres \
  < db/borrar-datos-e2e.sql
```

Primero muestra la lista de lo que borra; al final, las tres cuentas en 0.
La imagen del evento queda en Storage (`avatars/eventos/<id>`); se puede
borrar desde Supabase Dashboard > Storage si se quiere.

3. `git worktree remove ../LinkYouth-etapa2`.

## 8. Qué anotar

Si algo no sale como dice el guion: el paso (por ejemplo «D.6»), qué se
esperaba, qué pasó, y lo que muestre la consola del navegador o la terminal.
