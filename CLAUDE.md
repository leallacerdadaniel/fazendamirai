# Fazenda Mirai: contexto do projeto

Sistema de gestão da Fazenda Mirai (gado leiteiro: Gir, Gir Leiteiro e Girolando,
cerca de 406 animais). Nasceu no Lovable e foi trazido para cá em 31/10/2026, a
partir do zip exportado de lá. Daqui em diante este repositório é a fonte da verdade
do código; o Lovable é matéria-prima, como no Café com Crédito.

Este arquivo cobre só o que não se descobre lendo o código: decisões, estado das
ondas, armadilhas. Mudou onda ou decisão, registra aqui na mesma tarefa.

## Regras da casa (herdadas do Café com Crédito, a confirmar com o Daniel)

1. Ícone vetorizado (`lucide-react`), nunca emoji, em código, documento e interface.
2. Não usar travessão (o caractere longo). Usar vírgula, dois-pontos ou parênteses.
3. Regra de negócio não importa biblioteca de interface.
4. Commitar pode e deve; `git push` só com pedido explícito.

## O que veio do Lovable (inventário de 31/10/2026)

- **Stack:** Vite 5 + React 18 + TypeScript + Tailwind + shadcn/ui, React Query,
  React Router, Leaflet (mapa), Recharts, jsPDF, xlsx. Testes com Vitest; Playwright
  configurado só com o fixture do Lovable.
- **Telas:** 33 rotas autenticadas em `src/App.tsx`, organizadas em 8 módulos no
  registro `src/lib/modules.ts` (Rebanho, Reprodução, Produção, Saúde, Nutrição,
  Comercial, Estrutura, Gestão). As rotas `/mobile/*` só redirecionam; os arquivos
  `src/pages/Mobile*.tsx` sobraram de uma versão antiga.
- **Banco:** Supabase do Lovable Cloud, projeto `kkffdstapitzmthgxttv`. 54 tabelas em
  `src/integrations/supabase/types.ts`, papéis `gestor`, `colaborador` e
  `administrador` (`user_roles`, `has_role`, `is_gestor_or_admin`), bucket
  `animal-photos`.
- **Armadilha das migrations:** o esquema está espalhado em dois lugares. Há 8
  migrations em `supabase/migrations` (abril de 2026) e 6 em `drizzle/migrations`
  (outubro de 2026, gestão de sócios, importação da planilha, plantio, associações).
  Nenhum dos dois sozinho recria o banco. O esquema real tem de sair de um
  `pg_dump --schema-only` do banco do Lovable.
- **Funções:** `identify-animal`, `scan-invoice` e `suggest-animal-names`, as três
  pelo gateway de IA do Lovable (`ai.gateway.lovable.dev`, `LOVABLE_API_KEY`,
  modelos Gemini).
- **Outros laços com o Lovable:** `src/integrations/supabase/previewAuthStorage.ts`
  (sessão do preview do editor), `lovable-tagger` no Vite, e as 7 fotos da fazenda em
  `src/assets/fazenda/*.asset.json`, que são ponteiros para o armazenamento do
  Lovable (`/__l5e/assets-v1/...`) e não abrem fora dele.
- **Plano pendente do Lovable:** `.lovable/plan/` traz a consulta genealógica na
  Girolando e na ABCZ pelo RGD (13/10/2026). A tabela `consultas_associacao` e a tela
  de arquivos por animal já existem; a busca automática não.
- `.env` saiu do Git (vai no `.gitignore`); o modelo está em `.env.example`.

## O plano de ondas

**Proposta de 31/10/2026, ainda não acordada.** Quando o Daniel aprovar, vira o
documento HTML publicado no mesmo formato do Café com Crédito e esta tabela passa a
seguir o estado de cada onda.

| Onda | O que é | Estado |
| --- | --- | --- |
| 0 | Trazer o projeto: repositório, build, inventário do que existe | Em andamento (31/10/2026) |
| 1 | Ambiente na máquina: rodar local contra o banco do Lovable e contra um Supabase local | Não iniciada |
| 2 | Banco novo no Supabase da empresa: esquema do `pg_dump`, migrations unificadas, e os dados da fazenda | Não iniciada |
| 3 | Cortar o cordão com o Lovable: funções de IA, sessão do preview, fotos, `lovable-tagger`, hospedagem | Não iniciada |
| 4 | Segurança: RLS tabela por tabela, papéis, o que cada perfil pode gravar | Não iniciada |
| 5 | Regras de negócio num pacote só, com testes: reprodução, lactação, sócios, estoque | Não iniciada |
| 6 | Consulta genealógica Girolando e ABCZ (o plano pendente do Lovable) | Não iniciada |
| 7 | Uso no campo: celular, offline, câmera | Não iniciada |
| 8 | Publicação e operação | Não iniciada |
