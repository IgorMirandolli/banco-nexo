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
  var drawerContrast = document.getElementById("drawer-contrast");
  var keywordInput = document.getElementById("keyword-input");
  var keywordNotice = "";
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
  var statement = window.NexoStatement;
  var selectedMovement = 0;
  var walkthroughTopic = "balance";
  var walkthroughStep = 0;
  var walkthroughResult = "";

  function money(cents) {
    return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  var helpReason = "";
  var explanationTopic = "balance";
  var helpReasons = {
    information: "Não entendi a informação",
    interface: "Não consigo usar a tela",
    other: "Outra dificuldade",
    skip: "Prefiro não informar"
  };
  var testSession = window.NexoTestSession.create();
  var researchTicker = null;
  var lastResult = null;

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

    if (walkthroughResult === currentState) {
      html += messageCard("Orientação simulada • passo 3 de 3", "Agora confira a informação",
        walkthroughTopic === "balance"
          ? "<p>A consulta abriu abaixo. Encontre o valor em destaque: esse é o saldo fictício. Se ainda tiver dúvida, peça outra explicação ou apoio.</p>"
          : "<p>O extrato abriu abaixo. Leia a data, o nome e se houve entrada ou saída. Use “Entender” em uma movimentação para ver uma explicação.</p>");
    }

    if (currentState === "walkthrough-choice") {
      setConnection(true);
      html += messageCard("Orientação passo a passo", "O que você quer aprender a consultar?",
        "<p>Vamos avançar com uma instrução de cada vez. Você escolhe quando continuar e pode voltar.</p><div class=\"message-details\">Orientações predefinidas para demonstrar como o apoio poderia funcionar. Nenhum atendente real está conectado.</div>");
      html += '<div class="option-grid">' +
        option("walkthrough-balance", "R$", "Passo a passo: saldo", "Encontrar o valor disponível") +
        option("walkthrough-statement", "≡", "Passo a passo: extrato", "Encontrar as entradas e saídas") + "</div>";
      html += '<div class="inline-actions">' + actionButton("help", "Prefiro pedir apoio humano", false) + actionButton("back", "Voltar", false) + "</div>";
      announcement = "Orientação simulada. Escolha aprender a consultar saldo ou extrato.";
    }

    if (currentState === "walkthrough") {
      setConnection(true);
      var isBalanceWalkthrough = walkthroughTopic === "balance";
      if (walkthroughStep === 0) {
        html += messageCard("Orientação simulada • passo 1 de 3",
          isBalanceWalkthrough ? "Primeiro, escolha a consulta de saldo" : "Primeiro, escolha o extrato",
          isBalanceWalkthrough
            ? "<p>Na ajuda guiada, a opção “Consultar saldo” inicia o percurso para ver quanto está disponível. Use o botão abaixo para experimentar esse primeiro passo.</p>"
            : "<p>No banco, o atalho “Extrato de exemplo” fica em “Seu dia a dia”. Ele também aparece nas opções do Nexo Livre. Vamos seguir por esse caminho aqui.</p>");
        html += '<div class="inline-actions">' +
          actionButton("walkthrough-next", isBalanceWalkthrough ? "Consultar saldo" : "Ver extrato de exemplo", true) +
          actionButton("walkthrough-menu", "Escolher outro passo a passo", false) + "</div>";
      } else {
        html += messageCard("Orientação simulada • passo 2 de 3",
          isBalanceWalkthrough ? "Agora, abra o saldo fictício" : "Agora, saiba o que procurar",
          isBalanceWalkthrough
            ? "<p>Ao consultar, procure o valor em destaque. Ele é o saldo disponível no exemplo. Consultar não faz pagamento ou transferência e não pede senha nesta demonstração.</p>"
            : "<p>O extrato mostra quatro movimentações inventadas. “Entrada” aumenta o saldo; “Saída” diminui. Primeiro veja a data e o nome, depois confira o valor de cada linha.</p>");
        html += '<div class="inline-actions">' +
          actionButton("walkthrough-open", isBalanceWalkthrough ? "Ver saldo fictício" : "Abrir extrato de exemplo", true) +
          actionButton("walkthrough-previous", "Voltar ao passo 1", false) + "</div>";
      }
      announcement = "Passo " + (walkthroughStep + 1) + " de 3. " +
        (isBalanceWalkthrough ? "Orientação para consultar saldo." : "Orientação para consultar extrato.");
    }

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
        '<p>Esta é uma demonstração com dados fictícios, para consulta e orientação. Escolha uma opção; nenhuma delas movimenta dinheiro.</p>' +
          '<div class="message-details"><strong>Você está no controle.</strong> Se tiver dúvida, pode pedir ajuda em qualquer momento.</div>'
      );
      html += '<div class="option-grid" aria-label="Opções do assistente">' +
        option("balance", "R$", "Consultar saldo", "Ver um valor fictício") +
        option("explain", "≡", "Entender o saldo", "Saber a diferença para extrato") +
        option("safety", "✓", "Dicas de segurança", "Proteger seus dados") +
        option("help", "?", "Pedir ajuda", "Solicitar apoio humano simulado") +
      "</div>";
      announcement = "Nexo Livre aberto. Demonstração com dados fictícios. Escolha uma das quatro opções.";
    }

    if (currentState === "guide") {
      setConnection(true);
      html += messageCard(
        "Consulta guiada • passo 1 de 2",
        "Vamos consultar o saldo juntos?",
        '<p>Saldo é o valor disponível. Aqui você verá um exemplo fictício de <strong>R$ 1.250,00</strong>.</p>' +
        '<ol class="guide-steps"><li aria-current="step"><strong>Agora:</strong> escolha “Ver saldo fictício”.</li><li>Depois, veja o valor e uma explicação simples.</li></ol>' +
        '<div class="message-details">Consultar o saldo apenas mostra uma informação. Não faz pagamento nem transferência e não exige senha nesta demonstração.</div>'
      );
      html += '<div class="inline-actions">' + actionButton("show-balance", "Ver saldo fictício", true) + actionButton("back", "Voltar", false) + "</div>";
      announcement = "Consulta guiada. Passo 1 de 2. Selecione Ver saldo fictício. Nenhum dinheiro será movimentado.";
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
      explanationTopic = "balance";
      setConnection(true);
      html += messageCard(
        "Consulta guiada • passo 2 de 2",
        "Aqui está o seu saldo fictício",
        '<p>Você concluiu a consulta. Este é o valor disponível no exemplo:</p>' +
          '<div class="balance-card"><p>Saldo disponível nesta simulação</p><strong>R$ 1.250,00</strong></div>' +
          '<p>Leia assim: <strong>mil duzentos e cinquenta reais</strong>. Saldo mostra o valor disponível; extrato mostra as entradas e saídas.</p>' +
          '<div class="message-details"><strong>Importante:</strong> nenhuma conta real foi consultada e nenhuma transferência foi feita.</div>'
      );
      html += '<div class="inline-actions">' +
        actionButton("statement", "Ver extrato de exemplo", false) +
        actionButton("alternative", "Não entendi, explique de outro jeito", false) +
        actionButton("explain", "Entender o saldo", false) +
        actionButton("back", "Voltar", false) +
        actionButton("help", "Pedir ajuda", true) +
      "</div>";
      announcement = "Seu saldo fictício é R$ 1.250,00. Nenhuma conta real foi consultada.";
    }

    if (currentState === "understood") {
      setConnection(true);
      html += messageCard("Consulta concluída", "Pronto. Você chegou ao fim da consulta.",
        "<p>Você viu o saldo fictício e sua explicação. Pode repetir o percurso ou continuar usando as outras opções.</p>");
      html += '<div class="inline-actions">' + actionButton("home", "Ver opções da ajuda", true) + actionButton("balance", "Repetir consulta guiada", false) + "</div>";
      announcement = "Consulta concluída. Você pode repetir a consulta guiada ou voltar às opções da ajuda.";
    }

    if (currentState === "keyword-fallback") {
      setConnection(true);
      html += messageCard("Ajuda por palavras-chave", "Vamos escolher uma opção?", "<p>" + escapeHtml(keywordNotice) + "</p><p>Use um dos botões abaixo. Você não precisa digitar para continuar.</p>");
      html += '<div class="option-grid">' +
        option("balance", "R$", "Consultar saldo", "Percurso guiado") +
        option("explain", "≡", "Entender o saldo", "Saldo e extrato") +
        option("safety", "✓", "Dicas de segurança", "Proteja seus dados") +
        option("help", "?", "Pedir ajuda", "Apoio humano simulado") + "</div>";
      announcement = keywordNotice + " Escolha uma das opções disponíveis.";
    }

    if (currentState === "explain") {
      explanationTopic = "balance";
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
        actionButton("statement", "Ver extrato de exemplo", false) +
        actionButton("alternative", "Não entendi, explique de outro jeito", false) +
        actionButton("balance", "Consultar saldo", false) +
        actionButton("back", "Voltar", false) +
        actionButton("help", "Pedir ajuda", true) +
      "</div>";
      announcement = "Saldo é o valor disponível nesta simulação. Extrato é a lista de movimentações.";
    }

    if (currentState === "statement") {
      explanationTopic = "balance";
      setConnection(true);
      var list = '<ol class="statement-list" aria-label="Movimentações fictícias em ordem de data">' +
        statement.entries.map(function (entry, index) {
          var incoming = entry.amountCents > 0;
          return '<li><div class="statement-line"><div><time>' + escapeHtml(entry.date) + '</time><h4>' + escapeHtml(entry.label) +
            '</h4></div><strong class="' + (incoming ? "statement-in" : "statement-out") + '">' +
            (incoming ? "Entrada: + " : "Saída: − ") + escapeHtml(money(Math.abs(entry.amountCents))) +
            '</strong></div>' + actionButton("movement-" + index, "Entender: " + entry.label.toLowerCase(), false) + '</li>';
        }).join("") + "</ol>";
      html += messageCard("Recurso complementar • extrato fictício", "Veja o que entrou e o que saiu",
        '<p>Período ilustrativo: 1 a 4 de novembro de 2026. Este é um exemplo completo, com quatro movimentações inventadas.</p>' +
        '<p><strong>Saldo antes dessas movimentações: ' + escapeHtml(money(statement.openingCents)) + '.</strong></p>' +
        list +
        '<dl class="statement-summary"><div><dt>Total de entradas</dt><dd>' + escapeHtml(money(statement.incomingCents)) + '</dd></div>' +
        '<div><dt>Total de saídas</dt><dd>' + escapeHtml(money(statement.outgoingCents)) + '</dd></div>' +
        '<div><dt>Saldo final fictício</dt><dd>' + escapeHtml(money(statement.closingCents)) + '</dd></div></dl>' +
        '<div class="message-details">Começamos com R$ 500,00, somamos R$ 1.000,00 e subtraímos R$ 250,00. Restam R$ 1.250,00, o mesmo saldo mostrado na consulta. Nenhuma conta real foi acessada.</div>');
      html += '<div class="inline-actions">' + actionButton("return-balance", "Voltar ao saldo", false) + actionButton("explain", "Entender saldo e extrato", false) + "</div>";
      announcement = "Extrato fictício com quatro movimentações. Saldo inicial de quinhentos reais, entradas de mil reais e saídas de duzentos e cinquenta reais. Saldo final de mil duzentos e cinquenta reais.";
    }

    if (currentState === "movement") {
      explanationTopic = "balance";
      setConnection(true);
      var movement = statement.entries[selectedMovement];
      html += messageCard("Explicação de uma movimentação fictícia", movement.label,
        '<p>Data do exemplo: ' + escapeHtml(movement.date) + '.</p><p><strong>' +
        (movement.amountCents > 0 ? "Entrada: " : "Saída: ") + escapeHtml(money(Math.abs(movement.amountCents))) +
        '.</strong></p><p>' + escapeHtml(movement.explanation) + '</p><div class="message-details">Esta movimentação foi inventada para explicar o extrato. Ela não representa uma operação sua.</div>');
      html += '<div class="inline-actions">' + actionButton("statement", "Voltar ao extrato", true) + actionButton("return-balance", "Voltar ao saldo", false) + "</div>";
      announcement = movement.label + ". " + movement.explanation + " Movimentação fictícia.";
    }

    if (currentState === "alternative") {
      setConnection(true);
      if (explanationTopic === "safety") {
        html += messageCard("Outro jeito de explicar", "Sua senha é como uma chave",
          "<p>Imagine a chave da sua casa: ela permite entrar. A senha também protege o acesso à sua conta.</p><p>Se alguém pedir sua senha por mensagem ou ligação, não compartilhe. Procure orientação em um canal oficial do banco.</p><div class=\"message-details\">Aqui, a demonstração funciona sem nenhuma senha.</div>");
      } else {
        html += messageCard("Outro jeito de explicar", "Pense em uma carteira",
        '<p>Imagine uma carteira com <strong>R$ 100,00</strong>. Você recebe R$ 50,00 e gasta R$ 20,00.</p>' +
        '<div class="simple-example"><p><strong>Saldo: R$ 130,00.</strong> É quanto ficou na carteira.</p><p><strong>Extrato:</strong> o registro de que entraram R$ 50,00 e saíram R$ 20,00.</p></div>' +
        '<p>Este exemplo usa valores diferentes apenas para explicar. O saldo fictício da conta continua sendo R$ 1.250,00.</p>');
      }
      html += '<div class="inline-actions">' + actionButton("balance", "Rever consulta guiada", false) + actionButton("back", "Voltar", false) + "</div>";
      announcement = explanationTopic === "safety" ? "Sua senha é como uma chave. Não compartilhe. Nesta demonstração nenhuma senha é necessária." : "Outro jeito de explicar: saldo é quanto ficou na carteira; extrato é o registro do que entrou e saiu.";
    }

    if (currentState === "resolved") {
      setConnection(true);
      html += messageCard("Sua resposta", "Que bom que a explicação ajudou.",
        "<p>Você pode voltar às opções, consultar novamente ou fechar a ajuda quando quiser.</p>");
      html += '<div class="inline-actions">' + actionButton("home", "Ver opções da ajuda", true) + actionButton("close", "Voltar ao banco", false) + "</div>";
      announcement = "Você informou que resolveu sua dúvida.";
    }

    if (currentState === "doubt") {
      setConnection(true);
      html += messageCard("Vamos com calma", "Tudo bem continuar com dúvida",
        "<p>Você pode ver outro exemplo ou escolher apoio humano simulado. Pedir ajuda também é uma escolha sua.</p>");
      html += '<div class="inline-actions">' + actionButton("alternative", "Ver outro exemplo", false) + actionButton("help", "Quero apoio humano", true) + actionButton("home", "Voltar às opções", false) + "</div>";
      announcement = "Você ainda tem dúvida. Escolha outra explicação ou apoio humano.";
    }

    if (currentState === "safety") {
      explanationTopic = "safety";
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
        actionButton("alternative", "Não entendi, explique de outro jeito", false) +
        actionButton("back", "Voltar", false) +
        actionButton("help", "Pedir ajuda", true) +
      "</div>";
      announcement = "Dicas de segurança. Não informe sua senha a outras pessoas.";
    }

    if (currentState === "help") {
      setConnection(true);
      html += messageCard("Ajuda humana", "Com o que você precisa de apoio?",
        "<p>Escolha o motivo que mais se aproxima da sua dificuldade. Você também pode continuar sem informar.</p><p>Este encaminhamento é apenas uma simulação.</p>");
      html += '<div class="support-learning"><h3>Quer aprender a fazer a consulta?</h3><p>Você também pode experimentar uma orientação passo a passo para saldo ou extrato.</p>' +
        actionButton("walkthrough-menu", "Quero orientação passo a passo", false) + "</div>";
      html += '<div class="option-grid" aria-label="Motivo do pedido de apoio">' +
        option("reason-information", "?", helpReasons.information, "Preciso de outra explicação") +
        option("reason-interface", "≡", helpReasons.interface, "Tenho dificuldade para navegar") +
        option("reason-other", "…", helpReasons.other, "Minha dúvida é diferente") +
        option("reason-skip", "→", helpReasons.skip, "Continuar sem escolher um motivo") + "</div>";
      html += '<div class="inline-actions">' + actionButton("back", "Voltar", false) + "</div>";
      announcement = "Escolha o motivo para pedir ajuda humana simulada, ou continue sem informar.";
    }

    if (currentState === "help-confirmed") {
      setConnection(true);
      html += messageCard(
        "Ajuda humana",
        "Seu pedido de ajuda foi registrado na demonstração",
        '<p>Motivo escolhido: <strong>' + escapeHtml(helpReason) + '</strong>.</p><p>Em uma implantação real, esta etapa encaminharia sua dúvida para a equipe de atendimento.</p>' +
          '<div class="protocol-card"><p><strong>Encaminhamento simulado</strong></p><span class="protocol-number">PROTOCOLO DEMO 001</span><p>Nenhum atendimento real foi aberto e nenhum dado seu foi enviado.</p></div>'
      );
      html += '<div class="inline-actions">' +
        actionButton("walkthrough-menu", "Aprender a consultar saldo ou extrato", true) +
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

    if (["balance", "statement", "movement", "explain", "alternative", "safety"].indexOf(currentState) !== -1) {
      html += '<section class="resolution-question" aria-labelledby="resolution-title"><h3 id="resolution-title">Conseguiu resolver sua dúvida?</h3><div class="resolution-actions">' +
        actionButton("feedback-yes", "Sim, resolvi", false) +
        actionButton("feedback-no", "Ainda tenho dúvida", false) +
        actionButton("feedback-human", "Quero apoio humano", true) + "</div></section>";
    }
    if (currentState === "balance") testSession.record("balance-viewed");
    if (currentState === "statement") testSession.record("statement-viewed");
    if (currentState === "movement") testSession.record("movement-explained");
    if (currentState === "help") testSession.record("help-requested");
    if (currentState === "help-confirmed") testSession.record("human-forwarded");

    conversation.innerHTML = html;
    conversation.parentElement.scrollTop = 0;
    updateAnnouncer(announcement);
    focusCurrentMessage();
  }

  function goTo(nextState, remember) {
    clearBalanceTimer();
    if (nextState !== walkthroughResult) walkthroughResult = "";

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
    walkthroughResult = "";
    lastOpener = opener || document.activeElement;
    history = [];
    currentState = requestedState === "balance" ? "guide" : (requestedState || "home");
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
    keywordInput.value = "";
    assistantOverlay.hidden = true;
    applicationContent.removeAttribute("inert");
    applicationContent.removeAttribute("aria-hidden");
    document.body.classList.remove("drawer-open");

    if (lastOpener && typeof lastOpener.focus === "function") {
      lastOpener.focus({ preventScroll: true });
    }
  }

  function handleAction(action) {
    if (action === "walkthrough-menu") {
      goTo("walkthrough-choice", true);
      return;
    }
    if (action === "walkthrough-balance" || action === "walkthrough-statement") {
      walkthroughTopic = action === "walkthrough-balance" ? "balance" : "statement";
      walkthroughStep = 0;
      goTo("walkthrough", true);
      return;
    }
    if (action === "walkthrough-next" || action === "walkthrough-previous") {
      walkthroughStep = action === "walkthrough-next" ? 1 : 0;
      goTo("walkthrough", false);
      return;
    }
    if (action === "walkthrough-open") {
      walkthroughResult = walkthroughTopic;
      goTo(walkthroughTopic, true);
      return;
    }
    if (/^movement-\d+$/.test(action)) {
      var index = Number(action.slice(9));
      if (statement.entries[index]) {
        selectedMovement = index;
        goTo("movement", true);
      }
      return;
    }
    if (action === "return-balance") {
      goTo("balance", true);
      return;
    }
    if (action === "feedback-yes" || action === "feedback-no" || action === "feedback-human") {
      testSession.record(action);
      goTo(action === "feedback-yes" ? "resolved" : (action === "feedback-no" ? "doubt" : "help"), true);
      return;
    }
    if (action.indexOf("reason-") === 0) {
      var reason = helpReasons[action.slice(7)];
      if (reason) {
        helpReason = reason;
        goTo("help-confirmed", true);
      }
      return;
    }
    if (action === "alternative") {
      testSession.record("alternative");
      goTo("alternative", true);
      return;
    }
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
      testSession.record("back");
      var destination = history.length ? history.pop() : "home";
      goTo(destination, false);
      return;
    }

    if (action === "balance") {
      goTo("guide", true);
      return;
    }

    if (action === "show-balance") {
      goTo("loading-balance", true);
      return;
    }

    if (action === "statement" || action === "explain" || action === "safety" || action === "help" || action === "understood") {
      goTo(action, true);
      return;
    }

    if (action === "retry") {
      var restoredState = previousState === "loading-balance" ? "guide" : previousState;
      goTo(restoredState || "home", false);
    }
  }

  function getFocusableDrawerElements() {
    return Array.prototype.slice.call(
      assistantDrawer.querySelectorAll(
        'button:not([disabled]), summary, [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(function (element) { return element.getClientRects().length > 0; });
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
      toggleContrast();
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
    testSession.record("connection-interruption");
    previousState = currentState;
    currentState = "offline";
    shouldMoveFocus = true;
    render();
  });

  function applyContrast(enabled, announce) {
    document.body.classList.toggle("high-contrast", enabled);
    [contrastToggle, drawerContrast].forEach(function (button) {
      button.setAttribute("aria-pressed", String(enabled));
      button.setAttribute("aria-label", enabled ? "Desativar alto contraste" : "Ativar alto contraste");
      button.querySelector("[data-contrast-status]").textContent = enabled ? "Ativado" : "Desativado";
    });
    var shortcut = document.querySelector("[data-toggle-contrast]");
    shortcut.textContent = enabled ? "Desativar alto contraste →" : "Ativar alto contraste →";
    shortcut.setAttribute("aria-pressed", String(enabled));
    if (announce) {
      var text = enabled ? "Alto contraste ativado." : "Alto contraste desativado.";
      if (assistantOverlay.hidden) document.getElementById("page-announcer").textContent = text;
      else updateAnnouncer(text);
    }
  }

  function toggleContrast() {
    var enabled = !document.body.classList.contains("high-contrast");
    applyContrast(enabled, true);
    try { localStorage.setItem("nexo-contrast", enabled ? "on" : "off"); } catch (error) { /* Preferência apenas nesta sessão. */ }
  }
  contrastToggle.addEventListener("click", toggleContrast);
  drawerContrast.addEventListener("click", toggleContrast);
  try { applyContrast(localStorage.getItem("nexo-contrast") === "on", false); } catch (error) { applyContrast(false, false); }

  document.getElementById("keyword-form").addEventListener("submit", function (event) {
    event.preventDefault();
    var intent = window.NexoKeywords.classify(keywordInput.value);
    keywordInput.value = "";
    var notices = {
      empty: "Digite uma palavra, como saldo, ou escolha um botão.",
      unknown: "Não reconheci essa palavra. Posso ajudar com saldo, extrato, segurança ou atendimento.",
      ambiguous: "Encontrei mais de um assunto. Escolha abaixo o que você quer fazer.",
      private: "Use apenas palavras sobre sua dúvida. Não é necessário informar números, senha ou dados pessoais.",
      unsupported: "Este protótipo não realiza operações financeiras. Posso orientar sobre saldo, extrato, segurança e ajuda humana simulada."
    };
    if (notices[intent]) {
      testSession.record("keyword-fallback");
      keywordNotice = notices[intent];
      goTo("keyword-fallback", true);
    } else {
      handleAction(intent);
    }
  });

  function updateTextScale(nextScale) {
    textScale = Math.min(200, Math.max(90, nextScale));
    document.body.classList.toggle("large-text", textScale >= 150);
    document.documentElement.style.setProperty("--base-size", textScale + "%");
    fontLabel.textContent = "Texto " + textScale + "%";
    decreaseText.disabled = textScale === 90;
    increaseText.disabled = textScale === 200;

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

  var researchConsent = document.getElementById("research-consent");
  var researchStart = document.getElementById("research-start");
  var researchFinish = document.getElementById("research-finish");
  var researchExport = document.getElementById("research-export");
  var researchStatus = document.getElementById("research-status");
  var researchClock = document.getElementById("research-clock");
  var researchResult = document.getElementById("research-result");
  var researchModerator = document.getElementById("research-moderator");
  var researchNature = document.getElementById("research-nature");
  var observationFields = document.getElementById("research-observations");
  var assessment = window.NexoAssessment;

  assessment.fields.forEach(function (field) {
    var target = document.getElementById("research-experiment" + field.group);
    target.innerHTML += '<label class="research-select" for="observation-' + field.id + '">' + escapeHtml(field.label) +
      '<select id="observation-' + field.id + '"><option value="pending">Não avaliado</option>' +
      field.options.map(function (value) { return '<option value="' + value + '">' + escapeHtml(assessment.labels[value]) + '</option>'; }).join("") + "</select></label>";
  });
  ["conditions", "difficulties"].forEach(function (group) {
    document.getElementById("research-" + group).innerHTML = Object.keys(assessment[group]).map(function (key) {
      return '<label class="research-check"><input id="observation-' + group + '-' + key + '" type="checkbox" />' + escapeHtml(assessment[group][key]) + "</label>";
    }).join("");
  });

  function resetObservations() {
    assessment.fields.forEach(function (field) { document.getElementById("observation-" + field.id).value = "pending"; });
    ["conditions", "difficulties"].forEach(function (group) {
      Object.keys(assessment[group]).forEach(function (key) { document.getElementById("observation-" + group + "-" + key).checked = false; });
    });
    researchModerator.value = "pending";
  }

  function collectObservations() {
    var raw = {};
    assessment.fields.forEach(function (field) { raw[field.id] = document.getElementById("observation-" + field.id).value; });
    ["conditions", "difficulties"].forEach(function (group) {
      raw[group] = Object.keys(assessment[group]).filter(function (key) { return document.getElementById("observation-" + group + "-" + key).checked; });
    });
    return assessment.assess(raw);
  }

  function stopResearchTicker() {
    if (researchTicker !== null) window.clearInterval(researchTicker);
    researchTicker = null;
    researchClock.hidden = true;
    document.getElementById("research-indicator").hidden = true;
  }

  function discardResearch() {
    testSession.discard();
    lastResult = null;
    stopResearchTicker();
    researchConsent.checked = false;
    resetObservations();
    observationFields.disabled = true;
    researchModerator.disabled = true;
    researchNature.disabled = false;
    researchNature.value = "";
    researchResult.innerHTML = "";
    researchStart.disabled = false;
    researchFinish.disabled = true;
    researchExport.disabled = true;
    researchStatus.textContent = "Consentimento retirado. Registros desta aba apagados. Nenhuma ação está sendo registrada.";
  }

  researchConsent.addEventListener("change", function () {
    if (!researchConsent.checked) discardResearch();
  });
  document.getElementById("research-discard").addEventListener("click", discardResearch);
  document.getElementById("research-stop-inside").addEventListener("click", function () {
    discardResearch();
    updateAnnouncer("Teste interrompido. Consentimento retirado e registros desta aba apagados.");
    drawerTitle.focus();
  });

  researchStart.addEventListener("click", function () {
    if (!researchConsent.checked) {
      researchStatus.textContent = "Explique a atividade e obtenha a concordância voluntária antes de iniciar.";
      researchConsent.focus();
      return;
    }
    clearBalanceTimer();
    currentState = "home";
    history = [];
    render();
    if (["observed", "simulated"].indexOf(researchNature.value) === -1) {
      researchStatus.textContent = "Selecione se é um teste observado com participante ou um ensaio simulado.";
      researchNature.focus();
      return;
    }
    testSession.start(true);
    lastResult = null;
    researchResult.innerHTML = "";
    resetObservations();
    observationFields.disabled = false;
    researchModerator.disabled = false;
    researchNature.disabled = true;
    researchStart.disabled = true;
    researchFinish.disabled = false;
    researchExport.disabled = true;
    document.getElementById("research-indicator").hidden = false;
    researchClock.hidden = false;
    researchClock.textContent = "Tempo decorrido: 0 s";
    researchStatus.textContent = "Teste iniciado. A pessoa pode usar o banco e a ajuda. Para parar, encerre o teste ou retire o consentimento nesta área.";
    researchTicker = window.setInterval(function () {
      researchClock.textContent = "Tempo decorrido: " + Math.floor(testSession.status().seconds) + " s";
    }, 1000);
  });

  researchFinish.addEventListener("click", function () {
    var moderatorHelp = researchModerator.value === "yes" ? true : (researchModerator.value === "no" ? false : undefined);
    lastResult = testSession.finish(moderatorHelp);
    if (!lastResult) return;
    lastResult.sessionKind = researchNature.value;
    lastResult.observations = collectObservations();
    observationFields.disabled = true;
    researchModerator.disabled = true;
    researchNature.disabled = false;
    stopResearchTicker();
    researchStart.disabled = false;
    researchFinish.disabled = true;
    researchExport.disabled = false;
    var yesNo = function (value) { return value ? "Sim" : "Não"; };
    var rows = [
      ["Natureza da sessão", lastResult.sessionKind === "observed" ? "Teste observado com participante" : "Ensaio simulado — não é evidência de campo"],
      ["Experimento 1 — compreensão e utilidade", lastResult.observations.experiment1IndividualCriterion === null ? "Não avaliado completamente" : (lastResult.observations.experiment1IndividualCriterion ? "Critério individual observado" : "Critério individual não observado")],
      ["Duração da sessão", lastResult.durationSeconds.toFixed(1) + " s"],
      ["Saldo fictício visualizado", yesNo(lastResult.balanceSeen)],
      ["Extrato de exemplo visualizado", yesNo(lastResult.events.some(function (event) { return event.type === "statement-viewed"; }))],
      ["Pedido de ajuda simulado concluído", yesNo(lastResult.humanForwardedSimulated)],
      ["Tempo até concluir ambas as tarefas", lastResult.bothTasksSeconds === null ? "Tarefas não concluídas" : lastResult.bothTasksSeconds.toFixed(1) + " s"],
      ["Orientação do moderador", lastResult.moderatorHelp === null ? "Não avaliado" : yesNo(lastResult.moderatorHelp)],
      ["Critério individual do experimento 2", lastResult.meetsExperiment2Criterion === null ? "Pendente: avaliar orientação do moderador" : (lastResult.meetsExperiment2Criterion ? "Atingido nesta sessão" : "Não atingido nesta sessão")],
      ["Experimento 3 — percursos observados", lastResult.observations.experiment3.completedPaths + " concluídos de 3; " + lastResult.observations.experiment3.evaluatedPaths + " avaliados"],
      ["Condições utilizadas", lastResult.observations.conditions.map(function (key) { return assessment.conditions[key]; }).join("; ") || "Nenhuma condição indicada"],
      ["Bloqueio crítico observado", assessment.labels[lastResult.observations.answers.criticalBlock]],
      ["Dificuldades registradas", lastResult.observations.difficulties.map(function (key) { return assessment.difficulties[key]; }).join("; ") || "Nenhuma marcada (não comprova ausência de barreiras)"],
      ["Explicações alternativas solicitadas", String(lastResult.events.filter(function (event) { return event.type === "alternative"; }).length)],
      ["Acessos ao pedido de apoio humano", String(lastResult.events.filter(function (event) { return event.type === "help-requested"; }).length)],
      ["Última resposta sobre resolução (autodeclarada)", {
        "feedback-yes": "Informou que resolveu",
        "feedback-no": "Informou que ainda tem dúvida",
        "feedback-human": "Preferiu apoio humano"
      }[lastResult.lastSelfReportedFeedback] || "Não respondeu"]
    ];
    researchResult.innerHTML = '<h3>Registro da sessão encerrada</h3><dl class="research-metrics">' +
      rows.map(function (row) { return "<div><dt>" + escapeHtml(row[0]) + "</dt><dd>" + escapeHtml(row[1]) + "</dd></div>"; }).join("") +
      '</dl><p>Critérios coletivos do relatório: experimentos 1 e 2 exigem pelo menos 5 de 6 participantes; experimento 3 exige 3 de 3 e nenhum bloqueio crítico. Este registro individual não calcula a aprovação coletiva. Ensaios simulados devem ser separados de testes com pessoas.</p>';
    researchStatus.textContent = "Teste encerrado. A coleta parou. Confira o registro abaixo; você pode baixá-lo ou apagá-lo.";
    researchResult.setAttribute("tabindex", "-1");
    researchResult.focus();
  });

  researchExport.addEventListener("click", function () {
    if (!lastResult) return;
    var blob = new Blob([JSON.stringify(lastResult, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "nexo-registro-de-teste.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  });

  updateTextScale(100);
  render();
}());
