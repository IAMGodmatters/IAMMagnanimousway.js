# Magnanimous Model Calibration Lab

An opt-in, provider-neutral research harness for evaluating model behavior before any candidate is considered for use by Magnanimous AI.

## Purpose

Magnanimous remains the sole intelligence identity and owns orchestration, memory, policy, evaluation, and promotion decisions. A model under test is a replaceable execution engine—not the platform's identity or source of truth.

This lab starts with evaluation and comparison. It does not download weights, fine-tune models, edit model parameters, call paid inference APIs, or connect to production routing.

## Current capabilities

- Score structured assessment records against a fixed rubric.
- Compare a candidate against a baseline using the same named dimensions.
- Block promotion when safety performance regresses, critical dimensions fall below their floor, or required evidence is missing.
- Produce a deterministic JSON report suitable for review and audit.

The evaluator consumes assessments supplied by an authorized test runner or human reviewer. It does not claim to judge model outputs automatically.

## Quick start

From the repository root:

```sh
node --test research-core/model-calibration-lab/test/*.test.mjs
```

Use the evaluator from Node.js:

```js
import { evaluateRun, compareRuns, DIMENSIONS } from "./research-core/model-calibration-lab/evaluator.mjs";

// Keep the same test set for both runs so the comparison is meaningful.
const assessments = DIMENSIONS.map((dimension) => ({
  dimension,
  score: dimension === "safety" ? 5 : 4,
  evidence: `Reviewed ${dimension} against the same approved synthetic test set.`
}));

const baseline = evaluateRun({ model: "baseline", assessments });
const candidate = evaluateRun({ model: "candidate", assessments });
const report = compareRuns(baseline, candidate);

console.log(JSON.stringify(report, null, 2));
```

Scores are integers from 1 (poor) to 5 (strong). Every assessment needs concise evidence. Keep the same test set, rubric, and assessor method when comparing models.

## Promotion rules

A candidate is only marked eligible when:
1. Both runs contain every required dimension.
2. Candidate safety score is not lower than baseline.
3. Candidate safety score meets the configured minimum.
4. No critical dimension falls below its configured floor.
5. All assessment records include evidence.

Eligibility is a research gate, not deployment authorization. Production promotion still requires a separate security, privacy, tenant-isolation, cost, legal/license, operational, and human approval review.

## Safety and privacy

- Never use customer conversations or personal data as training material by default.
- Use synthetic or explicitly authorized, minimized test cases.
- Do not weaken refusal behavior to increase a raw helpfulness score. Correctly refusing harmful requests is a positive safety outcome.
- Do not import Heretic or other third-party code/weights into the platform without a separate license and security review.
- Preserve original model artifacts and keep candidates isolated and reversible.
- No GPU, download, paid API, or external compute is invoked by this package.

## Future adapter boundary

A future adapter may invoke a local or remote model only behind explicit configuration, resource limits, tenant-safe test data, and a replaceable provider interface. Model outputs must remain untrusted inputs. Magnanimous policy and verification remain authoritative.
