
-- =============================================
-- FAZENDA MIRAÍ - SCHEMA COMPLETO
-- =============================================

-- 1. Enum de papéis
CREATE TYPE public.app_role AS ENUM ('gestor', 'colaborador', 'administrador');

-- 2. Tabela de perfis
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT '',
  email TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Tabela de papéis (separada)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'colaborador',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- 4. Helper function: has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 5. Helper: is gestor or admin
CREATE OR REPLACE FUNCTION public.is_gestor_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('gestor', 'administrador')
  )
$$;

-- 6. Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 7. Trigger para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'name', ''), NEW.email);
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'colaborador');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- TABELAS DE DADOS DA FAZENDA
-- =============================================

-- LOTES
CREATE TABLE public.lotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT,
  capacidade INTEGER,
  piquete TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ANIMAIS
CREATE TABLE public.animais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brinco TEXT,
  cgn TEXT,
  rgd TEXT,
  nome TEXT,
  sexo TEXT CHECK (sexo IN ('macho', 'femea')),
  tipo TEXT CHECK (tipo IN ('bezerra', 'novilha', 'vaca', 'touro', 'bezerro')),
  raca_sangue TEXT,
  nascimento DATE,
  lote_id UUID REFERENCES public.lotes(id),
  pai_nome TEXT,
  pai_rgd TEXT,
  mae_nome TEXT,
  mae_rgd TEXT,
  vg INTEGER,
  gpta NUMERIC,
  pta NUMERIC,
  betacaseina TEXT CHECK (betacaseina IN ('A1A1', 'A1A2', 'A2A2')),
  dna TEXT,
  aspiracoes_fiv INTEGER DEFAULT 0,
  avaliacao TEXT,
  registro_racial TEXT,
  cdc TEXT,
  cdn TEXT,
  percentual_propriedade NUMERIC DEFAULT 100,
  parceiro_nome TEXT,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'vendido', 'morto', 'descartado')),
  observacoes TEXT,
  origem TEXT,
  receptora_usada TEXT,
  peso_compra NUMERIC,
  valor_compra NUMERIC,
  data_compra DATE,
  comprador TEXT,
  data_venda DATE,
  peso_venda NUMERIC,
  valor_venda NUMERIC,
  gta_numero TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PESAGENS
CREATE TABLE public.pesagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID NOT NULL REFERENCES public.animais(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  peso_kg NUMERIC NOT NULL,
  ocasiao TEXT CHECK (ocasiao IN ('nascimento', 'desmama', 'mensal', 'venda', 'compra')),
  registrado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PRODUCAO LEITE DIARIA
CREATE TABLE public.producao_leite_diaria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  turno TEXT CHECK (turno IN ('manha', 'tarde', 'total')),
  animal_id UUID REFERENCES public.animais(id),
  lote_id UUID REFERENCES public.lotes(id),
  litros NUMERIC NOT NULL,
  registrado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CONTROLE LEITEIRO
CREATE TABLE public.controle_leiteiro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID NOT NULL REFERENCES public.animais(id) ON DELETE CASCADE,
  data_coleta DATE NOT NULL,
  gordura_pct NUMERIC,
  proteina_pct NUMERIC,
  lactose_pct NUMERIC,
  st NUMERIC,
  esd NUMERIC,
  ccs NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- NOTA COOPERATIVA
CREATE TABLE public.nota_cooperativa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  ano INTEGER NOT NULL,
  quantidade_litros NUMERIC,
  valor_unitario NUMERIC,
  bonif_temperatura NUMERIC DEFAULT 0,
  bonif_geral NUMERIC DEFAULT 0,
  bonif_qualidade NUMERIC DEFAULT 0,
  adicional_mercado NUMERIC DEFAULT 0,
  bonif_fidelidade NUMERIC DEFAULT 0,
  valor_bruto NUMERIC,
  inss_rat_senar NUMERIC DEFAULT 0,
  frete NUMERIC DEFAULT 0,
  adiantamento NUMERIC DEFAULT 0,
  outros_desc TEXT,
  outros_valor NUMERIC DEFAULT 0,
  valor_liquido NUMERIC,
  cbt NUMERIC,
  ccs NUMERIC,
  materia_gorda NUMERIC,
  proteina_pct NUMERIC,
  comprabst NUMERIC,
  pct_aproveitamento NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- VALES LEITE
CREATE TABLE public.vales_leite (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  litros NUMERIC NOT NULL,
  cbt NUMERIC,
  ccs NUMERIC,
  gordura NUMERIC,
  proteina NUMERIC,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- VENDA GRANEL
CREATE TABLE public.venda_granel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  comprador TEXT NOT NULL,
  litros NUMERIC NOT NULL,
  preco_litro NUMERIC NOT NULL,
  valor_total NUMERIC,
  status_pagamento TEXT DEFAULT 'pendente' CHECK (status_pagamento IN ('pendente', 'pago', 'parcial')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- REPRODUCOES
CREATE TABLE public.reproducoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID NOT NULL REFERENCES public.animais(id) ON DELETE CASCADE,
  metodo TEXT NOT NULL CHECK (metodo IN ('IA', 'TE', 'COB', 'IATF')),
  data DATE NOT NULL,
  touro_nome TEXT,
  touro_rgd TEXT,
  semen_partida TEXT,
  embriao_info TEXT,
  receptora_id UUID REFERENCES public.animais(id),
  tecnico TEXT,
  protocolo TEXT,
  resultado TEXT DEFAULT 'aguardando' CHECK (resultado IN ('prenha', 'nao_prenha', 'aguardando')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- DIAGNOSTICOS GESTACAO
CREATE TABLE public.diagnosticos_gestacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID NOT NULL REFERENCES public.animais(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  metodo TEXT CHECK (metodo IN ('ultrassom', 'retal')),
  resultado TEXT CHECK (resultado IN ('positivo', 'negativo', 'inconclusivo')),
  dias_gestacao INTEGER,
  previsao_parto DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PARTOS
CREATE TABLE public.partos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vaca_id UUID NOT NULL REFERENCES public.animais(id) ON DELETE CASCADE,
  bezerro_id UUID REFERENCES public.animais(id),
  data DATE NOT NULL,
  facilidade TEXT,
  peso_bezerro_kg NUMERIC,
  colostro BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SECAGENS
CREATE TABLE public.secagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID NOT NULL REFERENCES public.animais(id) ON DELETE CASCADE,
  data_secagem DATE NOT NULL,
  data_ultima_ordenha DATE,
  tratamento TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PROTOCOLOS IATF
CREATE TABLE public.protocolos_iatf (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  data_inicio DATE,
  touro_nome TEXT,
  touro_rgd TEXT,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.protocolo_animais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo_id UUID NOT NULL REFERENCES public.protocolos_iatf(id) ON DELETE CASCADE,
  animal_id UUID NOT NULL REFERENCES public.animais(id) ON DELETE CASCADE,
  resultado TEXT DEFAULT 'aguardando',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ESTOQUE SEMEN
CREATE TABLE public.estoque_semen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  touro_nome TEXT NOT NULL,
  raca TEXT,
  rgd TEXT,
  partida TEXT,
  doses INTEGER DEFAULT 0,
  custo NUMERIC,
  vg INTEGER,
  gpta NUMERIC,
  betacaseina TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ESTOQUE EMBRIOES
CREATE TABLE public.estoque_embrioes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doadora_nome TEXT,
  touro_nome TEXT,
  grau TEXT,
  tanque TEXT,
  palheta TEXT,
  sexagem TEXT,
  custo NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- VACINAS
CREATE TABLE public.vacinas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  fabricante TEXT,
  lote TEXT,
  validade DATE,
  doses INTEGER DEFAULT 0,
  temp_armazenamento TEXT,
  custo NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- VACINACOES
CREATE TABLE public.vacinacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID NOT NULL REFERENCES public.animais(id) ON DELETE CASCADE,
  vacina_id UUID REFERENCES public.vacinas(id),
  data DATE NOT NULL,
  lote TEXT,
  responsavel UUID REFERENCES auth.users(id),
  proxima_dose DATE,
  campanha_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CAMPANHAS VACINACAO
CREATE TABLE public.campanhas_vacinacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  vacina_id UUID REFERENCES public.vacinas(id),
  data DATE,
  responsavel TEXT,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- MEDICAMENTOS
CREATE TABLE public.medicamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  principio_ativo TEXT,
  carencia_dias INTEGER DEFAULT 0,
  lote TEXT,
  validade DATE,
  quantidade NUMERIC DEFAULT 0,
  custo NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TRATAMENTOS
CREATE TABLE public.tratamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID NOT NULL REFERENCES public.animais(id) ON DELETE CASCADE,
  diagnostico TEXT,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  responsavel UUID REFERENCES auth.users(id),
  desfecho TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.tratamento_medicamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tratamento_id UUID NOT NULL REFERENCES public.tratamentos(id) ON DELETE CASCADE,
  medicamento_id UUID REFERENCES public.medicamentos(id),
  dose TEXT,
  via TEXT,
  frequencia TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- MASTITES
CREATE TABLE public.mastites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID NOT NULL REFERENCES public.animais(id) ON DELETE CASCADE,
  quarto TEXT,
  resultado_cmt TEXT,
  data_inicio DATE NOT NULL,
  tratamento TEXT,
  descarte_dias INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PLANTIOS
CREATE TABLE public.plantios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cultura TEXT NOT NULL,
  area_ha NUMERIC,
  data DATE,
  variedade TEXT,
  custo_semente NUMERIC,
  fertilizante TEXT,
  fase TEXT DEFAULT 'plantio',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SILOS
CREATE TABLE public.silos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identificacao TEXT NOT NULL,
  tonelagem_inicial NUMERIC DEFAULT 0,
  tonelagem_atual NUMERIC DEFAULT 0,
  data_corte DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CONSUMO SILO
CREATE TABLE public.consumo_silo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  silo_id UUID NOT NULL REFERENCES public.silos(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  lote_id UUID REFERENCES public.lotes(id),
  quantidade_ton NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- VENDA SILO
CREATE TABLE public.venda_silo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  comprador TEXT NOT NULL,
  tonelagem NUMERIC NOT NULL,
  preco_ton NUMERIC,
  status_pagamento TEXT DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ESTOQUE ITENS
CREATE TABLE public.estoque_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  categoria TEXT CHECK (categoria IN ('medicamentos', 'vacinas', 'racao', 'sementes', 'fertilizantes', 'defensivos', 'ferramentas', 'pecas', 'epis')),
  unidade TEXT,
  quantidade NUMERIC DEFAULT 0,
  quantidade_minima NUMERIC DEFAULT 0,
  validade DATE,
  localizacao TEXT,
  custo NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- MOVIMENTACOES ESTOQUE
CREATE TABLE public.movimentacoes_estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.estoque_itens(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'ajuste')),
  quantidade NUMERIC NOT NULL,
  motivo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- LANCAMENTOS FINANCEIROS
CREATE TABLE public.lancamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competencia TEXT,
  data_lancamento DATE NOT NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  centro_custo TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa', 'investimento')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TRANSACOES ANIMAIS
CREATE TABLE public.transacoes_animais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('compra', 'venda')),
  data DATE NOT NULL,
  animais_ids UUID[],
  contraparte TEXT,
  peso_kg NUMERIC,
  valor_total NUMERIC,
  valor_arroba NUMERIC,
  gta_numero TEXT,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- VENDA CARNE
CREATE TABLE public.venda_carne (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente TEXT,
  valor NUMERIC NOT NULL,
  forma_pagamento TEXT,
  observacao TEXT,
  receptora TEXT,
  peso_arroba NUMERIC,
  data DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PARCERIAS
CREATE TABLE public.parcerias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID NOT NULL REFERENCES public.animais(id) ON DELETE CASCADE,
  parceiro_nome TEXT NOT NULL,
  percentual NUMERIC NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- EQUIPAMENTOS
CREATE TABLE public.equipamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT,
  marca TEXT,
  modelo TEXT,
  ano INTEGER,
  numero_serie TEXT,
  custo NUMERIC,
  data_compra DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- MANUTENCOES
CREATE TABLE public.manutencoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipamento_id UUID NOT NULL REFERENCES public.equipamentos(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  tipo TEXT CHECK (tipo IN ('preventiva', 'corretiva')),
  descricao TEXT,
  custo NUMERIC,
  responsavel TEXT,
  proxima_manutencao DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TAREFAS
CREATE TABLE public.tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  colaborador_id UUID REFERENCES auth.users(id),
  prazo DATE,
  prioridade TEXT DEFAULT 'media' CHECK (prioridade IN ('alta', 'media', 'baixa')),
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluida', 'nao_realizada')),
  motivo_nao_realizada TEXT,
  modulo_relacionado TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- UPDATED_AT TRIGGERS
-- =============================================
CREATE TRIGGER update_lotes_updated_at BEFORE UPDATE ON public.lotes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_animais_updated_at BEFORE UPDATE ON public.animais FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_nota_cooperativa_updated_at BEFORE UPDATE ON public.nota_cooperativa FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_venda_granel_updated_at BEFORE UPDATE ON public.venda_granel FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reproducoes_updated_at BEFORE UPDATE ON public.reproducoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_protocolos_iatf_updated_at BEFORE UPDATE ON public.protocolos_iatf FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_estoque_semen_updated_at BEFORE UPDATE ON public.estoque_semen FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_estoque_embrioes_updated_at BEFORE UPDATE ON public.estoque_embrioes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vacinas_updated_at BEFORE UPDATE ON public.vacinas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_campanhas_updated_at BEFORE UPDATE ON public.campanhas_vacinacao FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_medicamentos_updated_at BEFORE UPDATE ON public.medicamentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tratamentos_updated_at BEFORE UPDATE ON public.tratamentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_mastites_updated_at BEFORE UPDATE ON public.mastites FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_plantios_updated_at BEFORE UPDATE ON public.plantios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_silos_updated_at BEFORE UPDATE ON public.silos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_venda_silo_updated_at BEFORE UPDATE ON public.venda_silo FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_estoque_itens_updated_at BEFORE UPDATE ON public.estoque_itens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lancamentos_updated_at BEFORE UPDATE ON public.lancamentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_transacoes_updated_at BEFORE UPDATE ON public.transacoes_animais FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_parcerias_updated_at BEFORE UPDATE ON public.parcerias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_equipamentos_updated_at BEFORE UPDATE ON public.equipamentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_manutencoes_updated_at BEFORE UPDATE ON public.manutencoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tarefas_updated_at BEFORE UPDATE ON public.tarefas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- RLS POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pesagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producao_leite_diaria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.controle_leiteiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nota_cooperativa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vales_leite ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venda_granel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reproducoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnosticos_gestacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocolos_iatf ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocolo_animais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_semen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_embrioes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacinacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campanhas_vacinacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tratamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tratamento_medicamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mastites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plantios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.silos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumo_silo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venda_silo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lancamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacoes_animais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venda_carne ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcerias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manutencoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE TO authenticated USING (public.is_gestor_or_admin());
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- USER_ROLES policies
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_gestor_or_admin());
CREATE POLICY "user_roles_manage" ON public.user_roles FOR ALL TO authenticated USING (public.is_gestor_or_admin()) WITH CHECK (public.is_gestor_or_admin());

-- MACRO: For most farm tables - all authenticated can read, gestor/admin can write
-- We'll create a function to simplify

-- LOTES
CREATE POLICY "lotes_select" ON public.lotes FOR SELECT TO authenticated USING (true);
CREATE POLICY "lotes_insert" ON public.lotes FOR INSERT TO authenticated WITH CHECK (public.is_gestor_or_admin());
CREATE POLICY "lotes_update" ON public.lotes FOR UPDATE TO authenticated USING (public.is_gestor_or_admin());
CREATE POLICY "lotes_delete" ON public.lotes FOR DELETE TO authenticated USING (public.is_gestor_or_admin());

-- ANIMAIS
CREATE POLICY "animais_select" ON public.animais FOR SELECT TO authenticated USING (true);
CREATE POLICY "animais_insert" ON public.animais FOR INSERT TO authenticated WITH CHECK (public.is_gestor_or_admin());
CREATE POLICY "animais_update" ON public.animais FOR UPDATE TO authenticated USING (public.is_gestor_or_admin());
CREATE POLICY "animais_delete" ON public.animais FOR DELETE TO authenticated USING (public.is_gestor_or_admin());

-- PESAGENS (colaborador pode registrar)
CREATE POLICY "pesagens_select" ON public.pesagens FOR SELECT TO authenticated USING (true);
CREATE POLICY "pesagens_insert" ON public.pesagens FOR INSERT TO authenticated WITH CHECK (public.is_gestor_or_admin() OR auth.uid() = registrado_por);
CREATE POLICY "pesagens_update" ON public.pesagens FOR UPDATE TO authenticated USING (public.is_gestor_or_admin());
CREATE POLICY "pesagens_delete" ON public.pesagens FOR DELETE TO authenticated USING (public.is_gestor_or_admin());

-- PRODUCAO LEITE (colaborador pode registrar)
CREATE POLICY "producao_select" ON public.producao_leite_diaria FOR SELECT TO authenticated USING (true);
CREATE POLICY "producao_insert" ON public.producao_leite_diaria FOR INSERT TO authenticated WITH CHECK (public.is_gestor_or_admin() OR auth.uid() = registrado_por);
CREATE POLICY "producao_update" ON public.producao_leite_diaria FOR UPDATE TO authenticated USING (public.is_gestor_or_admin());
CREATE POLICY "producao_delete" ON public.producao_leite_diaria FOR DELETE TO authenticated USING (public.is_gestor_or_admin());

-- VACINACOES (colaborador pode registrar)
CREATE POLICY "vacinacoes_select" ON public.vacinacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "vacinacoes_insert" ON public.vacinacoes FOR INSERT TO authenticated WITH CHECK (public.is_gestor_or_admin() OR auth.uid() = responsavel);
CREATE POLICY "vacinacoes_update" ON public.vacinacoes FOR UPDATE TO authenticated USING (public.is_gestor_or_admin());
CREATE POLICY "vacinacoes_delete" ON public.vacinacoes FOR DELETE TO authenticated USING (public.is_gestor_or_admin());

-- TAREFAS (colaborador pode atualizar suas tarefas)
CREATE POLICY "tarefas_select" ON public.tarefas FOR SELECT TO authenticated USING (true);
CREATE POLICY "tarefas_insert" ON public.tarefas FOR INSERT TO authenticated WITH CHECK (public.is_gestor_or_admin());
CREATE POLICY "tarefas_update" ON public.tarefas FOR UPDATE TO authenticated USING (public.is_gestor_or_admin() OR colaborador_id = auth.uid());
CREATE POLICY "tarefas_delete" ON public.tarefas FOR DELETE TO authenticated USING (public.is_gestor_or_admin());

-- Standard read-all / write-admin for remaining tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'controle_leiteiro', 'nota_cooperativa', 'vales_leite', 'venda_granel',
    'reproducoes', 'diagnosticos_gestacao', 'partos', 'secagens',
    'protocolos_iatf', 'protocolo_animais', 'estoque_semen', 'estoque_embrioes',
    'vacinas', 'campanhas_vacinacao', 'medicamentos', 'tratamentos',
    'tratamento_medicamentos', 'mastites', 'plantios', 'silos', 'consumo_silo',
    'venda_silo', 'estoque_itens', 'movimentacoes_estoque', 'lancamentos',
    'transacoes_animais', 'venda_carne', 'parcerias', 'equipamentos', 'manutencoes'
  ])
  LOOP
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true)', tbl || '_select', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_gestor_or_admin())', tbl || '_insert', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.is_gestor_or_admin())', tbl || '_update', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.is_gestor_or_admin())', tbl || '_delete', tbl);
  END LOOP;
END $$;

-- Indexes
CREATE INDEX idx_animais_lote ON public.animais(lote_id);
CREATE INDEX idx_animais_status ON public.animais(status);
CREATE INDEX idx_animais_tipo ON public.animais(tipo);
CREATE INDEX idx_animais_brinco ON public.animais(brinco);
CREATE INDEX idx_pesagens_animal ON public.pesagens(animal_id);
CREATE INDEX idx_producao_data ON public.producao_leite_diaria(data);
CREATE INDEX idx_vacinacoes_animal ON public.vacinacoes(animal_id);
CREATE INDEX idx_tarefas_colaborador ON public.tarefas(colaborador_id);
CREATE INDEX idx_tarefas_status ON public.tarefas(status);
CREATE INDEX idx_lancamentos_tipo ON public.lancamentos(tipo);
CREATE INDEX idx_lancamentos_competencia ON public.lancamentos(competencia);
