# Magnanimous Native-First Brain

Magnanimous AI is the brain, identity, memory owner, planner, policy layer, skill owner, orchestrator, verifier, and learning system for I AM MAGNANIMOUS WAY™.

The native-first architecture reduces permanent dependence on plugins, model vendors, connectors, and external services by moving reusable behavior into Magnanimous-owned code, memory, policies, recipes, and workflows whenever that is technically possible.

## What “native-first” means

Magnanimous should own:

- identity and public product behavior;
- memory and continuity;
- planning and orchestration rules;
- reusable software-engineering procedures;
- capability specifications;
- Tool Foundry recipes;
- God Coding self-development discipline;
- verification and regression rules;
- product/business workflows that can run on Magnanimous-owned storage and compute;
- provider routing and fallback policy.

External services are treated as replaceable bridges only when the task inherently crosses an external boundary, such as:

- a third-party account the user owns;
- live data outside Magnanimous;
- a payment or telecom/network rail;
- repository hosting or a deployment target;
- specialized compute or a model runtime Magnanimous does not yet host itself.

Those bridges do not become the brain or memory owner.

## Capability assimilation

`worker/src/magnanimous-native-first.js` builds a durable capability matrix from the integration catalog. External tools are treated as observable capability benchmarks, not as source code to copy.

For each benchmark family, Magnanimous can generate a native Tool Foundry specification that:

1. defines provider-independent inputs and outputs;
2. decomposes the capability into logic, workflow, data, UI, storage, compute, and external-boundary pieces;
3. implements reusable logic and workflow inside Magnanimous where practical;
4. isolates only unavoidable outside account/data/network/compute boundaries behind replaceable bridges;
5. requires regression checks proving the native path does not depend on the benchmark provider.

The owner endpoint is:

`POST /api/magnanimous/native-first/assimilate`

Calling it without a target specifies the full tracked capability catalog in Tool Foundry.

## God Coding self-development

God Coding is an internal Magnanimous capability, not merely a page.

`POST /api/magnanimous/native-first/self-develop`

creates a durable self-development plan for Magnanimous itself. The plan uses the existing Dev Agent for repository inspection and staged implementation, while preserving approval, CI, merge, and deployment controls.

The default God Coding page behavior does **not** require an outside model. It can produce the Magnanimous-native engineering plan and inspected evidence directly. An outside model may be enabled as optional compute acceleration, but it remains an execution engine rather than the brain.

## Self-modification boundary

Native-first does not mean uncontrolled self-deployment.

Magnanimous may natively:

- identify capability gaps;
- create native specifications;
- plan self-development;
- inspect source;
- learn reusable procedures;
- prepare staged changes;
- verify evidence.

Consequential repository mutations, merges, production deployment, payment/network actions, and external account actions keep their real authorization and verification boundaries.

This preserves the existing safety architecture while allowing Magnanimous to become progressively more self-contained.

## Proprietary systems

Magnanimous may reproduce the **observable capability class** of another tool with original Magnanimous code and workflows. It does not copy proprietary source code, private prompts, model weights, credentials, private APIs, or provider internals.

## Storage

Migration `0068_magnanimous_native_first.sql` adds:

- `magnanimous_native_capability_matrix`
- `magnanimous_self_development_runs`

The capability matrix tracks what is already native, what has a native specification, and what external boundary remains.

## Verification

`.github/workflows/native-first-brain-lock.yml` runs `qa/scripts/magnanimous-native-first-lock.mjs` and a Worker syntax check on every branch push and pull request.
