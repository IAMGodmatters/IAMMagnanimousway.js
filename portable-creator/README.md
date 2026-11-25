# Magnanimous Portable Creator

A Windows-first, offline-first creator workspace designed to live on an external USB SSD. Magnanimous AI remains the product identity; local executables and model runtimes are replaceable execution tools. For current official provider capabilities and authorization gates, see [the LIVE provider readiness research](../docs/live-studio/provider-adapter-readiness-2026-11-25.md).

## What this first slice does

- Serves a local-only creator workspace from `127.0.0.1`.
- Uses a local GGUF model through a loopback-only `llama-server` when a model and runtime are installed.
- Creates scripts, lessons, livestream rundowns, storyboards and creative outlines without sending prompts to a cloud API.
- Stores saved projects in an AES-256-GCM encrypted vault on the removable drive. The passphrase is not stored by the app; the key is held in memory only while the vault is unlocked.
- Does not download binaries or models, enable telemetry, open a LAN listener, run shell commands from the browser, or connect to external providers.
- Can optionally start a portable OBS installation. The local creator includes an authenticated OBS WebSocket v5 control adapter for scene listing, scene switching and recording start/stop. OBS must already be installed/running with its WebSocket server enabled; this adapter does not install OBS or drivers.
- OBS pairing is restricted to `127.0.0.1:4455`. The password is sent only to the local host for the OBS challenge handshake, is not stored in the vault or browser storage, and is not forwarded to any cloud service. The adapter subscribes only to scene and output state events and places scene/stream/recording changes into the durable review queue. Scene switching and recording still require explicit operator clicks.

This is a working local creator foundation, not yet the finished cross-platform USB broadcast appliance. The first Windows build requires compatible runtime binaries and an optional, separately licensed model to be placed in the documented folders.

## Windows folder layout

```text
Magnanimous-Portable/
  Start-Magnanimous-Portable.cmd
  launch-windows.ps1
  host.mjs
  app/
    index.html
    app.js
    styles.css
  data/                       created on first launch
    vault.enc                 encrypted project vault\n    live-events.jsonl         durable LIVE event journal and delivery receipts
    browser-profile/          only when portable Chromium is supplied
    cache/
    logs/
    workspace/
    exports/
  models/
    magnanimous.gguf          optional local language model
  runtime/
    node/node.exe             reviewed Node.js Windows x64 runtime
    llama.cpp/llama-server.exe
    obs/                      optional OBS Windows ZIP distribution
    browser/chrome.exe        optional portable Chromium distribution
```

## First start

1. Copy the complete folder to a USB SSD or another writable drive.
2. Add a reviewed Node.js 20+ Windows x64 runtime under `runtime/node/node.exe`, or use an existing Node.js 20+ installation for development.
3. For offline AI generation, add a compatible `llama-server.exe` under `runtime/llama.cpp/` and a GGUF model at `models/magnanimous.gguf`. The launcher never downloads either file.
4. Double-click `Start-Magnanimous-Portable.cmd`.
5. The browser opens at `http://127.0.0.1:3219`. On first use, create a passphrase of at least 12 characters. Save it somewhere safe; the project vault cannot be recovered without it.
6. Write content locally and choose **Save encrypted to USB** to persist a project.

To open the optional portable OBS folder, start the launcher with `-LaunchOBS`. The application itself does not install device drivers or elevate privileges.

## Local OBS control

1. Start OBS Studio on the same computer.
2. In OBS, open **Tools → WebSocket Server Settings** and enable the WebSocket server (OBS Studio 28+ includes it). Keep the default local port `4455`; use a password and enter it only into the local Magnanimous OBS panel.
3. Connect, refresh scenes, select a scene and explicitly switch. Start/stop recording only when you choose.
4. Disconnect when finished. If OBS is not installed or the WebSocket server is disabled, the panel reports that it cannot connect; it does not install software or expose OBS to the network.

This control path is local production only. It does not start a public livestream, connect a social account, or join Zoom. A real OBS hardware smoke test remains required before describing it as operational on a particular computer.

## Local live-event runtime

The portable host now exposes a bounded, loopback-only event intake for future authorized platform and game adapters:

- `GET /api/live/events/status` reports queue depth, capacity and deduplication state.
- `POST /api/live/events/ingest` accepts a protocol-version-1 event in a JSON `event` field.
- `POST /api/live/events/consume` claims a bounded batch (1–50 events) under a short delivery lease.
- `POST /api/live/events/ack` acknowledges exact provider-scoped event keys only after the local UI has rendered the batch successfully.

Browser intake accepts operator-entered `manual` events only; provider-labelled events must arrive through a future authenticated local companion adapter. The runtime validates provider, event type, event ID and timestamp; removes control characters; bounds viewer text and tags; strips credential-like tag names; deduplicates provider event IDs; applies a per-provider rate limit; and returns backpressure when the queue is full.

Accepted events are appended to a USB-rooted JSONL journal and synchronously flushed before the intake endpoint confirms acceptance. Pending events and deduplication keys survive host restarts. Delivery uses expiring leases: if the application closes before acknowledgement, an event becomes available again after the lease expires. Acknowledgements are idempotent and use provider-scoped keys so two providers can safely use the same event ID. The journal compacts atomically after it reaches its size threshold, retains a bounded deduplication window, and recovers complete records if the final write is truncated. If storage fails, new intake pauses and returns an explicit storage error rather than pretending the event was saved.

The endpoints are a local event-processing foundation only: no TikTok, Facebook, YouTube, Twitch or game adapter is connected by this change. Public broadcasting, account control, moderation and payments are not exposed.

The portable UI includes an operator-controlled event review panel. It acknowledges a batch only after rendering it; unacknowledged events are retried after their lease expires. Browser intake accepts manual events only; it cannot impersonate a TikTok, Facebook, YouTube, Twitch or game adapter. Unit and runtime QA cover restart recovery, duplicate suppression, leases, acknowledgements, provider-scoped IDs, truncated-tail recovery, spoofed-provider rejection and queue backpressure.

## Broadcast and Zoom boundaries

Offline mode can prepare the show, assets, script, overlays and avatar plan. It cannot transmit to TikTok, Facebook, YouTube, Twitch or Zoom without a network connection. The online LIVE Studio uses the provider-neutral event bridge and separate authorized adapters.

For an existing Zoom desktop meeting, the practical bridge is OBS Virtual Camera plus an audio input selected in Zoom. On Windows, OBS documents a one-time administrator step to install the virtual-camera driver; this launcher deliberately does not install it. A native Zoom Video SDK integration is a separate, credentialed application path.

## Portability is operating-system specific

A USB drive is a storage container, not a universal executable format. Windows x64, Windows ARM64, macOS Apple Silicon/Intel and Linux require separately built and signed runtimes. USB write speed, RAM, CPU/GPU, OS permissions, camera/audio drivers and available codecs determine what works on a particular machine.

OBS Portable Mode keeps OBS configuration beside the application on Windows, but OBS notes that scene media references also need portable paths. Do not assume a portable scene collection is self-contained until every media file is verified.

## Security and privacy

- Host binds only to IPv4 loopback `127.0.0.1`; it is not available to other devices on Wi-Fi.
- Only same-origin browser requests are accepted for state changes.
- The local model target is fixed to `127.0.0.1:9931`; browser inputs cannot choose a URL or issue shell commands.
- The encrypted vault uses scrypt key derivation and AES-256-GCM authenticated encryption. It is locked when the local host exits.
- Model and voice license terms differ by model. Review the exact model card/license before redistribution or commercial use.
- The drive itself should also use BitLocker To Go or another whole-drive encryption method when it stores private material. The vault encrypts project contents, not the folder names or all runtime binaries.

## Runtime licenses and supply chain

This repository does not bundle third-party binaries or model weights. The package builder must record exact upstream version, source URL, cryptographic checksum, license, notices, build options and any patent/codec implications for each binary. Piper's code is GPL-3.0-or-later and each voice model has its own licensing terms; neither is bundled by default. FFmpeg build licensing depends on enabled components and codecs. OBS and Chromium redistributions must retain their applicable notices.

## Remaining phases

1. Add verified Windows x64 runtime packaging and hardware-based model profiles.
2. Add portable media/graphics assets and offline local TTS/transcription adapters with per-model license review.
3. Add OBS scene import/export with relative USB media paths, audio routing diagnostics and one-button local recording.
4. Add Windows ARM64, macOS and Linux release bundles and signed manifests.
5. Add authorized YouTube, Facebook, Twitch, TikTok and Zoom adapters when online, with account-specific permissions and live verification.
6. Add end-to-end USB removal/reinsertion, drive-letter change, disk-full, passphrase recovery, crash recovery and cross-device portability tests.

Do not treat a successful local build as proof that every device, camera, game, driver or streaming account is compatible.
\n## Magnanimous show director\n\nThe local show director turns validated audience and game events into bounded review cues (welcome, reply prompt, game commentary, poll update, thank-you and production notes). It never speaks, changes OBS scenes, posts, moderates, spends money or controls a game. Every cue is marked `requiresOperatorApproval: true` and `action: review-only`; viewer text is not copied into instruction prompts. Cues expire after 45 seconds by default and are generated only for the events the operator pulls from the local queue.\n\n## Cross-device reality\n\nA USB SSD can carry the Magnanimous workspace, models, media and Windows OBS Portable files, but it cannot make one binary or one OBS profile work unchanged on every operating system. OBS Portable Mode is Windows-only and its media references need relative/common paths. The launcher must detect the OS/architecture, use the matching native runtime, and keep project files portable. Public streaming and Zoom meetings still need network access.\n