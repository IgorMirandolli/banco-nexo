const test = require("node:test");
const assert = require("node:assert/strict");
const { create } = require("../assets/js/voice.js");
function fake() {
  const instances = [], messages = [], states = [], transcripts = [], spoken = [], timers = new Map();
  class Recognition {
    constructor() { instances.push(this); }
    start() { this.started = true; this.onstart(); }
    abort() { this.aborted = true; this.abortCount = (this.abortCount || 0) + 1; this.onend?.(); }
  }
  class Utterance { constructor(text) { this.text = text; } }
  const env = {
    SpeechRecognition: Recognition, SpeechSynthesisUtterance: Utterance,
    speechSynthesis: { cancel() {}, getVoices: () => [{ lang: "pt-BR" }], speak: value => spoken.push(value) },
    location: { protocol: "http:" }, isSecureContext: true,
    setTimeout(callback) { timers.set(1, callback); return 1; }, clearTimeout: id => timers.delete(id)
  };
  const voice = create(env, { onState: state => states.push(state), onStatus: message => messages.push(message), onTranscript: text => transcripts.push(text) });
  return { voice, env, instances, messages, states, transcripts, spoken, timers };
}
test("microfone depende de consentimento e captura final só uma vez", () => {
  const { voice, instances, transcripts } = fake();
  assert.equal(voice.start(false), false);
  assert.equal(instances.length, 0);
  voice.start(true);
  const mic = instances[0];
  assert.equal(mic.lang, "pt-BR");
  assert.equal(mic.continuous, false);
  const event = { resultIndex: 0, results: [Object.assign([{ transcript: "quero ver meu extrato" }], { isFinal: true })] };
  mic.onresult(event);
  mic.onresult(event);
  assert.deepEqual(transcripts, ["quero ver meu extrato"]);
  assert.equal(mic.aborted, true);
});
test("parar, limite de tempo e respostas atrasadas encerram captura", () => {
  const { voice, instances, transcripts, timers, messages } = fake();
  voice.start(true);
  const old = instances[0];
  voice.stop();
  old.onstart();
  assert.equal(old.abortCount, 2, "uma captura iniciada com atraso também deve ser abortada");
  old.onresult({ results: [[{ transcript: "saldo" }]] });
  assert.equal(transcripts.length, 0);
  voice.start(true);
  timers.get(1)();
  assert.equal(instances[1].aborted, true);
  assert.match(messages.at(-1), /15 segundos/);
});
test("negação de permissão e falha de rede têm recuperação sem repetição automática", () => {
  const { voice, instances, messages } = fake();
  voice.start(true);
  instances[0].onerror({ error: "not-allowed" });
  assert.match(messages.at(-1), /não foi autorizado/);
  voice.start(true);
  instances[1].onerror({ error: "network" });
  assert.match(messages.at(-1), /sem conexão/);
  assert.equal(instances.length, 2);
});
test("leitura interrompe microfone, oferece português e pode ser cancelada", () => {
  const { voice, instances, spoken, states } = fake();
  voice.start(true);
  voice.speak("Seu saldo fictício é de mil reais.");
  assert.equal(instances[0].aborted, true);
  assert.equal(spoken[0].lang, "pt-BR");
  assert.equal(states.at(-1), "speaking");
  voice.stop();
  spoken[0].onend();
  assert.equal(states.at(-1), "idle");
});
test("arquivo direto e navegador sem suporte não acionam microfone", () => {
  const { env } = fake();
  env.location.protocol = "file:";
  const fileVoice = create(env);
  assert.equal(fileVoice.canListen, false);
  assert.equal(fileVoice.start(true), false);
  assert.equal(create({}).canListen, false);
  assert.equal(create({}).canRead, false);
});
