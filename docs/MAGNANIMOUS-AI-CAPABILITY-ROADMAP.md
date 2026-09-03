# Magnanimous AI — Capability Expansion Roadmap

## Objective
Magnanimous AI is the official intelligence/orchestration identity for I AM Magnanimous Way™. It should preserve every capability previously exposed under legacy Odin naming and expand through a modular, provider-agnostic architecture.

No system can truthfully contain literally all knowledge or every capability offered by every AI product. The production goal is therefore broad capability coverage, current retrieval, extensible provider adapters, private workspace memory, and safe connected actions.

## Capability domains
- General reasoning, writing, summarization, translation and tutoring.
- Live web and news research with source grounding.
- Private workspace knowledge ingestion, RSS ingestion and retrieval.
- Business planning, CRM, finance/people, support, sales, marketing and professional-document workflows.
- Coding, debugging, data analysis and structured-output generation.
- Image understanding/generation through configured providers.
- Speech, voice-assistant and browser/WebRTC calling workflows.
- Text-to-video, image-to-video and video editing through open/free-first models where compute is available.
- Social content creation and authorized publishing adapters for supported platforms.
- Connected account actions with explicit permissions/confirmation.
- Persistent learned preferences and workflow memory per tenant/user.
- Specialist agent delegation through the Agent Mesh.
- Browser/research-agent capability when a supported browser runtime is configured.

## Free-first video strategy
Open models such as Wan, HunyuanVideo and LTX-Video can provide text-to-video without proprietary model licensing charges, but inference still consumes compute. Magnanimous should therefore prefer owner/local/community/free inference allocations and never silently convert a free user request into an uncapped paid inference bill.

## Social strategy
Use official OAuth/API routes where available. Free API quota does not mean unlimited access: platforms can require app registration, OAuth consent, review/approval, posting scopes, account eligibility and quota limits. Magnanimous must expose connection status honestly and never simulate a successful post when the platform has not authorized it.

Priority adapters:
- YouTube Data API for channel/video operations within Google quota.
- TikTok Content Posting API where the app/account has approved posting access.
- Meta Facebook/Instagram publishing where approved permissions are present.
- LinkedIn community/marketing APIs where developer access is approved.
- X only under the access level/pricing currently offered by X; do not label it free when it is not.

## Learning / growth model
Magnanimous grows through retrieval and memory, not by secretly retraining model weights on customer data.
- Store explicit user preferences and facts the user asks it to remember.
- Learn reusable workflow preferences from confirmed successful actions.
- Store source-backed research in the tenant knowledge base when requested.
- Keep memories tenant-isolated and inspectable/deletable.
- Do not train public foundation models on private workspace data.

## Architecture rule
Capabilities belong to Magnanimous AI. Underlying providers are replaceable engines. Legacy Odin routes/keys, where temporarily retained for compatibility, are migration aliases only and must not define identity, prompts, product names or new storage keys.
