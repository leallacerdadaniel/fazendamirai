
CREATE TABLE public.vendas_genetica (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  animal_id UUID NOT NULL REFERENCES public.animais(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'prenhez',
  comprador TEXT,
  valor NUMERIC NOT NULL DEFAULT 0,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vendas_genetica ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendas_genetica_select" ON public.vendas_genetica FOR SELECT TO authenticated USING (true);
CREATE POLICY "vendas_genetica_insert" ON public.vendas_genetica FOR INSERT TO authenticated WITH CHECK (is_gestor_or_admin());
CREATE POLICY "vendas_genetica_update" ON public.vendas_genetica FOR UPDATE TO authenticated USING (is_gestor_or_admin());
CREATE POLICY "vendas_genetica_delete" ON public.vendas_genetica FOR DELETE TO authenticated USING (is_gestor_or_admin());

CREATE TRIGGER update_vendas_genetica_updated_at BEFORE UPDATE ON public.vendas_genetica FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
