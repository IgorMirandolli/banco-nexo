const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../assets/js/chat-engine.js");

test("reconhece os serviços, acentos e frases completas", () => {
  const cases = {
    "Quero ver meu EXTRATO": "statement", "estrato": "statement",
    "Como pagar um boleto?": "payment", "Fazer Pix": "pix", "pagar com pix": "pix",
    "preciso fazer uma transferência": "transfer", "qual o limite do cartão?": "cards",
    "ver saldo": "balance", "perdi meu cartão": "safety", "preciso de um atendente": "support",
    "quero aumentar a letra": "accessibility"
  };
  for (const [input, expected] of Object.entries(cases)) assert.equal(engine.classify(input), expected, input);
});
test("assuntos distintos, saudações, continuidade e dúvidas desconhecidas", () => {
  assert.equal(engine.classify("pix e transferência"), "choose");
  assert.equal(engine.classify("olá!"), "greeting");
  assert.equal(engine.classify("como vejo?", "statement"), "statement");
  assert.equal(engine.classify("banana"), "unknown");
  assert.equal(engine.classify(" "), "empty");
  assert.equal(engine.classify("saldodesconhecido"), "unknown");
});
test("identificadores pessoais não viram mensagens de histórico", () => {
  for (const text of ["CPF 123.456.789-00", "senha: segredo", "email@exemplo.com", "cartão 1234 5678 9012 3456"]) {
    assert.equal(engine.classify(text), "private");
    assert.equal(engine.privateInput(text), true);
  }
});
test("todas as respostas e ações possuem destinos conhecidos", () => {
  const views = ["statement", "balance", "payment", "pix", "transfer", "cards", "safety"];
  for (const topic of Object.keys(engine.topics)) {
    const reply = engine.response(topic);
    assert.ok(reply.title);
    assert.ok(reply.paragraphs || reply.steps);
    for (const action of reply.actions || []) {
      assert.ok(action.label);
      if (action.topic) assert.ok(Object.hasOwn(engine.topics, action.topic));
      else assert.ok(views.includes(action.view));
    }
  }
  assert.match(engine.response("support-confirmed").paragraphs.join(" "), /Nenhum chamado real/);
  assert.equal(engine.classify("como vejo", "__proto__"), "unknown");
  assert.ok(engine.response("anything").actions.length > 0);
});
