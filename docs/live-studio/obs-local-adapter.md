# Magnanimous OBS Studio Local Adapter

## Purpose

Magnanimous can control an owner-authorized OBS Studio installation through the existing Magnanimous Local Bridge. Magnanimous remains the intelligence, identity, policy and orchestration layer. OBS is a replaceable local production tool; it does not own Magnanimous memory or account credentials.

This is a Windows-first implementation. The Local Bridge agent initiates outbound HTTPS polling to Magnanimous. The OBS connection itself stays on the same computer at ws://127.0.0.1:<port>.

## First available controls

| Action | Behavior | Authorization |
|---|---|---|
| obs_status | Read OBS and WebSocket versions and current program scene | Read-only |
| obs_scene_list | List scene names and locally approved scenes/media cues | Read-only |
| obs_output_status | Read stream and recording active/paused status | Read-only |
| obs_scene_set | Switch to one exact scene in the owner's local allowlist | Separate task confirmation |
| obs_audio_cue | Restart one exact approved OBS media input | Separate task confirmation |

The media cue action is not a file-playback API. It can only restart a media input that the owner selected during local configuration and that OBS still identifies as a supported media input.

## Setup on Windows

1. Open OBS Studio 28 or newer.
2. Open Tools → WebSocket Server Settings.
3. Enable the WebSocket server and keep password authentication enabled. Keep it bound to the local machine; the adapter will only connect to IPv4 loopback.
4. In the already paired Magnanimous Local Bridge folder, run: python bridge_agent.py obs-configure
5. Enter the OBS WebSocket password at the hidden prompt. The command authenticates before saving, queries available scenes and media inputs, then asks you which exact scene names and media inputs Magnanimous may control.
6. Start or restart the paired Local Bridge agent. Its heartbeat advertises OBS capabilities only after the DPAPI-protected configuration is present.
7. In Magnanimous Owner → Local Bridge, run status/list checks. Scene switching and media cue tasks require a separate confirmation.

To use a non-default OBS WebSocket port, pass --port 4455 with the port you configured in OBS.

To remove the saved OBS credential and allowlists on the local computer, run: python bridge_agent.py obs-forget

Type FORGET OBS when prompted. The ordinary Local Bridge pairing remains intact.

## Credential and transport design

- The host is not configurable by a remote task. The local agent only connects to 127.0.0.1.
- The port is chosen during local configuration and is never accepted from the web task payload.
- The OBS password is encrypted using Windows DPAPI for the current Windows user profile before it is written to the local, user-restricted Magnanimous configuration file.
- The OBS password, DPAPI blob, URL, host, port and WebSocket authentication response are not sent to the Magnanimous cloud service or included in task payloads, browser storage, logs or results.
- The adapter uses the OBS WebSocket v5 Hello/Identify challenge-response flow and validates the HTTP Upgrade accept hash. Client WebSocket frames are masked.
- It subscribes to no OBS event stream in this first slice; each action makes a bounded local request and then closes the local socket.
- The existing Local Bridge remains outbound-only HTTPS. No public or LAN listener is added.

## Explicitly unavailable

The adapter does not expose broadcast start/stop, recording start/stop, stream destination or account settings, chat moderation, payments, arbitrary OBS source creation, arbitrary file playback, arbitrary navigation, shell commands, arbitrary process execution, or raw OBS WebSocket requests.

If OBS authentication is disabled, the adapter fails closed. If the owner changes or removes an allowlisted scene/media input, the agent re-checks the current OBS inventory and refuses the stale action.

## Verification

CI runs a local mock OBS WebSocket server and checks:
- RFC 6455 HTTP Upgrade and Sec-WebSocket-Accept validation
- server Hello and client Identify v5 messages
- OBS SHA-256 challenge-response authentication
- client frame masking and disabled event subscriptions
- correlated GetVersion request/response handling

A successful mock-server test proves protocol behavior, not compatibility with every OBS plugin, scene collection, audio driver or production stream. Actual device validation remains required before marking a creator's OBS connection ready.
