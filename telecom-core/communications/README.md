# Magnanimous Communications Core

Initial native implementation for the Magnanimous messenger/communications system.

The domain and application service are intentionally independent of databases, WebSocket vendors, push networks, WebRTC/TURN infrastructure, and PSTN providers. Production adapters are injected at the composition root.

Current implementation includes direct/group/community conversation models, text/media message types, membership authorization, reply metadata, read receipts, realtime event port, call-signaling port, telecom/PSTN call port, development in-memory adapters, and tests.

Next production adapters: PostgreSQL durable store, authenticated realtime gateway, WebRTC signaling/TURN, notification adapters, attachment object storage, moderation/rate limiting, device synchronization, and integration with the existing Magnanimous SIP/PSTN core.

Security truth rule: this package does not claim end-to-end encryption merely because transport or storage can be encrypted. An audited client-side E2EE protocol must be completed before that product claim is enabled.
