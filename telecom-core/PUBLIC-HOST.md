# Magnanimous Telecom Core — public host activation

This phase turns the already verified native Chromium↔Asterisk software path into a real Internet/NAT-tested path. It does **not** require enabling PSTN service or buying a phone number.

## Truth boundary

The repository already proves real Chromium registration and two-way RTP against the actual Asterisk image in CI. Public-production WebRTC remains gated until the same proof passes from an external GitHub-hosted runner to a dedicated public Telecom Core host using a trusted certificate.

Do not set `TELECOM_NATIVE_WEBRTC_LIVE=true` before the public verification workflow succeeds.

## Host requirements

Use a dedicated Linux host with:

- stable public IPv4;
- DNS hostname such as `telecom.example.com`;
- TCP 8089 reachable for WSS;
- UDP 10000-20000 reachable for RTP;
- TCP 80 temporarily reachable for ACME HTTP-01 renewal;
- no CGNAT unless a deliberately tested relay/SBC architecture is used.

SIP/PSTN port 5060 does **not** need to be opened just to prove native browser WebRTC. Keep unnecessary telecom ports closed.

### Additive TURN/TLS relay alternative

If the hosting edge cannot expose public UDP RTP directly, Magnanimous may use an owned TURN relay as an additive media path instead of weakening the production truth gate. The browser may reach TURN over TCP/TLS while the TURN relay forwards media to Asterisk over a network path Asterisk can actually reach. coturn supports TURN over TCP/TLS and time-limited REST credentials.

The Telecom Core supports this without exposing the long-term TURN secret to the browser:

- set `MAGNANIMOUS_TURN_URLS` to one or more `turn:` / `turns:` URLs;
- set the server-only `MAGNANIMOUS_TURN_AUTH_SECRET` to the same shared secret configured in coturn;
- optionally set `MAGNANIMOUS_TURN_FORCE_RELAY=true` only when the relay topology is intentionally required and externally verified.

Each browser SIP session receives only a timestamped temporary username and HMAC-derived temporary TURN credential. Relay-only mode fails closed when TURN is absent or malformed.

The repository also includes an opt-in owned coturn runtime. It is disabled in normal Compose startup and only starts with the explicit profile:

```bash
docker compose --profile turn-relay up -d turn-relay
```

Before starting it, set the TURN realm, shared auth secret, TLS certificate/key paths, and relay port range in `telecom-core/.env`. The coturn image is pinned to `4.18.0-r0`; its runtime disables anonymous access, disables UDP client listeners for the TCP/TLS-first browser path, keeps UDP relay endpoints available for media forwarding, and refuses startup when the TLS files or shared secret are missing.

For a dedicated public Linux host, set `ENABLE_TURN_RELAY=true` during the safe firewall bootstrap only when this relay is intentionally being deployed. That opens the configured TURN TLS/TCP listener and relay UDP range in addition to the existing Asterisk rules. Leave it false otherwise.

Railway can expose a raw TCP service through TCP Proxy and its private network supports UDP between services. That makes a future **separate** TURN-over-TCP/TLS edge plus private-UDP Asterisk topology technically testable, but it is not enabled here and it would require creating/configuring telecom-specific Railway services. Do not create those services or incur additional runtime cost without the existing paid-resource approval gate.

This source support does **not** make Railway, coturn, or any relay production-live. A relay deployment must still prove trusted signaling plus real bidirectional browser media from an external network before `TELECOM_NATIVE_WEBRTC_LIVE=true`.

## Free-first Oracle Cloud A1 path

For a no-recurring-VPS-cost activation target, the repository now has a guarded Oracle Cloud Always Free A1 path in `OCI-ALWAYS-FREE-HOST.md` plus `deploy/oci-always-free-preflight.sh`.

That path is intentionally restricted to `VM.Standard.A1.Flex`, ARM64, at least 2 OCPUs, at least 8 GiB RAM, Ubuntu/Debian, and a globally routable public IPv4. A dedicated GitHub ARM64 workflow builds the exact Asterisk, Kamailio, control API, coturn and PostgreSQL stack before OCI A1 compatibility is treated as source-ready.

Oracle account creation and any required phone/card verification remain user-only external steps. Do not upgrade to a paid OCI resource or silently select a paid shape when Always Free A1 capacity is unavailable.

This free-first option does not weaken the production truth gate: external public Chromium verification is still required before `TELECOM_NATIVE_WEBRTC_LIVE=true`.

## Safe bootstrap

On the chosen host:

```bash
export TELECOM_DOMAIN=telecom.example.com
export ACME_EMAIL=owner@example.com
export ADMIN_SSH_CIDR=203.0.113.20/32
export ENABLE_UFW=true
sudo -E bash ./telecom-core/deploy/bootstrap-public-host.sh
```

The script refuses to enable UFW unless an explicit admin SSH CIDR is supplied.

Then create `telecom-core/.env` from `.env.owned.example` and set at minimum:

```text
MAGNANIMOUS_SIP_DOMAIN=telecom.example.com
TELECOM_PUBLIC_IP=<host-public-ip>
ASTERISK_WEBRTC_ENABLED=true
ASTERISK_WEBRTC_PUBLIC_URL=wss://telecom.example.com:8089/ws
ASTERISK_CERTS_DIR=/opt/magnanimous-telecom/certs
MAGNANIMOUS_WEBRTC_PASSWORD=<long-random-secret>
```

Keep all other required API/ARI/SIP credentials private on the host.

## Certificate sync and startup

After Certbot has issued the certificate:

```bash
export TELECOM_DOMAIN=telecom.example.com
export MAGNANIMOUS_REPO_PATH=/path/to/IAMMagnanimousway.js
export TELECOM_CERTS_DIR=/opt/magnanimous-telecom/certs
sudo -E bash ./telecom-core/deploy/sync-public-tls.sh
```

The host copy of `privkey.pem` remains mode `0600`. The Asterisk container entrypoint copies the key into a private Asterisk-owned runtime directory before the PBX drops privileges.

For renewal, configure Certbot to call the same sync script as a deploy hook after a successful renewal.

## External real-network proof

Configure these GitHub repository variables:

- `TELECOM_PUBLIC_WSS_URL` — for example `wss://telecom.example.com:8089/ws`
- `TELECOM_PUBLIC_SIP_DOMAIN` — for example `telecom.example.com`
- `TELECOM_PUBLIC_WEBRTC_EXTENSION` — normally `1100`
- `TELECOM_PUBLIC_ECHO_EXTENSION` — normally `6000`

Configure this GitHub repository secret:

- `TELECOM_PUBLIC_WEBRTC_PASSWORD`

For a TURN/relay verification, also configure:

- repository variable `TELECOM_PUBLIC_TURN_URLS` with one or more comma-separated `turns:` URLs;
- repository secret `TELECOM_PUBLIC_TURN_AUTH_SECRET` with the same server-side coturn REST shared secret used by the relay;
- repository variable `TELECOM_PUBLIC_ICE_TRANSPORT_POLICY=relay` to force relay-only ICE during the proof.

The workflow derives a fresh 15-minute TURN credential on the GitHub runner, verifies every TURN TLS hostname/chain, and sends only the temporary credential to Chromium. The long-term TURN secret is never embedded in the browser probe.

Then manually run **Public Telecom WebRTC Verification**.

That workflow:

1. resolves the hostname and refuses local/private/CGNAT targets;
2. verifies the public TLS chain with hostname verification and no certificate bypass;
3. launches real Chromium on a GitHub-hosted machine outside the telecom host;
4. registers the SIP endpoint over public WSS;
5. establishes the authenticated Asterisk `Echo()` call;
6. requires inbound and outbound RTP bytes/packets plus a remote audio track.

Only a successful result from that workflow is sufficient evidence to promote `TELECOM_NATIVE_WEBRTC_LIVE=true`. If TURN relay mode is used, the proof must run with the same ICE/TURN policy that production browsers receive; a direct-media success does not validate a relay-only deployment.

## Compatibility fallback

The existing compatibility softphone remains available until the public native rail has passed the external proof and a secure production browser-credential strategy is active. Do not remove it during migration.
