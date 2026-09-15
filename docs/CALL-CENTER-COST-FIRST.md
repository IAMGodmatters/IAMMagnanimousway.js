# I AM MAGNANIMOUS WAY™ — Cost-First Call Center Architecture

## Product goal

The call center must behave like a real agent floor, not like an expensive pay-per-minute demo. Human agents work from a browser, follow scripts and rebuttals, disposition calls, schedule callbacks, and use queues/campaigns. Calling cost is routed through the cheapest valid path instead of hard-wiring the product to one premium carrier.

## Route order

1. **Free browser calling** — I AM WebRTC for platform users. No PSTN minutes.
2. **Workspace BYOC / flat-rate SIP** — the workspace may connect its own PBX/SIP gateway and a flat-rate channel plan when the carrier permits the traffic pattern.
3. **Wholesale or low-cost metered SIP** — overflow, destinations not covered by the flat plan, or tenants whose traffic does not qualify for unlimited service.
4. **Premium API carrier fallback** — retained for compatibility and reliability, not treated as the default economic model.

The Worker already gives a configured `VOIP_PROVIDER_URL` bridge precedence over direct premium carriers. `VOIP_BILLING_MODE` can label the workspace bridge as `flat-rate`, `unlimited`, `channel`, `wholesale`, or `metered`. Public customer/agent responses use the Magnanimous carrier identity rather than exposing the underlying vendor.

## Recommended PBX layer

Use a self-managed Asterisk or FreeSWITCH instance as the telephony control layer. Asterisk supports WebRTC clients through PJSIP/WebSocket transports, which makes a browser agent desk possible without renting a proprietary softphone for every agent.

The PBX should provide:

- browser/WebRTC agent extensions;
- SIP trunk registration or IP authentication;
- inbound DID routing;
- outbound caller-ID policy;
- queues and agent presence;
- transfer/hold/mute;
- optional recording with jurisdiction-specific consent controls;
- an authenticated HTTP bridge used by `VOIP_PROVIDER_URL`;
- webhook events back to `/api/phone/webhook` using `VOIP_WEBHOOK_SECRET`.

## Workspace bridge contract

Magnanimous sends an authenticated `POST` to `VOIP_PROVIDER_URL` with a bearer token from `VOIP_PROVIDER_TOKEN`.

Typical request:

```json
{
  "call_id": 123,
  "tenant_id": "workspace-id",
  "to": "+14155551212",
  "from": "+14155550100",
  "agent_id": "agent-id",
  "queue_id": "queue-id",
  "webhook_url": "https://iammagnanimousway.com/api/phone/webhook"
}
```

The bridge should return a provider-neutral response:

```json
{
  "provider_call_id": "pbx-call-uuid",
  "status": "dialing"
}
```

Status callbacks to the supplied webhook should include `provider_call_id`, `status`, and optional `recording_url` or non-sensitive call metadata.

## Environment variables

- `VOIP_PROVIDER_URL` — HTTPS endpoint on the workspace/PBX bridge.
- `VOIP_PROVIDER_TOKEN` — bearer secret used by Magnanimous to authenticate to that bridge.
- `VOIP_WEBHOOK_SECRET` — shared secret sent by the bridge as `x-iam-webhook-secret` on callbacks.
- `VOIP_CALLER_ID` — E.164 caller ID assigned to the trunk.
- `VOIP_BILLING_MODE` — `flat-rate`, `unlimited`, `channel`, `wholesale`, or `metered`.

Carrier credentials and vendor names remain owner/private infrastructure information and must not be rendered on customer-facing pages.

## Agent workflow

The `/agent-desk` workspace is optimized for the way human call-center representatives actually work:

- editable opening, discovery, value, and closing script stages;
- searchable objection/rebuttal guidance;
- one-click copy for script/rebuttal text;
- starter rebuttal installation into the existing tenant-scoped Agent Assist table;
- campaign visibility and handoff to the consent-gated dialer;
- free browser phone and ordinary-number carrier phone shortcuts;
- QA/WFM shortcut;
- server-side DNC, consent, calling-window, retry, and campaign-cap controls.

## Unlimited-plan boundary

Do not market every call as universally unlimited. Flat-rate SIP plans are governed by the specific carrier's acceptable-use terms. Some plans are limited to normal live person-to-person calling, may prohibit traffic aggregation/resale, and may move abusive/high-volume traffic to metered billing. Therefore Magnanimous treats flat-rate service as a workspace BYOC option and keeps low-cost metered routing available as fallback.

## Current public pricing reference (September 2026)

Public rate cards change, so re-check before purchase. As of the platform update:

- SIPTRUNK advertises an unlimited US48/Canada plan priced per simultaneous channel and also offers minute bundles.
- Telnyx advertises usage-based US SIP termination starting around half a cent per outbound minute.
- SignalWire advertises low-cost SIP/WebRTC transport plus separate PSTN rates.

The platform does not depend on any one of these companies. They are examples of carrier economics that support the BYOC design.
