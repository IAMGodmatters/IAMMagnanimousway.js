#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this bootstrap as root on the always-on Linux Telecom Core host." >&2
  exit 1
fi

REPO_ROOT="${MAGNANIMOUS_REPO_PATH:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
TELECOM_ROOT="${TELECOM_ROOT:-/opt/magnanimous-telecom}"
TELECOM_ENV_FILE="${TELECOM_ENV_FILE:-${REPO_ROOT}/telecom-core/.env}"
CERT_DIR="${TELECOM_CERTS_DIR:-${TELECOM_ROOT}/certs}"
EDGE_ENV="${TAILSCALE_EDGE_ENV_FILE:-${TELECOM_ROOT}/tailscale-funnel.env}"
ASTERISK_WSS_LOCAL_PORT="${ASTERISK_HTTPS_PORT:-8089}"
TURN_TLS_LOCAL_PORT="${MAGNANIMOUS_TURN_TLS_PORT:-5349}"
CONTROL_API_LOCAL_PORT="${TELECOM_CONTROL_API_PORT:-8080}"
INSTALL_TAILSCALE="${INSTALL_TAILSCALE:-false}"

if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
  echo "Docker with Compose v2 is required before enabling the Tailscale edge." >&2
  exit 1
fi

if ! command -v tailscale >/dev/null 2>&1; then
  if [[ "${INSTALL_TAILSCALE,,}" =~ ^(1|true|yes|on)$ ]]; then
    command -v curl >/dev/null 2>&1 || { echo "curl is required to install Tailscale." >&2; exit 1; }
    curl -fsSL https://tailscale.com/install.sh | sh
  else
    echo "Tailscale is not installed. Install it first or rerun with INSTALL_TAILSCALE=true." >&2
    exit 1
  fi
fi

if [[ ! -f "${TELECOM_ENV_FILE}" ]]; then
  echo "Missing Telecom Core environment file: ${TELECOM_ENV_FILE}" >&2
  echo "Copy telecom-core/.env.owned.example to telecom-core/.env and fill every required secret first." >&2
  exit 1
fi

status_json="$(tailscale status --json 2>/dev/null || true)"
if [[ -z "${status_json}" ]]; then
  echo "Tailscale is not authenticated. Run 'sudo tailscale up' and finish the tailnet sign-in first." >&2
  exit 1
fi

TAILSCALE_FQDN="$(printf '%s' "${status_json}" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(str((d.get("Self") or {}).get("DNSName") or "").rstrip("."))')"
if [[ -z "${TAILSCALE_FQDN}" || "${TAILSCALE_FQDN}" != *.ts.net ]]; then
  echo "Could not resolve this node's trusted *.ts.net DNS name from tailscale status." >&2
  exit 1
fi

install -d -m 0700 "${TELECOM_ROOT}" "${CERT_DIR}"
tmpdir="$(mktemp -d)"
trap 'rm -rf "${tmpdir}"' EXIT

tailscale cert \
  --cert-file="${tmpdir}/fullchain.pem" \
  --key-file="${tmpdir}/privkey.pem" \
  "${TAILSCALE_FQDN}"

install -m 0644 "${tmpdir}/fullchain.pem" "${CERT_DIR}/fullchain.pem"
install -m 0600 "${tmpdir}/privkey.pem" "${CERT_DIR}/privkey.pem"

cat > "${EDGE_ENV}" <<EOF
MAGNANIMOUS_SIP_DOMAIN=${TAILSCALE_FQDN}
TELECOM_PUBLIC_IP=
ASTERISK_WEBRTC_ENABLED=true
ASTERISK_WEBRTC_DYNAMIC_SESSIONS_ENABLED=true
ASTERISK_WEBRTC_PUBLIC_URL=wss://${TAILSCALE_FQDN}/ws
ASTERISK_STUN_SERVER=
MAGNANIMOUS_RELAY_LOCAL_MEDIA=true
MAGNANIMOUS_TURN_URLS=turns:${TAILSCALE_FQDN}:8443?transport=tcp
MAGNANIMOUS_TURN_REALM=${TAILSCALE_FQDN}
MAGNANIMOUS_TURN_FORCE_RELAY=true
ASTERISK_CERTS_DIR=${CERT_DIR}
ASTERISK_TLS_CERT_FILE=/certs/fullchain.pem
ASTERISK_TLS_KEY_FILE=/certs/privkey.pem
MAGNANIMOUS_TURN_TLS_CERT_FILE=/certs/fullchain.pem
MAGNANIMOUS_TURN_TLS_KEY_FILE=/certs/privkey.pem
EOF
chmod 0600 "${EDGE_ENV}"

set -a
# shellcheck disable=SC1090
source "${TELECOM_ENV_FILE}"
# shellcheck disable=SC1090
source "${EDGE_ENV}"
set +a

if [[ -n "${TELECOM_PUBLIC_IP:-}" ]]; then
  echo "Relay-local Funnel mode refuses TELECOM_PUBLIC_IP." >&2
  exit 1
fi
if [[ -n "${ASTERISK_STUN_SERVER:-}" ]]; then
  echo "Relay-local Funnel mode refuses ASTERISK_STUN_SERVER." >&2
  exit 1
fi
if [[ -z "${MAGNANIMOUS_TURN_AUTH_SECRET:-}" ]]; then
  echo "MAGNANIMOUS_TURN_AUTH_SECRET must be set in the protected Telecom Core environment." >&2
  exit 1
fi

(
  cd "${REPO_ROOT}/telecom-core"
  docker compose --profile turn-relay up -d sip-db sip-core asterisk turn-relay control-api
)

tailscale funnel --bg --tcp=443 "tcp://127.0.0.1:${ASTERISK_WSS_LOCAL_PORT}"
tailscale funnel --bg --tcp=8443 "tcp://127.0.0.1:${TURN_TLS_LOCAL_PORT}"
tailscale funnel --bg --https=10000 "http://127.0.0.1:${CONTROL_API_LOCAL_PORT}"

echo "Verifying trusted public TLS through the Funnel edge..."
openssl s_client \
  -connect "${TAILSCALE_FQDN}:443" \
  -servername "${TAILSCALE_FQDN}" \
  -verify_hostname "${TAILSCALE_FQDN}" \
  -verify_return_error \
  </dev/null >/dev/null

openssl s_client \
  -connect "${TAILSCALE_FQDN}:8443" \
  -servername "${TAILSCALE_FQDN}" \
  -verify_hostname "${TAILSCALE_FQDN}" \
  -verify_return_error \
  </dev/null >/dev/null

curl -fsS --connect-timeout 10 --max-time 30 "https://${TAILSCALE_FQDN}:10000/health" >/dev/null

echo
echo "Magnanimous Telecom free TCP/TLS edge is prepared:"
echo "  WSS:       wss://${TAILSCALE_FQDN}/ws"
echo "  TURN/TLS:  turns:${TAILSCALE_FQDN}:8443?transport=tcp"
echo "  Core API:  https://${TAILSCALE_FQDN}:10000"
echo
echo "Keep MAGNANIMOUS_TURN_FORCE_RELAY=true for this topology."
echo "Do not set TELECOM_NATIVE_WEBRTC_LIVE=true until Public Telecom WebRTC Verification passes externally."
tailscale funnel status
