
-- Tabela de aplicações hormonais (Boostin, Lactotropin, etc.)
CREATE TABLE public.aplicacoes_hormonais (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  animal_id uuid NOT NULL REFERENCES public.animais(id) ON DELETE CASCADE,
  tipo text NOT NULL, -- 'boostin', 'lactotropin', 'outro'
  data_aplicacao date NOT NULL,
  observacao text,
  registrado_por uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.aplicacoes_hormonais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aplicacoes_hormonais_select" ON public.aplicacoes_hormonais
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "aplicacoes_hormonais_insert" ON public.aplicacoes_hormonais
  FOR INSERT TO authenticated
  WITH CHECK (is_gestor_or_admin() OR (auth.uid() = registrado_por));

CREATE POLICY "aplicacoes_hormonais_update" ON public.aplicacoes_hormonais
  FOR UPDATE TO authenticated USING (is_gestor_or_admin());

CREATE POLICY "aplicacoes_hormonais_delete" ON public.aplicacoes_hormonais
  FOR DELETE TO authenticated USING (is_gestor_or_admin());

-- Permitir que qualquer autenticado crie tarefas (não só gestor/admin)
DROP POLICY IF EXISTS "tarefas_insert" ON public.tarefas;
CREATE POLICY "tarefas_insert" ON public.tarefas
  FOR INSERT TO authenticated WITH CHECK (true);
