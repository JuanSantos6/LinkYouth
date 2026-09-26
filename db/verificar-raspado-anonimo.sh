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

fallas=0

# cerrada <tabla> <tenia_filas_antes: si|no>
# Tiene que devolver cero filas a `anon`.
cerrada() {
  local tabla="$1" tenia="$2" n
  n=$(filas_visibles "$tabla")
  n=${n:-?}

  if [ "$n" != "0" ] && [ "$n" != "?" ]; then
    printf '  %-24s %5s filas visibles   ABIERTA a anon: tiene que estar cerrada\n' "$tabla" "$n"
    fallas=$((fallas + 1))
  elif [ "$tenia" = "si" ]; then
    printf '  %-24s %5s filas visibles   cerrada (antes tenía filas)\n' "$tabla" "$n"
  else
    printf '  %-24s %5s filas visibles   NO CONCLUYENTE (tabla vacía)\n' "$tabla" "$n"
  fi
}

# abierta <tabla> <tiene_filas_seguro: si|no> <qué se rompe si se cierra>
# Tiene que verse sin sesión. Si la tabla puede estar vacía, cero filas no
# prueba nada: se marca NO CONCLUYENTE y decide `pg_policies`.
abierta() {
  local tabla="$1" llena="$2" rompe="$3" n
  n=$(filas_visibles "$tabla")
  n=${n:-?}

  if [ "$n" != "0" ] && [ "$n" != "?" ]; then
    printf '  %-24s %5s filas visibles   abierta, como corresponde\n' "$tabla" "$n"
  elif [ "$llena" = "si" ]; then
    printf '  %-24s %5s filas visibles   CERRADA: %s\n' "$tabla" "$n" "$rompe"
    fallas=$((fallas + 1))
  else
    printf '  %-24s %5s filas visibles   NO CONCLUYENTE (vacía o cerrada)\n' "$tabla" "$n"
  fi
}

echo "=== Datos de personas: TIENEN que estar cerradas a anon (CN-002 / S-3)"
cerrada perfil_tags           si
cerrada perfil_habilidades    si
cerrada formaciones           si
cerrada vacante_habilidades   no
cerrada resenias              no

echo
echo "=== Tags ocultos: nunca a anon (RF3.1.6, RNF5)"
cerrada vacante_tags_ocultos  no

echo
echo "=== Abiertas a propósito: sin ellas se rompe algo que se usa sin sesión"
abierta tags                  si "/registro no puede ofrecer los intereses"
abierta habilidades           si "/registro no puede ofrecer los intereses"
abierta perfiles_publicos     si "registrarse() no avisa si el usuario ya existe"
abierta vacantes              no "/empleos queda vacío sin sesión"
abierta vacante_tags_publicos no "las vacantes se ven sin decir qué piden"
abierta eventos               no "/eventos queda vacío sin sesión"
abierta evento_tags           no "los eventos se ven sin sus temas"

echo
if [ "$fallas" -eq 0 ]; then
  echo "Todo lo que se pudo medir está como tiene que estar. Para las tablas"
  echo "vacías, la respuesta la dan las dos consultas de abajo."
else
  echo "Hay $fallas tablas en un estado que no corresponde."
fi

cat <<'SQL'

=== Verificación autoritativa, para correr en el SQL Editor

-- 1. Tablas que tienen que estar cerradas a anon. Tiene que devolver cero
--    filas. Las políticas de `vacante_tags_ocultos` no llevan `to`, pero su
--    condición exige ser la empresa dueña: se mira aparte, con `qual`.
select tablename, policyname, roles
from pg_policies
where schemaname = 'public'
  and cmd = 'SELECT'
  and tablename in ('perfil_tags','perfil_habilidades','formaciones',
                    'vacante_habilidades','resenias')
  and ('anon' = any(roles) or 'public' = any(roles))
order by tablename;

-- 2. Tablas que tienen que estar abiertas. Tiene que devolver una fila por
--    tabla, cada una con roles {public}.
select tablename, policyname, roles
from pg_policies
where schemaname = 'public'
  and cmd = 'SELECT'
  and policyname in ('tags_lectura_publica','habilidades_lectura_publica',
                     'vacante_tags_publicos_lectura_publica',
                     'evento_tags_lectura_publica')
order by tablename;
SQL

[ "$fallas" -eq 0 ] || exit 1
