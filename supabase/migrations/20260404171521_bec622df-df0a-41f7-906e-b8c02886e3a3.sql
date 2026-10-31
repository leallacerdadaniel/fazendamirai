
-- Adicionar campos de categoria, cor e coordenadas geográficas aos lotes
ALTER TABLE public.lotes 
  ADD COLUMN IF NOT EXISTS categoria text DEFAULT 'geral',
  ADD COLUMN IF NOT EXISTS cor text DEFAULT '#3B82F6',
  ADD COLUMN IF NOT EXISTS coordenadas jsonb,
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric;
