ALTER TABLE public.animais
  ADD COLUMN IF NOT EXISTS codigo_importacao text UNIQUE,
  ADD COLUMN IF NOT EXISTS raca text,
  ADD COLUMN IF NOT EXISTS grau_sangue text,
  ADD COLUMN IF NOT EXISTS localizacao text NOT NULL DEFAULT 'Fazenda',
  ADD COLUMN IF NOT EXISTS livro_registro text,
  ADD COLUMN IF NOT EXISTS status_registro text,
  ADD COLUMN IF NOT EXISTS indice_genetico numeric,
  ADD COLUMN IF NOT EXISTS indice_tipo text,
  ADD COLUMN IF NOT EXISTS lactacao_kg numeric,
  ADD COLUMN IF NOT EXISTS peso_nascimento_kg numeric,
  ADD COLUMN IF NOT EXISTS pai_id uuid REFERENCES public.animais(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS mae_id uuid REFERENCES public.animais(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ultimo_parto date,
  ADD COLUMN IF NOT EXISTS previsao_parto date,
  ADD COLUMN IF NOT EXISTS marcador_socio text,
  ADD COLUMN IF NOT EXISTS motivo_saida text,
  ADD COLUMN IF NOT EXISTS entrada_tipo text,
  ADD COLUMN IF NOT EXISTS entrada_evento text,
  ADD COLUMN IF NOT EXISTS saida_tipo text,
  ADD COLUMN IF NOT EXISTS saida_evento text,
  ADD COLUMN IF NOT EXISTS concepcao_tipo text,
  ADD COLUMN IF NOT EXISTS concepcao_data date,
  ADD COLUMN IF NOT EXISTS receptora_gestacao text,
  ADD COLUMN IF NOT EXISTS dados_originais jsonb;

ALTER TABLE public.protocolos_iatf
  ADD COLUMN IF NOT EXISTS codigo_importacao text UNIQUE,
  ADD COLUMN IF NOT EXISTS lote_numero text,
  ADD COLUMN IF NOT EXISTS tipo text,
  ADD COLUMN IF NOT EXISTS local text;

ALTER TABLE public.protocolo_animais
  ADD COLUMN IF NOT EXISTS touro_nome text,
  ADD COLUMN IF NOT EXISTS touro_rgd text,
  ADD COLUMN IF NOT EXISTS doadora text,
  ADD COLUMN IF NOT EXISTS semen_sexado text,
  ADD COLUMN IF NOT EXISTS observacao text;

ALTER TABLE public.reproducoes
  ADD COLUMN IF NOT EXISTS doadora text,
  ADD COLUMN IF NOT EXISTS semen_sexado text,
  ADD COLUMN IF NOT EXISTS sangue_previsto text,
  ADD COLUMN IF NOT EXISTS sexo_feto text,
  ADD COLUMN IF NOT EXISTS observacao text;

ALTER TABLE public.transacoes_animais
  ADD COLUMN IF NOT EXISTS evento text,
  ADD COLUMN IF NOT EXISTS data_exata boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS percentual_mirai numeric,
  ADD COLUMN IF NOT EXISTS texto_original text;

ALTER TABLE public.estoque_semen
  ADD COLUMN IF NOT EXISTS local text,
  ADD COLUMN IF NOT EXISTS data_contagem date,
  ADD COLUMN IF NOT EXISTS doses_convencional numeric,
  ADD COLUMN IF NOT EXISTS doses_sexado numeric,
  ADD COLUMN IF NOT EXISTS observacao text;

ALTER TABLE public.vacinacoes ADD COLUMN IF NOT EXISTS observacao text;

CREATE TABLE public.banco_nomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  usado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.banco_nomes TO authenticated;
GRANT ALL ON public.banco_nomes TO service_role;
ALTER TABLE public.banco_nomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read nomes" ON public.banco_nomes FOR SELECT TO authenticated USING (true);
CREATE POLICY "gestor write nomes" ON public.banco_nomes FOR ALL TO authenticated USING (public.is_gestor_or_admin()) WITH CHECK (public.is_gestor_or_admin());

CREATE TABLE public.importacao_pendencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origem text NOT NULL,
  motivo text NOT NULL,
  animal_id uuid REFERENCES public.animais(id) ON DELETE CASCADE,
  dados jsonb,
  resolvida boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.importacao_pendencias TO authenticated;
GRANT ALL ON public.importacao_pendencias TO service_role;
ALTER TABLE public.importacao_pendencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read pend" ON public.importacao_pendencias FOR SELECT TO authenticated USING (true);
CREATE POLICY "gestor write pend" ON public.importacao_pendencias FOR ALL TO authenticated USING (public.is_gestor_or_admin()) WITH CHECK (public.is_gestor_or_admin());