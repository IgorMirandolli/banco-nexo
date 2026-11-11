const assert = require("node:assert/strict");
const statement = require("./statement-data.js");
assert.equal(statement.entries.length, 4);
assert.equal(statement.openingCents, 50000);
assert.equal(statement.incomingCents, 100000);
assert.equal(statement.outgoingCents, 25000);
assert.equal(statement.closingCents, 125000);
assert.equal(statement.openingCents + statement.incomingCents - statement.outgoingCents, statement.closingCents);
for (const entry of statement.entries) {
  assert.equal(Number.isInteger(entry.amountCents), true);
  assert.ok(entry.explanation);
}
console.log("Extrato: quatro movimentações fictícias e saldo final de R$ 1.250,00 verificados.");
