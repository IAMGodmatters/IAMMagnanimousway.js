# Magnanimous Native Marketing Department
**Research and implementation record — 22 November 2026**

## Executive finding
The referenced video, “Build & Sell This $1M Marketing Agent with 7 Skills” (Sabrina Ramonov, 4 August 2026; 15:03), presents a single coordinating agent with separate skills for content coaching, brand onboarding, writing, grading, scheduling, repurposing and hooks. It also demonstrates media generation/editing and proposes selling the result as a managed monthly marketing service.

The architecture is useful; the revenue headline is not a forecast or verified outcome for Magnanimous. The video does not prove that an agent can guarantee viral distribution, conversion or revenue. A skill file is not the same thing as a working API, approved social app or publishing entitlement.

## Source review
- Video: https://youtu.be/CkoJauJIyQs
- Public skill repository: https://github.com/Blotato-Inc/blotato-skills
- Agent Skills format: https://agentskills.io/specification
- TikTok Content Posting API: https://developers.tiktok.com/docs/en/content-posting-api-get-started
- TikTok Direct Post reference: https://developers.tiktok.com/docs/en/content-posting-api-reference-direct-post
- LinkedIn Posts API: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api
- YouTube video upload API: https://developers.google.com/youtube/v3/docs/videos/insert

The public Blotato repository currently documents eight skills, not seven: content-coach, brand-brief, post-writer, post-grader, post-scheduler, repurpose, viral-hooks and generate. The extra generation skill appears in the current repository README, beyond the seven skills described in the video title. The public Agent Skills format uses a self-contained directory centered on SKILL.md, with metadata and optional supporting resources; Magnanimous uses its own native registry and does not need Claude Code to understand or resolve these instructions.

## Claim audit
| Video idea | Independent assessment | Magnanimous treatment |
|---|---|---|
| One agent can coordinate separate marketing skills | Sound software architecture | One Magnanimous-owned director resolves small specialist skills |
| Brand briefing improves consistency | Sound workflow | Approved tenant Knowledge Center brief; no second memory store |
| Automated writing and grading improves production | Useful, but quality scoring is subjective | Transparent editorial rubric and evidence gates |
| Hook frameworks make content viral | No guarantee; reach depends on audience, distribution, timing and platform ranking | Original hooks, truthful framing and testable hypotheses |
| Repurpose one source into many posts | Useful if rights and meaning are preserved | Source/rights-aware channel adaptation with traceable origin |
| Schedule and publish to every social channel | Not universally available | Existing native calendar only claims destinations verified by its own runtime |
| Generate and edit images/videos in the same workflow | Possible when rendering services, formats and rights are available | Reuse existing Native Media Studio and report draft/rendered states accurately |
| Sell managed monthly packages | A business model, not validated revenue | Meter actual delivery cost and sell only service levels that can be fulfilled profitably |

## Findings from the live Magnanimous main branch
The implementation extends existing surfaces rather than creating a replacement stack:
- `worker/src/magnanimous-agent-skills.js`: native SKILL-style registry, resolver and validator.
- `worker/src/magnanimous-capability-mesh.js`: provider-neutral read/validation routes; now also exposes `skills.resource`.
- `worker/src/provider-entrypoint.js`: selects the marketing skill context for marketing/social requests and injects it into the normal Magnanimous chat prompt.
- `worker/src/creator-growth-runtime.js`: existing YouTube research and authorized creator analytics, with native ranking/proxy calculations clearly distinguished from official search-volume data.
- `worker/src/social-publishing-runtime.js` and `worker/src/social-scheduling-runtime.js`: existing tenant-aware social publishing and scheduled queue.
- `frontend/app/social-media/page.tsx`: content composer creates drafts; it does not itself publish.
- `frontend/app/social-calendar/page.tsx`: current schedule UI supports YouTube, TikTok and LinkedIn when each tenant connection, app configuration and write scope are ready.
- Existing Native Media Studio remains the media execution path.

The change adds nine original marketing skills: director, coach, brand-brief builder, platform-native writer, quality grader, repurposer, hook research lab, creative producer and performance analyst. The existing social publishing calendar operator remains in place.

Four read-only skill resources are registered: marketing playbook, editorial quality rubric, social channel capability matrix and creative asset checklist. These are returned via Capability Mesh `skills.resource`; reading instructions does not grant tools, credentials or permissions.

## Publication and provider constraints
A selectable draft channel is not necessarily a supported publishing channel. The repository's current native schedule contract lists YouTube, TikTok and LinkedIn only. The runtime must still verify the tenant's connection, provider configuration, write scope and external account identity before accepting any schedule.

- TikTok requires a registered app, Content Posting API configuration, approved `video.publish` scope, user authorization and valid media source. TikTok states that content posted by unaudited clients is restricted to private viewing until the API client passes audit.
- LinkedIn distinguishes member publishing (`w_member_social`) from organization publishing (`w_organization_social`); organization posts also require an eligible organization role. Version headers and supported API versions matter.
- YouTube video uploads require an authorized upload-capable OAuth scope such as `youtube.upload`; API quota applies.
- Facebook, Instagram, X, Snapchat, Discord, Telegram and WhatsApp must not be described as natively publishable unless a corresponding first-party adapter and live permission check are actually implemented. Read-only Instagram creator research is not publishing access.

External publish/schedule operations remain behind the existing exact-content/account/time approval and provider receipt checks. An accepted upload, queued job or processing response is not proof of publication. Ambiguous outcomes must be reconciled rather than automatically retried.

## No-Claude operating model
Claude is an optional private execution provider, not a prerequisite for this department. Marketing skills and resources are native Magnanimous code and data. Normal marketing chat selects the skills locally and supplies the relevant instructions to the model path already chosen by Magnanimous. The repository's provider architecture already makes Anthropic a metered optional fallback alongside free-first routes. No Claude-specific plugin, file layout, API or subscription is required for this feature.

This is not the same as claiming that Magnanimous can operate without any model or provider. A model execution engine is still needed for natural-language generation; native routing can use configured free-first options before any metered fallback. Image/video generation, social network access and analytics similarly require the relevant native runtime or authorized platform API. The feature does not enable paid services or bypass cost controls.

## Editorial quality model
The 100-point rubric weights audience value (20), truth/evidence (20), hook (15), brand voice (15), platform fit (10), originality/usefulness (10), CTA (5) and clarity (5). Critical falsehood, missing required disclosure, rights/consent failures, impersonation or provider-policy violations block publication regardless of score. Scores are internal editorial aids, not predictions of virality or sales.

## Verification plan
The branch adds a deterministic regression test for skill discovery, relevant matching, resource retrieval, channel boundaries and automatic chat context injection. Full-platform CI remains responsible for the wider Worker syntax, frontend build, deterministic runtime tests and browser journeys. No production deployment or live social posting is implied by merging this code.
