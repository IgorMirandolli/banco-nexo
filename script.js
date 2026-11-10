(function () {
  "use strict";

  var conversation = document.getElementById("conversation");
  var announcer = document.getElementById("live-announcer");
  var connectionStatus = document.getElementById("connection-status");
  var connectionTest = document.getElementById("connection-test");
  var contrastToggle = document.getElementById("contrast-toggle");
  var increaseText = document.getElementById("increase-text");
  var decreaseText = document.getElementById("decrease-text");
  var fontLabel = document.getElementById("font-label");

  var currentState = "home";
  var previousState = "home";
  var history = [];
  var textScale = 100;
  var balanceTimer = null;
  var shouldMoveFocus = false;

  var labels = {
    home: "Início do assistente",
    balance: "Consulta de saldo",
    explain: "Explicação sobre saldo",
    safety: "Dicas de segurança",
    help: "Pedido de ajuda",
    offline: "Conexão interrompida"
  };

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function messageCard(tag, title, content, extraClass) {
    return (
      '<article class="assistant-message ' + (extraClass || "") + '" tabindex="-1" data-focus-target>' +
        '<p class="message-tag">' + escapeHtml(tag) + "</p>" +
        "<h3>" + escapeHtml(title) + "</h3>" +
        content +
      "</article>"
    );
  }

  function option(action, icon, title, description) {
    return (
      '<button class="choice-button" type="button" data-action="' + action + '">' +
        '<span class="choice-icon" aria-hidden="true">' + icon + "</span>" +
        escapeHtml(title) +
        "<span>" + escapeHtml(description) + "</span>" +
      "</button>"
    );
  }

  function actionButton(action, title, primary) {
    return (
      '<button class="' + (primary ? "primary-button" : "secondary-button") + '" type="button" data-action="' + action + '">' +
        escapeHtml(title) +
      "</button>"
    );
  }

  function setConnection(isActive) {
    if (isActive) {
      connectionStatus.innerHTML = '<span class="connection-dot" aria-hidden="true"></span><span>Conexão de demonstração ativa</span>';
      connectionStatus.classList.remove("is-offline");
    } else {
      connectionStatus.innerHTML = '<span class="connection-dot" aria-hidden="true"></span><span>Conexão interrompida</span>';
      connectionStatus.classList.add("is-offline");
    }
  }

  function updateAnnouncer(text) {
    announcer.textContent = "";
    window.setTimeout(function () {
      announcer.textContent = text;
    }, 60);
  }

  function focusCurrentMessage() {
    if (!shouldMoveFocus) {
      return;
    }

    window.requestAnimationFrame(function () {
      var target = conversation.querySelector("[data-focus-target]");
      if (target) {
        target.focus({ preventScroll: true });
      }
      shouldMoveFocus = false;
    });
  }

  function render() {
    var html = "";
    var announcement = "";

    if (currentState === "home") {
      setConnection(true);
      html += messageCard(
        "Nexo Livre",
        "O que você quer fazer?",
        '<p>Esta é uma demonstração com dados fictícios. Escolha uma opção. Nenhuma ação aqui movimenta dinheiro.</p>' +
          '<div class="message-details"><strong>Você está no controle.</strong> Se tiver dúvida, use “Pedir ajuda” a qualquer momento.</div>'
      );
      html += '<div class="option-grid" aria-label="Opções disponíveis">' +
        option("balance", "R$", "Consultar saldo", "Ver um valor fictício") +
        option("explain", "≡", "Entender o saldo", "Saber a diferença para extrato") +
        option("safety", "✓", "Dicas de segurança", "Proteger seus dados") +
        option("help", "?", "Pedir ajuda", "Solicitar apoio humano simulado") +
      "</div>";
      announcement = "Início do Nexo Livre. Escolha uma das quatro opções.";
    }

    if (currentState === "loading-balance") {
      setConnection(true);
      html += messageCard(
        "Consulta de demonstração",
        "Buscando a informação...",
        '<div class="loading-row"><span class="loading-spinner" aria-hidden="true"></span><p>Estamos preparando um saldo fictício. Nenhuma conta real é consultada.</p></div>'
      );
      html += '<div class="inline-actions">' + actionButton("home", "Voltar ao início", false) + actionButton("help", "Pedir ajuda", true) + "</div>";
      announcement = "Buscando informação de demonstração. Nenhuma conta real é consultada.";
    }

    if (currentState === "balance") {
      setConnection(true);
      html += messageCard(
        "Consulta de demonstração",
        "Aqui está o seu saldo fictício",
        '<p>Este valor serve apenas para demonstrar o caminho de consulta.</p>' +
          '<div class="balance-card"><p>Saldo disponível nesta simulação</p><strong>R$ 1.250,00</strong></div>' +
          '<div class="message-details"><strong>Importante:</strong> nenhuma conta real foi consultada e nenhuma transferência foi feita.</div>'
      );
      html += '<div class="inline-actions">' +
        actionButton("explain", "Entender o saldo", false) +
        actionButton("back", "Voltar", false) +
        actionButton("help", "Pedir ajuda", true) +
      "</div>";
      announcement = "Seu saldo fictício é R$ 1.250,00. Nenhuma conta real foi consultada.";
    }

    if (currentState === "explain") {
      setConnection(true);
      html += messageCard(
        "Explicação simples",
        "Saldo e extrato não são a mesma coisa",
        '<p><strong>Saldo</strong> é o valor disponível nesta simulação. <strong>Extrato</strong> é a lista de movimentações, como entradas e saídas.</p>' +
          '<div class="comparison" aria-label="Comparação entre saldo e extrato">' +
            '<div><h4>Saldo</h4><p>Mostra quanto está disponível.</p></div>' +
            '<div><h4>Extrato</h4><p>Mostra as movimentações feitas.</p></div>' +
          "</div>"
      );
      html += '<div class="inline-actions">' +
        actionButton("balance", "Consultar saldo", false) +
        actionButton("back", "Voltar", false) +
        actionButton("help", "Pedir ajuda", true) +
      "</div>";
      announcement = "Saldo é o valor disponível nesta simulação. Extrato é a lista de movimentações.";
    }

    if (currentState === "safety") {
      setConnection(true);
      html += messageCard(
        "Segurança",
        "Proteja as suas informações",
        '<p>Nesta demonstração, nenhuma senha é necessária. Em um serviço bancário real, cuide dos seus dados.</p>' +
          '<ul class="safety-list">' +
            '<li><span class="check-symbol" aria-hidden="true">✓</span><span>Não informe sua senha a outras pessoas.</span></li>' +
            '<li><span class="check-symbol" aria-hidden="true">✓</span><span>Confira se você entende o que um botão vai fazer antes de continuar.</span></li>' +
            '<li><span class="check-symbol" aria-hidden="true">✓</span><span>Quando tiver dúvida, procure um canal oficial de ajuda.</span></li>' +
          "</ul>"
      );
      html += '<div class="inline-actions">' +
        actionButton("back", "Voltar", false) +
        actionButton("help", "Pedir ajuda", true) +
      "</div>";
      announcement = "Dicas de segurança. Não informe sua senha a outras pessoas.";
    }

    if (currentState === "help") {
      setConnection(true);
      html += messageCard(
        "Ajuda humana",
        "Seu pedido de ajuda foi registrado na demonstração",
        '<p>Você escolheu pedir apoio. Em uma implantação real, esta etapa encaminharia sua dúvida para a equipe de atendimento.</p>' +
          '<div class="protocol-card"><p><strong>Encaminhamento simulado</strong></p><span class="protocol-number">PROTOCOLO DEMO 001</span><p>Nenhum atendimento real foi aberto e nenhum dado seu foi enviado.</p></div>'
      );
      html += '<div class="inline-actions">' +
        actionButton("home", "Ir para o início", false) +
        actionButton("back", "Voltar", false) +
      "</div>";
      announcement = "Encaminhamento simulado. Protocolo DEMO 001. Nenhum atendimento real foi aberto.";
    }

    if (currentState === "offline") {
      setConnection(false);
      html += messageCard(
        "Conexão instável",
        "A conexão foi interrompida",
        '<p>Não se preocupe: nenhuma ação foi perdida. Esta tela continua disponível para você escolher como seguir.</p>' +
          '<div class="error-card"><p><strong>O que aconteceu?</strong> A demonstração simulou uma interrupção de conexão. Não houve movimentação nem envio de dados.</p></div>'
      );
      html += '<div class="inline-actions">' +
        actionButton("retry", "Tentar novamente", true) +
        actionButton("home", "Voltar ao início", false) +
        actionButton("help", "Pedir ajuda", false) +
      "</div>";
      announcement = "A conexão foi interrompida. Nenhuma ação foi perdida. Você pode tentar novamente, voltar ao início ou pedir ajuda.";
    }

    conversation.innerHTML = html;
    updateAnnouncer(announcement);
    focusCurrentMessage();
  }

  function clearBalanceTimer() {
    if (balanceTimer !== null) {
      window.clearTimeout(balanceTimer);
      balanceTimer = null;
    }
  }

  function goTo(nextState, remember) {
    clearBalanceTimer();

    if (remember && currentState !== "offline") {
      history.push(currentState);
    }

    currentState = nextState;
    shouldMoveFocus = true;
    render();

    if (nextState === "loading-balance") {
      balanceTimer = window.setTimeout(function () {
        if (currentState === "loading-balance") {
          currentState = "balance";
          shouldMoveFocus = true;
          render();
        }
      }, 850);
    }
  }

  function handleAction(action) {
    if (action === "home") {
      history = [];
      goTo("home", false);
      return;
    }

    if (action === "back") {
      var destination = history.length ? history.pop() : "home";
      goTo(destination, false);
      return;
    }

    if (action === "balance") {
      goTo("loading-balance", true);
      return;
    }

    if (action === "explain" || action === "safety" || action === "help") {
      goTo(action, true);
      return;
    }

    if (action === "retry") {
      var restoredState = previousState === "loading-balance" ? "balance" : previousState;
      goTo(restoredState || "home", false);
    }
  }

  document.addEventListener("click", function (event) {
    var actionControl = event.target.closest("[data-action]");
    if (actionControl) {
      handleAction(actionControl.getAttribute("data-action"));
    }
  });

  connectionTest.addEventListener("click", function () {
    if (currentState === "offline") {
      return;
    }
    clearBalanceTimer();
    previousState = currentState;
    currentState = "offline";
    shouldMoveFocus = true;
    render();
  });

  contrastToggle.addEventListener("click", function () {
    var isHighContrast = document.body.classList.toggle("high-contrast");
    contrastToggle.setAttribute("aria-pressed", String(isHighContrast));
    contrastToggle.innerHTML =
      '<span class="contrast-symbol" aria-hidden="true"></span>' +
      (isHighContrast ? "Contraste padrão" : "Alto contraste");
    updateAnnouncer(isHighContrast ? "Alto contraste ativado." : "Alto contraste desativado.");
  });

  function updateTextScale(nextScale) {
    textScale = Math.min(130, Math.max(90, nextScale));
    document.documentElement.style.setProperty("--base-size", textScale + "%");
    fontLabel.textContent = "Texto " + textScale + "%";
    decreaseText.disabled = textScale === 90;
    increaseText.disabled = textScale === 130;
    updateAnnouncer("Tamanho do texto ajustado para " + textScale + " por cento.");
  }

  increaseText.addEventListener("click", function () {
    updateTextScale(textScale + 10);
  });

  decreaseText.addEventListener("click", function () {
    updateTextScale(textScale - 10);
  });

  render();
}());
