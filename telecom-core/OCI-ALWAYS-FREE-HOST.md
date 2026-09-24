# Oracle Cloud Always Free Telecom Core host

This path exists to activate the already-proven Magnanimous Telecom Core without creating a recurring VPS bill.

It does **not** mark native WebRTC live by itself. `TELECOM_NATIVE_WEBRTC_LIVE` remains false until the external GitHub-hosted Chromium verification proves trusted TLS, public WSS registration, real call establishment, inbound and outbound RTP, and a remote audio track using the production ICE policy.

## Why OCI A1

Oracle's current Always Free documentation includes Ampere A1 Compute capacity in the tenancy home region. For the full Magnanimous Telecom stack, use:

- shape: `VM.Standard.A1.Flex`;
- architecture: ARM64;
- allocation: at least 2 OCPUs and 8 GiB RAM;
- recommended allocation while staying inside the documented Always Free A1 pool: 2 OCPUs and 12 GiB RAM;
- Ubuntu 24.04 LTS;
- a public subnet with a public IPv4;
- a 50 GB boot volume unless you intentionally need more storage.

Do not use the 1 GB `VM.Standard.E2.1.Micro` shape for the full Telecom Core. The repository preflight rejects it intentionally.

Oracle may reclaim idle Always Free compute. Do not represent this free-first host as equivalent to a paid dedicated production SLA. It is appropriate for activation, verification, development, and early service while usage/reliability are monitored. A later dedicated host can replace it without changing the Magnanimous Telecom identity.

## Guarded Terraform provisioning

The repository also contains `telecom-core/oci/`, a Terraform module that creates only the public-host infrastructure required for this path. It is pinned to Terraform 1.16.4 and OCI provider 8.29.0, hard-codes `VM.Standard.A1.Flex` at 2 OCPUs / 12 GiB RAM with a 50 GB boot volume, and has no paid-shape fallback.

Before any apply:

```bash
cd telecom-core/oci
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform validate
terraform plan -out=tfplan
terraform show -json tfplan > tfplan.json
python3 verify_free_plan.py tfplan.json
```

Do not apply when the plan guard fails. The verifier rejects unexpected resource-create types, paid/other instance shapes, oversized A1 CPU or memory, oversized boot volume, private-only networking, and multiple instance creates.

The module does not store telecom secrets. It installs only a public SSH key and a secret-free cloud-init that clones the public repository and runs the read-only OCI host preflight.

## User-only account step

Creating an Oracle Cloud tenancy is outside the repository and outside the currently connected ChatGPT tools. Oracle states that signup commonly requires a mobile number and credit card, and the card is not charged unless the account is upgraded.

Do not upgrade the account or create non-Always-Free resources merely to activate telecom.

## OCI network requirements

Create the A1 VM in a public subnet with an internet gateway and public IPv4.

| Purpose | Protocol | Port/range | Source |
| --- | --- | --- | --- |
| Admin SSH | TCP | 22 | your fixed admin public IP/CIDR only |
| ACME HTTP-01 | TCP | 80 | internet, only as needed for certificate issuance/renewal |
| Asterisk WSS | TCP | 8089 | internet |
| Asterisk RTP | UDP | 10000-20000 | internet |
| TURN over TLS, when intentionally enabled | TCP | 5349 | internet |
| TURN relay media, when intentionally enabled | UDP | 49160-49260 | internet |

Port 5060 does **not** need to be public for the browser WebRTC proof. Keep PSTN/SIP interconnect ports closed until an authenticated carrier/interconnect is actually configured and scoped.

OCI security-list/NSG rules and the host firewall must both permit the intended traffic. Opening a host firewall port while OCI blocks it is not sufficient.

## Preflight before changing the VM

Clone the repository on the VM and run:

```bash
bash ./telecom-core/deploy/oci-always-free-preflight.sh
```

The preflight is read-only. It fails unless it detects:

- OCI v2 instance metadata;
- `VM.Standard.A1.Flex`;
- ARM64;
- at least 2 CPUs;
- at least 8 GiB RAM;
- Ubuntu/Debian;
- a globally routable public IPv4.

It prints the detected `TELECOM_PUBLIC_IP` only after those checks pass.

## Host bootstrap

After DNS for the telecom hostname points to the VM public IPv4:

```bash
export TELECOM_DOMAIN=telecom.example.com
export ACME_EMAIL=owner@example.com
export ADMIN_SSH_CIDR=<your-admin-public-ip>/32
export ENABLE_UFW=true
sudo -E bash ./telecom-core/deploy/bootstrap-public-host.sh
```

The bootstrap refuses to enable UFW without an explicit admin SSH CIDR.

Then create `telecom-core/.env` from `.env.owned.example` and set the protected API/ARI/SIP credentials, public hostname, and public IP. Keep `MAGNANIMOUS_TURN_FORCE_RELAY=false` unless the relay topology is intentionally being tested.

## Start the owned Telecom Core

Direct public RTP path:

```bash
cd telecom-core
docker compose up -d sip-db sip-core asterisk control-api
```

Optional owned TURN relay on the same host:

```bash
docker compose --profile turn-relay up -d turn-relay
```

The TURN relay remains opt-in and fails closed when its TLS files or shared secret are missing.

## Trusted TLS

After Certbot issues the certificate, run:

```bash
export TELECOM_DOMAIN=telecom.example.com
export MAGNANIMOUS_REPO_PATH=/path/to/IAMMagnanimousway.js
export TELECOM_CERTS_DIR=/opt/magnanimous-telecom/certs
sudo -E bash ./telecom-core/deploy/sync-public-tls.sh
```

Keep the private key root-readable only as enforced by the existing sync script.

## External production proof

Configure the existing GitHub repository variables/secrets described in `PUBLIC-HOST.md`, then manually run **Public Telecom WebRTC Verification**.

Only after that workflow proves the real external path green may `TELECOM_NATIVE_WEBRTC_LIVE=true` be promoted.

The compatibility PSTN fallback remains available throughout this activation path.

## Cost boundary

This OCI path is deliberately free-first:

- no paid VPS is created by repository code;
- no carrier resource or phone number is purchased;
- no account upgrade is required by the deployment scripts;
- no paid OCI shape is accepted by the preflight;
- no metered telecom service is enabled automatically.

If OCI cannot provide Always Free A1 capacity in the tenancy home region, stop rather than silently choosing a paid shape.
