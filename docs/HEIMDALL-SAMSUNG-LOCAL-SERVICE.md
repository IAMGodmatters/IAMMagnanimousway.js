# Heimdall source and safe device service
Source: https://github.com/Benjamin-Dobell/Heimdall
Pinned commit: `3997d5cc607e6c603c6e7c0d07e42e9868c62af2` (March 14, 2021).
License: MIT. Copyright (c) 2010–2017 Benjamin Dobell, Glass Echidna; retain license/copyright notices. Drivers, firmware and dependencies may have separate terms.

The **complete upstream codebase** is referenced by the Git submodule `third_party/heimdall`. Obtain code in a trusted clone with `git submodule update --init --recursive`; ordinary GitHub ZIP downloads of Magnanimous might not include submodule bytes. It is source, not a compiled executable or a tested phone service.

Upstream tools include detect, version, print-pit, download-pit and flash, GUI frontend, libpit and platform build instructions. Magnanimous exposes only owner-local version and USB detection. Firmware writes, unlocking, bypass, erase, and arbitrary process arguments are intentionally NOT enabled. Before `heimdall_detect`, device custodian authorization and exact task confirmation are mandatory. Installation is local and opt-in. Modern phone compatibility and live hardware operation are untested; wrong firmware can brick phones.

Magnanimous AI retains the intelligence/policy identity, user permissions, logs and orchestration. Heimdall is optional replaceable infrastructure. No new paid services or payment changes.
