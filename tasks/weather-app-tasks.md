# Backlog de Tarefas: Weather App

Entrada: [plano técnico](../plans/weather-app-plan.md). Fonte de requisitos: [especificação](../specs/weather-app-spec.md). Este documento atende P5.1 a P5.8; não implementa funcionalidades nem declara tarefas concluídas pela existência de arquivos.

## Convenções de execução

- Esta revisão substitui a numeração anterior. Conferir referências antigas pelo título, não apenas pelo ID. Os novos IDs T-NN são únicos nesta revisão.
- Prioridades: P0 = base e fluxo principal; P1 = demais requisitos obrigatórios; P2 = consolidação documental. P1 não significa opcional para a entrega completa.
- Tamanhos: P = responsabilidade localizada; M = responsabilidade com variações de contrato/erro. Não há G: trabalhos maiores foram decompostos. Não são estimativas em horas.
- Cada tarefa indica até dois arquivos principais. T-12 tem exceção explícita para o lote de imagens binárias aprovado; não inclui múltiplos catálogos ou lógica adicional.
- Reaproveitar arquivos/testes existentes. Arquivos prováveis podem ainda não existir; não criar arquivos vazios apenas para cumprir a lista.
- Dependências são obrigatórias e aparecem antes dos dependentes. Trabalho independente pode avançar em paralelo, respeitando o fechamento transitivo das dependências.
- T-03/T-04/T-05 requerem aprovação de produto: o agente prepara propostas, mas não inventa decisões. Não bloqueiam contratos genéricos, cidade, CEP ou UI mock.
- Migração de tipos: expansão compatível, migração dos consumidores e remoção em T-49. Campos novos podem ser temporariamente opcionais; campos antigos ficam identificados como legados. Não inventar métricas nem duplicar modelos com nomes equivalentes. Antes de delegar, conferir consumidores; se a mudança não couber em dois arquivos principais, desdobrar e atualizar dependências, sem ampliar silenciosamente o escopo.
- Cada tarefa de código exige verificação focada e `pnpm lint`, `pnpm build`, `pnpm test`. Falhas preexistentes/ambientais são registradas, nunca apresentadas como aprovação. Decisões/documentação exigem revisão documental, não gates de código.
- Tarefas Test explicitam cobertura de regressão; não autorizam entregar código sem validação. Ajustar testes existentes da responsabilidade tocada quando necessário, mantendo o escopo pequeno.

## Entrega 1: Tipos e decisões independentes

### T-01 — Introduzir contratos auxiliares de seleção e falhas

- **Descrição:** Acrescentar contratos de região, CEP, assets e erros sem substituir modelos usados pela UI atual.
- **Critérios de aceite:** `RegionSelection` discrimina cidade confirmada (`city: City`) de UF sem cidade (`stateCode/stateName`); `PostalCodeLookup` diferencia encontrado/não encontrado; `WeatherAsset` exige origem, autor, licença Creative Commons, crédito e alt; erros distinguem entrada inválida, rede, timeout, provedor e dados incompletos; `Unit` continua exatamente `'celsius' | 'fahrenheit'`; consumidores atuais compilam sem alteração.
- **Dependências:** Nenhuma.
- **Arquivos prováveis:** `src/types/weather.ts`.
- **Tipo:** Data.
- **Prioridade / tamanho:** P0 / P.
- **Requisitos:** FR-03, FR-04, FR-05, FR-06, NFR-03, NFR-07.

### T-02 — Expandir contratos meteorológicos e fixtures

- **Descrição:** Preparar campos novos de `City`, `CurrentWeather`, `ForecastDay` e `WeatherData` de forma compatível.
- **Critérios de aceite:** Campos novos seguem nomes/unidades do plano, aceitam `null` para métricas ausentes e preveem região/fuso/agregado; fixture tem quatro métricas atuais/diárias e um caso ausente; compatibilidade temporária está identificada e vinculada a T-49; não alterar UI/serviços nem fabricar valores para satisfazer tipos.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/types/weather.ts`, `src/data/mockWeather.ts`.
- **Tipo:** Data.
- **Prioridade / tamanho:** P0 / M.
- **Requisitos:** FR-04, FR-05, FR-07, FR-08.

### T-03 — Obter decisão de agregação estadual

- **Descrição:** Submeter método, pontos, cobertura e fallback à aprovação de produto.
- **Critérios de aceite:** Aprovação registra pontos por UF, cálculo de cada métrica/código WMO, empates, campos ausentes, cobertura mínima, concorrência de consultas e fallback; spec/plano concordam; sem aprovação T-10/T-11 ficam bloqueadas; capital não é tratada como agregado.
- **Dependências:** Nenhuma.
- **Arquivos prováveis:** `specs/weather-app-spec.md`, `plans/weather-app-plan.md`.
- **Tipo:** Data.
- **Prioridade / tamanho:** P1 / M.
- **Requisitos:** FR-02, FR-05, FR-07.

### T-04 — Aprovar imagens e política de licença

- **Descrição:** Definir catálogo, arquivos e atribuições antes de publicar assets.
- **Critérios de aceite:** Cada imagem proposta registra condição, origem, autor, licença Creative Commons específica, restrições, crédito e fallback; aprovação fica no plano, coerente com a spec; enquanto pendente T-12 não é concluída; emoji não conta como imagem licenciada.
- **Dependências:** Nenhuma.
- **Arquivos prováveis:** `plans/weather-app-plan.md`.
- **Tipo:** UI.
- **Prioridade / tamanho:** P1 / M.
- **Requisitos:** FR-06, NFR-03, NFR-06.

### T-05 — Acordar meta verificável de desempenho

- **Descrição:** Resolver a pergunta de desempenho sem confundi-la com timeout técnico.
- **Critérios de aceite:** Produto aprova operação, limite, amostra e ambiente/rede de medição; spec/plano registram o mesmo critério; timeout de 10 segundos não é apresentado como SLA; pendência bloqueia T-52, não a UI ou o fluxo por cidade.
- **Dependências:** Nenhuma.
- **Arquivos prováveis:** `specs/weather-app-spec.md`, `plans/weather-app-plan.md`.
- **Tipo:** Infra.
- **Prioridade / tamanho:** P1 / P.
- **Requisitos:** NFR-07; pergunta aberta de desempenho.

## Entrega 2: Catálogos e funções puras

### T-06 — Criar catálogo pesquisável das 27 UFs

- **Descrição:** Fornecer siglas/nomes para normalização e seletor.
- **Critérios de aceite:** Exatamente 27 UFs únicas; sigla/nome localizam a mesma entrada sem diferenciar caixa/acentos; desconhecido retorna ausência, nunca UF arbitrária; não há rede.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/data/brazilStates.ts`.
- **Tipo:** Data.
- **Prioridade / tamanho:** P0 / P.
- **Requisitos:** FR-02, FR-04.

### T-07 — Implementar funções puras de CEP

- **Descrição:** Normalizar, validar e formatar sem decidir quando alterar o campo.
- **Critérios de aceite:** `01001000` e `01001-000` normalizam aos mesmos oito dígitos; letras, comprimentos/separadores inválidos são rejeitados; completo formata `01001-000`; parcial não vira válido; funções não consultam nem persistem dados.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/lib/postalCode.ts`.
- **Tipo:** Data.
- **Prioridade / tamanho:** P0 / P.
- **Requisitos:** FR-03.

### T-08 — Adequar conversão de temperatura

- **Descrição:** Derivar Celsius/Fahrenheit sem alterar a fonte de dados.
- **Critérios de aceite:** 0 °C → 32 °F, 100 °C → 212 °F e -40 °C → -40 °F; `null` é indisponível, não zero; arredondar somente a apresentação; não fazer request nem modificar entrada.
- **Dependências:** T-02.
- **Arquivos prováveis:** `src/lib/temperature.ts`.
- **Tipo:** Data.
- **Prioridade / tamanho:** P0 / P.
- **Requisitos:** FR-08.

### T-09 — Padronizar datas e métricas em pt-BR

- **Descrição:** Formatar datas civis, percentuais e vento sem parse implícito de UTC.
- **Critérios de aceite:** YYYY-MM-DD preserva o dia em fusos distintos; hoje é definido pelo dispositivo, não só pelo índice; vento usa km/h, umidade/chuva usam %, ausência usa “indisponível”; não acrescentar pressão/mm à UI final.
- **Dependências:** T-02.
- **Arquivos prováveis:** `src/lib/format.ts`.
- **Tipo:** Data.
- **Prioridade / tamanho:** P0 / P.
- **Requisitos:** FR-05, FR-07, NFR-08.

### T-10 — Registrar pontos estaduais aprovados

- **Descrição:** Converter a decisão em catálogo estático de amostras.
- **Critérios de aceite:** Pontos/coordenadas/UFs correspondem exatamente a T-03, sem duplicação; cobertura é identificável pelo agregador; não executar consultas nem inventar pontos.
- **Dependências:** T-03, T-06.
- **Arquivos prováveis:** `src/data/stateWeatherSamples.ts`.
- **Tipo:** Data.
- **Prioridade / tamanho:** P1 / P.
- **Requisitos:** FR-05, FR-07.

### T-11 — Implementar agregador puro

- **Descrição:** Combinar amostras normalizadas conforme aprovação.
- **Critérios de aceite:** Fórmulas/empates/cobertura seguem T-03; relatório identifica UF, agregado e amostras válidas; ausência não vira zero; datas incompatíveis não se combinam; cobertura insuficiente distingue parcial utilizável de indisponibilidade total; nenhuma rede.
- **Dependências:** T-02, T-03, T-10.
- **Arquivos prováveis:** `src/lib/aggregateWeather.ts`.
- **Tipo:** Data.
- **Prioridade / tamanho:** P1 / M.
- **Requisitos:** FR-05, FR-07.

### T-12 — Materializar catálogo de imagens aprovado

- **Descrição:** Importar o lote aprovado e associar condições aos metadados.
- **Critérios de aceite:** Imagens locais têm origem/autor/licença/crédito/alt aprovados; códigos WMO resolvem imagem correspondente; código desconhecido tem fallback; exceção de quantidade aplica-se somente aos binários de T-04; conteúdo sem permissão não é importado.
- **Dependências:** T-01, T-04.
- **Arquivos prováveis:** `src/data/weatherAssets.ts`, `src/assets/weather/` (lote binário aprovado).
- **Tipo:** Data.
- **Prioridade / tamanho:** P1 / M.
- **Requisitos:** FR-06, NFR-03, NFR-06.

## Entrega 3: Serviços

### T-13 — Isolar geocoding brasileiro

- **Descrição:** Mapear pesquisa para candidatos de domínio sem seleção automática.
- **Critérios de aceite:** Request usa `countryCode=BR`/`language=pt`; resposta valida país/coordenadas/UF; preserva homônimos com contexto; ausência válida retorna `[]`; HTTP/JSON inválidos, rede e timeout são distinguíveis; aceita cancelamento e timeout configurável de 10 segundos, sem retry automático.
- **Dependências:** T-01, T-02, T-06.
- **Arquivos prováveis:** `src/services/geocodingService.ts`.
- **Tipo:** Data.
- **Prioridade / tamanho:** P0 / M.
- **Requisitos:** FR-01, FR-02, FR-04, NFR-07.

### T-14 — Isolar consulta ViaCEP

- **Descrição:** Resolver CEP para município/UF, sem geocoding embutido.
- **Critérios de aceite:** Consulta somente oito dígitos válidos; `erro: true` retorna não encontrado; valida município/UF; distingue HTTP/JSON inválidos, rede e timeout de 10 segundos; aceita cancelamento; não registra/persiste CEP nem escolhe coordenadas.
- **Dependências:** T-01, T-06, T-07.
- **Arquivos prováveis:** `src/services/cepService.ts`.
- **Tipo:** Data.
- **Prioridade / tamanho:** P1 / M.
- **Requisitos:** FR-03, NFR-04, NFR-07.

### T-15 — Mapear Forecast para clima e cinco dias

- **Descrição:** Adequar serviço aos campos/fuso do plano.
- **Critérios de aceite:** Request usa cinco dias, fuso IANA recebido do dispositivo, Celsius, km/h e variáveis current/hourly/daily documentadas; 14:15 usa probabilidade de 14:00 da mesma data; ausência/número inválido/% fora de faixa vira `null`; séries menores/desalinhadas são parciais; estrutura inutilizável falha; aceita cancelamento, timeout de 10 segundos e erros tipados.
- **Dependências:** T-01, T-02, T-09.
- **Arquivos prováveis:** `src/services/weatherService.ts`.
- **Tipo:** Data.
- **Prioridade / tamanho:** P0 / M.
- **Requisitos:** FR-05, FR-07, FR-08, NFR-07.

## Entrega 4: Orquestração por aba

### T-16 — Separar busca de cidade e consulta após seleção

- **Descrição:** Evoluir hook para estados independentes de busca/clima.
- **Critérios de aceite:** Idle sem cidade automática; pesquisa só geocodifica; confirmação explícita chama Forecast e oculta relatório anterior; estados idle/loading/success/empty/error/partial seguem o plano; resposta antiga não sobrescreve seleção atual; retry manual por cidade repete a última operação válida; erro não usa fixture como fallback; sem store global ou persistência.
- **Dependências:** T-13, T-15.
- **Arquivos prováveis:** `src/hooks/useWeather.ts`.
- **Tipo:** Data.
- **Prioridade / tamanho:** P0 / M.
- **Requisitos:** FR-01, FR-04, FR-05, FR-07, FR-09, NFR-05, NFR-07.

### T-17 — Orquestrar resolução de CEP

- **Descrição:** Encadear ViaCEP/geocoding mantendo confirmação explícita.
- **Critérios de aceite:** Inválido não faz rede; geocoding é filtrado pelo município/UF resolvidos; sem correspondência vira vazio; candidato único também exige confirmação; não consulta clima de outra UF nem persiste CEP.
- **Dependências:** T-14, T-16.
- **Arquivos prováveis:** `src/hooks/useWeather.ts`.
- **Tipo:** Data.
- **Prioridade / tamanho:** P1 / P.
- **Requisitos:** FR-03, FR-04, NFR-04.

### T-18 — Orquestrar UF com cidade opcional

- **Descrição:** Integrar cidade na UF ou coleta estadual aprovada.
- **Critérios de aceite:** Cidade confirmada usa suas coordenadas; UF sem cidade coleta apenas T-10 e agrega por T-11; relatório é marcado agregado; insuficiência segue aprovação; não usa capital/dado antigo como substituto; respeita concorrência definida em T-03.
- **Dependências:** T-10, T-11, T-16.
- **Arquivos prováveis:** `src/hooks/useWeather.ts`.
- **Tipo:** Data.
- **Prioridade / tamanho:** P1 / M.
- **Requisitos:** FR-02, FR-05, FR-07, FR-09.

### T-19 — Consolidar cancelamento e retry multfluxo

- **Descrição:** Fechar ciclo de operações para cidade, CEP e UF.
- **Critérios de aceite:** Nova confirmação oculta relatório antigo e inicia loading; respostas obsoletas não sobrescrevem seleção; desmontagem cancela trabalho; cancelamento voluntário não mostra erro, timeout mostra; retry manual repete última operação válida; duas instâncias são independentes.
- **Dependências:** T-16, T-17, T-18.
- **Arquivos prováveis:** `src/hooks/useWeather.ts`.
- **Tipo:** Data.
- **Prioridade / tamanho:** P1 / M.
- **Requisitos:** FR-04, FR-09, NFR-05, NFR-07.

## Entrega 5: Componentes de apresentação

### T-20 — Adaptar formulário de cidade e CEP

- **Descrição:** Manter busca por callbacks, sem serviços.
- **Critérios de aceite:** Modos têm controles semânticos/labels; vazio não envia; CEP parcial não é reformatado; blur/submit de oito dígitos válidos formata `00000-000`; inválido anuncia validação; loading desabilita envio; Enter funciona e foco é visível.
- **Dependências:** T-07.
- **Arquivos prováveis:** `src/components/SearchBar.tsx`.
- **Tipo:** UI.
- **Prioridade / tamanho:** P0 / M.
- **Requisitos:** FR-01, FR-03, NFR-06, NFR-08.

### T-21 — Apresentar candidatos selecionáveis

- **Descrição:** Renderizar cidade/UF e confirmação por mouse/teclado.
- **Critérios de aceite:** Candidato mostra nome e UF; nenhum é escolhido sozinho; callback recebe exatamente a alternativa acionada; IDs/labels não colidem entre instâncias; sem fetch.
- **Dependências:** T-01, T-02.
- **Arquivos prováveis:** `src/components/RegionResults.tsx`.
- **Tipo:** UI.
- **Prioridade / tamanho:** P0 / P.
- **Requisitos:** FR-01, FR-04, NFR-06.

### T-22 — Implementar seletor pesquisável de UF

- **Descrição:** Localizar UF e escolher cidade ou seguir sem cidade.
- **Critérios de aceite:** Caixa contém 27 UFs; sigla/nome encontram a mesma opção; ações cidade/agregado são distintas; só emite callbacks; opera por teclado sem overflow mobile.
- **Dependências:** T-06, T-21.
- **Arquivos prováveis:** `src/components/StateSelector.tsx`.
- **Tipo:** UI.
- **Prioridade / tamanho:** P1 / M.
- **Requisitos:** FR-02, FR-04, FR-05, NFR-01, NFR-06.

### T-23 — Atualizar painel de clima atual

- **Descrição:** Consumir campos novos e mostrar quatro métricas da spec.
- **Critérios de aceite:** Temperatura, vento, umidade e chance de chuva têm nomes/unidades; remove pressão/mm da UI final; ausência é indisponível; cidade/UF/agregado são identificados; C/F deriva de props; não busca dados.
- **Dependências:** T-02, T-08, T-09.
- **Arquivos prováveis:** `src/components/CurrentWeather.tsx`.
- **Tipo:** UI.
- **Prioridade / tamanho:** P0 / P.
- **Requisitos:** FR-05, FR-08, NFR-08.

### T-24 — Atualizar card diário

- **Descrição:** Apresentar métricas diárias e datas sem ambiguidade.
- **Critérios de aceite:** Mostra mínima/máxima, vento máximo, umidade média e chance máxima de chuva; unidades/condição têm nomes acessíveis; datas usam T-09; `null` não vira zero; temperaturas seguem unidade recebida.
- **Dependências:** T-02, T-08, T-09.
- **Arquivos prováveis:** `src/components/ForecastCard.tsx`.
- **Tipo:** UI.
- **Prioridade / tamanho:** P0 / P.
- **Requisitos:** FR-07, FR-08, NFR-06, NFR-08.

### T-25 — Organizar grid de previsão e unidade

- **Descrição:** Manter lista/toggle independentes de rede.
- **Critérios de aceite:** Completo renderiza hoje + quatro datas consecutivas; grid 2/3/5 colunas; parcial não inventa dias e recebe identificação de incompletude; toggle expõe unidade pressionada, opera por teclado e só emite mudança; nenhuma consulta por unidade.
- **Dependências:** T-24.
- **Arquivos prováveis:** `src/components/ForecastList.tsx`, `src/components/UnitToggle.tsx`.
- **Tipo:** UI.
- **Prioridade / tamanho:** P0 / P.
- **Requisitos:** FR-07, FR-08, NFR-01, NFR-06.

### T-26 — Consolidar loading e vazio

- **Descrição:** Reutilizar estados para busca e clima.
- **Critérios de aceite:** Loading tem status acessível; vazio informa ausência, não falha; textos pt-BR são parametrizáveis; estados não mostram dado antigo como atual; renderização sem rede.
- **Dependências:** Nenhuma.
- **Arquivos prováveis:** `src/components/states/LoadingState.tsx`, `src/components/states/EmptyState.tsx`.
- **Tipo:** UI.
- **Prioridade / tamanho:** P0 / P.
- **Requisitos:** NFR-06, NFR-07, NFR-08.

### T-27 — Consolidar erro e aviso parcial

- **Descrição:** Distinguir falha total de dados utilizáveis incompletos.
- **Critérios de aceite:** Erro tem anúncio/retry por callback; aviso parcial não afirma completude e acompanha apenas dados válidos; não expõe JSON/dados pessoais; controles operam por teclado.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/components/states/ErrorState.tsx`, `src/components/states/PartialState.tsx`.
- **Tipo:** UI.
- **Prioridade / tamanho:** P0 / P.
- **Requisitos:** NFR-06, NFR-07, NFR-08.

### T-28 — Renderizar atribuição de imagem

- **Descrição:** Criar apresentação reutilizável de créditos/origem/licença.
- **Critérios de aceite:** Recebe metadados de domínio; exibe crédito/links conforme aprovação; links acessíveis e seguros em nova aba; não omite autor/licença exigidos nem chama API.
- **Dependências:** T-12.
- **Arquivos prováveis:** `src/components/WeatherAttribution.tsx`.
- **Tipo:** UI.
- **Prioridade / tamanho:** P1 / P.
- **Requisitos:** FR-06, NFR-03, NFR-06.

### T-29 — Associar imagens aos painéis

- **Descrição:** Conectar catálogo/atribuição ao clima atual e diário.
- **Critérios de aceite:** Condição e imagem correspondem ao catálogo; alt pt-BR/créditos aparecem no atual e em cada dia; fallback não quebra layout nem sugere imagem inexistente; emoji sozinho não satisfaz esta tarefa.
- **Dependências:** T-12, T-23, T-24, T-28.
- **Arquivos prováveis:** `src/components/CurrentWeather.tsx`, `src/components/ForecastCard.tsx`.
- **Tipo:** UI.
- **Prioridade / tamanho:** P1 / P.
- **Requisitos:** FR-06, NFR-03, NFR-06.

## Entrega 6: Integração em fatias visíveis

### T-30 — Integrar preview estático mobile-first

- **Descrição:** Reunir marca, busca, unidade, hero e previsão com fixtures.
- **Critérios de aceite:** Identifica dados ilustrativos/datas; quatro métricas e cinco dias pertencem à fixture; unidade muda todas as temperaturas; busca sem fixture apresenta vazio sem atribuir dados de outra cidade; preserva dark glassmorphism/foco/grid; nenhuma API chamada; preview não conta como fluxo real aprovado.
- **Dependências:** T-02, T-08, T-09, T-20, T-21, T-23, T-25, T-26, T-27.
- **Arquivos prováveis:** `src/App.tsx`, `src/data/mockWeather.ts`.
- **Tipo:** UI.
- **Prioridade / tamanho:** P0 / M.
- **Requisitos:** FR-05, FR-07, FR-08, NFR-01, NFR-06, NFR-08 (apresentação com mocks).

### T-31 — Conectar fluxo real por cidade

- **Descrição:** Substituir caminho mock por busca, seleção e clima.
- **Critérios de aceite:** Abre sem cidade automática; busca → candidatos → confirmação → Forecast é obrigatório mesmo com um candidato; estados têm contexto correto; Celsius inicial; toggle não consulta; sem login/fallback mock; digitação não renomeia dados antigos.
- **Dependências:** T-16, T-20, T-21, T-23, T-25, T-26, T-27, T-30.
- **Arquivos prováveis:** `src/App.tsx`.
- **Tipo:** UI.
- **Prioridade / tamanho:** P0 / M.
- **Requisitos:** FR-01, FR-04, FR-05, FR-07, FR-08, FR-09, NFR-02, NFR-07.

### T-32 — Conectar CEP na aplicação

- **Descrição:** Ligar modo CEP à resolução e confirmação já orquestradas.
- **Critérios de aceite:** Usa T-17, exige confirmação, apresenta validação/loading/erro/vazio; não mostra relatório de outra seleção nem faz fetch na UI; CEP funciona sem depender da aprovação estadual.
- **Dependências:** T-17, T-20, T-21, T-31.
- **Arquivos prováveis:** `src/App.tsx`.
- **Tipo:** UI.
- **Prioridade / tamanho:** P1 / P.
- **Requisitos:** FR-03, FR-04, FR-09, NFR-04, NFR-07.

### T-33 — Conectar UF na aplicação

- **Descrição:** Ligar seletor ao ramo cidade/agregado e estados multfluxo.
- **Critérios de aceite:** UF permite cidade ou agregado aprovado; atual/previsão identificam seleção; loading/erro/vazio/parcial/retry seguem operação atual; não mostra dados anteriores sob nova região; nenhuma geolocalização automática ou rede na UI.
- **Dependências:** T-18, T-19, T-22, T-31.
- **Arquivos prováveis:** `src/App.tsx`.
- **Tipo:** UI.
- **Prioridade / tamanho:** P1 / P.
- **Requisitos:** FR-02, FR-04, FR-05, FR-09, NFR-04, NFR-07.

## Entrega 7: Testes de regressão explícitos

### T-34 — Testar conversão de unidade

- **Descrição:** Cobrir funções de temperatura com Vitest.
- **Critérios de aceite:** 0/100/-40 °C, fracionários, negativos, arredondamento na exibição e `null` passam; entrada não muda; sem rede.
- **Dependências:** T-08.
- **Arquivos prováveis:** `tests/unit/temperature.test.ts`.
- **Tipo:** Test.
- **Prioridade / tamanho:** P0 / P.
- **Requisitos:** FR-08.

### T-35 — Testar datas e formatação

- **Descrição:** Verificar data civil, hoje do dispositivo e métricas ausentes.
- **Critérios de aceite:** Relógio fixo cobre virada de dia/mês, fusos distintos, km/h, %, unidade e indisponível; parse UTC não muda data; não depende do dia real da execução.
- **Dependências:** T-09.
- **Arquivos prováveis:** `tests/unit/format.test.ts`.
- **Tipo:** Test.
- **Prioridade / tamanho:** P0 / P.
- **Requisitos:** FR-05, FR-07, FR-08, NFR-08.

### T-36 — Testar CEP e catálogo de UFs

- **Descrição:** Cobrir contratos puros de entrada brasileira.
- **Critérios de aceite:** CEP com/sem hífen, parcial, letras/comprimentos inválidos têm resultado esperado; 27 UFs únicas; caixa/acentos variados encontram a mesma UF; desconhecido não seleciona.
- **Dependências:** T-06, T-07.
- **Arquivos prováveis:** `tests/unit/postalCode.test.ts`, `tests/unit/brazilStates.test.ts`.
- **Tipo:** Test.
- **Prioridade / tamanho:** P1 / P.
- **Requisitos:** FR-02, FR-03.

### T-37 — Testar geocoding e ViaCEP com fetch mockado

- **Descrição:** Validar contratos externos sem rede real.
- **Critérios de aceite:** Verifica parâmetros, sucesso, vazio/não encontrado, país/UF/coordenadas inválidos, homônimos, HTTP 429/5xx, JSON inválido, rede, timeout e aborto; fetch é restaurado; CEP inválido não chama; timers falsos comprovam timeout.
- **Dependências:** T-13, T-14.
- **Arquivos prováveis:** `tests/unit/geocodingService.test.ts`, `tests/unit/cepService.test.ts`.
- **Tipo:** Test.
- **Prioridade / tamanho:** P1 / M.
- **Requisitos:** FR-01, FR-02, FR-03, FR-04, NFR-07.

### T-38 — Testar Forecast com fetch mockado

- **Descrição:** Cobrir request, mapeamento e qualidade de séries.
- **Critérios de aceite:** Verifica cinco dias/Celsius/km/h/fuso; 14:15 associa-se a 14:00 da mesma data, hora ausente vira `null`; ausência/inválido não vira zero; parcial e inutilizável têm saídas distintas; HTTP/JSON/rede/timeout/aborto cobertos; sem rede real.
- **Dependências:** T-15.
- **Arquivos prováveis:** `tests/unit/weatherService.test.ts`.
- **Tipo:** Test.
- **Prioridade / tamanho:** P0 / M.
- **Requisitos:** FR-05, FR-07, FR-08, NFR-07.

### T-39 — Testar agregação e licenças de assets

- **Descrição:** Verificar resultados/catálogos aprovados sem serviços.
- **Critérios de aceite:** Cobre fórmulas/empates/datas/ausências/cobertura mínima/ausência total conforme T-03; asset sem autor/origem/licença/crédito/alt obrigatório é detectado; códigos desconhecidos têm fallback; arquivos referenciados existem.
- **Dependências:** T-11, T-12.
- **Arquivos prováveis:** `tests/unit/aggregateWeather.test.ts`, `tests/unit/weatherAssets.test.ts`.
- **Tipo:** Test.
- **Prioridade / tamanho:** P1 / M.
- **Requisitos:** FR-05, FR-06, FR-07, NFR-03.

### T-40 — Testar estados e concorrência do hook

- **Descrição:** Exercitar orquestração com serviços mockados/respostas controladas.
- **Critérios de aceite:** Idle e pesquisa não consultam clima; confirmação consulta alternativa correta; cidade/CEP/UF percorrem estados previstos; respostas antigas/cancelamentos não sobrescrevem seleção; retry usa última operação válida; duas instâncias não compartilham seleção; sem rede real.
- **Dependências:** T-19.
- **Arquivos prováveis:** `tests/unit/useWeather.test.ts`.
- **Tipo:** Test.
- **Prioridade / tamanho:** P1 / M.
- **Requisitos:** FR-01, FR-02, FR-03, FR-04, FR-09, NFR-05, NFR-07.

### T-41 — Testar busca e seleção explícita

- **Descrição:** Cobrir formulário/candidatos com queries acessíveis.
- **Critérios de aceite:** Vazio não envia; Enter envia; loading desabilita; CEP só formata em blur/submit; homônimos têm UF e acionam exatamente seu callback; candidato único não se confirma sozinho; controles têm labels.
- **Dependências:** T-20, T-21.
- **Arquivos prováveis:** `tests/unit/SearchBar.test.tsx`, `tests/unit/RegionResults.test.tsx`.
- **Tipo:** Test.
- **Prioridade / tamanho:** P0 / P.
- **Requisitos:** FR-01, FR-03, FR-04, NFR-06.

### T-42 — Testar seletor de UF

- **Descrição:** Cobrir pesquisa/ações cidade/agregado por teclado.
- **Critérios de aceite:** Há 27 opções únicas; nome/sigla selecionam a mesma UF; callbacks cidade/agregado são distintos; sem cidade automática ou chamada direta à rede.
- **Dependências:** T-22.
- **Arquivos prováveis:** `tests/unit/StateSelector.test.tsx`.
- **Tipo:** Test.
- **Prioridade / tamanho:** P1 / P.
- **Requisitos:** FR-02, FR-04, FR-05, NFR-06.

### T-43 — Testar painéis, imagens e valores ausentes

- **Descrição:** Cobrir clima atual e um dia com fixtures.
- **Critérios de aceite:** Ambos têm temperatura/vento/umidade/chuva; `null` é indisponível; mínima/máxima seguem unidade; imagens têm alt/condição/crédito corretos; agregado é identificado; pressão/mm não substituem métricas.
- **Dependências:** T-23, T-24, T-29.
- **Arquivos prováveis:** `tests/unit/CurrentWeather.test.tsx`, `tests/unit/ForecastCard.test.tsx`.
- **Tipo:** Test.
- **Prioridade / tamanho:** P1 / P.
- **Requisitos:** FR-05, FR-06, FR-07, FR-08, NFR-03, NFR-06.

### T-44 — Testar estados de componentes e integração do App

- **Descrição:** Reaproveitar testes do App para fixtures dos estados/fluxo integrado.
- **Critérios de aceite:** Loading/erro com retry/vazio/sucesso/parcial têm mensagens/roles esperados; sucesso tem cinco dias; Celsius inicial; toggle converte atual/previsão sem nova chamada aos serviços; erro/vazio não mostram resultado antigo; interface pt-BR; sem API real.
- **Dependências:** T-25, T-26, T-27, T-31, T-32, T-33.
- **Arquivos prováveis:** `tests/unit/App.test.tsx`, `tests/unit/UnitToggle.test.tsx`.
- **Tipo:** Test.
- **Prioridade / tamanho:** P1 / M.
- **Requisitos:** FR-04, FR-07, FR-08, FR-09, NFR-02, NFR-06, NFR-07, NFR-08.

### T-45 — Validar E2E principal por cidade

- **Descrição:** Exercitar busca → confirmação → clima → cinco dias → unidade.
- **Critérios de aceite:** Rotas Open-Meteo são interceptadas; antes de confirmar há zero requests Forecast; homônimos selecionam cidade correta; cinco datas/quatro métricas visíveis; toggle não aumenta requests; falha/vazio/retry têm cenário determinístico; nenhuma API real necessária.
- **Dependências:** T-31, T-38, T-41.
- **Arquivos prováveis:** `tests/e2e/weather.spec.ts`.
- **Tipo:** Test.
- **Prioridade / tamanho:** P0 / M.
- **Requisitos:** FR-01, FR-04, FR-05, FR-07, FR-08, FR-09, NFR-07.

### T-46 — Validar E2E de CEP e UF

- **Descrição:** Acrescentar fluxos brasileiros restantes com rede interceptada.
- **Critérios de aceite:** CEP inválido não consulta, válido exige confirmação; UF permite cidade/agregado identificado e cobertura aprovada; falha/parcial não mostra dado de outra seleção; rotas ViaCEP/Open-Meteo são mockadas.
- **Dependências:** T-32, T-33, T-37, T-39, T-40, T-42, T-45.
- **Arquivos prováveis:** `tests/e2e/weather.spec.ts`.
- **Tipo:** Test.
- **Prioridade / tamanho:** P1 / M.
- **Requisitos:** FR-02, FR-03, FR-04, FR-05, FR-07, FR-09, NFR-07.

### T-47 — Validar viewport mobile e desktop

- **Descrição:** Verificar fluxo principal/layout nos tamanhos previstos.
- **Critérios de aceite:** Configuração registra largura/altura CSS, escala e navegador da referência Moto G56; desktop/mobile executam busca/seleção/toggle; capturas verificam 2/3/5 colunas, textos/controles sem corte e ausência de overflow; sem aparelho real, registrar evidência de emulação, não teste físico.
- **Dependências:** T-45.
- **Arquivos prováveis:** `playwright.config.ts`, `tests/e2e/weather.spec.ts`.
- **Tipo:** Test.
- **Prioridade / tamanho:** P0 / M.
- **Requisitos:** NFR-01, NFR-06, US-06.

### T-48 — Validar isolamento entre abas e troca rápida

- **Descrição:** Exercitar concorrência no navegador além do hook.
- **Critérios de aceite:** Abas selecionam cidades diferentes sem interferência; resposta atrasada não substitui seleção atual; nova confirmação oculta relatório antigo; sem sincronização por storage/BroadcastChannel; cenário usa rede interceptada.
- **Dependências:** T-19, T-45.
- **Arquivos prováveis:** `tests/e2e/weather.spec.ts`.
- **Tipo:** Test.
- **Prioridade / tamanho:** P1 / P.
- **Requisitos:** FR-04, FR-09, NFR-05.

## Entrega 8: Consolidação e hardening

### T-49 — Encerrar compatibilidade temporária dos contratos

- **Descrição:** Remover legados somente depois da migração dos consumidores.
- **Critérios de aceite:** Tipos finais correspondem ao Data Model; sem aliases legados, opcionais apenas por migração ou modelos duplicados; consumidores/testes usam campos novos sem valores fictícios; build/lint/test passam; consumidor pendente reabre sua tarefa antes da remoção, sem ampliar esta tarefa.
- **Dependências:** T-02, T-13, T-14, T-15, T-19, T-29, T-32, T-33, T-34, T-35, T-36, T-37, T-38, T-39, T-40, T-41, T-42, T-43, T-44.
- **Arquivos prováveis:** `src/types/weather.ts`, `src/data/mockWeather.ts`.
- **Tipo:** Data.
- **Prioridade / tamanho:** P1 / M.
- **Requisitos:** FR-04, FR-05, FR-07, FR-08.

### T-50 — Documentar privacidade e limites da consulta

- **Descrição:** Registrar provedores e envio de CEP sem rastreamento.
- **Critérios de aceite:** README informa envio de CEP ao ViaCEP e coordenadas ao Open-Meteo sem persistência/histórico; descreve rede/CORS/licenças; confirma sem login/geolocalização automática; checagem no navegador confirma que abrir o app não chama geolocalização.
- **Dependências:** T-14, T-31, T-32, T-33.
- **Arquivos prováveis:** `README.md`.
- **Tipo:** Infra.
- **Prioridade / tamanho:** P1 / P.
- **Requisitos:** NFR-02, NFR-03, NFR-04.

### T-51 — Preparar execução reproduzível do Playwright

- **Descrição:** Documentar navegadores/dependências no ambiente local/CI.
- **Critérios de aceite:** README registra `pnpm exec playwright install` e provisionamento de dependências de sistema; configuração não mascara falhas; falta de bibliotecas é bloqueio, não aprovação; comandos privilegiados são executados pela pessoa responsável quando necessário.
- **Dependências:** T-45.
- **Arquivos prováveis:** `README.md`, `playwright.config.ts`.
- **Tipo:** Infra.
- **Prioridade / tamanho:** P0 / P.
- **Requisitos:** NFR-01, NFR-07 (evidência de validação).

### T-52 — Medir desempenho contra meta aprovada

- **Descrição:** Medir operações acordadas, sem usar mocks como latência externa.
- **Critérios de aceite:** Relatório identifica ambiente/rede/amostra e compara medidas ao limite T-05; teste externo é separado dos E2E determinísticos; sem CEP pessoal nos registros; impossibilidade ou resultado fora da meta fica pendente, sem inventar conformidade.
- **Dependências:** T-05, T-31, T-32, T-33, T-51.
- **Arquivos prováveis:** `README.md`.
- **Tipo:** Test.
- **Prioridade / tamanho:** P1 / P.
- **Requisitos:** NFR-07; pergunta aberta de desempenho.

### T-53 — Executar gates e consolidar checklist de aceite

- **Descrição:** Consolidar evidências, sem misturar execução com correções de produto.
- **Critérios de aceite:** `pnpm lint`, `pnpm build`, `pnpm test`, `pnpm test:e2e` passam no ambiente provisionado; README registra resultados/limitações e cada FR/NFR tem evidência ou impedimento; falha reabre tarefa responsável e exige nova execução; mock não comprova API, emulação não comprova aparelho; não declarar pronto com requisito obrigatório/aprovação pendente.
- **Dependências:** T-29, T-44, T-46, T-47, T-48, T-49, T-50, T-51, T-52.
- **Arquivos prováveis:** `README.md`.
- **Tipo:** Infra.
- **Prioridade / tamanho:** P2 / P.
- **Requisitos:** FR-01 a FR-09, NFR-01 a NFR-08.

## Rastreabilidade — P5.6

Testes/aceite complementam implementação, não a substituem.

| Requisito funcional | Implementação | Testes e aceite |
| --- | --- | --- |
| FR-01 — Cidade brasileira | T-06, T-13, T-16, T-20, T-21, T-31 | T-37, T-40, T-41, T-45 |
| FR-02 — UF por sigla/nome | T-06, T-13, T-18, T-22, T-33 | T-36, T-37, T-40, T-42, T-46 |
| FR-03 — CEP e formatação | T-01, T-07, T-14, T-17, T-20, T-32 | T-36, T-37, T-40, T-41, T-46 |
| FR-04 — Seleção explícita/homônimos | T-01, T-02, T-13, T-16, T-17, T-19, T-21, T-31, T-32, T-33 | T-37, T-40, T-41, T-45, T-46, T-48 |
| FR-05 — Atual e agregado estadual | T-02, T-03, T-09, T-10, T-11, T-15, T-16, T-18, T-23, T-31, T-33 | T-35, T-38, T-39, T-42, T-43, T-45, T-46 |
| FR-06 — Imagens Creative Commons | T-01, T-04, T-12, T-28, T-29 | T-39, T-43 |
| FR-07 — Hoje + quatro dias/quatro métricas | T-02, T-03, T-09, T-11, T-15, T-18, T-24, T-25, T-31 | T-35, T-38, T-39, T-43, T-44, T-45, T-46 |
| FR-08 — Celsius/Fahrenheit | T-02, T-08, T-23, T-24, T-25, T-31 | T-34, T-35, T-38, T-43, T-44, T-45 |
| FR-09 — Atualizar região | T-16, T-18, T-19, T-31, T-32, T-33 | T-40, T-44, T-45, T-46, T-48 |

**Lacunas funcionais:** nenhum FR sem tarefa. FR-05/FR-07 no caso estadual dependem da aprovação T-03; FR-06 depende de T-04. Cobertura no backlog não significa entrega concluída.

| Requisito não funcional | Tarefas principais |
| --- | --- |
| NFR-01 — Responsividade | T-22, T-25, T-30, T-47, T-51 |
| NFR-02 — Sem conta | T-31, T-44, T-50 |
| NFR-03 — Licenças | T-01, T-04, T-12, T-28, T-29, T-39, T-43, T-50 |
| NFR-04 — Privacidade/consentimento | T-14, T-17, T-32, T-33, T-50 |
| NFR-05 — Isolamento por aba | T-16, T-19, T-40, T-48 |
| NFR-06 — Acessibilidade | T-20, T-21, T-22, T-24, T-25, T-26, T-27, T-28, T-29, T-41, T-42, T-43, T-44, T-47 |
| NFR-07 — Estados e falhas | T-01, T-13, T-14, T-15, T-16, T-19, T-26, T-27, T-31, T-32, T-33, T-37, T-38, T-40, T-44, T-45, T-46 |
| NFR-08 — pt-BR | T-09, T-20, T-23, T-24, T-26, T-27, T-30, T-35, T-44 |

T-53 consolida toda a cobertura. T-05/T-52 resolvem desempenho, sem criar um NFR quantitativo antes da aprovação.

## Sequência de fatias verticais — P5.7

As entregas organizam camadas; esta sequência antecipa algo visível usando tarefas independentes. Executar dependências transitivas e validações focadas antes de considerar uma fatia pronta.

| Fatia | Tarefas alvo e pré-requisitos | Resultado observável e limite |
| --- | --- | --- |
| A — UI estática | T-01, T-02, T-07, T-08, T-09, T-20, T-21, T-23, T-24, T-25, T-26, T-27, T-30; T-34/T-35/T-41 | Header, quatro métricas, cinco dias e unidade com fixtures; não prova rede, imagens finais ou agregação. |
| B — Cidade real | T-06, T-13, T-15, T-16, T-31; T-38/T-45/T-47/T-51 | Busca brasileira, confirmação e previsão real; testes de serviço/hook são acrescentados incrementalmente nas tarefas T-37/T-40, sem declará-las completas antes dos demais modos. |
| C — CEP | T-14, T-17, T-32; T-36/T-37/T-41 e cenário CEP de T-46 | CEP com confirmação; cenário CEP de T-46 pode ser validado cedo, mas a tarefa completa espera UF. |
| D — UF | Aprovação T-03; T-10, T-11, T-18, T-19, T-22, T-33; T-39/T-40/T-42/T-46/T-48 | UF por nome/sigla, cidade opcional ou agregado identificado; bloqueio estadual não impede B/C. |
| E — Imagens | Aprovação T-04; T-12, T-28, T-29; T-39/T-43 | Imagens/créditos aprovados; pode ocorrer em paralelo a B–D após os painéis existirem. |
| F — Aceite completo | T-44, T-49, T-50, T-51; aprovação T-05, T-52 e T-53 | Contratos finais e evidências de qualidade, privacidade, desempenho e limitações. |

Uma tarefa multfluxo só é concluída quando todos os seus critérios passarem. A aprovação T-05 não bloqueia os E2E funcionais/mobile; bloqueia somente a medição quantitativa e o aceite completo.

## Prompt de delegação da T-01 — P5.8

O bloco abaixo é a saída para o próximo módulo. Não executar implementação durante a geração deste backlog.

```text
Implemente somente T-01 — Introduzir contratos auxiliares de seleção e falhas.

Contexto
Weather App client-side: TypeScript strict, React 19/Vite, Tailwind,
Vitest/Testing Library, Playwright, pnpm e Biome.
Fonte da verdade: specs/weather-app-spec.md.
Plano: plans/weather-app-plan.md, Data Model e Error Handling.
Tarefa: tasks/weather-app-tasks.md, T-01. Não há dependências.

Objetivo e arquivo permitido
Adicionar contratos auxiliares apenas em src/types/weather.ts.
Preservar City, CurrentWeather, ForecastDay e WeatherData já utilizados.
Unit já existe e continua exatamente 'celsius' | 'fahrenheit'.
Não integrar API, alterar componentes, instalar pacotes ou decidir agregação.

Contratos necessários
- RegionSelection: união por kind; 'city' exige city: City; 'state' exige
	stateCode e stateName e representa UF sem cidade escolhida.
- PostalCodeLookup: união discriminada encontrado/não encontrado; encontrado
	exige CEP normalizado, município e UF; bairro/logradouro são opcionais.
	Não confundir não encontrado com falha de rede.
- WeatherAsset: caminho local, autor, URL de origem, identificador e URL de
	licença Creative Commons, crédito e alt em pt-BR obrigatórios. Não adicionar
	imagens reais: a aprovação pertence à T-04.
- Erro de domínio: código, mensagem e indicação de retry. Distinguir entrada
	inválida, rede, timeout, provedor, dados incompletos e agregado indisponível.
	Homônimos são candidatos aguardando seleção, não erro de rede.

Critérios de aceite
1. TypeScript rejeita seleção incompleta de cidade ou UF.
2. CEP encontrado/não encontrado é representável sem valores inventados.
3. Asset sem origem, autor, licença, crédito ou alt não satisfaz o contrato.
4. Erros diferenciam as categorias; ausência não significa zero e capital
	 não representa automaticamente uma UF.
5. Exports atuais continuam compatíveis; consumidores compilam sem alteração;
	 Unit não é duplicado/renomeado.
6. Sem rede, persistência, UI ou valores reais de assets.

Procedimento e validação
Leia AGENTS.md, .github/copilot-instructions.md e instruções aplicáveis a
src/**/*.ts. Examine os tipos atuais e consumidores antes de editar.
Use interfaces/unions pequenas, sem any/frameworks novos. Identificadores
em inglês; documentação necessária em pt-BR.
Verifique exemplos válidos/inválidos em uma checagem de tipos sem deixar
arquivos temporários. Não criar teste de runtime para tipos apagados na
compilação. Execute pnpm lint, pnpm build e pnpm test; registre resultados
e bloqueios preexistentes sem mascará-los.
Se exigir editar outro arquivo, proponha decomposição antes de ampliar escopo.
Informe contratos adicionados, arquivo alterado e validação.
Não faça commit e não implemente T-02 nem aprovações T-03/T-04/T-05.
```