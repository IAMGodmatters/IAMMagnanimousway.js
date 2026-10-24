# Oracle Cloud Shell activation

Oracle Cloud Shell is the preferred browser-only path for the guarded OCI Telecom host.

Oracle documents Cloud Shell as a free browser terminal with Git, Python, Terraform and a pre-authenticated OCI CLI/provider environment. This avoids creating a separate Terraform API signing key on your phone or computer.

## What the helper does

`cloud-shell-plan.sh`:

1. verifies that it is running with OCI CLI access;
2. clones or refreshes the Magnanimous repository through your Cloud Shell Git authentication;
3. discovers the tenancy home region from the signed-in OCI session;
4. uses the root tenancy compartment by default, or `OCI_COMPARTMENT_ID` when supplied;
5. creates a dedicated Ed25519 SSH key in Cloud Shell if one does not already exist;
6. requires a restricted `ADMIN_SSH_CIDR`;
7. installs the repository-pinned Terraform 1.16.4 into `$HOME/.local/bin` only when the Cloud Shell version is different, verifying the HashiCorp SHA256 manifest;
8. initializes and validates the Terraform module;
9. runs the free-profile unit tests;
10. creates a Terraform plan and passes it through `verify_free_plan.py`;
11. **stops without creating resources by default**.

It applies only when you rerun it with `--apply`.

## First run: plan only

In OCI Cloud Shell:

```bash
git clone --depth=1 https://github.com/IAMGodmatters/IAMMagnanimousway.js.git
cd IAMMagnanimousway.js

export ADMIN_SSH_CIDR='203.0.113.20/32'
bash telecom-core/oci/cloud-shell-plan.sh
```

Replace the example CIDR with the trusted public IPv4/CIDR you will administer from. `0.0.0.0/0` is rejected by the Terraform module.

To use a non-root compartment:

```bash
export OCI_COMPARTMENT_ID='ocid1.compartment.oc1..replace_me'
```

To try another availability domain when Oracle reports no A1 capacity:

```bash
export OCI_AD_INDEX=1
```

Allowed indices are 0, 1, or 2. Do not switch to a paid shape.

## Second run: explicit apply

Only after reviewing the plan:

```bash
export ADMIN_SSH_CIDR='203.0.113.20/32'
bash telecom-core/oci/cloud-shell-plan.sh --apply
```

The helper applies the plan that just passed the free-profile verifier. The module has no paid-shape fallback.

## Private-repository-safe source delivery

GitHub may be public today and private later. In either case, **only your Cloud Shell checkout** accesses the source repository. OCI cloud-init does not clone GitHub and receives no access token, deploy key, Git credential, or repository URL. This also works after a repository privacy change.

If your repository is private, authenticate **Git in your Oracle Cloud Shell session** before the initial clone. Use an approved GitHub SSH key, or a credential helper such as `gh auth login` followed by `gh auth setup-git` when `gh` is available. Do not embed a personal access token in a clone URL, Terraform variables, OCI metadata, or an instance initialization script. The default HTTPS clone requires working Git authentication for private repositories. An owner-configured SSH clone URL may be provided in `MAGNANIMOUS_REPO_URL`.

After `--apply`, obtain the output `public_ip`. In Cloud Shell, first verify the host's SSH key fingerprint through a trusted OCI console/serial-console channel and add it to your Cloud Shell `known_hosts`. The publish script intentionally refuses unknown host keys; do not disable SSH host-key checking to get past this safety requirement.

Then publish only the committed `telecom-core/` subtree (no other platform source, `.git` history, untracked local secrets, or uncommitted files):

```bash
bash telecom-core/oci/publish-source.sh PUBLIC_IP
```

Replace `PUBLIC_IP` with the actual instance public IPv4 from Terraform. This command refuses to overwrite an existing `/opt/IAMMagnanimousway.js` installation. If a deployment already exists, use a reviewed upgrade/backup process instead. It runs the Telecom read-only preflight after copying source and records output in `/home/ubuntu/oci-telecom-preflight.txt`.

The upload is not the final telecom activation: TLS, secrets, SIP/carrier readiness, external WebRTC proof, and regulatory gates are still required.

## After creation

Use the Terraform `public_ip` output for the Telecom hostname A record. Then administer the host from Cloud Shell with the private key printed by the helper, for example:

```bash
ssh -i ~/.ssh/magnanimous_oci_ed25519 ubuntu@PUBLIC_IP
```

After running `publish-source.sh`, on the host:

1. rerun `telecom-core/deploy/oci-always-free-preflight.sh`;
2. run `bootstrap-public-host.sh` with DNS, ACME email and the same restricted SSH CIDR;
3. configure protected Telecom Core secrets;
4. sync trusted TLS;
5. start Asterisk/Kamailio/control API (and TURN only when intentionally enabled);
6. run **Public Telecom WebRTC Verification** from GitHub.

Do not enable `TELECOM_NATIVE_WEBRTC_LIVE` until the external browser/WSS/two-way-RTP proof passes.
