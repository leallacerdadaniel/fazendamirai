# Integrações: offline, satélite, clima, preços e campo (pesquisa de 10/11/2026)

Feita por um agente de pesquisa para a onda de planejamento. Preços e licenças das
páginas públicas em 10/11/2026; reconferir na hora de contratar.

## 1. Offline primeiro com Supabase (decide a onda 9)

| Opção | Maturidade 2026 | Expo | Conflito | RLS | Custo | Web |
|---|---|---|---|---|---|---|
| **PowerSync** | Alta (SDK RN 1.35.11, 09/11/2026) | Sim, com dev build (op-sqlite); Expo Go só com adaptador JS em alfa | Servidor decide; padrão "última gravação vence", customizável | Leitura por Sync Streams espelhando as políticas; escrita pelo supabase-js, com RLS | Cloud Free (pausa), Pro a partir de US$ 49/mês, Team US$ 599/mês; Open Edition auto-hospedada grátis (FSL) | Sim (`@powersync/web`) |
| ElectricSQL | Em transição (comprada pela Databricks em 08/2026; Electric Cloud sendo desligado) | Via TanStack DB com expo-sqlite | Só leitura; escrita por nossa conta | Proxy de autorização próprio | Apache 2.0 | Sim |
| WatermelonDB | Parada (0.28.0, 04/2025) | Plugin comunitário; falhas na New Architecture | Push/pull nosso | RPC sob RLS | Grátis | Parcial |
| RxDB | Ativo (17.6.0) | Sim, SQLite em RN é pago | Do RxDB | supabase-js | Pro a partir de US$ 99/mês | Sim |
| Legend-State | v3 em beta | Sim, guia do Supabase | Não confirmado | supabase-js | Grátis | Sim |
| TinyBase | Ativo (10.0.1) | Sim, até Expo Go | CRDT com servidor WebSocket próprio | supabase-js | Grátis | Sim |
| Fila + SQLite à mão | Nossa | expo-sqlite | Nossa | Natural | Esforço | Não |

**Escolha: PowerSync.** Única integração oficial e madura com Supabase; mesmo SQLite no app e no painel; RLS continua na escrita; Sync Streams filtram por fazenda a partir do JWT; Open Edition evita prisão ao fornecedor. Cuidados: testar o tratamento de gravação recusada pelo RLS no `uploadData` (não documentado); exige replicação lógica no Postgres.

Fontes: https://powersync.com/pricing, https://docs.powersync.com/integrations/supabase/rls-and-sync-streams, https://docs.powersync.com/handling-writes/custom-conflict-resolution, https://docs.powersync.com/client-sdks/frameworks/expo-go-support, https://electric.ax/blog/2026/08/11/electric-joining-databricks, https://rxdb.info/premium/, https://supabase.com/blog/local-first-expo-legend-state, https://tinybase.org/api/persister-supabase/

## 2. Satélite, NDVI e mapa (ondas 5, 17 e 18)

| Fonte | Entrega | Resolução e revisita | Uso comercial | Custo |
|---|---|---|---|---|
| Sentinel-2 (Copernicus Data Space / Sentinel Hub) | Bandas e API | 10 m, cerca de 5 dias | Livre com atribuição "Contains modified Copernicus Sentinel data [ano]" | Cota grátis mensal; acima, Sentinel Hub comercial |
| Planet | Diária | cerca de 3 m | Contrato | Não público |
| Google Earth Engine | Catálogo e processamento | Varia | Só pago | US$ 500 a 2.000/mês |
| Microsoft Planetary Computer | STAC Sentinel-2 L2A em COG | 10 m | Licença Copernicus | Catálogo grátis |
| Agromonitoring | NDVI por polígono | 10 a 30 m | Planos pagos | Sob contato |
| Embrapa SATVeg | Séries MODIS | 250 m, 16 dias | Para empresas | Valores não achados |
| INPE Brazil Data Cube | CBERS-4/4A | 64 m, 8 dias | CC BY-NC (não comercial) | Grátis |
| MapBiomas | Cobertura e qualidade de pastagem | 30 m | CC BY (marca não comercial) | Grátis |

Mapa base: Mapbox (25 mil usuários ativos/mês grátis no celular, depois US$ 4 por mil; satélite 750 mil tiles grátis, depois US$ 0,25 por mil); MapTiler Free é não comercial (Flex US$ 30/mês); Esri 2 milhões de tiles/mês grátis com conta, depois US$ 0,15 por mil; Google proíbe uso offline dos tiles.

Contorno: shapefile do CAR pela consulta pública (https://consultapublica.car.gov.br) com o número do imóvel; a base por município tem captcha (não contornar).

**Escolha:** NDVI do Sentinel-2 lido do STAC do Planetary Computer ou do CDSE, processado num worker agendado fora das Edge Functions; estatística por talhão no Postgres e imagem recortada no Storage para o app offline; mapa base Mapbox; contorno pelo arquivo do CAR fornecido pelo produtor.

Fontes: https://sentinel.esa.int/documents/247904/690755/Sentinel_Data_Legal_Notice, https://documentation.dataspace.copernicus.eu/FAQ.html, https://cloud.google.com/earth-engine/pricing, https://agromonitoring.com/price, https://www.mapbox.com/pricing, https://www.maptiler.com/cloud/pricing/, https://location.arcgis.com/pricing/, https://developers.google.com/maps/documentation/tile/policies

## 3. Previsão do tempo (onda 19)

| Fonte | Limites e custo | Observação |
|---|---|---|
| Open-Meteo | Grátis só não comercial; Standard 1 milhão de chamadas/mês, cerca de US$ 29/mês pelo anúncio | Dados CC BY 4.0; servidor AGPLv3 auto-hospedável |
| INMET | Estações horárias, 90 dias no portal | API com token, sem documentação nem termos achados |
| OpenWeather | 1.000 chamadas/dia grátis, depois £ 0,0012 por chamada | ODbL |
| Tomorrow.io | 500 chamadas/dia grátis | Uso comercial do grátis não confirmado |
| Meteoblue | Créditos; € 400/mês citados | Confirmar |

**Escolha:** Open-Meteo Standard, uma chamada por fazenda por hora no servidor, com cache que o celular lê sem sinal; INMET para chuva observada.

Fontes: https://open-meteo.com/en/pricing, https://openmeteo.substack.com/p/api-subscriptions-for-commercial, https://openweathermap.org/price

## 4. Preços (onda 20)

| Fonte | API | Termos |
|---|---|---|
| CEPEA | Não | Retransmitir exige autorização formal, exceto o widget (https://cepea.org.br/br/widget.aspx) |
| B3 boi gordo futuro (BGI) | Licenciada | Liquida pelo Indicador do Boi DATAGRO desde fev/2025 (Ofício 135/2024); exibir exige licença de distribuição |
| Conseleite-MG | Não | Referência mensal republicada pelo Governo de MG (R$ 2,92/litro em set/2026) |
| Conab | Não | Fora do decreto de dados abertos |
| Agrolink | Sim, pago | Feed de mais de 4 mil preços/dia; sob proposta |
| Notícias Agrícolas, Scot, IMEA | Não achado | Sem termos de reuso |

**Escolha:** não raspar sites. Preço recebido lançado pela fazenda; widget do CEPEA no painel; pedir licença ao CEPEA e proposta à Agrolink; B3 só por distribuidor licenciado.

## 5. Campo e rastreabilidade (ondas 11, 15, 16 e 21)

- **Bastão RFID:** Allflex RS420 (Bluetooth, MFi no iOS, protocolo pelo suporte técnico); Tru-Test XRS2i (Bluetooth, sem SDK público); Agrotag sem informação. No iOS, MFi costuma exigir que o fabricante cadastre o app na Apple (não verificado). Plano B: bastão em modo teclado.
- **Balança:** Tru-Test S3 (BLE, app Data Link); ID5000 com memória e pareamento com o bastão.
- **Identificação individual (PNIB):** Portaria SDA/MAPA 1.331/2025, quatro etapas até o fim de 2032; a partir de 01/01/2033 animal sem identificação não transita. Gravar já o número ISO de 15 dígitos. Situação do SISBOV não esclarecida.
- **e-GTA MG:** emitida pelo veterinário no Sidagro ou pelo Portal do Produtor do IMA; sem API pública.
- **ABCZ e Girolando:** consulta pública de genealogia; nenhuma API publicada. Caminho: parceria formal.
- **Nota fiscal do produtor:** Ajuste SINIEF 27/2024; NF-e para todos desde 05/01/2026; em MG credenciamento no SIARE com certificado A1. Caminho: emissor de terceiros ou exportação para o contador.

## Não confirmado

Preço do Open-Meteo Standard em euro; preços de Agromonitoring, EOSDA, Planet, AgroAPI, Tomorrow.io e Climatempo; regras de offline e cobrança de satélite na Esri, MapTiler e Mapbox; texto integral dos termos do CEPEA; licença do MapBiomas para pastagem; termos e API do INMET; continuidade do SISBOV; APIs de ABCZ, Girolando, IMEA, Scot e Agrotag; fonte de preço de insumos com API.
