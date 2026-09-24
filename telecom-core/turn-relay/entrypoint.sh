#!/bin/sh
set -eu

: "${MAGNANIMOUS_TURN_REALM:?MAGNANIMOUS_TURN_REALM is required}"
: "${MAGNANIMOUS_TURN_AUTH_SECRET:?MAGNANIMOUS_TURN_AUTH_SECRET is required}"
: "${MAGNANIMOUS_TURN_TLS_CERT_FILE:?MAGNANIMOUS_TURN_TLS_CERT_FILE is required}"
: "${MAGNANIMOUS_TURN_TLS_KEY_FILE:?MAGNANIMOUS_TURN_TLS_KEY_FILE is required}"

if [ ! -r "$MAGNANIMOUS_TURN_TLS_CERT_FILE" ]; then
  echo "TURN TLS certificate is not readable: $MAGNANIMOUS_TURN_TLS_CERT_FILE" >&2
  exit 1
fi
if [ ! -r "$MAGNANIMOUS_TURN_TLS_KEY_FILE" ]; then
  echo "TURN TLS private key is not readable: $MAGNANIMOUS_TURN_TLS_KEY_FILE" >&2
  exit 1
fi

listen_port="${MAGNANIMOUS_TURN_PORT:-3478}"
tls_port="${MAGNANIMOUS_TURN_TLS_PORT:-5349}"
min_port="${MAGNANIMOUS_TURN_MIN_PORT:-49160}"
max_port="${MAGNANIMOUS_TURN_MAX_PORT:-49260}"

case "$listen_port:$tls_port:$min_port:$max_port" in
  *[!0-9:]*)
    echo "TURN ports must be numeric." >&2
    exit 1
    ;;
esac

if [ "$min_port" -gt "$max_port" ]; then
  echo "MAGNANIMOUS_TURN_MIN_PORT must be <= MAGNANIMOUS_TURN_MAX_PORT." >&2
  exit 1
fi

config=/tmp/magnanimous-turnserver.conf
umask 077
cat > "$config" <<EOF
listening-port=$listen_port
tls-listening-port=$tls_port
min-port=$min_port
max-port=$max_port
realm=$MAGNANIMOUS_TURN_REALM
server-name=$MAGNANIMOUS_TURN_REALM
use-auth-secret
static-auth-secret=$MAGNANIMOUS_TURN_AUTH_SECRET
fingerprint
stale-nonce
no-udp
no-tcp-relay
no-multicast-peers
no-loopback-peers
cert=$MAGNANIMOUS_TURN_TLS_CERT_FILE
pkey=$MAGNANIMOUS_TURN_TLS_KEY_FILE
EOF

if [ -n "${TELECOM_PUBLIC_IP:-}" ]; then
  printf 'external-ip=%s\n' "$TELECOM_PUBLIC_IP" >> "$config"
fi

exec turnserver -c "$config" --log-file=stdout
