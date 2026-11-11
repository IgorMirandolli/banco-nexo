/* Somente opções estruturadas do moderador. Nenhum texto livre é exportado. */
(function (root) {
  "use strict";
  var fields = [
    { id: "concept", group: 1, label: "A pessoa explicou corretamente a finalidade do assistente, com as próprias palavras?", options: ["yes", "no"] },
    { id: "usefulness", group: 1, label: "Identificou uma utilidade em uma situação própria, sem indução?", options: ["yes", "no"] },
    { id: "balance", group: 3, label: "Percurso: consultar o saldo", options: ["completed", "blocked"] },
    { id: "explanation", group: 3, label: "Percurso: compreender a explicação de saldo e extrato", options: ["completed", "blocked"] },
    { id: "human", group: 3, label: "Percurso: solicitar ajuda humana simulada", options: ["completed", "blocked"] },
    { id: "criticalBlock", group: 3, label: "Houve algum bloqueio crítico?", options: ["yes", "no"] }
  ];
  var conditions = {
    keyboard: "Teclado", screenreader: "Leitor de tela", zoom200: "Ampliação de 200%",
    simulatedNetwork: "Interrupção simulada pelo botão", actualNetwork: "Interrupção real da conexão"
  };
  var difficulties = {
    helpNotFound: "Não encontrou ajuda", returnConfusion: "Confundiu Voltar e Início",
    messageSilent: "Mensagem não anunciada pelo leitor de tela",
    controlsUnreachable: "Não alcançou um controle por teclado",
    clippedContent: "Conteúdo ou botões cortados na ampliação",
    networkRecovery: "Não conseguiu retomar após interrupção", meaningConfusion: "Confundiu saldo e extrato"
  };
  var labels = { pending: "Não avaliado", yes: "Sim", no: "Não", completed: "Concluído nas condições indicadas", blocked: "Não concluído / bloqueado" };
  function assess(raw) {
    raw = raw || {};
    var answers = {};
    fields.forEach(function (field) {
      answers[field.id] = field.options.indexOf(raw[field.id]) !== -1 ? raw[field.id] : "pending";
    });
    var used = Object.keys(conditions).filter(function (key) { return Array.isArray(raw.conditions) && raw.conditions.indexOf(key) !== -1; });
    var observed = Object.keys(difficulties).filter(function (key) { return Array.isArray(raw.difficulties) && raw.difficulties.indexOf(key) !== -1; });
    var conceptComplete = answers.concept !== "pending" && answers.usefulness !== "pending";
    var tasks = ["balance", "explanation", "human"];
    return {
      answers: answers, conditions: used, difficulties: observed,
      experiment1IndividualCriterion: conceptComplete ? answers.concept === "yes" && answers.usefulness === "yes" : null,
      experiment3: {
        evaluatedPaths: tasks.filter(function (key) { return answers[key] !== "pending"; }).length,
        completedPaths: tasks.filter(function (key) { return answers[key] === "completed"; }).length,
        individualObservationComplete: tasks.every(function (key) { return answers[key] !== "pending"; }) && answers.criticalBlock !== "pending" && used.length > 0,
        groupCriterionEvaluated: false
      }
    };
  }
  var api = { fields: fields, conditions: conditions, difficulties: difficulties, labels: labels, assess: assess };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.NexoAssessment = api;
}(typeof window !== "undefined" ? window : this));
