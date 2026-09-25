# Magnanimous-Owned SIP / PSTN Core

Magnanimous Telecom now has an owned SIP control plane that can run on infrastructure controlled by Magnanimous instead of depending on a hosted SIP account portal.

## What Magnanimous owns

- **SIP registrar and proxy:** Kamailio, self-hosted as `sip-core`.
- **SIP subscriber identities:** private PostgreSQL database `sip-db`.
- **PBX, media anchoring, dialplan and carrier routing:** self-hosted Asterisk.
- **SIP account lifecycle:** protected Telecom Control API endpoints.
- **Call policy and public identity:** Magnanimous Telecom.
- **AI routing and application logic:** Magnanimous.

Kamailio 6.0.7 is installed from the Kamailio project package repository and is an open-source protocol engine running on Magnanimous-controlled infrastructure. It is not a hosted telecom provider and does not own customer identity, routing policy, subscriber data, or Magnanimous memory.

## What still requires an external legal/network boundary

A server cannot create public telephone-number rights or PSTN interconnection authority by itself. Until Magnanimous obtains direct numbering/interconnection authority, public PSTN calling still needs an authorized interconnect source (for example, a SIP trunk or direct carrier agreement). That interconnect is deliberately isolated behind the existing `CarrierBridge` and Asterisk trunk configuration so it can be replaced without changing the Magnanimous SIP/PBX core.

SIM/eSIM issuance, emergency calling, lawful-intercept obligations, number portability, and regulated carrier functions must not be represented as active unless the corresponding legal/network capability is actually configured and verified.

## Network layout

```text
SIP phone / softphone
        |
        | SIP UDP/TCP 5060
        v
Magnanimous SIP Core (Kamailio)
        |
        | loopback SIP
        v
Magnanimous PBX / media (Asterisk :5070)
        |
        +----> Magnanimous AI / internal extensions
        |
        +----> CarrierBridge ----> authorized PSTN interconnect (replaceable)

Magnanimous SIP Core ----> local-only PostgreSQL :5433
Magnanimous Control API -> local-only PostgreSQL :5433
```

Every authenticated subscriber call is sent through Asterisk before delivery. This keeps dial policy, media anchoring, AI routing, CDR behavior and PSTN controls centralized under Magnanimous.

## SIP account API

All endpoints require the existing Telecom bearer token.

- `GET /v1/sip` — owned SIP-core identity and configuration summary.
- `GET /v1/sip/health` — registrar/database readiness summary.
- `GET /v1/sip/accounts` — list owned SIP accounts without credentials.
- `POST /v1/sip/accounts` — create a SIP account. A strong password is generated if one is not supplied.
- `DELETE /v1/sip/accounts/{username}` — revoke a SIP account.

Example account creation body:

```json
{"username":"2001"}
```

The response returns the generated password once. The cleartext password is not stored in PostgreSQL; the service stores SIP Digest HA1 material required by the registrar.

## Required deployment variables

Start from `telecom-core/.env.owned.example` and provide real secrets outside Git.

At minimum:

- `MAGNANIMOUS_SIP_DOMAIN`
- `SIP_DB_PASSWORD`
- `TELECOM_API_TOKEN`
- `TELECOM_WEBHOOK_SECRET`
- `ASTERISK_ARI_USER`
- `ASTERISK_ARI_PASSWORD`
- `MAGNANIMOUS_ADMIN_PASSWORD`
- `MAGNANIMOUS_AI_PASSWORD`

The external `CARRIER_SIP_*` values may remain blank while operating SIP-only service. Public PSTN calling will not work until a real authorized interconnect is configured.

## Authenticated carrier route control

The private Telecom Control API keeps automatic route-planner execution disabled, but it can now address the owned Asterisk interconnects explicitly:

- `GET /v1/carrier/routes` — lists the logical `auto`, `primary`, and `secondary` routes without exposing a third-party provider identity.
- `GET /v1/carrier/routes/{route_id}/health` — checks the selected route against authenticated ARI state.
- `POST /v1/calls` accepts `route_id`: `auto` preserves the existing network-failure-only secondary failover, `primary` forbids automatic carrier failover, and `secondary` uses only the configured secondary endpoint.
- A `secondary` request fails closed when no secondary interconnect is configured.

The platform may expose this route selection only to owner/admin controls. Magnanimous does not allow the route planner to move production calls automatically until every executable route is authenticated, configured, and production-verified.

## Host firewall contract

For an internet-facing host:

- expose SIP `5060/udp` and, when desired, `5060/tcp` to subscriber networks;
- expose RTP `10000-20000/udp` for Asterisk media;
- restrict Asterisk SIP `5070/udp`/`5070/tcp` to approved carrier/interconnect source networks whenever possible;
- keep PostgreSQL `5433` bound to loopback only;
- keep Asterisk ARI `8088` private/loopback only;
- put the Telecom Control API behind HTTPS and never expose its bearer token in a client bundle;
- do not advertise emergency calling until a compliant emergency-services path is configured and tested.

## Start locally or on an owned server

```bash
cd telecom-core
cp .env.owned.example .env
# replace every CHANGE_ME value and set your real SIP domain
docker compose config -q
docker compose up -d --build
```

Then create a SIP subscriber through the protected control API and configure a softphone with:

- SIP server/domain: value of `MAGNANIMOUS_SIP_DOMAIN`
- port: `5060`
- transport: UDP or TCP
- username/password: returned by `POST /v1/sip/accounts`

## Architecture rules

The implementation follows the Magnanimous engineering standard:

- SIP protocol transport, subscriber storage, account lifecycle and call routing are separate responsibilities.
- Services depend on ports/protocols, with concrete PostgreSQL/carrier implementations assembled in the composition root.
- Public PSTN interconnect is an adapter, not the identity or brain.
- Existing Asterisk/CarrierBridge behavior is preserved while the new owned SIP path is added.
