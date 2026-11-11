# Onda 1: seu ambiente no Mac

Começada em 10/11/2026 no MacBook Pro do Daniel (Apple Silicon, macOS 27.2, 16 GB de
RAM, 713 GB livres).

## Situação

| # | Item | Situação |
|---|---|---|
| 0 | Node LTS e pnpm | Feito. Node 24.22.1 e npm 11.19.1 já estavam; pnpm 12.18.0 instalado pelo corepack em `~/Library/pnpm` |
| 1 | Docker e Supabase CLI | Falta: precisa do Homebrew (pede a senha do Mac) e do Docker Desktop |
| 2 | Xcode e simulador do iPhone | Feito. Xcode 27.2 já estava, com simuladores do iPhone 17, 17e, Air, 18 Pro e 18 Pro Max |
| 3 | Android Studio, SDK, JDK 17 e emulador | Falta: nada de Android instalado |
| 4 | Expo Go e development build no celular | Expo Go no simulador feito: app em branco (Expo SDK 58, React Native 0.88.1) abriu no iPhone 17 e a recarga automática atualizou a tela ao salvar. Falta abrir no celular do Daniel e o development build (depende do CocoaPods) |
| 5 | Conta Expo logada | A máquina já está logada na Expo, na conta `cheztoibh`, de outro projeto. Falta decidir a conta ou organização da Fazenda Miraí |
| 6 | Painel atual local contra o banco do Lovable | Feito: `npm run dev` sobe em http://localhost:8080 e a tela de login abre sem erro no console. O login é com a senha do Daniel |

## O que o Daniel roda no Terminal (pedem a senha do Mac)

O modo automático das sessões não grava no perfil do shell nem roda instalador com
senha, então estes passos são do Daniel. Um comando por vez:

1. Homebrew:

   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. Homebrew e pnpm no caminho do Terminal (no fim do `~/.zprofile`):

   ```bash
   echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
   ```

   ```bash
   echo 'export PNPM_HOME="$HOME/Library/pnpm"; export PATH="$PNPM_HOME:$PATH"' >> ~/.zprofile
   ```

3. Ferramentas de linha de comando (fechar e abrir o Terminal antes):

   ```bash
   brew install cocoapods watchman supabase/tap/supabase
   ```

4. Aplicativos (Docker Desktop, Android Studio e Java 17):

   ```bash
   brew install --cask docker-desktop android-studio zulu@17
   ```

5. Abrir o Docker Desktop uma vez e aceitar os termos. Abrir o Android Studio, escolher
   a instalação padrão, aceitar as licenças do SDK e criar um emulador (Pixel, Android
   mais recente) no Device Manager.

Depois disso, uma sessão confere tudo e roda `supabase start` e o emulador Android.

## Decisões da onda

- **Docker Desktop, não OrbStack:** o OrbStack é pago para uso comercial; o Docker
  Desktop é grátis para empresa com menos de 250 pessoas e menos de US$ 10 milhões de
  receita por ano.
- **pnpm em `~/Library/pnpm`:** `/usr/local/bin` é do root (o Node foi instalado pelo
  instalador oficial), então o corepack instala o pnpm na pasta do usuário.
- **App de teste fora do repositório**, numa pasta temporária: é só para provar a
  cadeia; o app de verdade nasce na onda 2, em `apps/app`.
- **O Terminal das sessões não tem login no GitHub nem permissão para alterar o perfil
  do shell:** isso fica com o Daniel.
