# Nexo Livre — uso e validação do protótipo

## Correspondência com o relatório

A abertura do Nexo Livre apresenta as quatro escolhas da seção 7: Consultar saldo, Entender o saldo, Dicas de segurança e Pedir ajuda. O saldo é fictício e fixo em R$ 1.250,00; o encaminhamento usa DEMO 001 e não abre atendimento real.

O painel bancário é contexto visual. Pix, pagamentos e cartões não realizam operações. Extrato fictício, palavras-chave opcionais, explicações alternativas e orientação passo a passo são recursos complementares já solicitados pela equipe; não devem ser descritos como parte do recorte original do documento. Os recursos adicionais estão identificados na ajuda e não exigem digitação.

Não foram alterados o relatório anexado nem seus resultados simulados.

## Registrar uma sessão

1. Abra “Área da equipe • teste de usabilidade” no final da página.
2. Selecione a natureza: teste observado com participante ou ensaio acadêmico simulado.
3. Explique a atividade, o registro local e a possibilidade de interromper. Inicie somente após concordância voluntária.
4. Apresente a tarefa de forma neutra: consultar o saldo fictício e solicitar apoio humano simulado. Não indique os botões que devem ser usados.
5. Preencha as observações durante a sessão. Para acessar a área da equipe, feche o painel de ajuda; a sessão continua até encerrar ou retirar o consentimento. A duração inclui esse tempo, então use o registro dos eventos para interpretar a sequência.
6. Encerre a sessão e confira as observações antes de baixar o JSON. O resultado é uma fotografia das respostas no encerramento; iniciar outro teste limpa o registro anterior desta aba.
7. Retirar o consentimento apaga os registros e respostas desta aba. Não remove cópias JSON anteriormente baixadas. Não use nomes, credenciais ou mensagens pessoais para identificar as cópias.

Não há áudio, vídeo, envio de dados ou armazenamento permanente de sessões. A preferência de alto contraste é salva separadamente no navegador.

## Experimentos da seção 8

- **1 — compreensão e desejabilidade:** peça que a pessoa explique a finalidade do assistente e indique uma utilidade em situação própria. Registre a avaliação sem transcrever informações pessoais. Cliques ou “Sim, resolvi” não substituem essa observação. O critério coletivo é pelo menos 5 de 6 pessoas satisfazendo ambos os requisitos.
- **2 — usabilidade e ajuda:** o sistema mede o tempo entre o início da sessão e a primeira conclusão das duas tarefas (saldo visualizado e encaminhamento confirmado). A equipe deve informar explicitamente se orientou a pessoa. Sem essa avaliação, o critério fica pendente. O limite é 120 segundos; o critério coletivo é pelo menos 5 de 6 participantes, sem instrução do moderador.
- **3 — acessibilidade e conexão:** indique as condições realmente usadas, o resultado de cada um dos três percursos e os bloqueios observados. Cada formulário descreve uma sessão nas condições indicadas, não aprovação geral. O relatório exige os três percursos concluídos e nenhum bloqueio crítico na avaliação proposta com três usuários.

O formulário não soma participantes nem mistura ensaios simulados com observações reais. A equipe precisa consolidar registros, aprendizagens e decisões em separado.

## Verificação de aceitação ainda necessária

As verificações automáticas existentes testam lógica, somas, consentimento e registros; usam um DOM mínimo e não certificam a interface.

Executar e registrar:

- Percorrer saldo, explicação e ajuda somente com Tab, Shift+Tab, Enter e Escape. Conferir foco visível, ordem de leitura, retorno ao botão de origem e ausência de foco no fundo do painel.
- Ampliar o navegador a 200% e testar também o controle A+ até 200%. Conferir textos, botões, rolagem e acesso ao fechamento em tela pequena.
- Usar um leitor de tela e confirmar rótulos e percepção das novas mensagens, principalmente saldo, erro e protocolo. Verificar se há anúncios repetidos.
- Conferir os mesmos percursos com alto contraste. Estados também devem estar descritos por texto.
- Simular a interrupção e retomar de diferentes telas. Esse botão testa a lógica de recuperação; não mede consumo de dados nem comprova desempenho em rede real.
- Registrar dificuldades e intervenções sem preencher campos não observados como se estivessem aprovados.

## Demonstração em banca

Mostrar o aviso fictício → abrir Nexo Livre → consultar saldo → explicar saldo e extrato → voltar → pedir ajuda → escolher motivo ou seguir sem informar → mostrar DEMO 001. Explicar os limites do protótipo. Os complementos podem ser mostrados depois do percurso principal.
