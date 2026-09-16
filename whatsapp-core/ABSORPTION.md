# Magnanimous WhatsApp Capability Absorption

## Identity and architecture

Magnanimous AI remains the brain, command, memory, reasoning, policy and public identity layer.

WhatsApp Business Platform / Meta is a replaceable execution ecosystem beneath Magnanimous. Provider branding must not override Magnanimous identity. Existing authorized OAuth and message execution stay in the existing integration/action routers so confirmation, permission and audit gates are preserved.

## Current official platform shape researched September 16, 2026

Meta's official WhatsApp Business Platform Postman workspace identifies WhatsApp Cloud API as the official API for business messaging. The workspace also documents WhatsApp Business Management, Flows and Embedded Signup. During 2026, the separate Business Management and Flows Postman collections were marked as moved/deprecated and their requests were consolidated into the WhatsApp Cloud API collection. The legacy On-Premises API is deprecated in favor of Cloud API.

Magnanimous therefore models the current platform as a consolidated Cloud API ecosystem rather than treating Business Management and Flows as unrelated products.

## Absorbed capability families

### Cloud messaging
- text messages
- media messages: image, audio, video, document and sticker patterns
- message templates
- interactive messages
- reply context and reactions
- message IDs and status tracking
- read receipts
- typing indicators
- webhook-driven inbound messages and delivery events

### Templates
- list/get/create/edit/delete lifecycle
- authentication, utility and marketing categories
- quick reply and call-to-action buttons
- media headers
- catalog and multi-product template patterns
- template status and quality monitoring

### WhatsApp Business Accounts and phone assets
- owned/shared WABAs
- phone-number IDs
- phone-number listing/filtering
- display-name status
- phone ownership verification by SMS or voice code
- registration and re-registration
- two-step verification
- deregistration/migration readiness

### Business profiles and media
- about/address/description/email/websites/vertical
- profile photo upload and resumable upload pattern
- media upload/download/delete metadata

### Webhooks
- WABA-level webhook subscriptions
- message and status events
- template/phone/quality events where supported
- verification/signature validation
- deduplication and event audit

### WhatsApp Flows
- create and clone
- list/get/preview
- update metadata/assets
- endpoint encryption pattern
- publish/deprecate/delete lifecycle
- send Flow through Cloud API
- sign-up, sign-in, appointment booking, lead generation, contact-us, customer-support and survey patterns

Important: Flow publish is consequential because published Flow assets become immutable in the documented lifecycle. Magnanimous treats publish/deprecate/delete as confirmation-gated mutations.

### Commerce and QR
- commerce settings
- catalog visibility/product experiences
- single/multi-product patterns
- order details/order status patterns
- QR/deep-link creation, retrieval, update, image forms and prefilled messages

### Embedded Signup / partner onboarding
- Embedded Signup
- WABA assignment
- business and phone onboarding
- Solution Partner / Tech Provider patterns
- Advanced Access / App Review awareness for required permissions

### Analytics, billing and quality
- analytics/operational reporting patterns
- credit-line and billing visibility
- phone/template quality monitoring
- delivery health
- rate-limit/error observation and reconciliation

### Consent, policy and compliance
- opt-in / opt-out state belongs in Magnanimous normalized memory
- messaging-policy and template-policy awareness
- country/region availability checks
- business verification and app permission review
- regional compliance surfaces
- user-block/unblock safety controls

### Regional payments
The official Cloud API collection includes regional payment surfaces for India and Singapore. Some documented India payment/order APIs are beta and require eligibility/access. Magnanimous therefore models payments as availability-gated and does not enable payment execution by default.

### Business calling and voice
Meta announced calling options for larger businesses on WhatsApp Business Platform, including customer-to-business calling and business-to-customer calling after a user requests contact, with voice/video expansion and AI voice support patterns. Availability varies by region/account/partner. Magnanimous records this as an availability-gated capability and does not claim direct calling execution until the specific account, API/partner route, permissions and eligibility are verified.

### Cross-channel and AI patterns
- coordination with Meta Ads Manager / Facebook / Instagram where available
- business AI customer-support patterns
- FAQ and product-recommendation automation
- human handoff
- future AI voice support

Outside AI models or Meta business AI must never become Magnanimous's public identity, memory owner or commander.

## Provider-independent normalized state

Migration `0050_magnanimous_whatsapp_control.sql` adds normalized state for:
- WABAs
- phone assets
- templates
- Flows
- message state metadata
- webhook event metadata
- consent state
- quality snapshots
- commerce state

The control-plane schema intentionally does **not** store provider access tokens, raw message bodies, media bytes, payment credentials or raw identity documents.

## Execution boundaries

`/api/whatsapp` is an owner-only read/control plane. It reports capabilities, readiness, connection counts and normalized state.

It does not create a second write path.

Existing WhatsApp message execution remains routed through `/api/assistant-integrations/actions`, which already applies connection, permission and confirmation gates. Future template, Flow, commerce, payment and calling execution adapters must preserve equivalent or stronger gates.

## Safety and correctness locks

- provider is replaceable
- provider identity cannot override Magnanimous
- no tokens/secrets in responses
- no provider purchases from the control plane
- no ad-spend execution from the control plane
- no payment execution by default
- no calling execution by default
- no template/Flow publish/delete bypass
- no proprietary platform or corpus copying
- no claim that unavailable account features are enabled
- no automatic upgrade of Graph API versions without compatibility review

## Evidence sources used for the absorption map

Primary current references are Meta's official WhatsApp Business Platform Postman workspace and linked developer documentation, including Cloud API, messages, templates, Flows, Business Management/WABA assets, phone registration, business profiles, webhooks, commerce, QR codes, analytics/billing, compliance and regional payment collections. Meta newsroom announcements were used only for product availability context around business calling/voice and cross-channel business features.
