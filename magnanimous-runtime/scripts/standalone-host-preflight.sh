#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-$(pwd)}"
ENV_FILE="${2:-$ROOT/.env}"
COMPOSE_FILE="${3:-$ROOT/docker-compose.release.yml}"

fail(){ printf 'ERROR: %s\n' "$*" >&2; exit 1; }
warn(){ printf 'WARNING: %s\n' "$*" >&2; }

command -v docker >/dev/null 2>&1 || fail "Docker is required."
docker compose version >/dev/null 2>&1 || fail "Docker Compose v2 is required."
[ -f "$ENV_FILE" ] || fail "Missing environment file: $ENV_FILE"
[ -f "$COMPOSE_FILE" ] || fail "Missing release compose file: $COMPOSE_FILE"

read_env(){
  local key="$1"
  awk -F= -v k="$key" '$1==k {sub(/^[^=]*=/,""); print; exit}' "$ENV_FILE" | tr -d '\r'
}

for key in MAGNANIMOUS_INTERNAL_SERVICE_TOKEN MAGNANIMOUS_SECRETS_KEY SESSION_SECRET INTEGRATION_CREDENTIALS_KEY; do
  value="$(read_env "$key")"
  [ -n "$value" ] || fail "$key must be set in $ENV_FILE"
  [ "${#value}" -ge 24 ] || fail "$key must be at least 24 characters."
  case "$value" in
    *example*|*changeme*|*placeholder*|*ci-magnanimous*) fail "$key still looks like a placeholder." ;;
  esac
done

email="$(read_env MAGNANIMOUS_ACME_EMAIL)"
[ -n "$email" ] || fail "MAGNANIMOUS_ACME_EMAIL must be set for Caddy TLS."
case "$email" in *@*.*) ;; *) fail "MAGNANIMOUS_ACME_EMAIL must look like a real email address." ;; esac

available_kb="$(df -Pk "$ROOT" | awk 'NR==2{print $4}')"
[ "${available_kb:-0}" -ge 6291456 ] || fail "At least 6 GiB free disk space is required for images, data, and rollback room."

if [ -r /proc/meminfo ]; then
  mem_kb="$(awk '/MemTotal:/ {print $2}' /proc/meminfo)"
  if [ "${mem_kb:-0}" -lt 2097152 ]; then
    fail "At least 2 GiB RAM is required. 4 GiB or more is recommended."
  elif [ "$mem_kb" -lt 4194304 ]; then
    warn "Host has less than 4 GiB RAM; browser rendering may be constrained."
  fi
fi

release_tag="${MAGNANIMOUS_RELEASE_TAG:-$(read_env MAGNANIMOUS_RELEASE_TAG)}"
release_tag="${release_tag:-local}"
MAGNANIMOUS_RELEASE_TAG="$release_tag" \
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" config -q

printf 'Magnanimous standalone host preflight PASS (release tag: %s)\n' "$release_tag"
