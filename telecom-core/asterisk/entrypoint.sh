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
: "${ASTERISK_HTTPS_PORT:=8089}"
: "${ASTERISK_WEBRTC_ENABLED:=false}"
: "${ASTERISK_TLS_CERT_FILE:=/certs/fullchain.pem}"
: "${ASTERISK_TLS_KEY_FILE:=/certs/privkey.pem}"
: "${MAGNANIMOUS_WEBRTC_EXTENSION:=1100}"
: "${MAGNANIMOUS_WEBRTC_PASSWORD:=}"
: "${MAGNANIMOUS_AI_EXTENSION:=9000}"
: "${MAGNANIMOUS_ADMIN_EXTENSION:=1000}"
: "${CARRIER_SIP_ENDPOINT:=pstn-trunk}"
: "${CARRIER_SIP_HOST:=${PSTN_TRUNK_HOST:-}}"
: "${CARRIER_SIP_PORT:=${PSTN_TRUNK_PORT:-5060}}"
: "${CARRIER_SIP_USERNAME:=${PSTN_TRUNK_USERNAME:-}}"
: "${CARRIER_SIP_PASSWORD:=${PSTN_TRUNK_PASSWORD:-}}"
: "${CARRIER_SIP_FROM_DOMAIN:=${PSTN_TRUNK_FROM_DOMAIN:-}}"
: "${CARRIER_SIP_SECONDARY_ENDPOINT:=}"
: "${CARRIER_SIP_SECONDARY_HOST:=}"
: "${CARRIER_SIP_SECONDARY_PORT:=5060}"
: "${CARRIER_SIP_SECONDARY_USERNAME:=}"
: "${CARRIER_SIP_SECONDARY_PASSWORD:=}"
: "${CARRIER_SIP_SECONDARY_FROM_DOMAIN:=}"
: "${TELECOM_PUBLIC_IP:=}"

case "$(printf '%s' "$ASTERISK_WEBRTC_ENABLED" | tr '[:upper:]' '[:lower:]')" in
  1|true|yes|on) ASTERISK_WEBRTC_ENABLED=yes ;;
  *) ASTERISK_WEBRTC_ENABLED=no ;;
esac
if [ "$ASTERISK_WEBRTC_ENABLED" = yes ]; then
  require_var MAGNANIMOUS_WEBRTC_PASSWORD
  [ -r "$ASTERISK_TLS_CERT_FILE" ] || { echo "WebRTC is enabled but TLS certificate is not readable: $ASTERISK_TLS_CERT_FILE" >&2; exit 1; }
  [ -r "$ASTERISK_TLS_KEY_FILE" ] || { echo "WebRTC is enabled but TLS private key is not readable: $ASTERISK_TLS_KEY_FILE" >&2; exit 1; }
fi

export ASTERISK_ARI_USER ASTERISK_ARI_PASSWORD ASTERISK_SIP_PORT ASTERISK_HTTPS_PORT ASTERISK_WEBRTC_ENABLED ASTERISK_TLS_CERT_FILE ASTERISK_TLS_KEY_FILE
export MAGNANIMOUS_SIP_DOMAIN MAGNANIMOUS_WEBRTC_EXTENSION MAGNANIMOUS_WEBRTC_PASSWORD MAGNANIMOUS_AI_EXTENSION MAGNANIMOUS_AI_PASSWORD
export MAGNANIMOUS_ADMIN_EXTENSION MAGNANIMOUS_ADMIN_PASSWORD
export CARRIER_SIP_ENDPOINT CARRIER_SIP_HOST CARRIER_SIP_PORT CARRIER_SIP_USERNAME CARRIER_SIP_PASSWORD CARRIER_SIP_FROM_DOMAIN
export CARRIER_SIP_SECONDARY_ENDPOINT CARRIER_SIP_SECONDARY_HOST CARRIER_SIP_SECONDARY_PORT CARRIER_SIP_SECONDARY_USERNAME CARRIER_SIP_SECONDARY_PASSWORD CARRIER_SIP_SECONDARY_FROM_DOMAIN TELECOM_PUBLIC_IP

# Substitute only deployment-time variables. This deliberately preserves
# Asterisk dialplan variables such as ${EXTEN}, ${CALLERID(num)}, and ${MAG_FROM}.
SUBST_VARS='${ASTERISK_ARI_USER} ${ASTERISK_ARI_PASSWORD} ${ASTERISK_SIP_PORT} ${ASTERISK_HTTPS_PORT} ${ASTERISK_WEBRTC_ENABLED} ${ASTERISK_TLS_CERT_FILE} ${ASTERISK_TLS_KEY_FILE} ${MAGNANIMOUS_WEBRTC_EXTENSION} ${MAGNANIMOUS_WEBRTC_PASSWORD} ${MAGNANIMOUS_SIP_DOMAIN} ${MAGNANIMOUS_AI_EXTENSION} ${MAGNANIMOUS_AI_PASSWORD} ${MAGNANIMOUS_ADMIN_EXTENSION} ${MAGNANIMOUS_ADMIN_PASSWORD} ${CARRIER_SIP_ENDPOINT} ${CARRIER_SIP_HOST} ${CARRIER_SIP_PORT} ${CARRIER_SIP_USERNAME} ${CARRIER_SIP_PASSWORD} ${CARRIER_SIP_FROM_DOMAIN} ${CARRIER_SIP_SECONDARY_ENDPOINT} ${CARRIER_SIP_SECONDARY_HOST} ${CARRIER_SIP_SECONDARY_PORT} ${CARRIER_SIP_SECONDARY_USERNAME} ${CARRIER_SIP_SECONDARY_PASSWORD} ${CARRIER_SIP_SECONDARY_FROM_DOMAIN} ${TELECOM_PUBLIC_IP}'

for template in /etc/asterisk/templates/*.template; do
  [ -f "$template" ] || continue
  target="/etc/asterisk/$(basename "$template" .template)"
  envsubst "$SUBST_VARS" < "$template" > "$target"
  chown root:asterisk "$target"
  chmod 0640 "$target"
done

if [ "$ASTERISK_WEBRTC_ENABLED" = yes ]; then
  envsubst "$SUBST_VARS" < /etc/asterisk/templates/pjsip-webrtc.conf.optional > /etc/asterisk/pjsip-webrtc.conf
else
  printf '; Native browser WebRTC is disabled until TLS/domain credentials are explicitly configured.\n' > /etc/asterisk/pjsip-webrtc.conf
fi
chown root:asterisk /etc/asterisk/pjsip-webrtc.conf
chmod 0640 /etc/asterisk/pjsip-webrtc.conf

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

if [ -n "$CARRIER_SIP_SECONDARY_HOST" ]; then
  if [ -z "$CARRIER_SIP_SECONDARY_ENDPOINT" ] || [ -z "$CARRIER_SIP_SECONDARY_USERNAME" ] || [ -z "$CARRIER_SIP_SECONDARY_PASSWORD" ]; then
    echo "Secondary carrier SIP host is set, but endpoint or credentials are incomplete." >&2
    exit 1
  fi
  envsubst "$SUBST_VARS" < /etc/asterisk/templates/pjsip-trunk-secondary.conf.optional > /etc/asterisk/pjsip-trunk-secondary.conf
else
  printf '; No secondary external PSTN/SIP interconnect configured.\n' > /etc/asterisk/pjsip-trunk-secondary.conf
fi
chown root:asterisk /etc/asterisk/pjsip-trunk-secondary.conf
chmod 0640 /etc/asterisk/pjsip-trunk-secondary.conf

exec "$@"
