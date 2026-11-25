# Magnanimous TikTok LIVE Host — 2026 frontier technology review

**Research date:** 25 November 2026  
**Repository baseline:** `main` at `75aa1de9e2f95a65b47fcbbf5d2b43bebb97dec2`  
**Decision:** Keep Magnanimous as the brain and keep the long-session default free/local. Add external voice and avatar providers only as replaceable renderers, with server-side credentials, explicit consent, metering, and spend caps.

## Executive decision

There is no single provider that solves all of the following at once: a realistic speaking avatar, full-duplex conversation, hour-long sessions, TikTok LIVE account access, automatic TikTok comment ingestion, and zero cost.

The sensible approach is a layered system:

1. **Magnanimous owns the intelligence.** It is responsible for identity, conversation context, knowledge, safety rules, moderation decisions, and the final words spoken.
2. **Voice and avatar systems are replaceable output adapters.** A model may speak or animate the face, but it does not acquire Magnanimous's identity, memory, or authority.
3. **OBS is the local broadcast bridge.** Use OBS for the scene, audio/video composition, and an authorized TikTok output. Its WebSocket API is included in OBS Studio 28+ and should be password-protected.
4. **Keep a human operator in the loop.** Until TikTok provides an approved LIVE chat integration for the account and app, an operator must read, filter, and enter audience questions. Do not scrape browser sessions or depend on unofficial chat APIs.
5. **Do not silently buy minutes.** Native browser speech remains the default. Paid models and avatar services stay disabled until there is a user-controlled budget, usage ceiling, and provider key stored server-side.

## Technology comparison

| Technology | What it does well | Limits relevant to a TikTok broadcast | Acquisition recommendation |
|---|---|---|---|
| Magnanimous native host + browser speech | Uses the existing platform brain and local browser voice; no new per-minute voice/avatar bill | Current browser portrait is illustrative, not a photorealistic lip-synced digital human; comments are manually relayed | **Use now** as the no-new-provider-cost baseline |
| Google Gemini 3.8 Live + Live Avatar | Native real-time audio/video/text output; Live Avatar can produce expressive facial motion and synchronized speech | Google's model card describes avatar sessions as a few minutes of continuous interaction, not extended hours; this is a short-demo option, not the main long stream engine | Test only with non-sensitive content and an explicit Google API key; never make it the default for a long session |
| OpenAI GPT-Live-1 API | Full-duplex voice: can listen and speak at the same time; useful for interruptions and natural turn-taking | Voice model only; it does not itself render the avatar video. Published API price is $0.05/minute, or about $3/hour, plus separate backend model/tool usage | Strong optional voice upgrade after a budget cap and prepaid/approved funding are in place |
| HeyGen LiveAvatar | API/SDK for real-time avatar speech, facial animation, and lip-sync; offers a free test tier | Official free tier: 10 credits/month, watermark, one concurrent session, maximum two minutes/session; a credit gives 30 seconds in Full mode or one minute in Lite mode | Suitable for a short proof-of-concept, not a continuous multi-hour broadcast |
| OBS Studio + obs-websocket | Local scene, overlay, and broadcast control; included with OBS 28+; does not require a paid avatar provider | Must run on the operator's computer; stream destination still depends on TikTok account eligibility and the authorized stream workflow | **Use as the local media bridge**; enable password authentication and never expose its WebSocket port publicly |

### Pricing and session details checked on 25 November 2026

- **GPT-Live-1:** OpenAI's pricing page lists $0.05 per minute for voice sessions, billed by the second. One hour is approximately $3 before separately billed backend model or tool use. A four-hour session would be approximately $12 for the live-voice session line alone, assuming continuous usage.
- **Gemini 3.8 Live:** Google's standard paid pricing lists audio input at $0.005/minute and audio output at $0.018/minute, with text and other modalities billed separately. The pricing page currently lists a free tier. It says free-tier content may be used to improve Google products; avoid sending personal, family, ministry-member, or private viewer information through that tier.
- **HeyGen LiveAvatar:** The current official homepage lists Free at $0 (10 credits/month, maximum two minutes per session, one concurrent session, watermark); Starter at $19/month (150 credits, maximum five minutes per session, up to five concurrent sessions); Essential at $99/month (1,000 credits, maximum 20 minutes per session, up to 20 concurrent sessions); and Business at $475/month (5,000 credits, maximum 60 minutes per session, up to 40 concurrent sessions). One credit buys 30 seconds in Full mode or one minute in Lite mode. This means even Business's stated 60-minute session ceiling is not proof of a continuous multi-hour broadcast; credit consumption is a separate limit. Prices and credit allowances may change.

No paid provider is activated by this update. The UI identifies which choices are available to test, which are paid, and which remain unconnected.

## TikTok platform access and integration boundary

TikTok's public developer scope reference lists the LIVE scope `smb.creator_data.read` as permission to read daily statistics for partner creators within the authorized scope. That is not a general-purpose permission to read live chat comments, start a LIVE, or control a stream.

Therefore:

- TikTok account connection in the existing Social Hub must not be represented as permission to read live comments or start a LIVE.
- The operator must use TikTok's own LIVE interface and account-authorized streaming options.
- Third-party RTMP access is account-dependent. Do not assume every account that can start a mobile LIVE can also stream from desktop software.
- Do not capture passwords, session cookies, private app tokens, or hidden browser data to get around the platform's access controls.
- If TikTok later grants an official chat or broadcast API scope to this app, implement it as a documented adapter with least privilege and user-visible consent.

## Philippines policy and content safeguards

TikTok Shop Philippines' AI-Generated Content guidance, last checked on 25 November 2026, says AI-generated content is allowed when it complies with the Shop Content Policy and Community Guidelines. It specifically warns against AI content that misrepresents product details, fabricates results, or invents sympathy or crisis stories to push a sale.

A separate TikTok Shop Philippines article titled **Non-Interactive Content — How to Avoid Violations**, updated 5 November 2026, warns against static/looping scenes and livestreams that use recorded or computer-generated voices instead of sustained real-time verbal interaction with viewers. For shoppable LIVE sessions, a synthetic host alone is therefore a compliance risk. The safe operating design is a real human host/operator who is present, interacts directly with viewers, accurately demonstrates the real product, and uses AI only as an assistant unless TikTok confirms the synthetic-host format is eligible.

For ministry and educational LIVE sessions, keep the AI identity clearly disclosed, answer viewers meaningfully, and do not impersonate a real person or use a likeness/voice without permission. TikTok's general AI-generated content guidance requires disclosure for realistic AI-generated audio/video. Re-check TikTok's current guidance before each new content type because policies and account eligibility can change.

## What this update implements

- Adds a visible, dated technology/acquisition comparison inside the TikTok LIVE Host page.
- Makes clear that Gemini Live Avatar and HeyGen LiveAvatar are short-session demonstration options, not promised multi-hour hosts.
- Shows GPT-Live-1's current per-minute price and makes clear it is a voice model rather than an avatar.
- Recommends OBS as the local media bridge and keeps Magnanimous as the intelligence layer.
- Corrects the earlier overbroad claim that TikTok Shop Philippines bans AI narration outright. The updated guidance distinguishes AIGC permission from the separate non-interactive livestream rule.
- Keeps manual comment relay and truthful preview-only status. No unofficial TikTok comment scraper, hidden session access, or automatic LIVE launch is added.
- Does not install a paid SDK, store a provider key, start a paid session, or enable an automatic charge.

## Next integration sequence

1. Validate the free/local path on the user's actual Windows computer: browser audio, OBS scene capture, vertical canvas, and TikTok's account-authorized LIVE test mode.
2. Add a provider adapter interface in the server layer, with credentials held only in server-side secrets and never in browser storage.
3. Add explicit provider selection, per-session time limits, maximum spend, and a visible usage meter before enabling any metered API.
4. Test one short, non-sensitive Gemini Live Avatar or HeyGen LiveAvatar demonstration only after the user chooses and authorizes the provider.
5. Do not make automatic TikTok comment ingestion or automated broadcasting available until a documented official API permission is approved and tested.

## Primary sources

- Google DeepMind, Gemini 3.8 Audio model card (15 September 2026): https://deepmind.google/models/model-cards/gemini-3-8-audio/
- Google Gemini API pricing (checked 25 November 2026): https://ai.google.dev/gemini-api/docs/pricing
- OpenAI, GPT-Live-1 API announcement (10 September 2026): https://openai.com/index/introducing-gpt-live-1-in-the-api/
- OpenAI API pricing (checked 25 November 2026): https://platform.openai.com/pricing/
- HeyGen LiveAvatar current official plan/price table (checked 25 November 2026): https://www.liveavatar.com/
- HeyGen LiveAvatar FAQ (credit calculation): https://help.heygen.com/en/articles/12758866-liveavatar-faq
- HeyGen LiveAvatar official Help Center plan detail: https://help.heygen.com/en/articles/12758516-introducing-liveavatar
- TikTok for Developers, API scopes reference: https://developers.tiktok.com/docs/en/tiktok-api-scopes
- TikTok Shop Philippines, AI-Generated Content (AIGC): https://seller-ph.tiktok.com/university/essay?default_language=en&identity=1&knowledge_id=7188082378639105
- TikTok Shop Philippines, Non-Interactive Content (updated 5 November 2026): https://seller-ph.tiktok.com/university/essay?from=policy&identity=1&knowledge_id=7654203686192897&role=1
- TikTok, About AI-generated content: https://support.tiktok.com/en/using-tiktok/creating-videos/ai-generated-content
- OBS Project, obs-websocket: https://github.com/obsproject/obs-websocket

---

**Truth boundary:** This research and UI update do not mean a TikTok account has been authorized, a provider account has been connected, an API key has been installed, a LIVE has been started, or a human-like avatar has been activated in production.
