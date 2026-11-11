#!/usr/bin/env bash
set -euo pipefail

SERVER="https://iammagnanimousway.com"
PAIR_CODE="${1:-}"
BRIDGE_DIR="$HOME/.magnanimous"
WORKSPACE="$HOME/.magnanimous-cloud-workspace"
AGENT_URL="$SERVER/downloads/local-bridge/bridge_agent.py"

if [[ -z "$PAIR_CODE" ]]; then
  echo "Usage: $0 ONE_TIME_PAIRING_CODE" >&2
  exit 2
fi
if [[ ! "$PAIR_CODE" =~ ^[A-Za-z0-9_-]{12,200}$ ]]; then
  echo "The pairing code format is invalid." >&2
  exit 2
fi
if [[ "$(uname -s)" != "Linux" ]]; then
  echo "Cloud Android emulator nodes require Linux with KVM." >&2
  exit 2
fi
if [[ ! -r /dev/kvm || ! -w /dev/kvm ]]; then
  echo "KVM is unavailable to this user at /dev/kvm. Use a KVM-capable host or a VM with nested virtualization." >&2
  exit 2
fi
command -v python3 >/dev/null || { echo "python3 is required." >&2; exit 2; }
command -v curl >/dev/null || { echo "curl is required." >&2; exit 2; }
command -v docker >/dev/null || { echo "Docker Engine is required; this script does not install Docker or provision a VM." >&2; exit 2; }
command -v adb >/dev/null || { echo "Android SDK Platform-Tools (adb) must already be on PATH." >&2; exit 2; }
python3 - <<'PY'
import sys
if sys.version_info < (3, 10):
    raise SystemExit("Python 3.10 or newer is required.")
PY
docker info >/dev/null 2>&1 || { echo "Docker is not usable by this account. Configure Docker access first." >&2; exit 2; }
mkdir -p "$BRIDGE_DIR" "$WORKSPACE"
chmod 700 "$BRIDGE_DIR"
AGENT="$BRIDGE_DIR/bridge_agent.py"
curl -fsSL "$AGENT_URL" -o "$AGENT.new"
python3 -m py_compile "$AGENT.new"
mv "$AGENT.new" "$AGENT"
chmod 700 "$AGENT"

echo "Pairing this Linux KVM host with Magnanimous using the one-time owner code..."
python3 "$AGENT" pair --server "$SERVER" --code "$PAIR_CODE" --name "Magnanimous Cloud Android Emulator Host" --root "$WORKSPACE"

PYTHON_BIN="$(command -v python3)"
SERVICE_DIR="$HOME/.config/systemd/user"
mkdir -p "$SERVICE_DIR"
cat > "$SERVICE_DIR/magnanimous-cloud-android-bridge.service" <<EOF
[Unit]
Description=Magnanimous Cloud Android Emulator Local Bridge
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=$PYTHON_BIN $AGENT run --interval 3
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=read-only
ReadWritePaths=$BRIDGE_DIR $WORKSPACE $HOME/.android

[Install]
WantedBy=default.target
EOF
if command -v systemctl >/dev/null && systemctl --user daemon-reload >/dev/null 2>&1; then
  systemctl --user enable --now magnanimous-cloud-android-bridge.service
  echo "Magnanimous cloud bridge service enabled for this user."
else
  echo "User systemd is unavailable. Start the bridge with:"
  echo "  python3 '$AGENT' run --interval 3"
fi

cat <<'EOF'
Pairing complete. The bridge uses outbound HTTPS; no inbound bridge port is opened.
The emulator container is started separately from the Magnanimous Virtual Phones owner page.
This setup does not create or pay for a cloud VM. The owner supplies the Linux KVM host.
EOF
