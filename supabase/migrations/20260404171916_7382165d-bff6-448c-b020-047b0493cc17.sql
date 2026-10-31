
-- Add death tracking to animais
ALTER TABLE public.animais ADD COLUMN IF NOT EXISTS causa_morte text;
ALTER TABLE public.animais ADD COLUMN IF NOT EXISTS data_morte date;

-- Create vendas_avulsas for retail sales (silo, leite, esterco)
CREATE TABLE public.vendas_avulsas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo text NOT NULL, -- 'silo', 'leite', 'esterco'
  quantidade numeric NOT NULL,
  unidade text NOT NULL DEFAULT 'sacos',
  preco_unitario numeric,
  valor_total numeric,
  comprador text,
  data date NOT NULL DEFAULT CURRENT_DATE,
  forma_pagamento text,
  observacao text,
  registrado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendas_avulsas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendas_avulsas_select" ON public.vendas_avulsas FOR SELECT TO authenticated USING (true);
CREATE POLICY "vendas_avulsas_insert" ON public.vendas_avulsas FOR INSERT TO authenticated WITH CHECK (is_gestor_or_admin() OR (auth.uid() = registrado_por));
CREATE POLICY "vendas_avulsas_update" ON public.vendas_avulsas FOR UPDATE TO authenticated USING (is_gestor_or_admin());
CREATE POLICY "vendas_avulsas_delete" ON public.vendas_avulsas FOR DELETE TO authenticated USING (is_gestor_or_admin());

CREATE TRIGGER update_vendas_avulsas_updated_at BEFORE UPDATE ON public.vendas_avulsas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
