# Magnanimous Communications feature ledger

This ledger converts messenger inspiration into Magnanimous-owned implementation work.

## Implemented foundation
- Conversation domain: direct, group, community
- Message domain: text, image, video, audio, file, voice note
- membership authorization
- reply references
- read receipt state
- realtime publisher abstraction
- internet audio/video signaling abstraction
- Magnanimous Telecom PSTN abstraction with E.164 validation
- provider-neutral dependency injection boundaries
- tests and CI ownership/truth lock

## Production implementation queue
- durable PostgreSQL conversation/message/member/receipt/reaction/block/report/device schema
- authenticated WebSocket realtime gateway
- presence and typing indicators
- message edit/delete/reactions
- attachment upload/object-storage adapter
- voice-note capture/playback
- WebRTC offer/answer/ICE signaling
- TURN service adapter and health/failover
- audio/video call lifecycle and history
- group calling
- device registration and multi-device sync cursors
- push adapters for Apple/Android/web
- contact discovery with privacy-preserving identifiers
- block/report/moderation/rate-limit enforcement
- community administration and roles
- search and local notification state
- voicemail integration
- bridge to Magnanimous-owned SIP/PSTN core
- client-side established E2EE protocol + independent review before E2EE claim

No item in this queue authorizes copying proprietary Viber implementation material. Functional parity is implemented from original Magnanimous code and public interoperability standards.
