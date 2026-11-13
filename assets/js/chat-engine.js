/* Motor local de respostas predefinidas. Sem rede, IA ou armazenamento. */
(function (root) {
  "use strict";
  var topics = {
    statement: "Ver meu extrato", balance: "Consultar saldo", payment: "Como pagar uma conta?",
    pix: "Como fazer um Pix?", transfer: "Como fazer uma transferência?", cards: "Cartões e limite",
    safety: "Dicas de segurança", support: "Abrir chamado", about: "Sobre o assistente",
    accessibility: "Fonte e contraste", "support-confirmed": "Confirmar abertura do chamado"
  };
  function has(object, key) { return Object.prototype.hasOwnProperty.call(object, key); }
  function action(topic) { return { label: topics[topic], topic: topic }; }
  function privateInput(message) {
    var text = String(message || "");
    return /@/.test(text) || text.replace(/\D/g, "").length >= 5 || /\bsenha\s*[:=]\s*\S+/i.test(text);
  }
  function classify(message, context) {
    if (privateInput(message)) return "private";
    var text = String(message || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    if (!text) return "empty";
    if (/\b(atendente|humano|pessoa|suporte|atendimento|chamado|chamados|protocolo)\b/.test(text)) return "support";
    if (/\b(golpe|fraude|senha|roubo|roubado|perdi|perdido|seguranca)\b/.test(text)) return "safety";
    if (/\b(fonte|letra|contraste|acessibilidade|aumentar|diminuir)\b/.test(text)) return "accessibility";
    if (/\b(assistente|robo|chatbot|voce faz)\b/.test(text)) return "about";
    var matches = [];
    if (/\b(extrato|estrato|movimentacao|movimentacoes|entradas|saidas)\b/.test(text)) matches.push("statement");
    if (/\b(pix|chave|qr code)\b/.test(text)) matches.push("pix");
    if (/\b(pagar|pagamento|pagamentos|boleto|boletos|conta de luz)\b/.test(text)) matches.push("payment");
    if (/\b(transferir|transferencia|transferencias|ted)\b/.test(text)) matches.push("transfer");
    if (/\b(cartao|cartoes|limite|fatura|credito|debito)\b/.test(text)) matches.push("cards");
    if (/\b(saldo|disponivel)\b/.test(text) && matches.length === 0) matches.push("balance");
    // "Pagar com Pix" descreve uma única intenção; dúvidas de assuntos diferentes pedem escolha.
    if (matches.length === 2 && matches.indexOf("pix") !== -1 && matches.indexOf("payment") !== -1) return "pix";
    if (matches.length > 1) return "choose";
    if (matches.length) return matches[0];
    if (/\b(obrigado|obrigada|valeu)\b/.test(text)) return "thanks";
    if (/^(oi|ola|bom dia|boa tarde|boa noite)[!?.\s]*$/.test(text)) return "greeting";
    if (/\b(como|onde|explica|entendi)\b/.test(text) && has(topics, context)) return context;
    return "unknown";
  }
  function response(topic, account) {
    var balance = account && Number.isSafeInteger(account.closingCents) ? account.closingCents : 125000;
    var formattedBalance = (balance / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    switch (topic) {
      case "statement":
        return { title: "Vamos olhar seu extrato", paragraphs: ["O extrato é a lista do que entrou e saiu da conta. Aqui, todas as movimentações são fictícias."], statement: true, actions: [{ label: "Abrir extrato no banco", view: "statement" }, action("balance"), action("support")] };
      case "balance":
        return { title: "Seu saldo de demonstração é " + formattedBalance, paragraphs: ["Este é o saldo fictício disponível após as simulações desta sessão. O extrato mostra as entradas e saídas. Nenhuma conta real foi consultada."], actions: [action("statement"), { label: "Ver saldo no banco", view: "balance" }] };
      case "pix":
        return { title: "Vamos simular um Pix?", steps: ["Abra a área Pix e escolha um destinatário fictício da lista.", "Informe o valor e continue para revisar.", "Confirme o Pix simulado para atualizar o saldo e receber um comprovante de exemplo."], paragraphs: ["Use somente os exemplos disponíveis. Nenhum dinheiro real é enviado."], actions: [{ label: "Simular Pix", view: "pix" }, action("safety"), action("support")] };
      case "payment":
        return { title: "Vamos simular um pagamento?", steps: ["Abra Pagar e escolha uma das contas fictícias.", "Confira o valor fixo e continue para revisar.", "Confirme para receber o comprovante e ver a saída no extrato desta sessão."], paragraphs: ["Não insira boletos reais. As contas são exemplos e nenhum pagamento real é realizado."], actions: [{ label: "Simular pagamento", view: "payment" }, action("support")] };
      case "transfer":
        return { title: "Vamos simular uma transferência?", steps: ["Abra Transferências e escolha uma conta fictícia.", "Informe o valor e confira os dados de exemplo na revisão.", "Confirme a transferência simulada. O saldo e o extrato desta aba serão atualizados."], paragraphs: ["A simulação não se conecta a bancos e não envia dinheiro real."], actions: [{ label: "Simular transferência", view: "transfer" }, action("pix"), action("support")] };
      case "cards":
        return { title: "Seu cartão de exemplo", paragraphs: ["Limite total fictício: R$ 3.000,00. Fatura de exemplo: R$ 430,00. Limite disponível no exemplo: R$ 2.570,00.", "Limite é quanto pode ser utilizado no cartão neste exemplo. Fatura é a relação de gastos a pagar. Esses valores não são o saldo da conta."], actions: [{ label: "Abrir cartões", view: "cards" }, action("safety"), action("support")] };
      case "safety":
        return { title: "Vamos cuidar da sua segurança", paragraphs: ["Não compartilhe senha, código de acesso, chave Pix ou dados completos do cartão nesta conversa.", "Se não reconhecer uma cobrança, suspeitar de golpe ou perder o cartão, procure um canal oficial do seu banco. Este protótipo não bloqueia cartões nem abre contestações reais."], actions: [action("support"), action("about")] };
      case "support":
        return { title: "Abrir um chamado", paragraphs: ["Confirme abaixo para gerar um protocolo de chamado demonstrativo.", "Esta opção não inicia conversa com um atendente. A abertura é simulada e nenhum dado será enviado."], actions: [action("support-confirmed")] };
      case "support-confirmed":
        return { title: "Abertura de chamado simulada", paragraphs: ["Protocolo fictício: DEMO 001.", "Nenhum chamado real foi aberto e nenhum dado foi enviado. Esta é apenas uma demonstração da confirmação de abertura."], actions: [] };
      case "accessibility":
        return { title: "Deixe a leitura mais confortável", paragraphs: ["No topo do banco, use A− e A+ para ajustar o texto até 200%, ou ative Alto contraste.", "Com o chat aberto, as mesmas opções estão no menu de três pontos ao lado do botão Fechar. Você pode navegar com Tab e fechar com Esc."], actions: [action("about")] };
      case "about":
        return { title: "Olá, eu sou o Assistente Nexo", paragraphs: ["Reconheço palavras-chave e respondo com explicações predefinidas sobre extrato, saldo, pagamentos, Pix, transferências e cartões.", "Você pode escrever uma dúvida ou tocar nas sugestões. Não uso IA e não realizo operações bancárias."], actions: [action("statement"), action("pix"), action("cards"), action("accessibility")] };
      case "private":
        return { title: "Não é preciso informar dados pessoais", paragraphs: ["Sua mensagem não foi adicionada ao histórico. Escreva apenas a dúvida, como “ver extrato” ou “como fazer Pix”, sem números de conta, senha ou dados pessoais."], actions: [action("statement"), action("safety")] };
      case "thanks":
        return { title: "Por nada! Estou por aqui.", paragraphs: ["Se precisar, escolha outro assunto ou escreva sua próxima dúvida."], actions: [action("statement"), action("cards")] };
      case "empty":
      case "greeting":
        return { title: "Olá! Como posso te ajudar?", paragraphs: ["Posso explicar os assuntos do banco. Escolha uma sugestão para começar."], actions: [action("statement"), action("pix"), action("payment")] };
      case "choose":
        return { title: "Vamos por um assunto de cada vez?", paragraphs: ["Encontrei mais de um assunto na mensagem. Escolha por qual você quer começar."], actions: [action("statement"), action("payment"), action("pix"), action("transfer"), action("cards")] };
      default:
        return { title: "Ainda não entendi sua dúvida", paragraphs: ["Sou um chatbot simples por palavras-chave. Tente escrever “extrato”, “pagar”, “Pix”, “transferência” ou “cartão”, ou escolha uma opção abaixo."], actions: [action("statement"), action("payment"), action("pix"), action("transfer"), action("cards"), action("support")] };
    }
  }
  function voiceResponse(message, context, account) {
    var topic = classify(message, context);
    var normalized = String(message).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if (topic !== "private" && (topic === "support" || /\b(confirmar|confirme|confirmo|envie|pague|transfira|reiniciar|apagar)\b/.test(normalized))) {
      return { topic: "voice-restricted", reply: { title: "Por voz, apenas consultas e orientações", paragraphs: ["Não confirmo operações, não altero dados e não abro chamados por comando de voz. Para isso, use os botões e confira as informações na tela.", "Você pode dizer: quero ver meu extrato, qual é meu saldo ou onde fica o Pix."], actions: [] } };
    }
    var locations = { pix: ["Pix", "Pix"], payment: ["Pagamentos", "Pagar"], transfer: ["Transferências", "Transferências"] };
    if (has(locations, topic)) {
      return { topic: topic, reply: { title: "Onde encontrar " + locations[topic][0], paragraphs: ["Na tela principal do banco, procure a seção Seu dia a dia e escolha " + locations[topic][1] + ".", "Esta resposta é apenas uma orientação. Nenhuma área, operação ou confirmação foi acionada pela sua voz."], actions: [] } };
    }
    return { topic: topic, reply: response(topic, account) };
  }
  var api = { topics: topics, classify: classify, response: response, voiceResponse: voiceResponse, privateInput: privateInput };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.NexoChat = api;
}(typeof window !== "undefined" ? window : this));
