#!/usr/bin/env bash
#
# Comprueba con la clave anónima qué tablas se pueden leer sin sesión.
#
# Dos cosas que hay que tener claras para leer el resultado:
#
# 1. Cuando un rol no tiene ninguna política de `select` que lo habilite,
#    Postgres NO devuelve error: devuelve cero filas, con HTTP 200. La señal de
#    que el arreglo entró es un conteo en cero, no un 401 ni un 403.
#
# 2. Por lo mismo, una tabla vacía y una tabla cerrada se ven idénticas desde
#    afuera. Este script solo puede probar el cierre de las tablas que tenían
#    filas antes. Para las vacías la respuesta autoritativa es `pg_policies`,
#    que se consulta desde el SQL Editor —la sentencia está al final.
#
# Uso:  bash db/verificar-raspado-anonimo.sh

set -u

ENV_FILE="${ENV_FILE:-.env.local}"
if [ ! -f "$ENV_FILE" ]; then
  echo "No encuentro .env.local. Pasalo con ENV_FILE=/ruta/.env.local" >&2
  exit 1
fi

URL=$(grep -E '^NEXT_PUBLIC_SUPABASE_URL=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r"')
ANON=$(grep -E '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r"')

# Filas visibles para `anon`. PostgREST devuelve el total en Content-Range
# cuando se le pide `count=exact`.
filas_visibles() {
  # `-I` hace un HEAD de verdad. Con `-X HEAD` curl se queda esperando un
  # cuerpo que nunca llega y la llamada cuelga hasta el timeout.
  curl -s -I --max-time 20 "$URL/rest/v1/$1?select=*" \
    -H "apikey: $ANON" -H "Prefer: count=exact" \
  | tr -d '\r' | grep -i '^content-range:' | sed -E 's#.*/##'
}

abiertas=0

# sondear <tabla> <tenia_filas_antes: si|no>
sondear() {
  local tabla="$1" tenia="$2" n
  n=$(filas_visibles "$tabla")
  n=${n:-?}

  if [ "$n" != "0" ] && [ "$n" != "?" ]; then
    printf '  %-24s %5s filas visibles   ABIERTA a anon\n' "$tabla" "$n"
    abiertas=$((abiertas + 1))
  elif [ "$tenia" = "si" ]; then
    printf '  %-24s %5s filas visibles   CERRADA (antes tenía filas)\n' "$tabla" "$n"
  else
    printf '  %-24s %5s filas visibles   NO CONCLUYENTE (tabla vacía)\n' "$tabla" "$n"
  fi
}

echo "=== Las siete tablas con datos de personas (CN-002 / S-3)"
sondear perfil_tags           si
sondear perfil_habilidades    si
sondear formaciones           si
sondear vacante_tags_publicos no
sondear vacante_habilidades   no
sondear evento_tags           no
sondear resenias              no

echo
echo "=== Control: esto TIENE que seguir abierto a anon"
echo "  \`registrarse()\` lee perfiles_publicos sin sesión, para avisar que el"
echo "  nombre de usuario ya está tomado. Si se cierra, se rompe el registro."
sondear perfiles_publicos     si

echo
echo "=== Control: los catálogos TIENEN que seguir abiertos a anon"
echo "  /registro lee tags y habilidades sin sesión para ofrecer los intereses."
echo "  Si se cierran, el selector queda vacío y nadie puede registrarse."
catalogos_cerrados=0
for catalogo in tags habilidades; do
  n=$(filas_visibles "$catalogo")
  if [ "${n:-0}" = "0" ] || [ "${n:-?}" = "?" ]; then
    printf '  %-24s %5s filas visibles   CERRADO: se rompe el registro\n' "$catalogo" "${n:-?}"
    catalogos_cerrados=$((catalogos_cerrados + 1))
  else
    printf '  %-24s %5s filas visibles   abierto, como corresponde\n' "$catalogo" "$n"
  fi
done

echo
if [ "$abiertas" -le 1 ]; then
  echo "Las tablas con datos quedaron cerradas. Las vacías no se pueden probar"
  echo "desde acá: para esas, la consulta de abajo."
else
  echo "Todavía hay $abiertas tablas legibles sin sesión."
fi

cat <<'SQL'

=== Verificación autoritativa, para correr en el SQL Editor
    Lista las políticas de select que todavía alcanzan a `anon`.
    Después del arreglo tiene que devolver cero filas.

select tablename, policyname, roles
from pg_policies
where schemaname = 'public'
  and cmd = 'SELECT'
  and tablename in ('perfil_tags','perfil_habilidades','formaciones',
                    'vacante_tags_publicos','vacante_habilidades',
                    'evento_tags','resenias')
  and ('anon' = any(roles) or 'public' = any(roles))
order by tablename;
SQL

[ "$abiertas" -le 1 ] && [ "$catalogos_cerrados" -eq 0 ] || exit 1
