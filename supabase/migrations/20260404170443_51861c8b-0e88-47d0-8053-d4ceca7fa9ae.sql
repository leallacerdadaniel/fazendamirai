
ALTER TABLE public.animais ADD COLUMN tetos integer NOT NULL DEFAULT 4;

ALTER TABLE public.producao_leite_diaria ADD COLUMN com_mastite boolean NOT NULL DEFAULT false;
ALTER TABLE public.producao_leite_diaria ADD COLUMN usa_ocitocina boolean NOT NULL DEFAULT false;
