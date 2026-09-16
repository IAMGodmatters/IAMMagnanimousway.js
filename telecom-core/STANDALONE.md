# Magnanimous Telecom — integrated + standalone architecture

Magnanimous Telecom is a standalone communications service **and** a first-class part of I AM MAGNANIMOUS WAY™.

## Identity contract

- Public telecom identity: **Magnanimous Telecom**.
- Parent brand: **I AM MAGNANIMOUS WAY™**.
- Reasoning, orchestration and command layer: **Magnanimous AI**.
- Outside AI engines, cloud hosts, SIP trunks, numbering vendors, emergency-service vendors and carriers are replaceable execution/infrastructure dependencies.
- Do not show underlying provider names in ordinary customer-facing UI.
- Magnanimous memory and customer continuity stay in Magnanimous-owned application/data layers, not in replaceable providers.

## Two surfaces, one system

### Integrated platform surface

`/telecom` is part of the existing I AM MAGNANIMOUS WAY™ application and links directly to:

- Phone & Call Center
- Softphone
- AI Receptionist
- Auto Dialer
- Universal Connector
- Business Operations

### Standalone service surface

The same `/telecom` build is intentionally domain-ready. A future dedicated hostname such as a Magnanimous-owned telecom subdomain/domain can route to this surface without creating a second brain or separate customer-memory silo.

A standalone hostname must still use the same authenticated Magnanimous Worker APIs and the same Magnanimous AI command layer.

## Carrier-growth foundation

The additive telecom schema reserves first-party control for:

1. telephone-number inventory and lifecycle;
2. replaceable interconnect metadata;
3. number-porting workflow records;
4. emergency-location readiness records;
5. STIR/SHAKEN readiness metadata;
6. call usage/rating ledger;
7. jurisdiction/compliance controls.

Secrets for trunks or providers must **not** be stored in these metadata tables. Store only secret-binding names/references and keep actual credentials in encrypted runtime secret storage.

## Hard safety/readiness gates

Software capability is not the same thing as regulatory authority.

The runtime therefore keeps these capabilities false until explicitly configured and verified:

- public PSTN bridge + assigned public number;
- emergency/E911 calling;
- direct numbering authority;
- direct carrier/facilities authority.

Never market a gated capability as live merely because the code contains support for it.

## Deployment split

Cloudflare remains suitable for the web/control plane. SIP/RTP media remains on the Magnanimous Telecom server because standard Cloudflare Workers are not a SIP/RTP media server.

Recommended service boundary:

- Web/customer/control plane: existing Magnanimous Worker + frontend.
- Telecom control API: `telecom-core/control-api`.
- SIP/PBX/media: Asterisk now; SBC/Kamailio/RTPengine can be added as scale requires.
- PSTN/numbering/emergency interconnects: replaceable adapters until Magnanimous obtains whatever direct authority is required in each jurisdiction.

## Environment readiness flags

The Worker telecom overview recognizes these explicit gates:

- `TELECOM_EMERGENCY_LIVE=true` only after emergency routing/location service is configured and tested.
- `TELECOM_DIRECT_NUMBERING_AUTHORIZED=true` only after direct numbering authority actually exists.
- `TELECOM_CARRIER_AUTHORIZED=true` only after the applicable carrier/facilities authorization actually exists.

Existing Magnanimous carrier bridge variables continue to determine ordinary PSTN readiness:

- `VOIP_PROVIDER_URL`
- `VOIP_PROVIDER_TOKEN`
- `VOIP_CALLER_ID`
- `VOIP_WEBHOOK_SECRET`

These names are internal configuration details. Customer-facing UI continues to identify the service as Magnanimous Telecom.
