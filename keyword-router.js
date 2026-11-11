/* Fluxos locais e predefinidos. Nenhuma mensagem é enviada ou armazenada. */
(function (root) {
  "use strict";
  function classify(message) {
    var text = String(message || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    if (!text) return "empty";
    // Evita interpretar números ou credenciais como comandos e não os reproduz.
    if (/\d{3,}|@/.test(text)) return "private";
    if (/\b(pix|pagar|pagamento|transferir|transferencia|emprestimo)\b/.test(text)) return "unsupported";
    var support = /\b(ajuda|atendente|humano|pessoa|suporte|atendimento)\b/.test(text);
    var safety = /\b(seguranca|golpe|fraude|senha|protecao)\b/.test(text);
    var explain = /\b(entender|explicar|explica|significa|diferenca)\b/.test(text);
    var statement = /\b(extrato|estrato|movimentacoes|entradas|saidas)\b/.test(text);
    var balance = /\b(saldo|dinheiro|disponivel)\b/.test(text);
    if ((support && (safety || explain || balance || statement)) || (safety && (explain || balance || statement))) return "ambiguous";
    if (support) return "help";
    if (safety) return "safety";
    if (explain) return "explain";
    if (statement) return "statement";
    if (balance) return "balance";
    if (/\b(inicio|voltar|menu|ola|oi)\b/.test(text)) return "home";
    return "unknown";
  }
  if (typeof module !== "undefined" && module.exports) module.exports = classify;
  else root.NexoKeywords = { classify: classify };
}(typeof window !== "undefined" ? window : this));
