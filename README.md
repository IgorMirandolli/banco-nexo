# Banco Nexo — Nexo Livre

Protótipo acadêmico de um banco digital com o assistente guiado **Nexo Livre**, desenvolvido para o Projeto Integrador Semestral A3, Equipe 4, caso IncluiTech.

O objetivo é demonstrar como tornar consultas bancárias mais compreensíveis para pessoas com barreiras digitais, preservando a autonomia e oferecendo acesso simples à ajuda.

## O que o protótipo faz

### Painel do banco

- Apresenta uma conta demonstrativa com saldo fictício de **R$ 1.250,00**.
- Permite mostrar ou ocultar o saldo.
- Exibe atalhos de serviços bancários e uma área de cartões para contextualizar a demonstração.
- Oferece acesso ao assistente Nexo Livre e um layout adaptável a telas menores.

### Assistente guiado Nexo Livre

O assistente abre em um painel lateral e apresenta as quatro opções principais do relatório:

1. **Consultar saldo:** apresenta o percurso e o valor fictício.
2. **Entender o saldo:** explica a diferença entre saldo e extrato.
3. **Dicas de segurança:** orienta sobre cuidados com informações pessoais.
4. **Pedir ajuda:** permite escolher o motivo e confirma um encaminhamento humano simulado com o protocolo **DEMO 001**.

Como recursos complementares, também permite:

- Consultar um extrato fictício com quatro movimentações que resultam no saldo apresentado.
- Entender cada entrada ou saída do extrato.
- Receber explicações alternativas com exemplos simples.
- Seguir orientações passo a passo para saldo e extrato.
- Informar se a dúvida foi resolvida ou solicitar mais apoio.
- Digitar palavras-chave, como “saldo”, “extrato” ou “atendente”, em um campo opcional. O reconhecimento usa regras locais e respostas predefinidas.

### Acessibilidade

- Botão de alto contraste no banco e dentro do assistente, com indicação de estado.
- Ajuste de tamanho do texto até 200%.
- Controles de navegação por teclado e fechamento da ajuda com `Esc`.
- Mensagens dinâmicas preparadas para anúncio por leitores de tela.
- Simulação de interrupção de conexão com opção de retomada.

Esses recursos ainda precisam ser avaliados visualmente e com pessoas usando teclado, ampliação e leitores de tela; a implementação não representa certificação de acessibilidade.

### Área da equipe

No final da página, a seção **“Área da equipe • teste de usabilidade”** permite iniciar uma sessão após consentimento, distinguir um ensaio simulado de um teste observado com participante e registrar:

- Compreensão da finalidade do assistente e percepção de utilidade.
- Tempo da consulta de saldo e do encaminhamento de ajuda.
- Orientação prestada pelo moderador.
- Condições de acessibilidade utilizadas e dificuldades observadas.

É possível encerrar a sessão, baixar o registro em JSON ou retirar o consentimento e apagar os registros desta aba. As avaliações coletivas dos experimentos dependem da consolidação e análise da equipe.

## Como inicializar o projeto

O projeto é estático: usa **HTML, CSS e JavaScript**, sem backend ou etapa de compilação. Para abrir a demonstração, não é necessário instalar Node.js nem executar `npm install`.

No VS Code, abra a pasta do projeto e um terminal PowerShell. Execute:

```powershell
Start-Process .\index.html
```

O comando abre a página no navegador padrão. Outra opção é abrir o arquivo `index.html` com dois cliques.

Mantenha a pasta `assets` junto do HTML, pois ela contém os estilos e scripts usados pela página.

### Com Live Server no VS Code

Se a extensão Live Server já estiver instalada:

1. Clique com o botão direito no arquivo `index.html`.
2. Escolha **Open with Live Server**.
3. Use o endereço local aberto pela extensão.

Após mudanças nos arquivos, recarregue a página. Se os estilos antigos continuarem aparecendo, use `Ctrl + F5`.

## Limites e dados utilizados

Este ambiente usa exclusivamente dados bancários fictícios. Não autentica clientes, acessa contas reais, realiza Pix, pagamentos ou transferências, nem abre atendimento humano real. Os atalhos desses serviços apresentam somente informações sobre o escopo da demonstração.

O assistente não utiliza IA generativa e não envia as mensagens digitadas a um servidor. O modo de teste registra apenas eventos predefinidos, tempos e avaliações estruturadas, sem armazenar o texto digitado.

As sessões de teste ficam na memória da aba e são apagadas ao recarregar a página. O JSON baixado é uma cópia separada, que não é removida ao apagar os registros na interface. A preferência de alto contraste é salva localmente no navegador.

## Organização

```text
index.html                     Página de entrada
assets/
  css/
    styles.css                 Estilos base e componentes do assistente
    bank.css                   Identidade visual e ajustes responsivos
  js/
    app.js                     Interface, fluxos e eventos
    keyword-router.js          Reconhecimento de palavras-chave
    research-assessment.js     Avaliação estruturada dos experimentos
    test-session.js            Consentimento e métricas das sessões
    data/
      statement-data.js        Dados fictícios do extrato
tests/                         Testes de lógica e integração com DOM mínimo
docs/
  GUIA-VALIDACAO.md             Orientações para testes e apresentação
package.json                   Comando para executar os testes
README.md                      Descrição e instruções de execução
```

Os scripts são carregados na ordem definida no HTML; `app.js` depende dos quatro arquivos anteriores. Os estilos de `bank.css` complementam os de `styles.css`.

## Testar

Com Node.js 24 ou superior instalado, execute na pasta do projeto:

```powershell
npm test
```

Não é necessário executar `npm install`. Os testes usam recursos do próprio Node.js. Também é possível executar um teste específico, por exemplo:

```powershell
node tests/assistant-flow.test.cjs
```

Os testes de lógica não substituem a avaliação visual, por teclado, ampliação e leitor de tela. Veja o [guia de validação](docs/GUIA-VALIDACAO.md).
