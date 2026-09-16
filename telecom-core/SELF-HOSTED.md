# Magnanimous Telecom — owner-hosted deployment

Magnanimous Telecom can run on hardware owned by Magnanimous instead of a cloud VPS. DigitalOcean is only one replaceable hosting option.

## What your own server replaces

An owner-hosted Linux server can replace the VPS functions that DigitalOcean provides:

- CPU and memory for Asterisk, Docker and the Magnanimous Telecom control API
- local SSD storage for service data and logs
- SIP/PBX processing and RTP media handling
- public HTTPS endpoint for the Telecom API
- SSH administration
- persistent service uptime under your own control

The exact same `telecom-core/docker-compose.yml` stack is used so moving between DigitalOcean and owner-owned hardware does not create a second telecom system.

## Minimum starter hardware

For light traffic, match or exceed the current $12 cloud profile:

- 1 modern CPU core or better
- 2 GB RAM minimum; 4 GB recommended for growth
- 50 GB SSD or better
- 64-bit Linux, preferably Ubuntu 24.04 LTS or another supported Docker host
- wired Ethernet preferred
- UPS/battery backup strongly recommended

## Internet requirements

Owning the computer does not automatically provide carrier-grade internet. For public SIP/PSTN service, the site should have:

- a stable public IPv4 address, or a properly tested static NAT/port-forwarding arrangement
- no carrier-grade NAT for the public SIP edge unless an SBC/tunnel architecture is deliberately used
- reliable upload bandwidth and low jitter/packet loss
- router/firewall control for SIP and RTP
- redundant internet when the service becomes customer-facing or business-critical

Required network paths remain:

- SIP UDP/TCP 5060 only where required and restricted by source when possible
- RTP UDP 10000-20000
- Telecom API behind HTTPS
- Asterisk ARI 8088 private/loopback only

## Deployment contract

1. Install Docker Engine and Docker Compose on the server.
2. Clone the Magnanimous repository.
3. Enter `telecom-core/`.
4. Create the private `.env` described in `ENVIRONMENT.md`.
5. Set `TELECOM_PUBLIC_IP` to the public address used for SIP media/NAT awareness.
6. Start the same stack with `docker compose up -d --build`.
7. Confirm the Telecom API `/health` endpoint reports Asterisk ready.
8. Put the control API behind HTTPS and restrict administration.
9. Point the existing Magnanimous Worker `VOIP_PROVIDER_URL` at this owner-hosted server.

## Hybrid mode

The architecture supports a useful transition mode:

- Primary: owner-owned Magnanimous Telecom server.
- Backup/failover: the $12 Singapore DigitalOcean node.

This preserves a low-cost cloud recovery path while gradually reducing dependence on third-party hosting. Do not advertise automatic failover until it has actually been configured and tested.

## What an owner-hosted server does not replace

The server can replace the VPS, but it does not by itself replace regulated telecom resources. Until Magnanimous has the relevant authorizations and interconnections, these remain external/replaceable inputs:

- public PSTN telephone numbers
- carrier/PSTN interconnect
- SIM/eSIM network profiles and mobile-core access
- emergency calling/location services
- number portability infrastructure
- jurisdiction-specific carrier or VoIP authorizations

Magnanimous remains the public identity and control layer while those external resources are abstracted behind the Telecom platform.
