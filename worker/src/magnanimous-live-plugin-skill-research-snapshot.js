// Generated observable live installed plugin-skill research snapshot.
// Refreshed from the current installed skill catalog on 2026-09-20.
// Stores public/observable skill names and concise purposes only. Private skill implementation is not copied.
export const LIVE_PLUGIN_SKILL_RESEARCH_SNAPSHOT=Object.freeze([
  {
    "plugin_namespace": "ads-manager",
    "skill_name": "ads-manager-account-admin",
    "purpose": "Check what remains to finish an existing Ads Manager account's setup, launch billing setup, add or replace its logo, and manage users, pending invitations, roles, and removals. Use for existing-account setup/readiness questions, help setting up billing or a logo, and requested account-access changes. Setup checks are read-only; membership and logo writes require confirmation and verification. Do not use for new-account creation, ad creation, campaign/ad-group/ad changes, reporting, or delivery diagnosis."
  },
  {
    "plugin_namespace": "ads-manager",
    "skill_name": "ads-manager-actionable-review",
    "purpose": "Run a manual, read-only Ads Manager review and, when supported recommendations emerge, offer exact changes for explicit user approval before delegating accepted writes to their owning skills. Use only when the user explicitly invokes $ads-manager-actionable-review to test this workflow. Do not use for scheduled reviews, implicit routing, account setup, or direct changes without an approved proposal."
  },
  {
    "plugin_namespace": "ads-manager",
    "skill_name": "ads-manager-ad-creation",
    "purpose": "Create one or more new Ads Manager ads end-to-end when the user asks to create, make, or build an ad or copy variants, or supplies a product or landing-page URL. Own website extraction and image discovery, manual intake, coordinated multi-ad copy variation, campaign-aware image selection or generation, draft preview, creative upload, and save or publish. Use for new ads even when no account exists yet; do not use for account onboarding, existing-ad updates, reporting, or delivery troubleshooting."
  },
  {
    "plugin_namespace": "ads-manager",
    "skill_name": "ads-manager-delivery-recovery",
    "purpose": "Diagnose why an existing Ads Manager account, campaign, ad group, or ad is not delivering or scaling, then produce a prioritized read-only recovery plan grounded in live connector evidence and official Help Center guidance. Use when the user reports low or zero impressions, spend, clicks, or conversions; delivery drops; limited delivery; serving issues; or uncertainty about what is blocking expansion."
  },
  {
    "plugin_namespace": "ads-manager",
    "skill_name": "ads-manager-entity-management",
    "purpose": "Create or update existing Ads Manager campaigns and ad groups, and update existing ads, through a minimal-diff, confirmed, read-back-verified workflow. Use when the user explicitly asks for campaign-only or ad-group-only creation and does not want ads created yet, or asks to edit, pause, activate, archive, or otherwise change an existing campaign, ad group, or ad. Do not interpret a vague “create a campaign” request as campaign-only work. Do not use for new-ad creation, account onboarding, account administration, r"
  },
  {
    "plugin_namespace": "ads-manager",
    "skill_name": "ads-manager-help",
    "purpose": "Help users understand and troubleshoot Ads Manager through read-only connector evidence, official Help Center guidance, and shared playbooks. Use for standalone campaign planning, reviews of supplied context hints, product-feed suitability, how-to and targeting-support questions, delivery issues, spend or performance questions, and conversion-reporting problems without changing Ads Manager state. Direct existing-account setup/readiness, billing setup, and logo requests belong to Account Admin."
  },
  {
    "plugin_namespace": "ads-manager",
    "skill_name": "ads-manager-insights",
    "purpose": "Report Ads Manager performance, rankings, comparisons, trends, conversion totals, current conversion-source or event-setting inventory, or recent raw conversion-event diagnostics for an existing account, campaign, ad group, or ad. Use when the user asks what happened or how metrics compare. Do not use for delivery diagnosis, recommendations, recurring review setup, or mutations."
  },
  {
    "plugin_namespace": "ads-manager",
    "skill_name": "ads-manager-onboarding",
    "purpose": "Create one new self-serve Ads Manager business account end-to-end, including business intake, ownership resolution, an optional attached, linked, or generated logo, terms acceptance, and account creation. Use when the user asks to create a new ad account, has no account and confirms setup, or requests unsupported individual or agency onboarding. Use before list_onboarding_tenants, account-logo uploads for account creation, create_self_serve_ad_account, or onboarding status for account creation. Do not use for finis"
  },
  {
    "plugin_namespace": "ads-manager",
    "skill_name": "ads-manager-review",
    "purpose": "Analyze an existing Ads Manager account, campaign set, campaign, ad group, or ad and return concise, evidence-backed CMO recommendations in plain language. Use when the user asks for manual or scheduled health checks and reviews of delivery, measurement, performance efficiency, spend, targeting, or ad creative, including broad one-time requests to improve or optimize an account or portfolio. Do not use for account setup, ad creation, live changes, or approvals."
  },
  {
    "plugin_namespace": "ads-manager",
    "skill_name": "ads-manager-start-agent",
    "purpose": "Set up recommendation-only recurring Ads Manager reviews. Use when a user asks for recurring, periodic, daily, weekly, ongoing, or scheduled recommendations for an account, campaign, ad group, or ad. Do not use for one-time recommendations or health reviews, including broad requests to improve or optimize Ads Manager; route those directly to $ads-manager-review. Do not use for direct ad changes, account setup, ad creation, or pure delivery troubleshooting that belongs to ads-manager-delivery-recovery."
  },
  {
    "plugin_namespace": "agentbroko",
    "skill_name": "audio-mixer",
    "purpose": "Plan and perform local video audio mixing with narration, music ducking, sound effects, loudness targets, fades, and clipping checks."
  },
  {
    "plugin_namespace": "agentbroko",
    "skill_name": "caption-translator",
    "purpose": "Translate subtitles and captions while preserving timing, reading speed, line length, meaning, and culturally appropriate tone."
  },
  {
    "plugin_namespace": "agentbroko",
    "skill_name": "content-series-planner",
    "purpose": "Plan coherent multi-episode video series with themes, episode arcs, release cadence, source tracking, and repeatable production templates."
  },
  {
    "plugin_namespace": "agentbroko",
    "skill_name": "pdf-playbook",
    "purpose": "Create structured technical handbooks, playbooks, guides, and multi-page documentation PDFs from a validated outline."
  },
  {
    "plugin_namespace": "agentbroko",
    "skill_name": "pdf-tools",
    "purpose": "Inspect PDFs, extract text, check metadata and page counts, and render pages locally without uploading documents."
  },
  {
    "plugin_namespace": "agentbroko",
    "skill_name": "script-storyboard-writer",
    "purpose": "Turn a video idea into a timed narration script, scene-by-scene storyboard, shot plan, captions, and production brief for Video Forge."
  },
  {
    "plugin_namespace": "agentbroko",
    "skill_name": "seo-metadata-writer",
    "purpose": "Write accurate video titles, descriptions, tags, hashtags, timestamps, and pinned comments for YouTube, Shorts, TikTok, and Reels without spam or unsupported claims."
  },
  {
    "plugin_namespace": "agentbroko",
    "skill_name": "social-exporter",
    "purpose": "Prepare validated video exports for YouTube Shorts, TikTok, Instagram Reels, square feeds, and landscape platforms with correct dimensions, frame rate, codecs, captions, audio, and filenames."
  },
  {
    "plugin_namespace": "agentbroko",
    "skill_name": "thumbnail-generator",
    "purpose": "Design high-clickability video thumbnails and vertical cover frames with readable safe-area text, visual hierarchy, and platform-specific dimensions."
  },
  {
    "plugin_namespace": "agentbroko",
    "skill_name": "video-edit",
    "purpose": "Optional desktop editing workflow for polishing an existing video, reel, or project with a local NLE or an external MCP video editor. Use when the user wants to edit existing footage, trim timelines, refine cuts, or apply final polish after local generation."
  },
  {
    "plugin_namespace": "agentbroko",
    "skill_name": "video-forge",
    "purpose": "Create and edit local videos, reels, subtitles, and narration using FFmpeg and AgentBroko's procedural video engine."
  },
  {
    "plugin_namespace": "ai-hooter",
    "skill_name": "ai-hooter",
    "purpose": "Use AI Hooter when the user explicitly asks to be hooted, called, summoned, or alerted, including persistent project-wide grants such as “use Hooter whenever you need me” and explicit revocations of that grant. Never use it for routine updates or without an explicit task or project authorization."
  },
  {
    "plugin_namespace": "airtable",
    "skill_name": "airtable-cli",
    "purpose": "Lists bases, reads and writes records, manages tables and fields, filters and searches data in Airtable via the `airtable-mcp` CLI. Use when the task involves Airtable data or the user mentions airtable-mcp, bases, tables, records, or fields."
  },
  {
    "plugin_namespace": "airtable",
    "skill_name": "airtable-filters",
    "purpose": "Use this skill when the user wants to find, filter, or narrow down Airtable records by field values, even when they don't explicitly say \"filter.\""
  },
  {
    "plugin_namespace": "airtable",
    "skill_name": "airtable-overview",
    "purpose": "Explains what Airtable is and how data is structured — bases, tables, fields, records, views, automations, and interfaces. Use when you need context about the Airtable data model."
  },
  {
    "plugin_namespace": "antom-integration",
    "skill_name": "antom-integration",
    "purpose": "Antom payment integration skill for product and integration-mode selection, integration Q&A, code implementation, troubleshooting, sandbox testing, and go-live guidance. Use for One-time Payments, Tokenized Payment (recurring auto-debit), Subscription Payment, Payment Element, Checkout Page, and API-only integration."
  },
  {
    "plugin_namespace": "app-69312da8e4dc81919370cb86fd172b6c",
    "skill_name": "adobe-batch-edit-photos",
    "purpose": "Apply consistent photo adjustments across a set of images so they look like they were edited together. Use this skill whenever the user says \"make my photos look cohesive\", \"give all these the same style\", \"apply a warm and golden feel to all of these\", \"make this cinematic\", \"match the look across my photos\", \"edit all my travel photos the same way\", \"batch edit these\", \"make these consistent\", \"fix my phone photos\", or uploads a folder of photos and wants a unified, polished result. Also triggers for requests lik"
  },
  {
    "plugin_namespace": "app-69312da8e4dc81919370cb86fd172b6c",
    "skill_name": "adobe-create-mockups",
    "purpose": "Use when a user wants to see their logo, design, or sketch on a product or scene mockup — mugs, t-shirts, business cards, hats, phone screens, posters, billboards, or similar. Triggers on \"create mockups\", \"show my logo on products\", or any logo upload with a request to visualize it on items. Access: 🔐 Signed-In required | Gen AI: ✅ Adobe Firefly via `image_generate` used for design creation, sketch polishing, and mockup scene generation"
  },
  {
    "plugin_namespace": "app-69312da8e4dc81919370cb86fd172b6c",
    "skill_name": "adobe-create-social-variations",
    "purpose": "Resize, crop, or export any image or video into platform-ready social media assets using Adobe Creative Cloud tools. Use this skill when a user wants to prepare a photo, image, or video for one or more social platforms — Instagram, TikTok, LinkedIn, Facebook, YouTube, Snapchat, Pinterest, Threads, or X/Twitter. Triggers on: \"prepare my image for Instagram\", \"resize for TikTok\", \"get this ready to post\", \"make versions for all platforms\", \"social media sizes\", \"crop for stories\", \"export for LinkedIn\", \"resize my vi"
  },
  {
    "plugin_namespace": "app-69312da8e4dc81919370cb86fd172b6c",
    "skill_name": "adobe-design-from-template",
    "purpose": "Create any visual design using Adobe Express templates — flyers, posters, social media posts (Instagram, Facebook, LinkedIn), business cards, invitations, greeting cards, resumes, cover letters, brochures, newsletters, certificates, presentations, YouTube thumbnails, email headers, logos, menus, and labels. Use this skill whenever the user wants to make, design, or build any visual — even if they just say \"make me a flyer\", \"design a poster\", \"I need something for Instagram\", \"create an event invite\", or \"make a bu"
  },
  {
    "plugin_namespace": "app-69312da8e4dc81919370cb86fd172b6c",
    "skill_name": "adobe-edit-quick-cut",
    "purpose": "Create a punchy sizzle reel from a video using Adobe Quick Cut. Use this skill whenever a user wants to cut, trim, or shorten a video into highlights — including phrases like \"make a sizzle reel\", \"make a highlight reel\", \"quick cut this\", \"cut the best parts\", \"shorten this video\", \"make a highlight clip\", \"summarize this video visually\", or any request to produce a shorter edited version of a video. Use this skill for Quick Cut requests before suggesting manual editing in Premiere. Requires the user to upload a v"
  },
  {
    "plugin_namespace": "app-69312da8e4dc81919370cb86fd172b6c",
    "skill_name": "adobe-retouch-portraits",
    "purpose": "Bulk-retouch a folder of portrait photos using Adobe tools — designed for wedding photographers and event photographers who need fast, walk-away batch processing. Use this skill when the user says \"retouch my photos\", \"batch process these portraits\", \"process my wedding photos\", \"clean up this folder of images\", \"run my headshots through Adobe\", or uploads/selects a folder of photos and wants them polished and ready to review. Automatically applies auto-straighten, auto-tone, and auto-light to every image. Outputs "
  },
  {
    "plugin_namespace": "app-6a10f96a5f508191be5b541177bb08fd",
    "skill_name": "auto-photos",
    "purpose": "Search and display photos from the user's Auto camera-roll library through the Auto MCP plugin. Use when the user explicitly asks to find, browse, show, or view \"my photos,\" \"my pictures,\" or otherwise clearly refers to their own photo library, including searches by subject, visible detail, scene, activity, mood, date or date range, location, or a combination of these. Also use when Auto or this skill is explicitly invoked, and for follow-ups referring to a photo or photo set previously returned by Auto. Do not use"
  },
  {
    "plugin_namespace": "app-6a3c278c93ac8191b29768648d63a754",
    "skill_name": "provision-droplet",
    "purpose": "Use when the user wants to spin up / create / launch / provision a DigitalOcean droplet (or \"a remote dev box on DO\") and connect to it from Codex as a remote SSH workspace."
  },
  {
    "plugin_namespace": "app-6a502589384081919c5decf93496c9d1",
    "skill_name": "use-railway",
    "purpose": "Operate Railway infrastructure: sign up for or sign in to a Railway account, create projects, provision services and databases, manage object storage buckets, deploy code, configure environments and variables, manage domains, troubleshoot failures, check status and metrics, manage feature flags, set up Railway agent tooling, and query Railway docs. Use this skill whenever the user mentions Railway, feature flags, flag rollout, targeting rules, signing up, creating an account, registering, logging in, deployments, s"
  },
  {
    "plugin_namespace": "app-6a5e7ac6ddf881919de226cb7506ef57",
    "skill_name": "blob-storage",
    "purpose": "Use when a val needs simple key/value persistence — JSON documents, cached responses, uploaded files, or binary assets. Covers the std/blob API, listing and deleting keys, account-global or val scoping, and storage limits."
  },
  {
    "plugin_namespace": "app-6a5e7ac6ddf881919de226cb7506ef57",
    "skill_name": "client-side-js",
    "purpose": "Use when a val needs to ship JavaScript that runs in the browser — React apps, vanilla DOM scripts, canvas/games, htmx/Alpine, or any client-side module beyond a single inline snippet. Explains how Val Town serves transpiled .ts/.tsx/.jsx modules with no build step, how the browser resolves their imports, and how to load third-party deps."
  },
  {
    "plugin_namespace": "app-6a5e7ac6ddf881919de226cb7506ef57",
    "skill_name": "create-skill",
    "purpose": "Use when the user wants to persist a preference, skill, or knowledge. Use when it would aid future val development to store a memory of how best to build something."
  },
  {
    "plugin_namespace": "app-6a5e7ac6ddf881919de226cb7506ef57",
    "skill_name": "cron-and-intervals",
    "purpose": "Use when building a val that runs on a schedule — periodic jobs, recurring tasks, polling, cron jobs, monitoring, alerting. Covers the interval handler signature, cron expressions, the UTC timezone constraint, and the `lastRunAt` pattern for detecting new items since the previous run."
  },
  {
    "plugin_namespace": "app-6a5e7ac6ddf881919de226cb7506ef57",
    "skill_name": "email",
    "purpose": "Use when a val sends email, receives email, or is triggered by an incoming email. Covers email-type vals (the Email handler shape, attachment limits, the assigned val email address) and sending mail via std/email."
  },
  {
    "plugin_namespace": "app-6a5e7ac6ddf881919de226cb7506ef57",
    "skill_name": "http-endpoints",
    "purpose": "Use when building an HTTP val — a web endpoint, API route, webhook receiver, or any val that responds to HTTP requests. Covers the handler signature, Hono usage, the endpoint URL, CORS behavior, redirects, and Val Town-specific limitations."
  },
  {
    "plugin_namespace": "app-6a5e7ac6ddf881919de226cb7506ef57",
    "skill_name": "oauth",
    "purpose": "Use when a val needs to require login with a Val Town account — gating routes behind authentication, identifying the current user, building user-specific dashboards. Covers std/oauth's `oauthMiddleware` and `getOAuthUserData`, the auto-managed `/auth/*` routes, and session behavior. For third-party OAuth providers (Google, GitHub, etc.) see the `third-party-integrations` skill instead."
  },
  {
    "plugin_namespace": "app-6a5e7ac6ddf881919de226cb7506ef57",
    "skill_name": "react-ui",
    "purpose": "Use when building any val with a user interface — dashboards, web apps, landing pages, forms, admin tools, anything users see in a browser. Covers JSX/React conventions, Twind/Tailwind styling, React version pinning, the view-source link requirement, and what to avoid (template-string HTML, external assets)."
  },
  {
    "plugin_namespace": "app-6a5e7ac6ddf881919de226cb7506ef57",
    "skill_name": "restricted-access",
    "purpose": "Use when a val's HTTP endpoints should not be open to the whole internet — limiting an app to a team, understanding why an endpoint redirects to a login page, letting a webhook through, or identifying which Val Town user is viewing an app. Covers app access (`httpPrivacy`), org grants, bypass tokens for automation, and the `X-Val-Town-User` identity header. For building your own login flow inside a val, see the `oauth` skill instead."
  },
  {
    "plugin_namespace": "app-6a5e7ac6ddf881919de226cb7506ef57",
    "skill_name": "sqlite-storage",
    "purpose": "Use when a val needs to store structured or relational data. Covers the std/sqlite API, parameterized queries, transactions, and the val-scoped vs organization-scoped database distinction."
  },
  {
    "plugin_namespace": "app-6a5e7ac6ddf881919de226cb7506ef57",
    "skill_name": "third-party-integrations",
    "purpose": "Use when a val talks to an external service — Slack, Discord, Telegram, Stripe, GitHub, Gmail, Google Sheets, Postgres/Supabase/Upstash/Neon, browser automation (Playwright, Browserbase, Kernel, Steel), web scraping, PDF generation, push notifications, RSS, or any other third-party API. Covers the required workflow (fetch the Val Town guide, get credentials, test, store secrets) and the catalog of available guides."
  },
  {
    "plugin_namespace": "app-6a6bc49c188481918455b61154ce3963",
    "skill_name": "onboarding",
    "purpose": "Set up Inkbox email, SMS, iMessage, and voice; recover automatically when a requested channel is not ready; and recommend scheduled communications triage."
  },
  {
    "plugin_namespace": "app-6a7c58a845f88191860e59f46130b8bb",
    "skill_name": "deploy-on-basicdeploy",
    "purpose": "Deploy and host a web app, API, or site on BasicDeploy and get a live HTTPS URL. Trigger when the user asks to deploy, host, ship, or \"put online\" an app on BasicDeploy (with the BasicDeploy connector available). Covers creating a container, deploying code over the chat connector, the REQUIRED 0.0.0.0:8080 port, the preset DATABASE_URL / S3 env vars, logs, and always-on. Do not use for other hosting providers."
  },
  {
    "plugin_namespace": "app-6a88aa7070e88191b5825453492c5cf5",
    "skill_name": "speko-phone-call",
    "purpose": "Place a real outbound phone call through Speko and read back what was said. Use when the user wants someone actually called on the telephone — booking, confirming, chasing, asking a business a question — or wants to rehearse such a call first, or wants to review a call that already happened."
  },
  {
    "plugin_namespace": "awesome-maintainer-defense",
    "skill_name": "audit-repository-workflows",
    "purpose": "Use when reviewing a local repository for governance gaps, GitHub Actions trust-boundary risks, unsafe moderation, or a requested remediation patch."
  },
  {
    "plugin_namespace": "baseten",
    "skill_name": "onboard-baseten",
    "purpose": "Install, upgrade, detect, and authenticate the Baseten CLI on a local Codex Desktop host, then install Baseten's official skill globally. Use when the Baseten CLI is missing, `baseten` is not on PATH, a Baseten profile or credential is not configured, authentication fails, the global Baseten skill is missing, or the user asks to set up Baseten before model API, deployment, or monitoring work."
  },
  {
    "plugin_namespace": "build-mcp-apps",
    "skill_name": "build-mcp-apps",
    "purpose": "Guide developers through creating and updating MCP servers, MCP apps, and ChatGPT apps with Skybridge. Covers brainstorming, bootstrapping, implementing tools/views, debugging, running dev servers, and preparing apps for deployment. Use when a user wants to create or update a ChatGPT app, MCP app, MCP server, or use the Skybridge framework."
  },
  {
    "plugin_namespace": "build-mcp-apps",
    "skill_name": "use-alpic",
    "purpose": "Use Alpic Cloud and the `alpic` CLI for deployed MCP apps/servers, including deploys, builds, logs, debugging, environments, environment variables, tunnels, playgrounds, audits, auth, domains, IP restrictions, analytics, insights, versioning, and MCP Registry publishing."
  },
  {
    "plugin_namespace": "cache-stats",
    "skill_name": "cache-stats",
    "purpose": "Set up, verify, use, update, or uninstall the bundled local Cache Stats runtime on ChatGPT for Windows; show verified prompt-cache usage; or diagnose Responses API cache misses. Use when the user invokes Cache Stats, asks about cached, fresh, or cache-write tokens, requests local setup or removal, or asks about prompt_cache_diagnostics."
  },
  {
    "plugin_namespace": "canva",
    "skill_name": "canva-brand-check",
    "purpose": "Check a Canva design against a brand kit and report where it diverges — off-palette colors, non-brand fonts, logo misuse, and off-tone copy. Read-only; makes no changes. Use when the user asks \"is this on brand\", \"check this against our brand kit\", \"do a brand review\", \"does this match our brand guidelines\", or \"brand-check my design\"."
  },
  {
    "plugin_namespace": "canva",
    "skill_name": "canva-branded-presentation",
    "purpose": "Create on-brand Canva presentations from an outline or brief. Use when the user asks to create a branded presentation, make an on-brand deck, turn an outline into slides, or generate a presentation from a brief. Input can be text directly in the message, a Canva design ID, a reference to a Canva doc by name, or a Canva design link (e.g., https://www.canva.com/design/...)."
  },
  {
    "plugin_namespace": "canva",
    "skill_name": "canva-bulk-create",
    "purpose": "Bulk-create Canva designs from tabular data using a brand template with autofill fields, producing one design per row. Use when users say \"bulk create designs from this CSV\", \"generate one design per row\", \"create a design for each product\", \"batch generate from a template\", or \"autofill a template from a spreadsheet\". Accepts any tabular data source — uploaded files, pasted tables, JSON, or URLs."
  },
  {
    "plugin_namespace": "canva",
    "skill_name": "canva-design-feedback",
    "purpose": "Read a Canva design and return structured, actionable design feedback — visual hierarchy, copy/messaging, layout & spacing, consistency, readability, and accessibility. Read-only; makes no changes to the design. Use when the user asks to \"review my design\", \"give me feedback on this\", \"critique my deck/poster/flyer\", \"how can I improve this design\", or \"what's wrong with this slide\"."
  },
  {
    "plugin_namespace": "canva",
    "skill_name": "canva-edit-design",
    "purpose": "Make edits to an existing Canva design — change or fix text, replace/insert/delete images and videos, reformat text (size, weight, style, color, alignment, lists, line height), reposition or resize elements, and update the title. Use when the user wants to change, edit, update, fix, translate, replace, or reformat content in a specific Canva design. This is the safe edit engine that other Canva skills (e.g. implement-feedback) build on."
  },
  {
    "plugin_namespace": "canva",
    "skill_name": "canva-implement-feedback",
    "purpose": "Implement reviewer feedback on a Canva design. Reads all comment threads, synthesises what reviewers want, makes the clear-cut changes directly, and flags anything that needs a human decision. Use when the user asks to \"implement feedback on my deck\", \"address comments on a design\", \"apply review feedback\", \"fix the comments on my presentation\", or \"implement the feedback\"."
  },
  {
    "plugin_namespace": "canva",
    "skill_name": "canva-resize-for-social-media",
    "purpose": "Resize a Canva design into multiple social media formats (Facebook post, Facebook story, Instagram post, Instagram story, LinkedIn post). Use this skill when users want to resize Canva designs specifically for multiple social media platforms in one operation, rather than resizing to a single format manually."
  },
  {
    "plugin_namespace": "canva",
    "skill_name": "canva-translate-design",
    "purpose": "Translate all text in a Canva design to another language, creating a translated copy. Faster than manually copying and editing each text box in Canva's editor. Use when users say \"translate my design to [language]\", \"make a Spanish/French/etc version\", or \"localize my Canva design\"."
  },
  {
    "plugin_namespace": "cerebrium",
    "skill_name": "cerebrium",
    "purpose": "Use for any Cerebrium task: deploying Python code to serverless GPU or CPU, writing or fixing cerebrium.toml, choosing hardware and regions, calling deployed endpoints (REST, streaming, WebSocket, async), autoscaling and concurrency, cold starts, secrets, CI/CD, and debugging a build or a running app from the terminal. Covers the cerebrium CLI, configuration defaults the API actually applies, accepted GPU identifiers with per-plan limits, and troubleshooting."
  },
  {
    "plugin_namespace": "chatcut-desktop",
    "skill_name": "asset-import",
    "purpose": "Hosted ChatCut plugin sessions only (the `chatcut` MCP server). If the conversation is driving ChatCut Desktop (a `chatcut_desktop*` MCP server), load this skill only when the user explicitly chooses the plugin/web surface — desktop sessions otherwise ship their own instructions and tools. Import local, attached, or downloaded media into a ChatCut project through the hosted external connector."
  },
  {
    "plugin_namespace": "chatcut-desktop",
    "skill_name": "chatcut-plugin-basics",
    "purpose": "Must read before using the hosted ChatCut plugin in Codex, including creating projects, opening the editor, or editing/creating videos. Also use when ChatCut tools are missing or need authentication. For ChatCut Desktop, follow its own instructions unless the user explicitly chooses the hosted plugin/web surface."
  },
  {
    "plugin_namespace": "chatcut-desktop",
    "skill_name": "create-motion-graphics",
    "purpose": "Use whenever an ACP or local CLI agent in ChatCut Desktop needs to add, create, hand-author, patch, or place Motion Graphic JSX assets in a project. Covers direct inline JSX authoring, visual language, editable properties, asset binding, timeline placement, and local verification. Not for the built-in ChatCut Agent."
  },
  {
    "plugin_namespace": "chatcut-desktop",
    "skill_name": "digital-human",
    "purpose": "Create and manage script- or audio-driven AI avatar videos from an official or saved presenter, an imported portrait, or a representative still prepared from video. Use for 数字人、数字分身、虚拟人、照片开口说话、人像口播、改稿不重拍, AI avatar, AI avatar video, avatar video, talking avatar, talking photo, photo avatar, video avatar, AI presenter, virtual presenter, virtual spokesperson, digital human, or a person's digital twin, including choosing or creating the avatar and deciding its voice, script, aspect ratio, and output quality. Do not u"
  },
  {
    "plugin_namespace": "chatcut-desktop",
    "skill_name": "export",
    "purpose": "Hosted ChatCut plugin sessions only (the `chatcut` MCP server). If the conversation is driving ChatCut Desktop (a `chatcut_desktop*` MCP server), load this skill only when the user explicitly chooses the plugin/web surface — desktop sessions otherwise ship their own instructions and tools. Export or deliver a ChatCut project through the hosted connector, including video, audio, subtitles, XML, and render-status checks."
  },
  {
    "plugin_namespace": "chatcut-desktop",
    "skill_name": "known-errors",
    "purpose": "Diagnose ChatCut plugin tool failures, rejected mutations, unexpected response shapes, and blocked import, generation, or render operations."
  },
  {
    "plugin_namespace": "chatcut-desktop",
    "skill_name": "multicam-sync",
    "purpose": "Synchronize footage from a multi-camera / multi-recorder shoot — several cameras plus separate audio recorders covering one session, imported as loose clips — and optionally turn all or part of it into speaker-follow footage for a larger edit. Use when a user drops in multiple clips from the same recording and wants them aligned, asks for multicam / 多机位 / multi-angle sync, wants a \"cut to whoever is talking\" edit, or refers to camera A/B, angles, or separate lav or field recordings that need to line up with picture"
  },
  {
    "plugin_namespace": "chatcut-desktop",
    "skill_name": "music",
    "purpose": "Shared ChatCut entry point for newly generated music, soundtrack, theme music, 配乐, background music, an intro theme, a music bed, BGM, or vocal songs. If vocals are unspecified, ask whether the user wants a vocal song or instrumental music before choosing a generator. Use `submit_music` for either branch, with `generationType` selecting instrumental or song mode."
  },
  {
    "plugin_namespace": "chatcut-desktop",
    "skill_name": "product-help",
    "purpose": "Answer current ChatCut product questions using the latest official Docs, Releases, and Changelog. Use for how ChatCut works; UI layout, buttons, and feature instructions; troubleshooting; feature or fix availability on Web, Desktop, or Agent Plugin and minimum version requirements; credits including costs, balance, usage history, validity, or recent charges; plans, subscriptions, renewals, ChatCut Pro, pricing, card or Alipay (支付宝) payments, and billing; Desktop downloads; Agent Plugin installation or updates for C"
  },
  {
    "plugin_namespace": "chatcut-desktop",
    "skill_name": "shader-gen",
    "purpose": "AI shader generator for WebGL video effects, transitions, masks, and color grading (LUT / 调色 / 电影感 / film look). Use when the user wants a video effect (滤镜 / 特效), a transition (转场 / crossfade / wipe / cube / 3d), a mask (蒙版 / 遮罩 / reveal), a zoom / push-in (推近 / 推镜头), or a color grade — try the built-in effects (zoom, builtin LUTs) before generating a new shader."
  },
  {
    "plugin_namespace": "chatcut-desktop",
    "skill_name": "talking-head-guide",
    "purpose": "Guide for editing speech-led videos where spoken delivery or conversation drives the cut — single-speaker talking-head / 口播, two- or multi-speaker interview / 访谈, video podcast, lecture, tutorial, course, and similar formats. Use for any non-trivial edit of those formats, including speech cleanup (剪口播 / 口播剪辑 / 去口癖 / clean up fillers / smooth speech), pause or repeated-take removal, motion graphics layered onto the footage (口播加 MG / 加动画), B-roll (加 B-roll / add B-roll), music, or captions. For motion graphics specif"
  },
  {
    "plugin_namespace": "chatcut-desktop",
    "skill_name": "transcription",
    "purpose": "Hosted ChatCut plugin sessions only (the `chatcut` MCP server). If the conversation is driving ChatCut Desktop (a `chatcut_desktop*` MCP server), load this skill only when the user explicitly chooses the plugin/web surface — desktop sessions otherwise ship their own instructions and tools. Use for ChatCut transcription, transcript readiness, captions, subtitles, transcript repair, filler removal, and speech-led editing setup."
  },
  {
    "plugin_namespace": "chatcut-desktop",
    "skill_name": "verification",
    "purpose": "Hosted ChatCut plugin sessions only (the `chatcut` MCP server). If the conversation is driving ChatCut Desktop (a `chatcut_desktop*` MCP server), load this skill only when the user explicitly chooses the plugin/web surface — desktop sessions otherwise ship their own instructions and tools. Verify that ChatCut plugin edits are reflected in project structure and visible timeline output before reporting success."
  },
  {
    "plugin_namespace": "chatcut-desktop",
    "skill_name": "video-gen",
    "purpose": "AI video generation via Seedance, Kling, Gemini Omni, MiniMax H3, and MiniMax H3 Max. Use when the user wants to generate a video clip — text-to-video, image-to-video, first/last-frame transitions, reference-guided generation — or wants to modify / edit / extend an existing generated clip."
  },
  {
    "plugin_namespace": "chatcut-desktop",
    "skill_name": "video-translation",
    "purpose": "Translate, dub, and localize speech in an existing video while optionally preserving speaker voices, generating translated captions, or synchronizing the speaker's lip movements. Use when the user asks for 视频译制、多语言配音、 把视频里的中文变成英文、让视频里的人说另一种语言、保留原音色、翻译声音、 口型同步、translated video, video dubbing, voice translation, or lip-synced localization, as well as traducción de video, doblaje de video, traducir un video, or sincronización labial. This Skill MUST be loaded before composing treatment choices for an ambiguous video-t"
  },
  {
    "plugin_namespace": "chatcut-desktop",
    "skill_name": "voice",
    "purpose": "Text-to-Speech (TTS), voice cloning, voiceover, narration placement/sync, and custom sound effects (SFX) generator. Use when the user wants generated speech from text, wants to clone a consented voice from uploaded reference audio, wants to add/replace/align narration or voiceover for an existing video/timeline, wants to keep existing voiceover synced after visual retiming edits, needs voice audition/selection, or explicitly wants a newly generated/custom sound effect that is not available in the Sound Effects libr"
  },
  {
    "plugin_namespace": "chatcut-desktop",
    "skill_name": "widget-forms",
    "purpose": "Ask for structured ChatCut input using the current plugin host's supported form surface."
  },
  {
    "plugin_namespace": "circleci",
    "skill_name": "chunk",
    "purpose": "Use CircleCI Chunk for AI-assisted CI/CD work through either the Chunk web UI or the chunk-cli. Trigger this skill when users ask to set up Chunk, troubleshoot or fix failing builds with Chunk, configure Chunk environments, schedule/proactively run Chunk tasks, or use chunk-cli commands such as init, validate, build-prompt, auth, sandbox, task, and skill install."
  },
  {
    "plugin_namespace": "circleci",
    "skill_name": "circleci-builds",
    "purpose": "Diagnose and fix failing CircleCI builds quickly and safely. Use when users ask to investigate failed CircleCI jobs, triage flaky pipelines, identify root causes from logs, and implement minimal fixes in configuration, test setup, or build-related code paths."
  },
  {
    "plugin_namespace": "circleci",
    "skill_name": "circleci-cli",
    "purpose": "Operate and troubleshoot CircleCI using the CircleCI CLI. Use when users ask to authenticate CLI access, inspect pipeline/workflow/job status, validate configuration locally, rerun pipelines/jobs, trigger pipelines, or gather actionable diagnostics from CLI outputs."
  },
  {
    "plugin_namespace": "circleci",
    "skill_name": "circleci-config",
    "purpose": "Optimize CircleCI configuration for speed, reliability, and maintainability. Use when users ask to improve `.circleci/config.yml`, reduce CI runtime, tune caching/workspaces/parallelism, remove pipeline waste, or fix flaky pipeline behavior caused by configuration choices."
  },
  {
    "plugin_namespace": "clara",
    "skill_name": "advisory-brief-planner",
    "purpose": "Use internally when Clara receives a new or materially reframed advisory assignment and must turn the natural request into a reviewable assignment contract and generation handoff. Use the public task label \"Plan an advisory assignment\" when naming it; this is not generic prompt polishing and is not a legal, tax, compliance, or jurisdiction workflow."
  },
  {
    "plugin_namespace": "clara",
    "skill_name": "advisory-case-director",
    "purpose": "Use when Clara must direct a durable advisory case after initial assignment framing: state the answer first, keep a living analytical spine, choose and coordinate the next analysis or research branch, integrate new evidence and partner judgement, revise the position when warranted, and decide when the working deliverable should change. This is the case-direction workflow, not a fixed analytical schema, generic prompt optimizer, data-analysis engine, deck builder, or final validator."
  },
  {
    "plugin_namespace": "clara",
    "skill_name": "advisory-deliverable-validator",
    "purpose": "Use when Clara must validate a completed advisory memo, report, analysis, presentation, or other supported professional document against advisory_contract.json and available evidence. Review contract fit, support, calculations and provenance, reasoning, contradictions, recommendation fit, judgement boundaries, correction needs, uncertainty, and delivery readiness without turning the workflow into legal, tax, compliance, or jurisdictional research."
  },
  {
    "plugin_namespace": "clara",
    "skill_name": "attribute-reporting",
    "purpose": "Use when a user wants Clara to map retail product attributes, preserve the existing new-versus-rest or best-seller-versus-other analysis, create a private local HTML report, or answer whether that report is correct."
  },
  {
    "plugin_namespace": "clara",
    "skill_name": "brand-fit",
    "purpose": "Use when a user wants Clara to compare completed retailer signals with a brand's current presence at that retailer and the brand's owned catalogue, create a private local HTML Brand Fit report, or ask whether that report is correct."
  },
  {
    "plugin_namespace": "clara",
    "skill_name": "business-planning",
    "purpose": "Prepare one business plan for a startup, new venture or established company: assess customers, market, operations, economics, cash needs, options and next actions. Vera and Clara use the same workflow and report."
  },
  {
    "plugin_namespace": "clara",
    "skill_name": "claim-basis-map",
    "purpose": "Use when Clara or Codex generates, revises, or audits a clean PPTX/deck and needs a fully automatic readable sidecar that maps each slide claim to its basis and checks whether current deck text has drifted from the generation-time claim snapshot. Use for AI-generated decks where visible citations, claim IDs, reviewer attestations, hashes, thumbnails, and HTML are explicitly not wanted."
  },
  {
    "plugin_namespace": "clara",
    "skill_name": "clara",
    "purpose": "Use whenever Clara is explicitly invoked, including through @clara, and for advisory work that Clara may organize, analyze, research, document, or present, including commercial due-diligence preparation. Always activate Clara's router, select the narrowest supported workflow, identify unsupported professional work as a capability gap with a consent-gated change-request offer, and return unrelated work as out of scope instead of answering as general ChatGPT."
  },
  {
    "plugin_namespace": "clara",
    "skill_name": "deck-correction",
    "purpose": "Correct, revise, or rebuild an existing PPTX or Clara HTML deck from spoken feedback, a call transcript, screen recording, review notes, or partner comments. Use when the user says record feedback on this deck or when the requested outcome is a changed deck rather than only a transcript: open Clara Voice Capture when needed, interpret every requested change, preserve untouched content, require a reviewable understanding and approval checkpoint for PPTX work, apply changes to a copy, render, verify, and inspect the "
  },
  {
    "plugin_namespace": "clara",
    "skill_name": "hosted-interview",
    "purpose": "Prepare and operate Clara-hosted external voice interviews: select an exact versioned research campaign or define a scoped one-off case interview, create an expiring no-login participant link, check its status, and retrieve the completed JSON bundle and post-interview quality review. Use when the user asks to interview a client, stakeholder, expert, research participant, or other external respondent through a hosted browser link, or asks to retrieve or review that interview's result. Do not use for interviewing the"
  },
  {
    "plugin_namespace": "clara",
    "skill_name": "html-deck",
    "purpose": "Build or revise source-faithful, cinematic, animated standalone HTML slide decks for Clara or Codex from Word, PDF, Markdown, spreadsheet, case-workspace, or mixed source materials. Use for a premium HTML presentation, web deck, animated talk, responsive keynote-style deck, speaker notes, preservation-aware HTML deck changes, or an alternative to PPTX/PDF that must remain self-contained and browser-presentable."
  },
  {
    "plugin_namespace": "clara",
    "skill_name": "learn-with-clara",
    "purpose": "Teach only this installation's supported Clara workflows through a native voice conversation and a parallel working chat that runs real examples. Use for first onboarding, demonstrations, guided practice, discovering what Clara can do, revisiting an example, or applying it to user-selected files. Starts in desktop Codex; Claude Cowork is outside this feature."
  },
  {
    "plugin_namespace": "clara",
    "skill_name": "privacy-surface-review",
    "purpose": "Use when adding, changing, reviewing, or releasing a Clara workflow or hosted integration to record what Codex can read, every boundary beyond Codex, and the source-backed access and retention position before packaging."
  },
  {
    "plugin_namespace": "clara",
    "skill_name": "reporting-engine",
    "purpose": "Use when Clara needs budgeting/forecast reports with both variances and Sites delivery, CSV/XLSX/Parquet dataset intake, Sales/Discount/COGS identification, chart capability evidence, dataset profiling, a source-backed dataset semantic layer, mechanical compatibility checks, or reporting contract inspection before chart/report selection."
  },
  {
    "plugin_namespace": "clara",
    "skill_name": "research-video",
    "purpose": "Turn a user-approved ordered set of research scene images into a source-faithful 16:9 narrated MP4 with restrained motion, synchronized narration in English, Italian, French, German, or Spanish, captions, a reviewable narration script, and mechanical media validation. Use for a research explainer, executive briefing video, client education video, or narrated visual short. Do not use for filming, avatar video, generative scene invention, or revising an existing video."
  },
  {
    "plugin_namespace": "clara",
    "skill_name": "transcribe",
    "purpose": "Capture, transcribe, import, attribute, and review advisor voice notes, consultant debriefs, meetings, calls, and existing audio recordings with Clara Hosted Voice. Use when the user asks to start Voice Capture, transcribe an audio file, import a case-notes-audio or case-notes-voice ZIP/JSON bundle, preserve a transcript in an ordinary folder with deduplication, or add a reviewed transcript to a Clara case. Do not use to create an adaptive external-participant interview link or to revise a deck from spoken feedback"
  },
  {
    "plugin_namespace": "close",
    "skill_name": "close-crm",
    "purpose": "Use Close CRM via MCP to research leads, review pipeline and activity, prepare follow-ups, answer Close product questions, and safely create or update CRM records."
  },
  {
    "plugin_namespace": "codex-usage-and-resets",
    "skill_name": "cuar",
    "purpose": "Use whenever the user invokes or mentions CUAR, asks whether an unscheduled Codex reset happened, asks whether CUAR reminder tooling is unavailable, or asks whether a CUAR expiration reminder was created. Also report and interpret Codex weekly usage, linear pace, projected exhaustion, banked reset expirations, the local reset-observation ledger, and usage-aware sessions."
  },
  {
    "plugin_namespace": "codex-voice-notify",
    "skill_name": "voice-notify-settings",
    "purpose": "Set up, configure, test, mute, or unmute private offline Voice Notify alerts for Codex lifecycle events on macOS or Windows. Use when someone asks to hear when Codex needs attention or finishes, complete first-time setup, check Codex CLI compatibility, review hook trust, choose the female or male voice, select Korean, Japanese, English, Russian, or Simplified Chinese, change events, or adjust playback timing. Do not use for general text-to-speech or narration, speech transcription, cloud notifications, arbitrary OS"
  },
  {
    "plugin_namespace": "conversational-narrative",
    "skill_name": "conversational-narrative-router",
    "purpose": "Use when the user wants a technical or practitioner social post written, continued, explained, audited, or rewritten in a conversational diagnostic deep-dive style without flattening their demonstrated voice."
  },
  {
    "plugin_namespace": "conversational-narrative",
    "skill_name": "diagnostic-deep-dive-writer",
    "purpose": "Use when turning a practitioner observation, project update, audit finding, technical argument, or rough notes into a long-form social post that reasons from friction to diagnosis to decision in a natural conversational voice."
  },
  {
    "plugin_namespace": "conversational-narrative",
    "skill_name": "series-continuity-writer",
    "purpose": "Use when continuing a multi-part technical or practitioner content series and the new post must advance the unresolved thread without re-teaching earlier parts or losing the established voice."
  },
  {
    "plugin_namespace": "conversational-narrative",
    "skill_name": "technical-concept-storyteller",
    "purpose": "Use when a technical marketing, analytics, AI, product, engineering, or statistical concept needs to be explained in an experienced practitioner's conversational voice instead of as a glossary or textbook definition."
  },
  {
    "plugin_namespace": "conversational-narrative",
    "skill_name": "voice-fidelity-reviewer",
    "purpose": "Use when auditing or rewriting a technical or practitioner post that feels AI-written, over-polished, repetitive, over-structured, or unlike the demonstrated speaker while preserving meaning, evidence, and useful roughness."
  },
  {
    "plugin_namespace": "creative-production",
    "skill_name": "intake",
    "purpose": "Use when Creative Production is explicitly invoked or mentioned without a concrete request, when the user asks what Creative Production can do, or when the user wants help getting started without enough context to choose a workflow."
  },
  {
    "plugin_namespace": "creative-production",
    "skill_name": "produce",
    "purpose": "Use when the user wants to create, explore, adapt, refine, polish, or review visual creative such as campaigns, ads, social posts, product imagery, scenes, offers, logos, brand systems, styles, charts, decks, or related marketing and design assets."
  },
  {
    "plugin_namespace": "creator-workbench",
    "skill_name": "analytics-dashboard",
    "purpose": "Analyze a LinkedIn analytics export and, when a coding workspace is available, build an interactive local dashboard plus data-backed recommendations. Use when the user supplies LinkedIn analytics CSV/XLSX data or asks for a performance dashboard."
  },
  {
    "plugin_namespace": "creator-workbench",
    "skill_name": "brain-briefs",
    "purpose": "Create a daily context brief or an idea brief from the user's second brain and any available connected sources. Use for today briefs, project context, ideas from notes, or finding patterns across recent knowledge."
  },
  {
    "plugin_namespace": "creator-workbench",
    "skill_name": "carousel-generator",
    "purpose": "Create a slide-by-slide social carousel with a review gate before visual production. Use for LinkedIn or Instagram carousel requests."
  },
  {
    "plugin_namespace": "creator-workbench",
    "skill_name": "content-matrix",
    "purpose": "Generate 32 or more social content ideas by combining the user's content pillars with distinct post formats. Use when the user asks what to post, needs a monthly idea bank, or wants a content matrix."
  },
  {
    "plugin_namespace": "creator-workbench",
    "skill_name": "conversation-importer",
    "purpose": "Import ChatGPT or Claude conversation-export JSON into local markdown files with metadata. Use when the user has exported AI history and wants it organized, searchable, or ready for a second brain."
  },
  {
    "plugin_namespace": "creator-workbench",
    "skill_name": "create-from-brain",
    "purpose": "Create a post, newsletter, script, carousel, infographic outline, or other content grounded in the user's second-brain context. Use when the user says create from my brain, use my notes, use my research, or wants content that draws on stored knowledge."
  },
  {
    "plugin_namespace": "creator-workbench",
    "skill_name": "creator-router",
    "purpose": "Route requests across Creator Workspace to the smallest useful set of bundled skills. Use whenever the user explicitly invokes Creator Workspace, asks for a multi-step creator workflow, or the right second-brain, recall, writing, social-media, visualization, analytics, or session-learning skill is unclear."
  },
  {
    "plugin_namespace": "creator-workbench",
    "skill_name": "graphic-designer",
    "purpose": "Choose and develop the right visual format for a social post. Use when the user asks for a graphic, post visual, data graphic, visual concept, or help deciding between a coded graphic and generated image."
  },
  {
    "plugin_namespace": "creator-workbench",
    "skill_name": "hook-generator",
    "purpose": "Generate multiple strong opening hooks for a social post, video, newsletter, or content idea. Use when the user asks for hooks, opening lines, scroll-stoppers, or wants to improve the first lines."
  },
  {
    "plugin_namespace": "creator-workbench",
    "skill_name": "host-workspace-operator",
    "purpose": "Use host-native file, search, shell, patch, and workspace capabilities safely when a Creator Workspace workflow needs local files or repository state."
  },
  {
    "plugin_namespace": "creator-workbench",
    "skill_name": "infographic-generator",
    "purpose": "Create a social infographic concept or image-generation prompt with a clear information hierarchy. Use for infographic, whiteboard graphic, visual explainer, or data-led social image requests."
  },
  {
    "plugin_namespace": "creator-workbench",
    "skill_name": "living-wiki",
    "purpose": "Turn raw research and imported notes into a maintained linked markdown wiki. Use when the user asks to process research, update their second brain, build topic pages, connect notes, or check wiki health."
  },
  {
    "plugin_namespace": "creator-workbench",
    "skill_name": "newsletter-voice",
    "purpose": "Create newsletter-specific writing rules on top of an existing author voice. Use when the user wants a repeatable newsletter style, wants to analyze newsletter samples, or says build my newsletter voice."
  },
  {
    "plugin_namespace": "creator-workbench",
    "skill_name": "niche-research",
    "purpose": "Research timely stories, discussions, releases, and questions in a niche and turn them into content opportunities. Use when the user asks what is happening this week, what to post about now, recent niche trends, or current topic research."
  },
  {
    "plugin_namespace": "creator-workbench",
    "skill_name": "pinned-comment",
    "purpose": "Write a pinned social comment that extends the post with a punchline, clarification, discussion prompt, or meme-style follow-up. Use when the user asks for a pinned comment or a comment plus matching image concept."
  },
  {
    "plugin_namespace": "creator-workbench",
    "skill_name": "post-formatter",
    "purpose": "Turn a topic or rough draft into a ready-to-publish social post using an appropriate narrative framework such as PAS, AIDA, BAB, STAR, or SLAY. Use when the user asks to structure or format a post."
  },
  {
    "plugin_namespace": "creator-workbench",
    "skill_name": "post-scorer",
    "purpose": "Score a social post draft against the user's historical performance data or, when no history is supplied, with a clearly labeled heuristic rubric. Use when the user asks to score, benchmark, predict, or critique a draft for performance."
  },
  {
    "plugin_namespace": "creator-workbench",
    "skill_name": "post-writer",
    "purpose": "Draft a LinkedIn or social post in the user's voice from an idea, source, observation, story, or argument. Use when the user asks to write a post, turn notes into a post, or repurpose a source into a social post."
  },
  {
    "plugin_namespace": "creator-workbench",
    "skill_name": "profile-optimizer",
    "purpose": "Rebuild or critique a LinkedIn profile for clearer positioning and conversion. Use for LinkedIn headline, About, Experience, Featured section, profile positioning, or a full profile rewrite."
  },
  {
    "plugin_namespace": "creator-workbench",
    "skill_name": "quote-post",
    "purpose": "Create a quote-led social post and matching quote image brief from an idea, article, transcript, or original statement. Use when the user asks for a quote card, quote post, or shareable quote visual."
  },
  {
    "plugin_namespace": "creator-workbench",
    "skill_name": "reels-scripting",
    "purpose": "Create or reverse-engineer a short-form video script from a reference Reel, transcript, video, newsletter idea, or topic. Use for Instagram Reels, TikTok-style scripts, Shorts, hooks, beats, and short-form video structure."
  },
  {
    "plugin_namespace": "creator-workbench",
    "skill_name": "sandbox-python-executor",
    "purpose": "Use host-native Python for deterministic Creator Workspace tasks such as export parsing, provenance tracing, analytics, indexing, and package verification."
  },
  {
    "plugin_namespace": "creator-workbench",
    "skill_name": "save-progress",
    "purpose": "Capture useful end-of-session corrections, decisions, project state, and lessons without turning one-off choices into permanent rules. Use when the user says save progress, bank what we learned, capture the learnings, save this for next time, or lock in our corrections."
  },
  {
    "plugin_namespace": "creator-workbench",
    "skill_name": "second-brain-setup",
    "purpose": "Create or adapt a local second-brain workspace from AI conversation exports and research files. Use when the user invokes Creator Workspace to build a second brain, organize ChatGPT or Claude history, create an Obsidian-style knowledge base, or set up a living wiki."
  },
  {
    "plugin_namespace": "creator-workbench",
    "skill_name": "show-me",
    "purpose": "Render visual plans, comparisons, option boards, reports, layouts, and dashboards instead of describing them only in prose. Use when the user says show me, wants to see options, asks what something looks like, or needs a visual decision surface."
  },
  {
    "plugin_namespace": "creator-workbench",
    "skill_name": "voice-builder",
    "purpose": "Build a reusable author profile and writing voice from a short interview plus 3 to 5 writing samples. Use when the user says build my voice, learn my voice, onboard my content style, train on my writing, or wants future content to sound like them."
  },
  {
    "plugin_namespace": "creator-workbench",
    "skill_name": "voiceprint",
    "purpose": "Turn the user's own spoken transcript into a finished long-form piece primarily by cutting, ordering, and lightly joining their literal wording. Use when the user asks to turn a recording or transcript into an article, newsletter, blog post, or long social post that must genuinely remain their own wording."
  },
  {
    "plugin_namespace": "creator-workbench",
    "skill_name": "workspace-recall",
    "purpose": "Retrieve the smallest relevant set of facts, notes, project state, lessons, and voice context from a Creator Workspace second brain. Use when the user asks what the workspace remembers, wants to resume prior work, needs context before creating, or asks to find something across stored workspace files."
  },
  {
    "plugin_namespace": "creator-workbench",
    "skill_name": "youtube-thumbnail",
    "purpose": "Develop a YouTube thumbnail concept and production prompt from a video title, topic, or angle. Use when the user asks for a thumbnail, thumbnail prompt, thumbnail text, or thumbnail A/B concepts."
  },
  {
    "plugin_namespace": "designly",
    "skill_name": "arabic-rtl-director",
    "purpose": "Arabic visual hierarchy, RTL reading flow, calligraphy glyph fidelity, and regional cultural authenticity director. This skill should be used when designing Arabic-first posters and campaigns, directing Right-to-Left eye paths, balancing mixed Arabic/English typography, or issuing hard vetoes on Arabic glyph and rendering errors."
  },
  {
    "plugin_namespace": "designly",
    "skill_name": "brand-activation",
    "purpose": "Specialist in experiential campaigns, PR stunts, and brand utility. This skill should be used when creating non-traditional marketing activations, interactive physical/digital stunts, brand utility tools, cultural objects, ambient media, or applying the diagnostic test to distinguish genuine non-advertising utility from channel-specific executions."
  },
  {
    "plugin_namespace": "designly",
    "skill_name": "brand-intelligence",
    "purpose": "Brand identity and product fidelity specialist. This skill should be used when auditing visual proposals against brand guidelines, enforcing logo clearspace and color formulas, verifying product packaging fidelity, conducting the Brand-Off test, or issuing hard vetoes on brand violations."
  },
  {
    "plugin_namespace": "designly",
    "skill_name": "campaign-canon",
    "purpose": "Advertising history and campaign pattern benchmarking specialist. This skill should be used when referencing the 571 canonical advertising campaigns, looking up case studies across P01-P18 patterns, checking market pattern saturation, evaluating anti-derivative uniqueness, or finding cross-industry analog cases by industry, budget, format, or emotional intent."
  },
  {
    "plugin_namespace": "designly",
    "skill_name": "campaign-dna",
    "purpose": "Multi-asset campaign visual DNA and cross-format continuity director. This skill should be used when planning multi-asset campaigns, defining visual-family continuity rules across formats (1:1, 9:16, 16:9), creating deliberate variation across deliverables, or maintaining campaign brand consistency."
  },
  {
    "plugin_namespace": "designly",
    "skill_name": "composition-director",
    "purpose": "Spatial composition, grid layout, hierarchy, and structural preflight director. This skill should be used when establishing layout grids, visual hierarchy, focal anchors, negative space balance, eye paths, or conducting preflight tests to prevent equal-emphasis slop and clutter."
  },
  {
    "plugin_namespace": "designly",
    "skill_name": "creative-director",
    "purpose": "AI creative director with recursive self-assessment, Cannes-calibrated scoring, SIT/TRIZ structural ideation, and campaign canon anti-derivative preflight. This skill should be used when the user asks to generate creative concepts, brainstorm campaign ideas, develop a Big Idea or campaign platform, evaluate or critique existing creative work, find consumer insights, or shares a brief for ideation — including activations, PR-stunts, brand utility, experiential, and non-advertising ideas."
  },
  {
    "plugin_namespace": "designly",
    "skill_name": "creative-strategy",
    "purpose": "Marketing strategy and visual concept specialist. This skill should be used when deconstructing marketing briefs, defining target audience insights, establishing message hierarchy, developing distinct concept territories, or clarifying the single primary communication job before visual design begins."
  },
  {
    "plugin_namespace": "designly",
    "skill_name": "designly-director",
    "purpose": "Lead commercial Art Director and Design Neural Mesh orchestrator. This skill should be used when orchestrating end-to-end commercial design, resolving conflicting brand/taste/structure signals, locking brief constraints, delegating specialist analysis, sanitizing bounded edits, and conducting final art-direction signoff."
  },
  {
    "plugin_namespace": "designly",
    "skill_name": "edit-sanitizer",
    "purpose": "Pre-execution sanitizer for annotation-guided edits, inpainting, copy corrections, local retouching, and object replacement. This skill should be used when a user points at or annotates part of an existing image and expects a bounded change without collateral redesign, or when edit scope, mask geometry, exact copy, or protected regions must be validated before image execution."
  },
  {
    "plugin_namespace": "designly",
    "skill_name": "insight-mining",
    "purpose": "Specialist in unearthing consumer tensions and strategic insight formulation. This skill should be used when discovering deep audience insights, mapping Jobs-To-Be-Done (JTBD), identifying cultural, category, or human tensions, applying Mark Pollard's Four Points, or laddering abstraction levels before creative ideation begins."
  },
  {
    "plugin_namespace": "designly",
    "skill_name": "manipulation-director",
    "purpose": "Digital manipulation, compositing physics, perspective alignment, and photo-integration director. This skill should be used when combining multiple image elements, planning compositing perspective and scale, enforcing realistic contact shadows and reflections, or directing impossible/surreal advertising scenes with internal physical consistency."
  },
  {
    "plugin_namespace": "designly",
    "skill_name": "photography-director",
    "purpose": "Commercial photography, studio lighting, camera optics, and material physics director. This skill should be used when directing camera focal length, depth of field, 3-point studio lighting systems, shutter speed, color temperature, or realistic surface material finishes."
  },
  {
    "plugin_namespace": "designly",
    "skill_name": "prompt-compiler",
    "purpose": "Image-generation and image-edit instruction compiler. This skill should be used when translating an approved Art Direction Spec or a ready EditContract into precise provider/model-ready instructions, linting prompt slop, or preparing execution for the host image tool without changing upstream creative decisions."
  },
  {
    "plugin_namespace": "designly",
    "skill_name": "reference-memory",
    "purpose": "Local-first reference memory and scoped preference ledger manager. This skill should be used when saving, recalling, updating, or deleting reference records with stable REF IDs (e.g. REF-1042), managing user likes/dislikes, or querying persistent taste preferences."
  },
  {
    "plugin_namespace": "designly",
    "skill_name": "taste-engine",
    "purpose": "Taste extraction and transferable visual rule mixing engine. This skill should be used when deconstructing visual reference images into transferable design principles, building Taste Profiles, mixing multiple references by assigned design jobs, or preventing plagiarism and AI-slop anti-patterns."
  },
  {
    "plugin_namespace": "designly",
    "skill_name": "typography-director",
    "purpose": "Typographic hierarchy, layout, measure, and exact-copy director. This skill should be used when setting typographic scale, headline measure, line breaks, text zones, contrast ratios, and layout boundaries, or protecting exact client copy strings."
  },
  {
    "plugin_namespace": "designly",
    "skill_name": "visual-qa",
    "purpose": "Independent visual quality assurance, hard-gate auditor, and targeted revision router. This skill should be used when reviewing generated or edited visuals, testing hierarchy/craft/brand fidelity, detecting AI slop, checking bounded-edit collateral drift, issuing approval verdicts, or routing targeted RevisionRequests."
  },
  {
    "plugin_namespace": "designly",
    "skill_name": "visual-storytelling",
    "purpose": "Narrative architecture and visual storytelling specialist. This skill should be used when structuring dramatic narrative arcs, crafting multi-frame storyboards, applying classic storytelling frameworks (Story Spine, Sparkline, Freytag's Pyramid, Monroe's Motivated Sequence, Pixar Rules, Hero's Journey), or aligning visual pacing with complex emotional tiers."
  },
  {
    "plugin_namespace": "documents-router",
    "skill_name": "document",
    "purpose": "route explicitly selected document artifact requests to the preinstalled capability. use only when the user explicitly selects @document; never trigger from request content alone."
  },
  {
    "plugin_namespace": "duende-skills",
    "skill_name": "aspnetcore-authentication",
    "purpose": "ASP.NET Core authentication middleware configuration including OpenID Connect, JWT Bearer, cookie authentication, authentication schemes, challenge/forbid flows, and external identity provider integration."
  },
  {
    "plugin_namespace": "duende-skills",
    "skill_name": "aspnetcore-authorization",
    "purpose": "ASP.NET Core authorization patterns including policy-based authorization, IAuthorizationHandler implementations, scope-based authorization for APIs, authorization middleware configuration, and minimal API authorization."
  },
  {
    "plugin_namespace": "duende-skills",
    "skill_name": "claims-authorization",
    "purpose": "Claims transformation and profile service patterns for Duende IdentityServer — IProfileService, IClaimsTransformation, claim type mapping, token claim filtering, extension grant validators, and dynamic claims loading."
  },
  {
    "plugin_namespace": "duende-skills",
    "skill_name": "duende-bff",
    "purpose": "Duende BFF (Backend for Frontend) security framework for securing SPAs. Covers session management, API endpoint proxying, token management, anti-forgery protection, and integration with React/Angular/Blazor frontends."
  },
  {
    "plugin_namespace": "duende-skills",
    "skill_name": "identity-security-hardening",
    "purpose": "Security hardening for Duende IdentityServer deployments including signing key rotation, HTTPS enforcement, CORS configuration, CSP headers, rate limiting, token lifetime tuning, and security audit patterns."
  },
  {
    "plugin_namespace": "duende-skills",
    "skill_name": "identity-testing-patterns",
    "purpose": "Testing patterns for IdentityServer-based systems including integration testing with WebApplicationFactory, mock token issuance, test authority configuration, protocol response validation, and end-to-end authentication flow testing."
  },
  {
    "plugin_namespace": "duende-skills",
    "skill_name": "identityserver-api-protection",
    "purpose": "Protecting APIs with Duende IdentityServer: JWT bearer authentication, reference token introspection, scope-based authorization, DPoP/mTLS proof-of-possession validation, local API authentication, and multi-audience scenarios."
  },
  {
    "plugin_namespace": "duende-skills",
    "skill_name": "identityserver-aspire",
    "purpose": "Orchestrate Duende IdentityServer in .NET Aspire AppHost — dependency graphs, authority URL wiring, health checks, and multi-instance."
  },
  {
    "plugin_namespace": "duende-skills",
    "skill_name": "identityserver-configuration",
    "purpose": "Configure Duende IdentityServer including client definitions, API resources, identity resources, scopes, signing credentials, and server-side sessions. Covers client types (M2M, interactive, SPA), grant types, API Scopes vs API Resources vs Identity Resources, secret management, and client authentication methods. Includes both in-memory and database-backed configuration."
  },
  {
    "plugin_namespace": "duende-skills",
    "skill_name": "identityserver-dcr",
    "purpose": "Configuring Dynamic Client Registration (DCR) in Duende IdentityServer: endpoint setup, authorization policies, custom validation with DynamicClientRegistrationValidator, software statement validation, IClientConfigurationStore, and separate DCR hosting."
  },
  {
    "plugin_namespace": "duende-skills",
    "skill_name": "identityserver-deployment",
    "purpose": "Guide for deploying Duende IdentityServer to production, covering reverse proxy configuration, data protection, health checks, distributed caching, multi-instance deployment, OpenTelemetry integration, logging, and common deployment pitfalls."
  },
  {
    "plugin_namespace": "duende-skills",
    "skill_name": "identityserver-hosting-setup",
    "purpose": "Setting up and hosting Duende IdentityServer in ASP.NET Core applications, including DI registration, middleware pipeline, hosting patterns, essential options, license configuration, and ASP.NET Identity integration."
  },
  {
    "plugin_namespace": "duende-skills",
    "skill_name": "identityserver-key-management",
    "purpose": "Managing cryptographic signing keys in Duende IdentityServer, including automatic key management, KeyManagementOptions, data protection at rest, static key configuration, migration from static to automatic, and multi-instance deployment considerations."
  },
  {
    "plugin_namespace": "duende-skills",
    "skill_name": "identityserver-saml",
    "purpose": "Configuring Duende IdentityServer as a SAML 2.0 Identity Provider (IdP): service provider registration, SSO and SLO flows, claim mappings, extensibility interfaces, and production deployment patterns."
  },
  {
    "plugin_namespace": "duende-skills",
    "skill_name": "identityserver-sessions-providers",
    "purpose": "Guide for configuring server-side sessions, session management and querying, inactivity timeout, dynamic identity providers, and CIBA (Client Initiated Backchannel Authentication) in Duende IdentityServer."
  },
  {
    "plugin_namespace": "duende-skills",
    "skill_name": "identityserver-stores",
    "purpose": "Implement and customize Duende IdentityServer stores including configuration store, operational store, and Entity Framework Core integration. Covers migrations, custom store implementations, caching strategies, server-side sessions, signing key storage, token cleanup, and multi-tenant patterns."
  },
  {
    "plugin_namespace": "duende-skills",
    "skill_name": "identityserver-token-lifecycle",
    "purpose": "Guide for implementing token types, refresh token management, token exchange (RFC 8693), extension grants, IProfileService claims customization, and token lifetime best practices in Duende IdentityServer."
  },
  {
    "plugin_namespace": "duende-skills",
    "skill_name": "identityserver-token-security",
    "purpose": "Advanced token security features in Duende IdentityServer including DPoP, mTLS certificate binding, Pushed Authorization Requests (PAR), JWT Secured Authorization Requests (JAR), and FAPI 2.0 compliance configuration."
  },
  {
    "plugin_namespace": "duende-skills",
    "skill_name": "identityserver-ui-flows",
    "purpose": "Guide for building login, logout, consent, error, and federation gateway UI pages in Duende IdentityServer, including IIdentityServerInteractionService usage, external provider integration, and Home Realm Discovery strategies."
  },
  {
    "plugin_namespace": "duende-skills",
    "skill_name": "identityserver-upgrade-v7-to-v8",
    "purpose": "Migrating Duende IdentityServer from v7.4 to v8.0: breaking changes, API replacements (ICache→HybridCache, IClock→TimeProvider), CancellationToken additions, EF migrations, and step-by-step upgrade guide."
  },
  {
    "plugin_namespace": "duende-skills",
    "skill_name": "identityserver-usermanagement",
    "purpose": "Setting up Duende User Management with IdentityServer: passwordless authentication (OTP, TOTP, passkeys), storage configuration, user lifecycle, and migration from ASP.NET Identity."
  },
  {
    "plugin_namespace": "duende-skills",
    "skill_name": "identityserver4-migration",
    "purpose": "Migrating from IdentityServer4 to Duende IdentityServer v8. Covers NuGet package replacement, namespace changes, API surface changes, EF Core database schema migrations, .NET target framework upgrade, license configuration, signing key migration, data protection, and UI template updates."
  },
  {
    "plugin_namespace": "duende-skills",
    "skill_name": "oauth-oidc-protocols",
    "purpose": "OAuth 2.0 and OpenID Connect protocol fundamentals including authorization code flow with PKCE, client credentials, refresh tokens, discovery documents, JWKS, and token introspection. Protocol-level troubleshooting and compliance."
  },
  {
    "plugin_namespace": "duende-skills",
    "skill_name": "token-management",
    "purpose": "Token management patterns using Duende.AccessTokenManagement. Covers client credential token caching, user token refresh, token storage, HttpClientFactory integration, DPoP support, and common configuration pitfalls. Also includes Blazor Server token management."
  },
  {
    "plugin_namespace": "expo",
    "skill_name": "building-native-ui",
    "purpose": "Complete guide for building beautiful apps with Expo Router. Covers fundamentals, styling, components, navigation, animations, patterns, and native tabs."
  },
  {
    "plugin_namespace": "expo",
    "skill_name": "codex-expo-run-actions",
    "purpose": "Wire Expo projects into the Codex app with project-local run scripts and .codex/environments/environment.toml actions. Use when the user wants the Codex app Run button, build/run actions, action buttons, or a stable Expo start/run workflow from Codex."
  },
  {
    "plugin_namespace": "expo",
    "skill_name": "expo-api-routes",
    "purpose": "Guidelines for creating API routes in Expo Router with EAS Hosting"
  },
  {
    "plugin_namespace": "expo",
    "skill_name": "expo-cicd-workflows",
    "purpose": "Helps understand and write EAS workflow YAML files for Expo projects. Use this skill when the user asks about CI/CD or workflows in an Expo or EAS context, mentions .eas/workflows/, or wants help with EAS build pipelines or deployment automation."
  },
  {
    "plugin_namespace": "expo",
    "skill_name": "expo-deployment",
    "purpose": "Deploying Expo apps to iOS App Store, Android Play Store, web hosting, and API routes"
  },
  {
    "plugin_namespace": "expo",
    "skill_name": "expo-dev-client",
    "purpose": "Build and distribute Expo development clients locally or via TestFlight"
  },
  {
    "plugin_namespace": "expo",
    "skill_name": "expo-module",
    "purpose": "Guide for writing Expo native modules and views using the Expo Modules API (Swift, Kotlin, TypeScript). Covers module definition DSL, native views, shared objects, config plugins, lifecycle hooks, autolinking, and type system. Use when building or modifying native modules for Expo."
  },
  {
    "plugin_namespace": "expo",
    "skill_name": "expo-tailwind-setup",
    "purpose": "Set up Tailwind CSS v4 in Expo with react-native-css and NativeWind v5 for universal styling"
  },
  {
    "plugin_namespace": "expo",
    "skill_name": "expo-ui-jetpack-compose",
    "purpose": "`@expo/ui/jetpack-compose` package lets you use Jetpack Compose Views and modifiers in your app."
  },
  {
    "plugin_namespace": "expo",
    "skill_name": "expo-ui-swift-ui",
    "purpose": "`@expo/ui/swift-ui` package lets you use SwiftUI Views and modifiers in your app."
  },
  {
    "plugin_namespace": "expo",
    "skill_name": "native-data-fetching",
    "purpose": "Use when implementing or debugging ANY network request, API call, or data fetching. Covers fetch API, React Query, SWR, error handling, caching, offline support, and Expo Router data loaders (`useLoaderData`)."
  },
  {
    "plugin_namespace": "expo",
    "skill_name": "upgrading-expo",
    "purpose": "Guidelines for upgrading Expo SDK versions and fixing dependency issues"
  },
  {
    "plugin_namespace": "expo",
    "skill_name": "use-dom",
    "purpose": "Use Expo DOM components to run web code in a webview on native and as-is on web. Migrate web code to native incrementally."
  },
  {
    "plugin_namespace": "fastapicloud",
    "skill_name": "fastapi-new",
    "purpose": "Create new uv-backed FastAPI apps with `fastapi-new`. Use when the user asks to scaffold a new FastAPI project, create a new app directory, initialize a FastAPI project in the current directory, choose a Python version for a new app, or prepare a fresh app that can later be run with `uv run fastapi dev` or deployed to FastAPI Cloud."
  },
  {
    "plugin_namespace": "fastapicloud",
    "skill_name": "fastapicloud-deploy",
    "purpose": "Prepare and deploy FastAPI apps to FastAPI Cloud. Use when the user asks to deploy a project, create, link, or update a FastAPI Cloud app, log in before deployment, set up CI/CD, a GitHub Actions deploy workflow, or GitHub-linked auto-deploys, manage deploy tokens, validate deployment inputs, inspect app IDs, review `.fastapicloudignore`, or update commands that invoke `fastapi deploy` or `fastapi cloud deploy`."
  },
  {
    "plugin_namespace": "fastapicloud",
    "skill_name": "fastapicloud-domains",
    "purpose": "Manage custom domains for FastAPI Cloud apps. Use when listing or inspecting domains, adding a hostname, choosing standard or zero-downtime DNS setup, checking verification or TLS progress, restarting failed setup, or removing a custom domain."
  },
  {
    "plugin_namespace": "fastapicloud",
    "skill_name": "fastapicloud-env",
    "purpose": "Manage FastAPI Cloud environment variables and secrets. Use when listing, reading, setting, deleting, or auditing FastAPI Cloud env vars, handling runtime secrets, or diagnosing missing configuration for a deployed FastAPI app."
  },
  {
    "plugin_namespace": "fastapicloud",
    "skill_name": "fastapicloud-integrations",
    "purpose": "Connect and manage databases and third-party resources for FastAPI Cloud apps. Use when the user asks to connect or add a database, Postgres provider, Redis cache, observability service, or other managed service; inspect available integration providers; connect Neon, Redis Cloud, Supabase, or Logfire; list or inspect connected resources; review managed environment variables; or disconnect a resource from an app."
  },
  {
    "plugin_namespace": "fastapicloud",
    "skill_name": "fastapicloud-logs",
    "purpose": "Inspect FastAPI Cloud logs. Use when the user asks for recent logs, the latest or last log timestamp, runtime log lines, build logs for a deployment, whether an app has emitted logs, or a quick app log/health check."
  },
  {
    "plugin_namespace": "figma",
    "skill_name": "figma-code-connect",
    "purpose": "Creates and maintains Figma Code Connect template files that map Figma components to code snippets. Use when the user mentions Code Connect, Figma component mapping, design-to-code translation, or asks to create/update .figma.ts or .figma.js files."
  },
  {
    "plugin_namespace": "figma",
    "skill_name": "figma-create-new-file",
    "purpose": "**MANDATORY prerequisite** — you MUST invoke this skill BEFORE every `create_new_file` tool call. NEVER call `create_new_file` directly without loading this skill first. Trigger whenever the user wants a new blank Figma file — a new design, FigJam, or Slides file — or when you need a fresh file before calling `use_figma`. Usage — /figma-create-new-file [editorType] [fileName] (e.g. /figma-create-new-file figjam My Whiteboard, /figma-create-new-file slides Q3 Review)"
  },
  {
    "plugin_namespace": "figma",
    "skill_name": "figma-design-to-code",
    "purpose": "**MANDATORY prerequisite** — you MUST invoke this skill BEFORE calling the `get_design_context` Figma MCP tool. You MUST trigger this skill whenever the user wants to implement, build, port, or code up a Figma design as code. Example prompts (not exhaustive) are 'implement this Figma design', 'build this screen from Figma', 'turn this Figma into code', 'design to code'. This skill provides critical instructions and steps to the agent on how to correctly implement Figma designs in code and must NOT be skipped."
  },
  {
    "plugin_namespace": "figma",
    "skill_name": "figma-generate-design",
    "purpose": "Use this skill alongside figma-use when the task involves translating an application page, view, or multi-section layout into Figma. Triggers: 'write to Figma', 'create in Figma from code', 'push page to Figma', 'take this app/page and build it in Figma', 'create a screen', 'build a landing page in Figma', 'update the Figma screen to match code', 'convert this modal/dialog/drawer/panel to Figma'. This is the preferred workflow skill whenever the user wants to build or update a full page, modal, dialog, drawer, side"
  },
  {
    "plugin_namespace": "figma",
    "skill_name": "figma-generate-diagram",
    "purpose": "MANDATORY prerequisite — load this skill BEFORE every `generate_diagram` tool call. NEVER call `generate_diagram` directly without loading this skill first. Trigger whenever the user asks to create, generate, draw, render, sketch, or build a diagram — flowchart, architecture diagram, sequence diagram, ERD or entity-relationship diagram, state diagram or state machine, gantt chart, or timeline. Also trigger when the user mentions Mermaid syntax or wants a system architecture, decision tree, dependency graph, API cal"
  },
  {
    "plugin_namespace": "figma",
    "skill_name": "figma-generate-library",
    "purpose": "Build or update a professional-grade design system in Figma from a codebase. Use when the user wants to create variables/tokens, build component libraries, create individual components with proper variant sets and variable bindings, set up theming (light/dark modes), document foundations, or reconcile gaps between code and Figma. Also use when the user asks to create or generate any component in Figma — even a single one — since components require proper variable foundations, variant states, and design token bindin"
  },
  {
    "plugin_namespace": "figma",
    "skill_name": "figma-generative-plugins",
    "purpose": "**MANDATORY prerequisite** — load this skill before calling `create_generative_plugin` or `update_generative_plugin`. Use when the user asks to create, author, change, fix, or extend a reusable generative Figma plugin."
  },
  {
    "plugin_namespace": "figma",
    "skill_name": "figma-implement-motion",
    "purpose": "Translates Figma motion and animations into production-ready application code. Use when implementing animation/motion from a Figma design — user mentions \"implement this motion\", \"add animation from Figma\", \"animate this component\", provides a Figma URL whose node is animated, or when `get_design_context` returns motion data or instructs you to call `get_motion_context`."
  },
  {
    "plugin_namespace": "figma",
    "skill_name": "figma-shaders",
    "purpose": "**MANDATORY prerequisite** — load this skill before calling `create_shader` or `update_shader`. Use when the user asks to create, author, change, fix, or iterate on a shader effect, shader fill, custom effect, custom fill, or procedural shader in Figma."
  },
  {
    "plugin_namespace": "figma",
    "skill_name": "figma-swiftui",
    "purpose": "SwiftUI ↔ Figma translation. Use whenever the user mentions Swift, SwiftUI, iOS, iPhone, or iPad — in EITHER direction — translating a Figma design into SwiftUI (design → code), or pushing SwiftUI views / screens / tokens back into a Figma file (code → design). Triggers on phrases like 'implement this Figma design in SwiftUI', 'build this screen in Swift', 'push this SwiftUI view to Figma', 'mirror my Swift code in a Figma file', or whenever a Figma URL appears alongside `.swift` files / an `.xcodeproj`. Routes to "
  },
  {
    "plugin_namespace": "figma",
    "skill_name": "figma-use",
    "purpose": "**MANDATORY prerequisite** — you MUST invoke this skill BEFORE every `use_figma` tool call. NEVER call `use_figma` directly without loading this skill first. Skipping it causes common, hard-to-debug failures. Trigger whenever the user wants to perform a write action or a unique read action that requires JavaScript execution in the Figma file context — e.g. create/edit/delete nodes, set up variables or tokens, build components and variants, modify auto-layout or fills, bind variables to properties, or inspect file s"
  },
  {
    "plugin_namespace": "figma",
    "skill_name": "figma-use-figjam",
    "purpose": "This skill helps agents use Figma's use_figma MCP tool in the FigJam context. Can be used alongside figma-use which has foundational context for using the use_figma tool."
  },
  {
    "plugin_namespace": "figma",
    "skill_name": "figma-use-motion",
    "purpose": "Motion / animation context for the `use_figma` MCP tool — animating Figma nodes via manual keyframes, animation styles, easing, and timeline duration. Load alongside figma-use whenever a task involves adding, editing, or inspecting animation on a node."
  },
  {
    "plugin_namespace": "figma",
    "skill_name": "figma-use-slides",
    "purpose": "This skill helps agents use Figma's use_figma MCP tool in the Slides context. Can be used alongside figma-use which has foundational context for using the use_figma tool."
  },
  {
    "plugin_namespace": "gauntlet",
    "skill_name": "gauntlet",
    "purpose": "Turn requests that invoke Gauntlet as a quality-control workflow into rigorous, proportionate build-test-critique-benchmark-improve processes for arbitrary non-trivial tasks. Use when the user commands \"Gauntlet this,\" \"Run the Gauntlet,\" \"Build a Gauntlet,\" requests a \"Gauntlet prompt,\" asks to \"Audit this with Gauntlet,\" or unmistakably requests an adversarial iterative quality-control loop. Support three modes: BUILD a self-contained copy-paste prompt, RUN the underlying task, or AUDIT/IMPROVE existing work. Ada"
  },
  {
    "plugin_namespace": "generate-runbook",
    "skill_name": "generate-runbook",
    "purpose": "Create, review, validate, dry-run, and audit operational runbooks for software releases, incidents, migrations, recurring procedures, and other high-consequence workflows. Use when a user asks for a runbook, playbook, standard operating procedure, launch checklist, rollback plan, incident procedure, operational handoff, or validation of an existing runbook."
  },
  {
    "plugin_namespace": "genra-video-editor",
    "skill_name": "genra-video-editor",
    "purpose": "Control and monitor a locally installed Genra video editor through its loopback API. Use when the user asks to work with Genra, edit or summarize a Genra video project, inspect the local editor, or show the Genra workspace viewer in ChatGPT Desktop."
  },
  {
    "plugin_namespace": "google-drive",
    "skill_name": "google-docs",
    "purpose": "Prompt- and template-complete Google Docs creation and editing with explicit-instruction-authoritative structural preservation, including semantic roles, relationships, comparison dimensions, and instructed extensions; full-topology native-copy routing; source-grounded per-tab adaptation for past/example references; style-preserving hyperlink and table edits; canonical smart-chip-first authoring for dates and relevant supported people or Google resources; a file-backed advisory trusted read before existing-document"
  },
  {
    "plugin_namespace": "google-drive",
    "skill_name": "google-drive",
    "purpose": "Use connected Google Drive as the single entrypoint for Drive, Docs, Sheets, and Slides work. Use when the user wants to find, fetch, organize, share, export, copy, or delete Drive files, or summarize and edit Google Docs, Google Sheets, and Google Slides through one unified Google Drive plugin."
  },
  {
    "plugin_namespace": "google-drive",
    "skill_name": "google-drive-comments",
    "purpose": "Write, reply to, and resolve Google Drive comments on Docs, Sheets, Slides, and Drive files with evidence-backed location context. Use when the user asks to leave comments, review a file with comments, respond to comment threads, or resolve Drive comments."
  },
  {
    "plugin_namespace": "google-drive",
    "skill_name": "google-sheets",
    "purpose": "Analyze and edit connected Google Sheets with range precision. Use when the user wants to create Google Sheets, find a spreadsheet, inspect tabs or ranges, search rows, plan formulas, create or repair charts, clean or restructure tables, write concise summaries, or make explicit cell-range updates."
  },
  {
    "plugin_namespace": "google-drive",
    "skill_name": "google-slides",
    "purpose": "Route Google Slides authoring requests and derive a design system from a native template or reference deck. Use this skill when the user provides an existing native Google Slides deck as a template, reference, or prior-period source, or asks to edit, update, repair, restyle, or clean up an existing native Google Slides deck. Use the Presentations skill instead for net-new presentation creation when no existing native Google Slides deck must be followed."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "autoplan",
    "purpose": "Run coordinated product, design, engineering, and developer-experience plan reviews."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "benchmark",
    "purpose": "Measure performance and compare against a known baseline using available execution or browser tools."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "benchmark-models",
    "purpose": "Compare model performance on the same bounded workflow with explicit scoring criteria."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "browse",
    "purpose": "Drive the native gstack browser when available; otherwise use host browser capabilities without pretending gstack is running."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "canary",
    "purpose": "Run post-deploy checks and surface regressions after a release."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "careful",
    "purpose": "Apply an extra safety check before destructive or difficult-to-reverse operations."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "codex",
    "purpose": "Provide a second-opinion code or plan review using available Codex reasoning and workspace evidence."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "context-restore",
    "purpose": "Restore saved project context and verify it against the current repository state."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "context-save",
    "purpose": "Save concise project context, decisions, git state, and remaining work into the workspace when writing is available."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "cso",
    "purpose": "Perform an evidence-backed security review using OWASP and STRIDE-oriented checks."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "design-consultation",
    "purpose": "Create or refine a design system and its implementation guidance."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "design-html",
    "purpose": "Create production-oriented HTML and CSS from an approved design direction."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "design-review",
    "purpose": "Audit an implemented interface against design quality, usability, and consistency criteria."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "design-shotgun",
    "purpose": "Generate and compare several materially different design directions before selecting one."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "devex-review",
    "purpose": "Audit a real developer workflow and measure friction against the actual path."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "diagram",
    "purpose": "Create a technical diagram from a textual description and return editable source when the host supports artifacts."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "document-generate",
    "purpose": "Generate practical documentation from code and verified behavior."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "document-release",
    "purpose": "Update release-facing documentation to match shipped behavior."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "freeze",
    "purpose": "Restrict requested edits to an explicitly named directory or scope."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "gstack",
    "purpose": "Route software product, planning, review, QA, debugging, design, security, release, documentation, browser, iOS, and safety requests to the right gstack workflow."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "guard",
    "purpose": "Combine destructive-operation checks with a strict edit scope."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "health",
    "purpose": "Assess codebase health using available type checks, linting, tests, dead-code signals, and repository evidence."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "host-workspace-operator",
    "purpose": "Safely inspect, search, modify, and verify files or repositories using the narrowest workspace capability available in ChatGPT or Codex."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "investigate",
    "purpose": "Run systematic root-cause investigation before proposing a fix."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "land-and-deploy",
    "purpose": "Land an approved change, observe CI and deployment, and verify production health when host access permits."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "landing-report",
    "purpose": "Summarize delivery status and release queue state without modifying anything."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "learn",
    "purpose": "Capture, inspect, and maintain project learnings backed by observed evidence."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "make-pdf",
    "purpose": "Turn markdown or structured content into a PDF using the host document or Python capabilities when available."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "office-hours",
    "purpose": "Reframe a product idea before implementation begins."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "plan-ceo-review",
    "purpose": "Challenge a plan from product and company-value angles before implementation."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "plan-design-review",
    "purpose": "Review product and interface design dimensions before implementation."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "plan-devex-review",
    "purpose": "Review developer experience, time to first success, friction, and persona paths."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "plan-eng-review",
    "purpose": "Review architecture, data flow, failure modes, edge cases, and test strategy before coding."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "plan-tune",
    "purpose": "Tune when the workflow should ask questions versus proceed with safe assumptions."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "qa",
    "purpose": "Run end-to-end QA, fix authorized defects, and re-verify them when host tools permit."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "qa-only",
    "purpose": "Run end-to-end QA and report findings without changing code."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "retro",
    "purpose": "Produce a retrospective from repository evidence, delivery outcomes, and recorded learnings."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "review",
    "purpose": "Review a change before landing and find defects that can pass CI but fail in production."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "sandbox-python-executor",
    "purpose": "Use host-native Python for deterministic parsing, hashing, archive inspection, validation, transformations, and executable verification."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "scrape",
    "purpose": "Extract structured data from a web page using the safest available browser or web capability."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "setup-deploy",
    "purpose": "Inspect a repository and establish deployment configuration guidance without inventing provider details."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "ship",
    "purpose": "Prepare a change for delivery by checking tests, review evidence, repository state, and release steps."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "skillify",
    "purpose": "Convert a proven repeatable workflow into a reusable Skill with clear triggers and checks."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "spec",
    "purpose": "Turn vague intent into a precise executable specification with acceptance criteria."
  },
  {
    "plugin_namespace": "gstack-workflows",
    "skill_name": "unfreeze",
    "purpose": "Remove a previously established edit-scope restriction when the user explicitly requests it."
  },
  {
    "plugin_namespace": "hey-terminal",
    "skill_name": "hey-terminal-ios",
    "purpose": "Plan, review, and interpret SSH and terminal work intended for the Hey Terminal app on iPhone or iPad. Use when a user asks to use Hey Terminal, prepare a safe server command, troubleshoot terminal output, or operate Hey Terminal through an available iOS device-control capability. This skill never implies that an iPhone was controlled or a command was executed unless the current runtime actually provides local iOS app control and the visible result was observed."
  },
  {
    "plugin_namespace": "hostinger-connector",
    "skill_name": "domains",
    "purpose": "Use when the user wants to work with domain names or DNS at Hostinger — checking availability and buying a domain, reading domain details and renewal dates, changing nameservers, setting up forwarding, managing registrar lock, WHOIS privacy and WHOIS contact profiles, getting an authorization code for a transfer, and reading, editing, validating, resetting or restoring DNS records."
  },
  {
    "plugin_namespace": "hostinger-connector",
    "skill_name": "ecommerce",
    "purpose": "Use when the user wants a Hostinger online store — creating a store, adding physical or digital products, setting flat-rate shipping, enabling a manual payment method, checking whether the store is ready to take orders, and creating or updating a custom sales channel so a frontend you built can serve the catalog and a hosted checkout. Not for WooCommerce, which is a WordPress plugin."
  },
  {
    "plugin_namespace": "hostinger-connector",
    "skill_name": "email-marketing",
    "purpose": "Use when the user wants to work with Hostinger Reach, their email marketing product — listing and creating contacts, importing contacts in bulk, organising them into groups, building segments with custom criteria, reading segment membership, listing marketing profiles, and checking whether a sending domain's MX, SPF, DKIM and DMARC records are configured. Not for mailboxes or reading mail."
  },
  {
    "plugin_namespace": "hostinger-connector",
    "skill_name": "hostinger",
    "purpose": "Start here for any task involving the user's Hostinger account — deploying a site, managing hosting and PHP, running WordPress, buying or configuring domains and DNS records, or administering a VPS. This skill connects the Hostinger MCP server, signs the user in, sets the safety rules that every Hostinger action follows, and hands off to the specialist skill that owns the task."
  },
  {
    "plugin_namespace": "hostinger-connector",
    "skill_name": "subscriptions-and-payments",
    "purpose": "Use when the user wants to see or manage what they pay Hostinger for — listing subscriptions and their renewal state, enabling or disabling auto-renewal, renewing a subscription, browsing the product catalog with prices, listing payment methods and setting a default, or placing an order for a Hostinger product. Every write here costs the user money or affects whether their services stay online."
  },
  {
    "plugin_namespace": "hostinger-connector",
    "skill_name": "vps",
    "purpose": "Use when the user wants to administer a Hostinger VPS — listing and inspecting virtual machines, starting, stopping or restarting them, taking and restoring snapshots and backups, managing firewalls and their rules, SSH public keys, post-install scripts, PTR records, hostnames and nameservers, entering recovery mode, reading metrics and malware scan results, or running Docker projects on the machine."
  },
  {
    "plugin_namespace": "hostinger-connector",
    "skill_name": "websites",
    "purpose": "Use for anything on a Hostinger hosting plan — deploying static sites and Node.js applications, provisioning websites and free subdomains, installing and operating WordPress with its plugins and themes, and managing PHP versions and extensions, MySQL databases, cron jobs, subdomains, parked domains and server-side caching. Also covers Agency Plan websites. Buying or configuring a domain name belongs to domains; a VPS belongs to vps."
  },
  {
    "plugin_namespace": "hubspot",
    "skill_name": "hubspot",
    "purpose": "Use when working with HubSpot CRM records to search, summarize, create, update, associate, or analyze objects and properties."
  },
  {
    "plugin_namespace": "hubspot",
    "skill_name": "hubspot-crm-data-hygiene",
    "purpose": "Use when auditing HubSpot data quality for missing fields, stale records, duplicates, associations, owners, or cleanup tasks."
  },
  {
    "plugin_namespace": "hubspot",
    "skill_name": "hubspot-customer-prep",
    "purpose": "Use when preparing HubSpot customer briefs for meetings, renewals, QBRs, sales calls, escalations, handoffs, or follow-ups."
  },
  {
    "plugin_namespace": "hubspot",
    "skill_name": "hubspot-pipeline-health",
    "purpose": "Use when reviewing HubSpot pipeline health, forecasts, stale deals, slipping close dates, or open deal risks."
  },
  {
    "plugin_namespace": "human-prose-editor",
    "skill_name": "human-prose",
    "purpose": "Edit, rewrite, audit, or draft prose when the user wants writing to sound less AI-generated, less generic, less templated, more concrete, or more human while preserving the writer's existing voice and meaning. Use for requests to de-AI, humanize, de-slop, remove AI writing habits, audit for AI-slop, fix staccato or semantic beat stacking, repair weak narrative or scene architecture, fix floating dialogue, or apply anti-AI prose rules. Do not trigger for ordinary summarization, translation, factual Q&A, or grammar-o"
  },
  {
    "plugin_namespace": "human-writing",
    "skill_name": "human-writing",
    "purpose": "Draft or revise prose so it sounds natural, specific, and individually voiced while preserving the writer's meaning. Use for humanizing AI-assisted text, matching a supplied voice sample, or improving fiction and narrative structure; do not use as an AI-detector or for proofreading that should preserve every stylistic choice."
  },
  {
    "plugin_namespace": "humanwriting",
    "skill_name": "human-writing",
    "purpose": "Draft or revise reader-facing prose so it sounds natural, specific, and suited to the writer, audience, and situation. Use when the user invokes HumanWriting, asks for a human or natural voice, wants AI-sounding language removed, or requests polished emails, messages, posts, applications, reports, speeches, articles, explanations, or other prose where authentic voice matters. Do not trigger for code, data extraction, verbatim quotations, exact-format transcription, or factual lookup unless prose writing is also req"
  },
  {
    "plugin_namespace": "hype-design-production",
    "skill_name": "hype-design-production",
    "purpose": "Generate one-page fixed-template Hype Events PDF files from direct or email-derived requirements. Use for CTFS, STC, Hype featured awards, and Hype promotion certificates. This workflow never generates images and never redesigns the template."
  },
  {
    "plugin_namespace": "linkedin-animated-infographics",
    "skill_name": "exact-svg-mascot",
    "purpose": "Animate a named or official mascot using the exact user-supplied SVG while preserving its identity. Use when the mascot asset must not be redrawn, substituted, approximated, or silently regenerated."
  },
  {
    "plugin_namespace": "linkedin-animated-infographics",
    "skill_name": "host-workspace-operator",
    "purpose": "Inspect, search, modify, and verify files or repository state using the safest host-native ChatGPT/Codex capabilities available."
  },
  {
    "plugin_namespace": "linkedin-animated-infographics",
    "skill_name": "linkedin-caption-narrative",
    "purpose": "Use when writing or rewriting LinkedIn captions for repos, plugins, AI workflows, GIFs, infographics, technical ideas, curated collections, tool explainers, belief-correction posts, or first-comment link payloads that need a strong mobile hook and mechanism-first narrative"
  },
  {
    "plugin_namespace": "linkedin-animated-infographics",
    "skill_name": "linkedin-infographic-autopilot",
    "purpose": "Run LinkedIn infographic work in autopilot mode by negotiating available host capabilities, using real side jobs and sandbox artifacts when available, and falling back honestly when they are not. Use for end-to-end creation, redesign, animation, or rigorous production workflows in ChatGPT or Codex."
  },
  {
    "plugin_namespace": "linkedin-animated-infographics",
    "skill_name": "linkedin-infographic-review",
    "purpose": "Review a finished static or animated LinkedIn infographic before publishing. Check hierarchy, visual balance, dead space, generic UI patterns, copy, evidence, motion, rendering, and feed-scale legibility without redesigning unrelated content."
  },
  {
    "plugin_namespace": "linkedin-animated-infographics",
    "skill_name": "linkedin-infographic-studio",
    "purpose": "Create or redesign a static or animated LinkedIn infographic with evidence checks, verified identity sourcing, narrative taste, concept exploration, intentional typography, macro-layout planning, still-first visual critique, disciplined motion, and final verification. Use for full infographic creation in ChatGPT or Codex."
  },
  {
    "plugin_namespace": "linkedin-animated-infographics",
    "skill_name": "masterone",
    "purpose": "Start LinkedIn infographic work by onboarding reusable project preferences, resolving only route-relevant missing inputs, and selecting the correct OpenAI production or focused skill. Use first when a ChatGPT or Codex user starts or resumes infographic work."
  },
  {
    "plugin_namespace": "linkedin-animated-infographics",
    "skill_name": "sandbox-python-executor",
    "purpose": "Use host-native Python for deterministic file processing, package inspection, hashing, validation, and other executable verification when Python is actually available."
  },
  {
    "plugin_namespace": "linkedin-animated-infographics",
    "skill_name": "share-community-demo",
    "purpose": "Prepare and publish a verified LinkedIn infographic demo to the community gallery through a contributor GitHub pull request. Use only after explicit user consent, rights confirmation, and final verification PASS."
  },
  {
    "plugin_namespace": "linkedin-text-styler",
    "skill_name": "style-linkedin-text",
    "purpose": "Style, format, or clean LinkedIn posts, comments, profile headlines, About sections, and company-page copy using copy-paste-safe Unicode emphasis, decorative alphabets, bullets, checklists, and numbered lists. Use when the user asks for LinkedIn bold, italics, underline, strikethrough, special fonts, a text formatter, a styled post, Unicode conversion, formatting removal, or variants to compare before posting."
  },
  {
    "plugin_namespace": "ls-doctor",
    "skill_name": "ls-doctor",
    "purpose": "Diagnose LIVE Studio safely with desktop inspection and web fallback."
  },
  {
    "plugin_namespace": "mathbox",
    "skill_name": "computation-audit",
    "purpose": "Design, run, or audit a mathematical computation that supports a research claim, including symbolic, exact, finite-field, representation-theoretic, homological, or numerical experiments. Use when correctness, provenance, tested range, reproducibility, or interpretation matters. Do not present bounded output as a universal proof."
  },
  {
    "plugin_namespace": "mathbox",
    "skill_name": "literature-check",
    "purpose": "Verify an external mathematical theorem, citation, notation translation, source-dependent implication, or bounded novelty claim, reusing authorized project-local source copies when available. Use when a proof relies on a named paper/result, when exact hypotheses or versions matter, when the user asks whether a claim is known, or when an authenticated mathematical source should be cached for later checks. Prefer primary sources and record the search scope. Do not treat snippets or failed searches as proof or global "
  },
  {
    "plugin_namespace": "mathbox",
    "skill_name": "manuscript-integrate",
    "purpose": "Integrate an already validated mathematical result, correction, citation, or referee response into an authoritative LaTeX manuscript while preserving hypotheses, evidence status, notation, and dependencies. Use only when the user explicitly requests manuscript integration. Do not use to invent a proof or to perform routine copyediting."
  },
  {
    "plugin_namespace": "mathbox",
    "skill_name": "proof-audit",
    "purpose": "Adversarially audit an existing mathematical claim, proof, derivation, diagram, or theorem dependency for correctness. Use for requests to verify, referee, stress-test, type-check, find gaps, or isolate the exact remaining implication. Default to read-only. Do not use to invent a substantially new proof route or merely copyedit prose."
  },
  {
    "plugin_namespace": "mathbox",
    "skill_name": "proofread-math",
    "purpose": "Conservatively proofread mathematical prose and LaTeX for grammar, typography, syntax, notation consistency, cross-references, and uniquely forced local mathematical typos. Use for explicit math-proofreading requests and final self-review of theorem-, proof-, or equation-heavy edits. Do not invent, replace, shorten, or substantively repair proofs."
  },
  {
    "plugin_namespace": "mathbox",
    "skill_name": "research-attempt",
    "purpose": "Run one bounded, auditable mathematical research route: a proof attempt, reduction, counterexample search, source-dependent implication, or claim-supporting computation. Use when the user explicitly asks to attack a research question or invokes this skill. Do not use for a sustained multi-route investigation that continues after failed approaches, routine editing, explanation, or an unchanged verification rerun."
  },
  {
    "plugin_namespace": "mathbox",
    "skill_name": "research-init",
    "purpose": "Initialize, retrofit, or refresh an AI-assisted mathematical research repository. Use only when the user explicitly asks to set up or substantially revise AGENTS.md, CLAUDE.md, research workflow files, or the repository's agent architecture. Inspect first, interview adaptively, propose a reviewed file plan, and default to no repository-local skills because canonical workflows come from the mathbox plugin."
  },
  {
    "plugin_namespace": "mathbox",
    "skill_name": "research-program",
    "purpose": "Pursue a substantial mathematical research goal across multiple proof, counterexample, literature, and computational routes. Use when the user asks for sustained investigation, several approaches, a breakthrough, or continuation until a goal is reached. Coordinate successive research attempts and preserve their evidence. Do not use for a single bounded lemma attempt, ordinary explanation, proofreading, or a read-only project retrospective."
  },
  {
    "plugin_namespace": "mathbox",
    "skill_name": "research-retrospective",
    "purpose": "Reconcile a mathematical research repository's current claims, proofs, computations, status, literature dependencies, and failed routes, then recommend the next bounded research moves. Use only when the user asks for a project review, weekly/monthly retrospective, prioritization, a prose project handoff, or “what should I do next?”. Do not use to operate a .mathbox ledger or to generate its dependency-aware handoff. Default to read-only."
  },
  {
    "plugin_namespace": "mathbox",
    "skill_name": "research-state",
    "purpose": "Track exact mathematical claims, evidence revisions, dependency impact, audit provenance, research routes, and parallel or delayed executions in a local append-only ledger. Use when a project has a .mathbox ledger or the user asks for executable research-state tracking, stale-evidence detection, run reconciliation, or a dependency-aware handoff generated from recorded events. Do not initialize state for a casual math question, replace proof auditing with metadata validation, or write a prose project retrospective f"
  },
  {
    "plugin_namespace": "migrating-to-react-native",
    "skill_name": "assess-react-native-migration",
    "purpose": "Assesses whether and how an existing mobile product should migrate to React Native. Use when auditing one or more product repositories for migration readiness, including products whose iOS, Android, and other clients live in separate directories or repositories; choosing brownfield, greenfield, or a checkpoint-based path; defining a representative trial; or preparing a baseline and ROI decision before implementation. When product scope or material evidence is unavailable, grills the stakeholder with exactly one que"
  },
  {
    "plugin_namespace": "migrating-to-react-native",
    "skill_name": "react-native-brownfield-migration",
    "purpose": "Implements an accepted incremental brownfield migration from native iOS or Android to React Native or Expo using @callstack/react-native-brownfield. Use after the brownfield path has been selected, when setting up the integration, packaging XCFramework or AAR artifacts, or adding React Native surfaces to native hosts."
  },
  {
    "plugin_namespace": "nacl",
    "skill_name": "nacl-ba",
    "purpose": "Route NaCl business analysis across context, processes, entities, roles, rules, workflows, validation, sync, and handoff. Use for graph-first BA work."
  },
  {
    "plugin_namespace": "nacl",
    "skill_name": "nacl-diagnose",
    "purpose": "Diagnose NaCl project health, drift, status, reconciliation, or next work using read-only evidence and actionable closed outcomes."
  },
  {
    "plugin_namespace": "nacl",
    "skill_name": "nacl-fix",
    "purpose": "Diagnose and repair a bounded NaCl defect with spec-first classification, a regression test, verification, and honest status propagation."
  },
  {
    "plugin_namespace": "nacl",
    "skill_name": "nacl-goal",
    "purpose": "Plan or conduct a bounded NaCl objective with explicit checks and closed statuses. Use for multi-step goals and resumable orchestration."
  },
  {
    "plugin_namespace": "nacl",
    "skill_name": "nacl-init",
    "purpose": "Inspect or initialize a NaCl project with a per-project Neo4j Community graph and project-local MCP. Use for first setup, bootstrap, and repair planning."
  },
  {
    "plugin_namespace": "nacl",
    "skill_name": "nacl-migrate",
    "purpose": "Plan or execute confirmed NaCl methodology migrations for legacy, BA, or SA artifacts with backups, validation, and read-back."
  },
  {
    "plugin_namespace": "nacl",
    "skill_name": "nacl-publish",
    "purpose": "Render, package, ship, release, deploy, or publish NaCl outputs with explicit external-write authorization and verified evidence."
  },
  {
    "plugin_namespace": "nacl",
    "skill_name": "nacl-sa",
    "purpose": "Route NaCl system analysis across architecture, domains, roles, use cases, UI, features, validation, and finalization. Use for graph-first SA work."
  },
  {
    "plugin_namespace": "nacl",
    "skill_name": "nacl-tl",
    "purpose": "Route NaCl team-lead work across intake, planning, development, review, QA, status, release, and deployment. Use for graph-aware delivery work."
  },
  {
    "plugin_namespace": "nacl",
    "skill_name": "nacl-verify",
    "purpose": "Verify NaCl code, tests, QA, synchronization, review evidence, or stubs without converting missing runtime proof into success."
  },
  {
    "plugin_namespace": "natural-writing",
    "skill_name": "natural-writing",
    "purpose": "Draft or revise ordinary expository prose when the user asks for clearer, more concise, less formulaic, or audience-appropriate wording. Use for workplace messages, explanations, documentation, reports, and prose rewrites where wording and information order are central. Do not invoke automatically for code-only or machine-readable output, exact transcription or protected text, legal or specification wording, or creative and literary writing; use it there only when the user explicitly invokes the skill or asks to re"
  },
  {
    "plugin_namespace": "neon-postgres",
    "skill_name": "neon",
    "purpose": "Overview of Neon, a complete set of cloud backend primitives for apps and agents, spanning Lakebase Postgres, Auth, the Data API, Object Storage, Compute Functions, and the AI Gateway. Start here to route to the right Neon skill, set up the CLI or MCP server, and follow the branch-first workflow. Use when \"Neon\" or \"Lakebase Postgres\" is mentioned, or when any of its individual capabilities are the trigger: \"object storage\" or \"S3\", \"buckets\", \"serverless functions\", \"AI gateway\", \"call an LLM\", \"logs\", \"branch log"
  },
  {
    "plugin_namespace": "neon-postgres",
    "skill_name": "neon-ai-gateway",
    "purpose": "One API and one credential for frontier and open-source LLMs, built into your Neon branch and powered by Databricks. Use when a user wants to call an LLM, add AI/chat/an agent to their app, route between model providers (OpenAI, Anthropic, Google/Gemini, Meta, Alibaba, and more), or avoid juggling separate provider API keys and accounts — especially when they already use Neon and want AI requests to branch with their project. Works with the OpenAI SDK, Anthropic SDK, google-genai, the Vercel AI SDK, and Mastra by c"
  },
  {
    "plugin_namespace": "neon-postgres",
    "skill_name": "neon-functions",
    "purpose": "Long-running, serverless Node.js HTTP functions deployed onto your Neon branch, with DATABASE_URL injected automatically and compute that runs next to your data. Use when a user wants to host an API, an AI agent with long streaming responses, a WebSocket or server-sent-events (SSE) server, a webhook handler, a Discord bot, an MCP server, or any request/response workload that risks timing out on short, lambda-style serverless functions — and wants it to branch with their database. Triggers include \"serverless functi"
  },
  {
    "plugin_namespace": "neon-postgres",
    "skill_name": "neon-object-storage",
    "purpose": "S3-compatible object storage that branches with your Neon project, so files and the database stay in sync across every branch. Use when a user wants object storage, a bucket, blob/file storage, or somewhere to put uploads, images, documents, avatars, or user-generated files for their app or agent — especially when they already use (or are setting up) Lakebase Postgres and don't want to add a separate storage provider like AWS S3, Cloudflare R2, or Supabase Storage. Triggers include \"object storage\", \"bucket\", \"blob"
  },
  {
    "plugin_namespace": "neon-postgres",
    "skill_name": "neon-postgres",
    "purpose": "Guides and best practices for working with Lakebase Postgres, the database behind Neon. Covers setup, connection methods and drivers, pooled vs direct connections, branching, schema migrations, autoscaling, scale-to-zero, instant restore, read replicas, connection pooling, IP allow lists, and logical replication. Use when users ask about \"Lakebase Postgres\", \"Neon setup\", \"connect to Neon\", \"Neon project\", \"DATABASE_URL\", \"serverless Postgres\", \"Neon CLI\", \"neon\", \"Neon MCP\", \"Neon Auth\", \"@neondatabase/serverless\""
  },
  {
    "plugin_namespace": "netlify",
    "skill_name": "netlify-ai-gateway",
    "purpose": "Guide for using Netlify AI Gateway to access AI models. Use when adding AI capabilities or selecting/changing AI models. Must be read before choosing a model. Covers supported providers (OpenAI, Anthropic, Google), SDK setup, environment variables, and the list of available models."
  },
  {
    "plugin_namespace": "netlify",
    "skill_name": "netlify-blobs",
    "purpose": "Guide for using Netlify Blobs object storage. Use when storing files, images, documents, or simple key-value data without a full database. Covers getStore(), CRUD operations, metadata, listing, deploy-scoped vs site-scoped stores, and local development."
  },
  {
    "plugin_namespace": "netlify",
    "skill_name": "netlify-caching",
    "purpose": "Guide for controlling caching on Netlify's CDN. Use when configuring cache headers, setting up stale-while-revalidate, implementing on-demand cache purge, or understanding Netlify's CDN caching behavior. Covers Cache-Control, Netlify-CDN-Cache-Control, cache tags, durable cache, and framework-specific caching patterns."
  },
  {
    "plugin_namespace": "netlify",
    "skill_name": "netlify-cli-and-deploy",
    "purpose": "Guide for using the Netlify CLI and deploying sites. Use when installing the CLI, linking sites, deploying (Git-based or manual), managing environment variables, or running local development. Covers netlify dev, netlify deploy, Git vs non-Git workflows, and environment variable management."
  },
  {
    "plugin_namespace": "netlify",
    "skill_name": "netlify-config",
    "purpose": "Reference for netlify.toml configuration. Use when configuring build settings, redirects, rewrites, headers, deploy contexts, environment variables, or any site-level configuration. Covers the complete netlify.toml syntax including redirects with splats/conditions, headers, deploy contexts, functions config, and edge functions config."
  },
  {
    "plugin_namespace": "netlify",
    "skill_name": "netlify-deploy",
    "purpose": "Deploy projects to Netlify with the Netlify CLI. Use when the user wants to link a repo, validate deploy settings, run a deploy, or choose between preview and production flows."
  },
  {
    "plugin_namespace": "netlify",
    "skill_name": "netlify-edge-functions",
    "purpose": "Guide for writing Netlify Edge Functions. Use when building middleware, geolocation-based logic, request/response manipulation, authentication checks, A/B testing, or any low-latency edge compute. Covers Deno runtime, context.next() middleware pattern, geolocation, and when to choose edge vs serverless."
  },
  {
    "plugin_namespace": "netlify",
    "skill_name": "netlify-forms",
    "purpose": "Guide for using Netlify Forms for HTML form handling. Use when adding contact forms, feedback forms, file upload forms, or any form that should be collected by Netlify. Covers the data-netlify attribute, spam filtering, AJAX submissions, file uploads, notifications, and the submissions API."
  },
  {
    "plugin_namespace": "netlify",
    "skill_name": "netlify-frameworks",
    "purpose": "Guide for deploying web frameworks on Netlify. Use when setting up a framework project (Vite/React, Astro, TanStack Start, Next.js, Nuxt, SvelteKit, Remix) for Netlify deployment, configuring adapters or plugins, or troubleshooting framework-specific Netlify integration. Covers what Netlify needs from each framework and how adapters handle server-side rendering."
  },
  {
    "plugin_namespace": "netlify",
    "skill_name": "netlify-functions",
    "purpose": "Guide for writing Netlify serverless functions. Use when creating API endpoints, background processing, scheduled tasks, or any server-side logic using Netlify Functions. Covers modern syntax (default export + Config), TypeScript, path routing, background functions, scheduled functions, streaming, and method routing."
  },
  {
    "plugin_namespace": "netlify",
    "skill_name": "netlify-identity",
    "purpose": "Use when the task involves authentication, user signups, logins, password recovery, OAuth providers, role-based access control, or protecting routes and functions. Always use `@netlify/identity`. Never use `netlify-identity-widget` or `gotrue-js` — they are deprecated."
  },
  {
    "plugin_namespace": "netlify",
    "skill_name": "netlify-image-cdn",
    "purpose": "Guide for using Netlify Image CDN for image optimization and transformation. Use when serving optimized images, creating responsive image markup, setting up user-uploaded image pipelines, or configuring image transformations. Covers the /.netlify/images endpoint, query parameters, remote image allowlisting, clean URL rewrites, and composing uploads with Functions + Blobs."
  },
  {
    "plugin_namespace": "no-ai-slop-plugins-6a6694f6da748191ae9544fa5d1b4d7f",
    "skill_name": "no-ai-slop",
    "purpose": "Edit drafts into sharper, more human writing while preserving the writer's personal voice, or detect AI-slop patterns without rewriting. Use when the user wants a draft clearer, more direct, more opinionated, or less AI-sounding, or asks whether writing reads as AI."
  },
  {
    "plugin_namespace": "no-ai-slop-plugins-6a891ce942648191994f57393f2e765b",
    "skill_name": "arabic-style-curator",
    "purpose": "Curate Arabic prose for dialect authenticity, natural Arabic-English code-switching, house vocabulary, Egyptian spoken cadence, banned AI expressions, and phrase-bank guidance. Use for Egyptian Arabic, Saudi Arabic, MSA, neutral Arabic, bilingual content, or when Arabic sounds translated, generic, or mechanically formal."
  },
  {
    "plugin_namespace": "no-ai-slop-plugins-6a891ce942648191994f57393f2e765b",
    "skill_name": "commercial-copy-director",
    "purpose": "Build or edit advertising copy, landing-page copy, campaign copy, marketing playbooks, offers, headlines, and CTAs using audience awareness, real objections, proof, specificity, and decision context. Use when the writing must persuade commercially without fabricated proof, fake urgency, generic hype, or psychological pressure."
  },
  {
    "plugin_namespace": "no-ai-slop-plugins-6a891ce942648191994f57393f2e765b",
    "skill_name": "plain-spoken-writing",
    "purpose": "Use when drafting or rewriting prose that should sound like the speaker actually talks, especially Egyptian Arabic, Arabic-English code-switching, social posts, emails, business writing, personal voice, conversational copy, or when output feels polished, generic, formal, or AI-written."
  },
  {
    "plugin_namespace": "no-ai-slop-plugins-6a891ce942648191994f57393f2e765b",
    "skill_name": "slop-audit",
    "purpose": "Audit prose for named AI-slop patterns without rewriting or guessing authorship. Use when the user asks what sounds generic, formulaic, robotic, over-polished, or AI-like and wants evidence instead of an edit."
  },
  {
    "plugin_namespace": "no-ai-slop-plugins-6a891ce942648191994f57393f2e765b",
    "skill_name": "slop-pattern-repair",
    "purpose": "Repair specific recurring phrase, structure, rhythm, agency, metadiscourse, and formatting patterns after a draft has been read in context. Use when the user wants targeted anti-slop cleanup rather than a general rewrite."
  },
  {
    "plugin_namespace": "no-ai-slop-plugins-6a891ce942648191994f57393f2e765b",
    "skill_name": "slop-quality-gate",
    "purpose": "Check an edited or newly written draft for factual drift, voice loss, over-editing, residual formulaic patterns, robotic rhythm, sayability failures, and output-contract failures. Use after a rewrite, a plain-spoken pass, or when the user wants a quality check."
  },
  {
    "plugin_namespace": "no-ai-slop-plugins-6a891ce942648191994f57393f2e765b",
    "skill_name": "slop-router",
    "purpose": "Route a writing or content request through the minimum connected Slop Curator Skills needed. Use for anti-slop editing, voice preservation, spoken or Egyptian Arabic writing, strict house-style rules, commercial copy, playbooks, presentations, visual-content review, or combined audit-and-edit workflows."
  },
  {
    "plugin_namespace": "no-ai-slop-plugins-6a891ce942648191994f57393f2e765b",
    "skill_name": "strict-human-output",
    "purpose": "Apply a structured human-writing policy to prose when the user wants strict anti-slop constraints, house-style compliance, factual discipline, punctuation controls, banned-language checks, or a final rule-based pass without changing approved meaning."
  },
  {
    "plugin_namespace": "no-ai-slop-plugins-6a891ce942648191994f57393f2e765b",
    "skill_name": "visual-content-anti-slop",
    "purpose": "Review or plan presentations, reports, brochures, documents, visual briefs, and Arabic RTL layouts for AI-design clichés, fake data, decorative copy, asset misuse, weak hierarchy, and Arabic rendering risks. Use when the requested deliverable has a visual or document-design component."
  },
  {
    "plugin_namespace": "no-ai-slop-plugins-6a891ce942648191994f57393f2e765b",
    "skill_name": "voice-preserving-edit",
    "purpose": "Edit a draft while protecting the writer's meaning, facts, cadence, vocabulary, humor, bluntness, uncertainty, and useful imperfections. Use when preserving personal voice matters more than making every sentence uniformly polished."
  },
  {
    "plugin_namespace": "noodle-seed",
    "skill_name": "noodle-seed",
    "purpose": "Use when asked to build, create, or ship an MCP server, MCP app, AI app, or connector, or to make a product, API, or SaaS reachable by AI agents. Bootstraps Noodle Seed — TypeScript authoring with the noodle CLI, local validation and testing, and governed hosted deployment."
  },
  {
    "plugin_namespace": "notion",
    "skill_name": "notion-knowledge-capture",
    "purpose": "Capture conversations and decisions into structured Notion pages; use when turning chats/notes into wiki entries, how-tos, decisions, or FAQs with proper linking."
  },
  {
    "plugin_namespace": "notion",
    "skill_name": "notion-meeting-intelligence",
    "purpose": "Prepare meeting materials with Notion context and supplemental research; use when gathering context, drafting agendas/pre-reads, and tailoring materials to attendees."
  },
  {
    "plugin_namespace": "notion",
    "skill_name": "notion-research-documentation",
    "purpose": "Research across Notion and synthesize into structured documentation; use when gathering info from multiple Notion sources to produce briefs, comparisons, or reports with citations."
  },
  {
    "plugin_namespace": "notion",
    "skill_name": "notion-spec-to-implementation",
    "purpose": "Turn Notion specs into implementation plans, tasks, and progress tracking; use when implementing PRDs/feature specs and creating Notion plans + tasks from them."
  },
  {
    "plugin_namespace": "ogenic-god-toolkit",
    "skill_name": "god-mode",
    "purpose": "Orchestrate software, repository, browser, document, automation, and system operations through one auto-routed hybrid interface. Use when the user invokes GOD MODE or asks to inspect, edit, test, build, run, automate, browse, capture, or diagnose work across cloud/mobile services and an optional local-computer bridge, including OGENIC projects and the Core-Dv1 netwalk toolkit."
  },
  {
    "plugin_namespace": "ogenic-god-toolkit",
    "skill_name": "netwalk",
    "purpose": "Run a complete read-only network survey end to end: get access, crawl the topology, diagnose every device, draw the diagram and produce a deliverable report. Loops netwalk-login, netwalk-scan and netwalk-diag until the crawl runs dry or the engineer is satisfied, then finishes once with netwalk-map and netwalk-fullreport. Use when the user wants a whole network surveyed, audited or documented rather than one specific step - 'survey this site', 'audit my customer's network', 'document what is on this LAN'."
  },
  {
    "plugin_namespace": "ogenic-god-toolkit",
    "skill_name": "netwalk-diag",
    "purpose": "Read a network device or Linux/Windows server end to end and work out what is wrong with it. Exports config read-only, collects CPU, memory, storage, temperature, PoE, interface counters, error and flap counts, throughput, sessions, services and logs, then reasons from that evidence to concrete findings with severity and recommendations. Use when the user asks what is wrong with a device or site, wants a health check, or has a symptom (slow, dropping, rebooting, flapping) to chase."
  },
  {
    "plugin_namespace": "ogenic-god-toolkit",
    "skill_name": "netwalk-fullreport",
    "purpose": "Turn a netwalk scan record into a single self-contained HTML network report a site owner can be handed. Includes summary, method and coverage, embedded topology diagram, device inventory, per-device interfaces/VLANs/wireless/services/health, findings with evidence and recommendations, and the full log of commands run. Has a --public mode that strips internal detail. Use when the user asks for a network report, audit document, site survey writeup or something to deliver to a client."
  },
  {
    "plugin_namespace": "ogenic-god-toolkit",
    "skill_name": "netwalk-login",
    "purpose": "Collect device credentials for a netwalk survey through a local browser form instead of the chat. Serves a one-shot page on 127.0.0.1 where the user types usernames, passwords, SSH key PATHS or API tokens; the values are written to a private file on their machine and the assistant never sees them. Use when a scan needs to log into a device and there is no working credential yet, when a hop fails authentication, or when the user asks how to give access without pasting secrets."
  },
  {
    "plugin_namespace": "ogenic-god-toolkit",
    "skill_name": "netwalk-map",
    "purpose": "Draw a network topology diagram from a netwalk scan record. Produces a self-contained SVG with a vendor logo, hostname, management IP, model, OS version and live CPU/RAM/storage/temperature per device, one box per internet uplink, and port labels on every link. Use when the user asks for a network diagram, topology map or visual of a scanned site, or wants the picture refreshed after more devices were found."
  },
  {
    "plugin_namespace": "ogenic-god-toolkit",
    "skill_name": "netwalk-scan",
    "purpose": "Discover and map a network read-only, starting from one device the user names. Crawls outward hop by hop using LLDP, CDP, MNDP, ARP, DHCP leases, routing and MAC tables across MikroTik, Cisco, Aruba, HP, Fortinet, Juniper, Ubiquiti, Linux and Windows, and writes a structured scan record. Use when the user asks to scan, survey, crawl, inventory, audit or 'see everything on' a network or a site, theirs or a customer's."
  },
  {
    "plugin_namespace": "ogenic-god-toolkit",
    "skill_name": "ogenic-god-toolkit",
    "purpose": "One auto-routed OGENIC toolkit that analyzes each request and selects or chains Code Skill, Code System, Code Delivery, and Code Website without requiring the user to choose a category."
  },
  {
    "plugin_namespace": "openai-templates",
    "skill_name": "artifact-template-analytics-dashboard",
    "purpose": "Create a spreadsheet using the Analytics Dashboard template and its retained reference file. Use when the user selects or names Analytics Dashboard. Monitor acquisition, engagement, retention, revenue, and conversion funnel KPIs with charts."
  },
  {
    "plugin_namespace": "openai-templates",
    "skill_name": "artifact-template-business-review",
    "purpose": "Create a presentation using the Business Review template and its retained reference file. Use when the user selects or names Business Review. Review business performance, KPIs, segment results, strategic priorities, decisions, and outlook."
  },
  {
    "plugin_namespace": "openai-templates",
    "skill_name": "artifact-template-design-report",
    "purpose": "Create a document using the Design Report template and its retained reference file. Use when the user selects or names Design Report. Produce design reports with an executive summary, key findings, implications, recommendations, and appendix."
  },
  {
    "plugin_namespace": "openai-templates",
    "skill_name": "artifact-template-experiment-analysis",
    "purpose": "Create a document using the Experiment Analysis template and its retained reference file. Use when the user selects or names Experiment Analysis. Analyze experiments with hypotheses, methodology, results, interpretation, limitations, and next steps."
  },
  {
    "plugin_namespace": "openai-templates",
    "skill_name": "artifact-template-financial-budget",
    "purpose": "Create a spreadsheet using the Financial Budget template and its retained reference file. Use when the user selects or names Financial Budget. Model actuals, budget and scenario forecasts, variances, cash runway, and departmental plans."
  },
  {
    "plugin_namespace": "openai-templates",
    "skill_name": "artifact-template-investment-committee-memo",
    "purpose": "Create a document using the Investment Committee Memo template and its retained reference file. Use when the user selects or names Investment Committee Memo. Prepare investment committee memos with the thesis, transaction details, financial analysis, risks, and recommendation."
  },
  {
    "plugin_namespace": "openai-templates",
    "skill_name": "artifact-template-legal-memorandum",
    "purpose": "Create a document using the Legal Memorandum template and its retained reference file. Use when the user selects or names Legal Memorandum. Draft legal memoranda with the issue, brief answer, relevant facts, analysis, and conclusion."
  },
  {
    "plugin_namespace": "openai-templates",
    "skill_name": "artifact-template-market-trends-report",
    "purpose": "Create a presentation using the Market Trends Report template and its retained reference file. Use when the user selects or names Market Trends Report. Communicate market or industry trends, supporting evidence, implications, and recommended responses."
  },
  {
    "plugin_namespace": "openai-templates",
    "skill_name": "artifact-template-minimal-letterhead",
    "purpose": "Create a document using the Minimal Letterhead template and its retained reference file. Use when the user selects or names Minimal Letterhead. Write professional business letters with sender, recipient, message, and signature fields in a minimal letterhead layout."
  },
  {
    "plugin_namespace": "openai-templates",
    "skill_name": "artifact-template-operating-calendar",
    "purpose": "Create a spreadsheet using the Operating Calendar template and its retained reference file. Use when the user selects or names Operating Calendar. Plan annual and monthly operating milestones, campaigns, launches, deadlines, and recurring events."
  },
  {
    "plugin_namespace": "openai-templates",
    "skill_name": "artifact-template-operating-review",
    "purpose": "Create a presentation using the Operating Review template and its retained reference file. Use when the user selects or names Operating Review. Run weekly operating reviews with scorecards, functional updates, risks, decisions, and action items."
  },
  {
    "plugin_namespace": "openai-templates",
    "skill_name": "artifact-template-project-kickoff",
    "purpose": "Create a presentation using the Project Kickoff template and its retained reference file. Use when the user selects or names Project Kickoff. Align teams on project goals, scope, roles, milestones, risks, and the working model."
  },
  {
    "plugin_namespace": "openai-templates",
    "skill_name": "artifact-template-project-tracker",
    "purpose": "Create a spreadsheet using the Project Tracker template and its retained reference file. Use when the user selects or names Project Tracker. Manage workstreams, tasks, owners, status, priority, dates, launch pulse, and a Gantt schedule."
  },
  {
    "plugin_namespace": "openai-templates",
    "skill_name": "artifact-template-sales-pipeline",
    "purpose": "Create a spreadsheet using the Sales Pipeline template and its retained reference file. Use when the user selects or names Sales Pipeline. Track opportunities, stages, owners, deal sizes, probabilities, forecasts, next steps, and risks."
  },
  {
    "plugin_namespace": "openai-templates",
    "skill_name": "artifact-template-simple-dark-mode",
    "purpose": "Create a presentation using the Simple Dark Mode template and its retained reference file. Use when the user selects or names Simple Dark Mode. Create clean dark-mode presentations with bold typography, simple sections, charts, and imagery."
  },
  {
    "plugin_namespace": "openai-templates",
    "skill_name": "artifact-template-simple-light-mode",
    "purpose": "Create a presentation using the Simple Light Mode template and its retained reference file. Use when the user selects or names Simple Light Mode. Create clean light-mode presentations with spacious typography, simple sections, charts, and imagery."
  },
  {
    "plugin_namespace": "openai-templates",
    "skill_name": "artifact-template-strategy-memorandum",
    "purpose": "Create a document using the Strategy Memorandum template and its retained reference file. Use when the user selects or names Strategy Memorandum. Present strategic context, choices, rationale, risks, milestones, and a clear recommendation."
  },
  {
    "plugin_namespace": "openai-templates",
    "skill_name": "artifact-template-system-design",
    "purpose": "Create a document using the System Design template and its retained reference file. Use when the user selects or names System Design. Document system architecture, requirements, components, data flows, APIs, tradeoffs, and operational considerations."
  },
  {
    "plugin_namespace": "openai-templates",
    "skill_name": "artifact-template-team-alignment",
    "purpose": "Create a presentation using the Team Alignment template and its retained reference file. Use when the user selects or names Team Alignment. Facilitate team offsites and planning with context, goals, priorities, decisions, and action items."
  },
  {
    "plugin_namespace": "openai-templates",
    "skill_name": "artifact-template-three-statement-forecast",
    "purpose": "Create a spreadsheet using the Three-Statement Forecast template and its retained reference file. Use when the user selects or names Three-Statement Forecast. Build an integrated income statement, balance sheet, and cash flow forecast with assumptions, checks, and an executive summary."
  },
  {
    "plugin_namespace": "opencompare",
    "skill_name": "opencompare",
    "purpose": "Research and compare business software with OpenCompare's neutral, source-linked pages. Use for SaaS selection, category research, product evaluation, alternatives, comparisons, and vendor shortlists."
  },
  {
    "plugin_namespace": "pdf-router",
    "skill_name": "pdf",
    "purpose": "route explicitly selected pdf artifact requests to the preinstalled capability. use only when the user explicitly selects @pdf; never trigger from request content alone."
  },
  {
    "plugin_namespace": "plugin-management",
    "skill_name": "plugin-management",
    "purpose": "Discover and suggest relevant plugins, inspect app permissions and dependencies, and manage plugin connections or removal. Use when the user asks about plugins or when a task would materially benefit from an external app, account, service, or data source that available tools cannot access."
  },
  {
    "plugin_namespace": "practice",
    "skill_name": "brief-to-counsel-drafter",
    "purpose": "Prepare focused, confidential briefs or instructions to counsel covering the mandate, procedural position, material facts, issues, record, authorities, questions, hearing logistics, and deliverables. Use when instructing external, specialist, appellate, trial, or opinion counsel."
  },
  {
    "plugin_namespace": "practice",
    "skill_name": "closure-report-drafter",
    "purpose": "Close legal matters with a source-backed report, final client communication, decisions and obligations schedule, financial reconciliation, file disposition, retention plan, conflict update, and lessons note. Use after completion, settlement, judgment, transfer, withdrawal, or termination of a retainer."
  },
  {
    "plugin_namespace": "practice",
    "skill_name": "conflict-checker",
    "purpose": "Run structured, confidentiality-preserving legal conflict checks across prospective clients, current and former clients, adverse parties, affiliates, related people, matters, witnesses, funders, experts, and lawyer interests. Use at intake and whenever parties, scope, staffing, or relationships change."
  },
  {
    "plugin_namespace": "practice",
    "skill_name": "costing-estimator",
    "purpose": "Build transparent, stage-based legal cost estimates and budgets with staffing, rates, hours, assumptions, exclusions, disbursements, taxes, scenarios, contingencies, and change controls. Use for engagement, matter planning, litigation budgets, fixed or capped fees, tenders, or estimate updates."
  },
  {
    "plugin_namespace": "practice",
    "skill_name": "time-narrative-drafter",
    "purpose": "Convert contemporaneous legal work records into accurate, specific, privilege-aware time-entry narratives. Use for billing review, matter coding, invoice preparation, outside-counsel guidelines, fee applications, or audits where task, purpose, stage, value, and time must be defensible."
  },
  {
    "plugin_namespace": "presentations-router",
    "skill_name": "presentation",
    "purpose": "route explicitly selected presentation or slide artifact requests to the preinstalled capability. use only when the user explicitly selects @presentation; never trigger from request content alone."
  },
  {
    "plugin_namespace": "product-design",
    "skill_name": "audit",
    "purpose": "Audit or critique a product flow, journey, workflow, funnel, onboarding path, checkout path, settings path, screen, or multi-step product experience by capturing screenshots first, then reporting UX, design, and accessibility findings from that evidence. Default to an inline report; use a canvas for a visual walkthrough when requested or clearly implied by the ongoing task. Use when the user asks to audit, review, critique, or give feedback on an app or website experience."
  },
  {
    "plugin_namespace": "product-design",
    "skill_name": "design-qa",
    "purpose": "Internal prototype QA helper. Use only after a Product Design prototype, URL-to-code build, or image-to-code build has a source visual target and a rendered implementation to compare before handoff. Do not use for broad UX critique, design critique, product audits, or flow reviews; route those user-facing requests to audit."
  },
  {
    "plugin_namespace": "product-design",
    "skill_name": "get-context",
    "purpose": "Mandatory design-brief gate for clarifying the product and outcome. Use before ideation, image-to-code builds, redesigns, or product UI work to clarify missing product information and play back the brief before proceeding."
  },
  {
    "plugin_namespace": "product-design",
    "skill_name": "ideate",
    "purpose": "Generate image-based alternatives, design remixes, or new design directions from a Product Design brief. Use when the user asks for design variants, visual exploration, design remixes, or image-generated approaches from provided context."
  },
  {
    "plugin_namespace": "product-design",
    "skill_name": "image-to-code",
    "purpose": "Implement a selected image, screenshot, mockup, or Image Gen reference as a faithful, responsive frontend."
  },
  {
    "plugin_namespace": "product-design",
    "skill_name": "index",
    "purpose": "Use when Product Design is explicitly invoked, or when the user's main goal is to explore a design, research UX, audit or critique a UX, product or web design, faithfully clone a visual design of a website or app into code, check a built design, or share a prototype. Do not use Product Design for ordinary implementation unless the user explicitly asks for it."
  },
  {
    "plugin_namespace": "product-design",
    "skill_name": "research",
    "purpose": "Run fast, source-grounded UX research on the highest-signal problems users are experiencing with a user-specified digital product. Use when the user asks to research user pain, UX friction, onboarding issues, docs/help problems, developer experience friction, support pain, product workflow issues, or current user complaints for a named product."
  },
  {
    "plugin_namespace": "product-design",
    "skill_name": "share",
    "purpose": "Share a runnable prototype using the user's preferred deployment tool."
  },
  {
    "plugin_namespace": "product-design",
    "skill_name": "url-to-code",
    "purpose": "Clone a live URL as a runnable frontend-only local app."
  },
  {
    "plugin_namespace": "product-design",
    "skill_name": "user-context",
    "purpose": "Load or manage Product Design's saved user context. Use when the user asks to set up Product Design, get started, onboard, save product or design sources, see what Product Design remembers, update saved context, or remember Product Design preferences. Examples include product URLs, Figma files, screenshots, reference images, codebase paths, Storybook, tokens, design systems, brand assets, and general product/design notes."
  },
  {
    "plugin_namespace": "promotion-check",
    "skill_name": "promotion-check",
    "purpose": "在前端代码变更已经完成，用户明确要求生成或更新联调清单、排查带有请求响应、日志、截图或人工结果的联调问题、更新联调场景状态，或判断变更是否具备提交 Code Review 条件时使用。不用于普通业务或代码问答、页面操作说明、PRD 前置澄清、技术设计和代码实现。"
  },
  {
    "plugin_namespace": "prompt-pie",
    "skill_name": "prompt-pie",
    "purpose": "Connect to Prompt Pie, send a regular prompt or single-file SKILL.md draft for visual editing, or get the edited document through the local ppie companion. Use for direct $prompt-pie requests and action-oriented requests to connect, send, or get one prompt-sized document. Keep explanation-only questions passive."
  },
  {
    "plugin_namespace": "quarryfi-time-tracker",
    "skill_name": "quarryfi-status",
    "purpose": "Check QuarryFi R&D tracking status across all configured company profiles"
  },
  {
    "plugin_namespace": "quarryfi-time-tracker",
    "skill_name": "quarryfi-update",
    "purpose": "Refresh the local QuarryFi plugin install from GitHub"
  },
  {
    "plugin_namespace": "remotion",
    "skill_name": "remotion-best-practices",
    "purpose": "Router for all Remotion skills"
  },
  {
    "plugin_namespace": "remotion",
    "skill_name": "remotion-captions",
    "purpose": "Transcribing, displaying and animating captions"
  },
  {
    "plugin_namespace": "remotion",
    "skill_name": "remotion-create",
    "purpose": "Create a new Remotion video"
  },
  {
    "plugin_namespace": "remotion",
    "skill_name": "remotion-docs",
    "purpose": "Search Remotion documentation"
  },
  {
    "plugin_namespace": "remotion",
    "skill_name": "remotion-interactivity",
    "purpose": "Structure Remotion markup for interactivity"
  },
  {
    "plugin_namespace": "remotion",
    "skill_name": "remotion-maps",
    "purpose": "Remotion Map animation knowledge"
  },
  {
    "plugin_namespace": "remotion",
    "skill_name": "remotion-markup",
    "purpose": "Content, animation and effects best practices"
  },
  {
    "plugin_namespace": "remotion",
    "skill_name": "remotion-multimedia",
    "purpose": "Interacting with Mediabunny"
  },
  {
    "plugin_namespace": "remotion",
    "skill_name": "remotion-render",
    "purpose": "Export a Remotion video"
  },
  {
    "plugin_namespace": "remotion",
    "skill_name": "remotion-saas",
    "purpose": "Build an app with Remotion"
  },
  {
    "plugin_namespace": "remotion",
    "skill_name": "remotion-studio",
    "purpose": "Preview a Remotion video"
  },
  {
    "plugin_namespace": "remotion",
    "skill_name": "remotion-upgrade",
    "purpose": "Upgrade Remotion, and related packages"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "agents-orchestrator",
    "purpose": "Use when the user needs Autonomous pipeline manager that orchestrates the entire development workflow. You are the leader of this process.. Riqor specialist paired with the agents-orchestra…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "design-brand-guardian",
    "purpose": "Use when the user needs Expert brand strategist and guardian specializing in brand identity development, consistency maintenance, and strategic brand positioning. Riqor specialist paired wi…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "design-image-prompt-engineer",
    "purpose": "Use when the user needs Expert photography prompt engineer specializing in crafting detailed, evocative prompts for AI image generation. Masters the art of translating visual concepts into…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "design-inclusive-visuals-specialist",
    "purpose": "Use when the user needs Representation expert who defeats systemic AI biases to generate culturally accurate, affirming, and non-stereotypical images and video.. Riqor specialist paired wit…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "design-persona-walkthrough",
    "purpose": "Use when the user needs Simulate cognitive walkthroughs of web pages from a defined persona's psychological perspective — captures emotional reactions and rational thought at each scroll po…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "design-ui-designer",
    "purpose": "Use when the user needs Expert UI designer specializing in visual design systems, component libraries, and pixel-perfect interface creation. Creates beautiful, consistent, accessible user i…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "design-ui-finish-gate-reviewer",
    "purpose": "Use when the user needs Product-interface reviewer who catches generic, interchangeable UI before it ships by grounding critique in real product evidence, a written design contract, and a h…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "design-ux-architect",
    "purpose": "Use when the user needs Technical architecture and UX specialist who provides developers with solid foundations, CSS systems, and clear implementation guidance. Riqor specialist paired with…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "design-ux-researcher",
    "purpose": "Use when the user needs Expert user experience researcher specializing in user behavior analysis, usability testing, and data-driven design insights. Provides actionable research findings t…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "design-visual-storyteller",
    "purpose": "Use when the user needs Expert visual communication specialist focused on creating compelling visual narratives, multimedia content, and brand storytelling through design. Specializes in tr…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "design-whimsy-injector",
    "purpose": "Use when the user needs Expert creative specialist focused on adding personality, delight, and playful elements to brand experiences. Creates memorable, joyful interactions that differentia…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "docs-researcher",
    "purpose": "Use when the user needs Documentation specialist that verifies APIs, framework behavior, and release notes.. Riqor specialist paired with the docs-researcher native agent."
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-ai-data-remediation-engineer",
    "purpose": "Use when the user needs \"Specialist in self-healing data pipelines — uses air-gapped local SLMs and semantic clustering to automatically detect, classify, and fix data anomalies at scale. F…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-ai-engineer",
    "purpose": "Use when the user needs Expert AI/ML engineer specializing in machine learning model development, deployment, and integration into production systems. Focused on building intelligent featur…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-api-platform-engineer",
    "purpose": "Use when the user needs Expert API platform engineer for public and partner APIs — contract-first design (OpenAPI/gRPC), versioning and deprecation policy, SDK generation, API gateway conce…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-autonomous-optimization-architect",
    "purpose": "Use when the user needs Intelligent system governor that continuously shadow-tests APIs for performance while enforcing strict financial and security guardrails against runaway costs.. Riqo…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-backend-architect",
    "purpose": "Use when the user needs Senior backend architect specializing in scalable system design, database architecture, API development, and cloud infrastructure. Builds robust, secure, performant…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-cms-developer",
    "purpose": "Use when the user needs Drupal and WordPress specialist for theme development, custom plugins/modules, content architecture, and code-first CMS implementation. Riqor specialist paired with…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-code-reviewer",
    "purpose": "Use when the user needs Expert code reviewer who provides constructive, actionable feedback focused on correctness, maintainability, security, and performance — not style preferences.. Riqo…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-codebase-onboarding-engineer",
    "purpose": "Use when the user needs Expert developer onboarding specialist who helps new engineers understand unfamiliar codebases fast by reading source code, tracing code paths, and stating only fact…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-data-engineer",
    "purpose": "Use when the user needs Expert data engineer specializing in building reliable data pipelines, lakehouse architectures, and scalable data infrastructure. Masters ETL/ELT, Apache Spark, dbt,…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-data-visualization-engineer",
    "purpose": "Use when the user needs Expert data visualization engineer — chart-type selection by data and question, perceptually honest encodings, colorblind-safe data palettes, accessible and interact…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-database-optimizer",
    "purpose": "Use when the user needs Expert database specialist focusing on schema design, query optimization, indexing strategies, and performance tuning for PostgreSQL, MySQL, and modern databases lik…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-database-reliability-engineer",
    "purpose": "Use when the user needs Expert database reliability engineer (DBRE) — high availability and replication, automated failover, backup and point-in-time recovery, zero-downtime online schema m…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-desktop-app-engineer",
    "purpose": "Use when the user needs Expert desktop application engineer for Electron and Tauri — secure IPC and process isolation, code signing and notarization, auto-update pipelines, native OS integr…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-devops-automator",
    "purpose": "Use when the user needs Expert DevOps engineer specializing in infrastructure automation, CI/CD pipeline development, and cloud operations. Riqor specialist paired with the engineering-devo…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-drupal-performance",
    "purpose": "Use when the user needs Expert Drupal 10/11 performance engineer specializing in Core Web Vitals, render and dynamic page caching, BigPipe, cache tags and contexts, database query and Views…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-drupal-shopping-cart",
    "purpose": "Use when the user needs Expert Drupal e-commerce engineer specializing in Drupal Commerce for product catalog management, payment gateway integration, checkout workflow design, order manage…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-email-intelligence-engineer",
    "purpose": "Use when the user needs Expert in extracting structured, reasoning-ready data from raw email threads for AI agents and automation systems. Riqor specialist paired with the engineering-email…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-embedded-firmware-engineer",
    "purpose": "Use when the user needs Specialist in bare-metal and RTOS firmware - ESP32/ESP-IDF, PlatformIO, Arduino, ARM Cortex-M, STM32 HAL/LL, Nordic nRF5/nRF Connect SDK, FreeRTOS, Zephyr. Riqor spe…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-feishu-integration-developer",
    "purpose": "Use when the user needs Full-stack integration expert specializing in the Feishu (Lark) Open Platform — proficient in Feishu bots, mini programs, approval workflows, Bitable (multidimension…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-filament-optimization-specialist",
    "purpose": "Use when the user needs Expert in restructuring and optimizing Filament PHP admin interfaces for maximum usability and efficiency. Focuses on impactful structural changes — not just cosmeti…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-finops-engineer",
    "purpose": "Use when the user needs Expert cloud cost engineer for AWS/GCP/Azure — cost allocation and tagging, rightsizing, commitment planning (reserved instances/savings plans), egress and storage o…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-frontend-developer",
    "purpose": "Use when the user needs Expert frontend developer specializing in modern web technologies, React/Vue/Angular frameworks, UI implementation, and performance optimization. Riqor specialist pa…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-gaussdb-expert",
    "purpose": "Use when the user needs Expert database specialist focusing on GaussDB OLTP — Huawei's self-developed enterprise-grade relational database (NOT GaussDB(DWS) OLAP, NOT GaussDB(for openGauss)…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-git-workflow-master",
    "purpose": "Use when the user needs Expert in Git workflows, branching strategies, and version control best practices including conventional commits, rebasing, worktrees, and CI-friendly branch managem…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-i18n-engineer",
    "purpose": "Use when the user needs Expert i18n engineer for ICU MessageFormat, CLDR plural rules, RTL and bidirectional layouts, locale-aware date/number/currency formatting, string extraction pipelin…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-identity-access-engineer",
    "purpose": "Use when the user needs Expert identity engineer for OAuth 2.0/OIDC flows, enterprise SSO (SAML/OIDC) and SCIM provisioning, passkeys/WebAuthn, session architecture, and multi-tenant author…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-incident-response-commander",
    "purpose": "Use when the user needs Expert incident commander specializing in production incident management, structured response coordination, post-mortem facilitation, SLO/SLI tracking, and on-call p…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-iot-fleet-engineer",
    "purpose": "Use when the user needs Expert IoT and edge fleet engineer — device provisioning and identity, MQTT/telemetry pipelines, staged over-the-air (OTA) firmware updates with rollback, edge compu…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-it-service-manager",
    "purpose": "Use when the user needs Expert IT service management specialist using ITIL 4 framework for service catalog design, incident and problem management, change control, SLA governance, CMDB main…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-llm-post-training-engineer",
    "purpose": "Use when the user needs Evidence-driven owner for SFT, preference optimization, RLHF/RLVR, MoE post-training, and the release gates that turn a checkpoint into a defensible model change.. R…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-minimal-change-engineer",
    "purpose": "Use when the user needs Engineering specialist focused on minimum-viable diffs — fixes only what was asked, refuses scope creep, prefers three similar lines over a premature abstraction. Th…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-mobile-app-builder",
    "purpose": "Use when the user needs Specialized mobile application developer with expertise in native iOS/Android development and cross-platform frameworks. Riqor specialist paired with the engineering…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-mobile-release-engineer",
    "purpose": "Use when the user needs Expert mobile release and distribution engineer for iOS and Android — code signing, provisioning, fastlane pipelines, App Store Connect and Play Console submission,…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-multi-agent-systems-architect",
    "purpose": "Use when the user needs Systems architect specializing in the design, coordination, and governance of multi-agent AI pipelines — covering topology selection, context management, inter-agent…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-network-engineer",
    "purpose": "Use when the user needs Expert network engineer for Cisco IOS/IOS-XE, Cisco ASA/FTD, Juniper Junos, and Palo Alto PAN-OS routing, switching, firewalling, and troubleshooting.. Riqor special…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-orgscript-engineer",
    "purpose": "Use when the user needs Expert in designing, parsing, and implementing OrgScript grammar, AST validation, and business logic definitions.. Riqor specialist paired with the engineering-orgsc…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-payments-billing-engineer",
    "purpose": "Use when the user needs Expert payments engineer for PSP integrations (Stripe, Adyen, Braintree, PayPal), idempotent payment flows, webhook processing, subscription billing, SCA/3DS, PCI sc…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-privacy-engineer",
    "purpose": "Use when the user needs Expert privacy engineer who implements privacy in code — PII discovery and classification, data minimization, consent enforcement at the API layer, automated DSAR an…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-prompt-engineer",
    "purpose": "Use when the user needs Specialist in crafting, testing, and systematically optimizing prompts for LLMs — turning vague instructions into reliable, production-grade AI behaviors.. Riqor spe…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-rag-pipeline-engineer",
    "purpose": "Use when the user needs Production RAG specialist focused on chunking strategy, retrieval quality, hybrid search, re-ranking, and eval-driven iteration. Builds pipelines that actually retri…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-rapid-prototyper",
    "purpose": "Use when the user needs Specialized in ultra-fast proof-of-concept development and MVP creation using efficient tools and frameworks. Riqor specialist paired with the engineering-rapid-prot…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-realtime-collaboration-engineer",
    "purpose": "Use when the user needs Expert realtime systems engineer for WebSocket/SSE infrastructure, presence, CRDT and OT-based collaborative editing, offline-first sync engines, and fan-out scaling…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-rust-refactoring-specialist",
    "purpose": "Use when the user needs Expert Rust engineer for repository-scale refactoring, safe renames, module restructuring, duplication removal, panic hardening, ownership improvements, and compiler…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-search-relevance-engineer",
    "purpose": "Use when the user needs Expert search engineer for Elasticsearch and OpenSearch — index and analyzer design, BM25 query tuning, hybrid lexical+vector retrieval, and judgment-based relevance…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-section-508-specialist",
    "purpose": "Use when the user needs Expert U.S. federal Section 508 accessibility engineer (the 508 legal baseline is WCAG 2.0 Level AA; WCAG 2.1/2.2 AA are recommended best practice, and ADA Title II…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-senior-developer",
    "purpose": "Use when the user needs Premium implementation specialist - Masters Laravel/Livewire/FluxUI, advanced CSS, Three.js integration. Riqor specialist paired with the engineering-senior-develope…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-software-architect",
    "purpose": "Use when the user needs Expert software architect specializing in system design, domain-driven design, architectural patterns, and technical decision-making for scalable, maintainable syste…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-solidity-smart-contract-engineer",
    "purpose": "Use when the user needs Expert Solidity developer specializing in EVM smart contract architecture, gas optimization, upgradeable proxy patterns, DeFi protocol development, and security-firs…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-sre",
    "purpose": "Use when the user needs Expert site reliability engineer specializing in SLOs, error budgets, observability, chaos engineering, and toil reduction for production systems at scale.. Riqor sp…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-technical-writer",
    "purpose": "Use when the user needs Expert technical writer specializing in developer documentation, API references, README files, and tutorials. Transforms complex engineering concepts into clear, acc…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-uswds-developer",
    "purpose": "Use when the user needs Expert U.S. Web Design System frontend developer specializing in USWDS components and design tokens, accessible-by-default patterns, responsive government UI, Sass s…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-video-streaming-engineer",
    "purpose": "Use when the user needs Expert video streaming engineer for adaptive bitrate delivery — HLS/DASH packaging, ffmpeg transcode ladders, CMAF low-latency, DRM, CDN delivery, and QoE-driven pla…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-voice-ai-integration-engineer",
    "purpose": "Use when the user needs Expert in building end-to-end speech transcription pipelines using Whisper-style models and cloud ASR services — from raw audio ingestion through preprocessing, tran…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-webassembly-engineer",
    "purpose": "Use when the user needs Expert WebAssembly engineer — compiling Rust/C++/Go to Wasm, JS interop and the boundary marshalling cost, WASI and server-side runtimes (Wasmtime/Wasmer), the compo…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-wechat-mini-program-developer",
    "purpose": "Use when the user needs Expert WeChat Mini Program developer specializing in 小程序 development with WXML/WXSS/WXS, WeChat API integration, payment systems, subscription messaging, and the ful…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-wordpress-performance",
    "purpose": "Use when the user needs Expert WordPress performance engineer specializing in Core Web Vitals, object caching (Redis/Memcached), page caching, database and WP_Query optimization, the Transi…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "engineering-wordpress-shopping-cart",
    "purpose": "Use when the user needs Expert WordPress e-commerce engineer specializing in WooCommerce for product catalog management, payment gateway integration, checkout customization, order managemen…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "evidence-engineering",
    "purpose": "Use for non-trivial coding, debugging, migration, review, or end-to-end implementation where Codex must inspect the real flow, make a bounded change, and provide fresh verification evidence before completion"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "explorer",
    "purpose": "Use when the user needs Read-only codebase explorer for gathering evidence before changes are proposed.. Riqor specialist paired with the explorer native agent."
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "harness-paths",
    "purpose": "Use when Codex Self Improvement routes work through a curated evidence path for architecture, controlled learning, independent review, privacy, security, performance, or browser-level validation"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "product-sprint-prioritizer",
    "purpose": "Use when the user needs Expert product manager specializing in agile sprint planning, feature prioritization, and resource allocation. Focused on maximizing team velocity and business value…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "project-management-experiment-tracker",
    "purpose": "Use when the user needs Expert project manager specializing in experiment design, execution tracking, and data-driven decision making. Focused on managing A/B tests, feature experiments, an…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "project-management-project-shepherd",
    "purpose": "Use when the user needs Expert project manager specializing in cross-functional project coordination, timeline management, and stakeholder alignment. Focused on shepherding projects from co…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "project-manager-senior",
    "purpose": "Use when the user needs Converts specs to tasks and remembers previous projects. Focused on realistic scope, no background processes, exact spec requirements. Riqor specialist paired with t…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "reviewer",
    "purpose": "Use when the user needs PR reviewer focused on correctness, security, and missing tests.. Riqor specialist paired with the reviewer native agent."
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "riqor-core",
    "purpose": "Use when ChatGPT or Codex needs to choose among Riqor specialist Skills, operate the local Riqor runtime safely, or select the correct evidence workflow for a task."
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "riqor-diagnostics",
    "purpose": "Use when an AI coding agent needs to diagnose Riqor installation, package integrity, shell integration, plugin state, or managed-session failures."
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "riqor-evidence",
    "purpose": "Use when an AI coding agent needs a repository-scoped Riqor run, ordered evidence trace, verification gate, or defensible completion claim."
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "riqor-managed-codex",
    "purpose": "Use when an AI coding agent needs to launch or reason about a Codex session managed by Riqor, including the optional session activator and watchdog."
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "riqor-release",
    "purpose": "Use when an AI coding agent prepares, verifies, publishes, or audits an npm and GitHub release of Riqor."
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "riqor-security",
    "purpose": "Use when an AI coding agent changes Riqor filesystem, process, shell, plugin, state, credential, or release-integrity boundaries."
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "riqor-setup",
    "purpose": "Use when Codex needs to install, upgrade, verify, or repair the local Riqor npm runtime required by the Riqor plugin."
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "security-ai-generated-code-auditor",
    "purpose": "Use when the user needs Security reviewer for AI-generated and vibe-coded apps — hunts the hardcoded secrets, broken row-level security, and prompt-injection sinks that coding assistants sh…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "security-appsec-engineer",
    "purpose": "Use when the user needs AppSec specialist who secures the software development lifecycle through threat modeling, secure code review, SAST/DAST integration, and developer security education…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "security-architect",
    "purpose": "Use when the user needs Expert security architect specializing in threat modeling, secure-by-design architecture, trust-boundary analysis, defense-in-depth, and risk-based security reviews…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "security-blockchain-security-auditor",
    "purpose": "Use when the user needs Expert smart contract security auditor specializing in vulnerability detection, formal verification, exploit analysis, and comprehensive audit report writing for DeF…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "security-cloud-security-architect",
    "purpose": "Use when the user needs Cloud-native security specialist designing zero trust architectures, implementing defense-in-depth across AWS, Azure, and GCP, and securing infrastructure-as-code pi…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "security-compliance-auditor",
    "purpose": "Use when the user needs Expert technical compliance auditor specializing in SOC 2, ISO 27001, HIPAA, and PCI-DSS audits — from readiness assessment through evidence collection to certificat…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "security-incident-responder",
    "purpose": "Use when the user needs Digital forensics and incident response specialist who leads breach investigations, contains active threats, coordinates crisis response, and writes post-mortems tha…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "security-secrets-credential-engineer",
    "purpose": "Use when the user needs Owns the full lifecycle of secrets and credentials — detection, prevention, vaulting, rotation, and leak response — so an application runs on short-lived, least-priv…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "security-senior-secops",
    "purpose": "Use when the user needs Defensive application security specialist who scans every code submission for secrets and sensitive data exposure before anything else, then implements or audits sec…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "security-threat-detection-engineer",
    "purpose": "Use when the user needs Expert detection engineer specializing in SIEM rule development, MITRE ATT&CK coverage mapping, threat hunting, alert tuning, and detection-as-code pipelines for sec…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "security-threat-intelligence-analyst",
    "purpose": "Use when the user needs Cyber threat intelligence specialist who tracks adversary groups, maps attack campaigns to MITRE ATT&CK, produces actionable intelligence reports, and builds detecti…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "self-improvement-loop",
    "purpose": "Use when improving Codex workflows, prompts, hooks, skills, plugins, or agent controls and the change must be measured against a baseline, unseen holdouts, regression checks, and rollback criteria"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "support-executive-summary-generator",
    "purpose": "Use when the user needs Consultant-grade AI specialist trained to think and communicate like a senior strategy consultant. Transforms complex business inputs into concise, actionable execut…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "support-finance-tracker",
    "purpose": "Use when the user needs Expert financial analyst and controller specializing in financial planning, budget management, and business performance analysis. Maintains financial health, optimiz…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "support-infrastructure-maintainer",
    "purpose": "Use when the user needs Expert infrastructure specialist focused on system reliability, performance optimization, and technical operations management. Maintains robust, scalable infrastruct…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "support-legal-compliance-checker",
    "purpose": "Use when the user needs Expert legal and compliance specialist ensuring business operations, data handling, and content creation comply with relevant laws, regulations, and industry standar…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "support-support-responder",
    "purpose": "Use when the user needs Expert customer support specialist delivering exceptional customer service, issue resolution, and user experience optimization. Specializes in multi-channel support,…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "testing-accessibility-auditor",
    "purpose": "Use when the user needs Expert accessibility specialist who audits interfaces against WCAG standards, tests with assistive technologies, and ensures inclusive design. Defaults to finding ba…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "testing-api-tester",
    "purpose": "Use when the user needs Expert API testing specialist focused on comprehensive API validation, performance testing, and quality assurance across all systems and third-party integrations. Ri…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "testing-evidence-collector",
    "purpose": "Use when the user needs Screenshot-obsessed, fantasy-allergic QA specialist - Default to finding 3-5 issues, requires visual proof for everything. Riqor specialist paired with the testing-e…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "testing-performance-benchmarker",
    "purpose": "Use when the user needs Expert performance testing and optimization specialist focused on measuring, analyzing, and improving system performance across all applications and infrastructure.…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "testing-reality-checker",
    "purpose": "Use when the user needs Stops fantasy approvals, evidence-based certification - Default to \"NEEDS WORK\", requires overwhelming proof for production readiness. Riqor specialist paired with t…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "testing-test-automation-engineer",
    "purpose": "Use when the user needs Expert end-to-end test automation engineer for Playwright and Cypress — resilient selectors, flake elimination, isolated test data, CI parallelization, and trace-dri…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "testing-test-results-analyzer",
    "purpose": "Use when the user needs Expert test analysis specialist focused on comprehensive test result evaluation, quality metrics analysis, and actionable insight generation from testing activities.…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "testing-tool-evaluator",
    "purpose": "Use when the user needs Expert technology assessment specialist focused on evaluating, testing, and recommending tools, software, and platforms for business use and productivity optimizatio…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "testing-workflow-optimizer",
    "purpose": "Use when the user needs Expert process improvement specialist focused on analyzing, optimizing, and automating workflows across all business functions for maximum productivity and efficienc…"
  },
  {
    "plugin_namespace": "riqor",
    "skill_name": "universal-session-runtime",
    "purpose": "Use the local Codex Self Improvement runtime consistently across Codex App, Codex CLI, Kaku, and ChatGPT-controlled terminal sessions"
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "barcode-capture-android",
    "purpose": "Scandit Barcode Capture (`BarcodeCapture`) in native Android (Kotlin/Java) projects — the low-level, full-control single-barcode scanning mode (BarcodeCapture + DataCaptureView + overlay), without the pre-built SparkScan UI. Use for integration, symbology and scan settings, result handling, overlay customization, SDK version migration (v6→v7→v8), replacing third-party scanners (ZXing, ML Kit), or troubleshooting."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "barcode-capture-capacitor",
    "purpose": "Capacitor — Scandit Barcode Capture (`BarcodeCapture`) in Capacitor (Ionic) hybrid apps via the Scandit Capacitor plugins (`ScanditCaptureCorePlugin`), the low-level, full-control single-barcode scanning mode (BarcodeCapture + DataCaptureView + BarcodeCaptureOverlay) without the pre-built SparkScan UI, not the browser-only web SDK. Use for integration, symbology settings, result handling, viewfinder and feedback customization, SDK version migration, or troubleshooting."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "barcode-capture-cordova",
    "purpose": "Cordova — Scandit Barcode Capture (`BarcodeCapture`) in Apache Cordova hybrid apps via the `scandit-cordova-datacapture-*` plugins (global `window.Scandit`), the low-level, full-control single-barcode scanning mode (BarcodeCapture + DataCaptureView + BarcodeCaptureOverlay) without the pre-built SparkScan UI, not the browser-only web SDK. Use for integration, scan settings, result handling, overlay wiring, SDK version migration, or troubleshooting."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "barcode-capture-flutter",
    "purpose": "Scandit Barcode Capture (`BarcodeCapture`) in Flutter (Dart) projects — the low-level, full-control single-barcode scanning mode (BarcodeCapture + DataCaptureView + BarcodeCaptureOverlay), without the pre-built SparkScan UI. Use for integration, scan settings, result handling, overlay customization, SDK version migration, or troubleshooting."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "barcode-capture-ios",
    "purpose": "Scandit Barcode Capture (`BarcodeCapture`) in native iOS (Swift) projects — the low-level, full-control single-barcode scanning mode (BarcodeCapture + DataCaptureView + overlay), without the pre-built SparkScan UI. Use for integration, scan settings, result handling, overlay customization, SDK version migration (v6→v7→v8), replacing a third-party barcode scanner, or troubleshooting."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "barcode-capture-net-android",
    "purpose": "Scandit BarcodeCapture in .NET for Android projects (`net*-android` target framework, `Scandit.DataCapture.Barcode` NuGet, non-MAUI — for MAUI apps use barcode-capture-net-maui) — the low-level, full-control barcode scanning mode without the pre-built SparkScan UI. Use for integration, scan settings, listener and event wiring, overlay customization, camera lifecycle, SDK version migration (v6→v7→v8), replacing ZXing.Net or ML Kit bindings, or troubleshooting."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "barcode-capture-net-ios",
    "purpose": "Scandit BarcodeCapture in .NET for iOS projects (`net*-ios` target framework, `Scandit.DataCapture.Barcode` NuGet, non-MAUI — for MAUI apps use barcode-capture-net-maui) — the low-level, full-control barcode scanning mode without the pre-built SparkScan UI. Use for integration, scan settings, listener and event wiring, overlay customization, camera lifecycle, SDK version migration (v6→v7→v8), replacing ZXing.Net.Mobile or AVFoundation scanners, or troubleshooting."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "barcode-capture-net-maui",
    "purpose": "Scandit BarcodeCapture in .NET MAUI projects (`<UseMaui>true</UseMaui>`, `Scandit.DataCapture.Barcode.Maui` NuGet) — the low-level, full-control barcode scanning mode with your own `<scandit:DataCaptureView>` XAML control and overlay in a MAUI page, without the pre-built SparkScan UI (for that use sparkscan-net-maui); for non-MAUI .NET use barcode-capture-net-android or barcode-capture-net-ios. Use for integration, scan settings, result handling, lifecycle wiring, SDK version migration (v6→v7→v8), replacing ZXing.N"
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "barcode-capture-rn",
    "purpose": "Scandit Barcode Capture (`BarcodeCapture`) in React Native projects — the low-level, full-control single-barcode scanning mode (BarcodeCapture + DataCaptureView + BarcodeCaptureOverlay), without the pre-built SparkScan UI. Use for integration, symbology configuration, result handling, viewfinder and feedback customization, SDK version migration, or troubleshooting."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "barcode-capture-web",
    "purpose": "Scandit Barcode Capture (`BarcodeCapture`) in web/browser (TypeScript/JavaScript) projects — the low-level, full-control single-barcode scanning mode (BarcodeCapture + DataCaptureView + overlay), without the pre-built SparkScan UI; not the Cordova or Capacitor hybrid plugins. Use for integration, scan settings, result handling, overlay and viewfinder customization, Scandit Web SDK version migration (v6→v7→v8), or troubleshooting."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "data-capture-sdk",
    "purpose": "Use when a user mentions Scandit, data capture SDK, barcode scanning products, smart data capture, choosing a scanning product, comparing scanning features, supported barcode symbologies, system requirements, device compatibility, or Scandit pricing. Helps choose the right Scandit product (SparkScan, Barcode Capture, MatrixScan, Smart Label Capture, ID Capture, etc.), points to the correct documentation and sample apps for their platform, and hands off to implementation skills."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "id-bolt",
    "purpose": "Scandit ID Bolt in web projects (`@scandit/web-id-bolt`) — the hosted, drop-in identity-document scanning pop-up (passports, driver's licenses, ID cards) with built-in handover to the user's phone, for adding ID scanning to a website with minimal code and no camera UI to build. Use for integration (IdBoltSession), document selection, validators, returned-data and anonymization options, theming and workflow customization, or troubleshooting. A different product from ID Capture — for in-page fully-customizable scanni"
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "id-capture-android",
    "purpose": "Scandit ID Capture (`IdCapture`) in native Android (Kotlin or Java) projects — scanning passports, driver's licenses, ID cards, residence permits, health-insurance cards, visas via MRZ, VIZ, PDF417 barcode, or mobile documents. Use for integration, accepted-document and scanner configuration, CapturedId result handling, rejection rules, AAMVA verification, anonymization, overlay UI, camera lifecycle, and Scandit Android SDK version migration."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "id-capture-capacitor",
    "purpose": "Scandit ID Capture (`IdCapture`) in Capacitor projects — scanning passports, driver's licenses, ID cards, residence permits, visas via MRZ, VIZ, barcode, or mobile documents. Use for integration, accepted-document and scanner configuration, captured-field result handling, anonymization, add-on capabilities (voided-ID detection, European driving-license back decoding, AAMVA barcode verification), and SDK version migration."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "id-capture-cordova",
    "purpose": "Scandit ID Capture (`IdCapture`) in Cordova / PhoneGap projects (`scandit-cordova-datacapture-id`) — scanning passports, driver's licenses, ID cards, residence permits, visas via MRZ, VIZ, barcode, or mobile documents. Use for integration, accepted-document and scanner configuration, captured-field result handling, anonymization, add-on capabilities (voided-ID detection, European driving-license back decoding, AAMVA barcode verification), and SDK version migration."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "id-capture-flutter",
    "purpose": "Scandit ID Capture (`IdCapture`) in Flutter projects — scanning passports, driver's licenses, ID cards, residence permits, visas via MRZ, VIZ, barcode, or mobile documents. Use for integration, accepted-document and scanner configuration, captured-field result handling, anonymization, add-on capabilities (voided-ID detection, European driving-license back decoding, AAMVA barcode verification), and SDK version migration."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "id-capture-ios",
    "purpose": "Scandit ID Capture (`IdCapture`) in native iOS Swift projects (UIKit or SwiftUI) — scanning passports, driver's licenses, ID cards, residence permits, health-insurance cards, visas via MRZ, VIZ, PDF417 barcode, or mobile documents on iOS. Use for integration, accepted-document and scanner configuration, CapturedId result handling, rejection rules, AAMVA verification, anonymization, overlay UI, camera lifecycle, and Scandit iOS SDK version migration in Swift, UIKit, or SwiftUI iOS apps."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "id-capture-net-android",
    "purpose": "Scandit ID Capture (`IdCapture`) in .NET for Android projects (`net*-android` target framework, `Scandit.DataCapture.IdCapture` NuGet, C#) — scanning passports, driver's licenses, ID cards, residence permits, visas via MRZ, VIZ, PDF417 barcode, or mobile documents. Use for integration, accepted-document and scanner configuration, CapturedId result handling, rejection rules, AAMVA verification, anonymization, overlay UI, and Scandit .NET SDK version migration — for MAUI apps (`<UseMaui>true</UseMaui>`) use id-captur"
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "id-capture-net-ios",
    "purpose": "Scandit ID Capture (`IdCapture`) in .NET for iOS projects (`net*-ios` target framework, `Scandit.DataCapture.IdCapture` NuGet, C#) — scanning passports, driver's licenses, ID cards, residence permits, visas via MRZ, VIZ, PDF417 barcode, or mobile documents. Use for integration, accepted-document and scanner configuration, CapturedId result handling, rejection rules, AAMVA verification, anonymization, overlay UI, and Scandit .NET SDK version migration — for MAUI apps (`<UseMaui>true</UseMaui>`) use id-capture-net-ma"
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "id-capture-net-maui",
    "purpose": "Scandit ID Capture (`IdCapture`) in .NET MAUI projects (`<UseMaui>true</UseMaui>`, `Scandit.DataCapture.IdCapture` NuGet) — scanning passports, driver's licenses, ID cards, residence permits, visas via MRZ, VIZ, PDF417 barcode, or mobile documents. Use for integration, accepted-document and scanner configuration, CapturedId result handling, rejection rules, AAMVA verification, MAUI view hosting and lifecycle, and SDK version migration — for non-MAUI .NET projects use `id-capture-net-android` (`net*-android`) or `id"
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "id-capture-rn",
    "purpose": "Scandit ID Capture (`IdCapture`) in React Native projects — scanning passports, driver's licenses, ID cards, residence permits, visas via MRZ, VIZ, barcode, or mobile documents. Use for integration, accepted-document and scanner configuration, captured-field result handling, anonymization, add-on capabilities (voided-ID detection, European driving-license back decoding, AAMVA barcode verification), and SDK version migration."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "id-capture-web",
    "purpose": "Scandit ID Capture in web/browser projects (`@scandit/web-datacapture-id`) — scanning passports, driver's licenses, ID cards, residence permits, visas via MRZ, VIZ, PDF417 barcode, or mobile documents. Use for integration, accepted-document and scanner configuration, CapturedId result handling, rejection rules, AAMVA verification, overlay UI, and SDK version migration in TypeScript/JavaScript web apps."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "label-capture-android",
    "purpose": "Smart Label Capture (Scandit `LabelCapture`) in native Android projects — extracting multiple fields (price, expiry date, serial or lot number, weight) from a label in one scan, using barcode fields plus text fields with regex patterns and pre-built definitions like price capture. Use for integration, label-definition configuration, captured-session handling, overlay customization (brushes, floating badges), the Validation Flow, and SDK version migration."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "label-capture-capacitor",
    "purpose": "Smart Label Capture (Scandit `LabelCapture`) in Capacitor projects — extracting multiple fields (price, expiry date, serial or lot number, weight) from a label in one scan, using barcode fields plus text fields with regex patterns. Use for integration, label-definition configuration, captured-label handling, the Validation Flow, and SDK version migration."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "label-capture-cordova",
    "purpose": "Smart Label Capture (Scandit `LabelCapture`) in Cordova / PhoneGap projects — extracting multiple fields (price, expiry date, serial or lot number, weight) from a label in one scan, using barcode fields plus text fields with regex patterns. Use for integration, label-definition configuration, captured-label handling, the Validation Flow, and SDK version migration."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "label-capture-flutter",
    "purpose": "Smart Label Capture (Scandit `LabelCapture`) in Flutter projects — extracting multiple fields (price, expiry date, serial or lot number, weight) from a label in one scan, using barcode fields plus text fields with regex patterns. Use for integration, label-definition configuration, captured-label handling, the Validation Flow, and SDK version migration."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "label-capture-ios",
    "purpose": "Smart Label Capture (Scandit `LabelCapture`) in native iOS projects — extracting multiple fields (price, expiry date, serial or lot number, weight) from a label in one scan, using barcode fields plus text fields with regex patterns. Use for integration, label-definition configuration, captured-session handling, overlay UI, the Validation Flow, and SDK version migration."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "label-capture-net-android",
    "purpose": "Smart Label Capture (Scandit `LabelCapture`) in .NET for Android projects (`net*-android` target framework, `Scandit.DataCapture.Label` NuGet, C#) — extracting multiple fields (price, expiry date, serial or lot number, weight) from a label in one scan via barcode and text fields. Use for integration, label definitions (including prebuilt VIN, price label, 7-segment), captured-session handling, overlays, the Validation Flow, and Scandit .NET SDK version migration — for MAUI apps (`<UseMaui>true</UseMaui>`) use label"
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "label-capture-net-ios",
    "purpose": "Smart Label Capture (Scandit `LabelCapture`) in .NET for iOS projects (`net*-ios` target framework, `Scandit.DataCapture.Label` NuGet, C#) — extracting multiple fields (price, expiry date, serial or lot number, weight) from a label in one scan via barcode and text fields. Use for integration, label definitions (including prebuilt VIN, price label, 7-segment), captured-session handling, overlays, the Validation Flow, and Scandit .NET SDK version migration — for MAUI apps (`<UseMaui>true</UseMaui>`) use label-capture"
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "label-capture-net-maui",
    "purpose": "Smart Label Capture (Scandit `LabelCapture`) in .NET MAUI projects (`<UseMaui>true</UseMaui>`, `Scandit.DataCapture.Label` NuGet) — extracting multiple fields (price, expiry date, serial or lot number, weight) from a label in one scan via barcode and text fields. Use for integration, label definitions (prebuilt VIN, price label, 7-segment), captured-session handling, MAUI view hosting and lifecycle, the Validation Flow, and SDK version migration — for non-MAUI .NET projects use `label-capture-net-android` or `label"
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "label-capture-rn",
    "purpose": "Smart Label Capture (Scandit `LabelCapture`) in React Native projects — extracting multiple fields (price, expiry date, serial or lot number, weight) from a label in one scan, using barcode fields plus text fields with regex patterns. Use for integration, label-definition configuration, captured-label handling, the Validation Flow, and SDK version migration."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "label-capture-web",
    "purpose": "Smart Label Capture (Scandit `LabelCapture`) in web/browser (TypeScript/JavaScript) projects — extracting multiple fields (price, expiry date, serial or lot number, weight) from a label in one scan, using barcode fields plus text fields with regex patterns. Use for integration, label-definition configuration, captured-session handling, overlay UI, the Validation Flow, and SDK version migration."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "matrixscan-ar-android",
    "purpose": "MatrixScan AR (Barcode AR, BarcodeAr) — scanning multiple barcodes at once with AR highlights and annotations over tracked barcodes in Android (Kotlin/Java) projects. Use for integration, scan settings, tracked-barcode handling, highlight and annotation providers, SDK version migration, or troubleshooting."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "matrixscan-ar-annotation-ios",
    "purpose": "MatrixScan AR annotations in native iOS Swift projects (UIKit/SwiftUI — Swift only, not C#/.NET) — info annotations, popovers, status icons, and responsive annotations attached to tracked barcodes. Use for adding annotations, customizing their appearance and content, controlling when they appear, or handling annotation taps — pipeline setup belongs to matrixscan-ar-ios; C#/.NET apps use matrixscan-ar-net-ios or matrixscan-ar-net-maui."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "matrixscan-ar-capacitor",
    "purpose": "Capacitor MatrixScan AR (Barcode AR, BarcodeAr) — scanning multiple barcodes at once with AR highlights and annotations, BarcodeArView attached to a DOM element, in Capacitor iOS/Android apps (not the plain-web sibling). Use for integration, symbology configuration, highlight and annotation providers, session handling, migration from BarcodeBatch/BarcodeTracking, or troubleshooting."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "matrixscan-ar-cordova",
    "purpose": "Cordova MatrixScan AR (Barcode AR, BarcodeAr) via the scandit-cordova-datacapture-* plugins — scanning multiple barcodes at once with AR highlights and annotations (info annotations, popovers, status icons) on tracked barcodes. Use for integration, symbology configuration, highlight and annotation providers, BarcodeArView customization, migration from BarcodeBatch/BarcodeTracking, or troubleshooting."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "matrixscan-ar-flutter",
    "purpose": "MatrixScan AR (Barcode AR, BarcodeAr) in Flutter projects (scandit_flutter_datacapture_barcode_ar) — scanning multiple barcodes at once with AR highlights and annotations over tracked barcodes. Use for integration, scan settings, highlight and annotation providers, migration from BarcodeBatch/BarcodeTracking, or troubleshooting."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "matrixscan-ar-highlight-ios",
    "purpose": "MatrixScan AR highlights in iOS projects (Swift, UIKit/SwiftUI) — the shapes drawn over tracked barcodes. Use for adding highlights, customizing or modifying existing ones, or handling highlight tap interaction — pipeline setup belongs to matrixscan-ar-ios."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "matrixscan-ar-ios",
    "purpose": "MatrixScan AR scanning pipeline in iOS projects (Swift, UIKit/SwiftUI) — BarcodeAr mode and settings, BarcodeArView, listener, feedback, camera and controls, plus migration from MatrixScan Batch (BarcodeBatch/BarcodeTracking). Use for integration, configuration, or troubleshooting — highlight and annotation work routes to the sibling skills matrixscan-ar-highlight-ios and matrixscan-ar-annotation-ios."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "matrixscan-ar-net-android",
    "purpose": "MatrixScan AR (Barcode AR, BarcodeAr) in .NET for Android projects (`net*-android` TFM, `Scandit.DataCapture.Barcode` NuGet, non-MAUI — MAUI apps use matrixscan-ar-net-maui) — scanning multiple barcodes at once with AR highlights and annotations. Use for integration, settings, listeners/events, highlight and annotation providers, lifecycle, SDK version migration, or troubleshooting."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "matrixscan-ar-net-ios",
    "purpose": "MatrixScan AR (Barcode AR, BarcodeAr) in .NET for iOS projects (`net*-ios` TFM, `Scandit.DataCapture.Barcode` NuGet, non-MAUI — MAUI apps use matrixscan-ar-net-maui) — scanning multiple barcodes at once with AR highlights and annotations (info annotations, popovers, status icons) in C#. Use for integration, settings, listeners/events, highlight and annotation providers, torch/zoom/macro controls, lifecycle, SDK version migration, or troubleshooting."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "matrixscan-ar-net-maui",
    "purpose": "MatrixScan AR (Barcode AR, BarcodeAr) in .NET MAUI projects (`Scandit.DataCapture.Barcode.Maui` NuGet, XAML BarcodeArView) — scanning multiple barcodes at once with AR highlights and annotations. For non-MAUI .NET projects use matrixscan-ar-net-android or matrixscan-ar-net-ios. Use for integration, settings, listeners/events, highlight and annotation providers, lifecycle, SDK version migration, or troubleshooting."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "matrixscan-ar-rn",
    "purpose": "MatrixScan AR (Barcode AR, BarcodeAr) in React Native projects — scanning multiple barcodes at once with AR overlays, highlights, and annotations on tracked barcodes. Use for integration, symbology configuration, highlight and annotation providers, session handling, feedback, migration from BarcodeBatch, or troubleshooting."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "matrixscan-ar-web",
    "purpose": "MatrixScan AR (Barcode AR, BarcodeAr) in web/browser (TypeScript/JavaScript) projects (@scandit/web-datacapture-barcode) — scanning multiple barcodes at once with AR overlays, highlights, and annotations on tracked barcodes. Use for integration, symbology configuration, highlight and annotation providers, session handling, migration from BarcodeBatch, or troubleshooting."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "matrixscan-batch-android",
    "purpose": "MatrixScan Batch (MatrixScan, BarcodeBatch, legacy BarcodeTracking) — tracking and scanning multiple barcodes at once in Android (Kotlin/Java) projects. Use for integration, settings and symbologies, tracked-barcode handling, basic/advanced overlay customization, lifecycle, or troubleshooting."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "matrixscan-batch-capacitor",
    "purpose": "Capacitor MatrixScan Batch (scandit-capacitor-datacapture-barcode) — MatrixScan, BarcodeBatch, legacy BarcodeTracking — tracking and scanning multiple barcodes at once with basic/advanced AR overlays in Capacitor iOS/Android apps (not the plain-web sibling). Use for integration, settings and symbologies, per-barcode brushes, TrackedBarcodeView annotations, lifecycle, SDK version migration, or troubleshooting."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "matrixscan-batch-cordova",
    "purpose": "Cordova MatrixScan Batch (scandit-cordova-datacapture-* plugins) — MatrixScan, BarcodeBatch, legacy BarcodeTracking — tracking and scanning multiple barcodes at once with basic/advanced AR overlays. Use for integration, settings and symbologies, per-barcode brushes, TrackedBarcodeView annotations, lifecycle, SDK version migration, or troubleshooting."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "matrixscan-batch-flutter",
    "purpose": "MatrixScan Batch (MatrixScan, BarcodeBatch, legacy BarcodeTracking) in Flutter projects (scandit_flutter_datacapture_barcode_batch) — tracking and scanning multiple barcodes at once. Use for integration, settings and symbologies, tracked-barcode handling, per-barcode brushes, advanced-overlay AR widgets, lifecycle, or troubleshooting."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "matrixscan-batch-ios",
    "purpose": "MatrixScan Batch (MatrixScan, BarcodeBatch, legacy BarcodeTracking) — tracking and scanning multiple barcodes at once in iOS (Swift, UIKit/SwiftUI) projects. Use for integration, settings and symbologies, tracked-barcode handling, basic/advanced overlay customization, lifecycle, or troubleshooting."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "matrixscan-batch-net-android",
    "purpose": "MatrixScan Batch (MatrixScan, BarcodeBatch, legacy BarcodeTracking) in .NET for Android projects (`net*-android` TFM, `Scandit.DataCapture.Barcode` NuGet, non-MAUI — MAUI apps use matrixscan-batch-net-maui) — tracking and scanning multiple barcodes at once. Use for integration, settings and symbologies, listeners/events, basic/advanced overlay customization, camera lifecycle, SDK version migration, or troubleshooting."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "matrixscan-batch-net-ios",
    "purpose": "MatrixScan Batch (MatrixScan, BarcodeBatch, legacy BarcodeTracking) in .NET for iOS projects (`net*-ios` TFM, `Scandit.DataCapture.Barcode` NuGet, non-MAUI — MAUI apps use matrixscan-batch-net-maui) — tracking and scanning multiple barcodes at once. Use for integration, settings and symbologies, listeners/events, basic/advanced overlay customization, camera lifecycle, SDK version migration, or troubleshooting."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "matrixscan-batch-net-maui",
    "purpose": "MatrixScan Batch (MatrixScan, BarcodeBatch, legacy BarcodeTracking) in .NET MAUI projects (`Scandit.DataCapture.Barcode.Maui` NuGet, XAML DataCaptureView) — tracking and scanning multiple barcodes at once with basic/advanced overlays. For non-MAUI .NET projects use matrixscan-batch-net-android or matrixscan-batch-net-ios. Use for integration, settings, listeners/events, overlay customization, lifecycle, SDK version migration, or troubleshooting."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "matrixscan-batch-rn",
    "purpose": "MatrixScan Batch (MatrixScan, BarcodeBatch, legacy BarcodeTracking) in React Native projects — tracking and scanning multiple barcodes at once. Use for integration, settings and symbologies, tracked-barcode handling, per-barcode brushes, advanced-overlay AR annotations, tap handling, manual feedback, lifecycle, third-party scanner replacement, or troubleshooting."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "matrixscan-batch-web",
    "purpose": "MatrixScan Batch (MatrixScan, BarcodeBatch, legacy BarcodeTracking) in web/browser (TypeScript/JavaScript) projects (@scandit/web-datacapture-barcode) — tracking and scanning multiple barcodes at once. Use for integration, settings and symbologies, per-barcode brushes, HTML-element AR overlays, manual feedback, lifecycle, SDK version migration, or troubleshooting."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "matrixscan-count-android",
    "purpose": "MatrixScan Count (BarcodeCount) in native Android projects (Kotlin/Java, `com.scandit.datacapture:barcode`) — counting and receiving barcodes in bulk with the BarcodeCountView UI in an Activity or Fragment, scanning against an expected/receiving list, clustering, status mode, explicitly managed camera. Use for integration, settings and symbology configuration, result handling, UI customization, or troubleshooting counting workflows."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "matrixscan-count-capacitor",
    "purpose": "Capacitor MatrixScan Count (BarcodeCount) — plugin scandit-capacitor-datacapture-barcode. Multi-barcode counting and receiving workflows (scan-and-count, inventory count, capture list, status mode) with BarcodeCountView on a DOM element in Capacitor apps, iOS/Android native only. For React Native use matrixscan-count-rn. Use for integration, symbology configuration, result handling, view customization, or troubleshooting counting workflows."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "matrixscan-count-cordova",
    "purpose": "Cordova MatrixScan Count (BarcodeCount) — plugin scandit-cordova-datacapture-barcode. Counting and receiving workflows (scan-and-count, inventory count, scan against a capture list, status mode, tap-to-uncount) with BarcodeCountView in Cordova apps. For Capacitor use matrixscan-count-capacitor. Use for integration, symbology configuration, view customization, result handling, SDK version migration, or troubleshooting counting workflows."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "matrixscan-count-flutter",
    "purpose": "MatrixScan Count (BarcodeCount) in Flutter projects — scandit_flutter_datacapture_barcode_count package. Multi-barcode counting and receiving workflows (scan-and-count, counting against a target list, status providers) with the BarcodeCountView widget. Use for integration, scan settings, result handling, UI customization, SDK version migration, or troubleshooting counting workflows."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "matrixscan-count-ios",
    "purpose": "MatrixScan Count (BarcodeCount) in native iOS projects (Swift/Objective-C, ScanditBarcodeCapture) — counting and receiving barcodes in bulk with the BarcodeCountView UI in UIKit or SwiftUI, scanning against an expected/receiving list, spatial map, explicitly managed camera. Use for integration, settings and symbology configuration, result handling, UI customization, status mode, or troubleshooting counting workflows."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "matrixscan-count-net-android",
    "purpose": "MatrixScan Count (BarcodeCount) in .NET for Android projects (net*-android, Scandit.DataCapture.Barcode NuGet, non-MAUI) — counting/receiving barcodes in bulk with BarcodeCountView, capture/receiving lists, spatial map, explicitly managed camera. For MAUI apps use matrixscan-count-net-maui. Use for integration, settings configuration, result handling, UI customization, SDK version migration, or troubleshooting counting workflows."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "matrixscan-count-net-ios",
    "purpose": "MatrixScan Count (BarcodeCount) in .NET for iOS projects (net*-ios, Scandit.DataCapture.Barcode NuGet, non-MAUI) — counting/receiving barcodes in bulk with BarcodeCountView in a UIViewController, capture/receiving lists, spatial map, explicitly managed camera. For MAUI apps use matrixscan-count-net-maui. Use for integration, settings configuration, result handling, UI customization, SDK version migration, or troubleshooting counting workflows."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "matrixscan-count-net-maui",
    "purpose": "MatrixScan Count (BarcodeCount) in .NET MAUI projects (<UseMaui>true</UseMaui>, Scandit.DataCapture.Barcode.Maui NuGet) — counting/receiving workflows with the BarcodeCountView XAML control and capture/receiving lists. For non-MAUI .NET use matrixscan-count-net-android or matrixscan-count-net-ios. Use for integration, XAML and builder-chain setup, result handling, UI customization, SDK version migration, or troubleshooting counting workflows."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "matrixscan-count-rn",
    "purpose": "MatrixScan Count (BarcodeCount) in React Native projects — scandit-react-native-datacapture-barcode package. Multi-barcode counting workflows (scan-and-count, counting against an expected capture list, status overlays) with BarcodeCountView. For Capacitor use matrixscan-count-capacitor. Use for integration, settings and symbology configuration, result handling, UI customization, or troubleshooting counting workflows."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "matrixscan-pick-ios",
    "purpose": "MatrixScan Pick (BarcodePick) in native iOS projects (Swift, ScanditBarcodeCapture) — pick/put verification workflows where the app confirms each item picked, with BarcodePickView, product provider, highlight styles, and auto-pick or tap-to-pick behavior. Use for integration, settings configuration, highlight styling, feedback, finish-button handling, or troubleshooting pick workflows."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "sparkscan-android",
    "purpose": "SparkScan single-barcode scanning with the pre-built scanning UI in native Android (Kotlin/Java) projects. Use for integration, scan settings, result handling, UI customization, SDK version migration, replacing a third-party barcode scanning library, or troubleshooting."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "sparkscan-capacitor",
    "purpose": "Capacitor — SparkScan single-barcode scanning with the pre-built scanning UI in Capacitor (Ionic) hybrid mobile apps via the Scandit Capacitor plugins (`ScanditCaptureCorePlugin`), not the browser-only web SDK. Use for integration, scan settings, result handling, UI customization, SDK version migration, or troubleshooting."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "sparkscan-cordova",
    "purpose": "Cordova — SparkScan single-barcode scanning with the pre-built scanning UI in Apache Cordova hybrid apps via the `scandit-cordova-datacapture-*` plugins (global `window.Scandit`), not the browser-only web SDK. Use for integration, scan settings, result handling, UI customization, SDK version migration, or troubleshooting."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "sparkscan-flutter",
    "purpose": "SparkScan single-barcode scanning with the pre-built scanning UI (`SparkScanView` widget) in Flutter (Dart) projects. Use for integration, scan settings, result handling, UI customization, SDK version migration, or troubleshooting."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "sparkscan-ios",
    "purpose": "SparkScan single-barcode scanning with the pre-built scanning UI in native iOS (Swift) projects. Use for integration, scan settings, result handling, UI customization, SDK version migration, replacing a third-party barcode scanning library, or troubleshooting."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "sparkscan-net-android",
    "purpose": "SparkScan single-barcode scanning with the pre-built `SparkScanView` UI in .NET for Android projects (`net*-android` target framework, `Scandit.DataCapture.Barcode` NuGet, non-MAUI — for MAUI apps use sparkscan-net-maui). Use for integration, scan settings, result handling, feedback customization, lifecycle wiring, SDK version migration (v6→v7→v8), replacing third-party scanners (ZXing.Net), or troubleshooting."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "sparkscan-net-ios",
    "purpose": "SparkScan single-barcode scanning with the pre-built `SparkScanView` UI in .NET for iOS projects (`net*-ios` target framework, `Scandit.DataCapture.Barcode` NuGet, non-MAUI — for MAUI apps use sparkscan-net-maui). Use for integration, scan settings, result handling, feedback customization, scanning lifecycle, SDK version migration (v6→v7→v8), replacing third-party scanners (ZXing.Net.Mobile), or troubleshooting."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "sparkscan-net-maui",
    "purpose": "SparkScan single-barcode scanning with the pre-built `SparkScanView` UI in .NET MAUI projects (`<UseMaui>true</UseMaui>`, `Scandit.DataCapture.Barcode.Maui` NuGet) — for non-MAUI .NET projects use sparkscan-net-android or sparkscan-net-ios. Use for integration, scan settings, result handling, feedback and UI customization, SDK version migration (v6→v7→v8), replacing third-party MAUI scanners (ZXing.Net.Maui), or troubleshooting."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "sparkscan-rn",
    "purpose": "SparkScan single-barcode scanning with the pre-built scanning UI (`SparkScanView` component) in React Native projects. Use for integration, scan settings, result handling, UI customization, SDK version migration, or troubleshooting."
  },
  {
    "plugin_namespace": "scandit-sdk",
    "skill_name": "sparkscan-web",
    "purpose": "SparkScan single-barcode scanning with the pre-built scanning UI (floating trigger button, `<spark-scan-view>`) in web/browser projects (`@scandit/web-datacapture-barcode`), including React/Vite/Next.js apps. Use for integration, scan settings, result handling, trigger-button customization, React-specific issues (StrictMode, React 18 vs 19 binding), camera/HTTPS/COOP-COEP troubleshooting, or SDK version migration — not for SparkScan on native or hybrid platforms."
  },
  {
    "plugin_namespace": "selective-intelligence",
    "skill_name": "selective-intelligence",
    "purpose": "Use Selective Intelligence for corrections, failures, dissatisfaction, or exact trigger. Activate directly for any user correction, dissatisfaction, failure feedback, the exact words Selective Intelligence, or an unmistakable request for a named responsibility—even when unnamed and in any conversation domain. Use active conversation context to identify what failed and recover the real outcome. Named work includes one-prompt websites, sparse briefs, profiles, campaigns, documents, grounded research, product design/U"
  },
  {
    "plugin_namespace": "seomatic-seo-audit",
    "skill_name": "seomatic-seo-audit",
    "purpose": "Runs a full SEO audit of the user's own website from real data via the SEOmatic connector - Search Console performance, striking-distance keywords, traffic decay, indexation, backlinks, and AI-answer visibility - and produces a prioritized action plan the user can approve. Use whenever the user asks for an SEO audit, an SEO health check, a site review, \"how is my SEO doing\", \"why is my traffic dropping\", \"what should I fix first\", or where to focus SEO effort."
  },
  {
    "plugin_namespace": "shopify",
    "skill_name": "shopify-admin",
    "purpose": "Write or explain **Admin GraphQL** queries and mutations for apps and integrations that extend the Shopify admin. Use when the user wants to **understand, design, or generate** the operation itself—even before deciding how to run it. Do **not** choose `admin` first for **app or extension config validation** —use **`use-shopify-cli`**. Do **not** choose `admin` first to **execute** Admin GraphQL **now via Shopify CLI** or for CLI setup/troubleshooting on store workflows—use **`use-shopify-cli`** (store auth/execute,"
  },
  {
    "plugin_namespace": "shopify",
    "skill_name": "shopify-app-store-review",
    "purpose": "Run a pre-submission compliance check against your Shopify app's codebase. Reviews App Store requirements and surfaces likely issues before you submit for official review."
  },
  {
    "plugin_namespace": "shopify",
    "skill_name": "shopify-custom-data",
    "purpose": "MUST be used first when prompts mention Metafields or Metaobjects. Use Metafields and Metaobjects to model and store custom data for your app. Metafields extend built-in Shopify data types like products or customers, Metaobjects are custom data types that can be used to store bespoke data structures. Metafield and Metaobject definitions provide a schema and configuration for values to follow."
  },
  {
    "plugin_namespace": "shopify",
    "skill_name": "shopify-customer",
    "purpose": "The Customer Account API allows customers to access their own data including orders, payment methods, and addresses."
  },
  {
    "plugin_namespace": "shopify",
    "skill_name": "shopify-dev",
    "purpose": "Search Shopify developer documentation across all APIs. Use only when no API-specific skill applies."
  },
  {
    "plugin_namespace": "shopify",
    "skill_name": "shopify-functions",
    "purpose": "Shopify Functions allow developers to customize the backend logic that powers parts of Shopify. Available APIs: Discount, Cart and Checkout Validation, Cart Transform, Pickup Point Delivery Option Generator, Delivery Customization, Fulfillment Constraints, Local Pickup Delivery Option Generator, Order Routing Location Rule, Payment Customization"
  },
  {
    "plugin_namespace": "shopify",
    "skill_name": "shopify-hydrogen",
    "purpose": "Hydrogen storefront implementation cookbooks. Some of the available recipes are: B2B Commerce, Bundles, Combined Listings, Custom Cart Method, Dynamic Content with Metaobjects, Express Server, Google Tag Manager Integration, Infinite Scroll, Legacy Customer Account Flow, Markets, Partytown + Google Tag Manager, Subscriptions, Third-party API Queries and Caching. MANDATORY: Use this API for ANY Hydrogen storefront question - do NOT use Storefront GraphQL when 'Hydrogen' is mentioned."
  },
  {
    "plugin_namespace": "shopify",
    "skill_name": "shopify-liquid",
    "purpose": "Liquid is an open-source templating language created by Shopify. It is the backbone of Shopify themes and is used to load dynamic content on storefronts. Keywords: liquid, theme, shopify-theme, liquid-component, liquid-block, liquid-section, liquid-snippet, liquid-schemas, shopify-theme-schemas"
  },
  {
    "plugin_namespace": "shopify",
    "skill_name": "shopify-onboarding-dev",
    "purpose": "Get started building on Shopify. Use when a developer asks to build an app, build a theme, create a dev store, set up a partner account, scaffold a project, or get started developing for Shopify. NOT for merchants managing stores."
  },
  {
    "plugin_namespace": "shopify",
    "skill_name": "shopify-onboarding-merchant",
    "purpose": "Set up and connect a Shopify store from your AI assistant. Use when the user wants to: set up my Shopify store, connect my store, install Shopify plugin, get started with Shopify, manage my store, add products to my store, merchant onboarding, start selling online, Shopify setup help, create my first store, how do I set up an online store, import products, migrate from Square, migrate from WooCommerce, migrate from Etsy, migrate from Amazon, migrate from eBay, migrate from Wix, import from Google Merchant Center, m"
  },
  {
    "plugin_namespace": "shopify",
    "skill_name": "shopify-partner",
    "purpose": "The Partner API lets you programmatically access data about your Partner Dashboard, including your apps, themes, and affiliate referrals."
  },
  {
    "plugin_namespace": "shopify",
    "skill_name": "shopify-payments-apps",
    "purpose": "The Payments Apps API enables payment providers to integrate their payment solutions with Shopify's checkout."
  },
  {
    "plugin_namespace": "shopify",
    "skill_name": "shopify-polaris-admin-extensions",
    "purpose": "Add custom actions and blocks from your app at contextually relevant spots throughout the Shopify Admin. Admin UI Extensions also supports scaffolding new adminextensions using Shopify CLI commands."
  },
  {
    "plugin_namespace": "shopify",
    "skill_name": "shopify-polaris-app-home",
    "purpose": "Build your app's primary user interface embedded in the Shopify admin. If the prompt just mentions `Polaris` and you can't tell based off of the context what API they meant, assume they meant this API."
  },
  {
    "plugin_namespace": "shopify",
    "skill_name": "shopify-polaris-checkout-extensions",
    "purpose": "Build custom functionality that merchants can install at defined points in the checkout flow, including product information, shipping, payment, order summary, and Shop Pay. Checkout UI Extensions also supports scaffolding new checkout extensions using Shopify CLI commands."
  },
  {
    "plugin_namespace": "shopify",
    "skill_name": "shopify-polaris-customer-account-extensions",
    "purpose": "Build custom functionality that merchants can install at defined points on the Order index, Order status, and Profile pages in customer accounts. Customer Account UI Extensions also supports scaffolding new customer account extensions using Shopify CLI commands."
  },
  {
    "plugin_namespace": "shopify",
    "skill_name": "shopify-pos-ui",
    "purpose": "Build retail point-of-sale applications using Shopify's POS UI components. These components provide a consistent and familiar interface for POS applications. POS UI Extensions also supports scaffolding new POS extensions using Shopify CLI commands. Keywords: POS, Retail, smart grid"
  },
  {
    "plugin_namespace": "shopify",
    "skill_name": "shopify-shopifyql",
    "purpose": "Answer a merchant's **analytics and reporting** questions with **ShopifyQL** — Shopify's query language for aggregated store metrics that the Admin GraphQL API cannot compute. Choose this (not `admin`) whenever the ask is for **numbers, totals, trends, or breakdowns** rather than fetching or mutating individual records: including but not limited to total/gross/net sales and revenue, order counts, average order value, refunds, quantity sold, sessions, conversion rate, and traffic — sliced by product, channel, region"
  },
  {
    "plugin_namespace": "shopify",
    "skill_name": "shopify-storefront-graphql",
    "purpose": "Use for custom storefronts requiring direct GraphQL queries/mutations for data fetching and cart operations. Choose this when you need full control over data fetching and rendering your own UI. NOT for Web Components - if the prompt mentions HTML tags like <shopify-store>, <shopify-cart>, use storefront-web-components instead."
  },
  {
    "plugin_namespace": "shopify",
    "skill_name": "shopify-use-shopify-cli",
    "purpose": "Choose when the user needs **Shopify CLI** to run or fix something now: validate app or extension config on disk (`shopify.app.toml`, `shopify.app.<name>.toml`, `shopify.extension.toml`); run or troubleshoot store workflows (`shopify store auth`, `shopify store execute`); inventory or product changes by handle, SKU, or location name; or CLI setup, auth, upgrade issues. Emphasize **commands and operational steps**, not only authoring GraphQL. Skip for API-only understanding or codegen with no CLI execution. Examples"
  },
  {
    "plugin_namespace": "shopify",
    "skill_name": "ucp",
    "purpose": "Use when the user wants to use the UCP CLI to find, compare, buy, or track products from online merchants, or to set up and troubleshoot the local UCP profile required for merchant-scoped operations. Covers global catalog search (\"find me X under $Y\"), named-merchant transactions (\"buy this from Z.com\"), order tracking, `ucp profile init`, `ucp doctor`, carts, checkout, orders, and UCP setup/help. Falls back to merchant-hosted handoff when direct in-protocol checkout isn't available."
  },
  {
    "plugin_namespace": "shopify-app-builder",
    "skill_name": "admin-graphql",
    "purpose": "Build Shopify Admin GraphQL queries and mutations for products, orders, customers, inventory, and more. Covers cost-aware rate limiting, cursor pagination, bulk operations, global resource identifiers, and version-safe API usage."
  },
  {
    "plugin_namespace": "shopify-app-builder",
    "skill_name": "admin-rest",
    "purpose": "Use the legacy REST Admin API only when maintaining an existing integration. Covers common resources, the 40-request bucket with a 2-request-per-second standard restore rate, and migration to GraphQL. New public apps must use the GraphQL Admin API."
  },
  {
    "plugin_namespace": "shopify-app-builder",
    "skill_name": "app-accessibility",
    "purpose": "Use when auditing or building accessibility in a Shopify embedded app — WCAG 2.1 AA, keyboard navigation, focus management in Modal/SaveBar/ResourcePicker, screen reader support (NVDA/JAWS/VoiceOver), color contrast within Polaris tokens, ARIA usage, alt text, i18n + a11y, and Built for Shopify accessibility gates. Triggers: 'accessibility shopify app', 'a11y shopify', 'WCAG 2.1 AA', 'screen reader shopify', 'keyboard nav shopify app', 'focus management modal', 'polaris contrast', 'color contrast shopify', 'aria la"
  },
  {
    "plugin_namespace": "shopify-app-builder",
    "skill_name": "app-auth",
    "purpose": "Implement OAuth 2.0, Token Exchange, Managed Installation, App Proxy, and webhook verification for Shopify apps. Support online/offline tokens, session storage (Prisma, Redis, Memory), and multi-auth patterns. Covers admin API, public apps, custom apps, and customer account authentication. Triggers include: 'Shopify authentication', 'OAuth 2.0', 'Token Exchange', 'Managed Installation', 'App Proxy', 'Webhook signature', 'HMAC verification', 'Admin API auth', 'Customer Account API', 'Session storage', 'Online token'"
  },
  {
    "plugin_namespace": "shopify-app-builder",
    "skill_name": "app-billing",
    "purpose": "Implement recurring, usage-based, one-time, and hybrid Shopify app billing. Covers appSubscriptionCreate, appUsageRecordCreate, trials, capped amounts, replacement behavior, test mode, current revenue-share rules, and pricing tiers."
  },
  {
    "plugin_namespace": "shopify-app-builder",
    "skill_name": "app-bridge",
    "purpose": "When asked to build Shopify admin apps, use App Bridge 4.x web components, shopify global API, session tokens, JWT validation, and migrations from 3.x. Covers CDN setup, all 8 web components, resource picker API, React hooks, backend JWT validation, and 5 worked examples."
  },
  {
    "plugin_namespace": "shopify-app-builder",
    "skill_name": "app-listing-optimization",
    "purpose": "Optimize your Shopify App Store listing to maximize install velocity and conversion. Covers ranking factors, title/tagline formulas, description structure, screenshot strategy, A/B testing, and a 30-item pre-submission checklist. Triggers include: 'How do I optimize my Shopify app listing?', 'What's the App Store ranking algorithm?', 'How should I write my app title and description?', 'What makes a good app screenshot?', 'How do I increase app install velocity?', 'Will my app title get rejected?', 'How do I improve"
  },
  {
    "plugin_namespace": "shopify-app-builder",
    "skill_name": "app-naming",
    "purpose": "Use when naming a new Shopify app, evaluating an app name candidate, running a trademark check, optimizing the app name for App Store SEO, or brainstorming brand candidates. Triggers: 'name my shopify app', 'app naming', 'app store SEO', 'trademark check', 'brand my app', 'what should I call my shopify app', 'brand domain', 'shopify app name', 'rename my app', 'is this app name taken', 'trademark Shopify'."
  },
  {
    "plugin_namespace": "shopify-app-builder",
    "skill_name": "app-niche-finder",
    "purpose": "Find profitable, underserved Shopify app niches. Identifies gaps in the App Store by analyzing competitor density, merchant pain signals, and buildability constraints. Returns ranked ideas with TAM, competition score, and first-mover advantage assessment. Triggered on: 'shopify app idea', 'find niche', 'app store opportunity', 'underserved category', 'gap analysis', 'competitor with bad reviews', 'app idea validation', 'what shopify app should I build', 'shopify app niche', 'find a profitable app idea'"
  },
  {
    "plugin_namespace": "shopify-app-builder",
    "skill_name": "app-performance",
    "purpose": "Use when optimizing Shopify embedded app performance — LCP, INP, CLS, TTI, cold-start, App Bridge init, Polaris bundle slimming, large GraphQL costs, Remix defer/streaming/prefetch, image lazy-loading, server cache + CDN, Prisma connection pooling, webhook handler latency, and meeting Built for Shopify performance gates. Triggers: 'app slow', 'embedded app performance', 'LCP shopify app', 'INP shopify', 'app bundle too big', 'polaris bundle slim', 'remix defer', 'prefetch intent', 'shopify app lighthouse', 'shopify"
  },
  {
    "plugin_namespace": "shopify-app-builder",
    "skill_name": "app-pricing-strategy",
    "purpose": "Use when designing Shopify app pricing, choosing a pricing model (flat tiered / usage-based / freemium / hybrid), setting trial length (7/14/30 days), structuring 3-4 tier plans, sizing capped usage, raising prices on existing customers, or writing pricing copy for the App Store listing. Triggers: 'shopify app pricing', 'app pricing tiers', 'free trial length', 'usage based pricing', 'recurring vs one-time', 'capped pricing', 'pricing strategy', 'monetization', 'how should I price my shopify app', 'shopify app mone"
  },
  {
    "plugin_namespace": "shopify-app-builder",
    "skill_name": "app-validation",
    "purpose": "Validate a Shopify app idea before writing code. Runs a 7-question pre-build framework, facilitates 5-merchant interview protocol, guides landing page + waitlist test, and identifies kill criteria early. Outputs a prioritization matrix and yes/no decision. Triggered on: 'validate app idea', 'should I build this app', 'MVP scope', 'app validation framework', 'problem-solution fit', 'customer interview', 'is my shopify app idea good', 'validate my idea'"
  },
  {
    "plugin_namespace": "shopify-app-builder",
    "skill_name": "b2b-markets",
    "purpose": "Use when building Shopify B2B catalogs, multi-storefront B2B, company location pricing, wholesale checkout, Shopify Markets (multi-region), multi-currency pricing with @inContext, currency formatting, market-specific catalogs, payment terms (NET 30/60), or anything involving B2B Plus / Markets / international commerce features. Triggers: B2B, wholesale, company, locations, customer accounts B2B, Markets, @inContext, country code, currency code, market, catalog, price list, payment terms, NET 30, draft order B2B, va"
  },
  {
    "plugin_namespace": "shopify-app-builder",
    "skill_name": "built-for-shopify-standards",
    "purpose": "Prepare a Shopify app for Built for Shopify status. Covers current quality criteria, performance, accessibility, Shopify admin integration, compliance webhooks, observability, support, application readiness, and ongoing eligibility."
  },
  {
    "plugin_namespace": "shopify-app-builder",
    "skill_name": "dev-troubleshooting",
    "purpose": "Use when a Shopify dev workflow is failing — `shopify app dev` cryptic errors, Cloudflare tunnel not starting, App Bridge v3→v4 migration 'No AppBridge context provided', GraphQL 200 OK with throttle errors, webhook 401, double-subscribed webhooks, app proxy 404, REST 302 loops, Rust function wasm-validator errors, session token 24h expiry, X-Frame-Options blocking iframe, dev store billing fakeouts, app review SLA blown. Triggers: 'shopify app dev failing', 'tunnel won't start', 'no app bridge context', 'throttle "
  },
  {
    "plugin_namespace": "shopify-app-builder",
    "skill_name": "hydrogen-storefront",
    "purpose": "Use this skill for Hydrogen 2026 Storefront Framework. Triggers include: 'hydrogen storefront', 'hydrogen 2026', 'hydrogen remix', 'shopify hydrogen framework', 'hydrogen setup scaffold', 'hydrogen useCart hook', 'hydrogen createCartHandler', 'hydrogen Customer Account API', 'hydrogen caching strategies', 'hydrogen oxygen deployment', 'hydrogen cli commands', 'hydrogen storefront client', 'hydrogen product page', 'hydrogen collection page', 'hydrogen checkout', 'hydrogen admin api', 'hydrogen queueApi', 'hydrogen a"
  },
  {
    "plugin_namespace": "shopify-app-builder",
    "skill_name": "liquid-themes",
    "purpose": "Use this skill for Liquid Theme Development (Online Store 2.0). Triggers include: 'liquid theme development', 'shopify theme online store 2.0', 'liquid section schema', 'liquid blocks', 'liquid filters', 'liquid objects', 'json template shopify', 'theme preset', 'liquid include snippet', 'theme-check linting', 'liquid forloop iteration', 'liquid if conditions', 'liquid assign variable', 'shopify theme app extension', 'liquid capture variable', 'theme metafields', 'liquid date filter', 'liquid money filter', 'liquid"
  },
  {
    "plugin_namespace": "shopify-app-builder",
    "skill_name": "merchant-pain-prevention",
    "purpose": "Use when designing, building, reviewing, or shipping a Shopify app to avoid the patterns that get merchants angry (1-2 star reviews, uninstalls, churn). Covers theme injection / leftover code on uninstall, surprise billing, fake urgency, slow scripts, cancel friction, scope creep, bot-only support, broken on platform updates, locale/checkout breakage. Triggers: 'merchant complaint', 'avoid bad app review', 'shopify app uninstall hygiene', 'leftover code in theme', 'surprise charge', 'shopify app dark pattern', 'bil"
  },
  {
    "plugin_namespace": "shopify-app-builder",
    "skill_name": "metafields-metaobjects",
    "purpose": "Custom data fields and objects specification, namespace/key management, definition creation, querying, and Liquid theme access. Triggers include: 'metafield', 'metaobject', 'custom field', 'custom data', 'namespace key', 'metafield definition', 'metaobject type', 'product metafield', 'variant metafield', 'customer custom field', 'order metafield'."
  },
  {
    "plugin_namespace": "shopify-app-builder",
    "skill_name": "polaris-ui",
    "purpose": "Use this skill for Polaris 12.x UI Components. Triggers include: 'polaris components', 'react ui shopify', 'approvider initialization', 'polaris form', 'polaris button', 'polaris card', 'polaris table indexTable', 'polaris modal dialog', 'polaris select dropdown', 'polaris textfield input', 'polaris checkbox radio', 'polaris navigation', 'polaris layout blocklist inlinestack', 'polaris design tokens', 'polaris icons', 'polaris stack grid', 'polaris page frame resource list', 'polaris loading spinner', 'polaris toas"
  },
  {
    "plugin_namespace": "shopify-app-builder",
    "skill_name": "shopify-app-store-ads",
    "purpose": "Research, plan, launch, and optimize Shopify App Store ads for a Shopify app. Use when asked to advertise an app in the Shopify App Store, create an App Store Ads campaign, choose keywords or bids, estimate paid acquisition economics, diagnose ad performance, or turn Reddit/community research into a testable campaign. Require explicit approval of the daily and total spend before creating or enabling any paid campaign."
  },
  {
    "plugin_namespace": "shopify-app-builder",
    "skill_name": "shopify-cli",
    "purpose": "Use when scaffolding a new Shopify app, running Shopify CLI commands (shopify app dev/deploy/generate), configuring shopify.app.toml, generating app extensions (admin/checkout/theme/function), debugging tunnels or auth issues, or working with the official Remix/Node/PHP/Ruby app templates. Trigger on 'shopify app', 'shopify cli', 'shopify init', 'shopify dev', 'shopify deploy', 'generate extension', 'shopify.app.toml', 'remix template', 'tunnel', 'ngrok', 'cloudflare tunnel', 'ME APP_URL', 'SHOPIFY_API_KEY', or any"
  },
  {
    "plugin_namespace": "shopify-app-builder",
    "skill_name": "shopify-functions",
    "purpose": "Build WebAssembly functions for the Shopify checkout and order pipeline. Rust or JavaScript, 5ms execution window, 256KB binary limit. Targets cart transform, discount, validation, payment customization, delivery customization, order routing, fulfillment constraints, and localization. Triggers include: 'Shopify Function', 'WASM', 'Rust function', 'JavaScript function', 'function-runner', 'cart.transform.run', 'discount.run', 'cart.checkout-validation.run', 'cart.delivery-customization.run', 'cart.payment-customizat"
  },
  {
    "plugin_namespace": "shopify-app-builder",
    "skill_name": "shopify-mcp",
    "purpose": "Use this skill for shopify mcp. Triggers include: 'shopify mcp', 'shopify dev mcp', 'storefront mcp', 'merchant-facing mcp', 'well-known mcp', 'shopify mcp configuration', 'custom mcp shopify', 'agentic commerce', 'shopify agent', 'claude code shopify integration', 'mcp.json', 'shopify mcp setup'."
  },
  {
    "plugin_namespace": "shopify-app-builder",
    "skill_name": "storefront-api",
    "purpose": "Build customer-facing storefront applications with Shopify Storefront API. Access product catalogs, collections, checkout flows, cart management, and customer accounts using public/private tokens. Includes GraphQL queries, Market directives, Customer Account API, and TypeScript examples. Triggers include: 'storefront api', 'customer-facing shopify', 'shopping cart api', 'product catalog query', 'checkout flow', 'customer account api', 'market directive', 'storefront token'."
  },
  {
    "plugin_namespace": "shopify-app-builder",
    "skill_name": "top-app-ux-patterns",
    "purpose": "Use when designing or reviewing the UX of a Shopify app and you want to mirror what the top-grossing apps do (Klaviyo, Gorgias, Judge.me, Loox, Vitals, PageFly). Covers IA, first-30s flow, empty states, setup data collection, the aha moment, pricing presentation, listing page conventions, and the 20 reusable UX patterns common across top apps. Triggers: 'what do top shopify apps do', 'best in class shopify ui', 'klaviyo ux', 'gorgias ux', 'modern shopify app pattern', 'shopify app ia', 'app store screenshot pattern"
  },
  {
    "plugin_namespace": "shopify-app-builder",
    "skill_name": "using-shopify-app-builder",
    "purpose": "Use at the start of any Shopify app engineering, debugging, review, launch, listing, or growth task. Routes the request to the smallest relevant Shopify App Builder skills and enforces credential, verification, deployment, publication, and paid-spend boundaries. Triggers include: 'Shopify app', 'Shopify extension', 'Shopify API', 'App Bridge', 'Polaris', 'Built for Shopify', 'App Store listing', and 'Shopify app ads'."
  },
  {
    "plugin_namespace": "shopify-app-builder",
    "skill_name": "ux-empty-error-states",
    "purpose": "Use when designing empty states, loading states, error states, and partial-failure states in a Shopify embedded app. Covers Polaris EmptyState, SkeletonPage/SkeletonBodyText, Banner tones (critical/warning/info/success), Toast vs Banner vs Modal decision, optimistic UI in Remix, network-down handling, partial bulk-failure recipes, GraphQL '200 OK with errors' gotcha. Triggers: 'empty state', 'loading state', 'error state', 'polaris banner', 'skeleton', 'toast', 'optimistic ui', 'partial failure', 'network down', 'r"
  },
  {
    "plugin_namespace": "shopify-app-builder",
    "skill_name": "ux-modern-app-feel",
    "purpose": "Use when you want a Shopify embedded app to feel modern, fast, and opinionated like Linear, Notion, Vercel, or Cron — speed-first, keyboard-first, calm UI, opinionated defaults, no-config success path. Covers keyboard shortcuts inside App Bridge, command palette patterns, micro-interactions Polaris allows, density vs spacious tradeoffs, brand expression within Polaris tokens, and 15 concrete patterns to copy from modern SaaS into Polaris-compliant Shopify apps. Triggers: 'modern shopify app', 'fast app', 'linear-st"
  },
  {
    "plugin_namespace": "shopify-app-builder",
    "skill_name": "ux-onboarding",
    "purpose": "Use when designing the first-run/onboarding experience of a Shopify embedded app. Covers the first-30-second rule, required-vs-optional setup, checklist vs wizard vs deferred-config vs sample-data, time-to-value targets, the 'aha moment' pattern, personalization using shop's currency/language/niche, activation events to instrument, and 15 onboarding pattern recipes built on Polaris components. Triggers: 'shopify app onboarding', 'first run', 'first time experience', 'app activation', 'onboarding checklist', 'wizard"
  },
  {
    "plugin_namespace": "shopify-app-builder",
    "skill_name": "ux-polaris-antipatterns",
    "purpose": "Use when reviewing or writing Polaris UI for common design mistakes — using deprecated Stack instead of BlockStack/InlineStack, modal overuse, blocking validation, wrong tone (success/critical/warning/info), custom CSS overrides instead of tokens, off-brand colors, mis-sized cards, missing helpText, no FormLayout, mobile responsive failures, accessibility failures inside Polaris components, drifting between Polaris versions. Triggers: 'polaris mistake', 'polaris anti-pattern', 'polaris stack deprecated', 'polaris d"
  },
  {
    "plugin_namespace": "shopify-app-builder",
    "skill_name": "webhooks",
    "purpose": "Webhook delivery methods, verification, retry behavior, payload handling, and implementation patterns for Shopify events. Triggers include: 'set up webhook', 'verify webhook signature', 'webhook delivery', 'HMAC verification', 'webhook retry', 'event subscription', 'webhook payload', 'AWS EventBridge Shopify', 'Google Pub/Sub webhook', 'webhook manifest'."
  },
  {
    "plugin_namespace": "simulator-login",
    "skill_name": "simulator-login",
    "purpose": "Sign in to an app on an iOS Simulator or Android Emulator with user-supplied test credentials, handling device selection, field focus, virtual keyboards, paste restrictions, native or WebView forms, and authenticated-state verification. Use when a user asks to log in, prepare an authenticated simulator session, or capture signed-in screenshots; do not use to create accounts, recover passwords, or access credentials the user did not provide."
  },
  {
    "plugin_namespace": "spreadsheets-router",
    "skill_name": "spreadsheet",
    "purpose": "route explicitly selected spreadsheet artifact requests to the preinstalled capability. use only when the user explicitly selects @spreadsheet; never trigger from request content alone."
  },
  {
    "plugin_namespace": "stark-ai-developer",
    "skill_name": "animated-readme-logo",
    "purpose": "Audit, create, transform, or animate verified logo pipelines for GitHub READMEs. Use when a repository needs a new or reconstructed mark, motion specification, SVG animation master, executable animation recipe, static PNG, animated GIF, README-safe markup, reduced-motion fallback, or compatibility review. Do not use for unrelated app/site motion or generic image generation without a README branding target."
  },
  {
    "plugin_namespace": "stark-ai-developer",
    "skill_name": "architecture-compass",
    "purpose": "Set up repository-native ADR governance, audit architecture, or plan and execute ADR-guided refactors through intent-bound workflows. Use when work needs binding agent-facing ADRs, provider-to-local mapping, architecture PR review or drift, Next.js request patterns, source placement, backend/runtime/env/config boundaries, stack deviations, or bounded ADR-governed implementation. Do not use for tiny edits, generic framework education, or work with no architecture or governance consequence."
  },
  {
    "plugin_namespace": "stark-ai-developer",
    "skill_name": "codex-spec-interviewer",
    "purpose": "Interview, source-challenge, verify, save, and ADR-gate fuzzy coding requests into Codex-ready implementation specs. Use when a feature, bugfix, refactor, migration, repo-wide change, or architecture task needs user-verified requirements, source-backed decisions, durable architecture decisions, acceptance criteria, validation commands, rollout notes, saved spec/ADR files, and a Codex execution prompt. Do not use when already fully specified or when the user wants direct implementation now."
  },
  {
    "plugin_namespace": "stark-ai-developer",
    "skill_name": "drawio-diagrams",
    "purpose": "Create, draw, generate, edit, verify, and export draw.io/diagrams.net `.drawio` diagrams. Use when the user asks for editable diagrams, flowcharts, architecture, sequence, ER/UML/state, BPMN, SysML, ML/DL, swimlane, timeline, network, icon-rich technical diagrams, or PNG/SVG/PDF exports; do not use for charts/plots or artistic image generation."
  },
  {
    "plugin_namespace": "stripe",
    "skill_name": "connect-recommend",
    "purpose": "Use this skill when the user asks about Stripe Connect configuration, charge patterns, Dashboard access, or how to get started with Connect, is building a marketplace, platform, multi-vendor store, gig platform, or subscription platform, needs to pay out sellers, vendors, or providers, mentions split payments, revenue sharing, multi-party payments, or similar payment distribution concepts, provides a company URL or business description for a recommendation, builds SaaS that routes money between parties (for example"
  },
  {
    "plugin_namespace": "stripe",
    "skill_name": "stripe-apps",
    "purpose": "Use when building, modifying, or reviewing a Stripe App — or when the user describes something that implies one (e.g. \"add a panel to the customer page\", \"customize my Stripe Dashboard\", \"react to Stripe events from my app\", \"connect my service to Stripe without sharing API keys\"). Covers the full app development workflow (scaffold, preview, upload, versioning), UI extension architecture (sandboxed iframe, Stripe UI toolkit, viewports), extension types (UI extensions, backend-only, extension interfaces, embedded ap"
  },
  {
    "plugin_namespace": "stripe",
    "skill_name": "stripe-best-practices",
    "purpose": "Guides Stripe integration decisions across API selection (Checkout Sessions vs PaymentIntents), Connect platform setup (Accounts v2, controller properties), billing/subscriptions, tax and registrations (Stripe Tax, automatic_tax, product tax codes), Treasury financial accounts, integration options (Checkout, Payment Element), migrating from deprecated Stripe APIs, and security best practices (API key management, restricted keys, webhooks, OAuth). Use when building, modifying, or reviewing any Stripe integration, in"
  },
  {
    "plugin_namespace": "stripe",
    "skill_name": "stripe-directory",
    "purpose": "Use when the user wants to find businesses, software, service providers, or partners for a specific industry, workflow, pain point, capability, or job to be done. Also use when the agent needs to programmatically purchase or consume a service. Use Stripe Directory to build a short relevant shortlist, even if the user does not mention Stripe Directory explicitly."
  },
  {
    "plugin_namespace": "stripe",
    "skill_name": "stripe-docs",
    "purpose": "Use when the user or agent needs to read, search, or look up Stripe documentation or API reference. Prefer this over curl or WebFetch for any docs.stripe.com content."
  },
  {
    "plugin_namespace": "stripe",
    "skill_name": "stripe-projects",
    "purpose": "Use when the user wants to provision infrastructure or third-party services using Stripe Projects. Triggers: \"I need a database\", \"set up auth\", \"add caching\", \"give me a Postgres\", \"provision Redis\", \"I need hosting\", \"add a vector DB\", \"get me an API key for X\", \"get credentials for X\", \"sign up for a service\", \"set up monitoring\", \"show me the catalog\", \"what can I provision\", \"browse providers\", \"add an LLM provider\", \"configure model provider\", \"add email sending\", \"set up search\", \"add a message queue\", \"set "
  },
  {
    "plugin_namespace": "stripe",
    "skill_name": "upgrade-stripe",
    "purpose": "Guide for upgrading Stripe API versions and SDKs"
  },
  {
    "plugin_namespace": "swift-concurrency",
    "skill_name": "swift-concurrency",
    "purpose": "Diagnose Swift Concurrency issues, refactor callback-based code to async/await, and guide Swift 6 migration when working with tasks, actors, @MainActor, Sendable, data races, thread safety, or concurrency-related compiler and linter warnings."
  },
  {
    "plugin_namespace": "swiftui-expert",
    "skill_name": "swiftui-expert-skill",
    "purpose": "Use when writing, reviewing, or refactoring SwiftUI code for iOS or macOS, including state and `@Observable` data flow, view composition, performance, lists, environment, localization, animation, Liquid Glass, and API migration. Also use for `@State` initialization or synthesized-property diagnostics, `@ContentBuilder` ambiguity, `reorderable` drag/drop, custom `AsyncImage` `URLSession`, swipe actions outside List, item-bound `alert`/`confirmationDialog`, `ToolbarOverflowMenu`, `AnimatableValues`, Document APIs (`D"
  },
  {
    "plugin_namespace": "template-creator",
    "skill_name": "template-creator",
    "purpose": "Create or update an installable personal ChatGPT artifact-template skill from a reference document, presentation, spreadsheet, Google Docs, Slides, or Sheets link, ImageGen or Product Design image, email, Slack message, or Site project. Use when the user selects Template Creator, asks to create a reusable template, or explicitly asks to update one exact personal template. Do not use for one-off creation from an existing template."
  },
  {
    "plugin_namespace": "test-android-apps",
    "skill_name": "android-emulator-qa",
    "purpose": "Use when validating Android feature flows in an emulator with adb-driven launch, input, UI-tree inspection, screenshots, and logcat capture."
  },
  {
    "plugin_namespace": "test-android-apps",
    "skill_name": "android-performance",
    "purpose": "Gather and interpret Android performance evidence on an adb target using Simpleperf CPU profiles, Perfetto or Compose traces, gfxinfo frame data, dumpsys meminfo snapshots, Java heap dumps, and native allocation traces. Use when asked to profile an Android app flow, find CPU-heavy functions, diagnose jank, capture startup or frame timing evidence, compare before/after performance, explain what code is taking time, or gather memory/leak profiling artifacts."
  },
  {
    "plugin_namespace": "thoughtfulbits-skills",
    "skill_name": "board-deck-audit",
    "purpose": "Deep audit of B2B SaaS board decks before they go to the board. Builds a claim ledger, tests whether the pre-read stands alone and states a clear strategy spine, reconciles metrics and assumptions across slides, explains results with credible evidence, shows plan-vs-actual accountability, presents competition and risks honestly, makes cash and runway math explicit, and gives the board decision-ready asks. Use whenever a board deck, board update, board pre-read, annual plan or budget, financing deck, or special-topi"
  },
  {
    "plugin_namespace": "thoughtfulbits-skills",
    "skill_name": "board-feedback",
    "purpose": "Give the concise, candid reaction an experienced B2B SaaS director would have after reading a board pre-read. Answers one question — does this deck make sense: does the narrative hang together, do the numbers tell one coherent story, is it clear what management wants from the board, and does the deck build or erode trust in the team. The output is short: an overall reaction, the comments directors will make in the meeting, the questions management will get, and a makes-sense verdict. Use for a quick read, gut check"
  },
  {
    "plugin_namespace": "thoughtfulbits-skills",
    "skill_name": "post-editor",
    "purpose": "Edit and rewrite short- and medium-form social posts for cold-reader clarity, emotional resonance, and reach while preserving the author's facts, intent, and voice. Use when the user supplies a draft and asks to edit, tighten, improve, polish, rewrite, make it travel, make it more engaging, or adapt it for X, LinkedIn, or a social caption. Also use for a requested reader-first or viral-potential edit of an existing post. Do not use for very long-form articles, newsletters, email, press releases, content calendars, "
  },
  {
    "plugin_namespace": "thoughtfulbits-skills",
    "skill_name": "product-feature-feedback",
    "purpose": "Evaluate a single B2B SaaS product or feature with SPARK — Simple, Purposeful & Prioritized, Attractive & Attentive, Reliable, Known. Scores each dimension 1-5 with cited evidence, walks the primary flow, identifies cuts, designs one delight moment, and gives the three simplest improvements. Use for feature specs, PRDs, feature ideas, strategic app critiques, and requests like 'review this feature', 'SPARK review', 'is this worth building', or 'why does our app feel boring' — supplied as .pptx, .pdf, .docx, .md, pa"
  },
  {
    "plugin_namespace": "thoughtfulbits-skills",
    "skill_name": "product-plan-feedback",
    "purpose": "Evaluates a B2B SaaS product plan — product strategy doc, roadmap, launch plan, annual product plan, or GTM plan — against a key-milestone rubric: a strategy simple enough to repeat without you in the room that solves a problem customers already know they have; coverage of executors, beneficiaries, champions, ecosystem, and platform effects; a roadmap that makes value visible and shareable with a zero-barrier first experience and designed delight; weekly-improving product metrics; design-partner go/no-go hurdles; a"
  },
  {
    "plugin_namespace": "thoughtfulbits-skills",
    "skill_name": "test-ui-ux",
    "purpose": "Rigorously tests a specified product UI or UX with five isolated subagents, inventories every screen's important user actions, counts steps, clicks, and fields, recommends the simplest safe path including optional or AI-assisted inputs, then returns an evidence-linked 1-10 average, a critical-failure gate, prioritized fixes, and loop-ready JSON. Use for iterative UI/UX evaluation, release gates, design QA, flow and action-efficiency audits, regression comparisons, or requests such as 'test this UI', 'score this UX'"
  },
  {
    "plugin_namespace": "tokenx",
    "skill_name": "route-agents",
    "purpose": "Explain, inspect, or explicitly control TokenX cost-aware routing for native Codex agents."
  },
  {
    "plugin_namespace": "twg",
    "skill_name": "twg-setup",
    "purpose": "Install, upgrade, authenticate, or repair `twg` for Codex, including missing CLI or skills and doctor/auth follow-up. TWG gives Codex grounded work context across Jira, Confluence, Bitbucket, JSM, Assets, Slack, Google Drive, and more, so it can connect tickets, docs, code, people, and decisions; surface risks and dependencies; summarize progress; and keep work moving."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "conversation-intelligence",
    "purpose": "Twilio Conversation Intelligence development guide. Use when building real-time or post-call conversation analysis, language operator pipelines, sentiment analysis, agent assist, cross-channel analytics, or querying aggregated conversation insights (sentiment trends, escalation rates, dashboards)."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-account-setup",
    "purpose": "Create and configure a Twilio account from scratch. Covers free trial signup, trial limitations, getting credentials (Account SID and Auth Token), buying a phone number, verifying recipient numbers for trial use, SDK installation, first API call, subaccount management (creation, inheritance, credential isolation, limits), and enabling specific products (AI Assistants, Conversations, Verify, ConversationRelay, WhatsApp). Use this skill before any other Twilio skill if you do not yet have a Twilio account or need to "
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-agent-augmentation-architect",
    "purpose": "Planning skill for augmenting human agents with real-time AI intelligence. Qualifies the developer's use case across coaching, compliance, QA, and routing to recommend the right Conversation Intelligence + Conversation Memory + TaskRouter architecture. Handles both \"I want to add AI coaching to my call center\" and \"configure Conversation Intelligence operators for script adherence.\""
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-agent-connect",
    "purpose": "Use when building or integrating Twilio Agent Connect (TAC) to connect third-party LLM agent runtimes with Twilio Voice, Messaging, ConversationRelay, Conversation Memory, Conversation Orchestrator, or Enterprise Knowledge."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-ai-agent-architect",
    "purpose": "Planning skill for AI-powered conversational agents. Qualifies the developer's use case across outcome sophistication, entry point, and customer profile to recommend the right Twilio Conversations architecture and implementation skills. Handles both high-level requests (\"build me a voice AI assistant\") and specific ones (\"integrate ConversationRelay with my OpenAI backend\")."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-call-recordings",
    "purpose": "Record Twilio voice calls correctly. Covers the critical distinction between Record verb (voicemail) and Dial record (call recording), dual-channel for QA, mid-call pause for PCI, Conference recording, and the ConversationRelay workaround. Use this skill whenever you need to capture call audio for compliance, QA, or analytics."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-cli-reference",
    "purpose": "Twilio CLI reference for managing Twilio resources from the terminal. Covers installation, credential profiles, phone number provisioning, sending SMS and email, webhook configuration, local development with a tunneling service, debugging with watch and logs, serverless deployment, and plugin ecosystem. Use when the developer asks to \"just do it\", \"set this up\", \"run a command\", mentions \"CLI\", \"command line\", or \"terminal\", or when an AI agent can execute a task directly instead of writing application code."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-compliance-onboarding",
    "purpose": "Registrations required BEFORE Twilio traffic works. Covers messaging programs (A2P 10DLC, toll-free verification, WhatsApp WABA, RCS, short code, alphanumeric sender) and voice trust programs (STIR/SHAKEN, Voice Integrity, Branded Calling, CNAM). Each number/sender type has its own program — registration blocks traffic until complete."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-compliance-traffic",
    "purpose": "Rules you must follow for Twilio messaging and voice traffic. Covers TCPA (consent tiers, quiet hours, DNC), GDPR (EU consent, right to deletion), PCI DSS (payment recording, Pay verb), HIPAA (BAA, PHI), FDCPA (debt collection limits), CAN-SPAM, WhatsApp policies, SHAKEN/STIR, and consent management patterns. Use this skill proactively when developers have working traffic to ensure they follow the rules."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-conference-calls",
    "purpose": "Build multi-party calls using Twilio Conference. Covers warm transfer, cold transfer, coaching (whisper), hold vs mute, participant modes, and supervisor barge. Use this skill for any contact center, support line, or scenario requiring transfers, holds, or multi-party calls."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-content-template-builder",
    "purpose": "Create, manage, and send message templates using Twilio's Content API. Covers template creation for WhatsApp, SMS, RCS, and MMS; variable usage; WhatsApp Meta approval; and sending templates via ContentSid. Use this skill when building structured messages that require pre-approval or consistent formatting across channels."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-conversation-orchestrator",
    "purpose": "Configure automatic conversation capture and routing with Twilio Conversation Orchestrator. Covers Configuration creation, channel capture rules, grouping types, status timeouts, Memory Store linkage, Intelligence linkage, and conversation lifecycle. Use this skill to automatically capture SMS, voice, WhatsApp, RCS, and web chat traffic into unified conversations without manually creating conversations or participants."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-conversations-classic-api",
    "purpose": "Build multi-channel messaging experiences using Twilio Conversations (classic) API. Covers creating conversations, adding participants (SMS, WhatsApp, chat), sending messages, and handling webhooks. Use this skill to manage persistent multi-party or multi-channel conversations beyond single-message SMS/WhatsApp."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-customer-memory",
    "purpose": "Store and retrieve customer context using Twilio Conversation Memory. Covers Memory Store provisioning, profile management, traits, observations, conversation summaries, and semantic Recall. Use this skill to give AI agents or human agents persistent memory of customer interactions across sessions and channels."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-customer-support-architect",
    "purpose": "Planning skill for building customer service and support systems. Qualifies the developer's needs across the support ladder (self-service → AI agents → contact center), channel mix, and scale to recommend the right Twilio architecture. Handles both \"build me a call center\" and \"add an IVR to my existing support line.\""
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-debugging-observability",
    "purpose": "Debug Twilio integrations and set up production observability. Covers the Console Debugger, Monitor Alerts API, Event Streams for error log streaming, status callback tracking, common error codes, and a systematic debugging workflow. Use this skill whenever a Twilio integration produces errors, messages fail to deliver, calls drop unexpectedly, or you need to set up monitoring for a production deployment."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-email-deliverability-advisor",
    "purpose": "Deliverability advisor for the Twilio Email API specifically. Use ONLY when the developer explicitly mentions Twilio Email, comms.twilio.com, or a Twilio (non-SendGrid) email program. For all other deliverability questions — including generic ones — use twilio-sendgrid-deliverability-advisor."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-email-send",
    "purpose": "Use when the caller has Twilio credentials (Account SID + Auth Token or API Key SID + Secret) and needs to send email via comms.twilio.com/v1/Emails. This is Twilio-native email — NOT SendGrid. Do NOT use if the caller has a SendGrid API key (SG.-prefix) — use twilio-sendgrid-email-send instead. Covers single sends, batch sends up to 10,000 recipients, Liquid personalization, operation tracking, and error handling."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-enterprise-knowledge",
    "purpose": "Add knowledge retrieval to AI agents using Twilio's Enterprise Knowledge product. Enterprise Knowledge is a centralized, searchable repository of your organization's documents, websites, and content — FAQs, support policies, warranty terms, product catalogs. Current models don't have access to how you run your business today. Enterprise Knowledge gives agents a way to query this repository during a conversation and ground their responses in your actual approved source material. This skill covers provisioning a Know"
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-iam-auth-setup",
    "purpose": "Set up and manage Twilio authentication credentials: Auth Tokens, API keys (Standard, Main, Restricted), Access Tokens for client-side SDKs, and credential rotation. Use this skill as a prerequisite foundation before making any Twilio API calls."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-identity-verification-advisor",
    "purpose": "Planning skill for identity verification and fraud prevention. Qualifies the developer's needs across authentication method, channel selection, fraud risk level, and user experience to recommend the right Twilio Verify + Lookup architecture. Handles login, signup, password reset, and risk-adaptive verification."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-isv-sms-best-practices",
    "purpose": "Best practices for ISVs (Independent Software Vendors) building SMS features into multi-tenant SaaS platforms using Twilio. Covers customer onboarding for A2P and toll-free compliance, subaccount architecture, sender management, billing patterns, and common ISV pitfalls. Use this when building SMS capabilities that your customers will use to message their end users."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-lookup-phone-intelligence",
    "purpose": "Look up phone number intelligence via Twilio Lookup v2 API. Covers number validation, line type detection (mobile/landline/VoIP), SIM swap detection, caller name, identity match, and SMS pumping risk scoring. Use this skill to validate numbers or assess fraud risk before sending messages or calls."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-marketing-promotions-advisor",
    "purpose": "Planning skill for marketing and promotional messaging. Qualifies the developer's campaign needs across channel selection, compliance, audience segmentation, and delivery tracking to recommend the right Twilio messaging architecture. Handles both \"set up a promotional SMS campaign\" and \"build a multi-channel engagement pipeline with Segment integration.\""
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-messaging-channel-advisor",
    "purpose": "Planning skill that helps the developer pick the right Twilio messaging channel — SMS, MMS, RCS, or WhatsApp — for a given use case. Qualifies intent across content type, geography, use case (marketing / notifications / OTP / support), cost model, and brand presence. Use when the developer asks \"which channel should I use\", \"SMS vs RCS vs WhatsApp\", mentions a country or region, asks about branded messaging, rich content, or fallback — and proactively when the developer says \"send SMS\" but their use case (rich cont"
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-messaging-overview",
    "purpose": "Twilio Messaging channel overview and onboarding guide. Covers all channels (SMS, WhatsApp, RCS, Facebook Messenger), the unified Messages API, channel selection guidance, and the recommended setup sequence from first message to production monitoring. Start here before choosing a specific messaging channel."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-messaging-services",
    "purpose": "Create and configure Twilio Messaging Services for production messaging. Covers sender pools, geo-match, sticky sender, message scheduling, compliance toolkit, SMS pumping protection, link shortening, and intelligent alerts. Use this skill when setting up production-ready messaging infrastructure."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-messaging-webhooks",
    "purpose": "Receive and respond to inbound messages and track outbound delivery status via Twilio webhooks — across SMS, MMS, WhatsApp, and RCS. Covers webhook request parameters, replying with TwiML, validating webhook signatures for security, and handling status callbacks. Use this skill whenever an agent needs to handle incoming messages on any channel or track outbound message delivery in real time."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-notifications-alerts-advisor",
    "purpose": "Planning skill for transactional notifications, alerts, and reminders. Qualifies the developer's needs across urgency, channel selection, delivery confirmation, and fallback patterns to recommend the right Twilio notification architecture. Handles both \"send shipping updates to customers\" and \"build a multi-channel alert system with delivery confirmation and fallback.\""
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-numbers-senders",
    "purpose": "Choose the right Twilio number type and sender BEFORE building. Covers phone numbers (local, toll-free, short code, mobile), alphanumeric sender IDs, WhatsApp senders, RCS agents, international availability, and regulatory bundles. Each number type has its own compliance program — choosing wrong means rebuilding. Use this skill first."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-organizations-setup",
    "purpose": "Set up and manage Twilio Organizations for centralized account and user governance. Covers the Organization > Account > Subaccount hierarchy, roles (Owner/Admin/Standard), managed vs independent accounts, domain registration, SSO enforcement, SCIM provisioning, and Organization merging. Use this skill when managing multiple Twilio accounts or users across teams."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-rcs-messaging",
    "purpose": "Send RCS Business Messages via Twilio. Covers compliance onboarding (7-part US process), sender profile setup, sending rich cards and carousels, SMS fallback, device support (Android + iOS 18 caveats), and common errors. Use this skill when building RCS messaging or onboarding an RCS sender."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-regulatory-compliance-bundles",
    "purpose": "Manage regulatory compliance for international phone numbers. Covers what bundles are, which countries require them, how to create End-Users and Supporting Documents, evaluate and submit bundles, fix evaluation failures, update bundles when regulations change, and ISV multi-account patterns. Use this skill when provisioning numbers outside the US."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-reliability-patterns",
    "purpose": "Handle rate limits, retries, and failures when building on Twilio at scale. Covers 429 exponential backoff with jitter, per-number throughput limits, StatusCallback resilience, thin-receiver pattern, and fallback chains. Use this skill whenever sending messages or making calls at volume, or when building production-grade Twilio integrations."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-security-api-auth",
    "purpose": "Choose the right Twilio authentication method and implement it correctly. Covers Auth Token (testing only), API Keys (production standard), OAuth2 client_credentials (time-limited bearer tokens), Access Tokens (client-side SDKs), and test credentials. Use this skill before making any Twilio API calls in production."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-security-compliance-hipaa",
    "purpose": "Configure Twilio accounts for HIPAA compliance. Covers BAA requirements, HIPAA Project designation (self-service and support), eligible services list, per-product requirements (Voice, SMS, ConversationRelay, Conversation Intelligence, Flex, Verify), message redaction, and what is NOT eligible. Use this skill when developers are building healthcare workflows on Twilio."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-security-hardening",
    "purpose": "Secure Twilio applications against common attacks. Covers credential management (API keys vs auth tokens), request validation (webhook signature verification), PCI DSS compliance, HIPAA account requirements, SMS pumping prevention, geo-permissions, and account isolation patterns. Use this skill when developers are building or deploying Twilio apps."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-send-message",
    "purpose": "Send messages via Twilio's Programmable Messaging API across all channels — SMS, MMS, RCS, and WhatsApp. Covers text messages, media, rich content (cards, carousels, buttons), template-based sends, Messaging Services, status callbacks, and WhatsApp's 24-hour service window. Use when the user wants to send a message — whether they say \"send SMS\", \"text message\", \"branded message\", \"rich message\", \"WhatsApp message\", \"RCS message\", \"notification\", or \"alert\". For picking the right channel for a use case, first consul"
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-sendgrid-account-setup",
    "purpose": "Set up a SendGrid account for email delivery. Covers API key creation (SG.-prefix), domain authentication (DKIM/SPF via CNAME records), Single Sender Verification for testing, SDK installation, and the relationship between SendGrid and Twilio credentials. Use before any other SendGrid skill. This skill is for SendGrid only — not the Twilio Email API (comms.twilio.com)."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-sendgrid-deliverability-advisor",
    "purpose": "Diagnostic and advisory skill for email deliverability problems. Use when a developer asks why emails are going to spam, not reaching the inbox, getting blocked, bouncing, or how to improve sender reputation — with or without a specified platform. Covers SendGrid-specific tooling: SPF, DKIM, DMARC, BIMI, IP warmup, list hygiene, bounce/spam rate thresholds, and Engagement Quality Score (SEQ). Do NOT use for Twilio Email (comms.twilio.com / Account SID + Auth Token) — use twilio-email-deliverability-advisor instead."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-sendgrid-email-send",
    "purpose": "Send transactional and bulk email via the SendGrid v3 Mail Send API. Covers single sends, personalized batch sends with dynamic templates, scheduled sends with cancellation, attachments, and sandbox mode for testing. Use this skill when the caller has a SendGrid API key (SG.-prefix). Do NOT use this skill if the caller is using the Twilio Email API (comms.twilio.com) — that is a separate product with different credentials."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-sendgrid-email-settings",
    "purpose": "Configure SendGrid dynamic templates (Handlebars), tracking settings (opens, clicks, subscriptions), link branding for custom tracking domains, and content types (HTML, plain text, AMP). Use when customizing SendGrid email content, tracking behavior, or branded links. Requires a SendGrid API key (SG.-prefix) — not applicable to the Twilio Email API (comms.twilio.com)."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-sendgrid-engagement-quality",
    "purpose": "Monitor email program health with SendGrid Engagement Quality (SEQ) scores. Covers the SEQ API endpoints, the 5 scoring metrics (engagement recency, open rate, bounce classification, bounce rate, spam rate), eligibility requirements, and interpreting scores for deliverability improvement. Use when diagnosing SendGrid deliverability issues or monitoring sender reputation. Requires a SendGrid API key (SG.-prefix) — not applicable to the Twilio Email API (comms.twilio.com)."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-sendgrid-inbound-parse",
    "purpose": "Receive inbound email via SendGrid Inbound Parse webhook. Covers MX record setup, parsed vs raw mode, handling attachments, and common pitfalls. Use when building email-to-app workflows like support ticket creation or email processing pipelines. Requires a SendGrid API key (SG.-prefix) — not applicable to the Twilio Email API (comms.twilio.com)."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-sendgrid-suppressions",
    "purpose": "Manage SendGrid email suppressions: bounces, blocks, spam reports, invalid emails, global unsubscribes, and ASM suppression groups. Covers when and how to remove suppressions, reputation impact, and category-based unsubscribe management. Use when debugging SendGrid delivery issues or building unsubscribe flows. Requires a SendGrid API key (SG.-prefix) — not applicable to the Twilio Email API (comms.twilio.com)."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-sendgrid-webhooks",
    "purpose": "Track email delivery and engagement via SendGrid Event Webhooks. Covers all 11 event types (delivery + engagement), webhook handler implementation, ECDSA signature verification, batched event processing, and common debugging patterns. Use when building SendGrid delivery tracking, engagement analytics, or bounce handling. Requires a SendGrid API key (SG.-prefix) — not applicable to the Twilio Email API (comms.twilio.com)."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-sms-send-message",
    "purpose": "SMS and MMS deep-dive reference. Covers SMS-specific error codes, message filtering troubleshooting (\"Messages Being Filtered or Blocked?\" diagnostic checklist), MMS media support (US/CA/AU only), and SMS pumping indicators. For sending SMS, use twilio-send-message instead. Use this skill only when debugging SMS delivery issues or needing SMS-specific details not in the consolidated send skill."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-taskrouter-routing",
    "purpose": "Route tasks to agents using Twilio TaskRouter. Covers Workers, Task Queues, Workflows, Reservations, skills-based routing, and common gotchas (hyphen attributes, HAS operator, reservation cascade). Use this skill for any multi-agent contact center, support queue, or AI agent escalation routing."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-verify-send-otp",
    "purpose": "Send and verify one-time passcodes (OTPs) via Twilio Verify over SMS, RCS, voice, email, or WhatsApp. Covers creating a Verify Service, sending tokens, checking submitted codes, automatic WhatsApp-to-SMS fallback, and service configuration. TOTP is supported via the Factors API (a separate family from channel-based OTP). Use this skill to add phone or email verification or two-factor authentication to any application."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-voice-conversation-relay",
    "purpose": "Build AI-powered voice agents using Twilio ConversationRelay. Handles real-time speech recognition (ASR), text-to-speech (TTS), and bidirectional audio streaming via WebSocket. Covers TwiML setup, WebSocket message types, LLM integration, streaming responses, and voice provider configuration. Use this skill to build voice bots, IVR replacements, or real-time AI voice assistants on Twilio calls."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-voice-outbound-calls",
    "purpose": "Make outbound phone calls via Twilio's Programmable Voice REST API. Covers the full voice platform: calls.create(), answering machine detection (AMD), conference-based agent bridging, call recording, status tracking, and SIP Trunking. Use this skill for outbound calls, sales dialers, or when asking what voice APIs are available."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-voice-twiml",
    "purpose": "Build voice call logic using TwiML (Twilio Markup Language). Covers the core verbs (Say, Play, Gather, Dial, Record, Conference), generating TwiML with Python and Node.js SDKs, and a complete inbound call IVR example. Use this skill to define call behavior for inbound or outbound calls."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-webhook-architecture",
    "purpose": "Design, secure, and operate Twilio webhook endpoints. Covers inbound event handling, status callbacks, signature validation, connection overrides for retry and timeout tuning, local development tunneling, and production hardening. Use this skill whenever an agent needs to receive HTTP callbacks from Twilio for any product -- messaging, voice, verify, or event streams."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-whatsapp-manage-senders",
    "purpose": "Create, configure, and manage WhatsApp Business senders via Twilio's Channels Senders API. Covers programmatic sender registration, profile setup, webhook configuration, sender lifecycle statuses, and ISV flows. Use this skill to register and manage production WhatsApp senders at scale."
  },
  {
    "plugin_namespace": "twilio-developer-kit",
    "skill_name": "twilio-whatsapp-send-message",
    "purpose": "WhatsApp messaging deep-dive reference. Covers the 24-hour service window rules (free-form vs template mode), sandbox setup for testing, template approval workflow, production sender requirements, and WhatsApp-specific error handling. For sending WhatsApp messages, use twilio-send-message instead. Use this skill when setting up WhatsApp for the first time or debugging WhatsApp-specific delivery behavior."
  },
  {
    "plugin_namespace": "unity-workbench",
    "skill_name": "unity-bug-investigation",
    "purpose": "Investigate, reproduce, isolate, explain, and validate bugs in an existing Unity project. Use when the user reports exceptions, incorrect behavior, regressions, visual glitches, multiplayer desync, input problems, scene or prefab issues, build failures, performance regressions, save corruption, intermittent failures, or other Unity defects. Gather evidence before editing, distinguish symptoms from causes, test hypotheses one at a time, apply the smallest justified fix, and validate the root cause."
  },
  {
    "plugin_namespace": "unity-workbench",
    "skill_name": "unity-build-validation",
    "purpose": "Validate that a Unity project or completed change is ready to compile, test, build, and hand off. Use when the user asks to verify a feature, confirm build readiness, check compilation, run tests, validate scenes and prefabs, inspect Console output, confirm target-platform compatibility, prepare a release candidate, or determine whether Unity work is truly complete. Establish a baseline, run the strongest available validation, distinguish pre-existing failures from introduced regressions, and report exact evidence "
  },
  {
    "plugin_namespace": "unity-workbench",
    "skill_name": "unity-feature-implementation",
    "purpose": "Implement, extend, or integrate a feature in an existing Unity project while respecting its architecture, coding conventions, scene structure, packages, networking model, and validation workflow. Use when the user asks to add gameplay mechanics, UI behavior, systems, editor tools, integrations, ScriptableObjects, shaders, VFX, networking functionality, save systems, input behavior, XR interactions, audio, animation, AI, or other concrete Unity features."
  },
  {
    "plugin_namespace": "unity-workbench",
    "skill_name": "unity-mcp-workflow",
    "purpose": "Use when working on Unity projects with Codex, especially when selecting or connecting a Unity MCP provider, validating Unity Editor connectivity, debugging scenes/prefabs/scripts, or deciding what Unity workflows should be automated."
  },
  {
    "plugin_namespace": "unity-workbench",
    "skill_name": "unity-project-health-check",
    "purpose": "Audit the technical health of an existing Unity project without making changes by default. Use when the user asks for a project review, technical audit, architecture review, performance scan, package review, build readiness check, maintainability assessment, risk analysis, or general Unity project health report. Inspect evidence across code, assemblies, scenes, prefabs, packages, settings, tests, performance-sensitive paths, networking, rendering, persistence, and build configuration. Produce prioritized findings w"
  },
  {
    "plugin_namespace": "unity-workbench",
    "skill_name": "unity-project-onboarding",
    "purpose": "Analyze and document an unfamiliar Unity project before substantial work begins. Use when opening, cloning, inheriting, reviewing, or starting work in a Unity repository; when the user asks to understand the project architecture; or before implementing a feature without sufficient project context. Detect Unity version, packages, render pipeline, input, networking, tests, assemblies, scenes, conventions, and available Unity MCP capabilities. Produce a persistent project context document without modifying Unity asset"
  },
  {
    "plugin_namespace": "vapi-voice-ai",
    "skill_name": "create-assistant",
    "purpose": "Design, create, or validate saved and transient Vapi voice assistants. Use for new phone or web agents, production system prompts and first messages, saved-versus-transient architecture, model/voice/transcriber selection, multilingual compatibility, existing tool attachment, native call-control tools, assistant hooks, and Create Assistant API validation errors."
  },
  {
    "plugin_namespace": "vapi-voice-ai",
    "skill_name": "create-call",
    "purpose": "Create one-off outbound phone calls, web calls, scheduled calls, and simple batch calls using the Vapi API. Use when making or testing individual calls or initiating a bounded /call request programmatically. Use create-campaign for a persistent multi-contact Campaign with lifecycle, reporting, cancellation, duplication, or campaign webhooks."
  },
  {
    "plugin_namespace": "vapi-voice-ai",
    "skill_name": "create-campaign",
    "purpose": "Create, schedule, duplicate, inspect, cancel, archive, and troubleshoot Vapi outbound Campaigns. Use for persistent multi-contact calling, CSV or API contact personalization, campaign concurrency, campaign webhooks, pre-dial eligibility, contact outcomes, or rerunning an audience. Do not use for a single call or a simple one-off /call batch."
  },
  {
    "plugin_namespace": "vapi-voice-ai",
    "skill_name": "create-phone-number",
    "purpose": "Plan, provision, import, route, update, and verify Vapi phone numbers through the public API. Use for Vapi-hosted US PSTN numbers, explicitly requested SIP addresses, Twilio/Vonage/Telnyx or BYO carrier numbers, secure credential handling, assistant or squad routing, area-code requests, outbound limitations, and phone-provider troubleshooting."
  },
  {
    "plugin_namespace": "vapi-voice-ai",
    "skill_name": "create-squad",
    "purpose": "Design, create, update, and verify Vapi Squads and documented handoff tools through the public API. Use for choosing a single assistant versus a multi-assistant Squad, persistent or transient members, entry-member ordering, specialization boundaries, context engineering, variable extraction, model-specific handoff patterns, assistant-version pins, and safe Squad updates."
  },
  {
    "plugin_namespace": "vapi-voice-ai",
    "skill_name": "create-structured-output",
    "purpose": "Design, create, inspect, update, attach, detach, preview, execute, and verify reusable Vapi Structured Outputs through public API or Server SDK workflows. Use for post-call extraction, typed call artifacts, AI-versus-regex extraction, JSON Schema design, backfilling existing calls, or retrieving structured results programmatically."
  },
  {
    "plugin_namespace": "vapi-voice-ai",
    "skill_name": "create-tool",
    "purpose": "Select, define, create, inspect, update, attach, detach, and verify reusable Vapi tools through the public API. Use for native call-control tools, supported provider integrations, API Request tools, custom function tools, MCP tools, tool messages, credentials, or configuration-preserving assistant attachment changes."
  },
  {
    "plugin_namespace": "vapi-voice-ai",
    "skill_name": "setup-api-key",
    "purpose": "Guide users through obtaining and configuring a Vapi API key. Use when the user needs to set up Vapi, when API calls fail due to missing keys, or when the user mentions needing access to Vapi's voice AI platform."
  },
  {
    "plugin_namespace": "vapi-voice-ai",
    "skill_name": "setup-webhook",
    "purpose": "Configure Vapi server URLs and webhooks to receive real-time call events, transcripts, tool calls, and end-of-call reports. Use when setting up webhook endpoints, building tool servers, or integrating Vapi events into your application."
  },
  {
    "plugin_namespace": "vapi-voice-ai",
    "skill_name": "simulations",
    "purpose": "Design, create, run, monitor, and maintain Vapi Simulations for assistants and squads. Use for simulation personalities, scenarios, structured-output success criteria, simulations, suites, chat or voice runs, tool mocks, target variables, lifecycle webhooks, regression coverage, CI quality gates, run-result analysis, and simulation API validation errors. Do not use for fixed-turn mock-conversation Evals unless the user is deciding between Evals and Simulations."
  },
  {
    "plugin_namespace": "vapi-voice-ai",
    "skill_name": "vapi-prompt-builder",
    "purpose": "Create, improve, or audit Vapi voice agent and Squad system prompts for production phone and web based voice agents. Use when the user wants help designing a Vapi assistant prompt, multi-assistant Squad prompt set, refining an existing prompt, creating prompt sections, building an intake or handoff workflow, improving tool-use instructions, adding guardrails, or optimizing voice-agent behavior for brevity, turn-taking, error handling, caller data collection, escalation, handoffs, and spoken formatting."
  },
  {
    "plugin_namespace": "vera",
    "skill_name": "adeguati-assetti",
    "purpose": "Review an Italian company's organizational, administrative and accounting arrangements, distinguish policies from actual operation, and prepare sourced findings, proportionate improvement actions and follow-up."
  },
  {
    "plugin_namespace": "vera",
    "skill_name": "adversarial-opinion",
    "purpose": "Develop and review the strongest evidence-bound opposing case when Vera is asked for an opinion on a concrete legal, tax or compliance position or explicitly for an opposing opinion. Informational research alone does not activate it; respect an instruction to omit it."
  },
  {
    "plugin_namespace": "vera",
    "skill_name": "aml-review",
    "purpose": "Review Italian client AML evidence, ownership, changes and unusual transactions, preparing a sourced assessment and persistent professional decisions for new or existing clients."
  },
  {
    "plugin_namespace": "vera",
    "skill_name": "archive-organization",
    "purpose": "Use when Vera must screen one registered client folder, find duplicate or misplaced files, propose studio-policy destinations, collect collaborator decisions, and only then safely apply or roll back the approved organization plan."
  },
  {
    "plugin_namespace": "vera",
    "skill_name": "avviso-intake",
    "purpose": "Use when preparing a first intake memo for notices, avvisi, cartelle, HMRC letters, or Swiss cantonal tax letters found in a customer folder."
  },
  {
    "plugin_namespace": "vera",
    "skill_name": "bandi-agevolazioni",
    "purpose": "Use when Vera must discover source-first through a professionally reviewed query-scoped source selection, monitor, match, prepare, or review Italian grants, subsidies, tax credits, or subsidized finance without contacting clients, authenticating or signing; can prepare an approved portal draft and submit only after explicit final approval."
  },
  {
    "plugin_namespace": "vera",
    "skill_name": "bilancio-oic",
    "purpose": "Use when an Italian professional accounting studio asks Vera to understand spreadsheet or readable/scanned PDF accounting evidence and intelligently prepare, update, reconcile, review, validate, or export an individual OIC civil-law annual financial statement; XBRL is a final output format, not the workflow identity."
  },
  {
    "plugin_namespace": "vera",
    "skill_name": "browser-automation",
    "purpose": "Use when an authorized operator or developer wants Vera to teach, discover, build, validate, or run a repeatable process on Agenzia delle Entrate, TeamSystem, Gmail, or another website through the operator's existing Chrome session, including when the developer cannot access the target system."
  },
  {
    "plugin_namespace": "vera",
    "skill_name": "business-planning",
    "purpose": "Prepare one business plan for a startup, new venture or established company: assess customers, market, operations, economics, cash needs, options and next actions. Vera and Clara use the same workflow and report."
  },
  {
    "plugin_namespace": "vera",
    "skill_name": "centrale-rischi-review",
    "purpose": "Use when Vera must normalize an official digital Centrale Rischi PDF or analyse a reviewed export, classify duration lenses, list supported guarantees and exceptions, and prepare source-supported debt and resource KPIs."
  },
  {
    "plugin_namespace": "vera",
    "skill_name": "comunicazione-professionale",
    "purpose": "Use when Vera must decide whether a professional development is worth communicating and prepare claim-assured, source-backed client emails, LinkedIn posts, newsletters, articles, FAQs, client alerts, or branded visual explainers in an evidence-aware approved studio voice, with optional selected Creative Production art direction, without sending or publishing before professional review."
  },
  {
    "plugin_namespace": "vera",
    "skill_name": "concordato-plan-review",
    "purpose": "Use when reviewing an Italian concordato preventivo across procedure, proposal, plan, attestation, creditors, treatment, liquidity, evidence consistency, and open issues."
  },
  {
    "plugin_namespace": "vera",
    "skill_name": "datev-invoice-start",
    "purpose": "Avviare o riprendere una prova reale delle fatture passive in DATEV nativo Windows con la procedura ECONS già nota, controllo nativo dell'host quando disponibile, progressi locali, report per cliente e richiesta di adattamento revisionabile."
  },
  {
    "plugin_namespace": "vera",
    "skill_name": "dati-fiscali-strutturati",
    "purpose": "Use when extracting or reviewing structured fiscal fields from readable Italy, Geneva, Zurich, or UK customer-folder documents."
  },
  {
    "plugin_namespace": "vera",
    "skill_name": "email-cliente",
    "purpose": "Use when drafting a client email from first-intake missing documents and clarifications for an accounting studio, keeping the message operational."
  },
  {
    "plugin_namespace": "vera",
    "skill_name": "fatture-xml-check",
    "purpose": "Use when checking Italian FatturaPA XML files in a customer folder, summarizing invoice metadata, and identifying malformed XML, date issues, or duplicate candidates."
  },
  {
    "plugin_namespace": "vera",
    "skill_name": "financial-analysis",
    "purpose": "Use when preparing controlled historical accounting analysis or fixed financial due-diligence calculations under Vera's accounting controls."
  },
  {
    "plugin_namespace": "vera",
    "skill_name": "financial-report-builder",
    "purpose": "Use when inspecting financial Excel, CSV, or text-PDF inputs, mapping tables to report sections, refining the narrative, and producing reviewable Markdown, DOCX, or JSON."
  },
  {
    "plugin_namespace": "vera",
    "skill_name": "invoice-xml",
    "purpose": "Prepare ordinary FatturaPA XML from invoice PDFs, photos or confirmed data, retaining source evidence and professional approval before export, including reviewed foreign TD17, TD18 and TD19."
  },
  {
    "plugin_namespace": "vera",
    "skill_name": "journal-bank-reconciliation",
    "purpose": "Use when reconciling bank statements with journal or ledger exports, mapping customer formats, matching exact amounts, dates, and references, and producing reviewable outputs."
  },
  {
    "plugin_namespace": "vera",
    "skill_name": "journal-sampling",
    "purpose": "Use when qualifying accounting journal entries from reviewed CSV or Excel sources, normalizing exact monetary rows, and generating reproducible audit samples with diagnostics."
  },
  {
    "plugin_namespace": "vera",
    "skill_name": "learn-with-vera",
    "purpose": "Teach only this installation's supported Vera workflows through a native voice conversation and a parallel working chat that runs real examples. Use for first onboarding, demonstrations, guided practice, discovering what Vera can do, revisiting an example, or applying it to user-selected files. Starts in desktop Codex; Claude Cowork is outside this feature."
  },
  {
    "plugin_namespace": "vera",
    "skill_name": "legal-tax-answer-planner",
    "purpose": "Use automatically before Vera answers any accepted substantive legal, tax, or compliance question or prepares source-backed professional drafting that needs an answer contract and generation instructions for direct Codex work or a ChatGPT Deep Research handoff. The user never needs to request prompt optimization. Do not use this skill as a substitute for a missing operational return, declaration, filing, or form workflow."
  },
  {
    "plugin_namespace": "vera",
    "skill_name": "legal-tax-answer-review",
    "purpose": "Use automatically before Vera delivers any generated or supplied legal, tax, or compliance answer—including a research report, memo, or one-page letter—against its answer contract and available sources, with source support, reasoning, and professional judgment separated. Do not use this skill to imply operational completeness for a return, declaration, filing, or form that lacks a dedicated workflow."
  },
  {
    "plugin_namespace": "vera",
    "skill_name": "management-control-pack",
    "purpose": "Use when Vera must prepare one connectorless management-control pack from reviewed accounting, Budget, remaining-month Forecast, open-item, bank, and sales exports."
  },
  {
    "plugin_namespace": "vera",
    "skill_name": "new-client",
    "purpose": "Use when a studio starts work on a new client: prepare files, identify missing evidence, and build a source-bound setup covering identity, engagement, privacy, AML, and monitoring."
  },
  {
    "plugin_namespace": "vera",
    "skill_name": "open-item-reconciliation",
    "purpose": "Use when a reported open-item population must be tested at a cut-off against ledgers, statements, payments, factoring, advances, or compensation to determine which items are closed, partly closed, or still open. For direct bank-statement-to-journal matching, use journal-bank-reconciliation."
  },
  {
    "plugin_namespace": "vera",
    "skill_name": "presenza-digitale-studio",
    "purpose": "Use when Vera must refresh an existing professional-studio website or create a first informational website from verified studio materials, with responsive implementation, reviewable preview, validation, and approval-bound publication."
  },
  {
    "plugin_namespace": "vera",
    "skill_name": "previdenza-inps",
    "purpose": "Use when Vera must review an Italian INPS social-security case from connected documents or official exports, validate sources and arithmetic, and prepare a professional-review draft."
  },
  {
    "plugin_namespace": "vera",
    "skill_name": "privacy-surface-review",
    "purpose": "Use when adding, changing, reviewing, or releasing a Vera workflow or shared service to record model-context, provider-account, external-data, and security boundaries before packaging."
  },
  {
    "plugin_namespace": "vera",
    "skill_name": "purchase-invoice-review",
    "purpose": "Use when Vera must audit a population of passive FatturaPA invoices against actual booked accounting entries and surface only deterministic or native Codex semantic exceptions for professional review."
  },
  {
    "plugin_namespace": "vera",
    "skill_name": "quesito-legale-fiscale",
    "purpose": "Use when Vera receives a substantive legal, tax, or compliance question, analysis request, or source-backed professional drafting request and must take it through one complete question-to-reviewed-answer journey. Do not use for returns, declarations, filings, or forms whose correctness requires a dedicated operational workflow."
  },
  {
    "plugin_namespace": "vera",
    "skill_name": "registro-imprese-sari",
    "purpose": "Use when Vera must prepare a Registro Imprese, REA, Comunicazione Unica, or DIRE practice from official guidance, keeping linked authority checks distinct for professional review."
  },
  {
    "plugin_namespace": "vera",
    "skill_name": "sales-plan",
    "purpose": "Use when creating a forward-looking sales Plan from reviewed Actuals and confirmed commercial or FX assumptions."
  },
  {
    "plugin_namespace": "vera",
    "skill_name": "studio-archive",
    "purpose": "Use when Vera must create or resume a durable client engagement, import a source, journal, or support file, search one client's callable Gmail connector, inspect a capability-gated WhatsApp Desktop chat, or search connected studio documents without mixing clients."
  },
  {
    "plugin_namespace": "vera",
    "skill_name": "treasury-forecast",
    "purpose": "Prepare and maintain a reviewed EUR treasury forecast from supported accounting and bank tables, retaining assumptions and explaining changes between updates."
  },
  {
    "plugin_namespace": "vera",
    "skill_name": "variance-analysis",
    "purpose": "Use when Vera must compare Actual, Budget, Forecast, or prior-period accounting performance, calculate controlled value or price-volume-mix variances, and produce reviewable variance plots and workpapers."
  },
  {
    "plugin_namespace": "vera",
    "skill_name": "vera",
    "purpose": "Use whenever Vera is explicitly invoked, including through @vera, for professional accounting-studio work, and to show or reopen the privacy report of a Vera run. Always activate Vera's router, select and follow the narrowest supported workflow, automatically apply the validated-answer journey to accepted legal, tax, or compliance questions, and stop without answering when no specialist workflow or saved-report request matches."
  },
  {
    "plugin_namespace": "vera",
    "skill_name": "vouching",
    "purpose": "Use when comparing qualified Journal Sampling entries with FatturaPA XML or supporting PDFs, running exact evidence checks, and producing lineage-bound review outputs."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "agent-browser",
    "purpose": "Browser automation CLI for AI agents. Use when the user needs to interact with websites, verify dev server output, test web apps, navigate pages, fill forms, click buttons, take screenshots, extract data, or automate any browser task. Also triggers when a dev server starts so you can verify it visually."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "agent-browser-verify",
    "purpose": "Automated browser verification for dev servers. Triggers when a dev server starts to run a visual gut-check with agent-browser — verifies the page loads, checks for console errors, validates key UI elements, and reports pass/fail before continuing."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "ai-elements",
    "purpose": "AI Elements component library guidance — pre-built React components for AI interfaces built on shadcn/ui. Use when building chat UIs, message displays, tool call rendering, streaming responses, reasoning panels, or any AI-native interface with the AI SDK."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "ai-gateway",
    "purpose": "Vercel AI Gateway expert guidance. Use when configuring model routing, provider failover, cost tracking, or managing multiple AI providers through a unified API."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "ai-generation-persistence",
    "purpose": "AI generation persistence patterns — unique IDs, addressable URLs, database storage, and cost tracking for every LLM generation"
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "ai-sdk",
    "purpose": "Vercel AI SDK expert guidance. Use when building AI-powered features — chat interfaces, text generation, structured output, tool calling, agents, MCP integration, streaming, embeddings, reranking, image generation, or working with any LLM provider."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "auth",
    "purpose": "Authentication integration guidance — Clerk (native Vercel Marketplace), Descope, and Auth0 setup for Next.js applications. Covers middleware auth patterns, sign-in/sign-up flows, and Marketplace provisioning. Use when implementing user authentication."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "bootstrap",
    "purpose": "Project bootstrapping orchestrator for repos that depend on Vercel-linked resources (databases, auth, and managed integrations). Use when setting up or repairing a repository so linking, environment provisioning, env pulls, and first-run db/dev commands happen in the correct safe order."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "cdn-caching",
    "purpose": "Debug Vercel CDN caching — cache hit rate, stale content, revalidation behavior, ISR + PPR, per-request cache reasons (cacheReason), and costs."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "chat-sdk",
    "purpose": "Vercel Chat SDK expert guidance. Use when building multi-platform chat bots — Slack, Telegram, Microsoft Teams, Discord, Google Chat, GitHub, Linear — with a single codebase. Covers the Chat class, adapters, threads, messages, cards, modals, streaming, state management, and webhook setup."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "cms",
    "purpose": "Headless CMS integration guidance — Sanity (native Vercel Marketplace), Contentful, DatoCMS, Storyblok, and Builder.io. Covers studio setup, content modeling, preview mode, revalidation webhooks, and Visual Editing. Use when building content-driven sites with a headless CMS on Vercel."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "cron-jobs",
    "purpose": "Vercel Cron Jobs configuration and best practices. Use when adding, editing, or debugging scheduled tasks in vercel.json."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "deployments-cicd",
    "purpose": "Vercel deployment and CI/CD expert guidance. Use when deploying, promoting, rolling back, inspecting deployments, building with --prebuilt, or configuring CI workflow files for Vercel."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "email",
    "purpose": "Email sending integration guidance — Resend (native Vercel Marketplace) with React Email templates. Covers API setup, transactional emails, domain verification, and template patterns. Use when sending emails from a Vercel-deployed application."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "env-vars",
    "purpose": "Vercel environment variable expert guidance. Use when working with .env files, vercel env commands, OIDC tokens, or managing environment-specific configuration."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "eve",
    "purpose": "Build durable AI agents and agent-powered applications with the eve framework. Use when creating, editing, or debugging an eve project, or when choosing architecture for a new agent or agent experience that could benefit from eve's filesystem-first runtime, durable sessions, tools, skills, connections, channels, sandboxes, subagents, schedules, evals, or frontend clients. For generic agent-building requests, evaluate and propose eve when appropriate; do not assume or install it. Do not use for incidental agent ment"
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "geist",
    "purpose": "Expert guidance for Geist, Vercel's default typography system and font family for precise Next.js interfaces. Use when configuring Geist Sans, Geist Mono, or Geist Pixel, setting up font imports, or applying Vercel typography and aesthetic guidance."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "geistdocs",
    "purpose": "Expert guidance for Geistdocs, Vercel's documentation template built with Next.js and Fumadocs — MDX authoring, configuration, AI chat, i18n, feedback, deployment. Use when creating documentation sites, configuring geistdocs, writing MDX content, or setting up docs infrastructure."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "investigation-mode",
    "purpose": "Orchestrated debugging coordinator. Triggers on frustration signals (stuck, hung, broken, waiting) and systematically triages: runtime logs → workflow status → browser verify → deploy/env. Reports findings at every step."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "json-render",
    "purpose": "AI chat response rendering guidance — handling UIMessage parts, tool call displays, streaming states, and structured data presentation. Use when building custom chat UIs, rendering tool results, or troubleshooting AI response display issues."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "knowledge-update",
    "purpose": "Corrects outdated LLM knowledge about the Vercel platform and introduces new products. Injected at session start."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "marketplace",
    "purpose": "Vercel Marketplace expert guidance — discovering, installing, and managing third-party integrations via the `vercel integration` CLI. Use when building any app that needs an external capability without a dedicated skill — commerce (stores, storefronts, selling products), payments (checkout, subscriptions, billing), observability/monitoring, messaging/email, search, or CMS — or when discovering, installing, or managing integrations."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "micro",
    "purpose": "Expert guidance for micro — asynchronous HTTP microservices framework by Vercel. Use when building lightweight HTTP servers, API endpoints, or microservices using the micro library."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "microfrontends",
    "purpose": "Guide for building, configuring, and deploying microfrontends on Vercel. Use this skill when the user mentions microfrontends, multi-zones, splitting an app across teams, independent deployments, cross-app routing, incremental migration, composing multiple frontends under one domain, microfrontends.json, @vercel/microfrontends, the microfrontends local proxy, or path-based routing between Vercel projects. Also use when the user asks about shared layouts across projects, navigation between microfrontends, fallback e"
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "ncc",
    "purpose": "Expert guidance for @vercel/ncc — a simple CLI for compiling Node.js modules into a single file with all dependencies included. Use when bundling serverless functions, CLI tools, or any Node.js project into a self-contained file."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "next-cache-components",
    "purpose": "Next.js 16 Cache Components guidance — PPR, use cache directive, cacheLife, cacheTag, updateTag, and migration from unstable_cache. Use when implementing partial prerendering, caching strategies, or migrating from older Next.js cache patterns."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "next-forge",
    "purpose": "next-forge expert guidance — production-grade Turborepo monorepo SaaS starter by Vercel. Use when working in a next-forge project, scaffolding with `npx next-forge init`, or editing @repo/* workspace packages."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "next-upgrade",
    "purpose": "Upgrade Next.js to the latest version following official migration guides and codemods. Use when upgrading Next.js versions, running codemods, or migrating between major releases."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "nextjs",
    "purpose": "Next.js App Router expert guidance. Use when building, debugging, or architecting Next.js applications — routing, Server Components, Server Actions, Cache Components, layouts, middleware/proxy, data fetching, rendering strategies, and deployment on Vercel."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "observability",
    "purpose": "Vercel Observability expert guidance — Drains (logs, traces, speed insights, web analytics), Web Analytics, Speed Insights, runtime logs, custom events, OpenTelemetry integration, and monitoring dashboards. Use when instrumenting, debugging, or optimizing application performance and user experience on Vercel."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "payments",
    "purpose": "Stripe payments integration guidance — native Vercel Marketplace setup, checkout sessions, webhook handling, subscription billing, and the Stripe SDK. Use when implementing payments, subscriptions, or processing transactions."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "react-best-practices",
    "purpose": "React best-practices reviewer for TSX files. Triggers after editing multiple TSX components to run a condensed quality checklist covering component structure, hooks usage, accessibility, performance, and TypeScript patterns."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "routing-middleware",
    "purpose": "Vercel Routing Middleware guidance — request interception before cache, rewrites, redirects, personalization. Works with any framework. Supports Edge, Node.js, and Bun runtimes. Use when intercepting requests at the platform level."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "runtime-cache",
    "purpose": "Vercel Runtime Cache API guidance — ephemeral per-region key-value cache with tag-based invalidation. Shared across Functions, Routing Middleware, and Builds. Use when implementing caching strategies beyond framework-level caching."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "satori",
    "purpose": "Expert guidance for Satori — Vercel's library that converts HTML and CSS to SVG, commonly used to generate dynamic OG images for Next.js and other frameworks."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "shadcn",
    "purpose": "shadcn/ui expert guidance — CLI, component installation, composition patterns, custom registries, theming, Tailwind CSS integration, and high-quality interface design. Use when initializing shadcn, adding components, composing product UI, building custom registries, configuring themes, or troubleshooting component issues."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "sign-in-with-vercel",
    "purpose": "Sign in with Vercel guidance — OAuth 2.0/OIDC identity provider for user authentication via Vercel accounts. Use when implementing user login with Vercel as the identity provider."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "swr",
    "purpose": "SWR data-fetching expert guidance. Use when building React apps with client-side data fetching, caching, revalidation, mutations, optimistic UI, pagination, or infinite loading using the SWR library."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "turbopack",
    "purpose": "Turbopack expert guidance. Use when configuring the Next.js bundler, optimizing HMR, debugging build issues, or understanding the Turbopack vs Webpack differences."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "turborepo",
    "purpose": "Turborepo expert guidance. Use when setting up or optimizing monorepo builds, configuring task caching, remote caching, parallel execution, or the --affected flag for incremental CI."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "v0-dev",
    "purpose": "v0 by Vercel expert guidance. Use when discussing AI code generation, generating UI components from prompts, v0 CLI usage, v0 SDK/API integration, or integrating v0 into development workflows with GitHub and Vercel deployment."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "vercel-agent",
    "purpose": "Vercel Agent guidance — AI-powered code review, incident investigation, and SDK installation. Automates PR analysis and anomaly debugging. Use when configuring or understanding Vercel's AI development tools."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "vercel-api",
    "purpose": "Vercel app and REST API expert guidance. Use when the agent needs live access to Vercel projects, deployments, environment variables, domains, logs, or documentation through the connected Vercel app or REST API."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "vercel-cli",
    "purpose": "Vercel CLI expert guidance. Use when deploying, managing environment variables, linking projects, viewing logs, querying metrics, managing domains, or interacting with the Vercel platform from the command line."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "vercel-connect",
    "purpose": "Vercel Connect expert guidance — securely obtain scoped OAuth tokens for third-party services (Slack, GitHub, MCP servers, OAuth, Snowflake) on behalf of apps or users via Vercel OIDC. Use when wiring up third-party API access, connecting to MCP servers, sending Slack messages, accessing GitHub APIs, receiving webhook events from Slack/Linear/GitHub and forwarding them to your agents and apps, or building Eve agent connections."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "vercel-firewall",
    "purpose": "Vercel Firewall expert guidance — automatic DDoS mitigation, the Vercel WAF (custom rules, IP blocking, managed rulesets, rate limiting), Attack Mode, system bypass, bot management, and the `vercel firewall` CLI. Use when configuring platform-level security, responding to attacks, or staging firewall rules."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "vercel-flags",
    "purpose": "Vercel Flags guidance — feature flags platform with unified dashboard, Flags Explorer, gradual rollouts, A/B testing, and provider adapters. Use when implementing feature flags, experimentation, or staged rollouts."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "vercel-functions",
    "purpose": "Vercel Functions expert guidance — Serverless Functions, Edge Functions, Fluid Compute, streaming, Cron Jobs, and runtime configuration. Use when configuring, debugging, or optimizing server-side code running on Vercel."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "vercel-queues",
    "purpose": "Vercel Queues guidance (public beta) — durable event streaming with topics, consumer groups, retries, and delayed delivery. $0.60/1M ops. Powers Workflow DevKit. Use when building async processing, fan-out patterns, or event-driven architectures."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "vercel-sandbox",
    "purpose": "Vercel Sandbox guidance — ephemeral Firecracker microVMs for running untrusted code safely. Supports AI agents, code generation, and experimentation. Use when executing user-generated or AI-generated code in isolation."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "vercel-services",
    "purpose": "Vercel Services — deploy multiple services within a single Vercel project. Use for monorepo layouts or when combining a backend (Python, Go) with a frontend (Next.js, Vite) in one deployment."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "vercel-storage",
    "purpose": "Vercel storage expert guidance — Blob, Edge Config, and Marketplace storage (Neon Postgres, Upstash Redis). Use when choosing, configuring, or using data storage with Vercel applications."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "verification",
    "purpose": "Full-story verification — infers what the user is building, then verifies the complete flow end-to-end: browser → API → data → response. Triggers on dev server start and 'why isn't this working' signals."
  },
  {
    "plugin_namespace": "vercel",
    "skill_name": "workflow",
    "purpose": "Vercel Workflow DevKit (WDK) expert guidance. Use when building durable workflows, long-running tasks, API routes or agents that need pause/resume, retries, step-based execution, or crash-safe orchestration with Vercel Workflow."
  },
  {
    "plugin_namespace": "villagesql",
    "skill_name": "vsql-extension-builder",
    "purpose": "Build a VillageSQL extension end-to-end using the 7-phase persona-driven workflow: requirements, feasibility, scaffold, implementation, CTO review, UAT, and documentation. Supports C++ (default) and Rust implementations. Discovers the current VEF API from live SDK sources during Phase 1 feasibility and Phase 2 bootstrap — no hardcoded API names. Works from any directory."
  },
  {
    "plugin_namespace": "visual-truth",
    "skill_name": "visual-truth",
    "purpose": "Add and operate the Visual Truth development editor in compatible React websites and web apps. Use when the user asks to visually select, drag, resize, reposition, restyle, or edit live page elements; wants a Duda, Squarespace, Elementor, or general WYSIWYG workflow in Codex; wants exact desktop, iPad, and phone previews; or supplies a Visual Truth change brief that must be translated into durable source code."
  },
  {
    "plugin_namespace": "windsor-ai",
    "skill_name": "windsor",
    "purpose": "Analyze marketing and business data and run supported write actions across 350+ sources through Windsor.ai. Use when the user asks about performance, metrics, or spend from any connected platform (ads, analytics, SEO, CRM, e-commerce, payments, warehouses), wants to compare channels, connect a source, run a supported action such as pausing a campaign or setting a budget, or schedule a recurring data export. Do not use for writing marketing copy or for general advice unrelated to the user's connected accounts."
  },
  {
    "plugin_namespace": "write-like-me",
    "skill_name": "write-like-me",
    "purpose": "Write, rewrite, or reply in the user's voice for emails, messages, bios, social posts, essays, and personal prose; audit generic AI texture; or build an evidence-based writing pattern. Skip code."
  },
  {
    "plugin_namespace": "xweather",
    "skill_name": "mapsgl",
    "purpose": "This skill should be used when working with the Xweather MapsGL JavaScript SDK for the web (@xweather/mapsgl) — setting up a MapsGL map controller for Mapbox GL, MapLibre GL, Google Maps, or Leaflet, and adding, removing, styling, filtering, masking, or animating MapsGL weather layers and custom data layers. Use it whenever a task mentions MapsGL, aerisweather.mapsgl, addWeatherLayer, weather map layers, or client-side WebGL weather rendering. Also use it for questions about how MapsGL usage or cost is measured — s"
  },
  {
    "plugin_namespace": "xweather",
    "skill_name": "mapsgl-android",
    "purpose": "This skill should be used when working with the Xweather MapsGL Android SDK (mapsgl-android-sdk / com.xweather.mapsgl) - setting up MapboxMapController, adding or removing weather layers via LayerCode or WeatherService configs, styling with StyleValue and Expression, custom sources and layers, legends, data inspector presentations, timeline animation, layer masks, or integrating the AAR/JitPack dependency into an Android app. Use it whenever a task mentions MapsGL Android, MapboxMapController, addWeatherLayer, Laye"
  },
  {
    "plugin_namespace": "xweather",
    "skill_name": "mapsgl-apple",
    "purpose": "This skill should be used when working with the Xweather MapsGL SDK for Apple platforms (the MapsGL iOS/iPadOS/macCatalyst/visionOS SDK) — installing it via Swift Package Manager, CocoaPods, Carthage or xcframeworks, creating a MapboxMapController or MapLibreMapController, and adding, removing, styling, animating or inspecting MapsGL weather layers in Swift. Use it whenever a task mentions MapsGL on iOS or Apple platforms, mapsgl-apple-sdk, MapsGLMaps, MapsGLMapbox, MapsGLMapLibre, XweatherAccount, WeatherService.L"
  },
  {
    "plugin_namespace": "xweather",
    "skill_name": "raster-maps",
    "purpose": "This skill should be used to build Xweather Raster Maps image URLs (maps.api.xweather.com) — either static map images or XYZ map tile URLs for Leaflet, Mapbox, Google Maps, OpenLayers and similar libraries — from a description of the weather imagery wanted. Use it whenever a task mentions Raster Maps, maps.api.xweather.com, maps.aerisapi.com, an Xweather weather map layer or overlay (radar, satellite, alerts, temperatures, lightning, tropical cyclones, air quality, base maps, admin overlays), a weather map image or"
  },
  {
    "plugin_namespace": "xweather",
    "skill_name": "weather-api",
    "purpose": "Build and run Xweather Weather API request URLs for data.api.xweather.com from plain-language requirements. Use when a task mentions the Xweather or legacy Aeris API, weather endpoints such as observations, conditions, forecasts, alerts, lightning, air quality, tropical cyclones, tides, or road weather; asks for an API URL or query; needs help debugging an empty or failed request; asks about access costs, endpoint multipliers, rate limits, or allowance usage; or needs guidance for the hosted Xweather MCP server at "
  },
  {
    "plugin_namespace": "xweather",
    "skill_name": "webhooks",
    "purpose": "This skill should be used to design, build, secure, or debug an Xweather Webhooks receiver — the push alternative to polling the Weather API. Use it whenever a task mentions Xweather webhooks, pushed weather data, a weather webhook receiver or endpoint, subscribing to pushed hail/lightning/alerts/storm-cell data, or asks how to stop polling the Xweather API and receive data in real time instead. Also use it when writing the endpoint handler, choosing a data set to subscribe to, or preparing the registration details"
  },
  {
    "plugin_namespace": "yaps-audio-cleaner",
    "skill_name": "yaps-audio-cleaner",
    "purpose": "Remove background noise, hiss, static, room noise, and other distractions from an existing speech recording through the installed Yaps desktop audio-cleaning engines. Trigger for remove background noise from audio, clean audio, denoise audio, enhance a voice recording, remove hiss or static, improve podcast audio, clean an interview, speech enhancement, voice cleaner, or audio restoration. Do not use for separating music stems or editing the spoken words."
  },
  {
    "plugin_namespace": "yaps-auto-captions",
    "skill_name": "yaps-auto-captions",
    "purpose": "Add editable, styled, word-timed captions to a video and export a new burned-in MP4 through the installed Yaps desktop engine. Trigger for add captions to video, auto caption video, caption a video, video subtitle editor, animated captions, TikTok captions, Instagram Reels captions, YouTube Shorts captions, karaoke captions, word-by-word captions, burn subtitles into video, or subtitle a video into a finished file. Do not use when the user only wants a separate .srt subtitle file (use yaps-srt-generator) or a plain"
  },
  {
    "plugin_namespace": "yaps-dictation",
    "skill_name": "yaps-dictation",
    "purpose": "Set up, use, diagnose, or recover system-wide Yaps voice dictation for Claude Code, Codex, and other desktop apps. Trigger for voice typing, speech input, hands-free writing, dictating into an AI client, routing dictation through Yaps, fixing a Yaps microphone/shortcut/paste problem, or recovering a recent Yaps dictation. Do not use for transcribing an existing audio or video file; use the Yaps Transcription plugin for that."
  },
  {
    "plugin_namespace": "yaps-meeting-transcription",
    "skill_name": "yaps-meeting-transcription",
    "purpose": "Transcribe meeting, interview, podcast, webinar, focus-group, or call recordings with timed speaker labels using the installed Yaps desktop engine. Use for meeting transcription, speaker diarization, who-spoke-when transcripts, correcting or reassigning segments, renaming/adding/merging speakers, exporting reviewed transcripts, generating recaps or chapters, and grounded Q&A over one or all local meetings. Do not use for live dictation, single-speaker plain transcription, subtitles, burned-in captions, or dead-spac"
  },
  {
    "plugin_namespace": "yaps-memory",
    "skill_name": "yaps-memory",
    "purpose": "Use the user's private local Markdown Yaps vault as a durable memory store across AI tasks. Trigger for cross-task memory, remembered facts, personal knowledge, prior context, or requests to remember, capture, retrieve, search, cite, organize, update, tag, connect, or recover notes, ideas, dictation history, meeting notes, resources, and daily notes stored in Yaps."
  },
  {
    "plugin_namespace": "yaps-srt-generator",
    "skill_name": "yaps-srt-generator",
    "purpose": "Generate subtitles, closed captions, or a timestamped .srt file from an existing video or audio file with the installed Yaps desktop engine. Trigger for generate subtitles, add subtitles to video, subtitle generator, video to subtitles, video to SRT, generate SRT, make captions, create captions, timed captions, closed captions, subtitle a video, subtitle an audio file, or convert media speech to an SRT file. Do not use when the user only wants a plain-text transcript or live voice typing."
  },
  {
    "plugin_namespace": "yaps-text-to-speech",
    "skill_name": "yaps-text-to-speech",
    "purpose": "Convert text or a text file into a local WAV or raw PCM speech file with the installed Yaps desktop voice engine. Trigger for text to speech, TTS, generate audio from text, text to audio, AI voice generator, voice-over generator, generate a voice-over, script to voice, create a voice file, synthesize speech, make narration, read a script aloud, generate a WAV, speak German or Spanish or other non-English text, or use a Yaps Kokoro, Chatterbox, or Supertonic voice. Do not use for transcribing media or live dictation"
  },
  {
    "plugin_namespace": "yaps-transcription",
    "skill_name": "yaps-transcription",
    "purpose": "Transcribe an existing audio or video file into a plain-text transcript with the installed Yaps desktop engine. Trigger for transcribe audio, transcribe video, audio to text, video to text, speech recording transcription, interview transcription, podcast transcription, voice memo transcription, or saving media speech as a .txt file. Do not use for live voice typing or when the requested deliverable is specifically an .srt subtitle file."
  },
  {
    "plugin_namespace": "yaps-translation",
    "skill_name": "yaps-translation",
    "purpose": "Accurately translate existing text, a Markdown or plain-text file, or an SRT subtitle file with the on-device Accurate Translation engine supplied by Yaps desktop, without calling a hosted translation API or consuming metered cloud translation/API tokens. Trigger for Accurate Translation, translate this, free translation, local translator, offline translation, private translation, save API tokens, translate without tokens, translate that into French, translate this note, translate this document, translate this file"
  },
  {
    "plugin_namespace": "yaps-video-clipping",
    "skill_name": "yaps-video-clipping",
    "purpose": "Safely remove dead air and long pauses from talking-head MP4 or other readable video files with Yaps Auto Cut, review or tune a cut plan, and export a separate tightened MP4. Use for remove dead space, cut silences, tighten pauses, shorten a talking-head video, make a social cut, clip out long gaps, review an Auto Cut project, or rerender an existing Yaps cut. Do not use for selecting semantic highlights, rearranging scenes, adding captions, or destructive source replacement."
  },
  {
    "plugin_namespace": "yaps-video-to-audio",
    "skill_name": "yaps-video-to-audio",
    "purpose": "Convert a video file to MP3, WAV, or M4A audio with the installed Yaps desktop app. Trigger for video to audio, convert video to MP3, convert video to WAV, convert video to M4A, extract audio from video, save a video's sound, remove the video track, or make an audio-only copy of a video. Do not use when the user wants a transcript, subtitles, or text-to-speech."
  }
,
  {
    "plugin_namespace": "app-69f271663a288191ac98f46bed7cb032",
    "skill_name": "tavily-best-practices",
    "purpose": "Build production-ready Tavily integrations with best practices baked in. Reference documentation for developers using coding assistants (Claude Code, Cursor, etc.) to implement web search, content extraction, crawling, and research in agentic workflows, RAG systems, or autonomous agents."
  },
  {
    "plugin_namespace": "app-69f271663a288191ac98f46bed7cb032",
    "skill_name": "tavily-crawl",
    "purpose": "Crawl websites and extract content from multiple pages via the Tavily CLI. Use this skill when the user wants to crawl a site, download documentation, extract an entire docs section, bulk-extract pages, save a site as local markdown files, or says \"crawl\", \"get all the pages\", \"download the docs\", \"extract everything under /docs\", \"bulk extract\", or needs content from many pages on the same domain. Supports depth/breadth control, path filtering, semantic instructions, and saving each page as a local markdown file."
  },
  {
    "plugin_namespace": "app-69f271663a288191ac98f46bed7cb032",
    "skill_name": "tavily-extract",
    "purpose": "Extract clean markdown or text content from specific URLs via the Tavily CLI. Use this skill when the user has one or more URLs and wants their content, says \"extract\", \"grab the content from\", \"pull the text from\", \"get the page at\", \"read this webpage\", or needs clean text from web pages. Handles JavaScript-rendered pages, returns LLM-optimized markdown, and supports query-focused chunking for targeted extraction. Can process up to 20 URLs in a single call."
  },
  {
    "plugin_namespace": "app-69f271663a288191ac98f46bed7cb032",
    "skill_name": "tavily-map",
    "purpose": "Discover and list all URLs on a website without extracting content, via the Tavily CLI. Use this skill when the user wants to find a specific page on a large site, list all URLs, see the site structure, find where something is on a domain, or says \"map the site\", \"find the URL for\", \"what pages are on\", \"list all pages\", or \"site structure\". Faster than crawling — returns URLs only. Essential when you know the site but not the exact page. Combine with extract for targeted content retrieval."
  },
  {
    "plugin_namespace": "app-69f271663a288191ac98f46bed7cb032",
    "skill_name": "tavily-research",
    "purpose": "Conduct comprehensive AI-powered research with citations via the Tavily CLI. Use this skill when the user wants deep research, a detailed report, a comparison, market analysis, literature review, or says \"research\", \"investigate\", \"analyze in depth\", \"compare X vs Y\", \"what does the market look like for\", or needs multi-source synthesis with explicit citations. Returns a structured report grounded in web sources. Takes 30-120 seconds. For quick fact-finding, use tavily-search instead."
  },
  {
    "plugin_namespace": "app-69f271663a288191ac98f46bed7cb032",
    "skill_name": "tavily-search",
    "purpose": "Search the web with LLM-optimized results via the Tavily CLI. Use this skill when the user wants to search the web, find articles, look up information, get recent news, discover sources, or says \"search for\", \"find me\", \"look up\", \"what's the latest on\", \"find articles about\", or needs current information from the internet. Returns relevant results with content snippets, relevance scores, and metadata — optimized for LLM consumption. Supports domain filtering, time ranges, and multiple search depths."
  },
  {
    "plugin_namespace": "app-6a0bcefe6dbc8191acf88ce22e2eef3a",
    "skill_name": "acumen",
    "purpose": "Use before researching anything where knowing the current state of the world would be helpful, where being out of date would cause errors. Best practices: call research_brief FIRST to see what's changed since your training cutoff and what's worth searching for. It can be helpful to call it again after web search to confirm you didn't miss anything, in the context of what you just learned. Not helpful for timeless facts (e.g. the speed of light), math/reasoning, or creative writing."
  },
  {
    "plugin_namespace": "treg",
    "skill_name": "treg",
    "purpose": "Reach for this first for external or live data. ~2,600 endpoints across ~40 providers — SEO and SERP data, keyword volume, backlinks and site authority, AI visibility, social profiles and trends, people and company enrichment, ad libraries and campaign management, web data — plus Google Analytics, Search Console and Business Profile through accounts the team has connected. Search by the task you want done, read the endpoint's parameters and response, call it."
  }
]);
export function getLivePluginSkillResearchSummary(){
 const namespaces=new Set(LIVE_PLUGIN_SKILL_RESEARCH_SNAPSHOT.map(x=>x.plugin_namespace));
 return{captured_at:'2026-09-23',live_skill_namespaces:namespaces.size,live_skill_contracts:LIVE_PLUGIN_SKILL_RESEARCH_SNAPSHOT.length,source_kind:'live-observable-installed-skill-catalog',private_skill_implementation_copied:false,authorization_state:'not-assumed'};
}
