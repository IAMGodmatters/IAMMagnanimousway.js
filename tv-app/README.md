# Magnanimous Drive TV — free private TV player

## This release: version 0.3-media-owner

Designed for Astron SMART_TV_3277, Android 11, 1 GB RAM, limited internal storage. Google Play Store registration is **not** needed to sideload this personal build.

### Embedded media engine

Powered by **AndroidX Media3 ExoPlayer 1.11.1** (Apache 2.0). Playback is embedded inside the app, not delegated to an outside player. Supports common playable MP4/H.264/AAC, MP3, M4A, FLAC, OGG, WebM and Matroska/MKV streams when the TV hardware provides a compatible decoder; some codec/container combinations remain unsupported. HLS and DASH stream support included in Media3. Depends on available Android codecs and the media storage provider's streaming implementation.

- Video player with fullscreen picture, seek, play/pause, previous/next.
- Music/audio player with dedicated audio presentation, folder playlist, repeat and shuffle.
- External SRT / WebVTT subtitles picker; embedded subtitle track controls.
- Photos (JPG, PNG, WebP etc. if supported by Android decoder) with fit/fill and previous/next.
- Browse DocumentsProvider folders, select video/music/photo, show recent files.
- Resume playback per media file; no uploading private media.
- Android TV DPAD-friendly buttons; Android file picker for private media.
- Open another installed media player as optional fallback for codecs this TV cannot decode.
- Limit photo decode to roughly 1080p display dimensions for low-memory sets.

### Drive access limitation — important

This build uses **Android's system document picker and SAF**. Google Drive appears only if a Google Drive DocumentsProvider is installed and exposed on this TV. Android TV does not automatically provide a Drive integration. This build is NOT an OAuth-authenticated Drive API browser and does NOT guarantee that Google Drive files can be streamed on this particular Astron TV. Google Drive website button opens an external TV browser where supported. To browse every user's Drive folders within the app, later configure legitimate Google OAuth consent and restricted Drive API permissions with Google, plus a verified security architecture; do not collect Google passwords.

### Install on your Astron TV

1. In GitHub Actions -> **Build Magnanimous Drive TV APK** -> latest successful run -> download artifact "MagnanimousDriveTV-owner-APK", unzip to find **app-debug.apk**.
2. Transfer the APK to a USB stick using a computer/phone, or another Android file transfer method.
3. Insert the USB in the TV; open a TV file manager. Enable "Install unknown apps" only for that file manager when prompted. Select APK and install.
4. Open **Magnanimous Drive TV** under the Apps launcher.
5. Choose media, or choose folder. In Android file picker, select Drive only if it appears as a provider; otherwise start with a local USB audio/video/photo file to confirm playback. Avoid filling limited TV storage.
6. Try MP4 (H.264 video + AAC audio) and MP3 if existing files won't decode. The media player **does not transcode** unsupported streams.
7. To change an external subtitle while playing, select **Subtitles** and choose SRT/VTT file.

### Payments

This personal build contains **no billing**; it is not published to Google Play and it does not securely enforce owner-versus-customer access. The desired future commercial release is **$0.99 USD per month** for users, **complimentary verified owner entitlement for Hardinlourijess@gmail.com**. This requires Play Console registration, Google Play Billing configuration, backend purchase/identity verification, Google OAuth configuration and applicable reviews. Publishing a debug APK is NOT paid app launch.

### Build

Branch: drive-tv-android-build-20261023
Android SDK 35, Gradle 8.10.2, JDK 17. CI builds a debug APK; this is for personal testing, not distribution through Google Play. The main Magnanimous AI platform remains untouched.
