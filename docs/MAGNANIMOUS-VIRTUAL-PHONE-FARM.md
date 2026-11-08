# Magnanimous Virtual Phone Farm

## Purpose

An additive, owner-only Android device capability for Magnanimous AI. It manages separate Android Virtual Devices (AVDs) on an owner's paired Windows or Linux computer and, optionally, Android Emulator containers on an owner-supplied Linux cloud VM with KVM. Magnanimous AI remains the platform identity, planner, policy layer and orchestrator.

## Existing platform preserved

- Reuses the existing owner-only Magnanimous Local Bridge, HTTPS polling, one-time pairing, hashed server-side bridge tokens and allowlisted task queue.
- Adds new action names and the private `/virtual-phones` owner page. It does not replace existing features or create a second control plane.
- The Local Bridge API continues to enforce the platform-owner guard. The page redirects unauthenticated users to sign-in.
- No generic shell action is introduced. No customer-facing or unauthenticated device control endpoint is added.

## Local Android Virtual Devices

Install the official Android Studio or Android SDK Command-line Tools, Android Emulator, Platform-Tools and an approved system image on the paired computer. The owner accepts Android SDK licenses locally. Magnanimous never auto-accepts them.

The initial supported system-image package form is `system-images;android-35;google_apis;x86_64`; the validation accepts API levels 29–39. The owner can request a separate confirmed image installation, create an AVD with an allowlisted Pixel hardware profile, then start, stop or delete that AVD. Existing AVDs are never overwritten. Install, create, start, stop and delete actions each require explicit owner confirmation.

Verify hardware acceleration before creating several instances. Windows uses a supported host hypervisor (commonly Windows Hypervisor Platform); Linux uses KVM. Each virtual phone consumes the host computer's CPU, memory and disk capacity.

## Cloud Android emulator containers

Cloud mode uses Google's published Android Emulator container image:
`us-docker.pkg.dev/android-emulator-268719/images/30-google-x64:30.1.2`

Google describes its Android Emulator Container Scripts project as experimental. The supported host requirements include Linux, Docker Engine, Android ADB and readable/writable `/dev/kvm`. Cloud VMs need nested virtualization enabled by their provider. An ordinary Cloudflare Worker is not a suitable KVM host.

The installer at `local-bridge/install-cloud-node.sh` checks the existing Linux host, Docker access, ADB, Python and KVM, downloads the Magnanimous Local Bridge agent, pairs with a one-time owner code, then installs a per-user systemd service when available. It does not create a cloud VM, install Docker, change cloud billing, modify firewall rules or run as root.

Create a one-time pairing code on the owner page and run:
```bash
curl -fsSL https://iammagnanimousway.com/api/magnanimous/virtual-phone-farm/install-cloud-node.sh | bash -s -- 'ONE_TIME_PAIRING_CODE'
```

The cloud container's ADB and WebRTC ports are bound to `127.0.0.1` on the paired host only. Starting a container may download a large image and consume disk and bandwidth, so the owner must separately confirm this operation and affirm in the task payload that the applicable Google Android SDK/emulator terms have been reviewed and accepted. The backend and local agent reject cloud start unless that affirmation is present.

## Security and legitimate use

- Only the platform owner can manage the device farm.
- Only explicitly paired Local Bridge agents receive tasks.
- The server stores only a SHA-256 hash of each bridge token; the token remains local to the paired host.
- AVD names, system image identifiers, device profiles and cloud slots are validated against strict allowlists.
- Consequential operations use the existing separate task-confirmation gate.
- The cloud ADB and WebRTC host ports are loopback-only, not public.
- Intended for legitimate application development, device QA, accessibility testing and media workflows. It is not designed for ad fraud, fake engagement, account farming, credential abuse, spam or evasion of platform controls.

## Current execution boundary

At feature preparation time, the Windows Desktop Commander device was offline. Therefore its installed SDK, acceleration and real emulator boot state cannot yet be checked. Cloud mode is dormant until an owner pairs a prepared Linux KVM host. A successful pairing or queued task is not proof that an Android device has booted; inspect the ADB device and Android boot-completion state.

## Host checks

Windows:
```powershell
emulator -accel-check
emulator -list-avds
adb devices -l
```

Linux:
```bash
test -r /dev/kvm && test -w /dev/kvm
docker info
adb version
adb devices -l
```
