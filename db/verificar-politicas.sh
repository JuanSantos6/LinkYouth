#!/usr/bin/env bash
#
# Verifica que el tipo de cuenta lo exija la POLÍTICA y no la clave foránea.
#
# La diferencia se lee en el código que devuelve Postgres:
#
#   42501  la política rechazó la fila        <- lo que tiene que pasar
#   23503  la clave foránea rechazó la fila   <- lo que pasaba antes del fix
#   23505  clave duplicada                    <- ya existía, no es un fallo
#
# Va contra PostgREST y no contra la aplicación a propósito. El guardia de
# `src/lib/acciones/sesion.ts` corta antes de llegar a la base, así que por la
# interfaz nunca se ve el código de Postgres. Para saber quién rechaza de
# verdad hay que saltear el guardia y usar el token directo, que es justamente
# lo que haría alguien invocando la Server Action por fuera de la interfaz.
#
# Requiere Git Bash (o cualquier sh con curl) y `.env.local` cargado.
#
# Uso:
#   INDIVIDUAL_EMAIL=... INDIVIDUAL_PASS=... \
#   EMPRESA_EMAIL=...    EMPRESA_PASS=...    \
#     bash db/verificar-politicas.sh
#
# La prueba del camino legítimo (una postulación que SÍ tiene que entrar)
# escribe una fila real y `postulaciones` no se borra nunca por diseño, así que
# está detrás de una bandera aparte:
#
#   CONFIRMAR_ESCRITURA=si  bash db/verificar-politicas.sh

set -u

ENV_FILE="${ENV_FILE:-.env.local}"
[ -f "$ENV_FILE" ] || ENV_FILE=../../../.env.local

if [ ! -f "$ENV_FILE" ]; then
  echo "No encuentro .env.local. Pasalo con ENV_FILE=/ruta/.env.local" >&2
  exit 1
fi

URL=$(grep -E '^NEXT_PUBLIC_SUPABASE_URL=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r"')
ANON=$(grep -E '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r"')

if [ -z "$URL" ] || [ -z "$ANON" ]; then
  echo "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en $ENV_FILE" >&2
  exit 1
fi

ok=0
fallos=0

# --- helpers ----------------------------------------------------------------

# Inicia sesión. Imprime el access_token, o nada si las credenciales fallan.
token_de() {
  curl -s "$URL/auth/v1/token?grant_type=password" \
    -H "apikey: $ANON" -H "Content-Type: application/json" \
    -d "{\"email\":\"$1\",\"password\":\"$2\"}" \
    | grep -oE '"access_token":"[^"]+"' | cut -d'"' -f4
}

uid_de() {
  curl -s "$URL/auth/v1/user" -H "apikey: $ANON" -H "Authorization: Bearer $1" \
    | grep -oE '"id":"[^"]+"' | head -1 | cut -d'"' -f4
}

# Lee sin sesión (las políticas de select dejan a anon ver lo activo).
leer_uno() {
  curl -s "$URL/rest/v1/$1" -H "apikey: $ANON" \
    | grep -oE '"id":"[^"]+"' | head -1 | cut -d'"' -f4
}

codigo_de() {
  echo "$1" | grep -oE '"code":"[0-9A-Za-z]+"' | head -1 | cut -d'"' -f4
}

# intentar <descripción> <código esperado> <tabla> <json> <token>
# "esperado" puede ser un código, o la palabra PASA si la fila debe entrar.
intentar() {
  local desc="$1" esperado="$2" tabla="$3" cuerpo="$4" tok="$5"
  local resp code veredicto

  # El cuerpo va por la entrada estándar y no como argumento de `-d`.
  #
  # En Windows, `curl` suele ser el binario nativo (`/mingw64/bin/curl`), así
  # que los argumentos pasan por una conversión de code page al cruzar de bash
  # al proceso. Un carácter no ASCII —una tilde, por ejemplo— llega corrupto,
  # el cuerpo deja de ser UTF-8 válido y PostgREST contesta PGRST102 («Empty or
  # invalid json») sin llegar nunca a evaluar la política. Eso se lee como si
  # la política no funcionara, cuando en realidad la petición ni llegó.
  #
  # Por la entrada estándar los bytes no tocan argv y llegan intactos.
  resp=$(printf '%s' "$cuerpo" | curl -s "$URL/rest/v1/$tabla" \
          -H "apikey: $ANON" -H "Authorization: Bearer $tok" \
          -H "Content-Type: application/json" \
          -H "Prefer: return=representation" \
          --data-binary @-)
  code=$(codigo_de "$resp")

  if [ "$esperado" = "PASA" ]; then
    if [ -z "$code" ] || [ "$code" = "23505" ]; then
      veredicto="OK"; ok=$((ok + 1))
      [ "$code" = "23505" ] && veredicto="OK (ya existía)"
    else
      veredicto="FALLA"; fallos=$((fallos + 1))
    fi
  elif [ "$code" = "$esperado" ]; then
    veredicto="OK"; ok=$((ok + 1))
  else
    veredicto="FALLA"; fallos=$((fallos + 1))
  fi

  printf '  %-46s esperado=%-5s obtenido=%-6s %s\n' \
    "$desc" "$esperado" "${code:-<sin error>}" "$veredicto"

  if [ "$veredicto" = "FALLA" ]; then
    echo "      respuesta: $(echo "$resp" | cut -c1-160)"
  fi
}

titulo() { echo; echo "=== $1"; }

# --- 0. contexto ------------------------------------------------------------

echo "Proyecto: $(echo "$URL" | sed -E 's#https://([a-z]{6}).*#https://\1…#')"

VACANTE=$(leer_uno "vacantes?select=id&estado=eq.activa&limit=1")
EVENTO=$(leer_uno "eventos?select=id&estado=eq.activo&limit=1")
TAG=$(leer_uno "tags?select=id&limit=1")

echo "Vacante activa: ${VACANTE:-<ninguna>}   Evento activo: ${EVENTO:-<ninguno>}"

# Autoprueba del arnés. Un verificador que nunca dio verde ni rojo no está
# probado: esto lo ejercita sin necesitar ninguna cuenta, usando la propia
# clave anónima como token (es un JWT válido para el rol `anon`, que ninguna
# política de insert habilita, así que la base tiene que contestar 42501).
if [ "${AUTOPRUEBA:-}" = "si" ]; then
  titulo "Autoprueba del arnés (no toca ninguna cuenta)"
  intentar "anon -> postulaciones" 42501 postulaciones \
    '{"vacante_id":"00000000-0000-0000-0000-000000000000","perfil_id":"00000000-0000-0000-0000-000000000000"}' "$ANON"
  intentar "anon -> vacantes" 42501 vacantes \
    '{"empresa_id":"00000000-0000-0000-0000-000000000000","titulo":"x","descripcion":"x","tipo":"empleo","posiciones":1}' "$ANON"
  # Con tilde a propósito: si el cuerpo volviera a pasar por argv, este caso
  # daría PGRST102 en vez de 42501 y la autoprueba se pondría en rojo.
  intentar "anon -> vacantes (titulo con tilde)" 42501 vacantes \
    '{"empresa_id":"00000000-0000-0000-0000-000000000000","titulo":"auditoría","descripcion":"x","tipo":"empleo","posiciones":1}' "$ANON"
  echo "  Control negativo: la misma llamada esperando 23503 tiene que dar FALLA."
  intentar "anon -> postulaciones (esperando el codigo equivocado)" 23503 postulaciones \
    '{"vacante_id":"00000000-0000-0000-0000-000000000000","perfil_id":"00000000-0000-0000-0000-000000000000"}' "$ANON"
  echo
  echo "  Con 3 en verde y 1 en rojo, el arnés distingue los dos códigos."
  exit 0
fi

TOK_I=""; TOK_E=""
if [ -n "${INDIVIDUAL_EMAIL:-}" ]; then
  TOK_I=$(token_de "$INDIVIDUAL_EMAIL" "${INDIVIDUAL_PASS:-}")
  [ -z "$TOK_I" ] && echo "AVISO: no se pudo iniciar sesión con la cuenta individual."
fi
if [ -n "${EMPRESA_EMAIL:-}" ]; then
  TOK_E=$(token_de "$EMPRESA_EMAIL" "${EMPRESA_PASS:-}")
  [ -z "$TOK_E" ] && echo "AVISO: no se pudo iniciar sesión con la cuenta de empresa."
fi

# --- 1. empresa invocando acciones de postulante ----------------------------

if [ -n "$TOK_E" ]; then
  UID_E=$(uid_de "$TOK_E")
  titulo "1. Cuenta de EMPRESA sobre acciones de postulante (uid $UID_E)"
  echo "    Si acá sale 23503 en vez de 42501, la política no está haciendo el"
  echo "    trabajo y lo que frena es la clave foránea, que es el bug original."
  intentar "postularse -> postulaciones" 42501 postulaciones \
    "{\"vacante_id\":\"${VACANTE:-00000000-0000-0000-0000-000000000000}\",\"perfil_id\":\"$UID_E\"}" "$TOK_E"
  intentar "agregarTag -> perfil_tags" 42501 perfil_tags \
    "{\"perfil_id\":\"$UID_E\",\"tag_id\":\"$TAG\"}" "$TOK_E"
  intentar "agregarFormacion -> formaciones" 42501 formaciones \
    "{\"perfil_id\":\"$UID_E\",\"institucion\":\"prueba\",\"titulo\":\"prueba\",\"estado\":\"en_curso\"}" "$TOK_E"
  intentar "inscribirse -> inscripciones_evento" 42501 inscripciones_evento \
    "{\"evento_id\":\"${EVENTO:-00000000-0000-0000-0000-000000000000}\",\"perfil_id\":\"$UID_E\"}" "$TOK_E"
else
  titulo "1. Cuenta de EMPRESA — SALTEADA (sin EMPRESA_EMAIL/EMPRESA_PASS)"
fi

# --- 2. individual sobre acciones de empresa (caso inverso) -----------------

if [ -n "$TOK_I" ]; then
  UID_I=$(uid_de "$TOK_I")
  titulo "2. Cuenta INDIVIDUAL sobre acciones de empresa (uid $UID_I)"
  echo "    Esta es la dirección que la clave foránea NO cubría."
  intentar "publicar vacante -> vacantes" 42501 vacantes \
    "{\"empresa_id\":\"$UID_I\",\"titulo\":\"prueba de auditoría\",\"descripcion\":\"prueba\",\"tipo\":\"empleo\",\"posiciones\":1}" "$TOK_I"
  intentar "publicar evento -> eventos" 42501 eventos \
    "{\"empresa_id\":\"$UID_I\",\"titulo\":\"prueba de auditoría\",\"descripcion\":\"prueba\",\"fecha_hora\":\"2027-01-01T12:00:00Z\"}" "$TOK_I"
else
  titulo "2. Cuenta INDIVIDUAL — SALTEADA (sin INDIVIDUAL_EMAIL/INDIVIDUAL_PASS)"
fi

# --- 3. el camino legítimo sigue andando ------------------------------------

titulo "3. Camino legítimo de la cuenta individual"
if [ -z "$TOK_I" ]; then
  echo "    SALTEADA: faltan las credenciales de la cuenta individual."
elif [ -z "$VACANTE" ]; then
  echo "    SALTEADA: no hay ninguna vacante activa en la base contra la cual"
  echo "    probar. Hace falta una cuenta de empresa que publique una."
elif [ "${CONFIRMAR_ESCRITURA:-}" != "si" ]; then
  echo "    SALTEADA: esta prueba escribe una postulación real, y de"
  echo "    \`postulaciones\` no se borra ninguna fila por diseño (RF3.8)."
  echo "    Para correrla: CONFIRMAR_ESCRITURA=si bash db/verificar-politicas.sh"
  echo "    Después se cancela desde la interfaz, en «Postulaciones»."
else
  intentar "postularse a vacante activa" PASA postulaciones \
    "{\"vacante_id\":\"$VACANTE\",\"perfil_id\":\"$(uid_de "$TOK_I")\"}" "$TOK_I"
fi

# --- resumen ----------------------------------------------------------------

echo
echo "=== Resumen: $ok en verde, $fallos en rojo"
[ "$fallos" -eq 0 ] || exit 1
