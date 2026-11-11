(function () {
  "use strict";

  var applicationContent = document.getElementById("application-content");
  var assistantOverlay = document.getElementById("assistant-overlay");
  var assistantDrawer = assistantOverlay.querySelector(".assistant-drawer");
  var drawerTitle = document.getElementById("assistant-drawer-title");
  var closeAssistantButton = document.getElementById("close-assistant");
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
  var lastOpener = null;
  var demoService = "";

  document.getElementById("balance-visibility").addEventListener("click", function () {
    var hidden = this.getAttribute("aria-pressed") !== "true";
    this.setAttribute("aria-pressed", String(hidden));
    this.setAttribute("aria-label", hidden ? "Mostrar saldo" : "Ocultar saldo");
    document.getElementById("dashboard-balance").textContent = hidden ? "R$ ••••••" : "R$ 1.250,00";
  });

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
    if (assistantOverlay.hidden) {
      return;
    }

    announcer.textContent = "";
    window.setTimeout(function () {
      announcer.textContent = text;
    }, 60);
  }

  function focusCurrentMessage() {
    if (!shouldMoveFocus || assistantOverlay.hidden) {
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

  function clearBalanceTimer() {
    if (balanceTimer !== null) {
      window.clearTimeout(balanceTimer);
      balanceTimer = null;
    }
  }

  function startBalanceTimer() {
    clearBalanceTimer();
    balanceTimer = window.setTimeout(function () {
      if (currentState === "loading-balance" && !assistantOverlay.hidden) {
        currentState = "balance";
        shouldMoveFocus = true;
        render();
      }
    }, 700);
  }

  function render() {
    var html = "";
    var announcement = "";

    if (currentState === "service") {
      setConnection(true);
      html += messageCard(
        "Área demonstrativa",
        demoService,
        "<p>Esta área faz parte da apresentação visual do Banco Nexo. O protótipo não realiza pagamentos, transferências ou contratação de produtos.</p>" +
        "<div class=\"message-details\"><strong>Conheça o Nexo Livre.</strong> Use a ajuda guiada para consultar o saldo fictício, entender informações ou solicitar apoio humano simulado.</div>"
      );
      html += '<div class="inline-actions">' + actionButton("home", "Abrir ajuda guiada", true) + actionButton("close", "Voltar ao banco", false) + "</div>";
      announcement = demoService + ". Área demonstrativa. Nenhuma transação está disponível.";
    }

    if (currentState === "home") {
      setConnection(true);
      html += messageCard(
        "Nexo Livre",
        "Olá. Como posso ajudar?",
        '<p>Estou aqui para explicar informações desta demonstração. Escolha uma opção; nenhuma delas movimenta dinheiro.</p>' +
          '<div class="message-details"><strong>Você está no controle.</strong> Se tiver dúvida, pode pedir ajuda em qualquer momento.</div>'
      );
      html += '<div class="option-grid" aria-label="Opções do assistente">' +
        option("balance", "R$", "Consultar saldo", "Ver um valor fictício") +
        option("explain", "≡", "Entender o saldo", "Saber a diferença para extrato") +
        option("safety", "✓", "Dicas de segurança", "Proteger seus dados") +
        option("help", "?", "Pedir ajuda", "Solicitar apoio humano simulado") +
      "</div>";
      announcement = "Nexo Livre aberto. Escolha uma das quatro opções.";
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
        actionButton("home", "Voltar ao início da ajuda", false) +
        actionButton("close", "Fechar ajuda", false) +
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

  function goTo(nextState, remember) {
    clearBalanceTimer();

    if (remember && currentState !== "offline") {
      history.push(currentState);
    }

    currentState = nextState;
    shouldMoveFocus = true;
    render();

    if (nextState === "loading-balance") {
      startBalanceTimer();
    }
  }

  function openAssistant(requestedState, opener) {
    clearBalanceTimer();
    lastOpener = opener || document.activeElement;
    history = [];
    currentState = requestedState === "balance" ? "loading-balance" : (requestedState || "home");
    previousState = currentState;
    shouldMoveFocus = false;

    assistantOverlay.hidden = false;
    applicationContent.setAttribute("inert", "");
    applicationContent.setAttribute("aria-hidden", "true");
    document.body.classList.add("drawer-open");
    render();

    if (currentState === "loading-balance") {
      startBalanceTimer();
    }

    window.requestAnimationFrame(function () {
      drawerTitle.focus({ preventScroll: true });
    });
  }

  function closeAssistant() {
    clearBalanceTimer();
    assistantOverlay.hidden = true;
    applicationContent.removeAttribute("inert");
    applicationContent.removeAttribute("aria-hidden");
    document.body.classList.remove("drawer-open");

    if (lastOpener && typeof lastOpener.focus === "function") {
      lastOpener.focus({ preventScroll: true });
    }
  }

  function handleAction(action) {
    if (action === "close") {
      closeAssistant();
      return;
    }

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

  function getFocusableDrawerElements() {
    return Array.prototype.slice.call(
      assistantDrawer.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
  }

  document.addEventListener("click", function (event) {
    var serviceControl = event.target.closest("[data-demo-service]");
    if (serviceControl) {
      demoService = serviceControl.getAttribute("data-demo-service");
      openAssistant("service", serviceControl);
      return;
    }
    var contrastControl = event.target.closest("[data-toggle-contrast]");
    if (contrastControl) {
      contrastToggle.click();
      return;
    }
    var openControl = event.target.closest("[data-open-assistant]");
    if (openControl) {
      openAssistant(openControl.getAttribute("data-assistant-state") || "home", openControl);
      return;
    }

    var actionControl = event.target.closest("[data-action]");
    if (actionControl && !assistantOverlay.hidden) {
      handleAction(actionControl.getAttribute("data-action"));
    }
  });

  closeAssistantButton.addEventListener("click", closeAssistant);

  assistantOverlay.addEventListener("click", function (event) {
    if (event.target === assistantOverlay) {
      closeAssistant();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (assistantOverlay.hidden) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeAssistant();
      return;
    }

    if (event.key === "Tab") {
      var focusable = getFocusableDrawerElements();
      var first = focusable[0];
      var last = focusable[focusable.length - 1];

      if (!focusable.length) {
        return;
      }

      if (event.shiftKey && (document.activeElement === first || document.activeElement === drawerTitle)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  connectionTest.addEventListener("click", function () {
    if (assistantOverlay.hidden || currentState === "offline") {
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
    document.querySelector("[data-toggle-contrast]").textContent =
      isHighContrast ? "Usar contraste padrão →" : "Ativar alto contraste →";
  });

  function updateTextScale(nextScale) {
    textScale = Math.min(130, Math.max(90, nextScale));
    document.documentElement.style.setProperty("--base-size", textScale + "%");
    fontLabel.textContent = "Texto " + textScale + "%";
    decreaseText.disabled = textScale === 90;
    increaseText.disabled = textScale === 130;

    if (!assistantOverlay.hidden) {
      updateAnnouncer("Tamanho do texto ajustado para " + textScale + " por cento.");
    }
  }

  increaseText.addEventListener("click", function () {
    updateTextScale(textScale + 10);
  });

  decreaseText.addEventListener("click", function () {
    updateTextScale(textScale - 10);
  });

  updateTextScale(100);
  render();
}());
