ALTER TABLE public.animais
  ADD COLUMN IF NOT EXISTS associacao text,
  ADD COLUMN IF NOT EXISTS botton text,
  ADD COLUMN IF NOT EXISTS apelido text,
  ADD COLUMN IF NOT EXISTS categoria_registro text,
  ADD COLUMN IF NOT EXISTS composicao_racial text,
  ADD COLUMN IF NOT EXISTS status_associacao text,
  ADD COLUMN IF NOT EXISTS ultima_identificacao text,
  ADD COLUMN IF NOT EXISTS possui_rgd boolean,
  ADD COLUMN IF NOT EXISTS rgn_registro text,
  ADD COLUMN IF NOT EXISTS rgn_data_inspecao date,
  ADD COLUMN IF NOT EXISTS rgn_inspetor text,
  ADD COLUMN IF NOT EXISTS rgd_data_inspecao date,
  ADD COLUMN IF NOT EXISTS rgd_inspetor text,
  ADD COLUMN IF NOT EXISTS proprietario text,
  ADD COLUMN IF NOT EXISTS criador text,
  ADD COLUMN IF NOT EXISTS propriedade text,
  ADD COLUMN IF NOT EXISTS municipio_uf text,
  ADD COLUMN IF NOT EXISTS endogamia_pct numeric,
  ADD COLUMN IF NOT EXISTS lactacao_vitalicia_dias integer,
  ADD COLUMN IF NOT EXISTS lactacao_vitalicia_kg numeric,
  ADD COLUMN IF NOT EXISTS associacao_consultado_em timestamptz;

-- Ancestrais/parentes de fora do rebanho (até bisavós e filhos registrados)
CREATE TABLE public.animais_externos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registro text NOT NULL,
  nome text,
  sexo text,
  composicao_racial text,
  raca text,
  nascimento date,
  categoria text,
  pai_registro text,
  mae_registro text,
  animal_id uuid REFERENCES public.animais(id) ON DELETE SET NULL,
  fonte text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (registro)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.animais_externos TO authenticated;
GRANT ALL ON public.animais_externos TO service_role;
ALTER TABLE public.animais_externos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ver externos" ON public.animais_externos FOR SELECT TO authenticated USING (true);
CREATE POLICY "inserir externos" ON public.animais_externos FOR INSERT TO authenticated WITH CHECK (public.is_gestor_or_admin());
CREATE POLICY "editar externos" ON public.animais_externos FOR UPDATE TO authenticated USING (public.is_gestor_or_admin());
CREATE POLICY "apagar externos" ON public.animais_externos FOR DELETE TO authenticated USING (public.is_gestor_or_admin());
CREATE TRIGGER trg_animais_externos_upd BEFORE UPDATE ON public.animais_externos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Avaliações genéticas / genômicas e características lineares
CREATE TABLE public.avaliacoes_geneticas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id uuid NOT NULL REFERENCES public.animais(id) ON DELETE CASCADE,
  fonte text,
  ano integer,
  grupo text,
  caracteristica text NOT NULL,
  sigla text,
  valor numeric,
  unidade text,
  acuracia_pct numeric,
  data_avaliacao date,
  extra jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.avaliacoes_geneticas(animal_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.avaliacoes_geneticas TO authenticated;
GRANT ALL ON public.avaliacoes_geneticas TO service_role;
ALTER TABLE public.avaliacoes_geneticas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ver aval" ON public.avaliacoes_geneticas FOR SELECT TO authenticated USING (true);
CREATE POLICY "inserir aval" ON public.avaliacoes_geneticas FOR INSERT TO authenticated WITH CHECK (public.is_gestor_or_admin());
CREATE POLICY "editar aval" ON public.avaliacoes_geneticas FOR UPDATE TO authenticated USING (public.is_gestor_or_admin());
CREATE POLICY "apagar aval" ON public.avaliacoes_geneticas FOR DELETE TO authenticated USING (public.is_gestor_or_admin());

-- Lactações controladas oficiais
CREATE TABLE public.lactacoes_controladas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id uuid NOT NULL REFERENCES public.animais(id) ON DELETE CASCADE,
  fonte text,
  ordem integer,
  data_parto date,
  idade_parto text,
  dias_lactacao integer,
  intervalo_partos integer,
  numero_ordenhas integer,
  media_diaria_kg numeric,
  producao_kg numeric,
  data_encerramento date,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.lactacoes_controladas(animal_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lactacoes_controladas TO authenticated;
GRANT ALL ON public.lactacoes_controladas TO service_role;
ALTER TABLE public.lactacoes_controladas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ver lact" ON public.lactacoes_controladas FOR SELECT TO authenticated USING (true);
CREATE POLICY "inserir lact" ON public.lactacoes_controladas FOR INSERT TO authenticated WITH CHECK (public.is_gestor_or_admin());
CREATE POLICY "editar lact" ON public.lactacoes_controladas FOR UPDATE TO authenticated USING (public.is_gestor_or_admin());
CREATE POLICY "apagar lact" ON public.lactacoes_controladas FOR DELETE TO authenticated USING (public.is_gestor_or_admin());

-- Cópia original de cada consulta
CREATE TABLE public.consultas_associacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id uuid REFERENCES public.animais(id) ON DELETE CASCADE,
  fonte text NOT NULL,
  registro text,
  status text NOT NULL DEFAULT 'ok',
  payload jsonb,
  consultado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.consultas_associacao(animal_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultas_associacao TO authenticated;
GRANT ALL ON public.consultas_associacao TO service_role;
ALTER TABLE public.consultas_associacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ver consultas" ON public.consultas_associacao FOR SELECT TO authenticated USING (true);
CREATE POLICY "inserir consultas" ON public.consultas_associacao FOR INSERT TO authenticated WITH CHECK (public.is_gestor_or_admin());
CREATE POLICY "editar consultas" ON public.consultas_associacao FOR UPDATE TO authenticated USING (public.is_gestor_or_admin());
CREATE POLICY "apagar consultas" ON public.consultas_associacao FOR DELETE TO authenticated USING (public.is_gestor_or_admin());