
ALTER TABLE public.partos ADD COLUMN observacao text;

CREATE TABLE public.complicacoes_parto (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parto_id uuid REFERENCES public.partos(id) ON DELETE CASCADE NOT NULL,
  animal_id uuid REFERENCES public.animais(id) ON DELETE CASCADE NOT NULL,
  tipo text NOT NULL,
  data_inicio date NOT NULL,
  data_fim date,
  tratamento text,
  observacao text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.complicacoes_parto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "complicacoes_parto_select" ON public.complicacoes_parto FOR SELECT TO authenticated USING (true);
CREATE POLICY "complicacoes_parto_insert" ON public.complicacoes_parto FOR INSERT TO authenticated WITH CHECK (is_gestor_or_admin());
CREATE POLICY "complicacoes_parto_update" ON public.complicacoes_parto FOR UPDATE TO authenticated USING (is_gestor_or_admin());
CREATE POLICY "complicacoes_parto_delete" ON public.complicacoes_parto FOR DELETE TO authenticated USING (is_gestor_or_admin());

CREATE TRIGGER update_complicacoes_parto_updated_at BEFORE UPDATE ON public.complicacoes_parto FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
