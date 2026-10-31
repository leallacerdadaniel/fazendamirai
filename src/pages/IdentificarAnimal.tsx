import { cap } from "@/lib/labels";
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Loader2, ScanSearch } from 'lucide-react';
import { toast } from 'sonner';

async function resize(file: File): Promise<string> {
  const img = await createImageBitmap(file);
  const s = Math.min(1, 1280 / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = img.width * s; c.height = img.height * s;
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.85);
}

export default function IdentificarAnimal() {
  const navigate = useNavigate();
  const input = useRef<HTMLInputElement>(null);
  const [foto, setFoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<any>(null);

  const analisar = async (file?: File) => {
    if (!file) return;
    setRes(null); setLoading(true);
    try {
      const image = await resize(file);
      setFoto(image);
      const { data, error } = await supabase.functions.invoke('identify-animal', { body: { image } });
      if (error) throw new Error((await (error as any).context?.json?.())?.error || error.message);
      if (data?.error) throw new Error(data.error);
      setRes(data);
    } catch (e: any) { toast.error(e.message || 'Falha ao identificar'); }
    finally { setLoading(false); if (input.current) input.current.value = ''; }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Identificar animal por foto</h1>
        <p className="text-muted-foreground">Tire uma foto da vaca (de preferência mostrando o brinco) e a IA procura o registro dela.</p>
      </div>
      <input ref={input} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => analisar(e.target.files?.[0])} />
      <Button size="lg" className="h-16 w-full text-base" onClick={() => input.current?.click()} disabled={loading}>
        {loading ? <Loader2 className="animate-spin" /> : <Camera />} {loading ? 'Analisando foto...' : 'Tirar ou escolher foto'}
      </Button>
      {foto && <img src={foto} alt="Foto enviada" className="max-h-80 w-full rounded-lg object-cover" />}
      {res && (
        <Card><CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Brinco lido: {res.brinco_lido || 'não visível'}</Badge>
            <Badge variant="outline">{res.referencias} fotos de referência no sistema</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{res.descricao}</p>
          {res.matches.length === 0 ? (
            <p className="text-sm">Nenhum registro encontrado. Tente uma foto mais próxima do brinco{res.referencias === 0 ? ', ou cadastre fotos nos perfis para a IA conseguir comparar pela pelagem' : ''}.</p>
          ) : res.matches.map((m: any) => (
            <button key={m.id} type="button" onClick={() => navigate(`/animais/${m.id}/perfil`)} className="flex w-full items-center gap-3 rounded-lg bg-muted/50 p-3 text-left hover:bg-muted">
              {m.foto_url ? <img src={m.foto_url} alt="" className="h-14 w-14 rounded-md object-cover" /> : <span className="tone-icon flex h-14 w-14 items-center justify-center rounded-md"><ScanSearch /></span>}
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{m.nome || 'Sem nome'} {m.brinco && <span className="text-muted-foreground">· {m.brinco}</span>}</span>
                <span className="block text-xs text-muted-foreground">{cap(m.motivo)}</span>
              </span>
              <Badge>{Math.round(m.confianca)}%</Badge>
            </button>
          ))}
        </CardContent></Card>
      )}
    </div>
  );
}
