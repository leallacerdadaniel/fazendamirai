import { cap } from "@/lib/labels";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search } from 'lucide-react';

const statusColors: Record<string, string> = {
  ativo: 'bg-success/10 text-success',
  vendido: 'bg-warning/10 text-warning',
  morto: 'bg-destructive/10 text-destructive',
  descartado: 'bg-muted text-muted-foreground',
};

export default function MobileRebanho() {
  const [search, setSearch] = useState('');

  const { data: animais, isLoading } = useQuery({
    queryKey: ['mobile-animais', search],
    queryFn: async () => {
      let q = supabase.from('animais').select('id, brinco, nome, tipo, raca_sangue, status, nascimento').order('nome');
      if (search) {
        q = q.or(`nome.ilike.%${search}%,brinco.ilike.%${search}%,rgd.ilike.%${search}%`);
      }
      const { data, error } = await q.limit(50);
      if (error) throw error;
      return data;
    },
  });

  const calcIdade = (nascimento: string | null) => {
    if (!nascimento) return '';
    const meses = Math.floor((Date.now() - new Date(nascimento).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
    if (meses < 12) return `${meses}m`;
    return `${Math.floor(meses / 12)}a ${meses % 12}m`;
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-heading font-bold">Rebanho</h1>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, brinco ou RGD..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">Carregando...</p>
      ) : animais && animais.length > 0 ? (
        animais.map((a) => (
          <Card key={a.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{a.nome || a.brinco || 'Sem nome'}</p>
                  <p className="text-sm text-muted-foreground">
                    {cap(a.tipo)} • {a.raca_sangue || '—'} {calcIdade(a.nascimento) && `• ${calcIdade(a.nascimento)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {a.brinco && <span className="text-xs font-mono text-muted-foreground">#{a.brinco}</span>}
                  <Badge className={statusColors[a.status]}>{cap(a.status)}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <p className="text-center text-muted-foreground py-8">Nenhum animal encontrado</p>
      )}
    </div>
  );
}
