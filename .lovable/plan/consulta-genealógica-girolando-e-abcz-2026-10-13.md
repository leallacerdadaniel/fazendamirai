# Consulta genealógica Girolando e ABCZ

## Objetivo
Buscar nos sites públicos da Girolando e da ABCZ, pelo RGD de cada animal, os pais, avós e bisavós, os dados genéticos e a situação do registro. Depois, preencher o cadastro do sistema com esses dados.

## Como o usuário vai usar
1. **No perfil do animal:** botão **"Buscar na associação"**. Ele consulta o site certo pela raça (Gir/Gir Leiteiro na ABCZ, Girolando na Girolando) e mostra um quadro comparando o que está no sistema com o que veio do site. O usuário marca o que quer aplicar e salva.
2. **Em massa:** em **Gestão → Atualizar genealogia**, você escolhe os animais (todos, só os sem pai e mãe, ou por raça) e o sistema consulta um por vez, devagar, para não sobrecarregar os sites. Ao final aparece um relatório: atualizados, sem diferença, não encontrados e com erro. Nada é sobrescrito sem revisão. As diferenças ficam numa fila para aprovar.
3. **Ancestrais fora do rebanho:** os pais e avós que não estão no rebanho ficam guardados como nome e RGD, e a árvore genealógica passa a mostrá-los até os bisavós.

## Etapas
1. **Investigar os dois sites:** ver como cada consulta funciona por dentro (formulário, endereços e formato da resposta). Esta é a etapa que confirma se a ideia funciona. Se algum site exigir um navegador completo, o plano é revisto antes de seguir.
2. **Girolando, sem captcha:** a consulta automática é feita direto pelo sistema.
3. **ABCZ, com captcha simples:** a IA lê a imagem do captcha. Se não acertar, o perfil mostra o captcha para o usuário digitar. Na consulta em massa, os animais da ABCZ que falharem ficam marcados para fazer depois.
4. **Banco de dados:** guardar a resposta original de cada consulta, com data e site de origem, e os ancestrais encontrados.
5. **Telas:** botão e quadro de comparação no perfil, página de atualização em massa e fila de aprovação.
6. **Árvore e parentesco:** usar os novos ancestrais na árvore genealógica e no card "Parentes no rebanho".

## Riscos
- Se um site mudar o layout, a consulta pode parar de funcionar até ser ajustada.
- Consultar os 406 animais vai levar algum tempo, porque é preciso respeitar um intervalo entre as consultas.
- Vale conferir se os termos de uso das associações permitem a consulta automática.

## Detalhes técnicos
- Uma função no servidor para cada associação (`consulta-girolando`, `consulta-abcz`), com uma parte de leitura do resultado (parser) compartilhada. As consultas são feitas com `fetch` e controle de cookies e sessão. O captcha é lido pelo modelo de visão do gateway de IA.
- Não é um servidor MCP: as funções são chamadas direto pelas telas. Se no futuro houver um assistente de IA no sistema, elas podem virar ferramentas dele.
- Novas tabelas: `consultas_associacao` (animal_id, fonte, rgd, status, payload jsonb, consultado_em), `ancestrais_externos` (rgd, nome, sexo, raça, pai_rgd, mae_rgd, fonte) e `sugestoes_genealogia` (animal_id, campo, valor_atual, valor_sugerido, status). Todas com RLS, e só gestor ou administrador podem aprovar.
- O processamento em massa avança em pequenos lotes, chamados pelo navegador, com cerca de 2 a 3 segundos entre cada consulta.
