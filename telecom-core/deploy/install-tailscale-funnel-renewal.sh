#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run the renewal timer installer as root." >&2
  exit 1
fi

REPO_ROOT="${MAGNANIMOUS_REPO_PATH:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
TELECOM_ROOT="${TELECOM_ROOT:-/opt/magnanimous-telecom}"
TELECOM_ENV_FILE="${TELECOM_ENV_FILE:-${REPO_ROOT}/telecom-core/.env}"
EDGE_ENV="${TAILSCALE_EDGE_ENV_FILE:-${TELECOM_ROOT}/tailscale-funnel.env}"
RENEW_SCRIPT="${REPO_ROOT}/telecom-core/deploy/renew-tailscale-funnel-tls.sh"

for value in "${REPO_ROOT}" "${TELECOM_ROOT}" "${TELECOM_ENV_FILE}" "${EDGE_ENV}" "${RENEW_SCRIPT}"; do
  if [[ "${value}" =~ [[:space:]] ]]; then
    echo "Systemd renewal paths must not contain whitespace: ${value}" >&2
    exit 1
  fi
done

[[ -x "${RENEW_SCRIPT}" || -f "${RENEW_SCRIPT}" ]] || { echo "Missing renewal script: ${RENEW_SCRIPT}" >&2; exit 1; }
command -v systemctl >/dev/null 2>&1 || { echo "systemd is required for the automatic renewal timer." >&2; exit 1; }

cat > /etc/systemd/system/magnanimous-tailscale-tls-renew.service <<EOF
[Unit]
Description=Renew Magnanimous Telecom Tailscale Funnel TLS
After=network-online.target tailscaled.service docker.service
Wants=network-online.target

[Service]
Type=oneshot
Environment=MAGNANIMOUS_REPO_PATH=${REPO_ROOT}
Environment=TELECOM_ROOT=${TELECOM_ROOT}
Environment=TELECOM_ENV_FILE=${TELECOM_ENV_FILE}
Environment=TAILSCALE_EDGE_ENV_FILE=${EDGE_ENV}
ExecStart=/usr/bin/env bash ${RENEW_SCRIPT}
EOF

cat > /etc/systemd/system/magnanimous-tailscale-tls-renew.timer <<'EOF'
[Unit]
Description=Check Magnanimous Telecom Tailscale TLS daily

[Timer]
OnBootSec=15min
OnUnitActiveSec=1d
RandomizedDelaySec=1h
Persistent=true

[Install]
WantedBy=timers.target
EOF

chmod 0644 /etc/systemd/system/magnanimous-tailscale-tls-renew.service
chmod 0644 /etc/systemd/system/magnanimous-tailscale-tls-renew.timer
systemctl daemon-reload
systemctl enable --now magnanimous-tailscale-tls-renew.timer
systemctl status --no-pager magnanimous-tailscale-tls-renew.timer || true
