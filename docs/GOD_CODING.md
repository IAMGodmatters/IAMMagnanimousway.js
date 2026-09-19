# God Coding

God Coding is a private owner-facing and internal software-engineering capability inside I AM MAGNANIMOUS WAY™ / Magnanimous AI.

It is not a separate AI identity and does not depend on Codex. Magnanimous AI remains the brain, planner, memory owner, skill owner, orchestrator, verifier, and learning system. God Coding reuses the Magnanimous Dev Agent, Tool Foundry, capability matrix, repository evidence, CI evidence, and staged-action architecture.

## Native-first role

God Coding now has two roles:

1. **Project engineering** — build, fix, review, and verify ordinary software work.
2. **Magnanimous self-development** — help Magnanimous inspect and improve its own source, skills, capability specifications, verification, and architecture.

The native-first runtime lives in `worker/src/magnanimous-native-first.js` and is exposed to the owner through:

- `GET /api/magnanimous/native-first`
- `POST /api/magnanimous/native-first/assimilate`
- `POST /api/magnanimous/native-first/self-develop`

## Outside models are optional

The God Coding page defaults to a Magnanimous-native plan without requiring an outside model. Repository inspection, developer planning, self-development planning, capability assimilation, and verification policy remain Magnanimous-owned.

An outside model can be enabled as optional compute acceleration. The owner UI sends that work only to `POST /api/magnanimous/compute-accelerator`, a dedicated advisory-only gateway. The gateway forces tools, Magnanimous memory access/writes, knowledge retrieval, link learning, live search, specialist routing, OGENIC initiative, repository authority, approvals, merges and deployments off. It uses free-first configured compute only; metered accelerator use is disabled by this route. Provider identity is stripped from the owner-facing accelerator response. If acceleration fails or is disabled, God Coding still returns the native plan and inspected evidence instead of treating a provider as the brain.

## Capability assimilation

The **Assimilate All Capability Targets** control converts the useful observable capability classes in Magnanimous' integration catalog into original native Tool Foundry specifications.

This does not copy proprietary provider source code, hidden prompts, credentials, model weights, or private internals. It creates Magnanimous-owned implementation targets and reusable procedures so provider dependence can shrink over time.

## Engineering standard

God Coding instructs Magnanimous to:

- preserve unrelated working functionality;
- inspect repository evidence before proposing changes;
- identify root causes rather than patch symptoms;
- prefer the smallest coherent safe change;
- decompose large functions into smaller, single-purpose helpers;
- apply SOLID principles so each class or service owns one clear business responsibility and depends on abstractions at external boundaries;
- favor composition and dependency injection over giant monolithic classes, route handlers, or service objects;
- implement reusable logic and workflow natively where practical;
- isolate only irreducibly external account, live-data, network/payment, repository/deployment, or compute boundaries behind replaceable bridges;
- evaluate correctness, security, privacy, accessibility, performance, and regression impact;
- name exact files and verification requirements;
- distinguish evidence from assumptions;
- avoid claiming tests, commits, deployments, or external mutations without real tool evidence;
- keep consequential repository writes behind the existing separate owner-approval boundary.

### Architecture interpretation

For new or refactored Magnanimous code, God Coding should prefer a composition-root pattern: domain rules and use-cases depend on small ports/interfaces, infrastructure adapters implement those ports, and the composition root injects concrete dependencies. HTTP routes, UI handlers, carrier adapters, payment adapters, repository adapters, and other boundary code should remain thin. This makes outside providers replaceable without moving Magnanimous identity, memory, policy, or business logic into the provider.

## Self-development safety

God Coding may plan improvements to Magnanimous, learn reusable procedures, inspect source, and prepare staged changes. It may not silently merge or deploy itself. Existing repository approval, merge locks, CI, security boundaries, and production verification remain in force.

## Security and privacy

The God Coding page is owner-authenticated through the same platform-owner boundary used by the existing Developer Agent APIs. Repository credentials stay server-side. The route is excluded from crawler indexing in `frontend/public/robots.txt`.

God Coding does not weaken the Dev Agent write gate, merge lock, repository allowlist, audit ledger, or deployment verification controls.
