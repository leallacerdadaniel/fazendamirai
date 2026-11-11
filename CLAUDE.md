# Fazenda Miraí: contexto do projeto

Sistema de gestão da Fazenda Miraí (gado leiteiro: Gir, Gir Leiteiro e Girolando, 406
animais). Nasceu no Lovable e foi trazido para cá em 31/10/2026, a partir do zip
exportado de lá. Daqui em diante este repositório é a fonte da verdade do código; o
Lovable é matéria-prima, como no Café com Crédito.

**O objetivo mudou em 10/11/2026:** deixa de ser o sistema de uma fazenda e vira um
produto para vender a muitos fazendeiros, de leite e de corte, com a Miraí como
primeira cliente e vitrine. Ver "O que o Daniel pediu", abaixo.

Este arquivo cobre só o que não se descobre lendo o código: decisões, estado das
ondas, armadilhas. Mudou onda ou decisão, registra aqui na mesma tarefa.

## Onde as coisas estão

- **Repositório:** `~/Documents/GitHub/fazendamirai`, ligado a
  `https://github.com/leallacerdadaniel/fazendamirai` (criado pelo Daniel no GitHub
  Desktop). A pasta `~/Documents/GitHub/fazenda-mirai`, com hífen, foi a primeira cópia
  de 31/10/2026; o histórico foi trazido para cá em 10/11/2026 e ela pode ser apagada.
- **Enviar ao GitHub:** o terminal das sessões não tem login no GitHub (o
  `osxkeychain` está vazio para github.com; o GitHub Desktop guarda o acesso dele). O
  envio sai pelo GitHub Desktop, com o Daniel clicando em Push origin; depois, conferir
  com `git branch -vv` que `origin/main` bate com o `main` local.
- **Banco novo:** organização Supabase "Fazenda Mirai" (`asaemgrkceqevbqxuwqs`,
  plano gratuito), projeto `Fazenda_Mirai` (`vkwpqjfceeqdlfwtnxof`), São Paulo,
  Postgres 17, criado em 10/11/2026. Ainda vazio.
- **Banco do Lovable (em uso pela fazenda até o corte):** projeto Lovable
  `4bae3e97-14d3-4332-b642-1f6266734801`, Supabase `kkffdstapitzmthgxttv`. O conector
  do Lovable deixa rodar SQL nele: **só leitura**, nunca gravar lá.
- **Plano de ondas:** [docs/ondas-fazenda-mirai.html](docs/ondas-fazenda-mirai.html),
  publicado em https://claude.ai/artifact/6BKZzG5kQUt5W88xNs4S9j.
- **Pesquisas de 10/11/2026, com fontes:**
  [docs/pesquisa/2026-11-10-concorrentes-e-usabilidade.md](docs/pesquisa/2026-11-10-concorrentes-e-usabilidade.md)
  e [docs/pesquisa/2026-11-10-integracoes.md](docs/pesquisa/2026-11-10-integracoes.md).

## Regras da casa (herdadas do Café com Crédito, a confirmar com o Daniel)

1. Ícone vetorizado (`lucide-react`), nunca emoji, em código, documento e interface.
2. Não usar travessão (o caractere longo). Usar vírgula, dois-pontos ou parênteses.
3. Regra de negócio não importa biblioteca de interface.
4. Commitar pode e deve; `git push` só com pedido explícito.
5. **Mudou onda, muda o HTML.** Alteração de escopo, de item ou de estado de onda entra
   em `docs/ondas-fazenda-mirai.html` e é republicada no mesmo artefato, na mesma
   tarefa. Três cuidados, os mesmos do Café com Crédito:
   - Carimbar o `<span id="atualizado">` com dia e hora de Brasília lidos da máquina
     (`TZ=America/Sao_Paulo date "+%d/%m/%Y %H:%M"`).
   - **Ler primeiro o artefato publicado e preservar o array `feitos`** do
     `<script id="estado">`: são as marcações do Daniel, salvas na versão publicada,
     não no arquivo local.
   - Não mudar a quantidade de itens de uma onda que já tenha marcação: os IDs são
     `w<onda>-<índice>`, e acrescentar ou tirar item desloca as marcações. Reescrever o
     texto de um item é seguro.
   - A página salva a si mesma pela capacidade `artifact`, a partir de uma cópia dos
     elementos marcados com `data-pg` tirada antes de desenhar a trilha. Elemento novo
     no topo da página precisa de `data-pg`, senão some na primeira marcação.

## O que o Daniel pediu (10/11/2026)

Ao aprovar o plano de ondas:

- Os dados dos animais são reais: a migração leva dados, não só esquema (diferente do
  Café com Crédito).
- O app tem de funcionar sem internet e sincronizar quando conectar: muitas fazendas
  ficam em lugar remoto.
- Banco na organização Fazenda Mirai do Supabase; repositório `fazendamirai`.
- App responsivo, publicado nas lojas, e um painel admin web para mexer pelo
  computador, com dashboards, tabelas e muita facilidade. Copiar o que os sistemas de
  melhor usabilidade fazem.
- No app, botões grandes e fáceis: quem usa é o peão, com pouca familiaridade com
  tecnologia.
- O que se faz aqui pode virar benchmark e ser vendido. O Ideagri é o melhor do
  mercado; o produto tem de servir à zootecnia e à gestão juntas, para muitos
  fazendeiros.
- Integrações: geolocalização e mapa, plantio com visão de satélite, previsão do
  tempo, preço da arroba e outras do agro. "Um trem top de linha."
- Leite e corte: "O app tem que servir tanto pra leite quanto pra corte". Este pedido
  chegou por uma sessão paralela do Daniel em 10/11/2026 e virou a onda 16 e itens nas
  ondas 3, 8, 10, 15, 20.
- Planilhas do Casal da Pecuária (também pela sessão paralela, 10/11/2026): "Tem um
  tal de casal de pecuaria que tem umas planilhas que podemos usar/jogar pra dentro do
  sistema. Que é pra saber quanto custa pra engordar o gado". São 15 planilhas de
  resultado e custo (R$ 97) e 3 de formulação (R$ 147), vendidas na Hotmart, sem
  formato nem licença informados. Comprar para uso próprio não dá direito de copiar
  para um produto vendido: as calculadoras usam fórmulas da metodologia pública
  (Embrapa, CEPEA) e as planilhas servem de checklist e de conferência dos resultados.
  Entraram nas ondas 8 (funções), 13 (importar o histórico), 16 (calculadoras e
  formulação) e 24 (parceria como canal de venda, decisão do Daniel). Falta: os
  arquivos, se a fazenda tiver comprado, para mapear campo a campo.

## Decisões e achados que não estão no código

- **O sistema do Lovable é usado como cadastro, não no dia a dia** (contagem de
  10/11/2026): 406 animais, 153 coberturas, 116 diagnósticos, 91 partos, 220
  vacinações, 87 sêmen, 31 protocolos com 431 animais, 244 movimentações, 358
  pendências da importação da planilha, 2 usuários, nenhuma foto no bucket. Zero
  ordenhas, pesagens, tratamentos, lotes, tarefas, estoque e lançamentos financeiros.
  Por isso o app de campo é o centro do produto.
- **O Ideagri separando zootecnia e gestão não se confirmou:** o Ideagri PRO atual
  anuncia zootecnia e financeiro integrados. Falta perguntar ao Daniel o que ele sente
  faltar. O espaço aberto que a pesquisa achou: ninguém junta leite e corte,
  financeiro, estoque e lavoura com app offline para o peão.
- **Offline: PowerSync** (onda 9). Exige development build (não roda no Expo Go) e
  replicação lógica no Postgres.
- **Satélite: Sentinel-2** (gratuito, licença comercial com atribuição), processado
  fora das Edge Functions. **Mapa base: Mapbox** (guarda o mapa para uso sem sinal).
  Hoje o mapa usa as imagens da Esri direto, sem conta: não serve para produto.
- **Clima: Open-Meteo no plano comercial**, com cache no servidor.
- **Preços: nada de raspagem.** CEPEA só por widget ou licença; B3 por distribuidor.
- **Número eletrônico ISO de 15 dígitos no animal desde o esquema novo:** a
  identificação individual será obrigatória até 2033 (Portaria SDA/MAPA 1.331/2025).
- **Lição do Café com Crédito para a onda 4:** o Lovable Cloud não dá a senha do banco;
  o esquema sai da exportação oficial restaurada num Postgres descartável, não de
  `pg_dump` direto.

## O que veio do Lovable (inventário de 31/10/2026)

- **Stack:** Vite 5 + React 18 + TypeScript + Tailwind + shadcn/ui, React Query,
  React Router, Leaflet (mapa), Recharts, jsPDF, xlsx. Testes com Vitest; Playwright
  configurado só com o fixture do Lovable.
- **Telas:** 33 rotas autenticadas em `src/App.tsx`, organizadas em 8 módulos no
  registro `src/lib/modules.ts` (Rebanho, Reprodução, Produção, Saúde, Nutrição,
  Comercial, Estrutura, Gestão). As rotas `/mobile/*` só redirecionam; os arquivos
  `src/pages/Mobile*.tsx` sobraram de uma versão antiga.
- **Banco:** 54 tabelas em `src/integrations/supabase/types.ts`, nenhuma com dono
  (feito para uma fazenda só), papéis `gestor`, `colaborador` e `administrador`
  (`user_roles`, `has_role`, `is_gestor_or_admin`), bucket `animal-photos`.
- **Armadilha das migrations:** o esquema está espalhado em dois lugares. Há 8
  migrations em `supabase/migrations` (abril de 2026) e 6 em `drizzle/migrations`
  (outubro de 2026, gestão de sócios, importação da planilha, plantio, associações).
  Nenhum dos dois sozinho recria o banco.
- **Funções:** `identify-animal`, `scan-invoice` e `suggest-animal-names`, as três
  pelo gateway de IA do Lovable (`ai.gateway.lovable.dev`, `LOVABLE_API_KEY`,
  modelos Gemini).
- **Outros laços com o Lovable:** `src/integrations/supabase/previewAuthStorage.ts`
  (sessão do preview do editor), `lovable-tagger` no Vite, e as 7 fotos da fazenda em
  `src/assets/fazenda/*.asset.json`, que são ponteiros para o armazenamento do
  Lovable (`/__l5e/assets-v1/...`) e não abrem fora dele.
- **Plano pendente do Lovable:** `.lovable/plan/` traz a consulta genealógica na
  Girolando e na ABCZ pelo RGD (13/10/2026). Nenhuma das duas tem API publicada.
- `.env` saiu do Git (vai no `.gitignore`); o modelo está em `.env.example`.
- O `package-lock.json` do Lovable estava desatualizado (o Lovable usa bun); foi
  sincronizado com `npm install` em 31/10/2026.

## O plano de ondas (27, aprovado em 10/11/2026)

O documento que manda na ordem do trabalho é o HTML publicado. Abrir antes de planejar
qualquer etapa.

| Onda | O que é | Estado |
| --- | --- | --- |
| 0 | Trazer o projeto para casa | Em andamento: 6 de 7 itens (31/10 e 10/11/2026). Histórico no GitHub desde 10/11/2026. Falta confirmar as regras da casa |
| 1 | Seu ambiente no Mac | Não iniciada |
| 2 | Monorepo (`apps/painel`, `apps/app`, `packages/*`) e o guia de design do campo e do escritório | Não iniciada |
| 3 | Muitas fazendas, leite e corte no mesmo banco | Não iniciada |
| 4 | O banco novo no Supabase da Fazenda Mirai | Não iniciada |
| 5 | Cortar o cordão com o Lovable | Não iniciada |
| 6 | Os dados reais e o dia do corte | Não iniciada |
| 7 | Segurança de produto | Não iniciada |
| 8 | As regras do gado num pacote só: leite e corte | Não iniciada |
| 9 | Funcionar sem internet (PowerSync) | Não iniciada |
| 10 | O app do peão | Não iniciada |
| 11 | Brinco eletrônico, balança e câmera | Não iniciada |
| 12 | Do celular simples ao tablet, teste de campo | Não iniciada |
| 13 | O painel do escritório | Não iniciada |
| 14 | Tudo o que o Lovable faz, no produto | Não iniciada |
| 15 | Zootecnia e gestão no mesmo lugar | Não iniciada |
| 16 | Corte: do bezerro ao frigorífico | Não iniciada |
| 17 | Mapa da fazenda e GPS | Não iniciada |
| 18 | Satélite e planejamento de plantio | Não iniciada |
| 19 | Clima e conforto do gado | Não iniciada |
| 20 | Preços do mercado | Não iniciada |
| 21 | Genealogia e associações de raça | Não iniciada |
| 22 | Assistente e alertas inteligentes | Não iniciada |
| 23 | Pré-requisitos das lojas | Não iniciada |
| 24 | Pronto para vender | Não iniciada |
| 25 | Publicação | Não iniciada |
| 26 | Operação | Não iniciada |

Decisões que esperam o Daniel: plano Pro do Supabase antes do dado real (onda 4), o
dia do corte (onda 6), contas das lojas e da Expo (onda 23), nome do produto (onda 24).
