# Magnanimous Dev Agent

Magnanimous Dev Agent is the software-engineering execution arm of Magnanimous AI. It is an original platform capability designed to provide the useful class of developer-agent workflows often associated with coding agents without making Codex, another AI brand, or any proprietary external runtime the platform identity or owner of memory.

## Architecture

Magnanimous AI remains the planner, memory owner, skill owner, orchestration layer and public identity. AI models, GitHub, CI runners and future sandbox providers are replaceable execution adapters.

The production Worker still enters through `worker/src/security-entrypoint.js`. Developer-agent requests then pass through the secured operations layer to `worker/src/magnanimous-dev-agent.js`.

The first release provides:

- repository and directory inspection;
- file reading;
- targeted code search;
- task planning and skill selection;
- Magnanimous-assisted engineering analysis grounded in inspected repository evidence;
- CI workflow history;
- staged branch creation;
- staged file create/update;
- staged pull-request creation;
- staged workflow dispatch;
- independently locked pull-request merging;
- a durable developer-action ledger;
- reusable engineering skills seeded into Magnanimous Tool Foundry.

## Reusable developer skills

The built-in skill pack includes repository mapping, targeted search, codebase health, bug fixing, feature building, safe refactoring, code review, security review, CI diagnosis, release verification, branch/PR workflow, and developer-skill learning.

A skill is a Magnanimous-owned procedure, not inherited authorization. A recipe can describe how to inspect or modify a repository, but real repository writes still require a configured repository adapter, valid credentials and the approval gate.

## Repository access

Repositories are restricted by `MAGNANIMOUS_DEV_REPOS`. Production defaults to:

`IAMGodmatters/IAMMagnanimousway.js`

Public repository reads can work without a write token where the repository provider permits it. Repository mutations require a protected Worker secret named:

`GITHUB_PLATFORM_TOKEN`

The token must be stored server-side only. It is never entered or rendered in the browser. Use least privilege. For this repository, prefer a fine-grained token or GitHub App installation token limited to the required repository and required permissions only.

The platform does not inherit ChatGPT/Codex connector credentials automatically. External account authorization remains explicit.

## Consequential-write contract

Repository mutations use the same safety pattern as other consequential platform operations:

1. Magnanimous prepares the intended action.
2. The action is persisted as `needs_confirmation`.
3. The owner reviews the exact stored payload.
4. A separate confirmation request is required.
5. Approval expires after 15 minutes.
6. Only the owner who staged the action may approve it.
7. The action result is written back to the durable ledger.

Staging never means execution.

Pull-request merge has a second hard lock: `DEV_AGENT_MERGE_ENABLED` defaults to `false`. This allows branch/file/PR/CI workflows to become available without automatically granting merge authority.

## Codex usage

Codex is not required by this runtime. Magnanimous can plan, read repository evidence, manage its skill pack, stage GitHub changes and dispatch CI through its own platform code once the repository adapter is authorized.

A sandbox shell/terminal runner is intentionally not fabricated. `DEV_AGENT_RUNNER_URL` is reserved for a future isolated execution service. Until such a runner is actually connected, local command execution must not be claimed. CI workflows can provide real build/typecheck/test evidence in the meantime.

## Owner console

The owner interface is available at:

`/developer-agent`

The console separates analysis from execution. Read operations are immediate. Repository writes are staged and displayed in the review queue before a separate **Reviewed — Approve & Run** action.

## Verification

`qa/scripts/magnanimous-dev-agent-lock.mjs` protects the ownership, routing, credential, staged-write, merge-lock, Tool Foundry, UI and accessibility contracts.

Full Platform QA executes that lock and also typechecks/builds the frontend plus syntax-checks Worker source.
