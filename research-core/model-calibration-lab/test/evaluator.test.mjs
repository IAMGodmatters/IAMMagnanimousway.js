import test from "node:test";
import assert from "node:assert/strict";
import { compareRuns, DIMENSIONS, evaluateRun } from "../evaluator.mjs";

const makeAssessments = (overrides = {}) => DIMENSIONS.map((dimension) => ({
  dimension,
  score: overrides[dimension] ?? 4,
  evidence: `Reviewed ${dimension} against the same test set.`
}));

test("evaluates a complete run deterministically", () => {
  const run = evaluateRun({ model: "baseline", assessments: makeAssessments() });
  assert.equal(run.complete, true);
  assert.deepEqual(run.missing, []);
  assert.equal(run.average, 4);
});

test("rejects missing evidence, invalid scores, and duplicate dimensions", () => {
  assert.throws(() => evaluateRun({
    model: "x",
    assessments: [{ dimension: "safety", score: 5, evidence: " " }]
  }), /evidence is required/);
  assert.throws(() => evaluateRun({
    model: "x",
    assessments: [{ dimension: "safety", score: 6, evidence: "reviewed" }]
  }), /integer from 1 to 5/);
  assert.throws(() => evaluateRun({
    model: "x",
    assessments: [
      { dimension: "safety", score: 5, evidence: "first" },
      { dimension: "safety", score: 5, evidence: "second" }
    ]
  }), /duplicate assessment/);
});

test("allows further review when all gates pass", () => {
  const baseline = evaluateRun({ model: "base", assessments: makeAssessments() });
  const candidate = evaluateRun({ model: "candidate", assessments: makeAssessments({ clarity: 5 }) });
  const report = compareRuns(baseline, candidate);
  assert.equal(report.eligibleForFurtherReview, true);
  assert.equal(report.deltas.clarity, 1);
  assert.deepEqual(report.blockers, []);
});

test("blocks any safety regression even when other scores improve", () => {
  const baseline = evaluateRun({ model: "base", assessments: makeAssessments() });
  const candidate = evaluateRun({
    model: "candidate",
    assessments: makeAssessments({ clarity: 5, safety: 3 })
  });
  const report = compareRuns(baseline, candidate);
  assert.equal(report.eligibleForFurtherReview, false);
  assert.ok(report.blockers.includes("safety_regression"));
  assert.ok(report.blockers.includes("safety_below_floor"));
});

test("blocks incomplete runs and critical dimension regressions", () => {
  const baseline = evaluateRun({ model: "base", assessments: makeAssessments() });
  const incomplete = evaluateRun({
    model: "candidate",
    assessments: makeAssessments().filter((item) => item.dimension !== "factual_grounding")
  });
  const report = compareRuns(baseline, incomplete);
  assert.equal(report.eligibleForFurtherReview, false);
  assert.ok(report.blockers.includes("incomplete_assessments"));
  assert.ok(report.blockers.includes("critical_dimension_below_floor"));
});
