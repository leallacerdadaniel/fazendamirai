CREATE TABLE public.grupos_socios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  divisor numeric NOT NULL DEFAULT 2,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.grupo_animais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id uuid NOT NULL REFERENCES public.grupos_socios(id) ON DELETE CASCADE,
  animal_id uuid NOT NULL REFERENCES public.animais(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (grupo_id, animal_id)
);
CREATE TABLE public.fechamentos_socios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id uuid NOT NULL REFERENCES public.grupos_socios(id) ON DELETE CASCADE,
  mes integer NOT NULL,
  ano integer NOT NULL,
  pago boolean NOT NULL DEFAULT false,
  data_pagamento date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (grupo_id, mes, ano)
);
CREATE TABLE public.fechamento_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fechamento_id uuid NOT NULL REFERENCES public.fechamentos_socios(id) ON DELETE CASCADE,
  descritivo text NOT NULL,
  tipo text NOT NULL DEFAULT 'despesa',
  qtd_animal numeric,
  dias numeric,
  valor_unit numeric,
  qtd_kg numeric,
  total_manual numeric,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
DO $$ DECLARE t text; BEGIN
FOREACH t IN ARRAY ARRAY['grupos_socios','grupo_animais','fechamentos_socios','fechamento_itens'] LOOP
  EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
  EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  EXECUTE format('CREATE POLICY "auth read" ON public.%I FOR SELECT TO authenticated USING (true)', t);
  EXECUTE format('CREATE POLICY "gestor insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_gestor_or_admin())', t);
  EXECUTE format('CREATE POLICY "gestor update" ON public.%I FOR UPDATE TO authenticated USING (public.is_gestor_or_admin())', t);
  EXECUTE format('CREATE POLICY "gestor delete" ON public.%I FOR DELETE TO authenticated USING (public.is_gestor_or_admin())', t);
END LOOP; END $$;