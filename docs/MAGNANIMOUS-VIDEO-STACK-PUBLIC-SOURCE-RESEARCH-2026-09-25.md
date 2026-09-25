# Magnanimous Video Stack — public-source capability research

Date: 2026-09-25

## Public source examined

Video.io public website and documentation describe a mobile video stack centered on:
- recording and camera capture;
- upload-while-recording / fast availability;
- upload state and progress;
- low-latency playback;
- paginated/tagged/metadata playlists;
- multi-clip trim, reorder and finalization;
- low/ultra-low-latency live-stream components;
- cross-platform JavaScript, iOS and Android SDKs;
- backend-issued session tokens as the recommended production authentication pattern.

Public repositories examined:
- Video-io/videokit-nodejs — BSD-3-Clause.
- Video-io/VideoKit-Android-Samples — Apache-2.0.
- Video-io/VideoKit-iOS — public package repository.

## Magnanimous implementation rule

No proprietary backend code, hidden prompts, private algorithms, non-public source, credentials, model weights, private datasets or Video.io trademarks are copied into the platform.

Magnanimous implements original equivalents using its existing architecture:
- opaque one-hour media sessions, hashed server-side;
- chunked private video uploads with visible state/progress;
- tenant-scoped playlists with tags/metadata and pagination;
- HTTP range playback and temporary 15-minute playback/render URLs;
- private-by-default object storage;
- browser recording through standards-based MediaRecorder/getUserMedia;
- multi-clip reorder/trim/finalize through the existing Magnanimous FFmpeg renderer;
- plan-enforced watermarking on Free + Plus;
- browser WebRTC as the free-first live-session mode;
- optional server-scale live capacity only when intentionally configured;
- existing Movie Maker, Video Studio, social publishing, media library and object storage remain preserved.

## Security / cost boundaries

- Never ship provider/master application secrets in a browser/mobile build.
- Temporary media access links are opaque, expiring and purpose-tagged.
- Uploaded media is tenant-isolated and private by default.
- Renderer edit sources must be approved Magnanimous HTTPS hosts and short-lived media-access paths.
- No outside video provider is required for native record/upload/playlist/edit/playback.
- Optional paid generation/live/CDN capacity remains subject to normal prepaid/funding controls.
- Consumer branding stays Magnanimous-only; source/provider identities remain owner/admin diagnostics when operationally necessary.

## Verification target

A capability is not considered finished until:
1. repository QA passes;
2. the exact branch is merged through existing safeguards;
3. the exact main revision is deployed;
4. production checks verify the relevant routes and branded UI.
