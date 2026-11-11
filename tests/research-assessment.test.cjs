const assert = require("node:assert/strict");
const assessment = require("../assets/js/research-assessment.js");
const pending = assessment.assess();
assert.equal(pending.experiment1IndividualCriterion, null);
assert.equal(pending.experiment3.evaluatedPaths, 0);
assert.equal(pending.experiment3.individualObservationComplete, false);
const complete = assessment.assess({
  concept: "yes", usefulness: "yes", balance: "completed", explanation: "completed", human: "completed",
  criticalBlock: "no", conditions: ["keyboard", "zoom200", "identidade privada"],
  difficulties: ["returnConfusion", "texto livre não autorizado"]
});
assert.equal(complete.experiment1IndividualCriterion, true);
assert.equal(complete.experiment3.completedPaths, 3);
assert.equal(complete.experiment3.individualObservationComplete, true);
assert.equal(complete.experiment3.groupCriterionEvaluated, false);
assert.deepEqual(complete.conditions, ["keyboard", "zoom200"]);
assert.deepEqual(complete.difficulties, ["returnConfusion"]);
assert.equal(assessment.assess({ concept: "yes", usefulness: "no" }).experiment1IndividualCriterion, false);
assert.equal(assessment.assess({ concept: "<script>" }).answers.concept, "pending");
console.log("Avaliação: campos pendentes, observações explícitas e exclusão de dados não permitidos verificados.");
