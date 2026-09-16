# Magnanimous AI Provider Ecosystem Absorption

Checked: 2026-09-16

## Identity and ownership

Magnanimous AI remains the brain, command layer, memory owner, reasoning layer, orchestration layer and public AI identity. External companies are replaceable capability providers beneath Magnanimous. Provider names may appear in the owner control plane for configuration and audit, but they must not override the public Magnanimous identity.

This layer does not copy proprietary source code, private databases, restricted documentation, carrier credentials, registrar credentials or platform secrets. It models capabilities, authorized API outputs and lawful integration patterns into Magnanimous-owned contracts.

## Absorbed capability families

### AT&T

Mapped as a replaceable telecom/network provider: network APIs, CAMARA network APIs, IoT connectivity, SIM/device management, network performance/information and call-management patterns. Live access remains subject to the relevant AT&T program, credentials and commercial/technical eligibility.

References:
- https://developer.att.com/

### T-Mobile

Mapped from the current DevEdge/partner model: network authentication, fraud signals, call protection, Quality on Demand, device/network status, slicing/performance, communications and connectivity/edge patterns.

The former DevEdge pilot APIs/services were retired on 2026-06-04. Magnanimous must not hard-code or advertise retired pilot endpoints as current. Current production access is treated as commercial-partner-review-required.

References:
- https://devedge.t-mobile.com/
- https://devedge.t-mobile.com/support/faq

### Metro by T-Mobile

Metro is modeled as a T-Mobile-backed prepaid/consumer service surface, not as an independent network API or independent carrier core. Magnanimous can normalize plan, coverage, device/eSIM support and customer-service knowledge while network-level capabilities remain attached to the T-Mobile provider family.

Reference:
- https://www.metrobyt-mobile.com/coverage/network

### Verizon

Mapped around Verizon/ThingSpace patterns: IoT connectivity, device lifecycle, SIM/device swaps, usage and connection history, SMS/events/callbacks, coverage, network performance/device experience and firmware management. Live operations require appropriate Verizon business/ThingSpace credentials and entitlement.

References:
- https://thingspace.verizon.com/documentation/apis/connectivity-management.html
- https://thingspace.verizon.com/documentation/apis/intelligence/wireless-network-performance/api-reference.html

### DSers

Mapped as a commerce/fulfillment provider: product sourcing, supplier optimization, product import, bulk order, bundles, fulfillment, inventory/price synchronization, shipment tracking/alerts, branded tracking and multichannel workflows.

No general public DSers API is marked verified in this registry. Until a supported authorized API/connector is confirmed, Magnanimous treats DSers as capability knowledge and an adapter contract rather than claiming direct live API access.

References:
- https://www.dsers.com/features/shipment-tracking-alerts
- https://www.dsers.com/features/auto-sync-tracking-numbers

### GitHub

Mapped as a development/DevOps provider: repositories, Git data, issues, pull requests, code search, checks, Actions, releases, webhooks, GitHub Apps, REST, GraphQL, security/dependency signals and packages. Any live write remains bounded by GitHub App/OAuth/token permissions and Magnanimous approval gates.

References:
- https://docs.github.com/en/rest
- https://docs.github.com/en/graphql
- https://docs.github.com/en/apps
- https://docs.github.com/en/webhooks

### Porkbun

Mapped as a domain/DNS provider: availability/pricing, domain management, register/renew/transfer, DNS/DNSSEC, SSL, nameservers/glue, forwarding, webhooks, OpenAPI/MCP patterns, sandbox and hosting. Registration, renewal, transfer and paid hosting are spend-locked. DNS/nameserver changes are consequential writes and remain approval-gated.

References:
- https://porkbun.com/api/json/v3/documentation

### World Wide Web

The Web is not treated as one vendor. Magnanimous absorbs open-web capability patterns: search, HTTP retrieval, browser navigation, robots/sitemap-aware discovery, structured extraction, feeds/webhooks, monitoring and provenance/citations. Access must respect robots directives where applicable, site terms, authentication, privacy, copyright and rate limits. This is not permission to mirror the Internet or proprietary/paywalled datasets.

### ChatGPT / OpenAI

Mapped as a replaceable AI execution family beneath Magnanimous: Responses, streaming, text and vision, file input, web/file search, function/custom tools, guarded computer use, remote MCP, authorized connectors, Realtime multimodal/audio, image generation/editing, speech generation, transcription, and tracing/observability.

The existing Magnanimous universal AI connector already exposes Magnanimous to ChatGPT/OpenAI over scoped MCP. This ecosystem layer is the complementary direction: OpenAI capabilities can serve as execution tools beneath Magnanimous when an authorized API/connector is configured. OpenAI does not own Magnanimous memory or identity.

References:
- https://platform.openai.com/docs/models
- https://platform.openai.com/docs/guides/realtime

## Hard action locks

The ecosystem registry defaults all of these to disabled:

- purchase actions
- advertising spend
- carrier provisioning
- SIM/eSIM activation
- domain purchase/renew/transfer
- destructive DevOps actions
- secret exposure

The `/api/ecosystem` control plane is intentionally GET-only. It cannot become a second write path that bypasses existing adapter permissions, confirmations, telecom/regulatory controls or spending gates.

## Provider independence

Every live adapter should normalize provider-specific data into Magnanimous contracts. Provider credentials remain server-side. Provider failures or replacements must not erase Magnanimous memory, audit history or the public identity. Where possible, adapters should support capability discovery, health/readiness, normalized events, idempotency, provenance and an explicit approval class for state-changing actions.
