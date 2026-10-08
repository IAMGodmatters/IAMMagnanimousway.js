# Magnanimous Desktop / Game Capability Absorption — 2026-10-08

## Objective

Use the user-authorized PC Games, PC Software, Mobile Software and desktop Downloads inventories to improve Magnanimous AI without importing restricted software, license bypasses, malware risk, or copyrighted game/application internals.

## Clean-room rule

Magnanimous may learn observable capability classes and reusable engineering patterns, then implement its own contracts and workflows. It must not copy proprietary source code, copyrighted game assets, hidden prompts/models, cracks, repacks, KMS/activation bypasses, patched premium applications, premium-mod APKs, license keys, or unknown executables.

Unknown shared archives remain inventory-only. They are never an execution dependency unless provenance, redistribution rights, license and malware safety are independently verified.

## Approved local-tool targets

The desktop intake stages official packages through Windows Package Manager to `D:\MagnanimousData\PlatformIntake\OfficialTools` instead of using unverified shared archives. Current target families include 7-Zip, FFmpeg, OBS Studio, Blender, ImageMagick, Audacity, HandBrake, Krita, scrcpy, VLC and GIMP.

These tools remain replaceable execution rails beneath Magnanimous AI. Their presence does not transfer their trademarks, code or ownership to Magnanimous.

## Capability families absorbed

- archive inspection/compression/extraction
- media probing/transcoding/remuxing and playback validation
- screen recording and live media composition
- image editing, batch transformation and background workflows
- audio editing, cleanup and noise suppression
- 3D scene/render/export workflows
- authorized Android mirroring/control
- storage analysis, file management and verified transfers
- virtualization/sandboxing and recovery/diagnostic patterns
- SIP/softphone workflow abstractions under existing telecom gates
- non-destructive timeline/video editing and enhancement abstractions
- game-derived clean-room mechanics: state machines, quests, progression, achievements, inventory/resources, checkpoint/save/restore, input mapping, physics/collision, pathfinding, multiplayer session models, simulations, tutorials, extension contracts and performance telemetry

## Runtime boundary

The Local Bridge exposes read-only `desktop_tools_status` so Magnanimous can discover approved installed/staged tools without executing the shared archives. Tool-specific mutation/execution should be added only through bounded argv allowlists, workspace/path controls, explicit approval gates where appropriate, regression tests and rollback behavior.

## Truth rule

A capability being present in the registry means its workflow specification has been absorbed. It does not mean the capability is already production-ready. Native status requires real runtime evidence and regression verification.
