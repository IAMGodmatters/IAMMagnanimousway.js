# Magnanimous Drive TV — free sideload version 0.3

Native **Media3 ExoPlayer** opens automatically when a song or video is clicked.

## Built-in player
- Plays supported video and audio from system document/storage providers, including compatible Google Drive providers
- MP4, MKV, M4V, WEBM, MOV, MP3, WAV, M4A, FLAC, OGG, OPUS etc **where the TV's codecs and provider support playback**
- Full-screen video and music-art screen; built-in player controls, TV remote and visible large buttons
- Play/pause, -10 seconds/+30 seconds, previous/next, playlist auto-continue, repeat all/one/off and playback speed
- Pick SRT or VTT subtitle file from a document provider; embedded subtitle support is provided by Media3 when recognized
- Resume position for each selected file; recent songs and videos stored locally
- Browse folders using Android Storage Access Framework (SAF); **Up Next** automatically includes next playable files
- Does not copy the user's media library to servers and does not request Google account passwords
- Sideload APK is free, and has no Google Play payments or subscriptions

## Important limitations
This is a **local/SAF-based media player, not a complete Google Drive API client**. Google Drive appears in the Android file picker only if a compatible Drive DocumentsProvider is installed and available on your Astron Android TV. Google Drive browser link may also require a supported external browser. You cannot browse all your Google Drive files in-app until Google OAuth consent and Drive integration are configured. The APK has not yet been tested on the physical Astron TV.

Some file formats will fail because of codecs, unusual containers or provider streaming/seek limitations. An MP4 encoded H.264/AAC or MP3 is most compatible with a low-memory device. Audio playback pauses when leaving the player; background audio is a future feature.

## Build APK
GitHub Actions workflow `Build Magnanimous Drive TV APK` on branch `drive-tv-android-build-20261023` builds a debug-signed APK artifact (sideload only), with Android SDK 35 and JDK 17. It is **not Google Play published**.

## Install on Astron TV
1. Download `app-debug.apk` from the latest successful GitHub Actions artifact `MagnanimousDriveTV-owner-APK` in the build workflow.
2. Put APK on a USB drive or use an authorized file-transfer app, then open on TV with a file manager.
3. On your Android 11 Astron TV, grant **Install unknown apps** only to the trusted file manager, install the APK, then switch the permission off if possible.
4. Launch `Magnanimous Drive TV` from Apps.
5. Choose **Open video or song**, or **Open folder** to build an automatic Up Next list. The media player opens immediately when a media item is selected.
6. Select **Google Drive** in the Android picker if it appears, or select compatible files from USB; do not enter a Google password into unknown third-party file apps.
7. TV storage was reported as only 217 MB free; free adequate space first if installation is refused.

## Customer version
The proposed $0.99/month Google Play version and owner free exemption for `Hardinlourijess@gmail.com` are **not active in this sideload build**. They require Play Console, proper identity verification, Play Billing purchase validation and Google Drive OAuth verification.
