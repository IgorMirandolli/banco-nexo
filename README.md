# Banco Nexo — Meu Assistente Nexo

Versão experimental do protótipo, desenvolvida na branch `experimento/novas-mudancas`. O painel do banco mantém o ajuste de fonte e o alto contraste e passa a oferecer um chatbot simples em uma janela flutuante.

## O que mudou nesta versão

O assistente guiado anterior, os percursos por etapas e a área de avaliação da equipe foram retirados desta branch. A versão anterior continua no histórico e na branch `main`.

O novo **Meu Assistente Nexo** tem:

- Botão flutuante para abrir a conversa.
- Janela arredondada, apresentada como uma folha inferior no celular.
- Saudação inicial, sugestões rápidas e campo de mensagem.
- Histórico de perguntas e respostas durante a permanência na página.
- Reconhecimento local de palavras-chave e respostas predefinidas.
- Opção de iniciar uma nova conversa.
- Acesso às preferências de fonte e contraste no menu de três pontos.

Não utiliza IA, conta de serviço externo ou API.

## Assuntos atendidos

| Assunto | O que o assistente demonstra |
| --- | --- |
| Extrato | Lista de entradas e saídas fictícias e acesso à área do extrato. |
| Saldo | Explicação do saldo demonstrativo de R$ 1.250,00. |
| Pagar | Orientação sobre a área de pagamentos e conferência dos dados. |
| Pix | Orientação para localizar Pix e conhecer os cuidados antes de confirmar. |
| Transferências | Explicação do caminho e da conferência das informações de destino. |
| Cartões | Limite e fatura fictícios, com explicação da diferença para saldo. |
| Ajuda básica | Segurança, acessibilidade, finalidade do assistente e encaminhamento humano simulado. |

Exemplos de mensagens: “ver meu extrato”, “como pagar um boleto?”, “fazer Pix”, “como fazer uma transferência?” e “qual o limite do cartão?”.

As sugestões também funcionam sem digitar. Quando encontra mais de um assunto ou não reconhece uma pergunta, o chatbot oferece opções para continuar.

## Abrir o projeto

Abra a pasta no VS Code e execute no terminal PowerShell:

```powershell
Start-Process .\index.html
```

Também é possível abrir `index.html` com dois cliques ou usar **Open with Live Server**, se a extensão já estiver instalada.

Não é necessário executar `npm install`, instalar dependências ou compilar. Mantenha a pasta `assets` junto do HTML. Depois de alterações, use `Ctrl + F5` para recarregar.

## Acessibilidade

- Ajuste de texto de 90% a 200%.
- Alto contraste no painel e no menu do chat, com preferência salva no navegador.
- Histórico preparado para anúncio de novas mensagens por leitor de tela.
- Controles por teclado, fechamento com `Esc` e retorno de foco ao ponto de abertura.

Os testes de lógica não substituem a inspeção visual, o uso de leitor de tela ou a avaliação com participantes.

## Dados e limites

Todos os valores e movimentações são fictícios. O protótipo não realiza pagamentos, Pix, transferências, bloqueios de cartão ou atendimento real.

O chat orienta e abre as áreas demonstrativas do painel. Não solicita dados bancários nem consulta contas reais. Mensagens com padrões evidentes de dados pessoais, como CPF, endereço de e-mail ou senha declarada, recebem orientação sem serem adicionadas ao histórico. Essa checagem é limitada; não informe informações pessoais mesmo assim.

A conversa fica somente na memória da página, limitada às últimas 40 mensagens, e é apagada ao recarregar ou selecionar **Nova conversa**. Fechar e reabrir a janela preserva a conversa enquanto a página permanece aberta. Nenhuma mensagem é enviada a servidores. Apenas a preferência de alto contraste é salva localmente.

## Organização

```text
index.html
assets/
  css/
    styles.css                 Base e acessibilidade
    bank.css                   Painel bancário e responsividade
    chat.css                   Janela e mensagens do chatbot
  js/
    app.js                     Interface, conversa e preferências
    chat-engine.js             Reconhecimento de assuntos e respostas
    data/
      statement-data.js        Movimentações fictícias
tests/
  chat-engine.test.cjs          Regras e respostas do chatbot
  chat-interface.test.cjs       Fluxos com DOM mínimo e referências do HTML
  statement-data.test.cjs       Coerência dos valores do extrato
docs/
  GUIA-VALIDACAO.md             Verificação da versão experimental
  images/                      Capturas preservadas da versão anterior
package.json
README.md
```

## Testar

Com Node.js 24 ou superior instalado, execute:

```powershell
npm test
```

Os testes usam somente recursos do Node.js. Veja também o [roteiro de verificação](docs/GUIA-VALIDACAO.md).

## Capturas da versão anterior

As imagens abaixo foram preservadas como referência histórica. Ainda não representam o novo chatbot desta branch.

<details>
<summary>Ver as capturas anteriores</summary>

![Painel anterior do Banco Nexo](docs/images/contrateoff.png)

| Assistente anterior | Consulta de saldo anterior |
| --- | --- |
| ![Assistente guiado anterior](docs/images/ajudaguiada.png) | ![Saldo na versão anterior](docs/images/saldo.png) |

| Extrato anterior | Apoio anterior |
| --- | --- |
| ![Extrato anterior](docs/images/extrato.png) | ![Apoio anterior](docs/images/ajuda.png) |

![Dicas de segurança anteriores](docs/images/dicaseguran%C3%A7a.png)

![Modo de alto contraste anterior](docs/images/contrasteon.png)

![Ajuste de texto anterior](docs/images/ampliador_texto.png)

</details>
