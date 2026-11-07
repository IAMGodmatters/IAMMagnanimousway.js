# Magnanimous Drive TV — Astron recursive-library player v0.8

Target device recorded for this setup: Astron SMART_TV_3277. The official Astron LED3277 listing describes Android 7.0, 8 GB storage, 1 GB RAM, two USB ports, and support for AVI, MP4, MPEG, TS and QuickTime video containers. The exact filesystem support is not published on that product page. Earlier setup notes recorded Android 11, so confirm the installed OS in Settings > About before changing the card format.

## What v0.8 does
- Scans up to 5,000 media items, including nested subfolders (up to 12 levels deep).
- Plays the full selected-folder library instead of truncating the queue at 60 files.
- Adds AVI recognition.
- Remembers the selected USB folder.
- On app launch, automatically starts the first playable item in the remembered folder.
- Defaults to Repeat All.

## First-time setup
1. Install the APK on the television from the APK file stored on the SD card. Android installs applications into the TV's app storage; it does not execute an APK directly from removable storage.
2. Open Magnanimous Drive TV once.
3. Choose the existing Learning_Videos folder on the SD card and grant read access.
4. The player scans its subfolders and starts the first video. Later app launches reopen that remembered folder and start playback.

## Plug-in behavior
Android TV does not generally autorun an APK simply because a USB card is inserted. The app must be opened once by the user or by a TV-supported launch setting. Once the app has been opened and the folder permission is saved, v0.8 starts the remembered library on subsequent app launches. If the Astron system Media Player has its own USB autoplay setting, that setting can be enabled separately, but that setting is not controlled by this app.

## Media compatibility
Prefer MP4 with H.264 video and AAC audio. Astron lists AVI, MP4, MPEG, TS and QuickTime containers; individual codecs still depend on the TV decoder. MKV and WebM are not listed by Astron and may need conversion for reliable playback. The player uses Android's native VideoView and falls back to another installed player when available.

## Build
Run gradle --no-daemon :app:assembleDebug from the tv-app directory. CI signs the compatibility APK with v1 and v2 signatures and verifies the Android TV launcher entry and minimum SDK. CI build success does not replace physical-TV playback testing.