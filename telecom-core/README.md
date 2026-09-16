# Magnanimous Telecom Core

Magnanimous Telecom Core is the self-hosted telephony foundation for I AM MAGNANIMOUS WAY™.

## Ownership model

Magnanimous owns and controls the application, SIP/PBX configuration, call routing, extensions, WebRTC endpoints, call records, AI routing, policy, authentication, and provider abstraction. External networks are treated only as replaceable interconnects.

A public PSTN telephone number is a regulated numbering resource, not a number software can mint. Until Magnanimous has direct numbering authorization and interconnection, a PSTN trunk/numbering partner supplies the public DID while Magnanimous still operates the server and customer-facing service. The trunk can later be replaced without changing the Magnanimous API or user experience.

## Components

- **Asterisk 22** — SIP/PJSIP PBX, registrar, dialplan, WebRTC transport and media routing.
- **Magnanimous Telecom API** — provider-neutral FastAPI control plane used by the existing `VOIP_PROVIDER_URL` bridge in the Cloudflare Worker.
- **Magnanimous AI route** — reserved extension/context for connecting calls to the Magnanimous voice agent.
- **PSTN trunk adapter** — replaceable SIP interconnect. No third-party carrier is exposed as the public identity.

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

Deploy on a Linux VM with a stable public IPv4 address. Allow only the required ports:

- UDP/TCP 5060 for SIP (restrict by source where possible)
- UDP 10000-20000 for RTP
- TCP 8089 for WSS/WebRTC only when TLS is configured
- TCP 8080 for the Telecom API, preferably behind HTTPS/reverse proxy
- Asterisk ARI on 8088 should remain private/local and must not be exposed publicly

## Start

1. Copy `.env.example` to `.env` and replace every placeholder.
2. Put TLS certificates in `./certs/fullchain.pem` and `./certs/privkey.pem` if using browser WebRTC.
3. Configure the SIP trunk values provided by your current interconnect/numbering partner.
4. Run `docker compose up -d --build` on the telecom VM.
5. Verify `GET /health` on the Telecom API.
6. Point the existing Worker `VOIP_PROVIDER_URL` to `/v1/calls`.

## Growth path

Phase 1 is a self-hosted PBX/provider control plane with a replaceable PSTN interconnect. Phase 2 adds Kamailio/SBC and RTPengine for multi-node scale. Phase 3 adds STIR/SHAKEN signing, E911/location services, LNP, fraud controls and provider compliance. Phase 4, after regulatory authorization, can request numbering resources directly and reduce dependency on a numbering partner.
