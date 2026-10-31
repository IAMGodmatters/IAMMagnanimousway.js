#!/usr/bin/env bash
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this bootstrap as root." >&2
  exit 1
fi

DOMAIN="${1:-standalone.iammagnanimousway.com}"
ACME_EMAIL="${2:-godmattersinc@iammagnanimousway.com}"
INSTALL_ROOT="/opt/magnanimous"

if [[ ! "$DOMAIN" =~ ^([A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$ ]]; then
  echo "A valid fully qualified hostname is required." >&2
  exit 1
fi
case "$DOMAIN" in
  iammagnanimousway.com|www.iammagnanimousway.com)
    echo "The production apex and www hostname must remain on the existing site." >&2
    exit 1
    ;;
esac
case "$ACME_EMAIL" in *@*.*) ;; *) echo "A valid ACME contact email is required." >&2; exit 1 ;; esac

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl docker.io docker-compose-v2 openssl ufw fail2ban unattended-upgrades

systemctl enable --now docker
docker version >/dev/null
docker compose version >/dev/null
# Enforce key-only SSH and basic brute-force protection before enabling the host firewall.
install -d -m 755 /etc/ssh/sshd_config.d
cat > /etc/ssh/sshd_config.d/99-magnanimous-hardening.conf <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin no
PubkeyAuthentication yes
EOF
sshd -t
systemctl reload ssh
cat > /etc/fail2ban/jail.d/magnanimous-sshd.local <<'EOF'
[sshd]
enabled = true
maxretry = 5
findtime = 10m
bantime = 1h
EOF
systemctl enable --now fail2ban
systemctl enable --now unattended-upgrades || true

# OCI network security rules remain the outer firewall. Keep the host firewall
# limited to SSH and the public HTTPS reverse proxy; never expose app containers.
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

install -d -m 700 "$INSTALL_ROOT"
if [ -e "$INSTALL_ROOT/.env" ]; then
  echo "Refusing to overwrite existing $INSTALL_ROOT/.env; existing secrets are preserved." >&2
  exit 1
fi

secret(){ openssl rand -hex 32; }
umask 077
cat > "$INSTALL_ROOT/.env" <<EOF
MAGNANIMOUS_DOMAIN=$DOMAIN
MAGNANIMOUS_ACME_EMAIL=$ACME_EMAIL
MAGNANIMOUS_INTERNAL_SERVICE_TOKEN=$(secret)
MAGNANIMOUS_SECRETS_KEY=$(secret)
SESSION_SECRET=$(secret)
INTEGRATION_CREDENTIALS_KEY=$(secret)
MAGNANIMOUS_GITHUB_MIGRATION_ENABLED=true
MAGNANIMOUS_GITHUB_MIGRATION_REPOSITORY=IAMGodmatters/IAMMagnanimousway.js
MAGNANIMOUS_GITHUB_MIGRATION_AUDIENCE=magnanimous-production-data-stage
MAGNANIMOUS_RUNTIME_SECRETS_ROOT=/app/data/secrets
MAGNANIMOUS_RUNTIME_SECRETS_FILE=/app/data/secrets/runtime.json
MAGNANIMOUS_MIGRATION_ROOT=/app/data/migration
MAGNANIMOUS_MIGRATION_STAGE_PATH=/app/data/migration/production.sqlite
EOF
chmod 600 "$INSTALL_ROOT/.env"

cat > /usr/local/sbin/magnanimous-backup.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
ROOT="/opt/magnanimous"
[ -f "$ROOT/docker-compose.release.yml" ] || exit 0
COMPOSE=(docker compose --env-file "$ROOT/.env" -f "$ROOT/docker-compose.release.yml")
if ! "${COMPOSE[@]}" ps --services --filter status=running | grep -qx magnanimous; then
  echo "Magnanimous runtime is not running yet; skipping scheduled backup."
  exit 0
fi
"${COMPOSE[@]}" exec -T magnanimous node /app/magnanimous-runtime/scripts/backup-runtime.mjs
"${COMPOSE[@]}" exec -T magnanimous node --input-type=module - <<'NODE'
import fs from 'node:fs/promises';
import path from 'node:path';
const root='/app/backups';
const cutoff=Date.now()-14*24*60*60*1000;
for(const entry of await fs.readdir(root,{withFileTypes:true})){
  if(!entry.isDirectory()||!entry.name.startsWith('backup-'))continue;
  const full=path.join(root,entry.name);
  const stat=await fs.stat(full);
  if(stat.mtimeMs<cutoff)await fs.rm(full,{recursive:true,force:true});
}
NODE
EOF
chmod 700 /usr/local/sbin/magnanimous-backup.sh

cat > /etc/systemd/system/magnanimous-backup.service <<'EOF'
[Unit]
Description=Magnanimous standalone persistent data backup
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
ExecStart=/usr/local/sbin/magnanimous-backup.sh
EOF

cat > /etc/systemd/system/magnanimous-backup.timer <<'EOF'
[Unit]
Description=Daily Magnanimous standalone backup

[Timer]
OnCalendar=*-*-* 02:30:00 UTC
Persistent=true
RandomizedDelaySec=10m

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable --now magnanimous-backup.timer

printf 'Magnanimous host bootstrap ready. Docker Compose: '
docker compose version --short
printf 'Persistent install directory: %s\n' "$INSTALL_ROOT"
printf 'TLS hostname configured: %s\n' "$DOMAIN"
printf 'No release has been deployed yet; waiting for the private GitHub Actions deployment job.\n'
