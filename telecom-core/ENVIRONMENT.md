# Telecom Core runtime configuration

Create a local `.env` file on the telecom server. Do not commit it.

Required names:

- `TELECOM_API_TOKEN` — bearer token shared only with the Magnanimous Worker.
- `TELECOM_WEBHOOK_SECRET` — secret used for trusted call-event callbacks.
- `ASTERISK_ARI_USER` — private Asterisk REST Interface user.
- `ASTERISK_ARI_PASSWORD` — private Asterisk REST Interface password.
- `MAGNANIMOUS_AI_PASSWORD` — SIP credential for the Magnanimous AI endpoint.
- `MAGNANIMOUS_ADMIN_PASSWORD` — SIP credential for the owner/admin endpoint.

Optional/defaulted names:

- `ASTERISK_ARI_URL` — defaults to `http://127.0.0.1:8088/ari`.
- `MAGNANIMOUS_AI_EXTENSION` — defaults to `9000`.
- `MAGNANIMOUS_ADMIN_EXTENSION` — defaults to `1000`.
- `MAGNANIMOUS_CALLER_ID` — assigned public E.164 number after a DID exists.
- `TELECOM_PUBLIC_IP` — public address of the SIP server when NAT-aware routing needs it.

Replaceable PSTN interconnect names:

- `PSTN_TRUNK_HOST`
- `PSTN_TRUNK_PORT` — defaults to `5060`.
- `PSTN_TRUNK_USERNAME`
- `PSTN_TRUNK_PASSWORD`
- `PSTN_TRUNK_FROM_DOMAIN`

When `PSTN_TRUNK_HOST` is empty, the server starts without a public PSTN trunk. Internal Magnanimous SIP service remains independent of the external interconnect.

## Worker-side regulated-network bindings

Store these in encrypted Worker runtime secrets/variables, never in GitHub or D1 metadata tables.

### Telnyx wholesale bridge

- `TELNYX_API_KEY` — enables Magnanimous owner-side Telnyx number/SIM/eSIM/E911 adapter calls.
- Telnyx remains replaceable infrastructure. Do not expose it as Magnanimous Telecom's public identity.

### Gigs mobile/MVNO alternative

- `GIGS_API_TOKEN`
- `GIGS_PROJECT_ID`

### Consequential-action locks

- `TELECOM_PURCHASE_ACTIONS_ENABLED=true` — permits owner-confirmed paid actions such as ordering a number or purchasing eSIM profiles. Leave false/unset until intentionally enabled.
- `TELECOM_REGULATED_ACTIONS_ENABLED=true` — permits owner-confirmed regulated provisioning actions such as creating emergency-service address records. Leave false/unset until the applicable compliance path is ready.

Every paid action must still include `confirm_purchase=true` in that individual request. Every regulated action must include `confirm_regulated_action=true`. The environment flag alone is never sufficient authorization.

### Existing authority gates

- `TELECOM_EMERGENCY_LIVE=true` only after emergency routing and registered-location behavior are configured and tested.
- `TELECOM_DIRECT_NUMBERING_AUTHORIZED=true` only after direct numbering authorization actually exists.
- `TELECOM_CARRIER_AUTHORIZED=true` only after the applicable carrier/facilities authorization actually exists.

These flags describe verified external authority/readiness; they do not create that authority.
