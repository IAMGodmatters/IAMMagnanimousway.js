# Magnanimous Model Calibration Lab

This additive, opt-in lab evaluates candidate model behavior without changing Magnanimous production routing.

## Two evaluation layers

- `research-core/model-calibration-lab` provides structured human/authorized-runner assessments for instruction adherence, factual grounding, clarity, repetition, sycophancy and safety. It blocks further review when evidence is incomplete, safety regresses, or required score floors are missed.
- `worker/src/magnanimous-model-calibration.js` evaluates supplied prompt/response pairs with explicit assertions and advisory lexical signals. It never calls a model, network, filesystem or GPU.

## Run tests

From the repository root:

```sh
node --test research-core/model-calibration-lab/test/*.test.mjs
```

From the `worker` directory:

```sh
node --test test/magnanimous-model-calibration.test.js
```

## Boundaries

- Magnanimous AI retains identity, memory, orchestration, policy and promotion authority.
- No model downloads, GPU jobs, weight edits, paid inference calls, customer-data training, or production routing changes.
- No automatic candidate promotion. Human approval and independent safety review remain mandatory.
- Use synthetic or explicitly authorized, minimized test cases; do not put secrets or identifiable customer data in evidence.
- Lexical indicators are imperfect review signals, not semantic judgments. Passing a suite does not prove safety, factuality or production readiness.

Heretic and similar weight-modification projects remain research references only. No upstream code or weights are incorporated here. Any later adoption requires separate license, security, safety and resource review.
