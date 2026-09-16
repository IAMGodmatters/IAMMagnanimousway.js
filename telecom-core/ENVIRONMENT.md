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
