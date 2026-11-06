# Magnanimous Model Calibration Lab

## Purpose

This is a provider-neutral, opt-in evaluation boundary for comparing already-generated model responses against versioned Magnanimous test cases. Magnanimous AI remains the owner of identity, memory, orchestration, policy, evaluation and promotion decisions. A model provider is only an execution engine.

The first implementation is deliberately local and deterministic: it evaluates prompt/response pairs supplied by a caller. It does not invoke a model or external service.

## Included

- Explicit acceptance assertions (required phrases, prohibited phrases and word-count bounds).
- Expected answer/refusal/clarification behavior labels.
- Advisory lexical indicators for refusal, clarification, sycophancy and repeated sentences.
- Versioned report metadata and baseline/candidate comparison by stable case ID.
- A promotion gate that always requires human approval and independent safety review.

## Hard boundaries

- No production routing integration or automatic model selection.
- No model downloads, GPU work, weight edits, fine-tuning or automatic promotion.
- No training on customer data and no prompt/response persistence by this module.
- No raw prompt or response text in report output; only case IDs, counts and assertion outcomes are emitted.
- No external dependency is required by the evaluator.

## Run tests

From the repository's `worker` directory, run:

```sh
node --test test/magnanimous-model-calibration.test.js
```

## Case format

```js
{
  id: "helpful-answer",
  prompt: "Explain what a rain gauge measures.",
  response: "A rain gauge measures rainfall over time.",
  expected_behavior: "answer", // any | answer | refuse | clarify
  risk_level: "low",             // low | medium | high | critical
  acceptance: {
    must_include: ["rain"],
    must_not_include: ["invented claim"],
    min_words: 4,
    max_words: 80
  }
}
```

## Interpretation

A passing result means only that the supplied deterministic assertions passed. Lexical indicators are imperfect signals and must not be treated as semantic judgments. A refusal can be correct or incorrect depending on the test case; the expected behavior label is therefore explicit. High-impact, safety-sensitive, factuality and legal cases need independent evaluation and human review.

The comparison function reports regressions, improvements and signal changes only for matching case IDs. It never ranks a model or promotes a candidate. Keep baseline and candidate runs on the same versioned suite before interpreting a comparison.

## Relationship to external model-modification tools

Tools such as Heretic may be studied as optional research instruments, but this lab does not incorporate their code or default refusal-removal behavior. Review upstream licensing and safety implications separately before any code reuse or hosted integration. Calibration should target better instruction following, clarity, consistency and reduced unnecessary refusals without weakening legitimate safeguards.
