# Magnanimous Teammates

Original implementation researched on September 28, 2026. This is a capability implementation, not a copy of Grok Bot, its models, private plugins, weights or training data. Magnanimous AI remains the single platform identity. No additional AI subscription or external account is created by this change.

## Public sources

- [Grok Bot overview](https://docs.x.ai/grok-bot/overview): persistent named roles, context, cross-tool work and handoffs.
- [Bot profiles](https://docs.x.ai/grok-bot/bots): explicit jobs, instructions and continuing conversations.
- [Skills and routines](https://docs.x.ai/grok-bot/skills-routines-and-automations): reusable procedures, demonstrations, schedules, test runs and run history.
- [Computer and apps](https://docs.x.ai/grok-bot/computer-and-apps): persistent computer workspaces, browser sessions, connectors and human authentication handoffs.
- [Approvals and privacy](https://docs.x.ai/grok-bot/approvals-security-and-privacy): meaningful action review, least privilege and human handling of credentials.

These links document behavior, not a license to redistribute proprietary implementations or datasets. The role templates and code in this change are original. No third-party repository has been vendored.

## What this change delivers

The protected `/teammates` interface creates named roles, preserves conversations, edits explicit private memory, runs bounded inference, researches with sources and passes a selected completed result to another teammate. Ten starter roles cover coordination, research, pipeline analysis, outreach drafting, campaigns, feedback, engineering review, account health, coaching and operations. Templates are starting instructions, not claims that an account has been connected.

Each record is scoped by **tenant and user**, not just tenant. Teammates do not silently read one another's memory. Handoffs copy only the selected task and answer. Research deliberately uses the existing shared tenant knowledge/search interface and identifies its sources; it does not retrieve private teammate memories. Source-free research fails visibly rather than claiming a researched answer. User and tenant isolation have executable SQLite coverage.

The interface links the existing authorized browser, connector, developer, voice and media workspaces. Conversation text alone cannot send, publish, spend, delete, invoke a shell or change production. Source text and model output never become executable commands. Existing approval and funding gates remain in place.

## Capability coverage and remaining boundaries

| Capability | Implementation / boundary |
| --- | --- |
| Named teammates, private memory and history | New durable tables and authenticated UI/API |
| Teammate collaboration | Explicit result handoffs; different teammates can run independently; one active turn per teammate |
| Web research | Existing workspace/live search, with saved source receipts; no result means a visible failure |
| Reusable skills | New `teammate.prompt` step in the existing runner; saved via the existing owner authorization gate |
| Background schedules | Existing server scheduler executes teammate steps; saving a skill does not enable a schedule |
| Demonstration learning | Existing recorded-step compiler; not a new screen recorder |
| Shared files and terminal | Existing Routine Studio workspace and attached sandbox; runtime readiness still required |
| Browser sessions and app tools | Existing Native Web / Local Bridge and authorized connectors; this release does not provision a new per-user cloud desktop |
| Voice, image and video | Existing workspaces; compute, permissions and cost checks still apply |
| General autonomous agent teams | Not delivered: no automatic task decomposition, recursive delegation, group chat or unrestricted autonomous actions |
| Private Grok knowledge/tools | Not available or copied; authorized sources can be brought into Magnanimous Knowledge Center |

## Execution contracts

- Chat calls the existing Magnanimous provider entrypoint and premium guard in bounded, compute-only, free-first mode. Caller-supplied provider, approval, tool and accelerator fields are not forwarded. It cannot silently switch to a paid provider.
- Client request keys are bound to a hash of their inputs. Replays return the original receipt. Same-key/different-input requests fail with 409. In-progress replays and overlapping turns are refused.
- Failures are recorded, not silently retried. A genuinely new attempt requires a new request key. The UI retains a key across an uncertain network retry.
- An expired execution lease can be reclaimed; an old unfinished turn becomes interrupted. A late result cannot overwrite that state. No externally consequential actions occur inside this inference lease.
- Routine steps use a stable run/step request key, so a resumed step does not repeat the same inference. Concurrent scheduler ticks use a compare-and-swap claim for due routines.
- Paused teammates refuse new turns. Cross-user or cross-tenant IDs return 404. Routine skills referring to another user’s teammate cannot execute it.
- Memory deletion removes the explicit preference only; previously generated conversation answers are retained. Do not store secrets in memory.

## Verification and rollout

Run `node qa/scripts/magnanimous-teammates-lock.mjs` for functional API, database, isolation, replay, concurrency, real provider-adapter, and scheduled-run tests. The test uses local SQLite, fake accounts and a local AI binding, with external network calls blocked during executor tests; it does not mutate production or claim live model quality.

Apply migration `0093_magnanimous_teammates.sql` through the normal deployment workflow. Runtime schema initialization is idempotent for both D1 and the standalone SQLite compatibility binding. Keep exact-head QA and normal protected-branch review. After deployment, verify sign-in, two private teammates, a sourced research result, a handoff, and a manually tested skill using an authorized account. Account-dependent acceptance cannot be proved by public-page checks alone.
