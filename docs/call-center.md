# I AM Phone and Call Center

The platform has two calling layers:

1. **I AM Internet Phone** — free browser-to-browser audio between signed-in I AM users using WebRTC.
2. **Carrier bridge** — optional mobile and landline calling through a compatible telephony provider.

## Included call-center features

- agent presence: available, busy, break, and offline
- call queues with longest-idle, round-robin, or priority strategies
- browser-call session signaling and automatic call records
- outbound public-number dialer when a carrier bridge is configured
- carrier status webhooks
- assignments, call duration, notes, and dispositions
- tenant-separated call-center data

## Carrier bridge configuration

Store these values as Cloudflare secrets or deployment variables. Never place tokens in frontend code.

```text
VOIP_PROVIDER_NAME=
VOIP_PROVIDER_URL=
VOIP_PROVIDER_TOKEN=
VOIP_WEBHOOK_SECRET=
VOIP_CALLER_ID=
```

The platform sends an authenticated JSON `POST` to `VOIP_PROVIDER_URL`:

```json
{
  "call_id": 123,
  "tenant_id": "tenant-id",
  "to": "+15551234567",
  "from": "+15557654321",
  "agent_id": "agent-id-or-null",
  "queue_id": "queue-id-or-null",
  "webhook_url": "https://iammagnanimousway.com/api/phone/webhook"
}
```

The bridge must return JSON containing a durable call identifier:

```json
{
  "provider_call_id": "provider-call-id",
  "status": "dialing"
}
```

Send call updates to the supplied webhook URL with the `x-iam-webhook-secret` header. The JSON body should contain `provider_call_id`, `status`, and optionally `event_type`, `detail`, or `recording_url`.

## Cost and compliance

Browser-to-browser calls use the free Internet-phone layer. Calls to ordinary phone numbers require a carrier account, an assigned caller ID, and the carrier's usage charges. Before automated outreach or recording, obtain required consent and follow do-not-call, recording, privacy, and local telemarketing rules.
