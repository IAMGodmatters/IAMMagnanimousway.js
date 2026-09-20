#!/usr/bin/env bash
set -euo pipefail

BUNDLE_DIR="${1:-}"
ENV_SOURCE="${2:-}"
if [ -z "$BUNDLE_DIR" ] || [ -z "$ENV_SOURCE" ]; then
  echo "Usage: $0 <bundle-directory> <production-env-file> [install-directory]" >&2
  exit 2
fi

BUNDLE_DIR="$(cd "$BUNDLE_DIR" && pwd)"
ENV_SOURCE="$(cd "$(dirname "$ENV_SOURCE")" && pwd)/$(basename "$ENV_SOURCE")"
if [ "$(id -u)" -eq 0 ]; then
  DEFAULT_ROOT="/opt/magnanimous"
else
  DEFAULT_ROOT="${HOME}/.local/share/magnanimous"
fi
INSTALL_ROOT="${3:-$DEFAULT_ROOT}"

[ -f "$BUNDLE_DIR/SHA256SUMS" ] || { echo "Missing SHA256SUMS" >&2; exit 1; }
[ -f "$BUNDLE_DIR/magnanimous-images.tar" ] || { echo "Missing magnanimous-images.tar" >&2; exit 1; }
[ -f "$BUNDLE_DIR/RELEASE_TAG" ] || { echo "Missing RELEASE_TAG" >&2; exit 1; }
[ -f "$ENV_SOURCE" ] || { echo "Missing production env file: $ENV_SOURCE" >&2; exit 1; }

(
  cd "$BUNDLE_DIR"
  sha256sum -c SHA256SUMS
)

mkdir -p "$INSTALL_ROOT"
cp "$BUNDLE_DIR/docker-compose.release.yml" "$INSTALL_ROOT/docker-compose.release.yml"
cp "$BUNDLE_DIR/Caddyfile" "$INSTALL_ROOT/Caddyfile"
rm -rf "$INSTALL_ROOT/dns"
cp -R "$BUNDLE_DIR/dns" "$INSTALL_ROOT/dns"
mkdir -p "$INSTALL_ROOT/scripts"
cp "$BUNDLE_DIR/standalone-host-preflight.sh" "$INSTALL_ROOT/scripts/standalone-host-preflight.sh"
cp "$BUNDLE_DIR/backup-runtime.mjs" "$INSTALL_ROOT/scripts/backup-runtime.mjs"
cp "$BUNDLE_DIR/restore-runtime.mjs" "$INSTALL_ROOT/scripts/restore-runtime.mjs"
cp "$BUNDLE_DIR/import-d1-export.mjs" "$INSTALL_ROOT/scripts/import-d1-export.mjs"
cp "$BUNDLE_DIR/verify-data-parity.mjs" "$INSTALL_ROOT/scripts/verify-data-parity.mjs"
cp "$BUNDLE_DIR/prepare-dns-zone.mjs" "$INSTALL_ROOT/scripts/prepare-dns-zone.mjs"
cp "$ENV_SOURCE" "$INSTALL_ROOT/.env"
chmod 600 "$INSTALL_ROOT/.env"
chmod 700 "$INSTALL_ROOT/scripts/standalone-host-preflight.sh"

RELEASE_TAG="$(tr -d '\r\n' < "$BUNDLE_DIR/RELEASE_TAG")"
[ -n "$RELEASE_TAG" ] || { echo "Release tag is empty." >&2; exit 1; }

"$INSTALL_ROOT/scripts/standalone-host-preflight.sh" "$INSTALL_ROOT" "$INSTALL_ROOT/.env" "$INSTALL_ROOT/docker-compose.release.yml"

docker load -i "$BUNDLE_DIR/magnanimous-images.tar"

cd "$INSTALL_ROOT"
MAGNANIMOUS_RELEASE_TAG="$RELEASE_TAG" docker compose --env-file .env -f docker-compose.release.yml up -d

token="$(awk -F= '$1=="MAGNANIMOUS_INTERNAL_SERVICE_TOKEN"{sub(/^[^=]*=/,"");print;exit}' .env | tr -d '\r')"
for attempt in $(seq 1 30); do
  if MAGNANIMOUS_RELEASE_TAG="$RELEASE_TAG" docker compose --env-file .env -f docker-compose.release.yml exec -T magnanimous \
      node -e "fetch('http://127.0.0.1:8788/__magnanimous_runtime/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" >/dev/null 2>&1; then
    break
  fi
  [ "$attempt" -lt 30 ] || { echo "Magnanimous standalone runtime did not become healthy." >&2; exit 1; }
  sleep 2
done

MAGNANIMOUS_RELEASE_TAG="$RELEASE_TAG" docker compose --env-file .env -f docker-compose.release.yml exec -T magnanimous \
  node -e "const t=process.env.MAGNANIMOUS_INTERNAL_SERVICE_TOKEN; fetch('http://127.0.0.1:8788/__magnanimous_runtime/services',{headers:{'x-magnanimous-service-token':t}}).then(async r=>{const x=await r.json(); if(!r.ok||Object.values(x.services||{}).some(v=>v.configured&&!v.ok))process.exit(1); console.log(JSON.stringify(x));}).catch(()=>process.exit(1))"

printf 'Magnanimous standalone release %s installed at %s and health-verified.\n' "$RELEASE_TAG" "$INSTALL_ROOT"
