import { cap } from "@/lib/labels";
import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const origemLabel: Record<string, string> = {
  animais: 'Cadastro de animais', protocolo_animais: 'Protocolos', coberturas: 'Coberturas',
  parcerias: 'Parcerias', vacinacoes: 'Vacinações', movimentacoes: 'Compra/Venda',
  pesagens_2020: 'Pesagens 2020', controle_leiteiro_2017: 'Leite 2017',
};

export default function PendenciasImportacao() {
  const qc = useQueryClient();
  const { isGestorOrAdmin } = useAuth();
  const [origem, setOrigem] = useState<string>('todas');
  const [mostrarResolvidas, setMostrarResolvidas] = useState(false);

  const { data = [], isLoading } = useQuery({
    queryKey: ['importacao_pendencias'],
    queryFn: async () => {
      const { data, error } = await supabase.from('importacao_pendencias')
        .select('*, animal:animais(id, nome, brinco)').order('origem').order('created_at');
      if (error) throw error;
      return data as any[];
    },
  });

  const resolver = useMutation({
    mutationFn: async ({ id, resolvida }: { id: string; resolvida: boolean }) => {
      const { error } = await supabase.from('importacao_pendencias').update({ resolvida }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['importacao_pendencias'] }),
    onError: (e: any) => toast.error(e.message),
  });

  const contagem = useMemo(() => {
    const c: Record<string, number> = {};
    data.filter(p => !p.resolvida).forEach(p => { c[p.origem] = (c[p.origem] || 0) + 1; });
    return c;
  }, [data]);

  const lista = data.filter(p => (mostrarResolvidas || !p.resolvida) && (origem === 'todas' || p.origem === origem));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Pendências da importação</h1>
        <p className="text-sm text-muted-foreground">Itens da planilha antiga que precisam de conferência ou complemento.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant={origem === 'todas' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setOrigem('todas')}>
          Todas ({Object.values(contagem).reduce((a, b) => a + b, 0)})
        </Badge>
        {Object.entries(contagem).map(([o, n]) => (
          <Badge key={o} variant={origem === o ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setOrigem(o)}>
            {origemLabel[o] || o} ({n})
          </Badge>
        ))}
        <Button size="sm" variant="ghost" onClick={() => setMostrarResolvidas(v => !v)}>
          {mostrarResolvidas ? 'Ocultar resolvidas' : 'Mostrar resolvidas / histórico'}
        </Button>
      </div>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">{lista.length} itens</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Origem</TableHead><TableHead>Motivo</TableHead><TableHead>Animal</TableHead>
              <TableHead>Dados da planilha</TableHead><TableHead />
            </TableRow></TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={5}>Carregando...</TableCell></TableRow>}
              {lista.map(p => {
                const d = p.dados || {};
                const resumo = d.texto_original || d.nome_na_planilha || d.nome || d.mencoes_parceria || d.marcador_no_nome || '';
                return (
                  <TableRow key={p.id} className={p.resolvida ? 'opacity-50' : ''}>
                    <TableCell className="whitespace-nowrap">{origemLabel[p.origem] || p.origem}</TableCell>
                    <TableCell>{cap(p.motivo)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {p.animal ? <Link className="text-primary underline" to={`/animais/${p.animal.id}/perfil`}>{p.animal.brinco ? `${p.animal.brinco} - ` : ''}{p.animal.nome}</Link> : (d.brinco ? `Brinco ${d.brinco}` : '—')}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-md">
                      {resumo}{d.linha_planilha || d.linha ? ` (linha ${d.linha_planilha || d.linha})` : ''}
                    </TableCell>
                    <TableCell>
                      {isGestorOrAdmin && (
                        <Button size="sm" variant="outline" onClick={() => resolver.mutate({ id: p.id, resolvida: !p.resolvida })}>
                          {p.resolvida ? 'Reabrir' : 'Resolvido'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
