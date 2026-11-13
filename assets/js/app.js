/* Painel bancário, acessibilidade e conversa local do Assistente Nexo. */
(function () {
  "use strict";
  var engine = window.NexoChat;
  var statement = window.NexoStatement;
  var transactions = window.NexoTransactions;
  var account = transactions.createAccount(statement);
  var bank = document.getElementById("bank-app");
  var overlay = document.getElementById("chat-overlay");
  var sheet = overlay.querySelector(".chat-sheet");
  var log = document.getElementById("chat-log");
  var welcome = document.getElementById("chat-welcome");
  var input = document.getElementById("chat-input");
  var send = document.getElementById("chat-send");
  var settings = document.getElementById("chat-settings");
  var opener = null;
  var lastTopic = "";
  var scale = 100;
  var highContrast = false;

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function money(cents) {
    return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  function announce(message) {
    document.getElementById(overlay.hidden ? "page-status" : "chat-status").textContent = message;
  }
  function preference(key, value) {
    try { localStorage.setItem(key, value); } catch (error) { /* Preferência apenas nesta aba. */ }
  }
  function applyContrast(enabled, speak) {
    highContrast = enabled;
    document.body.classList.toggle("high-contrast", enabled);
    document.querySelectorAll("[data-contrast]").forEach(function (button) {
      button.setAttribute("aria-pressed", String(enabled));
      button.setAttribute("aria-label", enabled ? "Desativar alto contraste" : "Ativar alto contraste");
    });
    document.querySelectorAll("[data-contrast-status]").forEach(function (label) { label.textContent = enabled ? "Ativado" : "Desativado"; });
    if (speak) announce(enabled ? "Alto contraste ativado." : "Alto contraste desativado.");
  }
  function changeScale(amount) {
    scale = Math.max(90, Math.min(200, scale + amount));
    document.documentElement.style.fontSize = (scale * 1.125) + "%";
    document.body.classList.toggle("large-text", scale >= 150);
    document.getElementById("font-label").textContent = scale + "%";
    document.querySelector("[data-chat-font]").textContent = scale + "%";
    document.querySelectorAll("[data-font]").forEach(function (button) {
      button.disabled = (Number(button.dataset.font) < 0 && scale === 90) || (Number(button.dataset.font) > 0 && scale === 200);
    });
    announce("Texto em " + scale + " por cento.");
  }

  function statementList(className) {
    var list = element("ul", className || "statement-entries");
    list.setAttribute("aria-label", "Movimentações fictícias");
    account.snapshot().entries.forEach(function (entry) {
      var row = element("li", "statement-entry");
      var detail = element("div");
      detail.append(element("time", "", entry.date), element("span", "entry-name", entry.label));
      row.append(detail, element("strong", entry.amountCents > 0 ? "entry-in" : "entry-out",
        (entry.amountCents > 0 ? "Entrada: + " : "Saída: − ") + money(Math.abs(entry.amountCents))));
      list.append(row);
    });
    return list;
  }

  var operationLabels = { pix: "Pix", payment: "Pagamento", transfer: "Transferência" };
  function actionButton(label, callback, secondary) {
    var button = element("button", secondary ? "tx-secondary" : "tx-primary", label);
    button.type = "button";
    button.addEventListener("click", callback);
    return button;
  }
  function viewButton(label, view) {
    var button = element("button", "tx-secondary", label);
    button.type = "button";
    button.dataset.view = view;
    return button;
  }
  function detailRows(pairs) {
    var list = element("dl", "tx-details");
    pairs.forEach(function (pair) {
      var row = element("div");
      row.append(element("dt", "", pair[0]), element("dd", "", pair[1]));
      list.append(row);
    });
    return list;
  }
  function updateBalance() {
    var hidden = document.getElementById("balance-visibility").getAttribute("aria-pressed") === "true";
    document.getElementById("dashboard-balance").textContent = hidden ? "R$ ••••••" : money(account.snapshot().closingCents);
  }
  function focusPanel() {
    document.getElementById("service-title").focus({ preventScroll: true });
    document.getElementById("service-panel").scrollIntoView({ behavior: "instant", block: "nearest" });
  }
  function operationForm(type, initial) {
    initial = initial || {};
    var content = document.getElementById("service-content");
    content.replaceChildren();
    document.getElementById("service-title").textContent = operationLabels[type] + " • simulação";
    content.append(element("p", "tx-stage", "ETAPA 1 DE 3 · PREENCHER"));
    content.append(element("p", "panel-demo", "Use somente os destinatários e contas fictícios da lista. Nenhum valor real será enviado."));
    content.append(element("p", "tx-available", "Saldo fictício disponível: " + money(account.snapshot().closingCents)));
    var form = element("form", "tx-form");
    form.noValidate = true;
    var select = element("select");
    select.id = "tx-destination";
    var items = type === "payment" ? transactions.bills : transactions.recipients;
    items.forEach(function (item) {
      var option = element("option", "", type === "payment" ? item.name + " — " + money(item.amountCents) : item.name);
      option.value = item.id;
      select.append(option);
    });
    select.value = (type === "payment" ? initial.billId : initial.recipientId) || items[0].id;
    var destination = element("label", "tx-field", type === "payment" ? "Conta de exemplo" : "Destinatário fictício");
    destination.htmlFor = select.id;
    destination.append(select);
    var info = element("p", "tx-destination-info");
    var amount = element("input");
    amount.id = "tx-amount";
    amount.type = "text";
    amount.inputMode = "decimal";
    amount.maxLength = 18;
    amount.autocomplete = "off";
    amount.value = initial.amount || "50,00";
    amount.required = true;
    var amountLabel = element("label", "tx-field", "Valor (R$)");
    amountLabel.htmlFor = amount.id;
    amountLabel.append(amount);
    var formatHint = element("span", "tx-hint", type === "payment" ? "Valor fixo da conta escolhida." : "Exemplo: 25,50. Você revisará antes de confirmar.");
    amountLabel.append(formatHint);
    function updateDestination() {
      var item = items.find(function (entry) { return entry.id === select.value; });
      if (!item) return;
      if (type === "payment") {
        amount.value = (item.amountCents / 100).toFixed(2).replace(".", ",");
        amount.readOnly = true;
        info.textContent = "Código fictício: " + item.code + (account.snapshot().paidBillIds.indexOf(item.id) !== -1 ? " • já paga nesta sessão" : "");
      } else info.textContent = type === "pix" ? "Chave Pix de exemplo: " + item.pixKey : item.bank + " • " + item.account + " (dados inventados)";
    }
    select.addEventListener("change", updateDestination);
    updateDestination();
    var error = element("p", "tx-error");
    error.setAttribute("role", "alert");
    error.setAttribute("tabindex", "-1");
    var actions = element("div", "tx-actions");
    var submit = element("button", "tx-primary", "Continuar para revisão");
    submit.type = "submit";
    actions.append(submit, viewButton("Cancelar", "balance"));
    form.append(destination, info, amountLabel, error, actions);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var values = { recipientId: select.value, billId: select.value, amount: amount.value };
      var result = account.prepare(type, values);
      if (!result.ok) { error.textContent = result.error; error.focus(); return; }
      operationReview(result.draft, values);
    });
    content.append(form);
  }
  function operationReview(draft, values) {
    var content = document.getElementById("service-content");
    content.replaceChildren();
    document.getElementById("service-title").textContent = "Revise o " + operationLabels[draft.type].toLowerCase();
    content.append(element("p", "tx-stage", "ETAPA 2 DE 3 · REVISAR"));
    content.append(element("h3", "panel-subtitle", "Confira antes de confirmar"));
    var pairs = [
      [draft.bill ? "Conta" : "Destinatário", draft.bill ? draft.bill.name : draft.recipient.name],
      ["Valor simulado", money(draft.amountCents)], ["Tarifa", "R$ 0,00"],
      ["Saldo fictício após confirmar", money(account.snapshot().closingCents - draft.amountCents)]
    ];
    if (draft.recipient) pairs.splice(1, 0, [draft.type === "pix" ? "Chave fictícia" : "Conta fictícia", draft.type === "pix" ? draft.recipient.pixKey : draft.recipient.bank + " • " + draft.recipient.account]);
    content.append(detailRows(pairs));
    content.append(element("p", "panel-demo", "Ao confirmar, apenas o saldo e o extrato desta aba serão alterados. Nenhuma transação real será executada."));
    var error = element("p", "tx-error");
    error.setAttribute("role", "alert");
    var actions = element("div", "tx-actions");
    var confirm = actionButton("Confirmar " + operationLabels[draft.type].toLowerCase() + " simulado", function () {
      confirm.disabled = true;
      var result = account.confirm(draft.id);
      if (!result.ok) { error.textContent = result.error; confirm.disabled = false; return; }
      updateBalance();
      operationReceipt(result.receipt);
      announce(operationLabels[draft.type] + " simulado concluído. Novo saldo fictício: " + money(result.receipt.balanceAfterCents));
    });
    actions.append(confirm, actionButton("Editar dados", function () { account.cancel(draft.id); operationForm(draft.type, values); focusPanel(); }, true),
      actionButton("Cancelar", function () { account.cancel(draft.id); showBankView(draft.type, true); announce("Simulação cancelada. Nenhum valor foi descontado."); }, true));
    content.append(error, actions);
    focusPanel();
  }
  function operationReceipt(receipt) {
    var content = document.getElementById("service-content");
    content.replaceChildren();
    document.getElementById("service-title").textContent = operationLabels[receipt.type] + " simulado concluído";
    content.append(element("p", "tx-stage", "ETAPA 3 DE 3 · COMPROVANTE"));
    content.append(element("div", "tx-success", "✓ Simulação concluída"));
    content.append(detailRows([
      ["Valor", money(receipt.amountCents)], ["Destino fictício", receipt.recipient],
      ["Data da simulação", receipt.date], ["Identificador", receipt.id],
      ["Saldo fictício atualizado", money(receipt.balanceAfterCents)]
    ]));
    content.append(element("p", "panel-demo", "Comprovante de demonstração, sem validade bancária. Nada foi enviado a um banco ou destinatário real."));
    var actions = element("div", "tx-actions");
    actions.append(viewButton("Ver no extrato", "statement"), viewButton("Nova simulação", receipt.type));
    content.append(actions);
    focusPanel();
  }
  function resetSimulation() {
    var content = document.getElementById("service-content");
    content.replaceChildren();
    document.getElementById("service-title").textContent = "Reiniciar simulação?";
    content.append(element("p", "panel-description", "Isso restaura o saldo fictício para R$ 1.250,00 e remove as operações e a conversa desta sessão."));
    content.append(actionButton("Confirmar reinício", function () {
      account.reset();
      updateBalance();
      log.replaceChildren();
      welcome.hidden = false;
      input.value = "";
      send.disabled = true;
      lastTopic = "";
      showBankView("statement", true);
      announce("Simulação reiniciada. Saldo fictício de R$ 1.250,00.");
    }), viewButton("Cancelar", "statement"));
    focusPanel();
  }

  var bankViews = {
    statement: "Extrato", balance: "Saldo disponível", pix: "Pix", payment: "Pagamentos",
    transfer: "Transferências", cards: "Meus cartões", safety: "Segurança"
  };
  function showBankView(view, focus) {
    if (!Object.prototype.hasOwnProperty.call(bankViews, view)) return;
    var title = document.getElementById("service-title");
    var content = document.getElementById("service-content");
    title.textContent = bankViews[view];
    content.replaceChildren();
    if (view === "statement") {
      content.append(element("p", "panel-description", "Histórico fictício inicial e operações simuladas nesta sessão"));
      content.append(element("p", "opening-balance", "Saldo inicial: " + money(statement.openingCents)));
      content.append(statementList());
      var total = element("div", "panel-total");
      total.append(element("span", "", "Saldo final fictício"), element("strong", "", money(account.snapshot().closingCents)));
      content.append(total);
    } else if (view === "balance") {
      content.append(element("p", "panel-description", "Valor disponível nesta demonstração"));
      content.append(element("strong", "panel-value", money(account.snapshot().closingCents)));
      content.append(element("p", "panel-description", "Nenhuma conta real foi consultada."));
    } else if (view === "cards") {
      var values = element("dl", "card-values");
      [["Limite total fictício", "R$ 3.000,00"], ["Fatura de exemplo", "R$ 430,00"], ["Limite disponível", "R$ 2.570,00"]].forEach(function (pair) {
        var item = element("div");
        item.append(element("dt", "", pair[0]), element("dd", "", pair[1]));
        values.append(item);
      });
      content.append(values);
    } else if (view === "pix" || view === "payment" || view === "transfer") {
      operationForm(view);
    } else {
      var examples = {
        safety: ["Informação também protege", "Nunca compartilhe senha, código de acesso ou dados completos do cartão. Em caso de dúvida, procure um canal oficial do seu banco."]
      };
      content.append(element("h3", "panel-subtitle", examples[view][0]));
      content.append(element("p", "panel-description", examples[view][1]));
    }
    content.append(element("p", "panel-demo", "Demonstração com dados fictícios. Nenhuma operação real está disponível."));
    var help = element("button", "panel-chat-button", view === "statement" ? "Me ajude a entender o extrato" : "Tirar dúvida com o assistente");
    help.type = "button";
    help.dataset.openTopic = view;
    content.append(help);
    document.querySelectorAll(".service-grid [data-view]").forEach(function (button) {
      if (button.dataset.view === view) button.setAttribute("aria-pressed", "true");
      else button.setAttribute("aria-pressed", "false");
    });
    if (focus) {
      title.focus({ preventScroll: true });
      document.getElementById("service-panel").scrollIntoView({ behavior: "instant", block: "nearest" });
    }
  }

  function openChat(trigger, topic) {
    opener = trigger || document.activeElement;
    overlay.hidden = false;
    bank.inert = true;
    document.body.classList.add("chat-open");
    document.getElementById("chat-title").focus({ preventScroll: true });
    if (topic) sendTopic(topic);
  }
  function closeChat() {
    overlay.hidden = true;
    bank.inert = false;
    settings.open = false;
    document.body.classList.remove("chat-open");
    if (opener && opener.isConnected) opener.focus({ preventScroll: true });
  }
  function addMessage(author, text, reply) {
    welcome.hidden = true;
    var article = element("article", "chat-message " + (author === "user" ? "user-message" : "bot-message"));
    article.append(element("span", "sr-only", author === "user" ? "Você: " : "Assistente Nexo: "));
    if (author === "user") article.append(element("p", "", text));
    else {
      article.append(element("h3", "", reply.title));
      (reply.paragraphs || []).forEach(function (paragraph) { article.append(element("p", "", paragraph)); });
      if (reply.steps) {
        var steps = element("ol", "reply-steps");
        reply.steps.forEach(function (step) { steps.append(element("li", "", step)); });
        article.append(steps);
      }
      if (reply.statement) {
        article.append(element("p", "opening-balance", "Saldo inicial: " + money(statement.openingCents)));
        article.append(statementList());
        article.append(element("p", "reply-total", "Saldo final fictício: " + money(account.snapshot().closingCents)));
      }
      if (reply.actions) {
        var actions = element("div", "reply-actions");
        reply.actions.forEach(function (item) {
          var button = element("button", "suggestion", item.label);
          button.type = "button";
          if (item.view) button.dataset.view = item.view;
          else button.dataset.topic = item.topic;
          actions.append(button);
        });
        article.append(actions);
      }
    }
    log.append(article);
    while (log.childElementCount > 40) log.firstElementChild.remove();
    document.getElementById("chat-scroll").scrollTop = document.getElementById("chat-scroll").scrollHeight;
  }
  function sendTopic(topic) {
    if (!Object.prototype.hasOwnProperty.call(engine.topics, topic)) return;
    addMessage("user", engine.topics[topic]);
    addMessage("bot", "", engine.response(topic, account.snapshot()));
    lastTopic = topic;
    settings.open = false;
  }
  function sendText(text) {
    var value = String(text || "").trim().slice(0, 180);
    if (!value) return;
    var topic = engine.classify(value, lastTopic);
    if (topic !== "private") addMessage("user", value);
    addMessage("bot", "", engine.response(topic, account.snapshot()));
    if (Object.prototype.hasOwnProperty.call(engine.topics, topic)) lastTopic = topic;
  }

  document.addEventListener("click", function (event) {
    var target = event.target.closest("button, a");
    if (!target) return;
    if (target.hasAttribute("data-font")) { changeScale(Number(target.dataset.font)); return; }
    if (target.hasAttribute("data-reset-simulation")) { resetSimulation(); return; }
    if (target.hasAttribute("data-contrast")) {
      applyContrast(!highContrast, true);
      preference("nexo-contrast", highContrast ? "on" : "off");
      return;
    }
    if (target.hasAttribute("data-view")) {
      if (!overlay.hidden) closeChat();
      showBankView(target.dataset.view, true);
      return;
    }
    if (target.hasAttribute("data-open-topic")) { openChat(target, target.dataset.openTopic); return; }
    if (target.hasAttribute("data-open-chat")) { openChat(target); return; }
    if (target.hasAttribute("data-topic") && !overlay.hidden) sendTopic(target.dataset.topic);
  });

  document.getElementById("chat-form").addEventListener("submit", function (event) {
    event.preventDefault();
    var value = input.value;
    input.value = "";
    send.disabled = true;
    sendText(value);
    input.focus({ preventScroll: true });
  });
  input.addEventListener("input", function () { send.disabled = !input.value.trim(); });
  document.getElementById("chat-close").addEventListener("click", closeChat);
  overlay.addEventListener("click", function (event) { if (event.target === overlay) closeChat(); });
  document.getElementById("chat-reset").addEventListener("click", function () {
    log.replaceChildren();
    welcome.hidden = false;
    input.value = "";
    send.disabled = true;
    lastTopic = "";
    settings.open = false;
    document.getElementById("chat-title").focus({ preventScroll: true });
    announce("Nova conversa iniciada.");
  });
  document.getElementById("balance-visibility").addEventListener("click", function () {
    var hidden = this.getAttribute("aria-pressed") !== "true";
    this.setAttribute("aria-pressed", String(hidden));
    this.setAttribute("aria-label", hidden ? "Mostrar saldo" : "Ocultar saldo");
    document.getElementById("dashboard-balance").textContent = hidden ? "R$ ••••••" : money(account.snapshot().closingCents);
  });
  document.addEventListener("keydown", function (event) {
    if (overlay.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      if (settings.open) { settings.open = false; settings.querySelector("summary").focus(); }
      else closeChat();
    }
    if (event.key === "Tab") {
      var controls = Array.prototype.slice.call(sheet.querySelectorAll("button:not([disabled]), input, summary, [href]"))
        .filter(function (node) { return node.getClientRects().length > 0; });
      var first = controls[0];
      var last = controls[controls.length - 1];
      if (!first) return;
      if (event.shiftKey && (document.activeElement === first || document.activeElement === document.getElementById("chat-title"))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    }
  });

  try { applyContrast(localStorage.getItem("nexo-contrast") === "on", false); }
  catch (error) { applyContrast(false, false); }
  updateBalance();
  showBankView("statement", false);
}());
