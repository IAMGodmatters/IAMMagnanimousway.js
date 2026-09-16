# Inkbox → Magnanimous AI skill pack

## Ownership rule

Magnanimous AI remains the public identity, orchestration layer, memory owner, reasoning policy, verification layer, and learning system. Inkbox is a replaceable communications execution adapter. Do not expose underlying provider/model names in ordinary customer-facing interactions unless disclosure is legally or operationally required.

## Current connected identity

The connected Inkbox identity is branded as **Magnanimous**. Hosted-agent instructions should present the caller-facing agent as Magnanimous and hand unresolved custom work back to Magnanimous AI as post-call actions.

## Portable capabilities absorbed into Magnanimous

The Skill Foundry now contains portable recipes for:

1. Hosted outbound call task briefs using a plain-language reason.
2. Routing between zero-setup hosted voice and Magnanimous-controlled realtime voice when custom live tools are required.
3. Narrow contact-scoped versus broader authorized communication context.
4. Atomic post-call packages containing call record, transcript, outcome, and ordered open action items.
5. Live transcript observation and authorized remote hangup.
6. Explicit voicemail handling policy.
7. Unified bounded contact context across calls, SMS, iMessage, and email.
8. Consent/contact-rule/channel-readiness checks before sending.
9. Communication tool-activity observability and asynchronous completion tracking.
10. Agent-to-agent task routing with durable state and untrusted-input treatment.

These are public workflow patterns, not copied provider implementation code, hidden prompts, model weights, credentials, or protected internals.

## Provider configuration

Magnanimous recognizes these server-side settings:

- `INKBOX_API_KEY`
- `INKBOX_AGENT_IDENTITY_ID`
- `INKBOX_PHONE_NUMBER`
- `INKBOX_WEBHOOK_SECRET`
- `INKBOX_BASE_URL` (defaults conceptually to `https://inkbox.ai/api/v1` when configured by deployment)

They are available through the platform-owner encrypted Provider Vault under **Magnanimous Communications via Inkbox** and through protected deployment secrets.

## Runtime policy

Use hosted voice when its built-in communications tools are sufficient. Use a media-stream / bring-your-own-agent path when Magnanimous must run custom tools during the live call. The two call-brain modes should not be mixed on one call.

Post-call actions must be idempotent. Use stable event/action IDs so replaying a call-ended event does not execute the same external action twice.

Broad authority must never bypass consent, channel availability, contact restrictions, or usage limits. Prefer narrow authority unless the task genuinely requires cross-contact or cross-conversation access.

## Current activation blocker

The currently connected Inkbox identity has no dedicated phone number assigned, so live PSTN calling is not yet available through that identity. Hosted-agent behavior is configured, but a number/line must be assigned before real inbound or outbound phone tests can succeed.

## Next implementation target

Once a production Inkbox API key and active line are configured in Magnanimous, add the execution adapter that maps Magnanimous actions to Inkbox API calls and maps `call.ended` results back into the Magnanimous action queue. Keep the existing browser-call, carrier-bridge, Twilio, Telnyx, and other working paths intact as fallbacks/adapters rather than replacing them.
