# Free-first SkillSpector security gate

Date: October 27, 2026. Source: the Jens Heitmann Facebook reel, which references NVIDIA/SkillSpector in its public video description.

Official project: <https://github.com/NVIDIA/SkillSpector> — Apache-2.0 license, code and scanner retained under NVIDIA's copyright and license. Upstream commit reviewed for integration pin: `d7338f58200a9ae2a24810cee08911ab68b107a7`. The upstream CLI and runtime are NOT owned by Magnanimous; they remain an optional replaceable security adapter.

## Implemented

`.github/workflows/magnanimous-skillspector-preflight.yml` is an owner-triggered GitHub Actions workflow that scans a public third-party repository at an explicit immutable commit before Magnanimous considers installing its AI-agent skills.

- GitHub public `owner/repo` and 40-character SHA validation before fetching.
- Upstream SkillSpector pinned to the exact commit; no floating `main` install.
- Ephemeral public source checkout, verified again after fetch. No source scripts are deliberately executed.
- Free static analysis (`--no-llm`), strict checks for any active findings and incomplete coverage, with a 95% minimum.
- JSON report artifact retained for seven days; scanner findings and errors fail the workflow.
- Read-only workflow token permissions; no LLM credentials. Manual runs only, so no automatic paid runner activity.

## Owner usage

1. First use the Magnanimous Developer Agent's **Repository Preflight** to inspect the public repository. A blocked preflight stays blocked.
2. Open GitHub → **Actions** → **Magnanimous External Skill Preflight (No LLM)** → **Run workflow**.
3. Enter the public `owner/repository` and the exact 40-character commit SHA that you intend to assess.
4. Inspect the workflow result and its report artifact. A green static scan is necessary for this workflow's narrow gate, **not sufficient authorization** to install an unfamiliar agent skill. Check its license, origin, permissions and actual integration separately.

Existing owner-gated Developer Agent workflow dispatch can also stage the action with:

```json
{
  "workflow_id": "magnanimous-skillspector-preflight.yml",
  "ref": "main",
  "inputs": {
    "repository": "public-owner/public-repo",
    "commit_sha": "<verified 40-character commit SHA>"
  }
}
```

Stage it with `dispatch_workflow` and approve it separately. No direct browser token entry is required.

After the native Repository Preflight returns a verified commit SHA, the Developer Agent also provides **Prepare Deep Static Scan**. It fills in the above immutable commit and workflow ID, then takes the owner to the staged-action review. This button never starts the scan itself. Only a successful separate owner-confirmed workflow dispatch launches the GitHub Actions job.

## Boundaries

SkillSpector's static analysis has false negatives and false positives. The upstream tool may also consult free OSV vulnerability lookups; `--no-llm` means no paid model is called, **not** a guarantee that all network access is disabled. GitHub Actions free-minute availability depends on account/repository visibility; this is manual-only to prevent silent variable usage. The code does not download and install NVIDIA's software onto the customer-facing Worker and does not call an unconfigured paid GPU/LLM service. No imported skill is automatically activated.

This supplements, but does not replace, Magnanimous's native bounded repository preflight and existing dependency security workflows. There is no lawful or technical basis to claim NVIDIA's upstream intellectual property as proprietary Magnanimous work.
