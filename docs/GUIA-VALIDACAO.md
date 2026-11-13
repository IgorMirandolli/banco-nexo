# Verificação — versão experimental do Assistente Nexo

Esta branch substitui o assistente guiado e a área de avaliação da equipe por um chatbot local. Os registros dos experimentos do relatório não fazem mais parte desta interface. A mudança de escopo deve ser considerada antes de apresentar esta versão como o MVP descrito no relatório original.

## Percurso principal

1. Abra `index.html`.
2. Teste mostrar e ocultar o saldo, ajuste da fonte e alto contraste.
3. Abra os atalhos de extrato, Pix, pagamentos, transferências e cartões.
4. Abra o chatbot pelo botão flutuante. Confira saudação, sugestões e campo de mensagem.
5. Use os assuntos sugeridos e escreva perguntas sobre os cinco serviços.
6. Acione “Mostrar área” em uma resposta e confira se a área correspondente aparece no banco.
7. Feche e reabra o chat: a conversa deve continuar. Use “Nova conversa” no menu de três pontos para limpar o histórico.

## Respostas e limites

- Inicialmente o extrato deve ter quatro movimentações inventadas e saldo final de R$ 1.250,00. Após simulações, deve refletir os débitos da sessão.
- Pagamentos, Pix e transferências devem indicar claramente que são simulações, sem transações reais.
- A fatura e o limite do cartão são apenas exemplos.
- Um assunto desconhecido deve oferecer sugestões.
- Perguntas com assuntos distintos devem pedir uma escolha.
- Padrões evidentes de dados pessoais não devem aparecer no histórico.
- O botão de chamado deve oferecer apenas a confirmação de abertura, sem opções de conversa com atendente. Ao confirmar, deve apresentar o protocolo fictício DEMO 001 e informar que nenhum chamado real foi aberto.

## Operações simuladas

- Escolher um destinatário fictício, informar R$ 25,50 no Pix e revisar: o saldo deve continuar em R$ 1.250,00.
- Confirmar: o saldo deve passar para R$ 1.224,50; o comprovante e o extrato devem mostrar o Pix fictício.
- Repetir com uma conta de exemplo e com uma transferência. Conferir saldo e extrato também pelo chat.
- Cancelar ou editar durante a revisão: não deve haver débito.
- Tentar valor zero, negativo, malformado ou acima do saldo: deve haver uma mensagem de erro sem alteração.
- Tentar pagar novamente a mesma conta na sessão: deve ser impedido.
- Confirmar uma operação repetidamente: não deve haver débitos duplicados.
- Manter o saldo oculto e concluir uma simulação: ele deve continuar oculto; ao revelar, deve mostrar o novo valor.
- Confirmar o reinício da simulação: saldo inicial, quatro movimentações e conversa vazia devem ser restaurados.

## Acessibilidade e apresentação

Verificação manual necessária, além dos testes de lógica:

- Usar Tab, Shift+Tab e Enter em sugestões, menu e envio. Conferir foco visível e ausência de acesso ao fundo enquanto o chat está aberto.
- Usar Escape para fechar o menu e depois o chat. Conferir retorno ao controle de abertura.
- Ampliar a fonte até 200% e o navegador a 200%; conferir conteúdo, rolagem e botões em telas menores.
- Conferir a tela de banco e a conversa em alto contraste.
- Usar leitor de tela para verificar nomes dos controles e percepção das novas mensagens.
- Testar o envio com Enter, mensagens longas e perguntas não reconhecidas.
- Abrir a página em celular ou viewport reduzido e conferir a folha inferior e o teclado.

## Testes locais

### Voz — verificação manual necessária

1. Execute `npm start` e abra `http://localhost:5500`.
2. Confira que abrir o chat não pede microfone nem captura áudio.
3. Toque no microfone e em **Agora não**: nenhuma captura deve começar.
4. Ouça a explicação e escolha **Ativar e falar**. Autorize o navegador manualmente.
5. Diga “quero ver meu extrato” e confira a resposta dentro do chat, incluindo o saldo atualizado. Teste “onde fica o Pix?”: o chat deve orientar, sem navegar ou executar uma operação.
6. Diga “confirme o Pix”, “reiniciar simulação” ou “abrir chamado”: o assistente deve explicar que a voz só faz consultas, sem alterar saldo, extrato ou chamados.
7. Confira leitura automática quando selecionada, **Ouvir resposta**, repetição e **Parar áudio**.
8. Durante uma captura e uma leitura, feche o chat ou oculte a aba: o áudio deve parar. A captura também deve encerrar em até 15 segundos, sem ficar ouvindo continuamente.
9. Teste permissão negada, microfone ausente e serviço sem conexão. Deve haver mensagem explicativa, sem tentativas automáticas.
10. Teste sem suporte à API e abrindo o HTML como arquivo: o recurso deve informar a limitação sem bloquear o chat por texto.

Não interpretar testes com APIs simuladas como prova de captação real ou de entendimento da fala. A compatibilidade e a qualidade da voz precisam ser verificadas no navegador e dispositivo de apresentação. A autorização deve ser feita pela pessoa responsável; o teste não deve coletar senhas ou dados reais.

### Lógica

```powershell
npm test
```

Os testes cobrem reconhecimento de assuntos, respostas, destinos das ações, dados fictícios e fluxos usando DOM mínimo. Não verificam a renderização visual nem certificam acessibilidade ou segurança bancária.
