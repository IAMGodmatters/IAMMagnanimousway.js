# Magnanimous Connector & Plugin Capability Absorption Ledger — 2026-09-19

## Purpose

This ledger records the connector/plugin capability classes Magnanimous AI is allowed to learn and internalize. **Absorb** means: reproduce observable workflows through original Magnanimous code, memory, policies, normalized contracts, reusable skills, tests, open standards, and authorized adapters. It does **not** mean copying proprietary source code, hidden prompts, model weights, credentials, restricted datasets, private internals, or provider branding.

Magnanimous AI remains the brain, identity, memory owner, planner, orchestrator, verifier, and learning layer. Third-party accounts, live external data, payment/telecom/network rails, repository/hosting accounts, and specialized proprietary compute remain replaceable external boundaries whenever they cannot truthfully be made native.

## Current coverage

- Catalogued connector/provider/plugin families: **68**
- Direct platform connector types exposed by `/connections`: **13**
- Direct connector coverage in the absorption catalog: **13/13**
- One-by-one capability specifications after unioning live connector actions with benchmark capabilities: **294**
- Status vocabulary: `brain-spec-absorbed` → `tool-foundry-specified` → `native` only after runtime evidence.
- Paid spend remains zero by default; consequential writes retain permission/approval controls.

## Direct connector research

### Google / Gmail (`google`)
- Auth boundary: `oauth2`
- Live connector actions: `read_mail`, `send_mail`
- Full absorbed capability set: `read_mail`, `send_mail`
- Native Magnanimous target: `communications-hub`
- External boundary: account authorization/live provider data or delivery remains replaceable.
- Official research references: <https://developers.google.com/workspace/gmail/api/guides> · <https://developers.google.com/workspace/gmail/api/guides/sending>

### Facebook Pages (`facebook`)
- Auth boundary: `meta-oauth`
- Live connector actions: `read_pages`, `read_engagement`, `publish_posts`
- Full absorbed capability set: `read_pages`, `read_engagement`, `publish_posts`
- Native Magnanimous target: `social-operations`
- External boundary: account authorization/live provider data or delivery remains replaceable.
- Official research references: <https://developers.facebook.com/docs/pages-api/>

### Instagram Business (`instagram`)
- Auth boundary: `meta-oauth`
- Live connector actions: `read_profile`, `read_media`, `publish_media`, `moderate_comments`
- Full absorbed capability set: `read_profile`, `read_media`, `publish_media`, `moderate_comments`
- Native Magnanimous target: `social-operations`
- External boundary: account authorization/live provider data or delivery remains replaceable.
- Official research references: <https://developers.facebook.com/docs/instagram-platform/>

### WhatsApp Business (`whatsapp`)
- Auth boundary: `meta-oauth`
- Live connector actions: `send_messages`, `customer_support`
- Full absorbed capability set: `send_messages`, `customer_support`
- Native Magnanimous target: `communications-hub`
- External boundary: account authorization/live provider data or delivery remains replaceable.
- Official research references: <https://developers.facebook.com/docs/whatsapp/cloud-api/>

### Shopify (`shopify`)
- Auth boundary: `shopify-oauth`
- Live connector actions: `read_products`, `manage_products`, `read_orders`, `read_customers`
- Full absorbed capability set: `ecommerce`, `storefront`, `products`, `orders`, `store-management`, `read_products`, `manage_products`, `read_orders`, `read_customers`
- Native Magnanimous target: `commerce-engine`
- External boundary: account authorization/live provider data or delivery remains replaceable.
- Official research references: <https://shopify.dev/docs/api/admin-graphql/latest>

### Shopee Seller (`shopee`)
- Auth boundary: `shopee-oauth`
- Live connector actions: `read_products`, `manage_products`, `read_orders`
- Full absorbed capability set: `read_products`, `manage_products`, `read_orders`
- Native Magnanimous target: `commerce-engine`
- External boundary: account authorization/live provider data or delivery remains replaceable.
- Official research references: <https://open.shopee.com/>

### X (`x`)
- Auth boundary: `oauth2-pkce`
- Live connector actions: `read_profile`, `read_posts`, `publish_posts`
- Full absorbed capability set: `read_profile`, `read_posts`, `publish_posts`
- Native Magnanimous target: `social-operations`
- External boundary: account authorization/live provider data or delivery remains replaceable.
- Official research references: <https://docs.x.com/x-api>

### Snapchat Business (`snapchat`)
- Auth boundary: `snap-oauth`
- Live connector actions: `read_ad_accounts`, `manage_campaigns`, `analytics`
- Full absorbed capability set: `read_ad_accounts`, `manage_campaigns`, `analytics`
- Native Magnanimous target: `growth-analytics`
- External boundary: account authorization/live provider data or delivery remains replaceable.
- Official research references: <https://developers.snap.com/api/marketing-api/>

### Microsoft Outlook (`outlook`)
- Auth boundary: `oauth2`
- Live connector actions: `read_mail`, `send_mail`
- Full absorbed capability set: `read_mail`, `send_mail`
- Native Magnanimous target: `communications-hub`
- External boundary: account authorization/live provider data or delivery remains replaceable.
- Official research references: <https://learn.microsoft.com/en-us/graph/api/resources/mail-api-overview> · <https://learn.microsoft.com/en-us/graph/api/user-sendmail?view=graph-rest-1.0>

### Slack (`slack`)
- Auth boundary: `oauth2`
- Live connector actions: `read_channels`, `send_messages`
- Full absorbed capability set: `read_channels`, `send_messages`
- Native Magnanimous target: `communications-hub`
- External boundary: account authorization/live provider data or delivery remains replaceable.
- Official research references: <https://docs.slack.dev/apis/web-api/>

### Discord (`discord`)
- Auth boundary: `oauth2`
- Live connector actions: `read_guilds`, `send_messages`
- Full absorbed capability set: `read_guilds`, `send_messages`
- Native Magnanimous target: `communications-hub`
- External boundary: account authorization/live provider data or delivery remains replaceable.
- Official research references: <https://docs.discord.com/developers/intro>

### Telegram (`telegram`)
- Auth boundary: `bot-token`
- Live connector actions: `send_messages`
- Full absorbed capability set: `send_messages`
- Native Magnanimous target: `communications-hub`
- External boundary: account authorization/live provider data or delivery remains replaceable.
- Official research references: <https://core.telegram.org/bots/api>

### Google Calendar (`google-calendar`)
- Auth boundary: `oauth2`
- Live connector actions: `read_calendar`, `manage_calendar`
- Full absorbed capability set: `calendar`, `availability`, `scheduling`, `invitations`, `read_calendar`, `manage_calendar`
- Native Magnanimous target: `scheduling-engine`
- External boundary: account authorization/live provider data or delivery remains replaceable.
- Official research references: <https://developers.google.com/workspace/calendar/api/guides/overview> · <https://developers.google.com/workspace/calendar/api/auth>

## Plugin/provider benchmark research — one by one

The following entries are capability benchmarks already represented in the platform catalog. Their observable capability contract is absorbed into the same Magnanimous per-capability registry. A benchmark entry does **not** imply that a customer account is authorized or that the provider backend has been cloned.

### AI Voice Generator (`ai-voice-generator`)
- Type: plugin/provider benchmark
- Category / priority: `media` / `high`
- Observed capability classes: `text-to-speech`, `voiceover`, `audio-production`, `long-form-narration`
- Native Magnanimous target: `voice-engine`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### AI Video Maker / Seedance-class video (`ai-video-maker`)
- Type: plugin/provider benchmark
- Category / priority: `media` / `high`
- Observed capability classes: `text-to-video`, `image-to-video`, `short-form-video`, `cinematic-generation`
- Native Magnanimous target: `cinema-engine`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### AI Whisper Voice Note Taker (`ai-whisper-notes`)
- Type: plugin/provider benchmark
- Category / priority: `knowledge` / `high`
- Observed capability classes: `voice-notes`, `semantic-note-search`, `transcript-recall`, `spoken-context`
- Native Magnanimous target: `memory-ingestion`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Apollo.io (`apollo`)
- Type: plugin/provider benchmark
- Category / priority: `sales` / `high`
- Observed capability classes: `prospecting`, `contacts`, `accounts`, `outreach-sequences`, `sales-tasks`
- Native Magnanimous target: `sales-intelligence`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### AppDeploy (`appdeploy`)
- Type: plugin/provider benchmark
- Category / priority: `deployment` / `high`
- Observed capability classes: `web-app-deploy`, `versions`, `qa`, `domains`, `backend-secrets`
- Native Magnanimous target: `deployment-operator`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Canva (`canva`)
- Type: plugin/provider benchmark
- Category / priority: `design` / `high`
- Observed capability classes: `design-generation`, `brand-assets`, `social-graphics`, `documents`, `editable-designs`
- Native Magnanimous target: `design-studio`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### AI Color Picker (`ai-color-picker`)
- Type: plugin/provider benchmark
- Category / priority: `design` / `medium`
- Observed capability classes: `color-selection`, `contrast-analysis`, `color-accessibility`, `palette-advice`
- Native Magnanimous target: `design-system-intelligence`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Font Pairing (`font-pairing`)
- Type: plugin/provider benchmark
- Category / priority: `design` / `medium`
- Observed capability classes: `font-pairing`, `typography-systems`, `brand-typography`
- Native Magnanimous target: `design-system-intelligence`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Product Design (`product-design`)
- Type: plugin/provider benchmark
- Category / priority: `design` / `high`
- Observed capability classes: `product-briefs`, `ux-audits`, `user-flows`, `prototypes`, `interactive-concepts`
- Native Magnanimous target: `product-design-agent`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Figma (`figma`)
- Type: plugin/provider benchmark
- Category / priority: `design` / `high`
- Observed capability classes: `ui-design`, `design-systems`, `editable-code-to-design`, `architecture-diagrams`
- Native Magnanimous target: `design-studio`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Magnific (`magnific`)
- Type: plugin/provider benchmark
- Category / priority: `media` / `high`
- Observed capability classes: `image-generation`, `upscale`, `relight`, `video`, `audio`, `3d`, `creative-workflows`
- Native Magnanimous target: `creative-studio`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Deep Art AI (`deep-art-ai`)
- Type: plugin/provider benchmark
- Category / priority: `media` / `medium`
- Observed capability classes: `image-generation`, `video-generation`, `async-video-jobs`, `job-status`
- Native Magnanimous target: `creative-studio`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Krikey AI Animation (`krikey`)
- Type: plugin/provider benchmark
- Category / priority: `media` / `high`
- Observed capability classes: `3d-character-animation`, `text-to-animation`, `music-video`, `high-res-export`
- Native Magnanimous target: `animation-studio`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Explain Video Generator (`explain-video`)
- Type: plugin/provider benchmark
- Category / priority: `media` / `high`
- Observed capability classes: `narrated-explainer`, `diagram-animation`, `document-to-video`, `code-walkthrough-video`
- Native Magnanimous target: `explainer-studio`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### VEED Video Generator (`veed-video`)
- Type: plugin/provider benchmark
- Category / priority: `media` / `medium`
- Observed capability classes: `avatar-video`, `voice-selection`, `share-ready-video`
- Native Magnanimous target: `avatar-studio`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### VideoZero (`videozero`)
- Type: plugin/provider benchmark
- Category / priority: `media` / `medium`
- Observed capability classes: `educational-animation`, `diagram-video`, `narrated-visual-explanation`, `mcp-video`
- Native Magnanimous target: `explainer-studio`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### HeyGen (`heygen`)
- Type: plugin/provider benchmark
- Category / priority: `media` / `high`
- Observed capability classes: `avatar-video`, `image-animation`, `voice`, `lipsync`, `video-translation`
- Native Magnanimous target: `avatar-studio`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Retell AI (`retell-ai`)
- Type: plugin/provider benchmark
- Category / priority: `telephony` / `high`
- Observed capability classes: `voice-agents`, `call-center-automation`, `receptionist`, `outbound-calls`, `call-transfer`
- Native Magnanimous target: `voice-agent-runtime`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Deep Research (`deep-research`)
- Type: plugin/provider benchmark
- Category / priority: `research` / `critical`
- Observed capability classes: `multi-pass-research`, `source-synthesis`, `cited-reports`, `evidence-review`
- Native Magnanimous target: `research-orchestrator`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Tavily AI (`tavily`)
- Type: plugin/provider benchmark
- Category / priority: `research` / `high`
- Observed capability classes: `search`, `scrape`, `crawl`, `structured-web-data`, `rag`
- Native Magnanimous target: `research-orchestrator`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Tailo Lens (`tailo-lens`)
- Type: plugin/provider benchmark
- Category / priority: `research` / `medium`
- Observed capability classes: `claim-analysis`, `academic-sources`, `citation-enrichment`, `prompt-bias-check`
- Native Magnanimous target: `evidence-auditor`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Life Sciences Databases (`life-sciences-db`)
- Type: plugin/provider benchmark
- Category / priority: `research` / `medium`
- Observed capability classes: `genetics-search`, `omics-search`, `chemistry-search`, `clinical-evidence`
- Native Magnanimous target: `scientific-research`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Particl Market Research (`particl`)
- Type: plugin/provider benchmark
- Category / priority: `research` / `high`
- Observed capability classes: `ecommerce-market-research`, `product-catalog-intelligence`, `market-trends`, `sales-timeseries`
- Native Magnanimous target: `commerce-research`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### GitHub (`github`)
- Type: plugin/provider benchmark
- Category / priority: `engineering` / `critical`
- Observed capability classes: `source-control`, `issues`, `pull-requests`, `ci-cd`, `code-review`
- Native Magnanimous target: `engineering-operator`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Manufact (`manufact`)
- Type: plugin/provider benchmark
- Category / priority: `deployment` / `high`
- Observed capability classes: `mcp-server-deploy`, `mcp-apps`, `build-logs`, `runtime-logs`
- Native Magnanimous target: `tool-deployment`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Netlify (`netlify`)
- Type: plugin/provider benchmark
- Category / priority: `deployment` / `high`
- Observed capability classes: `site-deploy`, `env-vars`, `forms`, `domains`, `access-controls`
- Native Magnanimous target: `deployment-operator`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Railway (`railway`)
- Type: plugin/provider benchmark
- Category / priority: `deployment` / `high`
- Observed capability classes: `app-deploy`, `services`, `domains`, `feature-flags`
- Native Magnanimous target: `deployment-operator`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Vercel (`vercel`)
- Type: plugin/provider benchmark
- Category / priority: `deployment` / `high`
- Observed capability classes: `web-deploy`, `project-management`, `build-logs`, `domains`
- Native Magnanimous target: `deployment-operator`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Gmail (`gmail`)
- Type: plugin/provider benchmark
- Category / priority: `productivity` / `high`
- Observed capability classes: `email-search`, `email-read`, `draft`, `send`, `labels`
- Native Magnanimous target: `communications-hub`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Google / Gmail connector (`google`)
- Type: direct connector + benchmark
- Category / priority: `email` / `critical`
- Observed capability classes: `read_mail`, `send_mail`
- Native Magnanimous target: `communications-hub`
- Research basis: live platform connector contract + official API references above
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Facebook Pages connector (`facebook`)
- Type: direct connector + benchmark
- Category / priority: `social` / `high`
- Observed capability classes: `read_pages`, `read_engagement`, `publish_posts`
- Native Magnanimous target: `social-operations`
- Research basis: live platform connector contract + official API references above
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Instagram Business connector (`instagram`)
- Type: direct connector + benchmark
- Category / priority: `social` / `high`
- Observed capability classes: `read_profile`, `read_media`, `publish_media`, `moderate_comments`
- Native Magnanimous target: `social-operations`
- Research basis: live platform connector contract + official API references above
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### WhatsApp Business connector (`whatsapp`)
- Type: direct connector + benchmark
- Category / priority: `messaging` / `high`
- Observed capability classes: `send_messages`, `customer_support`
- Native Magnanimous target: `communications-hub`
- Research basis: live platform connector contract + official API references above
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Shopee Seller connector (`shopee`)
- Type: direct connector + benchmark
- Category / priority: `commerce` / `high`
- Observed capability classes: `read_products`, `manage_products`, `read_orders`
- Native Magnanimous target: `commerce-engine`
- Research basis: live platform connector contract + official API references above
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### X connector (`x`)
- Type: direct connector + benchmark
- Category / priority: `social` / `high`
- Observed capability classes: `read_profile`, `read_posts`, `publish_posts`
- Native Magnanimous target: `social-operations`
- Research basis: live platform connector contract + official API references above
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Snapchat Business connector (`snapchat`)
- Type: direct connector + benchmark
- Category / priority: `marketing` / `medium`
- Observed capability classes: `read_ad_accounts`, `manage_campaigns`, `analytics`
- Native Magnanimous target: `growth-analytics`
- Research basis: live platform connector contract + official API references above
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Microsoft Outlook connector (`outlook`)
- Type: direct connector + benchmark
- Category / priority: `email` / `high`
- Observed capability classes: `read_mail`, `send_mail`
- Native Magnanimous target: `communications-hub`
- Research basis: live platform connector contract + official API references above
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Slack connector (`slack`)
- Type: direct connector + benchmark
- Category / priority: `work` / `high`
- Observed capability classes: `read_channels`, `send_messages`
- Native Magnanimous target: `communications-hub`
- Research basis: live platform connector contract + official API references above
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Discord connector (`discord`)
- Type: direct connector + benchmark
- Category / priority: `messaging` / `medium`
- Observed capability classes: `read_guilds`, `send_messages`
- Native Magnanimous target: `communications-hub`
- Research basis: live platform connector contract + official API references above
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Telegram Bot connector (`telegram`)
- Type: direct connector + benchmark
- Category / priority: `messaging` / `medium`
- Observed capability classes: `send_messages`
- Native Magnanimous target: `communications-hub`
- Research basis: live platform connector contract + official API references above
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Google Calendar (`google-calendar`)
- Type: direct connector + benchmark
- Category / priority: `productivity` / `high`
- Observed capability classes: `calendar`, `availability`, `scheduling`, `invitations`
- Native Magnanimous target: `scheduling-engine`
- Research basis: live platform connector contract + official API references above
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Google Contacts (`google-contacts`)
- Type: plugin/provider benchmark
- Category / priority: `productivity` / `medium`
- Observed capability classes: `contact-resolution`, `people-directory`
- Native Magnanimous target: `people-graph`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Google Drive (`google-drive`)
- Type: plugin/provider benchmark
- Category / priority: `knowledge` / `high`
- Observed capability classes: `drive-search`, `docs`, `sheets`, `slides`, `file-workflows`
- Native Magnanimous target: `workspace-files`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Notion (`notion`)
- Type: plugin/provider benchmark
- Category / priority: `knowledge` / `high`
- Observed capability classes: `docs`, `tasks`, `databases`, `workspace-search`, `knowledge-systems`, `implementation-planning`, `research-synthesis`
- Native Magnanimous target: `knowledge-workspace`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Chat Files (`files`)
- Type: plugin/provider benchmark
- Category / priority: `knowledge` / `high`
- Observed capability classes: `file-library`, `semantic-search`, `document-reading`, `artifact-workflows`
- Native Magnanimous target: `workspace-files`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### HubSpot (`hubspot`)
- Type: plugin/provider benchmark
- Category / priority: `crm` / `high`
- Observed capability classes: `crm`, `marketing-email`, `landing-pages`, `campaigns`, `analytics`
- Native Magnanimous target: `crm-growth-engine`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Zoho CRM (`zoho-crm`)
- Type: plugin/provider benchmark
- Category / priority: `crm` / `high`
- Observed capability classes: `crm`, `sales-automation`, `analytics`, `pipeline-management`
- Native Magnanimous target: `crm-growth-engine`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### BROSH AI CRM (`brosh-crm`)
- Type: plugin/provider benchmark
- Category / priority: `crm` / `high`
- Observed capability classes: `crm`, `projects`, `documents`, `invoices`, `contracts`, `support-tickets`, `marketing-automation`, `mcp`
- Native Magnanimous target: `business-operating-system`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Every AI (`every-ai`)
- Type: plugin/provider benchmark
- Category / priority: `business` / `high`
- Observed capability classes: `invoices`, `tax-calculation`, `proposals`, `clients`, `payments`, `expenses`, `pipeline`, `email`, `calendar`
- Native Magnanimous target: `business-operating-system`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### monday.com (`monday`)
- Type: plugin/provider benchmark
- Category / priority: `operations` / `high`
- Observed capability classes: `projects`, `tasks`, `crm`, `forms`, `workflows`, `agents`, `automations`, `reusable-code-actions`
- Native Magnanimous target: `operations-hub`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### HYPD AI - Paid Ads & Analytics (`hypd-analytics`)
- Type: plugin/provider benchmark
- Category / priority: `marketing` / `high`
- Observed capability classes: `google-ads`, `meta-ads`, `ga4`, `merchant-center`, `roas-analysis`, `wasted-spend-detection`, `keyword-research`, `landing-page-audit`
- Native Magnanimous target: `growth-analytics`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Ahrefs (`ahrefs`)
- Type: plugin/provider benchmark
- Category / priority: `marketing` / `high`
- Observed capability classes: `seo`, `keywords`, `rankings`, `backlinks`, `competitor-analysis`, `ai-search-visibility`
- Native Magnanimous target: `seo-intelligence`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### ActiveCampaign (`activecampaign`)
- Type: plugin/provider benchmark
- Category / priority: `marketing` / `high`
- Observed capability classes: `campaign-analytics`, `contacts`, `tags`, `segments`, `deals`, `automation-enrollment`
- Native Magnanimous target: `marketing-automation`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Intuit Mailchimp (`mailchimp`)
- Type: plugin/provider benchmark
- Category / priority: `marketing` / `high`
- Observed capability classes: `omnichannel-campaigns`, `campaign-strategy`, `campaign-performance`, `brand-assets`
- Native Magnanimous target: `marketing-automation`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Polar Analytics (`polar-analytics`)
- Type: plugin/provider benchmark
- Category / priority: `analytics` / `high`
- Observed capability classes: `shopify-analytics`, `meta-ads`, `google-ads`, `roas`, `cac`, `profitability`
- Native Magnanimous target: `business-analytics`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### LinkedIn (`linkedin`)
- Type: plugin/provider benchmark
- Category / priority: `sales` / `medium`
- Observed capability classes: `professional-lookup`, `profile-discovery`
- Native Magnanimous target: `professional-intelligence`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### vidIQ (`vidiq`)
- Type: plugin/provider benchmark
- Category / priority: `marketing` / `high`
- Observed capability classes: `youtube-analytics`, `keyword-research`, `seo`, `competitor-analysis`
- Native Magnanimous target: `creator-growth-engine`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Stripe (`stripe`)
- Type: plugin/provider benchmark
- Category / priority: `payments` / `critical`
- Observed capability classes: `checkout`, `subscriptions`, `metered-billing`, `payment-links`, `payments`
- Native Magnanimous target: `billing-engine`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Shopify (`shopify`)
- Type: direct connector + benchmark
- Category / priority: `commerce` / `high`
- Observed capability classes: `ecommerce`, `storefront`, `products`, `orders`, `store-management`
- Native Magnanimous target: `commerce-engine`
- Research basis: live platform connector contract + official API references above
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Soluvery (`soluvery`)
- Type: plugin/provider benchmark
- Category / priority: `security` / `high`
- Observed capability classes: `drive-sharing-audit`, `public-file-risk`, `access-review`
- Native Magnanimous target: `security-auditor`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Neon (`neon`)
- Type: plugin/provider benchmark
- Category / priority: `data` / `high`
- Observed capability classes: `postgres`, `branching`, `snapshots`, `auth`, `data-api`, `functions`, `storage`
- Native Magnanimous target: `data-platform`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### OpenAI Platform (`openai-platform`)
- Type: plugin/provider benchmark
- Category / priority: `ai-provider` / `medium`
- Observed capability classes: `api-keys`, `model-provider`
- Native Magnanimous target: `model-router`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Zeiko Agents (`zeiko-agents`)
- Type: plugin/provider benchmark
- Category / priority: `agents` / `medium`
- Observed capability classes: `agent-teams`, `deployment`, `operations`, `approvals`
- Native Magnanimous target: `agent-mesh`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Linked Word (`linked-word`)
- Type: plugin/provider benchmark
- Category / priority: `knowledge` / `high`
- Observed capability classes: `kjv-passages`, `strongs-lookup`, `bible-search`
- Native Magnanimous target: `bible-study-engine`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Midpage Legal Research (`midpage`)
- Type: plugin/provider benchmark
- Category / priority: `legal-research` / `medium`
- Observed capability classes: `case-law-search`, `opinion-review`, `linked-authorities`
- Native Magnanimous target: `legal-research-engine`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Descrybe Legal Engine (`descrybe`)
- Type: plugin/provider benchmark
- Category / priority: `legal-research` / `medium`
- Observed capability classes: `primary-law-search`, `citation-resolution`, `case-treatment`, `quote-verification`
- Native Magnanimous target: `legal-research-engine`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### DirectCase Legal Research (`directcase`)
- Type: plugin/provider benchmark
- Category / priority: `legal-research` / `medium`
- Observed capability classes: `legislation`, `case-law`, `regulatory-decisions`, `company-registers`
- Native Magnanimous target: `legal-research-engine`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

### Token Terminal (`token-terminal`)
- Type: plugin/provider benchmark
- Category / priority: `finance-data` / `low`
- Observed capability classes: `blockchain-metrics`, `onchain-financial-data`
- Native Magnanimous target: `finance-research`
- Research basis: current platform plugin/provider capability contract; provider-specific internals are intentionally not copied
- Absorption action: each capability becomes a provider-neutral Magnanimous workflow specification with Magnanimous-owned planning, memory, policy, normalization, verification, recovery, and learning.

## Verification rules

1. Every provider in `worker/src/integrations.js` must exist in the absorption catalog.
2. Every live connector action must appear in the one-by-one capability manifest.
3. A learned specification is never labeled native merely because it is catalogued.
4. External actions require an actual authorized provider result before Magnanimous claims success.
5. Provider secrets remain server-side and are never copied into learned recipes.
6. A capability may be promoted to native only after an implementation exists and regression/runtime evidence proves it works independently of the benchmark provider.
