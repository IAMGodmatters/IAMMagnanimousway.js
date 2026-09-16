# DigitalOcean deployment profile for Magnanimous Telecom Core

DigitalOcean is a replaceable infrastructure host for Magnanimous Telecom Core. It is not the public identity, carrier brand, or owner of Magnanimous call routing, data, or AI logic.

## Recommended starter shape

- Region: `sgp1` (Singapore)
- Size: `s-1vcpu-2gb`
- Memory: 2 GB
- vCPU: 1
- Disk: 50 GB
- Listed price at configuration time: $12/month
- Backups: optional; leave off initially to avoid extra charges unless explicitly enabled
- Monitoring: enabled when provisioning

This is the minimum practical shape recommended for Asterisk, Docker, the Magnanimous Telecom FastAPI control service, logs, and light call traffic. The architecture remains portable to another VPS or bare-metal host.

## Security model

- Keep Asterisk ARI bound privately/local-only.
- Expose SIP only where required and restrict source networks when possible.
- Expose RTP UDP 10000-20000 for media.
- Put the Magnanimous Telecom API behind HTTPS.
- Never commit API tokens, SIP credentials, ARI passwords, TLS private keys, or SSH private keys to GitHub.
- Do not enable emergency calling until a real E911/location path is configured and tested.

## Persistent administration prerequisite

Before provisioning, add an SSH public key whose matching private key is retained by the Magnanimous owner/admin. Do not provision production infrastructure using an ephemeral private key that exists only in an automation session.

## Public phone number reality

The server can be fully owned and operated by Magnanimous, including PBX, extensions, WebRTC/SIP endpoints, call routing, AI routing, records, policy, and provider abstraction. A routable PSTN number still requires an authorized numbering/interconnect source until Magnanimous obtains direct numbering and carrier/interconnection authority. That upstream resource remains replaceable and hidden behind the Magnanimous Telecom abstraction.
