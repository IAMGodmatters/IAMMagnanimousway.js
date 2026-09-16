# Magnanimous Telecom Core

Magnanimous Telecom Core is the self-hosted telephony foundation for I AM MAGNANIMOUS WAY™.

## Ownership model

Magnanimous owns and controls the application, SIP/PBX configuration, call routing, extensions, call records, AI routing, policy, authentication, and provider abstraction. External telephone networks are treated only as replaceable interconnects.

A public PSTN telephone number is a regulated numbering resource, not a number software can mint. Until Magnanimous has direct numbering authorization and interconnection, a PSTN trunk/numbering partner supplies the public DID while Magnanimous still operates the server and customer-facing service. The trunk can later be replaced without changing the Magnanimous API or user experience.

## Components

- **Asterisk 22** — self-hosted SIP/PJSIP PBX, registrar, dialplan and media routing.
- **Magnanimous Telecom API** — provider-neutral FastAPI control plane used by the existing `VOIP_PROVIDER_URL` bridge in the Cloudflare Worker.
- **Magnanimous AI route** — reserved SIP extension/context for connecting calls to the Magnanimous voice agent.
- **PSTN trunk adapter** — replaceable SIP interconnect. No third-party carrier is exposed as the public identity.
- **Future WebRTC edge** — browser calling is deliberately not advertised as ready until WSS/TLS/TURN are deployed and tested.

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
- TCP 8080 for the Telecom API, preferably behind HTTPS/reverse proxy and firewall rules
- Asterisk ARI on 8088 remains loopback/private and must not be exposed publicly
- WSS/WebRTC is not opened until TLS/TURN hardening is completed

## Start

1. Create a local `.env` on the telecom VM using `ENVIRONMENT.md`. Never commit it.
2. Configure strong random API, ARI and SIP credentials on that server.
3. Configure the SIP trunk values only when a real interconnect/numbering partner or direct carrier interconnect exists.
4. Run `docker compose up -d --build` on the telecom VM.
5. Verify `GET /health` on the Telecom API.
6. Put the Telecom API behind HTTPS and restrict management access.
7. Point the existing Worker `VOIP_PROVIDER_URL` to `/v1/calls`.
8. Set `VOIP_CALLER_ID` only to a number Magnanimous is actually authorized to present.

## Emergency calling

The dialplan intentionally does not advertise or provide 911/E911 service yet. Emergency calling must remain disabled until compliant emergency-routing and registered-location services are integrated and tested.

## Growth path

Phase 1 is a self-hosted PBX/provider control plane with a replaceable PSTN interconnect. Phase 2 adds Kamailio/SBC and RTPengine for multi-node scale. Phase 3 adds STIR/SHAKEN signing, E911/location services, LNP, fraud controls and provider compliance. Phase 4, after regulatory authorization, can request numbering resources directly and reduce dependency on a numbering partner.
