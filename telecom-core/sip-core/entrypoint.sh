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

require_var MAGNANIMOUS_SIP_DOMAIN
require_var SIP_DB_NAME
require_var SIP_DB_USER
require_var SIP_DB_PASSWORD

: "${SIP_DB_HOST:=127.0.0.1}"
: "${SIP_DB_PORT:=5433}"
: "${ASTERISK_SIP_HOST:=127.0.0.1}"
: "${ASTERISK_SIP_PORT:=5070}"
: "${SIP_MAX_CONTACTS:=5}"

export MAGNANIMOUS_SIP_DOMAIN SIP_DB_HOST SIP_DB_PORT SIP_DB_NAME SIP_DB_USER SIP_DB_PASSWORD
export ASTERISK_SIP_HOST ASTERISK_SIP_PORT SIP_MAX_CONTACTS

attempt=0
until pg_isready -h "$SIP_DB_HOST" -p "$SIP_DB_PORT" -U "$SIP_DB_USER" -d "$SIP_DB_NAME" >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 60 ]; then
    echo "Magnanimous SIP database did not become ready." >&2
    exit 1
  fi
  sleep 1
done

# Substitute only deployment variables. Kamailio runtime variables such as $si,
# $sp, $rU, $fU, and $au must remain intact in the generated configuration.
envsubst '${MAGNANIMOUS_SIP_DOMAIN} ${SIP_DB_HOST} ${SIP_DB_PORT} ${SIP_DB_NAME} ${SIP_DB_USER} ${SIP_DB_PASSWORD} ${ASTERISK_SIP_HOST} ${ASTERISK_SIP_PORT} ${SIP_MAX_CONTACTS}' \
  < /etc/kamailio/templates/kamailio.cfg.template \
  > /etc/kamailio/kamailio.cfg

kamailio -c -f /etc/kamailio/kamailio.cfg
exec "$@"
