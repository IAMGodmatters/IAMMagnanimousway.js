#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run certificate renewal as root." >&2
  exit 1
fi

REPO_ROOT="${MAGNANIMOUS_REPO_PATH:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
TELECOM_ROOT="${TELECOM_ROOT:-/opt/magnanimous-telecom}"
TELECOM_ENV_FILE="${TELECOM_ENV_FILE:-${REPO_ROOT}/telecom-core/.env}"
CERT_DIR="${TELECOM_CERTS_DIR:-${TELECOM_ROOT}/certs}"
EDGE_ENV="${TAILSCALE_EDGE_ENV_FILE:-${TELECOM_ROOT}/tailscale-funnel.env}"

[[ -f "${TELECOM_ENV_FILE}" ]] || { echo "Missing ${TELECOM_ENV_FILE}" >&2; exit 1; }
[[ -f "${EDGE_ENV}" ]] || { echo "Missing ${EDGE_ENV}; run bootstrap-tailscale-funnel.sh first." >&2; exit 1; }

status_json="$(tailscale status --json)"
TAILSCALE_FQDN="$(printf '%s' "${status_json}" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(str((d.get("Self") or {}).get("DNSName") or "").rstrip("."))')"
[[ "${TAILSCALE_FQDN}" == *.ts.net ]] || { echo "Invalid Tailscale Funnel hostname." >&2; exit 1; }

tmpdir="$(mktemp -d)"
trap 'rm -rf "${tmpdir}"' EXIT
tailscale cert \
  --cert-file="${tmpdir}/fullchain.pem" \
  --key-file="${tmpdir}/privkey.pem" \
  "${TAILSCALE_FQDN}"

install -m 0644 "${tmpdir}/fullchain.pem" "${CERT_DIR}/fullchain.pem"
install -m 0600 "${tmpdir}/privkey.pem" "${CERT_DIR}/privkey.pem"

set -a
# shellcheck disable=SC1090
source "${TELECOM_ENV_FILE}"
# shellcheck disable=SC1090
source "${EDGE_ENV}"
set +a

(
  cd "${REPO_ROOT}/telecom-core"
  docker compose --profile turn-relay restart asterisk turn-relay
)

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

echo "Renewed trusted Tailscale TLS material and restarted Asterisk/coturn."
