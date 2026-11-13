/* Voz opcional: captura curta mediante consentimento e leitura controlada. */
(function (root) {
  "use strict";
  function create(env, callbacks) {
    callbacks = callbacks || {};
    var Recognition = env.SpeechRecognition || env.webkitSpeechRecognition;
    var synth = env.speechSynthesis;
    var canRead = Boolean(synth && env.SpeechSynthesisUtterance);
    var file = env.location && env.location.protocol === "file:";
    var canListen = Boolean(Recognition && !file && env.isSecureContext !== false);
    var recognition = null, timer = null, generation = 0;
    function state(value) { if (callbacks.onState) callbacks.onState(value); }
    function status(message) { if (callbacks.onStatus) callbacks.onStatus(message); }
    function stop(message) {
      generation++;
      if (timer !== null) env.clearTimeout(timer);
      timer = null;
      var old = recognition;
      recognition = null;
      if (old) { try { old.abort(); } catch (error) { /* Já encerrado. */ } }
      if (canRead) { try { synth.cancel(); } catch (error) { /* Leitura indisponível. */ } }
      state("idle");
      if (message) status(message);
    }
    function speak(text) {
      stop();
      if (!canRead) { status("A leitura em voz alta não está disponível neste navegador."); return false; }
      var words = String(text || "").trim().split(/\s+/);
      var chunks = [], chunk = "";
      words.forEach(function (word) {
        if (chunk.length + word.length > 200) { chunks.push(chunk); chunk = ""; }
        chunk += (chunk ? " " : "") + word;
      });
      if (chunk) chunks.push(chunk);
      if (!chunks.length) return false;
      var token = generation;
      function next() {
        if (token !== generation) return;
        if (!chunks.length) { state("idle"); status("Leitura concluída."); return; }
        var utterance = new env.SpeechSynthesisUtterance(chunks.shift());
        utterance.lang = "pt-BR";
        utterance.rate = 0.95;
        var voices = typeof synth.getVoices === "function" ? synth.getVoices() : [];
        var voice = voices.find(function (item) { return /^pt[-_]BR$/i.test(item.lang); }) || voices.find(function (item) { return /^pt/i.test(item.lang); });
        if (voice) utterance.voice = voice;
        utterance.onend = next;
        utterance.onerror = function () {
          if (token !== generation) return;
          stop("Não foi possível concluir a leitura. Você pode tentar ouvir novamente.");
        };
        try { synth.speak(utterance); }
        catch (error) { stop("A leitura não pôde ser iniciada. Tente novamente."); }
      }
      state("speaking");
      status("Lendo em voz alta. Use Parar áudio para interromper.");
      next();
      return true;
    }
    function start(consent) {
      if (consent !== true) { status("Autorize o uso da voz antes de ativar o microfone."); return false; }
      if (!canListen) {
        status(file ? "Para usar o microfone, abra o projeto com npm start ou Live Server, em vez de abrir o arquivo diretamente." : "Reconhecimento de fala indisponível. Use as sugestões ou digite sua consulta.");
        return false;
      }
      stop();
      var token = generation;
      try { recognition = new Recognition(); }
      catch (error) { status("O reconhecimento de fala não pôde ser iniciado."); return false; }
      recognition.lang = "pt-BR";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onstart = function () {
        if (token !== generation) {
          try { this.abort(); } catch (error) { /* Permissão concedida após o cancelamento. */ }
          return;
        }
        state("listening");
        status("Ouvindo. Diga sua consulta. A captura para em até 15 segundos.");
      };
      recognition.onresult = function (event) {
        if (token !== generation) return;
        var result = event.results[event.resultIndex || 0];
        if (!result || result.isFinal === false || !result[0]) return;
        var transcript = String(result[0].transcript || "").trim().slice(0, 180);
        stop();
        if (transcript && callbacks.onTranscript) callbacks.onTranscript(transcript);
        else status("Não entendi a fala. Tente novamente ou use uma sugestão.");
      };
      recognition.onerror = function (event) {
        if (token !== generation) return;
        var messages = {
          "not-allowed": "O acesso ao microfone não foi autorizado. Você pode continuar com os botões ou texto.",
          "service-not-allowed": "O navegador não permitiu o serviço de voz. Use os botões ou o texto.",
          "audio-capture": "Nenhum microfone disponível. Confira o dispositivo ou use os botões.",
          "no-speech": "Não ouvi uma fala. Toque no microfone para tentar outra vez.",
          network: "O serviço de voz está sem conexão. Tente depois; os botões e o texto continuam disponíveis.",
          "language-not-supported": "O serviço de voz não oferece português neste dispositivo."
        };
        stop(messages[event.error] || "A captura foi interrompida. Você pode tentar novamente.");
      };
      recognition.onend = function () {
        if (token !== generation) return;
        stop("Captura encerrada. Toque no microfone para fazer outra consulta.");
      };
      state("starting");
      status("Aguardando o microfone. O navegador pode pedir sua autorização.");
      timer = env.setTimeout(function () {
        if (token === generation) stop("Captura encerrada após 15 segundos. Toque no microfone para tentar novamente.");
      }, 15000);
      try { recognition.start(); return true; }
      catch (error) { stop("Não foi possível acessar o microfone. Confira a permissão do navegador."); return false; }
    }
    return { canListen: canListen, canRead: canRead, file: Boolean(file), start: start, speak: speak, stop: stop };
  }
  if (typeof module !== "undefined" && module.exports) module.exports = { create: create };
  else root.NexoVoice = { create: create };
}(typeof window !== "undefined" ? window : this));
