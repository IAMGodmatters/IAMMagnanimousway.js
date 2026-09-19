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

The bridge intentionally does not expose a generic shell, arbitrary process execution, raw input events, or unrestricted filesystem access. Browser/UI, Office, media and device-specific operations continue to use dedicated connected tools where available. This keeps Magnanimous initiative capability-scoped and auditable instead of turning the machine into a broad remote-control endpoint.


## Revoke and uninstall

Use **Revoke Device** on the owner Local Bridge page to invalidate that device's bridge token and cancel its pending tasks. A revoked bridge stops when the server returns unauthorized status.

To remove the local startup task, agent, and local bridge credentials from Windows:

```powershell
powershell -ExecutionPolicy Bypass -File .\local-bridge\uninstall.ps1
```

The uninstaller removes only Magnanimous Local Bridge files and the scheduled task. It does not delete a non-empty workspace.
