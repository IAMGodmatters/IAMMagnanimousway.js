# Magnanimous TV Browser & iPhone Remote (original implementation)

## Source analysis

The reference app is **BROWSER with TV remote** (Apple App Store app ID `6670316885`), published by `browser-app.com` / LUJO UG. Its published features include an iPhone browser, companion Android TV browser, remote navigation, tabs, bookmarks, video detection, playback preferences, privacy controls, browser-history clearing, and a pairing flow. Its developer's site lists Android TV as a supported target. The public listings are *not* evidence that its proprietary source code is licensed for reuse; no source files from that app are included here.

Sources examined:

- https://apps.apple.com/ph/app/browser-with-tv-remote/id6670316885
- https://browser1.com/features
- https://play.google.com/store/apps/details?id=com.internet.tvbrowser
- https://developers.google.com/identity/protocols/oauth2/limited-input-device
- https://developer.android.com/developer-verification/guides/faq
- https://github.com/truefedex/tv-bro (separately maintained GPL TV-browser project, not copied)
- https://github.com/itszechs/DriveStream (Apache-2.0 Drive-streaming reference, not copied)
- https://github.com/jellyfin/jellyfin-androidtv (GPL Android-TV media-player patterns, not copied)
- https://developer.android.com/media/media3/exoplayer (official player architecture)

DriveStream's public README confirms that its own streaming implementation uses the Google Drive API with broad Drive authorization and, since v1.3.1, requires each user to set up an OAuth client. Its availability does **not** remove the OAuth configuration/verification work from a separate Magnanimous implementation. The source repository documents Android, not guaranteed Android TV compatibility. TV Bro documents tabs, bookmarks, voice search, downloads and browsing history, and is a useful feature checklist, not a copied dependency.

## What this independent first build actually includes

1. `android-tv-browser/`: native Android TV/Google TV browser shell using the platform WebView. It opens HTTPS websites, shows a short-lived pairing code, accepts D-pad/browser/video remote commands, and keeps web cookies on the TV.
2. `frontend/app/tv-remote/`: mobile-friendly, keyboard-accessible web remote designed to run on an iPhone in Safari at `/tv-remote`. Connects with the code shown on the TV. Has website navigation, D-pad, browser navigation, and media commands. Users can paste their own HTTPS movie links and save up to 12 safe, local-only website favorites (never an OAuth/token-bearing URL).
3. `worker/src/tv-companion-runtime.js` + migration `0108`: first-party pairing relay. Tokens are 256-bit random; only their hashes are stored. Pairing codes are random ten-character strings, valid for five minutes, one-time use. Sessions expire twelve hours after creation. Only allowlisted commands are accepted. Remote commands do not contain passwords, Google OAuth credentials or media files. Pairing requests are rate-limited.
4. The existing Magnanimous platform gets a new clickable TV Browser Remote sidebar link without changing approved artwork.

### Build without a Google Play Console account

Run `gradle -p android-tv-browser :app:assembleDebug` with Gradle 8.10.2, JDK 17 and Android SDK 35. Alternatively, run the repository's **Magnanimous TV Browser Android APK** GitHub Action and download the uploaded `magnanimous-tv-browser-debug-apk` artifact. This is a developer/testing APK, not a production-signed release or Play Store publication. Install only on an Android/Google TV device you own and trust. The TV needs its matching deployed API and D1 migration.

After installing the APK, open Magnanimous TV Browser on the television. Open `https://iammagnanimousway.com/tv-remote` on the iPhone, enter the ten-character TV code, then control the TV browser. No app installation is needed on the iPhone for the web remote.

### Production work and verification still required

- Apply D1 migration `0108` and deploy the Worker + static frontend after CI passes. This code is **not live** merely because a pull request exists.
- Test an actual Android/Google TV, WebView version, iPhone Safari, Wi-Fi/network conditions, connection interruption, and all playback controls.
- **Google Drive is not verified in embedded WebView.** Google may reject Google sign-in or place its video player in cross-origin frames. Google's TV device-code OAuth currently lists `drive.file`, but **not** full `drive.readonly`, among permitted Drive scopes. That may allow user-selected files, not unrestricted browsing of all existing Drive movies. A broader Drive library would need a separately authorized OAuth flow (for example via iPhone), the applicable Google verification, and a native read-only Drive/media layer. Do not request Google passwords through our remote-control relay. The HTTPS movie-link shortcut is for content that the TV itself may legally and technically access; it is **not** a workaround for private-file authorization.
- A Google account grants access only to files it is authorized to access. This app does not bypass restrictions on video services or DRM.
- Add secure refresh-token handling on-device and least-privilege Drive scopes only when a verified Drive implementation is ready. OAuth verification may be required for broader public rollout.
- Improve TV accessibility, subtitles, cross-device bookmarks, resume position, multiple-device control, casting, and genuine native video playback after physical-device QA. The TV now tracks the current browser URL, and the remote supports phone-local favorites. It polls the relay less frequently before pairing to reduce free-tier utilization.
- Put customer billing behind Stripe-confirmed payment and cost metering; the current feature has no new customer charge and does not promise an unbounded free service.
- The relay prunes expired TV sessions/commands and old rate-limit records when a new session is created; add scheduled cleanup plus quota telemetry before wider public rollout.

### Security boundaries

- The Android app uses HTTPS only, Android Safe Browsing, no file/content URL access, no mixed content and no Javascript bridge into web pages.
- The remote queue allows simple actions only. Navigation rejects non-HTTPS, embedded URL credentials, localhost addresses and known OAuth token query keys.
- The remote token is kept in the iPhone tab's `sessionStorage`, not permanent local storage. Closing the session or expiry revokes access.
- The TV app does not export an administrative listener or expose local-network ports. Cloudflare D1 is a command relay, not Magnanimous AI's identity or memory layer.
- A debug APK is not a security-reviewed production release, and the full browser surface is not yet hardened against all browser/WebView threats. Do not use it for high-value accounts until device testing and threat review are complete.
