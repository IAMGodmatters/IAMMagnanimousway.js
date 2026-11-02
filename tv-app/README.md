# Magnanimous Drive TV — Astron v0.6 lightweight compatibility edition

For Astron SMART_TV_3277, Android 11. v0.6 removes the larger AndroidX Media3 package. It uses native Android VideoView and PhotoActivity, with no external dependencies, targeting Android 6.0+ (minSdk=23) and Android 9 behavior for compatibility.

- Play compatible videos and music with large TV-remote controls, seek, playlist/next, repeat, shuffle, resume
- Photo viewer, recent media, Android document picker
- Plain UTF-8 SRT external subtitle overlay
- Built in fallback to any installed player, if media format unsupported
- Private personal test edition; no sign-in credential harvesting and no payments

**Known limitations**: This app does not integrate the Google Drive API. Google Drive appears in the picker only when your TV has a compatible DocumentsProvider. It may be necessary to test media files from USB first. Built-in VideoView supports only formats for which the TV provides decoders; MP4 H.264/AAC and MP3 are recommended.

This v0.6 **does not fix a corrupt or incomplete browser download**. Check file size against the Drive metadata and transfer by USB from a phone/computer if the TV browser cannot download intact. Sideloading is not publishing. Google Play billing and the owner's verified free entitlement remain future features.

**IMPORTANT**: CI signs debug builds with temporary keys. Uninstall any previously installed test build before installing a new one; do not treat debug builds as stable production releases.

Build action: .github/workflows/build-drive-tv-apk.yml. Source only on branch drive-tv-android-build-20261023; production website main unchanged.

## Compatibility build verification

The TV APK must contain both a valid v1 JAR signature and v2 APK signature. The CI job checks the manifest package, Android TV launcher category, minimum SDK 23, and the v2 signature. It then explicitly verifies the v1 signature with `apksigner verify --min-sdk-version 23`, because the default verifier uses the APK's embedded SDK metadata and can omit the legacy-scheme check. The workflow uploads the APK only after every verification passes.

A green build proves the APK was built and its package/signatures were inspected; it does not prove installation or playback on the physical Astron television. USB playback and automatic startup still require on-device testing.
