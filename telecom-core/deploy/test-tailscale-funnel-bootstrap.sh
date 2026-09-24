#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "${tmp}"' EXIT
fake_bin="${tmp}/bin"
mkdir -p "${fake_bin}" "${tmp}/telecom"
log="${tmp}/commands.log"

cat > "${fake_bin}/docker" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
echo "docker $*" >> "$FAKE_LOG"
if [[ "$1" = "compose" && "${2:-}" = "version" ]]; then exit 0; fi
exit 0
EOF

cat > "${fake_bin}/tailscale" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
echo "tailscale $*" >> "$FAKE_LOG"
if [[ "$1" = "status" && "${2:-}" = "--json" ]]; then
  printf '%s\n' '{"Self":{"DNSName":"magnanimous-telecom.tail-test.ts.net."}}'
  exit 0
fi
if [[ "$1" = "cert" ]]; then
  cert=""
  key=""
  for arg in "$@"; do
    case "$arg" in
      --cert-file=*) cert="${arg#--cert-file=}" ;;
      --key-file=*) key="${arg#--key-file=}" ;;
    esac
  done
  [[ -n "$cert" && -n "$key" ]]
  printf '%s\n' 'fake cert' > "$cert"
  printf '%s\n' 'fake key' > "$key"
  exit 0
fi
exit 0
EOF

cat > "${fake_bin}/openssl" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
echo "openssl $*" >> "$FAKE_LOG"
exit 0
EOF

cat > "${fake_bin}/curl" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
echo "curl $*" >> "$FAKE_LOG"
exit 0
EOF

chmod +x "${fake_bin}/docker" "${fake_bin}/tailscale" "${fake_bin}/openssl" "${fake_bin}/curl"

cat > "${tmp}/telecom.env" <<'EOF'
SIP_DB_PASSWORD=ci-db
TELECOM_API_TOKEN=ci-api
TELECOM_WEBHOOK_SECRET=ci-webhook
ASTERISK_ARI_USER=ci-ari
ASTERISK_ARI_PASSWORD=ci-ari-password
MAGNANIMOUS_AI_PASSWORD=ci-ai
MAGNANIMOUS_ADMIN_PASSWORD=ci-admin
MAGNANIMOUS_WEBRTC_PASSWORD=ci-browser
MAGNANIMOUS_TURN_AUTH_SECRET=ci-turn-secret
ASTERISK_HTTPS_PORT=9443
MAGNANIMOUS_TURN_TLS_PORT=9555
TELECOM_CONTROL_API_PORT=9666
EOF

run_env=(
  "PATH=${fake_bin}:${PATH}"
  "FAKE_LOG=${log}"
  "MAGNANIMOUS_REPO_PATH=${REPO_ROOT}"
  "TELECOM_ROOT=${tmp}/telecom"
  "TELECOM_ENV_FILE=${tmp}/telecom.env"
  "TELECOM_CERTS_DIR=${tmp}/telecom/certs"
  "TAILSCALE_EDGE_ENV_FILE=${tmp}/telecom/tailscale-funnel.env"
  "INSTALL_CERT_RENEWAL_TIMER=false"
)

if [[ "${EUID}" -eq 0 ]]; then
  env "${run_env[@]}" bash "${REPO_ROOT}/telecom-core/deploy/bootstrap-tailscale-funnel.sh"
else
  sudo env "${run_env[@]}" bash "${REPO_ROOT}/telecom-core/deploy/bootstrap-tailscale-funnel.sh"
  sudo chown -R "$(id -u):$(id -g)" "${tmp}"
fi

edge="${tmp}/telecom/tailscale-funnel.env"
[[ -f "${edge}" ]]
grep -Fx 'MAGNANIMOUS_SIP_DOMAIN=magnanimous-telecom.tail-test.ts.net' "${edge}"
grep -Fx 'TELECOM_PUBLIC_IP=' "${edge}"
grep -Fx 'ASTERISK_STUN_SERVER=' "${edge}"
grep -Fx 'MAGNANIMOUS_RELAY_LOCAL_MEDIA=true' "${edge}"
grep -Fx 'MAGNANIMOUS_TURN_FORCE_RELAY=true' "${edge}"
grep -Fx 'ASTERISK_WEBRTC_PUBLIC_URL=wss://magnanimous-telecom.tail-test.ts.net/ws' "${edge}"
grep -Fx 'MAGNANIMOUS_TURN_URLS=turns:magnanimous-telecom.tail-test.ts.net:8443?transport=tcp' "${edge}"

grep -F 'tailscale funnel --bg --tcp=443 tcp://127.0.0.1:9443' "${log}"
grep -F 'tailscale funnel --bg --tcp=8443 tcp://127.0.0.1:9555' "${log}"
grep -F 'tailscale funnel --bg --https=10000 http://127.0.0.1:9666' "${log}"
grep -F 'docker compose --profile turn-relay up -d sip-db sip-core asterisk turn-relay control-api' "${log}"

if grep -q 'TELECOM_NATIVE_WEBRTC_LIVE=true' "${edge}"; then
  echo "Bootstrap must never promote the native live flag." >&2
  exit 1
fi

echo "Tailscale Funnel bootstrap simulation passed."
