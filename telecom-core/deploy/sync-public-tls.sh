#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this certificate sync as root." >&2
  exit 1
fi

: "${TELECOM_DOMAIN:?Set TELECOM_DOMAIN}"
: "${MAGNANIMOUS_REPO_PATH:?Set MAGNANIMOUS_REPO_PATH to the checked-out repository}"
TELECOM_CERTS_DIR="${TELECOM_CERTS_DIR:-/opt/magnanimous-telecom/certs}"
ENV_FILE="${TELECOM_ENV_FILE:-${MAGNANIMOUS_REPO_PATH}/telecom-core/.env}"
SOURCE="/etc/letsencrypt/live/${TELECOM_DOMAIN}"

for file in fullchain.pem privkey.pem; do
  [[ -r "${SOURCE}/${file}" ]] || { echo "Missing certificate file: ${SOURCE}/${file}" >&2; exit 1; }
done
[[ -f "${ENV_FILE}" ]] || { echo "Missing Telecom Core env file: ${ENV_FILE}" >&2; exit 1; }

install -d -m 0700 "${TELECOM_CERTS_DIR}"
install -m 0644 "${SOURCE}/fullchain.pem" "${TELECOM_CERTS_DIR}/fullchain.pem"
install -m 0600 "${SOURCE}/privkey.pem" "${TELECOM_CERTS_DIR}/privkey.pem"

export ASTERISK_CERTS_DIR="${TELECOM_CERTS_DIR}"
cd "${MAGNANIMOUS_REPO_PATH}/telecom-core"
docker compose --env-file "${ENV_FILE}" up -d --build asterisk control-api

for attempt in $(seq 1 60); do
  if printf '' | openssl s_client -connect "127.0.0.1:8089" -servername "${TELECOM_DOMAIN}" >/tmp/magnanimous-wss-local.txt 2>&1 && \
     docker compose --env-file "${ENV_FILE}" exec -T asterisk asterisk -rx 'http show status' | grep -q '/ws => Asterisk HTTP WebSocket'; then
    echo "Local Telecom Core WSS endpoint is ready."
    exit 0
  fi
  sleep 2
done

docker compose --env-file "${ENV_FILE}" logs --tail=200 asterisk >&2 || true
exit 1
