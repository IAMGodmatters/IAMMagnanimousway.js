# Grok Bot capabilities — native-first Magnanimous review (21 October 2026)

## Evidence and product boundaries

Grok Bot is a subscription-based persistent cloud-computer agent offering from xAI/Cursor, **not** an open-source package or a general-purpose Grok Bot API. Its documented activities include persistent named bots, browser/computer use, skills, routines, agent handoffs, shared context, approvals and connector access. xAI's developer API is **separately** billed by usage and is not the Grok Bot subscription. A model API key does not give Magnanimous a cloned or owned Grok Bot cloud computer.

- Original Grok Bot introduction: https://x.ai/news/introducing-grok-bot
- Current Grok Bot overview: https://docs.x.ai/grok-bot/overview
- Computer sharing and credentials: https://docs.x.ai/grok-bot/computer-and-apps
- Skills and routines: https://docs.x.ai/grok-bot/skills-routines-and-automations
- Model API: https://docs.x.ai/developers/models/grok-4.7
- Pricing: https://docs.x.ai/developers/pricing
- Remote MCP interface: https://docs.x.ai/developers/tools/remote-mcp
- Separate Apache-2.0 licensed Grok-1 research checkpoint: https://github.com/xai-org/grok-1

The public Grok-1 code and 314-billion-parameter weights are a different older release. Its Apache-2.0 license does not grant rights to Grok Bot's private agent service, trademarks, sessions, cloud computers, unreleased models, or prompts. No Grok-1 weights or proprietary Grok Bot runtime were fetched or installed.

## Existing native integration

Magnanimous already has a Grok capability benchmark covering over forty workflows, native Agent Mesh, durable role and tenant-scoped context, skill/tool catalogs and optional provider routing. Preserve this work. The xAI integration is only an optional, replaceable, metered chat-model endpoint for an explicitly selected request; not the platform identity or tool authority. The default model is updated to `grok-4.7` only if `XAI_MODEL` has not been explicitly configured. It does not require or install Grok Bot.

## No-surprise-spend protection

`/api/agents/chat` must **never** select `xai` in the default free-first fallback chain, even when `XAI_API_KEY` happens to be configured. An authenticated request choosing `provider:'xai'` is refused before chat persistence or any provider call unless both `XAI_METERED_ENABLED=true` is intentionally configured and `metered_provider_approved:true` accompanies that exact request. Both values default to missing/off. This is an authorization gate, not a credit balance meter or a guarantee that an approved request has no billable cost. xAI web/X search and other tool invocation charges are not implicitly enabled.

No xAI API request, paid subscription, billing configuration change, credential download, or additional cloud computer was triggered by this upgrade.

## Security lessons from Grok Bot

Official Grok Bot documentation says that a single user's Bots **share the same computer**: browser cookies, files and terminal credentials are visible across that person's Bots. Distinct role/personality screens do not constitute isolation. Magnanimous should continue its existing tenant and connector scope gates instead of equating agent role separation with credential separation. Do not share cross-tenant secrets, accept arbitrary code/remote MCP servers, or elevate permissions because a Bot suggests it.

The owner-only Local Bridge retains its outbound-only polling and exact-task confirmations. Financial commitments, publishing, customer contact, account changes, and other consequential actions remain behind existing approval and billing controls.

## Verification and limits

Automated governance checks cover xAI exclusion from free-first routing, exact paid-provider selection, owner-side paid gate, model identity, independent research licensing, and no new proprietary source. Hardware/desktop access, Grok Bot subscription interoperability, and active xAI inference are deliberately *not claimed* or tested. Existing Stripe 20% internal economics, phone regulatory gates, mobile appearance and all working services remain unchanged.

### Production acceptance

After merging, check that:
- Main governance and integration tests pass with no paid provider call.
- The general Agent Mesh works with its existing non-xAI free-first candidates.
- No design, user-visible Grok branding, fee trigger or remote computer access has been introduced.
- Production deploy and smoke tests reach success; report local hardware/external Grok Bot as unavailable if not independently confirmed.
