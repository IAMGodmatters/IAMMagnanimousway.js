#!/usr/bin/env bash
set -euo pipefail

MODE="plan"
if [[ "${1:-}" == "--apply" ]]; then
  MODE="apply"
elif [[ -n "${1:-}" ]]; then
  echo "Usage: $0 [--apply]" >&2
  exit 2
fi

REPO_URL="${MAGNANIMOUS_REPO_URL:-https://github.com/IAMGodmatters/IAMMagnanimousway.js.git}"
REPO_REF="${MAGNANIMOUS_REPO_REF:-main}"
WORK_ROOT="${MAGNANIMOUS_CLOUD_SHELL_ROOT:-$HOME/magnanimous-telecom-oci}"
REPO_DIR="$WORK_ROOT/repo"
TF_DIR="$REPO_DIR/telecom-core/oci"
TF_VERSION="1.16.4"

command -v oci >/dev/null 2>&1 || {
  echo "OCI CLI is required. Run this from Oracle Cloud Shell." >&2
  exit 1
}
command -v git >/dev/null 2>&1 || {
  echo "git is required. Oracle Cloud Shell normally includes it." >&2
  exit 1
}
command -v python3 >/dev/null 2>&1 || {
  echo "python3 is required. Oracle Cloud Shell normally includes it." >&2
  exit 1
}

mkdir -p "$WORK_ROOT"

if [[ -d "$REPO_DIR/.git" ]]; then
  git -C "$REPO_DIR" fetch --depth=1 origin "$REPO_REF"
  git -C "$REPO_DIR" checkout -B "$REPO_REF" "origin/$REPO_REF"
else
  rm -rf "$REPO_DIR"
  git clone --depth=1 --branch "$REPO_REF" "$REPO_URL" "$REPO_DIR"
fi

[[ -f "$TF_DIR/verify_free_plan.py" ]] || {
  echo "Guarded OCI Terraform module was not found at $TF_DIR." >&2
  exit 1
}

HOME_REGION="${OCI_REGION:-}"
if [[ -z "$HOME_REGION" ]]; then
  HOME_REGION="$(oci iam region-subscription list     --query 'data[?"is-home-region" == `true`]."region-name" | [0]'     --raw-output 2>/dev/null || true)"
fi
if [[ -z "$HOME_REGION" || "$HOME_REGION" == "null" ]]; then
  echo "Could not discover the OCI home region from the pre-authenticated Cloud Shell session." >&2
  exit 1
fi

TENANCY_OCID="${OCI_TENANCY_OCID:-}"
if [[ -z "$TENANCY_OCID" && -f "$HOME/.oci/config" ]]; then
  TENANCY_OCID="$(awk -F= '
    BEGIN { in_default=0 }
    /^[[:space:]]*\[DEFAULT\][[:space:]]*$/ { in_default=1; next }
    /^[[:space:]]*\[/ { in_default=0 }
    in_default && /^[[:space:]]*tenancy[[:space:]]*=/ {
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", $2); print $2; exit
    }
  ' "$HOME/.oci/config")"
fi
if [[ -z "$TENANCY_OCID" ]]; then
  echo "Could not discover the tenancy OCID from Cloud Shell. Export OCI_TENANCY_OCID and retry." >&2
  exit 1
fi

COMPARTMENT_ID="${OCI_COMPARTMENT_ID:-$TENANCY_OCID}"
ADMIN_SSH_CIDR="${ADMIN_SSH_CIDR:-}"
if [[ -z "$ADMIN_SSH_CIDR" ]]; then
  echo "ADMIN_SSH_CIDR is required and must be a trusted IPv4 CIDR such as 203.0.113.20/32." >&2
  echo "For Cloud Shell administration, use the current trusted egress /32 you intend to SSH from." >&2
  exit 1
fi

KEY_PATH="${MAGNANIMOUS_SSH_KEY_PATH:-$HOME/.ssh/magnanimous_oci_ed25519}"
if [[ ! -s "$KEY_PATH" || ! -s "$KEY_PATH.pub" ]]; then
  mkdir -p "$(dirname "$KEY_PATH")"
  chmod 700 "$(dirname "$KEY_PATH")"
  ssh-keygen -q -t ed25519 -N '' -C 'magnanimous-oci-cloud-shell' -f "$KEY_PATH"
fi
SSH_PUBLIC_KEY="$(cat "$KEY_PATH.pub")"

oci iam availability-domain list   --compartment-id "$COMPARTMENT_ID"   --region "$HOME_REGION"   --limit 1 >/dev/null

install_terraform() {
  local current=""
  if command -v terraform >/dev/null 2>&1; then
    current="$(terraform version -json 2>/dev/null | python3 -c 'import json,sys; print(json.load(sys.stdin).get("terraform_version",""))' 2>/dev/null || true)"
  fi
  if [[ "$current" == "$TF_VERSION" ]]; then
    return
  fi

  local arch
  case "$(uname -m)" in
    x86_64) arch="amd64" ;;
    aarch64|arm64) arch="arm64" ;;
    *)
      echo "Unsupported Cloud Shell architecture: $(uname -m)" >&2
      exit 1
      ;;
  esac

  local bin_dir="$HOME/.local/bin"
  local tmp
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' RETURN

  mkdir -p "$bin_dir"
  curl -fsSLo "$tmp/terraform.zip"     "https://releases.hashicorp.com/terraform/$TF_VERSION/terraform_${TF_VERSION}_linux_${arch}.zip"
  curl -fsSLo "$tmp/SHA256SUMS"     "https://releases.hashicorp.com/terraform/$TF_VERSION/terraform_${TF_VERSION}_SHA256SUMS"

  (
    cd "$tmp"
    grep " terraform_${TF_VERSION}_linux_${arch}.zip$" SHA256SUMS | sha256sum -c -
  )
  python3 - "$tmp/terraform.zip" "$bin_dir/terraform" <<'PY'
import os
import sys
import zipfile

archive, target = sys.argv[1:3]
with zipfile.ZipFile(archive) as zf:
    data = zf.read("terraform")
with open(target, "wb") as fh:
    fh.write(data)
os.chmod(target, 0o755)
PY
  export PATH="$bin_dir:$PATH"
  hash -r

  [[ "$(terraform version -json | python3 -c 'import json,sys; print(json.load(sys.stdin)["terraform_version"])')" == "$TF_VERSION" ]] || {
    echo "Failed to activate Terraform $TF_VERSION." >&2
    exit 1
  }
}

install_terraform

TFVARS="$TF_DIR/terraform.tfvars"
umask 077
cat > "$TFVARS" <<EOF
region          = "$HOME_REGION"
compartment_id  = "$COMPARTMENT_ID"
admin_ssh_cidr  = "$ADMIN_SSH_CIDR"
ssh_public_key  = "${SSH_PUBLIC_KEY}"
availability_domain_index = ${OCI_AD_INDEX:-0}
instance_name              = "magnanimous-telecom"
enable_turn_relay          = ${ENABLE_TURN_RELAY:-false}
repo_url                   = "$REPO_URL"
repo_ref                   = "$REPO_REF"
EOF

cd "$TF_DIR"
terraform init -input=false
terraform fmt -check
terraform validate
python3 -m unittest -v test_verify_free_plan.py
terraform plan -input=false -out=tfplan
terraform show -json tfplan > tfplan.json
python3 verify_free_plan.py tfplan.json

echo
echo "Guarded OCI plan is valid."
echo "Region:      $HOME_REGION"
echo "Compartment: $COMPARTMENT_ID"
echo "Admin CIDR:  $ADMIN_SSH_CIDR"
echo "SSH key:     $KEY_PATH.pub"
echo

if [[ "$MODE" != "apply" ]]; then
  echo "No resources were created."
  echo "Review the Terraform plan above. To create the guarded Always Free host, rerun:"
  echo "  ADMIN_SSH_CIDR='$ADMIN_SSH_CIDR' bash telecom-core/oci/cloud-shell-plan.sh --apply"
  exit 0
fi

echo "Applying the already-verified guarded plan. No paid-shape fallback exists."
terraform apply -input=false tfplan
terraform output

echo
echo "OCI host infrastructure was created from the verified plan."
echo "Next: point the Telecom DNS hostname to the public_ip output, then run the host bootstrap and external WebRTC proof."
echo "TELECOM_NATIVE_WEBRTC_LIVE must remain false until that proof passes."
