# Magnanimous Communications Core

Native foundation for the Magnanimous messenger/communications system. This is original Magnanimous code implementing common communications capabilities; it does not copy Viber source, private APIs, keys, branding, or protected assets.

## Implemented in this foundation
- direct, group and community conversation models
- text/image/video/audio/file/voice-note message types
- membership authorization
- replies and read receipts
- realtime publishing port
- internet audio/video call signaling port
- Magnanimous Telecom PSTN call port with E.164 validation
- reaction, blocking and abuse-report primitives
- multi-device session/sync primitives
- presence and typing primitives
- authenticated-storage-oriented attachment metadata
- dependency-injected provider-neutral boundaries
- tests, CI ownership lock and security/truth contracts

## Production adapters still required
Durable PostgreSQL persistence, authenticated WebSocket gateway, object storage, WebRTC offer/answer/ICE plus TURN, Apple/Android/web push adapters, full moderation/rate limiting, client applications, SIP/PSTN adapter wiring and an independently reviewed client-side E2EE implementation.

Security truth rule: transport encryption is not advertised as E2EE. PSTN, emergency calling, numbering and carrier authority are not advertised until their real infrastructure and regulatory prerequisites are verified.
