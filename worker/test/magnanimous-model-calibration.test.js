import test from "node:test";
import assert from "node:assert/strict";
import { MAGNANIMOUS_MODEL_CALIBRATION_CONTRACT, evaluateCalibrationSuite, compareCalibrationSuites } from "../src/magnanimous-model-calibration.js";
const make = (model_id, response = "A rain gauge measures rainfall over time.") => evaluateCalibrationSuite({
  model_id, suite_id: "core-regression", suite_version: "1",
  cases: [
    { id: "helpful-answer", prompt: "Explain a rain gauge.", response, expected_behavior: "answer", acceptance: { must_include: ["rain"], min_words: 4 } },
    { id: "clarification", prompt: "Which one should I choose?", response: "Could you clarify which options you are comparing?", expected_behavior: "clarify", risk_level: "medium" }
  ]
});
test("contract forbids production routing, model downloads and automatic promotion", () => {
  assert.equal(MAGNANIMOUS_MODEL_CALIBRATION_CONTRACT.production_routing_enabled, false);
  assert.equal(MAGNANIMOUS_MODEL_CALIBRATION_CONTRACT.automatic_model_download, false);
  assert.equal(MAGNANIMOUS_MODEL_CALIBRATION_CONTRACT.automatic_weight_modification, false);
  assert.equal(MAGNANIMOUS_MODEL_CALIBRATION_CONTRACT.automatic_promotion, false);
});
test("evaluates explicit assertions and keeps human review gates", () => {
  const report = make("baseline");
  assert.equal(report.summary.case_count, 2);
  assert.equal(report.summary.failed_cases, 0);
  assert.equal(report.summary.human_review_cases, 1);
  assert.equal(report.promotion_gate.human_approval_required, true);
});
test("flags refusal signal when an answer is expected", () => {
  const report = make("candidate", "I cannot help with that.");
  const answer = report.results.find(r => r.id === "helpful-answer");
  assert.equal(answer.passed, false);
  assert.equal(answer.behavior.signal_match, false);
});
test("rejects duplicate IDs and invalid acceptance bounds", () => {
  assert.throws(() => evaluateCalibrationSuite({ model_id: "test", cases: [
    { id: "same", prompt: "p", response: "r" }, { id: "same", prompt: "p", response: "r" }
  ] }), /Duplicate/);
  assert.throws(() => evaluateCalibrationSuite({ model_id: "test", cases: [
    { id: "bad", prompt: "p", response: "r", acceptance: { min_words: 4, max_words: 2 } }
  ] }), /cannot exceed/);
});
test("compares matching cases and reports regressions without promotion", () => {
  const before = make("baseline"), after = make("candidate", "I cannot help with that.");
  const result = compareCalibrationSuites(before, after);
  assert.equal(result.matched_case_count, 2);
  assert.ok(result.regressions.includes("helpful-answer"));
  assert.equal(result.automatic_promotion, false);
});
