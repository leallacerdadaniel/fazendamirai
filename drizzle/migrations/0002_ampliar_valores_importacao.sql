ALTER TABLE public.reproducoes DROP CONSTRAINT IF EXISTS reproducoes_metodo_check;
ALTER TABLE public.reproducoes ADD CONSTRAINT reproducoes_metodo_check CHECK (metodo = ANY (ARRAY['IA','TE','COB','IATF','Monta Natural','Não informado']));
ALTER TABLE public.reproducoes DROP CONSTRAINT IF EXISTS reproducoes_resultado_check;
ALTER TABLE public.reproducoes ADD CONSTRAINT reproducoes_resultado_check CHECK (resultado = ANY (ARRAY['prenha','nao_prenha','aguardando','retoque']));
ALTER TABLE public.diagnosticos_gestacao DROP CONSTRAINT IF EXISTS diagnosticos_gestacao_metodo_check;
ALTER TABLE public.diagnosticos_gestacao ADD CONSTRAINT diagnosticos_gestacao_metodo_check CHECK (metodo = ANY (ARRAY['ultrassom','retal','Ultrassom','Palpação','Exame de sangue','Importado da planilha']));
ALTER TABLE public.transacoes_animais DROP CONSTRAINT IF EXISTS transacoes_animais_tipo_check;
ALTER TABLE public.transacoes_animais ADD CONSTRAINT transacoes_animais_tipo_check CHECK (tipo = ANY (ARRAY['compra','venda','transferencia','abate','baixa']));
ALTER TABLE public.animais ADD COLUMN IF NOT EXISTS betacaseina_laudo text;