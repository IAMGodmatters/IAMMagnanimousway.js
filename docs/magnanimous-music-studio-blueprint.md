# Magnanimous Music Studio capability blueprint

Updated: 2026-09-18

## Purpose
Build a native, provider-neutral generative music department under Magnanimous AI. This is a capability blueprint, not a copy of Suno code, models, branding, private APIs, or proprietary assets. Outside music providers may be attached later as replaceable adapters; Magnanimous remains the orchestration, memory, policy, billing, and identity layer.

## Capability targets
- Prompt-to-song and prompt-to-instrumental generation.
- Lyrics drafting, rewriting, section-aware editing, and single-line replacement.
- Audio upload/record workflows that can extend, transform, arrange, or inspire new work.
- Multimodal creative briefs from text, audio, image, or video references.
- Voice profiles and reusable style/persona profiles with explicit consent and provenance.
- Covers/remixes of user-owned or licensed material; section replacement; extend/crop/fade.
- Remaster workflow with variation-strength control.
- Stem separation: fast category split, isolate-one-source + complement, and advanced instrument selection when a configured engine supports it.
- Generative DAW: multitrack timeline, clips, take lanes, BPM, pitch, time signature, warp, fades, pan, gain, automation, effects, sidechain, convolution reverb.
- MIDI import/record/edit, MIDI-to-audio generation, audio/MIDI export, musical typing, chord/arpeggiator helpers.
- Synth layer with wavetable-style synthesis and reusable presets.
- One-shot sound, loop, sample and foley generation with key/BPM controls.
- Mix/master/export: full mix, selected range, stems/multitracks and metadata.
- Library, playlists, search, pinning, version history, project assets, generated cover art and video artwork.
- Social/video handoff into Magnanimous Video Studio.
- Rights ledger: source ownership/license declaration, voice/likeness consent, generation provenance, commercial-rights metadata and audit trail.
- Cost guardrails: free/native/browser/local engines first; paid adapters require explicit configuration, quotas and funded billing.

## Architecture
1. Magnanimous Music Director
   - Converts natural-language intent into a MusicProjectSpec.
   - Chooses native/free/local engine first, then authorized adapters.
   - Never exposes an outside provider as Magnanimous identity.
2. Composition service
   - Song structure, harmony, tempo/key, lyric sections, instrumentation and arrangement plans.
3. Audio engine adapter interface
   - generateSong, generateStem, extend, remix, replaceSection, remaster, generateSound.
4. Voice/style registry
   - Consent-bound voice IDs, style profiles, provenance and revocation.
5. Studio engine
   - Non-destructive project graph for tracks, clips, takes, MIDI, automation, effects and versions.
6. Stem service
   - Local/open models when practical plus optional replaceable adapters.
7. Render/export service
   - Mixdown, stems, WAV/MP3/MIDI, cover media and handoff to video/social tools.
8. Safety/rights service
   - Rejects unauthorized impersonation, records source rights and blocks publication/export when required rights are unresolved.
9. Usage/billing service
   - Meter expensive generation separately; enforce prepaid/fair-use limits before provider spend.

## Initial API contract
- GET /api/music/capabilities
- POST /api/music/projects
- GET /api/music/projects/:id
- POST /api/music/generate
- POST /api/music/lyrics
- POST /api/music/upload
- POST /api/music/extend
- POST /api/music/remix
- POST /api/music/replace-section
- POST /api/music/remaster
- POST /api/music/stems
- POST /api/music/sounds
- POST /api/music/midi
- POST /api/music/voices
- POST /api/music/styles
- POST /api/music/render
- GET /api/music/exports/:id

## Provider adapter contract
Every adapter reports:
- provider id, model id and capability flags
- configured/healthy state
- expected cost class and quota
- supported max input/output duration
- commercial-use metadata when known
- whether voice, stems, MIDI, remix, remaster and section edits are supported

Provider-specific credentials remain server-side and encrypted. No adapter owns project memory or user identity.

## Data model
MusicProject: tenant_id, owner_id, title, status, tempo, key, time_signature, duration, rights_status, created_at, updated_at.
MusicTrack: project_id, kind, instrument, voice_id, gain, pan, muted, solo.
MusicClip: track_id, source_asset_id, start, duration, offset, pitch, warp, generation_id.
MusicGeneration: project_id, operation, prompt, model/provider metadata, cost, provenance, parent_generation_id.
MusicAsset: tenant_id, type, storage_key, checksum, mime, duration, source_type, rights_declaration.
MusicVoice: tenant_id, owner_id, consent_record, verification_state, revocation_state.
MusicExport: project_id, format, scope, storage_key, rights_snapshot.

## UX
Add a protected **Music Studio** beside Video Studio. Keep the first screen simple:
1. Describe the song or upload/record an idea.
2. Choose Song, Instrumental, Sound/Loop, Remix, or Studio.
3. Generate.
4. Edit with plain-language commands or timeline controls.
5. Export/download or send to Video Studio/Social.

Advanced controls remain behind an Advanced Studio button so the basic workflow stays understandable.

## QA gates
- Tenant isolation and authorization on every project/asset.
- No client-exposed provider secrets.
- Voice creation requires consent/verification state.
- Source-rights declaration for uploaded remix/cover material.
- Idempotent generation/render jobs.
- Cost ceiling enforced before paid calls.
- Cancellation/retry does not double-charge.
- Project/version recovery after failed generation.
- Mobile keyboard/touch timeline smoke tests.
- WAV/MP3/MIDI/stem export validation.
- Accessibility labels and keyboard navigation.
- Provider outage falls back without deleting the project.
- Outside provider names do not become Magnanimous public identity.

## Implementation sequence
Phase 1: Music Studio route, project schema, capability registry, lyrics/composition planning, audio upload/library and provider-neutral job contract.
Phase 2: native/local audio utilities, waveform editor, basic mix, crop/fade, WAV export and video handoff.
Phase 3: generation adapters, extend/remix/replace/remaster, stem separation, voice/style profiles.
Phase 4: multitrack DAW, MIDI, automation/effects/synth, loops/samples, advanced exports.
Phase 5: publishing workflows, playlists, cover media, commercial-rights ledger, metering and production QA.

## Current research basis
The capability targets were derived from publicly documented modern generative-music workflows, including Suno's September 2026 v6 features and Studio 2.0 documentation. Implementation must use original Magnanimous code and lawful/native/open/provider APIs only; do not scrape or reproduce proprietary model weights, private endpoints, source code, branded UI, or restricted assets.
