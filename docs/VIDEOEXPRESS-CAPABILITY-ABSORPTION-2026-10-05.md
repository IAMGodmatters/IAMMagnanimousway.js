# VideoExpress public capability absorption — 2026-10-05

## Goal

Absorb the useful, publicly documented **capability classes and production techniques** of VideoExpress AI into the I AM MAGNANIMOUS WAY™ platform while keeping **Magnanimous AI** as the identity, memory, creative director, policy layer, workflow orchestrator and verifier.

This is a **clean-room functional benchmark**, not a copy of VideoExpress software. The implementation does not copy proprietary source code, hidden prompts, model weights, private datasets, private workflow implementation, credentials, paid assets or branding. VideoExpress remains a benchmark source only; it is not a runtime dependency.

## Official public sources reviewed

Verified 2026-10-05:

1. https://videoexpress.ai/go/ — primary product/feature page.
2. https://videoexpress.ai/tutorials/ — current tutorials and feature demonstrations.
3. https://videoexpress.ai/workflow/ — public workflow library for narrative, consistency, motion graphics, shorts, documentary, animation, talking video and automation.
4. https://videoexpress.ai/talkingphotos/ — talking/singing/dancing characters, action replication and related avatar workflows.
5. https://videoexpress.ai/access/bundle/ — bundled feature surface including prompt-to-video, image-to-video, motion/editing and timeline functions.
6. https://videoexpress.ai/access/commercial/ — commercial feature surface including editor/captions/TTS/recording.
7. https://videoexpress.ai/l/elite/index.html — additional talking-photo and text-to-sound positioning.
8. https://videoexpress.ai/terms/terms.php — ownership/terms boundary confirming proprietary technology remains theirs.

## Magnanimous implementation

### 1. Clean-room capability registry

`worker/src/magnanimous-videoexpress-capability-registry.js`

The registry contains **56 provider-neutral capability contracts** across 11 existing Magnanimous native targets. Each contract records:

- observable public outcome;
- Magnanimous native target;
- techniques necessary to reproduce the outcome independently;
- external/native-compute boundary;
- rights/consent and risk classification;
- acceptance tests;
- free/native-first execution recipe;
- official source provenance;
- explicit `proprietary_implementation_copied:false` truth marker.

### 2. Magnanimous Video Director

`worker/src/magnanimous-video-director.js`

The first-party planner adds 11 reusable production workflows:

- creative video;
- narrative story;
- consistent-character story;
- viral short;
- motion-graphics explainer;
- documentary;
- animated short;
- realistic talking head;
- product demo;
- first/last-frame transition;
- music/performance video.

The Director compiles user intent into scenes, duration, camera language, character continuity, product anchors, first/last frame descriptions, audio direction, captions and editing instructions. It remains provider-neutral and marks proprietary prompt copying as false.

### 3. Single-brain wiring

`worker/src/magnanimous-single-brain-contract.js`

The Magnanimous single-brain summary now exposes:

- the 56 absorbed video capability IDs;
- VideoExpress benchmark provenance/status;
- the Magnanimous Video Director summary and route;
- the added native targets;
- likeness-media consent gates;
- funded-specialized-compute-only policy.

This makes the new video skill surface visible to the existing provider entrypoint through the already-established single-brain contract, without making VideoExpress part of Magnanimous identity or routing.

### 4. User-facing workspace

`frontend/app/video-director/page.tsx`

New route: `/video-director`

The workspace can:

- select one of the 11 Director workflows;
- accept a full idea/script;
- define a character bible;
- define a product anchor;
- define first and last frame intent;
- specify camera direction and visual style;
- upload up to 14 authorized reference images;
- compile a scene-by-scene production plan;
- send the compiled production prompt to the existing `/api/movie-maker/video` execution route;
- track existing Movie Maker async studio jobs;
- route finished work into the native Video Stack and connected social publishing surfaces.

The UI explicitly says that a capability contract is not proof that every advanced temporal edit is live. Unsupported operations are not represented as completed.

## Public capability coverage

### Generation and continuity

- text-to-video
- image-to-video
- reference-image conditioning
- single-character consistency
- multi-character consistency
- first/last-frame control
- camera direction from prompt
- camera-angle planning
- directed regional motion / motion brush
- video extension

### Visual editing

- video inpainting
- video outpainting
- object removal
- object add/replace
- background removal
- background replacement/editing
- guided video repair / smart edit
- trim/split/reorder
- multi-clip timeline
- transitions/effects

### Audio, captions and speech

- separate audio/video
- audio waveform planning
- automatic captions
- caption repair
- text-to-speech narration
- voice transformation
- consent-gated voice likeness
- text-to-sound effects
- lip sync

### Character and avatar production

- talking character
- full-body talking character
- singing character
- dancing character
- consent-gated action replication
- consent-gated face swap
- consent-gated avatar swap
- original character generation
- character stylization

### Workflow intelligence

- creative mode / idea expansion
- AI prompt writer
- narrative story workflow
- consistent-character long-form workflow
- motion-graphics explainer
- viral short workflow
- documentary workflow
- animated short workflow
- realistic talking-head workflow
- product demo workflow
- reusable video automation workflow

### Capture, library and delivery

- screen recording contract
- voice recording contract
- media gallery management
- asynchronous render progress tracking
- authorized external creative import
- social-format export
- commercial-rights/provenance tracking

## Existing Magnanimous overlap preserved

The implementation adds to the existing Movie Maker, Video Stack, Media Library, Video Agents, voice, social and render surfaces. It does not remove their current behavior. The current Movie Maker remains the execution route for actual generation; Video Director adds richer Magnanimous-owned planning and capability knowledge above it.

## Rights and safety boundary

Face, voice, avatar and performance-likeness operations are treated as identity-sensitive. Contracts require authorization/consent and explicitly prohibit deceptive impersonation. Source media, logos, music and copyrighted material still require the user to have the right to use them.

## Cost boundary

Planning/orchestration is native and free-first. Specialized generation/render compute is replaceable and may be used only when the current Magnanimous billing/funding guard allows it. The registry does not create a new VideoExpress subscription or runtime dependency.

## Verification lock

`qa/scripts/magnanimous-videoexpress-capability-lock.mjs`

The lock verifies the source ledger, minimum capability set, clean-room truth markers, consent gates, Director workflow set, compiled continuity/first-last-frame behavior, single-brain wiring, UI execution route and absence of a VideoExpress runtime API dependency.
