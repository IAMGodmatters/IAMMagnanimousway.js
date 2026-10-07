# Artlist clean-room creative control-plane research — 2026-10-07

## Purpose

Research the current public Artlist Max / AI / Studio / Agent / editor / MCP capability surface and absorb useful product patterns into Magnanimous AI without copying Artlist proprietary implementation, paid assets, hidden prompts, private datasets, model weights, credentials, branding or licensed catalog files.

Magnanimous AI remains the identity, memory, planning, policy, orchestration, verification and learning layer. Third-party models, stock providers, editor extensions and MCP services remain replaceable infrastructure.

## Official public source ledger

- https://artlist.io/page/pricing/max
- https://help.artlist.io/hc/en-us/articles/29559277294237-Artlist-Max-plan-explained
- https://artlist.io/blog/new-ai-toolkit/
- https://artlist.io/blog/how-to-use-artlist-ai-toolkit/
- https://artlist.io/blog/new-artlist-ai-agent/
- https://artlist.io/blog/new-artlist-ai-studio-launch/
- https://artlist.io/blog/how-to-use-artlist-ai-studio/
- https://artlist.io/blog/new-ai-music-generator/
- https://artlist.io/blog/the-best-mcp-connectors-for-ai-image-and-video-generation-in-2026/
- https://artlist.io/blog/artlist-ai-premiere-pro-plugin/
- https://artlist.io/tools
- https://artlist.io/plugins
- https://artlist.io/help-center/privacy-terms/artlist-license

## Public Artlist capability map

### Max plan and stock

Current public Max materials describe an all-in-one plan combining AI creation with music/stems, SFX, footage, templates, LUTs, plugins/extensions and Artlist Studio. The pricing page currently presents Max at multiple monthly AI-credit levels billed annually. Public help materials show 7,500, 16,500, 40,000 and 80,000-credit examples, with higher tiers available in current pricing materials. Unlimited generation on select models appears only at qualifying tiers and remains subject to current plan/model rules. RAW/LOG footage is an optional paid upgrade.

### AI Toolkit

The Toolkit is a multi-model surface rather than a single-model product. Public Artlist materials describe 100+ models in the current Max pricing experience and expose filters by provider/brand, feature, best-for attributes, specs, duration, resolution and aspect ratio.

Representative publicly named model families include Veo, Kling, Seedance, Nano Banana/Gemini image, Grok Imagine, Wan, LTX, GPT Image, Ideogram, ImagineArt, Hunyuan, Z-Image, HeyGen avatars, OmniHuman avatars, Lyria music, MiniMax voice, Cartesia and ElevenLabs. Availability changes over time and must be checked at execution time.

### AI Agent

The Agent is a conversational layer over the creative tools. Publicly documented behavior includes contextual iteration, prompt enhancement, model recommendations, text-to-image, image-to-image, image-to-video, video editing, targeted edits, style/reference application, plan/credit visibility and switching between automatic Agent mode and precise Standard mode.

### Studio

Studio publicly centers on consistent end-to-end production: cast/create characters, build/reuse locations, frame scenes, direct camera/action, continue from a selected frame and preserve visual continuity across a sequence.

### Voice, avatars and localization

Public materials describe multilingual AI voiceover, multiple voice providers/models, voice-changing/cloning options in the broader Toolkit, avatar generation, lipsync, reframe, upscale and translation/localization workflows. Any likeness-sensitive use must remain consent-gated in Magnanimous.

### AI music

Artlist publicly identifies Google Lyria 3 / Lyria 3 Pro in its AI music offering and describes text-to-music and image-guided music creation. Magnanimous treats music generation as provider-neutral replaceable compute and does not assume access to Lyria or any Artlist model without a funded authorized rail.

### MCP

Artlist publicly describes an MCP connector that exposes 100+ models to supported clients and returns generated media to the Artlist library using the user's Artlist account and credit pool. Magnanimous absorbs the architectural pattern: one Magnanimous-owned MCP-compatible tool contract, private capability-based routing, shared project context and media return, while providers remain replaceable.

### Premiere/editor workflow

Artlist publicly describes a Premiere Pro panel that brings image, video, music, voiceover, avatar and editing actions into the timeline, with library synchronization. Artlist also describes its Hub, Library extension, AI Assistant and 50+ editing plugins across major editors. Magnanimous absorbs the in-context editor-panel pattern, not Artlist binaries or proprietary plugins.

### License / rights constraints

Artlist's current public license states that licensed Assets may not be copied/distributed as standalone stock, used to compete with Artlist, or included in datasets for machine learning, AI training or development/improvement of AI technologies. The license also places conditions on use of Assets as inputs to AI services. Magnanimous therefore records provenance/license metadata and explicitly prohibits silently using licensed stock for model training or fine-tuning.

## Implemented in Magnanimous AI

### New clean-room capability registry

`worker/src/magnanimous-artlist-capability-registry.js`

Defines 40+ provider-neutral capability contracts covering:

- conversational creative agent mode
- precision/standard mode
- creative session memory
- prompt enhancement
- automatic capability/model matching
- image/video generation and editing
- start/end frame and multi-reference control
- motion control and reference-style abstraction
- reusable characters, locations, framing and shot direction
- avatars, lipsync, voiceover, consent-gated voice cloning/changing
- AI music
- stock discovery without catalog copying
- unified media library and generation-history reuse
- budget/credit preflight
- parallel-generation queue control
- render tracking
- MCP-compatible creative bridge
- editor-panel workflow
- reframe, upscale and localization
- commercial-rights/provenance ledger
- explicit prohibition on licensed-stock training/fine-tuning

### Single-brain integration

`worker/src/magnanimous-single-brain-contract.js`

Adds the Artlist benchmark to the single-brain capability count and native-target map, and adds explicit creative-control-plane rules:

- creative context and routing belong to Magnanimous AI
- external models/providers stay replaceable
- free/native first
- variable-cost generation requires funded preflight
- media provenance is recorded
- licensed third-party stock is excluded from model training

### Video Director upgrade

`worker/src/magnanimous-video-director.js`

Now includes:

- `agent` and `standard` creation modes
- capability-based, provider-neutral model matching metadata
- quality/speed/cost preference
- explicit user-selected model override metadata without exposing provider selection publicly
- native/free-first budget preflight and zero-unfunded-variable-cost default
- resumable project/session context
- reusable prior-asset context
- source/license/consent/model provenance policy
- licensed-stock training prohibition

These additions preserve the existing workflows and routes rather than removing working behavior.

## Cost policy

This implementation creates no new Artlist subscription and no automatic paid usage. Magnanimous may use an Artlist or other provider rail only after the user has an authorized compatible account/plan and current funding/billing policy permits the variable cost. Native, browser, local and already-funded options remain preferred.

## Truth boundaries

This research does **not** reveal or claim knowledge of Artlist's hidden prompts, private routing, source code, internal security architecture, training datasets, model weights or unpublished agreements.

A public Artlist feature does not prove Magnanimous can execute it today. Runtime readiness requires an actual authorized rail plus successful evidence for the requested operation.

## Verification

`qa/scripts/magnanimous-artlist-capability-lock.mjs` validates:

- official source provenance
- clean-room/non-copying boundaries
- minimum capability coverage
- likeness/consent gates
- no assumed Artlist runtime dependency
- creative agent and precision modes
- provider-neutral capability matching
- budget preflight
- resumable project context
- provenance/license controls
- licensed-stock training prohibition
- single-brain integration

The lock is included in `frontend/package.json` `platform-contract-audit`, so it runs as part of the existing build verification path.

### Server-side Director planning boundary

The live Video Director requests planning through the authenticated `/api/movie-maker/director-plan` Worker route. The browser never imports Worker source directly, and `/api/movie-maker/video` recomputes `director_input` server-side before execution so client-supplied planner metadata cannot override the Magnanimous-owned brain, funding, rights, or provider-readiness policy.
