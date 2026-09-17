#!/bin/sh
set -eu

require_var() {
  name="$1"
  eval "value=\${$name:-}"
  if [ -z "$value" ]; then
    echo "Missing required environment variable: $name" >&2
    exit 1
  fi
}

require_var ASTERISK_ARI_USER
require_var ASTERISK_ARI_PASSWORD
require_var MAGNANIMOUS_AI_PASSWORD
require_var MAGNANIMOUS_ADMIN_PASSWORD
require_var MAGNANIMOUS_SIP_DOMAIN

: "${ASTERISK_SIP_PORT:=5070}"
: "${MAGNANIMOUS_AI_EXTENSION:=9000}"
: "${MAGNANIMOUS_ADMIN_EXTENSION:=1000}"
: "${CARRIER_SIP_ENDPOINT:=pstn-trunk}"
: "${CARRIER_SIP_HOST:=${PSTN_TRUNK_HOST:-}}"
: "${CARRIER_SIP_PORT:=${PSTN_TRUNK_PORT:-5060}}"
: "${CARRIER_SIP_USERNAME:=${PSTN_TRUNK_USERNAME:-}}"
: "${CARRIER_SIP_PASSWORD:=${PSTN_TRUNK_PASSWORD:-}}"
: "${CARRIER_SIP_FROM_DOMAIN:=${PSTN_TRUNK_FROM_DOMAIN:-}}"
: "${TELECOM_PUBLIC_IP:=}"

export ASTERISK_ARI_USER ASTERISK_ARI_PASSWORD ASTERISK_SIP_PORT
export MAGNANIMOUS_SIP_DOMAIN MAGNANIMOUS_AI_EXTENSION MAGNANIMOUS_AI_PASSWORD
export MAGNANIMOUS_ADMIN_EXTENSION MAGNANIMOUS_ADMIN_PASSWORD
export CARRIER_SIP_ENDPOINT CARRIER_SIP_HOST CARRIER_SIP_PORT CARRIER_SIP_USERNAME CARRIER_SIP_PASSWORD CARRIER_SIP_FROM_DOMAIN TELECOM_PUBLIC_IP

# Substitute only deployment-time variables. This deliberately preserves
# Asterisk dialplan variables such as ${EXTEN}, ${CALLERID(num)}, and ${MAG_FROM}.
SUBST_VARS='${ASTERISK_ARI_USER} ${ASTERISK_ARI_PASSWORD} ${ASTERISK_SIP_PORT} ${MAGNANIMOUS_SIP_DOMAIN} ${MAGNANIMOUS_AI_EXTENSION} ${MAGNANIMOUS_AI_PASSWORD} ${MAGNANIMOUS_ADMIN_EXTENSION} ${MAGNANIMOUS_ADMIN_PASSWORD} ${CARRIER_SIP_ENDPOINT} ${CARRIER_SIP_HOST} ${CARRIER_SIP_PORT} ${CARRIER_SIP_USERNAME} ${CARRIER_SIP_PASSWORD} ${CARRIER_SIP_FROM_DOMAIN} ${TELECOM_PUBLIC_IP}'

for template in /etc/asterisk/templates/*.template; do
  [ -f "$template" ] || continue
  target="/etc/asterisk/$(basename "$template" .template)"
  envsubst "$SUBST_VARS" < "$template" > "$target"
  chown root:asterisk "$target"
  chmod 0640 "$target"
done

if [ -n "$CARRIER_SIP_HOST" ]; then
  if [ -z "$CARRIER_SIP_USERNAME" ] || [ -z "$CARRIER_SIP_PASSWORD" ]; then
    echo "Carrier SIP host is set, but carrier credentials are incomplete." >&2
    exit 1
  fi
  envsubst "$SUBST_VARS" < /etc/asterisk/templates/pjsip-trunk.conf.optional > /etc/asterisk/pjsip-trunk.conf
else
  printf '; No external PSTN/SIP interconnect configured yet.\n' > /etc/asterisk/pjsip-trunk.conf
fi
chown root:asterisk /etc/asterisk/pjsip-trunk.conf
chmod 0640 /etc/asterisk/pjsip-trunk.conf

exec "$@"
