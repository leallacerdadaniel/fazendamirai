import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KPICard } from '@/components/KPICard';
import { toast } from 'sonner';
import { Plus, Trash2, Wheat, DollarSign, Scale } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ReportMenu } from '@/components/ReportMenu';

const ingredientesSugeridos = [
  'Silagem de Milho', 'Silagem de Sorgo', 'Ração Concentrada', 'Farelo de Soja',
  'Caroço de Algodão', 'Polpa Cítrica', 'Sal Mineral', 'Sal Proteinado',
  'Feno', 'Capim Picado', 'Milho Moído', 'Ureia', 'Bicarbonato', 'Gordura Protegida',
];

export default function Nutricao() {
  const [openAdd, setOpenAdd] = useState(false);
  const [selectedLote, setSelectedLote] = useState<string>('todos');
  const queryClient = useQueryClient();
  const { isGestorOrAdmin } = useAuth();

  const { data: lotes } = useQuery({
    queryKey: ['lotes'],
    queryFn: async () => {
      const { data } = await supabase.from('lotes').select('id, nome').order('nome');
      return data || [];
    },
  });

  const { data: dietas, isLoading } = useQuery({
    queryKey: ['dietas_lote', selectedLote],
    queryFn: async () => {
      let q = supabase.from('dietas_lote').select('*, lotes(nome)').order('lote_id');
      if (selectedLote !== 'todos') q = q.eq('lote_id', selectedLote);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const { data: animaisPorLote } = useQuery({
    queryKey: ['animais_count_por_lote'],
    queryFn: async () => {
      const { data } = await supabase.from('animais').select('lote_id').eq('status', 'ativo').not('lote_id', 'is', null);
      const counts: Record<string, number> = {};
      data?.forEach(a => { counts[a.lote_id!] = (counts[a.lote_id!] || 0) + 1; });
      return counts;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const { error } = await supabase.from('dietas_lote').insert({
        lote_id: formData.get('lote_id') as string,
        ingrediente: formData.get('ingrediente') as string,
        quantidade_kg: Number(formData.get('quantidade_kg')),
        custo_kg: Number(formData.get('custo_kg')) || 0,
        observacao: formData.get('observacao') as string || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dietas_lote'] });
      toast.success('Ingrediente adicionado à dieta!');
      setOpenAdd(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('dietas_lote').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dietas_lote'] });
      toast.success('Ingrediente removido');
    },
  });

  // Group diets by lot
  const dietasPorLote: Record<string, { nome: string; items: typeof dietas }> = {};
  dietas?.forEach((d: any) => {
    if (!dietasPorLote[d.lote_id]) {
      dietasPorLote[d.lote_id] = { nome: d.lotes?.nome || 'Sem lote', items: [] };
    }
    dietasPorLote[d.lote_id].items!.push(d);
  });

  const custoTotalDiario = dietas?.reduce((s, d: any) => s + (Number(d.quantidade_kg) * Number(d.custo_kg || 0)), 0) || 0;
  const totalAnimais = Object.values(animaisPorLote || {}).reduce((s, c) => s + c, 0);

  const custoPorAnimalDia = totalAnimais > 0 ? custoTotalDiario / totalAnimais : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Nutrição</h1>
          <p className="text-muted-foreground">Dieta diária por lote e custos de alimentação</p>
        </div>
        <div className="flex gap-2">
          <ReportMenu config={{
            title: 'Relatório de Nutrição',
            columns: [
              { header: 'Lote', key: 'lote' },
              { header: 'Ingrediente', key: 'ingrediente' },
              { header: 'Kg/dia', key: 'quantidade_kg' },
              { header: 'R$/kg', key: 'custo_kg' },
              { header: 'Custo Diário', key: 'custo_diario' },
            ],
            data: (dietas || []).map((d: any) => ({
              lote: d.lotes?.nome || '—',
              ingrediente: d.ingrediente,
              quantidade_kg: d.quantidade_kg,
              custo_kg: Number(d.custo_kg || 0).toFixed(2),
              custo_diario: (Number(d.quantidade_kg) * Number(d.custo_kg || 0)).toFixed(2),
            })),
            kpis: [
              { label: 'Custo Total/dia', value: `R$ ${custoTotalDiario.toFixed(2)}` },
              { label: 'Custo/animal/dia', value: `R$ ${custoPorAnimalDia.toFixed(2)}` },
              { label: 'Total Animais', value: totalAnimais },
            ],
          }} />
          {isGestorOrAdmin && (
            <Dialog open={openAdd} onOpenChange={setOpenAdd}>
              <DialogTrigger asChild>
                <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                  <Plus className="h-4 w-4 mr-2" /> Adicionar Ingrediente
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Adicionar Ingrediente à Dieta</DialogTitle></DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); addMutation.mutate(new FormData(e.currentTarget)); }} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Lote</Label>
                    <select name="lote_id" required className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                      <option value="">Selecione o lote</option>
                      {lotes?.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ingrediente</Label>
                    <select name="ingrediente" required className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                      <option value="">Selecione</option>
                      {ingredientesSugeridos.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Quantidade (kg/dia)</Label>
                      <Input name="quantidade_kg" type="number" step="0.1" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Custo (R$/kg)</Label>
                      <Input name="custo_kg" type="number" step="0.01" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Observação</Label>
                    <Input name="observacao" />
                  </div>
                  <Button type="submit" className="w-full" disabled={addMutation.isPending}>
                    {addMutation.isPending ? 'Salvando...' : 'Adicionar'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="Custo Diário Total" value={`R$ ${custoTotalDiario.toFixed(2)}`} icon={<DollarSign className="h-5 w-5" />} />
        <KPICard title="Custo/Animal/Dia" value={`R$ ${custoPorAnimalDia.toFixed(2)}`} icon={<Scale className="h-5 w-5" />} />
        <KPICard title="Custo Mensal Estimado" value={`R$ ${(custoTotalDiario * 30).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={<Wheat className="h-5 w-5" />} />
      </div>

      <div className="flex items-center gap-2">
        <Label>Filtrar Lote:</Label>
        <Select value={selectedLote} onValueChange={setSelectedLote}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Lotes</SelectItem>
            {lotes?.map(l => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Carregando...</CardContent></Card>
      ) : Object.keys(dietasPorLote).length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhuma dieta definida. Adicione ingredientes aos lotes.</CardContent></Card>
      ) : (
        Object.entries(dietasPorLote).map(([loteId, { nome, items }]) => {
          const numAnimais = animaisPorLote?.[loteId] || 0;
          const custoDiarioLote = items!.reduce((s, d: any) => s + (Number(d.quantidade_kg) * Number(d.custo_kg || 0) * numAnimais), 0);
          return (
            <Card key={loteId}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{nome}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{numAnimais} animais</span>
                    <span className="font-medium text-foreground">R$ {custoDiarioLote.toFixed(2)}/dia</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ingrediente</TableHead>
                      <TableHead>Qtd/Animal/Dia (kg)</TableHead>
                      <TableHead>Custo/kg</TableHead>
                      <TableHead>Custo/Animal/Dia</TableHead>
                      <TableHead>Custo Lote/Dia</TableHead>
                      {isGestorOrAdmin && <TableHead className="w-10"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items!.map((d: any) => {
                      const custoAnimalDia = Number(d.quantidade_kg) * Number(d.custo_kg || 0);
                      return (
                        <TableRow key={d.id}>
                          <TableCell className="font-medium">{d.ingrediente}</TableCell>
                          <TableCell>{Number(d.quantidade_kg).toFixed(1)}</TableCell>
                          <TableCell>R$ {Number(d.custo_kg || 0).toFixed(2)}</TableCell>
                          <TableCell>R$ {custoAnimalDia.toFixed(2)}</TableCell>
                          <TableCell className="font-medium">R$ {(custoAnimalDia * numAnimais).toFixed(2)}</TableCell>
                          {isGestorOrAdmin && (
                            <TableCell>
                              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(d.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
