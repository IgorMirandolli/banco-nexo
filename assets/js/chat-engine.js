/* Motor local de respostas predefinidas. Sem rede, IA ou armazenamento. */
(function (root) {
  "use strict";
  var topics = {
    statement: "Ver meu extrato", balance: "Consultar saldo", payment: "Como pagar uma conta?",
    pix: "Como fazer um Pix?", transfer: "Como fazer uma transferência?", cards: "Cartões e limite",
    safety: "Dicas de segurança", support: "Preciso de uma pessoa", about: "Sobre o assistente",
    accessibility: "Fonte e contraste", "support-confirmed": "Solicitar apoio simulado"
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
    if (/\b(atendente|humano|pessoa|suporte|atendimento)\b/.test(text)) return "support";
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
  function response(topic) {
    switch (topic) {
      case "statement":
        return { title: "Vamos olhar seu extrato", paragraphs: ["O extrato é a lista do que entrou e saiu da conta. Aqui, todas as movimentações são fictícias."], statement: true, actions: [{ label: "Abrir extrato no banco", view: "statement" }, action("balance"), action("support")] };
      case "balance":
        return { title: "Seu saldo de demonstração é R$ 1.250,00", paragraphs: ["Saldo é o valor disponível neste exemplo. Extrato é a lista de entradas e saídas que explica esse valor. Nenhuma conta real foi consultada."], actions: [action("statement"), { label: "Ver saldo no banco", view: "balance" }] };
      case "pix":
        return { title: "Posso te orientar sobre Pix", steps: ["Na tela do banco, escolha o atalho Pix.", "Confira quem receberia o dinheiro e o valor antes de qualquer confirmação em um serviço real.", "Nesta demonstração, a área Pix apresenta apenas um exemplo. Nenhum dinheiro é enviado."], paragraphs: ["Não envie uma chave Pix ou dados pessoais nesta conversa."], actions: [{ label: "Mostrar área Pix", view: "pix" }, action("safety"), action("support")] };
      case "payment":
        return { title: "Sobre pagar uma conta", steps: ["No painel, escolha Pagar para conhecer a área de pagamentos.", "Em uma operação real, confira o destinatário, valor e vencimento do documento.", "O protótipo mostra apenas informações de exemplo; não lê código de barras nem realiza pagamentos."], actions: [{ label: "Mostrar pagamentos", view: "payment" }, action("support")] };
      case "transfer":
        return { title: "Vamos falar de transferências", steps: ["Na tela principal, escolha Transferências.", "Antes de uma operação real, confira os dados de destino e o valor no ambiente do banco.", "Aqui, você pode conhecer um exemplo da área, sem preencher dados nem movimentar dinheiro."], actions: [{ label: "Mostrar transferências", view: "transfer" }, action("pix"), action("support")] };
      case "cards":
        return { title: "Seu cartão de exemplo", paragraphs: ["Limite total fictício: R$ 3.000,00. Fatura de exemplo: R$ 430,00. Limite disponível no exemplo: R$ 2.570,00.", "Limite é quanto pode ser utilizado no cartão neste exemplo. Fatura é a relação de gastos a pagar. Esses valores não são o saldo da conta."], actions: [{ label: "Abrir cartões", view: "cards" }, action("safety"), action("support")] };
      case "safety":
        return { title: "Vamos cuidar da sua segurança", paragraphs: ["Não compartilhe senha, código de acesso, chave Pix ou dados completos do cartão nesta conversa.", "Se não reconhecer uma cobrança, suspeitar de golpe ou perder o cartão, procure um canal oficial do seu banco. Este protótipo não bloqueia cartões nem abre contestações reais."], actions: [action("support"), action("about")] };
      case "support":
        return { title: "Você pode escolher pedir apoio", paragraphs: ["Posso continuar explicando os assuntos do banco ou demonstrar um encaminhamento para uma pessoa. Não existe atendente real conectado a este protótipo."], actions: [action("support-confirmed"), action("statement"), action("pix")] };
      case "support-confirmed":
        return { title: "Encaminhamento simulado", paragraphs: ["Protocolo DEMO 001.", "Nenhum chamado real foi aberto e nenhum dado foi enviado. Em um banco em operação, esta etapa conectaria você ao canal de atendimento."], actions: [action("about")] };
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
  var api = { topics: topics, classify: classify, response: response, privateInput: privateInput };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.NexoChat = api;
}(typeof window !== "undefined" ? window : this));
