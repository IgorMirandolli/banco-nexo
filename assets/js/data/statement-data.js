/* Dados do extrato: valores fictícios, em centavos para preservar a soma exata. */
(function (root) {
  "use strict";
  var openingCents = 50000;
  var entries = [
    { date: "01/11/2026", label: "Recebimento de exemplo", amountCents: 100000, explanation: "Entraram mil reais no exemplo. Uma entrada aumenta o saldo." },
    { date: "02/11/2026", label: "Compra no mercado", amountCents: -15000, explanation: "Saíram cento e cinquenta reais para uma compra fictícia. Uma saída diminui o saldo." },
    { date: "03/11/2026", label: "Conta de energia", amountCents: -8000, explanation: "Saíram oitenta reais para uma conta de energia fictícia." },
    { date: "04/11/2026", label: "Pagamento de transporte", amountCents: -2000, explanation: "Saíram vinte reais para transporte no exemplo." }
  ];
  var data = {
    openingCents: openingCents,
    entries: entries,
    incomingCents: entries.reduce(function (sum, entry) { return sum + Math.max(0, entry.amountCents); }, 0),
    outgoingCents: entries.reduce(function (sum, entry) { return sum + Math.max(0, -entry.amountCents); }, 0),
    closingCents: entries.reduce(function (sum, entry) { return sum + entry.amountCents; }, openingCents)
  };
  if (typeof module !== "undefined" && module.exports) module.exports = data;
  else root.NexoStatement = data;
}(typeof window !== "undefined" ? window : this));
