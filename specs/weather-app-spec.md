# Especificacao do produto: Weather App

## 1. Overview

O Weather App permite que pessoas no Brasil pesquisem uma cidade, uma unidade federativa (UF) ou um CEP e consultem as condicoes meteorologicas atuais e a previsao para cinco dias. A aplicacao deve permitir alternar a temperatura entre Celsius e Fahrenheit, funcionar em computadores e celulares e nao exigir login.

As condicoes meteorologicas devem ser acompanhadas por imagens ilustrativas licenciadas sob Creative Commons, respeitando os termos e atribuicoes de cada licenca.

## 2. Functional Requirements

- **FR-01 — Buscar por cidade:** permitir pesquisar uma cidade pelo nome e apresentar resultados brasileiros correspondentes.
- **FR-02 — Buscar por UF:** permitir selecionar uma das unidades federativas brasileiras em uma caixa de seleção e localizar a UF pela sigla ou pelo nome completo.
- **FR-03 — Buscar por CEP:** permitir inserir CEP brasileiro e formatar a entrada como `00000-000` após o usuário concluir a digitação.
- **FR-04 — Selecionar regiao:** permitir selecionar a regiao desejada nos resultados. Quando houver cidades com o mesmo nome, nao escolher uma automaticamente; exigir selecao explicita do usuario. As consultas meteorologicas devem corresponder somente a regiao selecionada.
- **FR-05 — Ver clima atual:** para a região selecionada, apresentar temperatura, velocidade do vento, umidade relativa e percentual de chance de chuva. Se a seleção for uma UF, usar a cidade escolhida pelo usuário; se nenhuma cidade for escolhida, apresentar uma agregação do estado.
- **FR-06 — Ilustrar condicao:** apresentar uma imagem ilustrativa correspondente a cada condicao meteorologica exibida. As imagens devem ter licenca Creative Commons e apresentar atribuicao quando exigida pela licenca.
- **FR-07 — Ver previsão:** permitir consultar a previsão de cinco dias, contando o dia atual como o primeiro dia do período. Para cada dia, apresentar temperatura, velocidade do vento, umidade relativa e percentual de chance de chuva.
- **FR-08 — Alternar unidade:** permitir alternar a temperatura entre Celsius e Fahrenheit. A unidade inicial deve ser Celsius.
- **FR-09 — Atualizar regiao:** quando o usuario selecionar outra regiao, atualizar o clima atual e a previsao para a nova selecao.

## 3. User Stories

### US-01 — Pesquisar uma regiao brasileira

Como pessoa usuaria, quero buscar uma cidade, UF ou CEP para consultar o clima da regiao que me interessa.

**Acceptance Criteria**

- A busca aceita nome de cidade, UF ou CEP brasileiro.
- A UF pode ser escolhida em uma caixa de seleção que contém as UFs do Brasil e pode ser localizada por sigla ou nome completo.
- O CEP é formatado como `00000-000` após o usuário concluir a digitação.
- Resultados de busca correspondem a regioes do Brasil.
- O usuario consegue selecionar a regiao desejada antes da consulta meteorologica.
- Ao selecionar uma UF, o usuário pode escolher uma cidade; sem essa escolha, a aplicação apresenta uma agregação do estado.
- Se a entrada nao puder ser associada a uma regiao valida, a aplicacao informa que nao encontrou resultados ou que a entrada e invalida, sem mostrar clima de outra regiao.

### US-02 — Distinguir cidades com o mesmo nome

Como pessoa usuaria, quero escolher entre cidades homonimas para evitar consultar o clima de uma localidade diferente da pretendida.

**Acceptance Criteria**

- Quando houver mais de uma cidade com o nome pesquisado, a aplicacao apresenta as alternativas de forma que possam ser distinguidas.
- Nenhuma alternativa homonima e selecionada automaticamente.
- O clima atual e a previsao so sao carregados depois que o usuario escolhe uma alternativa.
- Os dados exibidos correspondem a alternativa escolhida.

### US-03 — Consultar o clima atual

Como pessoa usuaria, quero ver as condicoes meteorologicas atuais da regiao selecionada para entender o clima local.

**Acceptance Criteria**

- A aplicacao apresenta temperatura, velocidade do vento, umidade relativa e chance de chuva em percentual.
- Cada valor tem seu nome e unidade identificados.
- A aplicacao apresenta uma imagem ilustrativa correspondente a condicao meteorologica.
- A imagem e licenciada sob Creative Commons; a atribuicao e exibida quando requerida.
- A informacao apresentada pertence a regiao selecionada.

### US-04 — Consultar a previsao de cinco dias

Como pessoa usuaria, quero consultar a previsao para cinco dias a partir de hoje para planejar minhas atividades.

**Acceptance Criteria**

- A previsao apresenta cinco dias consecutivos, incluindo o dia atual.
- Cada dia e identificado por uma data ou descricao de dia sem ambiguidade.
- Para cada dia, a previsão apresenta temperatura, velocidade do vento, umidade relativa e chance de chuva em percentual.
- A previsao corresponde a regiao selecionada.
- A temperatura segue a unidade escolhida pelo usuario.
- O dia atual é determinado pelo fuso horário configurado no dispositivo do usuário.

### US-05 — Alternar Celsius e Fahrenheit

Como pessoa usuaria, quero escolher Celsius ou Fahrenheit para ler as temperaturas na unidade que prefiro.

**Acceptance Criteria**

- Celsius e a unidade inicial.
- O usuario consegue alternar entre Celsius e Fahrenheit.
- Ao alternar, os valores de temperatura do clima atual e da previsao sao apresentados na unidade selecionada.
- A unidade atual fica identificada junto aos valores de temperatura.

### US-06 — Usar o aplicativo em diferentes dispositivos

Como pessoa usuaria, quero consultar o clima pelo computador ou celular para acessar o servico no dispositivo disponivel.

**Acceptance Criteria**

- A interface se ajusta a diferentes tamanhos de tela.
- A validação em celular usa como referência um Motorola Moto G56; a interface também permanece utilizável em telas de computador.
- Em telas de celular e computador, os controles de busca, selecao, unidade e consulta permanecem acessiveis e utilizaveis.
- O conteudo principal nao fica cortado nem exige rolagem horizontal para ser lido.

## 4. Non-Functional Requirements

- **NFR-01 — Responsividade:** a aplicação deve se adaptar a telas de celulares e computadores, mantendo conteúdo e controles utilizáveis em diferentes larguras. O Motorola Moto G56 é o dispositivo móvel de referência para validação.
- **NFR-02 — Acesso sem conta:** nenhuma funcionalidade descrita nesta especificacao deve exigir criacao de conta ou login.
- **NFR-03 — Direitos de uso:** imagens e demais recursos visuais devem usar licença aberta que permita sua utilização no produto. Licenças Creative Commons são aceitas; termos, atribuições e restrições aplicáveis devem ser respeitados.
- **NFR-04 — Privacidade de localizacao:** se a aplicacao solicitar localizacao do dispositivo, deve pedir permissao antes do acesso. A geolocalizacao nao e necessaria para os fluxos de busca descritos.
- **NFR-05 — Isolamento por aba:** cada aba do navegador deve manter seu próprio estado de busca e região selecionada, sem interferência de outras abas.
- **NFR-06 — Acessibilidade básica:** campos e controles devem ter nomes identificáveis, resultados devem ser selecionáveis por teclado e imagens informativas devem ter texto alternativo. Não há critérios adicionais de acessibilidade definidos nesta especificação.
- **NFR-07 — Comunicacao de estado:** durante uma consulta, a aplicacao deve indicar que esta carregando; em caso de falha ou ausencia de resultados, deve informar a situacao sem apresentar dados como se fossem atuais.
- **NFR-08 — Idioma:** toda a interface deve estar em português do Brasil.

## 5. Edge Cases

- CEP incompleto, malformado ou sem regiao correspondente.
- Busca por cidade sem resultados ou com varias cidades homonimas.
- Busca por UF que nao possa ser resolvida para uma localidade meteorologica.
- Agregação estadual indisponível ou com dados insuficientes para um ou mais campos meteorológicos.
- Falha, indisponibilidade ou demora na consulta meteorologica.
- Dados ausentes para um ou mais campos do clima.
- Condicao meteorologica sem imagem licenciada correspondente.
- Licenca da imagem que exija atribuicao ou imponha condicoes adicionais de uso.
- Mudanca de regiao enquanto outra consulta ainda esta em andamento; dados da consulta anterior nao devem ser apresentados como pertencentes a nova selecao.
- Data corrente diferente entre o fuso horário do dispositivo e o da região consultada; o período deve seguir o fuso do dispositivo.
- Recurso de localizacao negado pelo usuario, caso seja oferecido.
- Janela estreita ou ampliada em que controles e conteudo devem continuar acessiveis.

## 6. Assumptions

- O escopo geografico da busca e restrito ao Brasil.
- O formato apresentado para CEP e `00000-000`.
- A formatação do CEP ocorre após a conclusão da entrada.
- A busca por UF usa uma caixa de seleção com todas as UFs brasileiras e permite encontrá-las pela sigla ou pelo nome completo.
- Para uma UF, o clima representa a cidade escolhida pelo usuário ou, se nenhuma cidade for escolhida, uma agregação do estado.
- Os quatro campos meteorológicos definidos aparecem no clima atual e em cada dia da previsão.
- A previsao de cinco dias inclui hoje e os quatro dias seguintes.
- O fuso horário do dispositivo do usuário determina qual data é considerada hoje.
- Celsius e a unidade padrao; a alternancia para Fahrenheit aplica-se aos valores de temperatura apresentados.
- Recursos visuais sob licença aberta podem ser utilizados; Creative Commons é aceitável desde que os termos e atribuições sejam respeitados.
- A aplicacao nao precisa de login.
- A busca manual por cidade, UF ou CEP e o fluxo principal; geolocalizacao e opcional e depende de consentimento.
- O Motorola Moto G56 é o dispositivo móvel de referência para validação responsiva; computadores também devem ser atendidos.
- O isolamento de dados e estado é definido por aba do navegador.
- A interface é exclusivamente em português do Brasil.

## 7. Risks

| Risco | Probabilidade | Impacto | Mitigacao proposta |
| --- | --- | --- | --- |
| Uma consulta por CEP ou UF pode nao identificar uma localidade meteorologica unica, ou a agregação estadual pode não estar disponível. | A avaliar | O usuario pode receber previsao incorreta, incompleta ou nenhuma previsao. | Validar a entrada, apresentar resultados correspondentes e definir uma regra para agregação estadual e dados ausentes. |
| Cidades homonimas podem ser confundidas. | A avaliar | A previsao pode se referir a outra cidade. | Exigir selecao explicita e apresentar contexto suficiente para diferenciar os resultados. |
| A fonte de dados meteorologicos pode falhar ou responder com atraso. | A avaliar | Clima e previsao podem ficar indisponiveis ou desatualizados. | Comunicar carregamento e falha; nao apresentar dados antigos como atuais sem identificacao. |
| O fuso horário do dispositivo pode divergir do fuso da região consultada. | A avaliar | A janela de cinco dias pode divergir do dia local da região. | Seguir o fuso do dispositivo, como definido, e identificar claramente as datas apresentadas. |
| Um recurso visual sob licença aberta pode exigir atribuição ou ter restrições específicas. | A avaliar | Uso indevido de conteúdo ou descumprimento da licença. | Verificar a licença de cada recurso e exibir as atribuições exigidas. |
| Estado de consultas em abas diferentes pode se misturar. | A avaliar | Dados podem ser exibidos no contexto errado entre abas. | Manter busca e região selecionada isoladas por aba e validar consultas concorrentes. |
| Diferentes tamanhos de tela podem prejudicar leitura ou operação. | A avaliar | Usuários de celular ou computador podem não conseguir usar os fluxos principais. | Validar os fluxos principais no Motorola Moto G56 e em telas de computador, sem corte de conteúdo ou controles inacessíveis. |

## 8. Out of Scope

- Criacao de conta, login ou perfil de usuario.
- Geolocalizacao automatica ou obrigatoria; seu uso depende de decisao futura e consentimento.
- Favoritos, historico de buscas, alertas meteorologicos ou notificacoes.
- Busca de regioes fora do Brasil.
- Definicao da fonte de dados, APIs, arquitetura, armazenamento ou estrategia de cache; esses itens pertencem ao plano tecnico.
- Exibir metricas adicionais alem das definidas, salvo decisao de produto posterior.

## 9. Open Questions

- Qual método e cobertura de dados devem definir a agregação estadual quando o usuário seleciona uma UF sem escolher uma cidade?
- Se a fonte não fornecer agregação para uma UF ou não tiver dados para todos os campos, qual alternativa deve ser apresentada?
- Qual fonte específica de imagens será usada e como serão apresentados os créditos e links da licença quando exigidos?
- Qual meta de desempenho deve ser atendida para as consultas meteorológicas?