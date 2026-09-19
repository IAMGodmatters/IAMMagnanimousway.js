# Magnanimous sovereignty: implementation status and hard boundaries

The permanent brain, brand, tenant identity, memory, approval policy, outcome learning and customer data live inside Magnanimous. External models, transports, image/voice services and telecom routes are replaceable execution engines. Never describe a connected outside engine as the owner of Magnanimous memory or as the public identity.

## Verified against current main at commit a52e736 (September 19, 2026)

- Brain and reasoning policy: `magnanimous-brain-runtime.js`, `magnanimous-cognitive-architecture.js`, specialist routing, QA learning, private White Label memory and outcome feedback exist. A proprietary frontier foundation model trained from scratch does not exist. Model performance claims require repeatable evaluations, not adjectives.
- Calls: free browser sessions, a self-hosted Asterisk/FreeSWITCH bridge preference, BYOC/wholesale SIP routing and metered carrier fallbacks exist. A self-hosted PBX is not itself a mobile carrier; PSTN destinations, telephone numbers, emergency service and interconnection remain dependent on regulated networks and contracts.
- CRM: tenant-isolated contacts, pipeline and activities exist. Agency client identity and client-specific White Label brain memory exist; full per-client CRM subaccounts and permissions need a dedicated contract test before claiming readiness.
- WhatsApp: OAuth, the authorized action router and a read-only capability control plane exist. This branch adds signed inbound webhook capture, tenant/client number routing, catalog-grounded reply drafts, explicit human review and audited sends through the existing action router. A real Meta Business account, webhook subscription, opt-in and policy eligibility are still required for live operation.
- Voice/virtual video host: voice-agent routes and a browser presenter fallback exist. A live photoreal video-call avatar with synchronized low-latency speech is not a completed native implementation. Keep individual personas and client content private; require disclosure and consent for synthetic presentation.
- Browser chat sessions from third parties are not API transports. Using consumer ChatGPT, Claude or Kimi browser sessions as an automated unofficial backend does not promise API latency, stable auth or permission to access accounts. Use official APIs and user-authorized connectors; keep Magnanimous the orchestrator.

## Added in this branch

Native White Label invoice drafts calculate totals server-side in cents, remain tenant/client isolated and can be reviewed/printed without a mail or payment side effect. Native POS tracks stock and records cash or *explicitly confirmed* external payments; no card processing is claimed. Native website drafts export safe standalone HTML; app prototypes export JSON briefs. A WhatsApp Product Inbox accepts only Meta-signed events for a verified, explicitly routed business number, drafts bounded catalog answers, and sends only after a person reviews the reply. These products stay in the paid Agency White Label shell and send privacy-safe successful-action signals to Magnanimous. They do not deploy a customer domain, publish a native mobile app, process payment, send an invoice, auto-message customers or create a phone carrier.

## Required before external operation

Independent per-app plans need owner-approved product prices, payment processor price IDs, tax/refund treatment, entitlement enforcement and billing webhook QA. Nothing in this branch creates a checkout or new subscription charge. WhatsApp receive/reply requires a Meta Business app, verified webhook, tenant phone-number mapping, messaging permissions, service-window controls, opt-in and a real connected account. PSTN/cellular service requires local regulatory advice, registration/authorizations, numbering/interconnect agreements, emergency-calling design, fraud controls and infrastructure budget. Browser-to-browser calls can be owned without becoming a carrier. Native real-time avatar and voice quality improvements need measurable latency/quality tests, identity consent and a funded media-rendering transport.

## Implementation facts checked against primary documentation

- Cloudflare's [D1 batch API](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch) specifies transactional batches with rollback on failure; POS stock carries an additional nonnegative database constraint.
- Asterisk documents [ARI configuration](https://docs.asterisk.org/Configuration/Interfaces/Asterisk-REST-Interface-ARI/Asterisk-Configuration-for-ARI/) and [SIP trunk configuration](https://docs.asterisk.org/Configuration/Channel-Drivers/SIP/Configuring-res_pjsip/res_pjsip-Configuration-Examples/). These control PBX routing, not ownership of a public telephone network.
- Meta's [WhatsApp developer hub](https://whatsappbusiness.com/developers) covers official Business Platform messaging/webhooks; it is the legitimate transport for WhatsApp rather than an unofficial browser-chat bridge.
- The Philippine NTC publishes a [VoIP registration application](https://region3.ntc.gov.ph/downloadable-forms/). It is evidence to seek regulator advice, not proof that any one registration alone authorizes a mobile carrier or interconnection.

Keep production unchanged until the native endpoints are tested with authenticated Agency accounts, the Meta callback is configured on a real authorized account, and deployment is explicitly reviewed.
