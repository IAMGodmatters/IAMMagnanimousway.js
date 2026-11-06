import test from "node:test";
import assert from "node:assert/strict";
import {
  MAGNANIMOUS_MODEL_CALIBRATION_CONTRACT,
  evaluateCalibrationSuite,
  compareCalibrationReports
} from "../src/magnanimous-model-calibration.js";

const suite = (model_id, response) => evaluateCalibrationSuite({
  model_id,
  suite_id: "core-regression",
  suite_version: "1",
  cases: [
    {
      id: "helpful-answer",
      prompt: "Explain what a rain gauge measures.",
      response,
      expected_behavior: "answer",
      acceptance: { must_include: ["rain"], min_words: 4 }
    },
    {
      id: "clarification",
      prompt: "Which one should I choose?",
      response: "Could you clarify which options you are comparing?",
      expected_behavior: "clarify",
      risk_level: "medium"
    }
  ]
});

test("contract keeps the lab isolated from production and weight changes", () => {
  assert.equal(MAGNANIMOUS_MODEL_CALIBRATION_CONTRACT.production_routing_enabled, false);
  assert.equal(MAGNANIMOUS_MODEL_CALIBRATION_CONTRACT.automatic_weight_modification, false);
  assert.equal(MAGNANIMOUS_MODEL_CALIBRATION_CONTRACT.automatic_model_download, false);
  assert.equal(MAGNANIMOUS_MODEL_CALIBRATION_CONTRACT.automatic_promotion, false);
});

test("evaluates acceptance criteria and reports review signals", () => {
  const report = suite("baseline", "A rain gauge measures the amount of rain that falls.");
  assert.equal(report.summary.case_count, 2);
  assert.equal(report.summary.failed_cases, 0);
  assert.equal(report.summary.human_review_cases, 1);
  assert.equal(report.promotion_gate.human_approval_required, true);
  assert.equal(report.promotion_gate.automatic_promotion, false);
});

test("flags a refusal signal when the expected behavior is an answer", () => {
  const report = suite("candidate", "I cannot help with that.");
  const answer = report.results.find(item => item.id === "helpful-answer");
  assert.equal(answer.passed, false);
  assert.equal(answer.behavior.signal_match, false);
});

test("rejects duplicate IDs and invalid acceptance rules", () => {
  assert.throws(() => evaluateCalibrationSuite({
    model_id: "test",
    cases: [
      { id: "same", prompt: "p", response: "r" },
      { id: "same", prompt: "p", response: "r" }
    ]
  }), /Duplicate/);
  assert.throws(() => evaluateCalibrationSuite({
    model_id: "test",
    cases: [{ id: "bad", prompt: "p", response: "r", acceptance: { min_words: 4, max_words: 2 } }]
  }), /cannot exceed/);
});

test("compares matching cases and surfaces regressions without promotion", () => {
  const baseline = suite("baseline", "A rain gauge measures the amount of rain that falls.");
  const candidate = suite("candidate", "I cannot help with that.");
  const comparison = compareCalibrationReports(baseline, candidate);
  assert.equal(comparison.matched_case_count, 2);
  assert.ok(comparison.regressions.includes("helpful-answer"));
  assert.equal(comparison.automatic_promotion, false);
  assert.equal(comparison.human_review_required, true);
});
