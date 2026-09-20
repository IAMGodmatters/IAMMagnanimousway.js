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

RELEASE_TAG="$(tr -d '\r\n' < "$BUNDLE_DIR/RELEASE_TAG")"
[ -n "$RELEASE_TAG" ] || { echo "Release tag is empty." >&2; exit 1; }

mkdir -p "$INSTALL_ROOT"
chmod 700 "$INSTALL_ROOT"

previous_release_tag=""
if [ -f "$INSTALL_ROOT/.env" ]; then
  previous_release_tag="$(awk -F= '$1=="MAGNANIMOUS_RELEASE_TAG"{sub(/^[^=]*=/,"");print;exit}' "$INSTALL_ROOT/.env" | tr -d '\r')"
fi
if [ -n "$previous_release_tag" ] && [ "$previous_release_tag" != "$RELEASE_TAG" ]; then
  printf '%s\n' "$previous_release_tag" > "$INSTALL_ROOT/PREVIOUS_RELEASE_TAG"
  chmod 600 "$INSTALL_ROOT/PREVIOUS_RELEASE_TAG"
fi

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
cp "$BUNDLE_DIR/RELEASE_TAG" "$INSTALL_ROOT/RELEASE_TAG"
[ ! -f "$BUNDLE_DIR/SOURCE_COMMIT" ] || cp "$BUNDLE_DIR/SOURCE_COMMIT" "$INSTALL_ROOT/SOURCE_COMMIT"

if [ "$ENV_SOURCE" != "$INSTALL_ROOT/.env" ]; then
  cp "$ENV_SOURCE" "$INSTALL_ROOT/.env"
fi
chmod 600 "$INSTALL_ROOT/.env"
chmod 700 "$INSTALL_ROOT/scripts/standalone-host-preflight.sh"

upsert_env_key() {
  local file="$1"
  local key="$2"
  local value="$3"
  local tmp
  tmp="$(mktemp "$INSTALL_ROOT/.env.XXXXXX")"
  awk -F= -v key="$key" '$1 != key { print }' "$file" > "$tmp"
  printf '%s=%s\n' "$key" "$value" >> "$tmp"
  chmod 600 "$tmp"
  mv "$tmp" "$file"
}

# Persist the exact proven image set so future compose operations and host
# restarts do not silently fall back to the non-existent "local" release tag.
upsert_env_key "$INSTALL_ROOT/.env" "MAGNANIMOUS_RELEASE_TAG" "$RELEASE_TAG"

"$INSTALL_ROOT/scripts/standalone-host-preflight.sh" "$INSTALL_ROOT" "$INSTALL_ROOT/.env" "$INSTALL_ROOT/docker-compose.release.yml"

docker load -i "$BUNDLE_DIR/magnanimous-images.tar"

cd "$INSTALL_ROOT"
docker compose --env-file .env -f docker-compose.release.yml up -d

for attempt in $(seq 1 30); do
  if docker compose --env-file .env -f docker-compose.release.yml exec -T magnanimous \
      node -e "fetch('http://127.0.0.1:8788/__magnanimous_runtime/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" >/dev/null 2>&1; then
    break
  fi
  [ "$attempt" -lt 30 ] || { echo "Magnanimous standalone runtime did not become healthy." >&2; exit 1; }
  sleep 2
done

docker compose --env-file .env -f docker-compose.release.yml exec -T magnanimous \
  node -e "const t=process.env.MAGNANIMOUS_INTERNAL_SERVICE_TOKEN; fetch('http://127.0.0.1:8788/__magnanimous_runtime/services',{headers:{'x-magnanimous-service-token':t}}).then(async r=>{const x=await r.json(); if(!r.ok||Object.values(x.services||{}).some(v=>v.configured&&!v.ok))process.exit(1); console.log(JSON.stringify(x));}).catch(()=>process.exit(1))"

printf 'Magnanimous standalone release %s installed at %s and health-verified.\n' "$RELEASE_TAG" "$INSTALL_ROOT"
