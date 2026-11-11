/* Métricas locais, somente após consentimento. Sem nomes, mensagens ou credenciais. */
(function (root) {
  "use strict";
  function createSession(clock) {
    var now = clock || function () { return performance.now(); };
    var active = null;
    var result = null;
    var allowed = ["balance-viewed", "statement-viewed", "movement-explained", "human-forwarded", "help-requested", "alternative", "feedback-yes", "feedback-no", "feedback-human", "back", "connection-interruption", "keyword-fallback"];
    function elapsed() { return Math.max(0, (now() - active.started) / 1000); }
    return {
      start: function (consent) {
        if (consent !== true) throw new Error("É necessário consentimento.");
        if (active) throw new Error("Encerre a sessão atual primeiro.");
        result = null;
        active = { started: now(), events: [] };
      },
      record: function (type) {
        if (active && allowed.indexOf(type) !== -1) active.events.push({ type: type, seconds: elapsed() });
      },
      status: function () {
        return active ? { active: true, seconds: elapsed(), eventCount: active.events.length } : { active: false, result: result };
      },
      finish: function (moderatorHelp) {
        if (!active) return null;
        var first = function (type) { return active.events.find(function (event) { return event.type === type; }); };
        var balance = first("balance-viewed");
        var human = first("human-forwarded");
        var completedAt = balance && human ? Math.max(balance.seconds, human.seconds) : null;
        var feedback = active.events.filter(function (event) { return event.type.indexOf("feedback-") === 0; });
        result = {
          nature: "Registro de uma sessão local de teste; não comprova eficácia nem representa validação concluída.",
          consentGiven: true,
          durationSeconds: elapsed(),
          balanceSeen: Boolean(balance),
          humanForwardedSimulated: Boolean(human),
          bothTasksCompleted: completedAt !== null,
          bothTasksSeconds: completedAt,
          moderatorHelp: typeof moderatorHelp === "boolean" ? moderatorHelp : null,
          meetsExperiment2Criterion: typeof moderatorHelp !== "boolean" ? null : completedAt !== null && completedAt <= 120 && !moderatorHelp,
          lastSelfReportedFeedback: feedback.length ? feedback[feedback.length - 1].type : null,
          events: active.events.slice()
        };
        active = null;
        return result;
      },
      discard: function () { active = null; result = null; }
    };
  }
  if (typeof module !== "undefined" && module.exports) module.exports = createSession;
  else root.NexoTestSession = { create: createSession };
}(typeof window !== "undefined" ? window : this));
