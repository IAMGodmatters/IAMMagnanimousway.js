# Magnanimous Companion — screen-aware assistance

Date: 2026-09-22

## Purpose

Magnanimous Companion adds a first-party screen-aware assistance surface to I AM MAGNANIMOUS WAY™ without changing the platform's single-brain architecture. Magnanimous AI remains the identity, reasoning, memory, orchestration, verification and policy layer. The Companion is a capability surface, not a second AI identity.

This implementation is a clean-room Magnanimous feature based on public interaction patterns common to screen-aware assistants. It does not copy HeyClicky's proprietary binary, source code, hidden prompts, credentials, model weights, private APIs, branding or protected implementation.

## Native capabilities

The /companion workspace provides:

- user-triggered browser screen/window sharing;
- a one-frame capture model rather than continuous screen surveillance;
- screenshot upload fallback for devices or browsers without screen sharing;
- voice or typed requests;
- screen explanation;
- numbered visual walkthroughs with normalized point/box annotations;
- drafting from visible screen context;
- direct conversion of useful guidance into a reusable Magnanimous Skill;
- handoff links into Routine Studio and Magnanimous specialist departments.

The API lives at:

- GET /api/magnanimous/companion/capabilities
- POST /api/magnanimous/companion/analyze

## Privacy and safety contract

The browser does not transmit the shared screen continuously. A frame is created only when the user explicitly captures or uploads an image, and it is sent only when the user presses Analyze.

The Companion runtime does not write the screenshot to Magnanimous storage. The screenshot is treated as untrusted visual input, including visible text that may attempt prompt injection. The analysis endpoint is intentionally read-only and does not claim to click, type, send, publish, pay or change settings.

Existing platform approval gates remain authoritative for consequential actions.

## Vision execution

The runtime uses the platform's existing Workers AI binding and the vision-capable @cf/qwen/qwen3.8-27b route. Provider selection remains private infrastructure under Magnanimous AI. If the AI binding is unavailable, the capability reports that truthfully instead of pretending that image understanding succeeded.

The client downsizes the selected frame before transmission and accepts PNG, JPEG and WebP input. The server enforces an input-size limit.

## Skill growth

A completed Companion analysis can be saved through the existing Routine Studio skill API. That creates a Magnanimous-owned reusable prompt skill containing the user's original intent and the verified guidance from that frame. Scheduling and durable run history continue to belong to Routine Studio.

## Verification

qa/scripts/magnanimous-companion-lock.mjs prevents regressions in the key contracts:

- user-triggered capture;
- no background screen monitoring;
- no screenshot persistence claim;
- visual prompt-injection defense;
- read-only action truth;
- screen sharing and upload fallback;
- voice input;
- visual annotations;
- reusable-skill handoff;
- home and capability-registry wiring.

## Paired desktop integration

The Companion uses the existing Magnanimous Local Bridge already paired with the owner's Windows computer. It does not create a second remote-control daemon or expose an inbound network listener.

- GET `/api/magnanimous/local-bridge` discovers the current paired device and its advertised capabilities.
- `browser_read_flow` runs a read-only page inspection through the local Playwright browser.
- `browser_profile_setup` opens a local browser sign-in window. The owner signs in on the computer; credentials remain in the local browser profile.
- `browser_action_flow` stages a specific browser interaction. The platform marks it `needs_confirmation`; the owner must confirm the exact task before the local agent can claim it.
- Task results and browser receipts are returned through the existing tenant-scoped Local Bridge task API.

Only public HTTP/HTTPS targets are accepted. Local and private-network targets are blocked. Remote browser tasks cannot fill password/secret fields. The Companion does not expose arbitrary shell commands, system-wide mouse/keyboard injection, or continuous desktop surveillance. Screen capture remains explicitly started by the user in the browser.

## Usage and cost protections

The vision endpoint is disabled when either the Workers AI binding or the durable database binding is unavailable. It also fails closed if the existing migrated `security_rate_limits` table cannot enforce usage limits.

- One inference per user per minute.
- Three inferences per tenant per UTC day.
- Six inferences across the deployment per UTC day.
- Maximum 1,200 generated completion tokens per inference, with low reasoning effort.
- Image payloads are bounded to 1.45 million characters.
- Invalid or oversized images are rejected before consuming an inference allowance.

These caps are additional protections; they do not replace Cloudflare account-level Neuron monitoring or the platform's existing billing controls for other AI services. No paid speech provider or additional compute service is required for browser-native voice input/output.
