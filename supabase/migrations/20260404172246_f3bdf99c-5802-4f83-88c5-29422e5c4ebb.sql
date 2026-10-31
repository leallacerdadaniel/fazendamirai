
-- Nutrition: daily diet per lot
CREATE TABLE public.dietas_lote (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lote_id uuid NOT NULL REFERENCES public.lotes(id) ON DELETE CASCADE,
  ingrediente text NOT NULL,
  quantidade_kg numeric NOT NULL DEFAULT 0,
  custo_kg numeric DEFAULT 0,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dietas_lote ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dietas_lote_select" ON public.dietas_lote FOR SELECT TO authenticated USING (true);
CREATE POLICY "dietas_lote_insert" ON public.dietas_lote FOR INSERT TO authenticated WITH CHECK (is_gestor_or_admin());
CREATE POLICY "dietas_lote_update" ON public.dietas_lote FOR UPDATE TO authenticated USING (is_gestor_or_admin());
CREATE POLICY "dietas_lote_delete" ON public.dietas_lote FOR DELETE TO authenticated USING (is_gestor_or_admin());
CREATE TRIGGER update_dietas_lote_updated_at BEFORE UPDATE ON public.dietas_lote FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Animal photo URL
ALTER TABLE public.animais ADD COLUMN IF NOT EXISTS foto_url text;

-- Storage bucket for animal photos
INSERT INTO storage.buckets (id, name, public) VALUES ('animal-photos', 'animal-photos', true);

CREATE POLICY "Anyone can view animal photos" ON storage.objects FOR SELECT USING (bucket_id = 'animal-photos');
CREATE POLICY "Authenticated users can upload animal photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'animal-photos');
CREATE POLICY "Authenticated users can update animal photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'animal-photos');
CREATE POLICY "Gestor can delete animal photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'animal-photos' AND public.is_gestor_or_admin());
