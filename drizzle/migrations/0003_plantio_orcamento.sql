ALTER TABLE public.plantios
  ADD COLUMN IF NOT EXISTS nome text,
  ADD COLUMN IF NOT EXISTS area_tipo text,
  ADD COLUMN IF NOT EXISTS sistema text,
  ADD COLUMN IF NOT EXISTS safra text,
  ADD COLUMN IF NOT EXISTS produtividade_esperada_ton_ha numeric,
  ADD COLUMN IF NOT EXISTS preco_mercado_ton numeric,
  ADD COLUMN IF NOT EXISTS materia_seca_pct numeric,
  ADD COLUMN IF NOT EXISTS perda_pct numeric,
  ADD COLUMN IF NOT EXISTS responsavel_tecnico text,
  ADD COLUMN IF NOT EXISTS posicao_data date;

CREATE TABLE public.plantio_custos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plantio_id uuid NOT NULL REFERENCES public.plantios(id) ON DELETE CASCADE,
  etapa text NOT NULL,
  categoria text NOT NULL DEFAULT 'operacao',
  especificacao text NOT NULL,
  descricao text,
  unidade text,
  quantidade numeric,
  valor_unitario numeric,
  dpp integer,
  realizado numeric,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plantio_custos TO authenticated;
GRANT ALL ON public.plantio_custos TO service_role;
ALTER TABLE public.plantio_custos ENABLE ROW LEVEL SECURITY;
CREATE POLICY plantio_custos_select ON public.plantio_custos FOR SELECT TO authenticated USING (true);
CREATE POLICY plantio_custos_insert ON public.plantio_custos FOR INSERT TO authenticated WITH CHECK (public.is_gestor_or_admin());
CREATE POLICY plantio_custos_update ON public.plantio_custos FOR UPDATE TO authenticated USING (public.is_gestor_or_admin());
CREATE POLICY plantio_custos_delete ON public.plantio_custos FOR DELETE TO authenticated USING (public.is_gestor_or_admin());