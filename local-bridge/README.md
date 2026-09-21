# Magnanimous Local Bridge

The Magnanimous Local Bridge closes the local-computer/private-network boundary for GOD TOOLKIT without exposing a remote shell or opening an inbound port.

## Architecture

- The local agent makes **outbound HTTPS** requests to `https://iammagnanimousway.com`.
- No listener is opened on the user's LAN.
- Pairing uses a one-time code created by the signed-in platform owner.
- The server stores only SHA-256 hashes of pairing codes and bridge tokens.
- The bridge token is stored only in `~/.magnanimous/local-bridge.json` on the paired computer.
- File access is restricted to explicit `--root` workspace directories.
- There is no arbitrary shell, raw keyboard/mouse, or unrestricted process endpoint.
- Source mutations (`apply_patch`, branch creation, commit) require a separate owner confirmation.
- `main` and `master` are protected from local commits.
- Netwalk actions are advertised only when Core-Dv1 is configured locally; Core-Dv1 remains responsible for read-only command allowlists and authorized network scope.

## Windows

1. In I AM MAGNANIMOUS WAY™, open **Owner → Local Bridge**.
2. Choose the authorized workspace folder and select **Create Activation**.
3. Download **Activate-Magnanimous-Local-Bridge.cmd** and open it on the Windows computer before the one-time code expires.
4. The bootstrap installs Python automatically with Windows Package Manager when needed, optionally installs Git, downloads the Magnanimous agent, pairs it, and creates a scheduled task named **Magnanimous Local Bridge**.
5. Magnanimous automatically queues a safe health task. The owner page changes to **READY LOCAL — VERIFIED** only after that task is actually claimed and returned successfully.

Manual PowerShell is still supported:

```powershell
powershell -ExecutionPolicy Bypass -File .\local-bridge\install.ps1 -PairingCode "PAIR_CODE" -WorkspaceRoot "C:\path\to\your\project" -InstallGit
```

If no workspace is supplied, the installer creates `%USERPROFILE%\Documents\MagnanimousWorkspace`.

## Manual / macOS / Linux

```bash
python3 local-bridge/bridge_agent.py pair \
  --server https://iammagnanimousway.com \
  --code "PAIR_CODE" \
  --root "/path/to/project"

python3 local-bridge/bridge_agent.py run
```

Add `--netwalk-toolkit /path/to/Core-Dv1` during pairing if the authorized read-only Netwalk toolkit is installed locally.

## Supported local actions

Automatically safe / read or verification oriented:

- `system_info`
- `health`
- `workspace_list`
- `read_file`
- `search_text`
- `git_status`
- `git_diff`
- `git_log`
- `project_test`
- `project_lint`
- `project_typecheck`
- `project_build`
- `web_fetch`

Netwalk, when Core-Dv1 is configured:

- `netwalk_probe`
- `netwalk_scan`
- `netwalk_diag`
- `netwalk_map`
- `netwalk_report`

Separately confirmed local mutations:

- `apply_patch`
- `git_create_branch`
- `git_commit`

## Safety boundaries

The bridge intentionally does not expose a generic shell, arbitrary process execution, raw operating-system input events, or unrestricted filesystem access. Browser work uses a dedicated **Magnanimous Native Browser** capability instead of a generic remote-control endpoint. Office, media, and other device-specific operations still use capability-scoped tools where available.

## Magnanimous Native Browser

The Windows activation now attempts to install **Playwright 1.63.0 + Chromium** locally. When that succeeds, the paired computer advertises these Magnanimous-owned capabilities:

- `browser_search` — fresh public-web search through local Chromium.
- `browser_fetch` — JavaScript-rendered page text, links, optional HTML, and selector-based fields.
- `browser_fetch_batch` — bounded 1–10 URL rendered-fetch batches with per-URL errors.
- `browser_research` — search plus source-page collection for Magnanimous source-backed synthesis.
- `browser_read_flow` — multi-step navigation, waiting, scrolling, snapshots, and extraction.
- `browser_action_flow` — click/fill/select/press/screenshot workflows; these require exact task confirmation before execution.
- `browser_profile_list` / `browser_profile_create` — list or create persistent local Chromium profiles.
- `browser_profile_setup` — opens a visible local browser so the owner can sign in manually.
- `browser_profile_delete` — deletes a non-default local profile only after exact confirmation.
- `browser_session_start` / `browser_session_read` / `browser_session_action` / `browser_session_end` — persistent bridge-process browser sessions; writes remain confirmation-gated.

Browser session cookies and credentials stay in the local browser profile under the user's computer. Remote tasks refuse password/secret field filling. Public-web browser actions also reject localhost, private-network, link-local, and reserved targets.

Magnanimous can therefore perform supported search, rendered extraction, batch fetch, source collection/research, browser workflows, persistent bridge sessions, local profile management, screenshots, status streaming, completion webhooks, run-now monitoring, and scheduled read-only monitoring without requiring TinyFish.

The native implementation intentionally does **not** pretend to own TinyFish's proprietary anti-bot internals, managed residential/geo proxy fleet, remote browser/CDP infrastructure, hidden prompts, model weights, or private source code. Per-run unauthenticated proxies may be supplied, while authenticated proxy credentials stay configured locally on the bridge. Persistent browser sessions live in the Local Bridge process and end if that process restarts. TinyFish or another browser provider can remain an optional fallback only for capabilities that Magnanimous has not independently built and verified.

### Existing paired computers

An already-installed Local Bridge does not silently replace its local executable. After this browser-capability release is deployed, **re-run the Windows activation from the Local Bridge owner page once**. The installer safely reuses the existing pairing, upgrades the local agent, installs Playwright/Chromium when possible, and then the next heartbeat advertises the browser capabilities.




## Revoke and uninstall

Use **Revoke Device** on the owner Local Bridge page to invalidate that device's bridge token and cancel its pending tasks. A revoked bridge stops when the server returns unauthorized status.

To remove the local startup task, agent, and local bridge credentials from Windows:

```powershell
powershell -ExecutionPolicy Bypass -File .\local-bridge\uninstall.ps1
```

The uninstaller removes only Magnanimous Local Bridge files and the scheduled task. It does not delete a non-empty workspace.
