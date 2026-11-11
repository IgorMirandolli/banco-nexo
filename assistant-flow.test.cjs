// Teste dos fluxos com um DOM mínimo; não substitui inspeção visual/leitor de tela.
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const createSession = require("./test-session.js");
let now = 0;
const metrics = createSession(() => now);
const nodes = new Map();
const documentListeners = {};
function element() {
  const attributes = {};
  const classes = new Set();
  return {
    innerHTML: "", textContent: "", value: "", hidden: true, checked: false,
    parentElement: { scrollTop: 0 }, listeners: {},
    classList: {
      add: value => classes.add(value), remove: value => classes.delete(value),
      contains: value => classes.has(value),
      toggle(value, enabled) { if (enabled === undefined) enabled = !classes.has(value); enabled ? classes.add(value) : classes.delete(value); return enabled; }
    },
    setAttribute(key, value) { attributes[key] = value; },
    getAttribute: key => attributes[key] || null,
    removeAttribute(key) { delete attributes[key]; },
    addEventListener(type, callback) { this.listeners[type] = callback; },
    querySelector: selector => node(selector),
    querySelectorAll: () => [],
    focus() {}, click() { this.listeners.click?.call(this); }
  };
}
function node(id) { if (!nodes.has(id)) nodes.set(id, element()); return nodes.get(id); }
const timers = new Map();
let timerId = 0;
const window = {
  NexoTestSession: { create: () => metrics },
  NexoKeywords: { classify: require("./keyword-router.js") },
  NexoStatement: require("./statement-data.js"),
  NexoAssessment: require("./research-assessment.js"),
  requestAnimationFrame: callback => callback(),
  setTimeout(callback) { timers.set(++timerId, callback); return timerId; },
  clearTimeout: id => timers.delete(id),
  setInterval: () => 1, clearInterval() {}
};
const document = {
  getElementById: node, querySelector: node,
  body: node("body"), documentElement: { style: { setProperty() {} } },
  addEventListener: (type, callback) => documentListeners[type] = callback
};
vm.runInNewContext(fs.readFileSync("script.js", "utf8"), {
  window, document, localStorage: { getItem: () => null, setItem() {} }
});
function action(value) {
  documentListeners.click({ target: { closest: selector => selector === "[data-action]" ? { getAttribute: () => value } : null } });
}
function openHelp() {
  documentListeners.click({ target: { closest: selector => selector === "[data-open-assistant]" ? { getAttribute: () => null } : null } });
}
const content = () => node("conversation").innerHTML;
openHelp();
assert.doesNotMatch(content(), /Ver extrato de exemplo/);
assert.equal((content().match(/class="choice-button"/g) || []).length, 4);
action("statement");
assert.match(content(), /Veja o que entrou e o que saiu/);
assert.match(content(), /Saldo final fictício/);
assert.match(content(), /movement-3/);
action("movement-1");
assert.match(content(), /Compra no mercado/);
assert.match(content(), /cento e cinquenta reais/);
action("statement");
action("return-balance");
assert.match(content(), /Aqui está o seu saldo fictício/);
node("connection-test").click();
assert.match(content(), /conexão foi interrompida/);
action("retry");
assert.match(content(), /Aqui está o seu saldo fictício/);
action("explain");
action("alternative");
assert.match(content(), /carteira/);
assert.match(content(), /R\$ 130,00/);
action("feedback-no");
assert.match(content(), /continuar com dúvida/);
action("feedback-human");
assert.match(content(), /Com o que você precisa/);
assert.doesNotMatch(content(), /PROTOCOLO DEMO/);
action("reason-interface");
assert.match(content(), /Não consigo usar a tela/);
assert.match(content(), /PROTOCOLO DEMO 001/);
assert.equal(metrics.status().result, null, "fluxo normal não coleta");
node("research-consent").checked = true;
node("research-nature").value = "observed";
node("research-start").click();
action("balance");
action("show-balance");
now = 10000;
for (const [id, callback] of [...timers]) { timers.delete(id); callback(); }
assert.match(content(), /saldo fictício/);
action("feedback-yes");
assert.match(content(), /Que bom/);
now = 20000;
action("help");
action("reason-skip");
node("research-moderator").value = "no";
node("observation-concept").value = "yes";
node("observation-usefulness").value = "yes";
node("observation-conditions-keyboard").checked = true;
node("observation-difficulties-returnConfusion").checked = true;
node("research-finish").click();
assert.equal(metrics.status().result.meetsExperiment2Criterion, true);
assert.match(node("research-result").innerHTML, /Atingido nesta sessão/);
assert.match(node("research-result").innerHTML, /Critério individual observado/);
assert.match(node("research-result").innerHTML, /Confundiu Voltar/);
assert.match(node("research-result").innerHTML, /0 concluídos de 3; 0 avaliados/);
node("research-stop-inside").click();
assert.equal(metrics.status().result, null);
assert.equal(node("research-consent").checked, false);
action("help");
assert.match(content(), /Quero orientação passo a passo/);
action("walkthrough-menu");
assert.match(content(), /Nenhum atendente real/);
action("walkthrough-balance");
assert.match(content(), /passo 1 de 3/);
action("walkthrough-next");
assert.match(content(), /passo 2 de 3/);
action("walkthrough-previous");
assert.match(content(), /passo 1 de 3/);
action("walkthrough-next");
action("walkthrough-open");
assert.match(content(), /passo 3 de 3/);
assert.match(content(), /Aqui está o seu saldo fictício/);
action("home");
assert.doesNotMatch(content(), /passo 3 de 3/);
action("help");
action("walkthrough-menu");
action("walkthrough-statement");
action("walkthrough-next");
assert.match(content(), /Entrada.*aumenta o saldo/);
action("walkthrough-open");
assert.match(content(), /passo 3 de 3/);
assert.match(content(), /Veja o que entrou e o que saiu/);
action("movement-0");
assert.match(content(), /Recebimento de exemplo/);
console.log("Fluxos: explicação, resolução, motivo de apoio, consentimento, métricas e retirada verificados.");
