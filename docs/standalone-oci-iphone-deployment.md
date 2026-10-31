# Magnanimous standalone deployment from an iPhone

This runbook deploys the ARM64 offline bundle to an OCI Always Free Ampere VM. GitHub Actions builds and transfers the private workflow artifact over SSH. The 516 MB bundle is not downloaded to the iPhone.

## Important free-tier limitation

OCI Always Free provides up to 2 OCPUs and 12 GB RAM on `VM.Standard.A1.Flex`, with 200 GB combined boot/block-volume storage in the tenancy home region. Use the existing Singapore home region. Keep the boot volume at 50 GB and do not add paid storage, a paid load balancer, or a paid compute shape.

Oracle may reclaim an Always Free VM if, for a 7-day period, CPU 95th-percentile utilization is below 20%, network utilization is below 20%, and (for A1) memory utilization is below 20%. This makes Always Free useful for a verified pilot/staging host, but it is not a production uptime guarantee. Do not generate artificial load to evade reclamation. Keep independent backups and retain the existing production site as the rollback rail.

Official limits: https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm

## 1. Create the VM in the existing OCI tenancy

On the iPhone, open the OCI Console in Safari and select the Singapore home region.

Create one Compute instance with:

- Image: Ubuntu 24.04 ARM64.
- Shape: `VM.Standard.A1.Flex`, marked Always Free Eligible.
- Capacity: 2 OCPUs and 12 GB memory.
- Boot volume: 50 GB.
- Public IPv4: enabled.
- SSH: generate/download a key pair; keep the private key in the iPhone Files app.
- Network ingress: TCP 22, 80, and 443 only.
- Do not expose 8788, 8791, 8792, 8793, 8794, or port 53 publicly.
- Outbound internet access: enabled.

If the Console does not mark the selected compute and boot-volume resources Always Free Eligible, stop before creating the instance. Do not upgrade the account.

## 2. Bootstrap Docker and persistent secrets

Paste the contents of `magnanimous-runtime/oci-cloud-init.yaml` into the instance's Cloud-init/user-data field.

The bootstrap script installs Docker and Compose, enables the host firewall, creates `/opt/magnanimous/.env` with independent random secrets, and enables the narrowly scoped GitHub-OIDC migration endpoints. It does not deploy the application or change the production website.

It refuses to overwrite an existing `.env`.

## 3. Add the standalone DNS record

At the domain's existing DNS provider, add:

- Type: A
- Host/name: `standalone`
- Value: the VM's public IPv4 address
- Proxy: DNS-only while Caddy obtains its TLS certificate.

This uses a dedicated subdomain. Do not change the apex, `www`, registrar, nameservers, MX, SPF, DKIM, or DMARC records.

## 4. Configure GitHub Actions access

In repository Settings → Secrets and variables → Actions, add these repository variables:

| Variable | Value |
|---|---|
| `MAGNANIMOUS_ENABLE_STANDALONE` | `true` |
| `MAGNANIMOUS_STANDALONE_HOST` | VM public IPv4 |
| `MAGNANIMOUS_STANDALONE_SSH_USER` | `ubuntu` |
| `MAGNANIMOUS_STANDALONE_DEPLOY_PATH` | `/opt/magnanimous` |
| `MAGNANIMOUS_STANDALONE_ORIGIN` | `https://standalone.iammagnanimousway.com` |

Add these repository secrets:

- `MAGNANIMOUS_STANDALONE_SSH_PRIVATE_KEY`: the private SSH key downloaded when creating the OCI instance.
- `MAGNANIMOUS_STANDALONE_SSH_KNOWN_HOSTS`: the verified SSH host-key entry for the VM. Verify the fingerprint from a trusted session before pinning it; do not trust an unverified scan.

The deployment job runs only on main, only after the standalone switch is explicitly enabled, and only with the pinned host key. It downloads the workflow artifact from the same run, verifies its SHA-256 checksum, transfers it over SSH, installs the images, and checks the exact deployed source revision. No separate public GitHub Release asset is created. Artifact access follows the repository's current visibility.

## 5. Deploy and stage data safely

After the VM, DNS, variables, and secrets are ready:

1. Run the Magnanimous Standalone Release workflow on main.
2. Confirm the `deploy-standalone` job succeeds.
3. Confirm `https://standalone.iammagnanimousway.com/__magnanimous_runtime/health` reports the expected source revision.
4. Run the Magnanimous Runtime Secrets Stage workflow. It uses the existing protected GitHub secrets and OIDC identity; provider secrets are not pasted into the iPhone.
5. Run Magnanimous Production Data Stage manually. It exports a logical D1 snapshot, stages it on the standalone persistent volume, and verifies SQLite integrity, foreign keys, schema, and per-table row counts.

Data staging does not switch production traffic or replace the live standalone database. Do not cut over the apex or retire the current Worker/D1 deployment until the staged data has been deliberately promoted, backup/restore has been tested, and login, sessions, billing, telecom, mail, queues, browser, sandbox, media, and scheduled-work smoke tests pass.

The current logical D1 staging workflow has a 100 MB transfer ceiling. If the snapshot exceeds it, stop and use a separately secured transfer path; do not publish a database export as a public artifact.

## 6. Rollback and preservation

- Keep the existing production Worker/D1 deployment untouched during the pilot.
- Keep the standalone SQLite, object-store, secrets, and backup directories on the persistent Docker data volume.
- Use `backup-runtime.mjs` before any data promotion or restore.
- Never run `docker compose down -v` on the live host; it deletes persistent volumes.
- Keep the GitHub SSH deployment key scoped to this repository and rotate it if access is no longer needed.
- Do not switch the production apex or registrar as part of this setup.
