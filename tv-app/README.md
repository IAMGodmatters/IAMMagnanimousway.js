# Magnanimous Drive TV — free owner sideload build

This is a **private, free, no-billing** Android 11 TV APK project using Android Storage Access Framework (SAF).

## Current functionality
- TV remote buttons; select a video through system file picker
- Choose and browse a folder when a compatible DocumentsProvider is installed
- Play remotely provided `content://` video streams using Android VideoView
- Remember recent selections and playback positions
- Open Google Drive in the external TV browser
- Never collect Google passwords, never upload videos to an app-controlled server
- No account/paywall/payments in this personal sideload build

**IMPORTANT:** Drive videos can be selected in the Android picker **ONLY IF a Google Drive DocumentsProvider is available on the TV**. Some Android TV devices may not support this. This app is NOT a complete Drive API browser. It may only play locally accessible videos until Drive provider access is configured. Codec compatibility and provider seeking support vary.

## Installation
1. Download app-debug.apk from the GitHub Actions artifact ZIP.
2. Transfer APK to TV via USB or file transfer; allow installs from chosen file-manager app in Android settings.
3. Install; launch Magnanimous Drive TV in Apps.
4. Choose Video. In the system file picker select Google Drive if it appears; otherwise check Drive website (external browser) or a supported local source.
5. No Play Console or payment required to sideload. Ensure TV has sufficient free space.
6. Only use files you own or are authorized to watch.

## Future commercial version ($0.99/mo)
NOT implemented or sold in this free owner build. Requires Play Console registration, approved Google OAuth configuration for Drive API (drive.readonly restricted scope for all-file browsing), policy compliance, backend purchase verification, and secure identity-based lifetime entitlement for Hardinlourijess@gmail.com. Never implement an owner bypass by trusting an unverified email string.

## Build
`gradle :app:assembleDebug` with Android SDK 35, Gradle 8.10/8.11, JDK 17. GitHub Actions on branch `drive-tv-android-build-20261023` compiles it.
