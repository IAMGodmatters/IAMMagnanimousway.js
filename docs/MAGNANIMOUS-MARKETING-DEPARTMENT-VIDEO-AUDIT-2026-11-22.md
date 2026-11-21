# Video Research Audit: Magnanimous AI Marketing Department

Date: 2026-11-22
Video: https://youtu.be/CkoJauJIyQs
Public source repository: https://github.com/Blotato-Inc/blotato-skills

## Executive finding
The video demonstrates an agent-based social marketing workflow. The reusable lesson is to divide work into small, focused skills coordinated by one agent. Magnanimous already has the more important foundation: a provider-neutral brain, a built-in Agent Skills registry, Capability Mesh, Social Studio, Creator Growth, Publishing Calendar, Media Studio and tenant memory. The correct integration is an extension of those systems, not a parallel SaaS clone.

## Video content summary
The presenter demonstrates content strategy/coaching, brand brief capture, post writing, editorial grading, scheduling/publishing, repurposing, viral-hook generation and content generation. The broader workflow includes reviewing existing assets/analytics, creating or editing images and video, and scheduling/publishing across social destinations. The business model is a managed social-content service sold in monthly packages.

## Independent findings
1. The public Blotato skills repository currently describes eight skill families: Content Coach, Brand Brief, Post Writer, Post Grader, Post Scheduler, Repurpose, Viral Hooks and Generate. A video may demonstrate a subset; the current repository should be treated as the current feature inventory.
2. Skills are portable instruction files, not autonomous infrastructure. They do not themselves supply social account authorization, media hosting, model inference, analytics, publishing APIs or app approval.
3. Do not copy proprietary source or assume a third-party skill's license permits redistribution. Implement the public workflow concepts independently in Magnanimous and retain attribution for any reused open-source code under its applicable license.
4. Social publishing is provider- and account-specific. Each network has its own OAuth scopes, app-review rules, media constraints, rate limits, privacy settings and receipt semantics.
5. TikTok's Content Posting API requires appropriate authorization and app review; unaudited clients have private-only restrictions. A successful upload/initiation request is not proof of public publication; reconcile the asynchronous status.
6. LinkedIn posting requires appropriate member or organization permissions and user authorization. An integration's existence does not prove the requested scope is granted.
7. A post grader is an editorial heuristic. It cannot guarantee distribution, virality, follower growth or revenue.
8. Paid media, AI generation, analytics tiers, scheduling vendors and API usage can create variable costs. Free skill files do not make those services free.

## Magnanimous implementation decision
- Extend the existing Agent Skills BUILTIN registry with magnanimous-marketing-department.
- Add a portable SKILL.md resource under skills/magnanimous-marketing-department/.
- Reuse existing Social Studio, Creator Growth, Media Studio, Publishing Calendar, tenant knowledge/memory, Tool Foundry and Capability Mesh.
- Keep all external model providers optional and replaceable; do not require Claude.
- Preserve existing publishing approvals, tenant boundaries, usage guards, consent and cost controls.
- No new external social API, SaaS dependency, paid account or provider secret is introduced by this skill.

## Provider readiness limitations
The existing calendar's supported scheduled destinations must be read from the live provider registry and tenant connections. Do not represent Facebook, Instagram, X, TikTok or LinkedIn as uniformly ready. In particular, the existing social-publishing skill documents one-time YouTube, TikTok and LinkedIn scheduling through official OAuth connections; TikTok requires status reconciliation. Validate the live implementation and provider app review before promising public posting. No new provider adapter is claimed by this change.

## Sources for verification
- Video: https://youtu.be/CkoJauJIyQs
- Blotato public skills repository: https://github.com/Blotato-Inc/blotato-skills
- Agent Skills specification: https://agentskills.io/specification
- TikTok Content Posting API overview: https://developers.tiktok.com/doc/content-posting-api-get-started
- TikTok Direct Post API reference: https://developers.tiktok.com/doc/content-posting-api-reference-direct-post
- TikTok posting status reference: https://developers.tiktok.com/doc/content-posting-api-reference-query-video-status
- LinkedIn Posts API: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api
- LinkedIn permissions: https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access

## Acceptance criteria
- The native skill is discoverable by name and relevant marketing prompts.
- The portable SKILL.md passes Magnanimous's existing parser/validator.
- Existing social-publishing skill and all existing skills remain available.
- Skill instructions preserve existing approval, authorization, billing, tenant and privacy gates.
- No deployment or live publishing claim is made without independent evidence.
