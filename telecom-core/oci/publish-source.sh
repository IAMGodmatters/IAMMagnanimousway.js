#!/usr/bin/env bash
# Transfer only the committed Telecom subtree from authenticated Cloud Shell.
# No GitHub credentials or repository URL are ever sent to the instance.
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: bash telecom-core/oci/publish-source.sh PUBLIC_IP" >&2
  exit 2
fi

PUBLIC_IP="$1"
if ! python3 -c 'import ipaddress,sys; ip=ipaddress.ip_address(sys.argv[1]); sys.exit(0 if ip.version == 4 and ip.is_global else 1)' "$PUBLIC_IP" 2>/dev/null; then
  echo "PUBLIC_IP must be a valid publicly routable IPv4 address from the OCI Terraform output." >&2
  exit 2
fi

REPO_DIR="${MAGNANIMOUS_CLOUD_SHELL_ROOT:-$HOME/magnanimous-telecom-oci}/repo"
SSH_KEY="${MAGNANIMOUS_SSH_KEY_PATH:-$HOME/.ssh/magnanimous_oci_ed25519}"
if [[ ! -f "$SSH_KEY" || ! -d "$REPO_DIR/.git" ]]; then
  echo "Cloud Shell Git checkout or SSH key missing; run cloud-shell-plan.sh first." >&2
  exit 1
fi
for bin in ssh scp tar git; do
  command -v "$bin" >/dev/null 2>&1 || { echo "$bin is required." >&2; exit 1; }
done

git -C "$REPO_DIR" rev-parse --verify HEAD >/dev/null
if ! git -C "$REPO_DIR" ls-tree -r --name-only HEAD | grep -qx 'telecom-core/deploy/oci-always-free-preflight.sh'; then
  echo "The selected committed source is missing the Telecom preflight; refusing to upload." >&2
  exit 1
fi

ARCHIVE="$(mktemp "${TMPDIR:-/tmp}/magnanimous-committed-source.XXXXXXXX.tar")"
trap 'rm -f -- "$ARCHIVE"' EXIT
git -C "$REPO_DIR" archive --format=tar --output="$ARCHIVE" HEAD telecom-core

TARGET="ubuntu@${PUBLIC_IP}"
SSH_OPTS=(-i "$SSH_KEY" -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=yes -o ConnectTimeout=15)
echo "Verifying the authenticated SSH connection and empty target directory..."
echo "The OCI host key must already be verified and present in your known_hosts file."
ssh "${SSH_OPTS[@]}" "$TARGET" 'test ! -e /opt/IAMMagnanimousway.js && test ! -e /home/ubuntu/magnanimous-source-upload.tar' || {
  echo "Host trust, SSH access, or empty-target validation failed. Existing source was not overwritten." >&2
  exit 1
}

scp "${SSH_OPTS[@]}" -- "$ARCHIVE" "$TARGET:/home/ubuntu/magnanimous-source-upload.tar"
ssh "${SSH_OPTS[@]}" "$TARGET" 'bash -se' <<'REMOTE'
set -euo pipefail
umask 077
archive=/home/ubuntu/magnanimous-source-upload.tar
target=/opt/IAMMagnanimousway.js
stage=''
cleanup() {
  rm -f -- "$archive"
  if [[ -n "$stage" && "$stage" == /opt/.magnanimous-source.* ]]; then
    sudo rm -r -- "$stage"
  fi
}
trap cleanup EXIT

if [[ -e "$target" ]]; then
  echo "Source already exists on this host; refusing to replace it." >&2
  exit 1
fi
stage="$(sudo mktemp -d /opt/.magnanimous-source.XXXXXXXX)"
sudo tar -xf "$archive" -C "$stage"
sudo test -f "$stage/telecom-core/deploy/oci-always-free-preflight.sh" || {
  echo "The transferred archive does not contain the expected Telecom preflight." >&2
  exit 1
}
sudo chown -R ubuntu:ubuntu "$stage"
sudo mv -- "$stage" "$target"
stage=''

echo "Committed source installed securely at $target. Running preflight..."
if bash "$target/telecom-core/deploy/oci-always-free-preflight.sh" > /home/ubuntu/oci-telecom-preflight.txt 2>&1; then
  echo "Telecom preflight passed. The external WebRTC verification is still required before going live."
else
  echo "Source installed, but Telecom preflight failed. Inspect /home/ubuntu/oci-telecom-preflight.txt and correct the failure." >&2
  exit 1
fi
REMOTE
