/* Conta de demonstração em memória. Nenhuma operação usa rede ou dinheiro real. */
(function (root) {
  "use strict";
  var recipients = [
    { id: "ana", name: "Ana Silva (fictícia)", pixKey: "ana@exemplo.test", bank: "Banco Exemplo", account: "Agência 0001 · Conta 12345-0" },
    { id: "lucas", name: "Lucas Costa (fictício)", pixKey: "lucas@exemplo.test", bank: "Banco Modelo", account: "Agência 0002 · Conta 54321-0" },
    { id: "mercado", name: "Mercado Modelo (fictício)", pixKey: "mercado@exemplo.test", bank: "Banco Exemplo", account: "Agência 0003 · Conta 11223-0" }
  ];
  var bills = [
    { id: "energy", name: "Energia • conta de exemplo", amountCents: 8000, code: "DEMO-ENERGIA-001" },
    { id: "internet", name: "Internet • conta de exemplo", amountCents: 12000, code: "DEMO-INTERNET-002" },
    { id: "water", name: "Água • conta de exemplo", amountCents: 6500, code: "DEMO-AGUA-003" }
  ];
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function parseAmount(value) {
    var text = String(value || "").trim().replace(/^R\$\s*/, "");
    if (/^(?:\d+|\d{1,3}(?:\.\d{3})+),\d{1,2}$/.test(text)) text = text.replace(/\./g, "").replace(",", ".");
    else if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return null;
    var parts = text.split(".");
    var cents = Number(parts[0]) * 100 + Number(((parts[1] || "") + "00").slice(0, 2));
    return Number.isSafeInteger(cents) ? cents : null;
  }
  function createAccount(initial, clock) {
    var now = clock || function () { return new Date(); };
    var entries, balance, paid, drafts = new Map(), committed = new Map(), sequence = 0;
    function reset() {
      entries = copy(initial.entries);
      balance = initial.closingCents;
      paid = new Set();
      drafts.clear();
      committed.clear();
    }
    reset();
    function fail(message) { return { ok: false, error: message }; }
    return {
      snapshot: function () { return { openingCents: initial.openingCents, closingCents: balance, entries: copy(entries), paidBillIds: Array.from(paid) }; },
      prepare: function (type, input) {
        input = input || {};
        if (["pix", "payment", "transfer"].indexOf(type) === -1) return fail("Escolha uma operação de demonstração válida.");
        var recipient, bill, cents;
        if (type === "payment") {
          bill = bills.find(function (item) { return item.id === input.billId; });
          if (!bill) return fail("Escolha uma conta de exemplo.");
          if (paid.has(bill.id)) return fail("Esta conta de exemplo já foi paga nesta sessão.");
          cents = bill.amountCents;
        } else {
          recipient = recipients.find(function (item) { return item.id === input.recipientId; });
          if (!recipient) return fail("Escolha um destinatário fictício da lista.");
          cents = parseAmount(input.amount);
        }
        if (cents === null || cents <= 0) return fail("Informe um valor maior que zero, como 25,50, com no máximo duas casas decimais.");
        if (cents > balance) return fail("Saldo fictício insuficiente. Diminua o valor ou reinicie a simulação.");
        var id = "REV-" + (++sequence);
        var draft = { id: id, type: type, amountCents: cents, recipient: recipient ? copy(recipient) : null, bill: bill ? copy(bill) : null };
        drafts.set(id, draft);
        return { ok: true, draft: copy(draft) };
      },
      cancel: function (id) { drafts.delete(id); },
      confirm: function (id) {
        if (committed.has(id)) return { ok: true, receipt: copy(committed.get(id)) };
        var draft = drafts.get(id);
        if (!draft) return fail("Esta revisão expirou ou foi cancelada. Comece uma nova simulação.");
        if (draft.amountCents > balance) return fail("O saldo fictício mudou e não é suficiente. Revise o valor antes de confirmar.");
        if (draft.bill && paid.has(draft.bill.id)) return fail("Esta conta de exemplo já foi paga nesta sessão.");
        var date = now();
        var destination = draft.bill ? draft.bill.name : draft.recipient.name;
        var labels = { pix: "Pix para ", payment: "Pagamento: ", transfer: "Transferência para " };
        balance -= draft.amountCents;
        if (draft.bill) paid.add(draft.bill.id);
        var receipt = {
          id: "NEXO-SIM-" + id.slice(4).padStart(4, "0"), type: draft.type,
          amountCents: draft.amountCents, recipient: destination, balanceAfterCents: balance,
          date: new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }).format(date)
        };
        // O identificador da revisão torna a confirmação idempotente.
        entries.push({
          date: new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(date),
          label: labels[draft.type] + destination, amountCents: -draft.amountCents,
          explanation: "Operação simulada nesta sessão.", receiptId: receipt.id
        });
        drafts.delete(id);
        committed.set(id, receipt);
        return { ok: true, receipt: copy(receipt) };
      },
      reset: reset
    };
  }
  var api = { createAccount: createAccount, parseAmount: parseAmount, recipients: copy(recipients), bills: copy(bills) };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.NexoTransactions = api;
}(typeof window !== "undefined" ? window : this));
