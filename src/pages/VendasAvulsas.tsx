import { useState } from 'react';
import { cap } from '@/lib/labels';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { KPICard } from '@/components/KPICard';
import { toast } from 'sonner';
import { Plus, Package, Milk, Leaf, DollarSign } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ReportMenu } from '@/components/ReportMenu';

const tipoConfig: Record<string, { label: string; icon: any; unidades: string[]; color: string }> = {
  silo: { label: 'Silo', icon: Package, unidades: ['sacos', 'toneladas', 'kg'], color: 'bg-amber-100 text-amber-800' },
  leite: { label: 'Leite', icon: Milk, unidades: ['litros', 'kg'], color: 'bg-blue-100 text-blue-800' },
  esterco: { label: 'Esterco', icon: Leaf, unidades: ['sacos', 'toneladas', 'carradas'], color: 'bg-emerald-100 text-emerald-800' },
};

export default function VendasAvulsas() {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState('silo');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const queryClient = useQueryClient();
  const { isGestorOrAdmin } = useAuth();

  const { data: vendas, isLoading } = useQuery({
    queryKey: ['vendas_avulsas', filtroTipo],
    queryFn: async () => {
      let q = supabase.from('vendas_avulsas').select('*').order('data', { ascending: false });
      if (filtroTipo !== 'todos') q = q.eq('tipo', filtroTipo);
      const { data, error } = await q.limit(200);
      if (error) throw error;
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const quantidade = Number(formData.get('quantidade'));
      const preco_unitario = Number(formData.get('preco_unitario')) || 0;
      const { error } = await supabase.from('vendas_avulsas').insert({
        tipo,
        quantidade,
        unidade: formData.get('unidade') as string,
        preco_unitario,
        valor_total: quantidade * preco_unitario,
        comprador: formData.get('comprador') as string || null,
        data: formData.get('data') as string,
        forma_pagamento: formData.get('forma_pagamento') as string || null,
        observacao: formData.get('observacao') as string || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas_avulsas'] });
      toast.success('Venda registrada!');
      setOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const totalVendas = vendas?.reduce((s, v) => s + Number(v.valor_total || 0), 0) || 0;
  const vendasMes = vendas?.filter(v => {
    const d = new Date(v.data);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }) || [];
  const totalMes = vendasMes.reduce((s, v) => s + Number(v.valor_total || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Vendas Avulsas</h1>
          <p className="text-muted-foreground">Venda de silo, leite e esterco ao público</p>
        </div>
        <div className="flex gap-2">
          <ReportMenu config={{
            title: 'Relatório de Vendas Avulsas',
            columns: [
              { header: 'Data', key: 'data' },
              { header: 'Tipo', key: 'tipo' },
              { header: 'Quantidade', key: 'quantidade' },
              { header: 'Unidade', key: 'unidade' },
              { header: 'Comprador', key: 'comprador' },
              { header: 'Valor Total', key: 'valor_total' },
            ],
            data: (vendas || []).map(v => ({ ...v, valor_total: Number(v.valor_total || 0).toFixed(2) })),
            kpis: [
              { label: 'Total Vendas', value: `R$ ${totalVendas.toFixed(2)}` },
              { label: 'Vendas no Mês', value: vendasMes.length },
              { label: 'Total Mês', value: `R$ ${totalMes.toFixed(2)}` },
            ],
          }} />
          {isGestorOrAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                <Plus className="h-4 w-4 mr-2" /> Nova Venda
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Registrar Venda</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(new FormData(e.currentTarget)); }} className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={tipo} onValueChange={setTipo}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="silo">Silo</SelectItem>
                      <SelectItem value="leite">Leite</SelectItem>
                      <SelectItem value="esterco">Esterco</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quantidade</Label>
                    <Input name="quantidade" type="number" step="0.1" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Unidade</Label>
                    <Select name="unidade" defaultValue={tipoConfig[tipo].unidades[0]}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {tipoConfig[tipo].unidades.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Preço Unitário (R$)</Label>
                    <Input name="preco_unitario" type="number" step="0.01" />
                  </div>
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input name="data" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Comprador</Label>
                  <Input name="comprador" placeholder="Nome do comprador" />
                </div>
                <div className="space-y-2">
                  <Label>Forma de Pagamento</Label>
                  <Select name="forma_pagamento" defaultValue="dinheiro">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="cartao">Cartão</SelectItem>
                      <SelectItem value="fiado">Fiado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Observação</Label>
                  <Textarea name="observacao" rows={2} />
                </div>
                <Button type="submit" className="w-full" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Salvando...' : 'Registrar Venda'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="Total Geral" value={`R$ ${totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={<DollarSign className="h-5 w-5" />} />
        <KPICard title="Total do Mês" value={`R$ ${totalMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={<DollarSign className="h-5 w-5" />} />
        <KPICard title="Vendas no Mês" value={String(vendasMes.length)} icon={<Package className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Label>Filtrar:</Label>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="silo">Silo</SelectItem>
                <SelectItem value="leite">Leite</SelectItem>
                <SelectItem value="esterco">Esterco</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Preço Unit.</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Comprador</TableHead>
                  <TableHead>Pagamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : vendas && vendas.length > 0 ? vendas.map(v => (
                  <TableRow key={v.id}>
                    <TableCell>{format(new Date(v.data + 'T12:00:00'), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>
                      <Badge className={tipoConfig[v.tipo]?.color || ''} variant="outline">
                        {tipoConfig[v.tipo]?.label || v.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>{Number(v.quantidade)} {v.unidade}</TableCell>
                    <TableCell>R$ {Number(v.preco_unitario || 0).toFixed(2)}</TableCell>
                    <TableCell className="font-medium">R$ {Number(v.valor_total || 0).toFixed(2)}</TableCell>
                    <TableCell>{v.comprador || '—'}</TableCell>
                    <TableCell>{cap(v.forma_pagamento) || '—'}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma venda registrada</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
