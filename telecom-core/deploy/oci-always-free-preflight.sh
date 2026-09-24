#!/usr/bin/env bash
set -euo pipefail

INSTANCE_FILE="${OCI_INSTANCE_JSON_FILE:-}"
VNICS_FILE="${OCI_VNICS_JSON_FILE:-}"
METADATA_BASE="${OCI_METADATA_BASE:-http://169.254.169.254/opc/v2}"

fetch_metadata() {
  local path="$1"
  curl -fsS --connect-timeout 2 --max-time 5     -H 'Authorization: Bearer Oracle'     "${METADATA_BASE}/${path}"
}

tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

if [[ -n "$INSTANCE_FILE" ]]; then
  cp "$INSTANCE_FILE" "$tmpdir/instance.json"
else
  fetch_metadata "instance/" > "$tmpdir/instance.json" || {
    echo "OCI instance metadata is unavailable. Run this on the target Oracle Cloud Compute VM." >&2
    exit 1
  }
fi

if [[ -n "$VNICS_FILE" ]]; then
  cp "$VNICS_FILE" "$tmpdir/vnics.json"
else
  fetch_metadata "vnics/" > "$tmpdir/vnics.json" || {
    echo "OCI VNIC metadata is unavailable. The target VM must expose OCI v2 metadata." >&2
    exit 1
  }
fi

python3 - "$tmpdir/instance.json" "$tmpdir/vnics.json" <<'PY'
import ipaddress
import json
import os
import platform
import sys

instance=json.load(open(sys.argv[1]))
vnics=json.load(open(sys.argv[2]))
shape=str(instance.get("shape") or "")
region=str(instance.get("region") or instance.get("canonicalRegionName") or "")
display=str(instance.get("displayName") or instance.get("hostname") or "oci-telecom-host")

if shape != "VM.Standard.A1.Flex":
    raise SystemExit(
        f"Unsupported OCI shape for the full free-first Telecom Core: {shape or 'unknown'}. "
        "Use Always Free VM.Standard.A1.Flex; the 1 GB E2.1.Micro shape is intentionally not approved for this stack."
    )

arch=platform.machine().lower()
if arch not in {"aarch64","arm64"}:
    raise SystemExit(f"OCI A1 preflight expected ARM64/aarch64, got {arch or 'unknown'}.")

cpu=os.cpu_count() or 0
if cpu < 2:
    raise SystemExit(f"Allocate at least 2 OCPUs to the OCI A1 host; detected {cpu}.")

mem_kib=0
with open("/proc/meminfo") as fh:
    for line in fh:
        if line.startswith("MemTotal:"):
            mem_kib=int(line.split()[1])
            break
if mem_kib < 8 * 1024 * 1024:
    raise SystemExit(
        f"Allocate at least 8 GiB RAM to the OCI A1 host; detected {mem_kib/1024/1024:.1f} GiB."
    )

public_ip=""
private_ip=""
for item in vnics if isinstance(vnics,list) else []:
    candidate=str(item.get("publicIp") or "").strip()
    if candidate:
        ip=ipaddress.ip_address(candidate)
        if ip.version == 4 and ip.is_global:
            public_ip=candidate
            private_ip=str(item.get("privateIp") or "").strip()
            break

if not public_ip:
    raise SystemExit(
        "No globally routable public IPv4 was found in OCI VNIC metadata. "
        "Attach a public IPv4 in a public subnet before Telecom activation."
    )

print("OCI_ALWAYS_FREE_PREFLIGHT=PASS")
print(f"OCI_SHAPE={shape}")
print(f"OCI_REGION={region}")
print(f"OCI_HOST={display}")
print(f"OCI_ARCH={arch}")
print(f"OCI_CPU_COUNT={cpu}")
print(f"OCI_MEMORY_GIB={mem_kib/1024/1024:.1f}")
print(f"OCI_PRIVATE_IP={private_ip}")
print(f"TELECOM_PUBLIC_IP={public_ip}")
print()
print("Next safe step:")
print(f"  export TELECOM_PUBLIC_IP={public_ip}")
print("  export ENABLE_UFW=true")
print("  export ADMIN_SSH_CIDR=<your-admin-public-ip>/32")
print("  sudo -E bash ./telecom-core/deploy/bootstrap-public-host.sh")
PY

case "$(. /etc/os-release 2>/dev/null; printf '%s' "${ID:-}")" in
  ubuntu|debian) ;;
  *)
    echo "Use an Ubuntu or Debian OCI image because the public-host bootstrap uses apt." >&2
    exit 1
    ;;
esac
