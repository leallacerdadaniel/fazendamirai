# Concorrência e usabilidade (pesquisa de 10/11/2026)

Feita por um agente de pesquisa a pedido do Daniel, para a onda de planejamento. Fontes
numeradas no fim. O que não foi confirmado está listado explicitamente.

## Tabela comparativa

| Produto | Público | O que cobre | App de campo e offline | Preço público | O que os usuários dizem |
|---|---|---|---|---|---|
| Ideagri PRO (Rúmina) | Leite, médias e grandes; mais de 3 mil fazendas [4] | Zootecnia, reprodução, leite, financeiro e fiscal (NF-e da SEFAZ, fluxo de caixa), mais de 85 relatórios, integração com ordenha [1] | App consulta e lança (inseminação, parto, pesagem, leite, medicamento), com bastão e balança [2]; offline no app e no desktop, segundo o fabricante [1] | Não publica; imprensa cita cerca de R$ 800/mês para fazenda que fatura R$ 300 mil/mês [4] | App Store 4,7 (314 notas); avaliações em destaque reclamam de app que não carrega e contagem errada após atualização [2] |
| Jetbov | Corte (cria, recria, engorda); 4 mil propriedades [6] | Rebanho, reprodução, sanidade, pasto; NF-e, custo por animal e caixa só nos planos altos [5] | Apps Pasto e Curral offline com bastão e balança; app do Gestor com IA por texto ou áudio [5] | 4 planos a partir de R$ 99,90/mês (mar/2025) [6]; site diz "sob consulta", 7 dias de teste [5] | App Pasto 4,0 no Google Play [7] |
| iRancho | Corte | Zootecnia, reprodução, financeiro, custo por animal, estoque que baixa o medicamento no manejo, SISBOV [9] | Com e sem internet, RFID e balança [9]; BOS registra por voz com IA no celular, sem sinal, em validação em abr/2026 [10] | Não publica | Não encontrado |
| FarmTell (ex-Prodap, dsm-firmenich) | Corte, leite, consultores, fábricas de ração [11][12] | Nutrição, custo de cocho, gestão por lote, alertas [11] | Offline não informado [11] | Não publica | Não encontrado |
| Aegro | Lavoura | Financeiro, fiscal, safra, estoque, máquinas; pecuária só como adicional do Premium [13] | Aegro Campo offline, sincroniza ao conectar e a cada 4 h no Android [14] | Não publica | Não pesquisado a fundo |
| Farmbox | Lavoura (pragas) [15] | Manejo de pragas por talhão | Offline, segundo entrevista [15] | Não publica | Não encontrado |
| Siagri (Aliare) | Revendas e cooperativas; produtor via MyFarm [16] | ERP | Não verificado | Não publica | Não pesquisado |
| DairyComp 305 (VAS) | Leite, rebanhos grandes [21] | Zootecnia, reprodução, saúde, leite | Pocket CowCard e DC on Mobile: listas de trabalho, RFID, offline parcial [19] | Não publica | Curva de aprendizado íngreme (linha de comando) [20] |
| Afimilk (AfiFarm, Afi2Go) | Leite com sala e sensores | Monitoramento, saúde, reprodução, painel do dia [22] | Afi2Go: tarefas atribuídas, situação, apartação [22] | Não publica | Não encontrado |
| CowManager | Leite com sensor na orelha | Cio, saúde, nutrição, localização [23] | Depende do sensor | Só estimativas de terceiros | Não encontrado |
| SenseHub (MSD/Allflex) | Leite com coleira ou brinco | Cio, saúde, estresse térmico, leite [24] | Lista dos animais que pedem atenção [24] | Não publica | Não encontrado |
| Herdwatch (Irlanda) | Corte, leite, ovinos; mais de 20 mil produtores [25] | Rebanho, reprodução, leite, medicamentos com carência, auditorias, pasto; sem financeiro aparente [25] | Offline; lê EID de 5 marcas por Bluetooth [25]; voz (Herdi) [27] | A partir de € 79 por usuário/ano [26] | Trustpilot 3,7: elogiam facilidade e suporte; reclamam do reajuste na renovação (€ 155 para € 320) [26] |
| AgriWebb (Austrália) | Corte e ovinos a pasto | Mapa, piquetes, lotes, conformidade, custo de produção [28] | Totalmente offline [28] | Sob consulta [28] | Poucas avaliações |

Granular e FarmLogs saíram do mercado (Granular vendido em 2022 [29]; FarmLogs virou Bushel Farm em 2023 [30]).

## Achados

- **Ideagri separando zootecnia e gestão não se confirma como dito.** A página oficial vende o Ideagri PRO com gestão zootécnica e financeira integradas, com NF-e e fluxo de caixa [1], e o relançamento de 2023 já o descrevia assim [3]. Hipóteses não verificadas: o plano contratado pela Miraí não inclui o financeiro completo (o PRO tem tíquete 40% maior [4]); a gestão é rasa (estoque, custo por atividade, folha e lavoura não aparecem [1]); o ecossistema espalhado em várias marcas dá a impressão de produtos separados. Perguntar ao Daniel o que falta.
- No corte (Jetbov, iRancho, FarmTell) os apps de campo são mais modernos e já usam voz. No leite o Ideagri domina e o DairyComp atende os grandes. Os de lavoura tratam a pecuária como acessório. Não achamos quem junte leite, financeiro, estoque e lavoura de volumoso com app offline para o peão.
- Adoção baixa: só 9% das fazendas de leite usam software (2023, fonte interessada) [21]. 71,8% dos estabelecimentos sem internet no Censo Agro 2017 [31].
- Sensores (Afimilk, CowManager, SenseHub) não concorrem; são fontes a integrar.
- "Agrosoft" não identificado (talvez Agrisoft [17]). MilkPoint e Rehagro não têm software próprio [18].

## Padrões de usabilidade

### App de campo

1. Alvo de toque: mínimo 44 pt (Apple) e 48 dp (Material) [33]; NN/g recomenda 1 cm [32]; para luva, fornecedores citam 20 a 25 mm (não verificado) [34]. Adotado: 56 a 64 dp nas ações principais.
2. Começar pelo animal: bastão RFID (Herdwatch, DairyComp, Jetbov, iRancho) ou teclado numérico grande com busca tolerante a erro [37].
3. Lista de trabalho do dia no lugar de menu [19][22]; carência calculada ao escanear o medicamento [25]; uma tarefa por tela.
4. Voz como atalho, sempre confirmada na tela. Estudo com 90 pessoas de baixa alfabetização: voz 72% de tarefas concluídas, interface gráfica 100%, texto inutilizável [35].
5. Ícone com rótulo, foto do animal, linguagem do curral ("vaca vazia", "secar", "pariu") [36][37].
6. Offline de verdade com estado à vista [38]; sinais do WhatsApp (relógio, tique) para o estado de cada registro [39].
7. Grade fixa de botões configurada pelo gestor, como a do Square POS [40].
8. Sol forte: alto contraste e tema claro (hipótese, sem estudo).

### Painel web

1. Ctrl+K como no Linear [41]; filtro por campo e tecla ? como no Stripe [42].
2. Tabela como planilha (colar em várias células, preenchimento, edição em lote) como no Airtable [43].
3. Importação em etapas com mapeamento, erro por linha e linhas recusadas para baixar [44].
4. Painel que aponta ação (SenseHub, Afimilk) [22][24].
5. Escritório manda tarefa para o campo (Afi2Go, Jetbov) [5][22].
6. Relatórios prontos: Ideagri tem mais de 85 [1].

## Diferenciais possíveis

1. O mesmo dado do manejo ao caixa, no leite (no corte só o iRancho baixa estoque pelo manejo [9]).
2. Voz em português, offline, para o peão (só o iRancho anuncia, em validação [10]).
3. Genealogia integrada a ABCZ e Girolando (sem API pública; há integração sob encomenda para uma fazenda [45][46]).
4. Preço público por animal, sem surpresa na renovação [26].
5. Migração assistida de planilhas e de Ideagri/Jetbov.
6. Sensores e qualidade do leite do laticínio [25].
7. WhatsApp é complemento, não diferencial (a Rúmina já usa) [1].

## Não confirmado

Separação zootecnia/gestão no Ideagri; offline do Ideagri na prática; preços de iRancho, FarmTell, Aegro, Farmbox, Siagri, VAS, Afimilk, SenseHub, AgriWebb; avaliações em volume de Jetbov, iRancho, FarmTell; Herdi em português; futuro do FarmTell; números de luva e sol; dado de internet do Censo 2023.

## Fontes

1. https://rumina.com.br/solucoes/ideagri/
2. https://apps.apple.com/br/app/ideagri-app/id1551046038
3. https://opresenterural.com.br/novo-ideagri-traz-mudancas-no-sistema-e-lidera-mercado-nacional-de-solucoes-tecnologicas-para-a-pecuaria-leiteira/
4. https://www.theagribiz.com/?p=313749
5. https://www.jetbov.com
6. https://agfeed.com.br/agtech/jetbov-lanca-franquias-agtech-para-escalar-venda-de-plataforma-de-gestao-pecuaria/
7. https://play.google.com/store/apps/developer?id=JetBov
8. https://agfeed.com.br/agtech/a-veterana-jetbov-entra-na-era-da-ia-para-acompanhar-a-aceleracao-da-pecuaria-digital
9. https://www.irancho.com.br
10. https://comprerural.com/inovacao-no-campo-inteligencia-artificial-agora-opera-sem-conexao-para-monitorar-a-pecuaria/
11. https://apecuariadeprecisao.com.br/
12. https://agfeed.com.br/negocios/com-marca-farmtell-dsm-firmenich-cria-no-brasil-negocio-global-de-pecuaria-de-precisao
13. https://aegro.com.br/suporte/conta-e-assinatura/planos-de-assinatura-aegro/
14. https://aegro.com.br/suporte/safras/armadilhas-ou-leituras-do-app-nao-aparecem-na-web/
15. https://apps.apple.com/us/app/id1641359260
16. https://agfeed.com.br/agtech/aliare-acelera-crescimento-com-avanco-em-ia-e-aquisicoes-para-entrada-em-novos-segmentos
17. https://www.ohub.com.br/empresa/agrisoft-sao-paulo-sp-87252
18. https://www.ideagri.com.br/siteideagridados/New/IILB/2021_09/boletim_IILB.pdf
19. https://vas.com/vas-mobile-solutions-device-comparison/
20. https://vas.com/help/en-us/dairycomp/the-command-line
21. https://agfeed.com.br/?p=49084
22. https://www.afimilk.com/afi2go/ e https://www.afimilk.com/aficloud/cockpit/
23. https://agritechobservatory.review.fao.org/es/cowmanager
24. https://www.msd-animal-health.co.uk/hub/sensehub/dairy/
25. https://herdwatch.com/en-uk/solutions/dairy/
26. https://www.capterra.com/p/171787/Herdwatch/ e https://uk.trustpilot.com/review/herdwatch.com
27. https://www.farmersjournal.ie/herdwatch-launches-walk-and-talk-ai-for-farmers-869929
28. https://www.agriwebb.com/pricing
29. https://www.farmprogress.com/farm-business/traction-ag-accounting-startup-acquires-granular-business
30. https://blog.bushelfarm.com/farmlogs-is-now-bushel-farm
31. https://www.comprerural.com/mais-de-70-das-propriedades-rurais-nao-tem-acesso-a-internet
32. https://www.nngroup.com/articles/touch-target-size/
33. https://tetralogical.com/blog/2022/12/20/foundations-target-size/
34. https://www.cdtech-display.com/knowledges/how-to-optimize-ui-button-size-for-gloved-users-in-industrial-hmis/
35. https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/ToCHI2711_Medhi.pdf
36. https://courses.cs.washington.edu/courses/cse490d/09au/papers/Text-FreeUI.pdf
37. https://www.nngroup.com/articles/writing-for-lower-literacy-users/
38. https://developer.android.com/topic/architecture/data-layer/offline-first
39. https://www.pandasecurity.com/en/mediacenter/whatsapp-check-marks/
40. https://squareup.com/help/article/8334-set-up-item-grid
41. https://linear.app/enablement/guide/navigating-linear
42. https://docs.stripe.com/dashboard/search
43. https://support.airtable.com/docs/updating-multiple-fields-with-bulk-field-actions
44. https://www.oneschema.co/blog/advanced-csv-import-features
45. https://comprerural.com/parceria-vai-aprimorar-o-controle-leiteiro-das-racas-zebuinas/
46. https://cheesecakelabs.com/portfolio/fazenda-guanabara
