# Microsoft Call Center AI — Clean-Room Research for Magnanimous

Date: 2026-11-02
Source repository: https://github.com/microsoft/call-center-ai
License file reviewed: Apache License 2.0
Repository visibility/status: public; default branch main; GitHub API did not report it archived. This is not a guarantee of active maintenance or security support.

## What the Reel promotes

The supplied Facebook Reel resolves to Microsoft's Call Center AI project. The source README describes an AI-powered telephone call center built around Azure Communication Services, Azure AI Speech/Cognitive Services and OpenAI GPT. The repository is a concrete reference implementation, not a general-purpose drop-in product.

## Verified design and capabilities in the source

- Inbound telephone calls answered through Azure Communication Services Call Automation.
- Outbound calls initiated by a REST endpoint using a structured call request (customer phone number, task, bot identity, optional agent phone number and structured claim fields).
- Bidirectional media streaming over WebSocket for live audio conversations.
- Event Grid / queue-driven handling of incoming call and SMS events.
- JWT validation for Azure Communication Services callback events, plus a per-call callback secret checked against the stored call.
- Structured call state, messages, claims, next action, reminders, synthesis and customer satisfaction fields.
- SMS follow-up handling.
- Call recording support and post-call processing hooks.
- Human-agent fallback is described in README; its exact operational behavior must be validated in a live test before adopting.
- README describes multilingual interaction, voice tones, reconnect/resume, RAG over internal documents, domain-specific claim extraction, jailbreak detection, automated task lists, custom brand voice and monitoring/tracing.
- The README cites GPT-4.1 and GPT-4.1-nano. This should be treated as the upstream example's stated model configuration, not a required model choice for Magnanimous.

## What the source is built around

The inspected implementation uses Azure Communication Services Call Automation to create/answer calls and request bidirectional audio media streaming. It opens a per-call WebSocket route and validates the ACS JWT plus a random call-specific secret. Incoming call and SMS events are handled through queued event processing. The configuration and persistence are designed around Azure services, including Azure-hosted communication, speech and storage/database integrations.

This is valuable engineering evidence for call lifecycle, media streaming, event processing, structured call state and callback validation. It is not a reason to import Azure as Magnanimous's identity, memory or mandatory infrastructure.

## License and reuse boundaries

The repository's LICENSE file is Apache-2.0. Commercial use and modification are permitted subject to Apache-2.0 terms, including retaining license/copyright notices, providing the license, marking modified files, and preserving any applicable NOTICE attributions. The license does not grant Microsoft's trademarks. Review all transitive dependencies, models, sample data and Azure service terms separately; the repository license does not automatically relicense those.

Use clean-room adaptation of architectural patterns and independently authored Magnanimous code. If copying or modifying source files, maintain the required Apache attribution and modification notices and perform a dependency/license scan. Do not copy Azure/Microsoft branding into Magnanimous's user interface.

## What Magnanimous should absorb

1. **Call lifecycle state machine:** explicit created, ringing, answered, media-connected, in-progress, handoff, completed, failed and disconnected states, all correlated to the Magnanimous call ID.
2. **Structured call brief:** task objective, customer context, tenant-approved knowledge, required fields, completion criteria and allowed tools.
3. **Realtime duplex audio:** stream caller audio and synthesized response audio simultaneously, with turn detection, barge-in, cancellation, codec conversion, bounded buffers and backpressure.
4. **Structured outcome object:** transcript segments, customer intent, validated fields, next action, task list, reminders, resolution, satisfaction and escalation reason. Distinguish model-generated suggestions from confirmed facts.
5. **Event-driven call processing:** idempotent event ingestion, signature/JWT verification where applicable, replay protection, per-call correlation and durable retry/dead-letter behavior.
6. **Human fallback:** warm transfer with queue selection, reason, concise summary and context. If no agent is available, offer callback or safe message capture.
7. **SMS follow-up:** only when the customer has consented, opt-out is checked, jurisdiction and sender requirements are met, and usage is funded.
8. **Post-call quality:** quality scoring and coaching suggestions with evidence references, not ungrounded sentiment treated as fact.
9. **Knowledge grounding:** tenant-scoped retrieval with source references; retrieved documents are data, never authority to override system policy.
10. **Recovery:** resume only when call state and media provider support safe recovery; never silently replay a completed or consequential action.

## What must not be copied as-is

- Azure Communication Services as a mandatory provider; Magnanimous Telecom remains provider-neutral and retains its existing Asterisk/SIP path.
- Azure-specific Event Grid, Queue Storage, Cosmos DB, Azure Functions or Azure Container Apps as hard requirements.
- The sample public API shape without Magnanimous tenant authentication, role authorization, quotas, idempotency, consent and prepaid usage checks.
- Any assumption that storing claims/transcripts or recordings is lawful without purpose limitation, notice, consent, retention and deletion policy.
- Any direct model tool execution that bypasses Magnanimous AI's authorization layer.
- The README's claims of low-latency, production suitability, multilingual quality or compliance without independent tests.

## Magnanimous implementation decision

Keep the existing Asterisk 22.11.0 Telecom Core as the PBX/call lifecycle authority. Keep Magnanimous AI as the brain. Build the custom Asterisk chan_websocket media adapter and use Pipecat only as a replaceable realtime speech pipeline candidate. Reuse the Microsoft project's *patterns* for call-state modeling, structured task capture, event idempotency, summaries, follow-up and human handoff; do not port the Azure infrastructure.

The repository's current call center already has queues, skills routing, campaigns, IVR, dispositions, CRM context, summaries, supervision controls and channel records. The highest-value next work is therefore the live media/voice engine, robust call-state orchestration and production tests—not another call-center dashboard.

## Acceptance tests to add

- Authenticated inbound call; invalid JWT/secret and replayed event rejected.
- Outbound call blocked unless tenant authorization, customer consent, DNC, calling hours and prepaid usage pass.
- Bidirectional audio verified end-to-end; no one-way audio.
- Barge-in cancels generated speech and does not lose the caller's interruption.
- Audio backpressure pauses synthesis rather than overflowing queues.
- Call state survives duplicate/reordered webhooks and worker restart.
- Human transfer carries the correct tenant-scoped summary and resumes with a human.
- SMS respects consent, STOP/opt-out and jurisdictional sender requirements.
- Structured field extraction distinguishes caller statements from inferred values and asks for confirmation before consequential changes.
- Recordings/transcripts obey notice, consent, retention, access and deletion controls.
- No cross-tenant audio, transcript, reminder, CRM or RAG leakage.
- Cost caps stop new paid provider work before unfunded usage can occur.

## Sources

- Microsoft Call Center AI source: https://github.com/microsoft/call-center-ai
- README: https://github.com/microsoft/call-center-ai/blob/main/README.md
- Apache 2.0 license: https://github.com/microsoft/call-center-ai/blob/main/LICENSE
- Asterisk WebSocket channel driver: https://docs.asterisk.org/Configuration/Channel-Drivers/WebSocket/
- Pipecat WebSocket transports: https://docs.pipecat.ai/api-reference/server/services/transport/websocket-server
- Pipecat source: https://github.com/pipecat-ai/pipecat

## Evidence limitations

The Facebook video itself was not available as a playable audiovisual asset or transcript; the resolved caption/source link identified the Microsoft repository. The analysis above is based on the repository README, LICENSE, and inspected implementation files, not an invented verbatim transcript of the video. A production call, latency benchmark, language benchmark, security penetration test or Azure deployment was not performed by this research.
