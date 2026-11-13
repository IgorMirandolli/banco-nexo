// DOM mínimo: verifica os fluxos; não substitui a inspeção visual.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function setup(extras = {}) {
  const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
  const nodes = new Map();
  let doc;
  class Element {
    constructor(tag = "div") { this.tag = tag; this.children = []; this.dataset = {}; this.attributes = {}; this.listeners = {}; this._text = ""; this.hidden = false; this.disabled = false; this.value = ""; this.isConnected = true; this.style = {}; const classes = new Set(); this.classList = { add: key => classes.add(key), remove: key => classes.delete(key), contains: key => classes.has(key), toggle(key, on) { if (on === undefined) on = !classes.has(key); on ? classes.add(key) : classes.delete(key); return on; } }; }
    set textContent(value) { this._text = value; this.children = []; }
    get textContent() { return this._text + this.children.map(node => node.textContent).join(" "); }
    append(...children) { children.forEach(child => { child.parent = this; this.children.push(child); }); }
    replaceChildren(...children) { this.children = []; this._text = ""; this.append(...children); }
    get childElementCount() { return this.children.length; }
    get firstElementChild() { return this.children[0]; }
    get scrollHeight() { return this.children.length * 100; }
    remove() { this.parent.children = this.parent.children.filter(child => child !== this); }
    setAttribute(key, value) { this.attributes[key] = value; }
    getAttribute(key) { return this.attributes[key] || null; }
    hasAttribute(key) { return key.startsWith("data-") ? Object.hasOwn(this.dataset, key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())) : Object.hasOwn(this.attributes, key); }
    addEventListener(type, callback) { this.listeners[type] = callback; }
    querySelector(selector) { if (selector === ".chat-sheet") return node("sheet"); if (selector === "summary") return node("settings-summary"); throw new Error("Selector não modelado: " + selector); }
    querySelectorAll() { return []; }
    focus() { doc.activeElement = this; }
    scrollIntoView() {}
    getClientRects() { return [1]; }
  }
  function node(id) { if (!nodes.has(id)) nodes.set(id, new Element()); return nodes.get(id); }
  for (const match of html.matchAll(/\bid="([^"]+)"/g)) node(match[1]);
  doc = {
    listeners: {}, activeElement: null, body: new Element("body"), documentElement: new Element("html"),
    getElementById(id) { assert.ok(nodes.has(id), "ID ausente: " + id); return node(id); },
    createElement: tag => new Element(tag), querySelector: () => node("chat-font"),
    querySelectorAll(selector) {
      if (selector === "[data-contrast]") return [node("contrast-main"), node("contrast-chat")];
      if (selector === "[data-contrast-status]") return [node("status-main"), node("status-chat")];
      if (selector === "[data-font]") return [node("font-minus"), node("font-plus")];
      if (selector === ".service-grid [data-view]") return [];
      throw new Error("Selector não modelado: " + selector);
    },
    addEventListener(type, callback) { this.listeners[type] = callback; }
  };
  node("font-minus").dataset.font = "-10";
  node("font-plus").dataset.font = "10";
  node("chat-overlay").hidden = true;
  const writes = [];
  const context = { window: { NexoChat: require("../assets/js/chat-engine.js"), NexoStatement: require("../assets/js/data/statement-data.js"), NexoTransactions: require("../assets/js/transactions.js"), NexoVoice: require("../assets/js/voice.js"), addEventListener() {}, ...extras }, document: doc, localStorage: { getItem: () => null, setItem: (...args) => writes.push(args) } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../assets/js/app.js"), "utf8"), context);
  function click(data) {
    const button = new Element("button");
    button.dataset = data;
    doc.listeners.click({ target: { closest: () => button } });
    return button;
  }
  function submit(value) { node("chat-input").value = value; node("chat-form").listeners.submit({ preventDefault() {} }); }
  return { node, doc, click, submit, writes, html };
}
test("abertura, conversa, serviço no banco, retorno de foco e nova conversa", () => {
  const { node, doc, click, submit } = setup();
  const opener = click({ openChat: "" });
  assert.equal(node("chat-overlay").hidden, false);
  assert.equal(node("bank-app").inert, true);
  assert.equal(doc.activeElement, node("chat-title"));
  submit("quero ver extrato");
  assert.equal(node("chat-log").childElementCount, 2);
  assert.match(node("chat-log").textContent, /Saldo final fictício/);
  submit("<img src=x onerror=alert(1)>");
  assert.match(node("chat-log").textContent, /<img/);
  const count = node("chat-log").childElementCount;
  submit("CPF 123.456.789-00");
  assert.equal(node("chat-log").childElementCount, count + 1);
  assert.doesNotMatch(node("chat-log").textContent, /123.456/);
  node("chat-close").listeners.click();
  assert.equal(node("bank-app").inert, false);
  assert.equal(doc.activeElement, opener);
  click({ openChat: "" });
  assert.ok(node("chat-log").childElementCount > 0);
  click({ view: "pix" });
  assert.equal(node("chat-overlay").hidden, true);
  assert.match(node("service-title").textContent, /^Pix/);
  click({ openChat: "" });
  node("chat-reset").listeners.click();
  assert.equal(node("chat-log").childElementCount, 0);
  assert.equal(node("chat-welcome").hidden, false);
});
test("preferências, saldo oculto, Escape e retirada dos fluxos antigos", () => {
  const { node, doc, click, writes, html } = setup();
  click({ contrast: "" });
  assert.equal(doc.body.classList.contains("high-contrast"), true);
  assert.equal(node("status-chat").textContent, "Ativado");
  assert.deepEqual(writes, [["nexo-contrast", "on"]]);
  for (let i = 0; i < 12; i++) click({ font: "10" });
  assert.equal(doc.documentElement.style.fontSize, "225%");
  assert.equal(node("font-plus").disabled, true);
  const eye = node("balance-visibility");
  eye.listeners.click.call(eye);
  assert.equal(node("dashboard-balance").textContent, "R$ ••••••");
  click({ openChat: "" });
  doc.listeners.keydown({ key: "Escape", preventDefault() {} });
  assert.equal(node("chat-overlay").hidden, true);
  assert.doesNotMatch(html, /research-panel|data-action=|assistant-drawer|keyword-form/);
});
test("todos os arquivos locais carregados pelo HTML existem", () => {
  const { html } = setup();
  for (const match of html.matchAll(/(?:src|href)="(assets\/[^"#]+)"/g)) {
    assert.ok(fs.existsSync(path.join(__dirname, "..", match[1])), match[1]);
  }
});

function find(root, predicate) {
  if (predicate(root)) return root;
  for (const child of root.children) { const match = find(child, predicate); if (match) return match; }
}
test("Pix, pagamento e transferência atualizam a sessão e o chat; reinício restaura o extrato", () => {
  const { node, click, submit } = setup();
  const content = node("service-content");
  for (const [view, amount, expected] of [["pix", "25,50", "1.224,50"], ["payment", "", "1.144,50"], ["transfer", "100,00", "1.044,50"]]) {
    click({ view });
    const form = find(content, item => item.tag === "form");
    if (amount) find(form, item => item.tag === "input").value = amount;
    form.listeners.submit({ preventDefault() {} });
    assert.match(content.textContent, /Confira antes de confirmar/);
    const confirm = find(content, item => item.tag === "button" && item.textContent.startsWith("Confirmar "));
    confirm.listeners.click();
    assert.match(content.textContent, /Comprovante de demonstração/);
    assert.ok(node("dashboard-balance").textContent.includes(expected));
    confirm.listeners.click();
    assert.ok(node("dashboard-balance").textContent.includes(expected), "confirmar duas vezes não debita duas vezes");
  }
  click({ view: "statement" });
  assert.match(content.textContent, /Pix para Ana/);
  assert.match(content.textContent, /Pagamento: Energia/);
  assert.match(content.textContent, /Transferência para Ana/);
  click({ openChat: "" });
  submit("saldo");
  assert.match(node("chat-log").textContent, /1\.044,50/);
  node("chat-close").listeners.click();
  click({ resetSimulation: "" });
  find(content, item => item.tag === "button" && item.textContent === "Confirmar reinício").listeners.click();
  assert.match(node("dashboard-balance").textContent, /1\.250,00/);
  assert.doesNotMatch(content.textContent, /Pix para Ana/);
  assert.equal(node("chat-log").childElementCount, 0);
});
test("cancelar e corrigir valores não descontam do saldo", () => {
  const { node, click } = setup();
  const content = node("service-content");
  click({ view: "pix" });
  let form = find(content, item => item.tag === "form");
  const input = find(form, item => item.tag === "input");
  input.value = "9999,00";
  form.listeners.submit({ preventDefault() {} });
  assert.match(content.textContent, /Saldo fictício insuficiente/);
  input.value = "50,00";
  form.listeners.submit({ preventDefault() {} });
  find(content, item => item.tag === "button" && item.textContent === "Editar dados").listeners.click();
  form = find(content, item => item.tag === "form");
  assert.equal(find(form, item => item.tag === "input").value, "50,00");
  form.listeners.submit({ preventDefault() {} });
  find(content, item => item.tag === "button" && item.textContent === "Cancelar").listeners.click();
  assert.match(node("dashboard-balance").textContent, /1\.250,00/);
});
test("voz requer escolha explícita, permanece no chatbot e não altera operações", () => {
  const instances = [];
  class Recognition {
    constructor() { instances.push(this); }
    start() { this.onstart(); }
    abort() {}
  }
  const { node, click } = setup({
    SpeechRecognition: Recognition, location: { protocol: "http:" }, isSecureContext: true,
    setTimeout: () => 1, clearTimeout() {}
  });
  click({ openChat: "" });
  node("voice-mic").listeners.click();
  assert.equal(instances.length, 0, "a explicação não ativa o microfone");
  node("voice-cancel").listeners.click();
  assert.equal(instances.length, 0);
  node("voice-mic").listeners.click();
  node("voice-allow").listeners.click();
  instances[0].onresult({ results: [[{ transcript: "onde fica o pix" }]] });
  assert.match(node("chat-log").textContent, /Onde encontrar Pix/);
  assert.equal(node("service-title").textContent, "Extrato");
  assert.equal(node("chat-overlay").hidden, false);
  node("voice-mic").listeners.click();
  instances[1].onresult({ results: [[{ transcript: "confirme transferência" }]] });
  assert.match(node("chat-log").textContent, /apenas consultas/);
  assert.match(node("dashboard-balance").textContent, /1\.250,00/);
  node("voice-mic").listeners.click();
  node("chat-close").listeners.click();
  const count = node("chat-log").childElementCount;
  instances[2].onresult({ results: [[{ transcript: "saldo" }]] });
  assert.equal(node("chat-log").childElementCount, count, "fechar descarta respostas atrasadas");
});
