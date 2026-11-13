const test = require("node:test");
const assert = require("node:assert/strict");
const transactions = require("../assets/js/transactions.js");
const seed = require("../assets/js/data/statement-data.js");
const create = () => transactions.createAccount(seed, () => new Date("2026-11-13T15:00:00Z"));

test("valores em centavos com formato brasileiro e rejeição de entradas inválidas", () => {
  for (const [value, expected] of [["25,50", 2550], ["1.250,00", 125000], ["12.34", 1234], ["0,01", 1], ["50", 5000]]) assert.equal(transactions.parseAmount(value), expected);
  for (const value of ["", "-1", "1,234", "1e3", "NaN", "1.250", "0,00x", "99999999999999999999"]) assert.equal(transactions.parseAmount(value), null);
});
test("preparar, cancelar e confirmar não permitem débitos antecipados ou duplicados", () => {
  const account = create();
  let result = account.prepare("pix", { recipientId: "ana", amount: "25,50" });
  assert.equal(account.snapshot().closingCents, 125000);
  account.cancel(result.draft.id);
  assert.equal(account.confirm(result.draft.id).ok, false);
  result = account.prepare("pix", { recipientId: "ana", amount: "25,50" });
  const confirmed = account.confirm(result.draft.id);
  assert.equal(confirmed.receipt.balanceAfterCents, 122450);
  assert.equal(account.confirm(result.draft.id).receipt.id, confirmed.receipt.id);
  assert.equal(account.snapshot().entries.length, 5);
  assert.equal(account.snapshot().closingCents, 122450);
  assert.equal(seed.entries.length, 4);
});
test("validação de destinatário, saldo, valor e pagamento repetido", () => {
  const account = create();
  assert.equal(account.prepare("pix", { recipientId: "real", amount: "10" }).ok, false);
  for (const amount of ["0", "-10", "2000", "1,234"]) assert.equal(account.prepare("transfer", { recipientId: "ana", amount }).ok, false);
  assert.equal(account.prepare("payment", { billId: "missing" }).ok, false);
  const first = account.prepare("payment", { billId: "energy", amount: "0,01" }).draft;
  const second = account.prepare("payment", { billId: "energy" }).draft;
  assert.equal(first.amountCents, 8000);
  assert.equal(account.confirm(first.id).ok, true);
  assert.equal(account.confirm(second.id).ok, false);
  assert.equal(account.prepare("payment", { billId: "energy" }).ok, false);
});
test("saldo atualizado é revalidado, e reiniciar invalida revisões antigas", () => {
  const account = create();
  const first = account.prepare("transfer", { recipientId: "lucas", amount: "1000" }).draft;
  const second = account.prepare("pix", { recipientId: "ana", amount: "500" }).draft;
  account.confirm(first.id);
  assert.equal(account.confirm(second.id).ok, false);
  const snapshot = account.snapshot();
  assert.equal(snapshot.openingCents + snapshot.entries.reduce((sum, entry) => sum + entry.amountCents, 0), snapshot.closingCents);
  snapshot.entries.length = 0;
  assert.equal(account.snapshot().entries.length, 5);
  account.reset();
  assert.equal(account.snapshot().closingCents, 125000);
  assert.equal(account.snapshot().entries.length, 4);
  assert.equal(account.confirm(first.id).ok, false);
  assert.equal(account.prepare("pix", { recipientId: "ana", amount: "1250" }).ok, true);
});
