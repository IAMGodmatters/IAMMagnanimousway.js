# Magnanimous Portable Creator

A Windows-first, offline-first creator workspace with an optional secure online companion connection, designed to live on an external USB SSD. Magnanimous AI remains the product identity; local executables, cloud relays and model runtimes are replaceable execution tools.

## What this first slice does

- Serves a local-only creator workspace from `127.0.0.1`.
- Uses a local GGUF model through a loopback-only `llama-server` when a model and runtime are installed.
- Creates scripts, lessons, livestream rundowns, storyboards and creative outlines without sending prompts to a cloud API.
- Stores saved projects in an AES-256-GCM encrypted vault on the removable drive. The passphrase is not stored by the app; the key is held in memory only while the vault is unlocked.
- Does not download binaries or models, enable telemetry, open a LAN listener, run shell commands from the browser, or collect social-platform credentials. When online, it can make one outbound WSS connection to the official Magnanimous live-bridge relay; direct provider adapters remain separate and permission-gated.
- Can optionally start a portable OBS installation. The local creator includes an authenticated OBS WebSocket v5 control adapter for scene listing, scene switching and recording start/stop. OBS must already be installed/running with its WebSocket server enabled; this adapter does not install OBS or drivers.
- OBS pairing is restricted to `127.0.0.1:4455`. The password is sent only to the local host for the OBS challenge handshake, is not stored in the vault or browser storage, and is not forwarded to any cloud service. Scene switching and recording require explicit operator clicks.
- The online companion uses a separate temporary pairing token to connect to the Magnanimous WSS relay. The token is held in process memory only. Incoming remote production commands appear in a local approval queue. The local companion supports an approved OBS scene change and a `host.speak` request; speech is handed to the local AI-host panel and spoken only after approval on this computer.

This is a working offline creator foundation with an online relay connection path, not yet the finished cross-platform USB broadcast appliance or a completed social livestream integration. The first Windows build requires compatible runtime binaries and an optional, separately licensed model to be placed in the documented folders.

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
    vault.enc                 encrypted project vault
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


## Secure online companion connection

1. Sign in to the online Magnanimous platform and open **LIVE Event Bridge**.
2. Choose **Create secure pair**. The online service issues separate browser and companion tokens; the initial pairing window is ten minutes.
3. Unlock the encrypted workspace, then copy the companion token into the local Portable Creator's **Connect to Magnanimous Live Studio** panel, together with the secure WSS address.
4. The local process connects outbound to `wss://iammagnanimousway.com`. It does not open a LAN port or expose OBS.
5. Incoming normalized audience/game events are encrypted with a subkey derived from the workspace key before they are written to the local recovery journal. Remote production commands are placed in a local approval queue. A scene change requires OBS to be connected and a second approval on the local computer.
6. Locking the workspace disconnects the bridge and clears the in-memory event queue; unacknowledged events remain encrypted on USB and are restored after the next unlock. Disconnect locally or revoke/expire the pairing. Tokens are not written to disk and are cleared when the local process exits.

### Use the online AI host with the local USB avatar

1. Keep LIVE Event Bridge open in one browser tab and open AI Host (/tiktok-live) in another tab on the same official Magnanimous origin.
2. Create the secure pair in LIVE Event Bridge and paste only the companion token into the F-drive Creator. The browser token stays inside the bridge tab; it is never copied into the AI Host tab or browser storage.
3. When the local companion reports connected, the AI Host can receive normalized audience/game events from the bridge tab. Each event is shown for creator review; it is not automatically answered or spoken.
4. Enable “Send AI replies to the paired F-drive host for local approval” when you want the local avatar/voice to deliver the online AI Host's answer. The bridge forwards only a bounded host.speak request; the F-drive Creator displays it for a second, local approval before speech.
5. If the browser tab is closed, the bridge disconnects or the pair expires, the AI Host reports that the companion is unavailable. The AI Host can still generate and speak in the browser when its online AI service is reachable.

The two tabs use a same-origin in-memory BroadcastChannel only for normalized event context, bridge status and bounded speech requests. It does not carry pairing tokens, credentials, provider passwords or OBS passwords.

The relay is a transport, not a social-platform adapter. New pairs authorize only local/manual, OBS, game and browser events. TikTok, Facebook, YouTube, Twitch and Zoom are schema-supported but explicitly denied until a separate official account adapter is authorized. This connection does not itself fetch platform chat, start a broadcast or transmit audio/video. Those require separate official account authorization and provider adapters. The local companion supports only two remote actions: locally approved OBS scene selection and locally approved `host.speak` requests. Host speech is played through the selected device/browser voice; it is not a cloud voice service. Overlay and audio-cue execution remain disabled until their local engines are implemented. Game events can be normalized and turned into review cues, but live game-specific adapters are not connected by this slice.

The cloud relay implementation is in draft PR #1017 and is not deployed. The local connection path becomes usable only after that PR passes CI, the Durable Object namespace is provisioned safely, and the production deployment gate is cleared. Do not paste provider passwords, cookies, OAuth tokens or OBS passwords into the pairing fields.

## Local OBS control

1. Start OBS Studio on the same computer.
2. In OBS, open **Tools → WebSocket Server Settings** and enable the WebSocket server (OBS Studio 28+ includes it). Keep the default local port `4455`; use a password and enter it only into the local Magnanimous OBS panel.
3. Connect, refresh scenes, select a scene and explicitly switch. Start/stop recording only when you choose.
4. Disconnect when finished. If OBS is not installed or the WebSocket server is disabled, the panel reports that it cannot connect; it does not install software or expose OBS to the network.

This control path is local production only. It does not start a public livestream, connect a social account, or join Zoom. A real OBS hardware smoke test remains required before describing it as operational on a particular computer.

## Local live-event runtime

Accepted events and acknowledgements are encrypted with AES-256-GCM in a bounded, fsynced JSONL recovery journal. The encryption subkey is derived from the unlocked workspace key and is never written to disk. Startup replays only unacknowledged events without writing duplicate records; legacy plaintext journal records are migrated on first successful unlock. Atomic compaction retains pending events and recent deduplication IDs. If the journal reaches its configured size limit or cannot be verified, new event intake stops rather than silently dropping or overwriting recovery data.

The portable host now exposes a bounded, loopback-only event intake for future authorized platform and game adapters:

- `GET /api/live/events/status` reports queue depth, capacity and deduplication state.
- `POST /api/live/events/ingest` accepts a protocol-version-1 event in a JSON `event` field.
- `POST /api/live/events/consume` returns a bounded batch (1–50 events) for the local operator/host runtime.

Browser intake accepts operator-entered `manual` events only; provider-labelled events must arrive through the local companion and an explicitly authorized provider adapter.

### Connect a local game or app event source

The Creator now exposes a narrow, authenticated local event endpoint for trusted desktop automation tools that can send HTTP requests. This is a generic adapter seam; it does not claim to include a native plugin for every game.

1. Unlock the encrypted workspace.
2. In **Audience & game events**, reveal the temporary local integration token. Copy it into the trusted local automation tool's secret/credential field.
3. Configure that tool to send an HTTP POST to `http://127.0.0.1:3219/api/integrations/game/event` with an `Authorization: Bearer <token>` header and JSON content type.
4. Send this event shape, replacing the example values and using a unique `eventId` for every event:

```json
{
  "event": {
    "protocolVersion": 1,
    "eventId": "game-round-0001",
    "occurredAt": "2026-11-25T12:00:00.000Z",
    "gameName": "Your game",
    "actorName": "Game event",
    "text": "Round one has started"
  }
}
```

The local host accepts only bounded `game.event` records, validates the token with a constant-time comparison, writes accepted events to the encrypted USB journal before acknowledging them, and forwards them to the online relay only when the paired bridge is connected. The token is generated in memory and revoked when the workspace is locked or the process exits. The endpoint listens only on loopback; it is not a public webhook.

This lets a trusted local app or automation tool report an event without giving Magnanimous permission to control the game. It does not capture the game screen, read arbitrary game memory, bypass anti-cheat, automate gameplay or connect a named automation product until that product's own adapter is separately tested. TikTok, Facebook, YouTube, Twitch and Zoom are not authorized by the initial bridge pair. The runtime validates provider, event type, event ID and timestamp; removes control characters; bounds viewer text and tags; strips credential-like tag names; deduplicates provider event IDs; applies a per-provider rate limit; and returns backpressure when the queue is full. It does not silently discard already accepted events.

Queue and deduplication state are transient in memory and are cleared when the host exits. They are not a substitute for durable project storage. The endpoints are a local event-processing foundation only: no TikTok, Facebook, YouTube, Twitch or game adapter is connected by this change. Public broadcasting, account control, moderation and payments are not exposed.

The portable UI includes an operator-controlled event review panel to pull and inspect a bounded batch. Browser intake accepts manual events only; it cannot impersonate a TikTok, Facebook, YouTube, Twitch or game adapter. The portable runtime QA suite copies this module into an isolated temporary host and exercises event ingestion, duplicate rejection, spoofed-provider rejection and bounded consumption. Unit tests cover validation, sanitization, rate limits, queue backpressure and cleanup.

## Broadcast and Zoom boundaries

Offline mode can prepare the show, assets, script, overlays and avatar plan. It cannot transmit to TikTok, Facebook, YouTube, Twitch or Zoom without a network connection. The online LIVE Studio uses the provider-neutral event bridge and separate authorized adapters.

For an existing Zoom desktop meeting, the practical bridge is OBS Virtual Camera plus an audio input selected in Zoom. On Windows, OBS documents a one-time administrator step to install the virtual-camera driver; this launcher deliberately does not install it. A native Zoom Video SDK integration is a separate, credentialed application path.

## Portability is operating-system specific

A USB drive is a storage container, not a universal executable format. Windows x64, Windows ARM64, macOS Apple Silicon/Intel and Linux require separately built and signed runtimes. USB write speed, RAM, CPU/GPU, OS permissions, camera/audio drivers and available codecs determine what works on a particular machine.

OBS Portable Mode keeps OBS configuration beside the application on Windows, but OBS notes that scene media references also need portable paths. Do not assume a portable scene collection is self-contained until every media file is verified.

## Security and privacy

- Host binds only to IPv4 loopback `127.0.0.1`; it is not available to other devices on Wi-Fi. Its only online bridge traffic is an outbound TLS WebSocket to the official Magnanimous relay.
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
\n## Magnanimous show director\n\nThe local show director turns validated audience and game events into bounded review cues (welcome, reply prompt, game commentary, poll update, thank-you and production notes). Cues are review-only; they never directly control a game, post, moderate, spend money or trigger a scene change. A separate `host.speak` command can send a short line to the local AI-host panel, but the operator must approve it locally before the selected device voice speaks. Viewer text is untrusted content, not an instruction to the AI. Cues expire after 45 seconds by default and are generated only for events the operator pulls from the local queue.\n\n## Cross-device reality\n\nA USB SSD can carry the Magnanimous workspace, models, media and Windows OBS Portable files, but it cannot make one binary or one OBS profile work unchanged on every operating system. OBS Portable Mode is Windows-only and its media references need relative/common paths. The launcher must detect the OS/architecture, use the matching native runtime, and keep project files portable. Public streaming and Zoom meetings still need network access.\n

## Connect a trusted game or local app

After unlocking the encrypted workspace, reveal the temporary **game event token** in the local Creator. A trusted local Node.js game/app integration can use `game-event-client.mjs`:

```js
import { sendLocalGameEvent } from './game-event-client.mjs';

await sendLocalGameEvent({
  token: process.env.MAGNANIMOUS_GAME_TOKEN,
  gameName: 'Your game or app',
  actorName: 'Game event',
  text: 'A round has started. Ask the audience to predict the winner.'
});
```

Keep the token in the local process environment or a protected secret store; never commit it, put it in a public game script, or send it to a browser overlay. The helper has a fixed `127.0.0.1` destination and will not forward the bearer token to an arbitrary URL. The Creator validates, deduplicates, rate-limits and encrypts events before they enter the local show queue. When the online bridge is connected, approved event types can be relayed to the web host. The AI host sees an event only after the operator pulls it into the show director.

This is an event-integration contract, not a universal plug-in for every game. A specific game still needs a permitted API, plugin, webhook or operator cue. It does not read process memory, inject input, bypass anti-cheat or control gameplay. The online browser host currently supports operator-entered game moments; automatic game telemetry from every title is not connected yet.
