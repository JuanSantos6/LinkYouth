#!/usr/bin/env bash
# Alta de la cuenta de prueba, con la misma metadata que manda registrarse().
set -u
U=$(grep -E '^NEXT_PUBLIC_SUPABASE_URL=' .env.local | cut -d= -f2- | tr -d '\r"')
K=$(grep -E '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' .env.local | cut -d= -f2- | tr -d '\r"')

EMAIL="${1:?falta email}"
USUARIO="${2:?falta nombre_usuario}"
PASS='PruebaLinkYouth2026!'

cat > /tmp/alta.json <<EOF
{"email":"$EMAIL","password":"$PASS","data":{
  "nombre":"Prueba","apellido":"Auditoria","fecha_nacimiento":"1995-05-05",
  "pais":"Uruguay","nombre_usuario":"$USUARIO"}}
EOF

echo "--- signup $EMAIL"
curl -s --max-time 30 "$U/auth/v1/signup" -H "apikey: $K" \
  -H "Content-Type: application/json" --data-binary @/tmp/alta.json \
| sed -E 's/"access_token":"[^"]*"/"access_token":"<REDACTADO>"/g; s/"refresh_token":"[^"]*"/"refresh_token":"<REDACTADO>"/g' \
| cut -c1-500
echo
echo "--- hay sesion? (si NO hay, la confirmacion por correo esta activada)"
curl -s --max-time 30 "$U/auth/v1/token?grant_type=password" -H "apikey: $K" \
  -H "Content-Type: application/json" \
  --data-binary "$(printf '{"email":"%s","password":"%s"}' "$EMAIL" "$PASS")" \
| grep -oE '"(access_token|error_code|msg|error_description)":"[^"]*"' \
| sed -E 's/"access_token":"[^"]*"/"access_token": PRESENTE/' | head -5
