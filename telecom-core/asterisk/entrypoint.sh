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

: "${MAGNANIMOUS_AI_EXTENSION:=9000}"
: "${MAGNANIMOUS_ADMIN_EXTENSION:=1000}"
: "${PSTN_TRUNK_PORT:=5060}"
: "${PSTN_TRUNK_HOST:=}"
: "${PSTN_TRUNK_USERNAME:=}"
: "${PSTN_TRUNK_PASSWORD:=}"
: "${PSTN_TRUNK_FROM_DOMAIN:=}"
: "${TELECOM_PUBLIC_IP:=}"

export ASTERISK_ARI_USER ASTERISK_ARI_PASSWORD
export MAGNANIMOUS_AI_EXTENSION MAGNANIMOUS_AI_PASSWORD
export MAGNANIMOUS_ADMIN_EXTENSION MAGNANIMOUS_ADMIN_PASSWORD
export PSTN_TRUNK_HOST PSTN_TRUNK_PORT PSTN_TRUNK_USERNAME PSTN_TRUNK_PASSWORD PSTN_TRUNK_FROM_DOMAIN TELECOM_PUBLIC_IP

for template in /etc/asterisk/templates/*.template; do
  [ -f "$template" ] || continue
  target="/etc/asterisk/$(basename "$template" .template)"
  envsubst < "$template" > "$target"
  chown root:asterisk "$target"
  chmod 0640 "$target"
done

if [ -n "$PSTN_TRUNK_HOST" ]; then
  if [ -z "$PSTN_TRUNK_USERNAME" ] || [ -z "$PSTN_TRUNK_PASSWORD" ]; then
    echo "PSTN_TRUNK_HOST is set, but trunk credentials are incomplete." >&2
    exit 1
  fi
  envsubst < /etc/asterisk/templates/pjsip-trunk.conf.optional > /etc/asterisk/pjsip-trunk.conf
else
  printf '; No PSTN interconnect configured yet.\n' > /etc/asterisk/pjsip-trunk.conf
fi
chown root:asterisk /etc/asterisk/pjsip-trunk.conf
chmod 0640 /etc/asterisk/pjsip-trunk.conf

exec "$@"
