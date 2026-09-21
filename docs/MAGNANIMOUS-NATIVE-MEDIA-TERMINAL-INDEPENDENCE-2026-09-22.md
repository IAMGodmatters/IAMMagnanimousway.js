# Magnanimous Native Media + Terminal Independence — 2026-09-22

## Goal

Make I AM MAGNANIMOUS WAY™ / Magnanimous AI own the product behavior and orchestration for media creation and SSH/terminal work without requiring HeyGen or Hey Terminal.

This work reproduces observable capability classes and safe workflow contracts only. It does **not** copy proprietary source code, hidden prompts, private model weights, credentials, or provider internals.

## Native media surface

Magnanimous now owns provider-neutral contracts for:

- assets and batch asset handling
- photo, prompt, and digital-twin style avatar workflows
- avatar video and image-to-video planning
- speech, voice selection, voice design/clone contracts, and pronunciation glossaries
- studio/multi-scene video workflows
- lip-sync, dubbing/translation, clipping, filler-word cleanup, and captions
- brand kits, style rules, templates, audio/music/SFX discovery contracts
- job/batch status and cancellation contracts

The live HeyGen tool surface remains a **benchmark ledger only**. The native media module reads the existing visible-contract snapshot so newly recorded benchmark tools remain measurable without turning HeyGen into a runtime dependency.

Current free-first execution:

1. Browser speech + animated avatar remains available with no paid provider.
2. The existing owner-controlled `FREE_AVATAR_RENDERER_URL` can perform photorealistic avatar rendering through a LivePortrait/Wav2Lip-compatible worker.
3. Heavy GPU functions such as high-quality lip-sync, dubbing, image animation, voice cloning, or batch rendering still require actual compute somewhere. Those workers are replaceable capacity, not Magnanimous identity.

## Native terminal / SSH surface

Magnanimous now owns:

- SSH profile discovery from local `~/.ssh/config`
- read-only diagnostic command execution
- command risk classification
- secret/private-key rejection and redaction
- rollback planning
- state-changing command staging and explicit confirmation
- exit-code/stdout/stderr interpretation

Execution runs through Magnanimous Local Bridge. SSH keys and passwords stay on the owner-controlled machine. The server receives only a safe SSH host alias and the exact command.

The Local Bridge does **not** expose an interactive generic remote shell. Read-only commands are allowlisted. Anything outside that set is confirmation-gated.

## Capability Mesh routes

Native media:

- `media.summary`
- `media.catalog`
- `media.plan`
- `media.render_avatar`
- `media.glossary_apply`
- `media.template_render`

Native terminal:

- `terminal.summary`
- `terminal.catalog`
- `terminal.classify`
- `terminal.profiles`
- `terminal.read`
- `terminal.stage`
- `terminal.interpret`

## Truthful readiness

Code availability is not the same as live execution.

- Media orchestration: native.
- Free browser avatar: native.
- Self-hosted avatar rendering: live only when the owner-controlled renderer endpoint is configured and responds successfully.
- Terminal planning/classification: native.
- SSH execution: live only when a paired Local Bridge with OpenSSH is online.
- State-changing SSH: never auto-executed; it must pass the existing confirmation flow.

## Verification

`.github/workflows/native-media-terminal-check.yml` checks JavaScript syntax, Python syntax, independence constraints, the SSH safety contract, Capability Mesh wiring, and whitespace.
