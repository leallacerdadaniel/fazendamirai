# Fazenda Miraí

Sistema de gestão de fazenda (leite e corte, zootecnia e gestão), trazido do Lovable
em 31/10/2026. Hoje é o painel web que veio de lá; o plano para virar app de campo
offline, painel do escritório e produto está em
[docs/ondas-fazenda-mirai.html](docs/ondas-fazenda-mirai.html). Contexto, decisões e
estado das ondas: [CLAUDE.md](CLAUDE.md).

## Rodar

```bash
npm install
npm run dev        # painel em http://localhost:8080
npm run build
npm test
```

O `.env` não vai para o Git; copie `.env.example` e preencha com a URL e a chave
publicável do Supabase.

## Estrutura atual

- `src/` painel web (Vite, React, TypeScript, Tailwind, shadcn/ui)
- `supabase/` funções e as migrations de abril de 2026 do Lovable
- `drizzle/` migrations de outubro de 2026 do Lovable (saem na onda 4)
- `docs/` plano de ondas e pesquisas
