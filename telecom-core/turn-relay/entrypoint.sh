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

case "$(printf '%s' "${MAGNANIMOUS_RELAY_LOCAL_MEDIA:-false}" | tr '[:upper:]' '[:lower:]')" in
  1|true|yes|on) relay_local_media=yes ;;
  *) relay_local_media=no ;;
esac
if [ "$relay_local_media" = yes ] && [ -n "${TELECOM_PUBLIC_IP:-}" ]; then
  echo "Relay-local media mode must not set TELECOM_PUBLIC_IP." >&2
  exit 1
fi
if [ "$relay_local_media" = yes ]; then
  : "${MAGNANIMOUS_TURN_ALLOWED_PEER_IP:?Relay-local media mode requires MAGNANIMOUS_TURN_ALLOWED_PEER_IP}"
  printf '%s\n' "$MAGNANIMOUS_TURN_ALLOWED_PEER_IP" | awk -F. '
    NF != 4 { exit 1 }
    {
      for (i = 1; i <= 4; i++) {
        if ($i !~ /^[0-9]+$/ || $i < 0 || $i > 255) exit 1
      }
    }
    END { if (NF == 4) exit 0 }
  ' || { echo "MAGNANIMOUS_TURN_ALLOWED_PEER_IP must be a valid IPv4 address." >&2; exit 1; }
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

if [ "$relay_local_media" = yes ]; then
  {
    printf 'relay-ip=%s\n' "$MAGNANIMOUS_TURN_ALLOWED_PEER_IP"
    printf 'allocation-default-address-family=ipv4\n'
    printf 'denied-peer-ip=0.0.0.0-255.255.255.255\n'
    printf 'denied-peer-ip=::-ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff\n'
    printf 'allowed-peer-ip=%s\n' "$MAGNANIMOUS_TURN_ALLOWED_PEER_IP"
  } >> "$config"
fi

if [ -n "${TELECOM_PUBLIC_IP:-}" ]; then
  printf 'external-ip=%s\n' "$TELECOM_PUBLIC_IP" >> "$config"
fi

exec turnserver -c "$config" --log-file=stdout
