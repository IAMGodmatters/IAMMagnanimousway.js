# Guarded OCI Always Free Terraform

This module prepares the **public Linux host only** for Magnanimous Telecom. It does not purchase a carrier, number, paid VM, domain, or regulated telecom service, and it never enables `TELECOM_NATIVE_WEBRTC_LIVE`.

The module is intentionally pinned to:

- Terraform 1.16.4;
- OCI provider 8.29.0;
- `VM.Standard.A1.Flex`;
- 2 OCPUs;
- 12 GiB RAM;
- 50 GB boot volume;
- one public IPv4;
- one VCN/public subnet/internet gateway;
- restrictive custom security list + NSG.

There is **no paid-shape fallback**. If A1 Always Free capacity is unavailable, `terraform apply` should fail rather than selecting another shape.

## Before running

An Oracle Cloud account/tenancy is required. Account creation, identity verification, and any card/phone verification are user-only Oracle steps.

Configure the OCI Terraform provider using a normal OCI CLI/API-key profile or another Oracle-supported authentication method. Never commit private keys, API tokens, `terraform.tfvars`, state files, or provider credentials.

Copy the example inputs:

```bash
cd telecom-core/oci
cp terraform.tfvars.example terraform.tfvars
```

Set:

- your OCI home region;
- compartment OCID;
- a trusted administrator IPv4 CIDR (prefer a single `/32`);
- your SSH public key.

Leave `enable_turn_relay=false` for the direct RTP path unless the TURN topology is intentionally being deployed.

## Validate before planning

```bash
terraform init
terraform fmt -check
terraform validate
python3 -m unittest -v test_verify_free_plan.py
```

## Plan and enforce the free profile

```bash
terraform plan -out=tfplan
terraform show -json tfplan > tfplan.json
python3 verify_free_plan.py tfplan.json
```

Do **not** apply when the free-plan guard fails.

Review the plan yourself as well. The expected managed resource families are only VCN, internet gateway, route table, minimal security list, subnet, NSG/rules, and one A1 instance.

Then:

```bash
terraform apply tfplan
```

## After apply

Terraform outputs the public IPv4 and SSH command.

1. Point the chosen Telecom hostname A record to that public IP.
2. SSH to the instance.
3. Review `/home/ubuntu/oci-telecom-preflight.txt` and rerun the preflight manually.
4. Run the existing protected host bootstrap from `telecom-core/deploy/bootstrap-public-host.sh`.
5. Configure the protected `telecom-core/.env` secrets on the host.
6. Sync trusted TLS.
7. Run **Public Telecom WebRTC Verification** from GitHub.

Only a green external browser/WSS/two-way-RTP proof can justify promoting `TELECOM_NATIVE_WEBRTC_LIVE=true`.

The compatibility PSTN fallback remains preserved.
