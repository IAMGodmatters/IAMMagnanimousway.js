# Magnanimous Telecom Core

Magnanimous Telecom Core is the self-hosted telephony foundation for I AM MAGNANIMOUS WAY™.

## Ownership model

Magnanimous owns and controls the application, SIP/PBX configuration, call routing, extensions, call records, AI routing, policy, authentication, and provider abstraction. External telephone networks and infrastructure hosts are treated only as replaceable interconnects or hosting resources.

A public PSTN telephone number is a regulated numbering resource, not a number software can mint. Until Magnanimous has direct numbering authorization and interconnection, a PSTN trunk/numbering partner supplies the public DID while Magnanimous still operates the server and customer-facing service. The trunk can later be replaced without changing the Magnanimous API or user experience.

## Hosting choices

The same Telecom Core stack can run in either place without creating a second system:

- **Owner-hosted server** — hardware owned and operated by Magnanimous. See `SELF-HOSTED.md`.
- **Singapore cloud starter** — DigitalOcean `sgp1`, size `s-1vcpu-2gb`, currently listed at $12/month. See `DIGITALOCEAN.md`.

DigitalOcean is not required for Magnanimous Telecom. It is a convenient low-cost cloud node and can later serve as a backup/failover host while an owner-owned server becomes primary.

## Components

- **Asterisk 22** — self-hosted SIP/PJSIP PBX, registrar, dialplan and media routing.
- **Magnanimous Telecom API** — provider-neutral FastAPI control plane used by the existing `VOIP_PROVIDER_URL` bridge in the Cloudflare Worker.
- **Magnanimous AI route** — reserved SIP extension/context for connecting calls to the Magnanimous voice agent.
- **PSTN trunk adapter** — replaceable SIP interconnect. No third-party carrier is exposed as the public identity.
- **Native WebRTC edge (software-media verified, public-host gated)** — Asterisk WSS + DTLS-SRTP + ICE + RTCP mux + Opus is proven with real Chromium/SIP.js registration and bidirectional RTP through the owned Asterisk `Echo()` path in CI. It is still not advertised as public-production live until the same proof passes on a dedicated public Telecom Core host with trusted public TLS and the real network/NAT path.

## Worker integration

The existing Worker already POSTs the following payload to `VOIP_PROVIDER_URL`:

```json
{
  "call_id": 123,
  "tenant_id": "tenant",
  "to": "+15551234567",
  "from": "+15557654321",
  "agent_id": null,
  "queue_id": null,
  "webhook_url": "https://iammagnanimousway.com/api/phone/webhook"
}
```

Set these Worker secrets/variables after the Telecom Core is deployed:

```text
VOIP_PROVIDER_NAME=Magnanimous Telecom
VOIP_PROVIDER_URL=https://telecom.example.com/v1/calls
VOIP_PROVIDER_TOKEN=<same value as TELECOM_API_TOKEN>
VOIP_CALLER_ID=<assigned Magnanimous DID>
VOIP_WEBHOOK_SECRET=<shared webhook secret>
```

The control API returns a `provider_call_id` and status in the same contract expected by the existing Worker.

## Network requirements

Deploy on a Linux VM or owner-owned Linux server with a stable public IPv4 address. Allow only the required ports:

- UDP/TCP 5060 for SIP (restrict by source where possible)
- UDP 10000-20000 for RTP
- TCP 8080 for the Telecom API, preferably behind HTTPS/reverse proxy and firewall rules
- Asterisk ARI on 8088 remains loopback/private and must not be exposed publicly
- TCP 8089 for Asterisk secure WebSocket signaling only when `ASTERISK_WEBRTC_ENABLED=true` and a trusted TLS certificate/key are mounted
- STUN is optional and explicitly configured; TURN should be added where restrictive NAT requires relay media
- WSS/WebRTC remains disabled by default and must not be called live until browser registration + two-way audio are verified

## Start

1. Choose owner-hosted (`SELF-HOSTED.md`) or cloud (`DIGITALOCEAN.md`).
2. Create a local `.env` on the telecom server using `ENVIRONMENT.md`. Never commit it.
3. Configure strong random API, ARI and SIP credentials on that server.
4. Configure the SIP trunk values only when a real interconnect/numbering partner or direct carrier interconnect exists.
5. Run `docker compose up -d --build` on the telecom server.
6. Verify `GET /health` on the Telecom API.
7. Put the Telecom API behind HTTPS and restrict management access.
8. Point the existing Worker `VOIP_PROVIDER_URL` to `/v1/calls`.
9. Set `VOIP_CALLER_ID` only to a number Magnanimous is actually authorized to present.

## Native browser-agent WebRTC readiness

The owned browser-media target is Asterisk, not a permanent third-party browser Voice SDK dependency.

Source readiness includes:

- secure SIP-over-WebSocket transport (`WSS`);
- `webrtc=yes` PJSIP endpoint behavior;
- DTLS-SRTP media;
- ICE and RTCP multiplexing;
- Opus with G.711 fallbacks;
- explicit TLS certificate/key startup gates;
- optional STUN instead of a hard-coded public dependency;
- a protected control-API `/v1/webrtc` readiness contract.

The existing compatibility browser carrier path remains available while the native rail is being deployed. The repository now includes a strict `Native WebRTC Browser Media E2E` workflow that runs real Chromium against the actual Asterisk image, verifies server-side registration, establishes the authenticated echo call, and requires RTP bytes/packets in both directions plus a remote audio track. Set `TELECOM_NATIVE_WEBRTC_LIVE=true` in the platform runtime only after that same proof is repeated on the native public telecom host with a trusted public WSS endpoint and real-network/NAT media.
## Emergency calling

The dialplan intentionally does not advertise or provide 911/E911 service yet. Emergency calling must remain disabled until compliant emergency-routing and registered-location services are integrated and tested.

## Growth path

Phase 1 is a self-hosted PBX/provider control plane with a replaceable PSTN interconnect. Phase 2 adds Kamailio/SBC and RTPengine for multi-node scale. Phase 3 adds STIR/SHAKEN signing, E911/location services, LNP, fraud controls, SIM/eSIM/MVNO integrations and provider compliance. Phase 4, after regulatory authorization, can request numbering resources directly and reduce dependency on numbering and mobile-network partners.
