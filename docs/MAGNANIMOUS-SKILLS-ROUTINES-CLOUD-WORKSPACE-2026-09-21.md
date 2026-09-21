# Magnanimous Skills, Routines & Persistent Cloud Workspace — 2026-09-21

## Purpose

Magnanimous AI now owns a first-party reusable **Skill → Routine** lifecycle. Repeatable work can be saved as a skill, learned from an owner-supplied demonstration, scheduled as a routine, executed by the standalone Magnanimous runtime, retried when recoverable failures occur, and reviewed through durable run history.

This is an original Magnanimous implementation of general agent-workflow patterns. It does not copy xAI, Grok Bot, Cursor, or another provider's private source code, hidden prompts, model weights, credentials, proprietary infrastructure, or branding.

## What is native

The new runtime is implemented in:

- `worker/src/magnanimous-skill-routine-runtime.js`
- `frontend/app/routine-studio/page.tsx`
- `worker/src/operations-entrypoint.js`
- `worker/src/magnanimous-universal-capabilities.js`
- `qa/scripts/magnanimous-routine-studio-lock.mjs`

Magnanimous owns and persists:

- skill definitions and versions;
- learned demonstration steps;
- schedules;
- run state and history;
- bounded retry state;
- exact approval state for interactive browser actions;
- tenant/user-scoped cloud workspace identity;
- cloud workspace files;
- sandbox workspace roots;
- orchestration and specialist-agent handoffs.

## Execution surfaces

A skill may contain bounded steps for:

- Magnanimous AI prompts;
- specialist branch handoffs;
- server-side browser rendering;
- isolated cloud sandbox commands;
- persistent workspace file reads and writes;
- native browser search, fetch, research and read flows;
- approval-gated native browser action flows.

Cloud-capable steps run on the standalone Magnanimous runtime and therefore do not require the owner's laptop to remain on. Interactive authenticated browser operations may still use the paired Magnanimous Local Bridge where local browser state is required.

## Persistent workspace isolation

Every platform owner receives a durable workspace record with a generated `root_key`. Sandbox execution is forced below:

`routine-workspaces/<workspace-root-key>/...`

The caller cannot choose an absolute path or traverse upward with `..`. Database-backed workspace files are separately scoped by tenant.

This preserves the existing sandbox service while preventing Routine Studio from treating its shared service root as a user workspace.

## Approval rules

Routine scheduling never implies authorization for consequential browser writes.

A `native-web.action_flow` step enters `needs_confirmation`. The exact run must be approved with `confirm=true` before the already-created browser task can enter the execution queue. Approval of one task does not pre-authorize a later task in the same routine.

Scheduled routines therefore support unattended read/research/AI/sandbox/workspace activity while keeping interactive browser writes human-gated.

## Scheduling and retries

The existing standalone scheduler invokes `scheduledMagnanimousRoutines` along with the platform's other scheduled systems.

- Minimum routine interval: 15 minutes.
- Maximum configured interval: 7 days.
- Retry attempts are bounded to 1–8.
- Failed runs move through `retry_wait` with increasing delay before becoming terminal.
- Runs waiting on Local Bridge work are reconciled on later scheduler passes.

## Truth boundary

“Persistent cloud workspace” means Magnanimous owns the software workspace, scheduler, state machine, files, isolation contract, and execution routing. Physical CPU, RAM, disks, public networking, and Internet transit still require owner-operated hardware or a replaceable hosting rail.

The platform must not claim a full remote desktop, proprietary anti-bot network, residential proxy fleet, or unlimited compute unless that infrastructure is actually deployed and verified.
