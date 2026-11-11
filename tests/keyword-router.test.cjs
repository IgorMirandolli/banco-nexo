const test = require("node:test");
const assert = require("node:assert/strict");
const classify = require("../assets/js/keyword-router.js");

test("reconhece frases, acentos e letras maiúsculas", () => {
  assert.equal(classify("Quero consultar meu SALDO"), "balance");
  assert.equal(classify("Quero entender meu saldo"), "explain");
  assert.equal(classify("ver extrato"), "statement");
  assert.equal(classify("estrato"), "statement");
  assert.equal(classify("movimentações"), "statement");
  assert.equal(classify("qual a diferença entre saldo e extrato?"), "explain");
  assert.equal(classify("dicas de SEGURANÇA"), "safety");
  assert.equal(classify("falar com um atendente"), "help");
  assert.equal(classify("voltar ao início"), "home");
});

test("não aceita parte de uma palavra como comando", () => {
  assert.equal(classify("saldosdesconhecidos"), "unknown");
});

test("não escolhe silenciosamente entre dúvidas distintas", () => {
  assert.equal(classify("saldo ou atendente"), "ambiguous");
  assert.equal(classify("segurança e extrato"), "ambiguous");
});

test("dados pessoais e operações fora do MVP recebem orientação", () => {
  assert.equal(classify("minha senha 123456 saldo"), "private");
  assert.equal(classify("meuemail@exemplo.com"), "private");
  assert.equal(classify("quero fazer pix"), "unsupported");
  assert.equal(classify("pagar boleto"), "unsupported");
});

test("entrada vazia e assuntos desconhecidos têm saída explícita", () => {
  assert.equal(classify("  "), "empty");
  assert.equal(classify("batata"), "unknown");
});
