#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this bootstrap as root on the dedicated Telecom Core host." >&2
  exit 1
fi

: "${TELECOM_DOMAIN:?Set TELECOM_DOMAIN to the public WSS hostname, for example telecom.example.com}"
: "${ACME_EMAIL:?Set ACME_EMAIL for certificate expiry notices}"
TELECOM_ROOT="${TELECOM_ROOT:-/opt/magnanimous-telecom}"
ENABLE_UFW="${ENABLE_UFW:-false}"
ADMIN_SSH_CIDR="${ADMIN_SSH_CIDR:-}"

apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates curl git openssl ufw certbot docker.io
if ! docker compose version >/dev/null 2>&1; then
  DEBIAN_FRONTEND=noninteractive apt-get install -y docker-compose-v2
fi
systemctl enable --now docker

install -d -m 0700 "${TELECOM_ROOT}" "${TELECOM_ROOT}/certs"

if [[ "${ENABLE_UFW,,}" =~ ^(1|true|yes|on)$ ]]; then
  if [[ -z "${ADMIN_SSH_CIDR}" ]]; then
    echo "ENABLE_UFW=true requires ADMIN_SSH_CIDR so SSH cannot be locked out." >&2
    exit 1
  fi
  ufw default deny incoming
  ufw default allow outgoing
  ufw allow from "${ADMIN_SSH_CIDR}" to any port 22 proto tcp comment 'Magnanimous Telecom admin SSH'
  ufw allow 80/tcp comment 'ACME HTTP-01 only'
  ufw allow 8089/tcp comment 'Magnanimous Asterisk WSS'
  ufw allow 10000:20000/udp comment 'Magnanimous WebRTC RTP'
  ufw --force enable
else
  echo "UFW rules were not activated. Set ENABLE_UFW=true with ADMIN_SSH_CIDR after confirming remote access."
fi

if [[ ! -s "/etc/letsencrypt/live/${TELECOM_DOMAIN}/fullchain.pem" ]]; then
  certbot certonly --standalone --non-interactive --agree-tos --no-eff-email \
    --email "${ACME_EMAIL}" -d "${TELECOM_DOMAIN}"
fi

echo "Base host is prepared."
echo "Next: clone/update the Magnanimous repository, create telecom-core/.env, then run deploy/sync-public-tls.sh."
echo "Do not set TELECOM_NATIVE_WEBRTC_LIVE=true until the public GitHub WebRTC verification workflow passes."
