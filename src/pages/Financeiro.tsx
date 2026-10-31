import { cap } from "@/lib/labels";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { KPICard } from '@/components/KPICard';
import { toast } from 'sonner';
import { Plus, Trash2, DollarSign, TrendingUp, TrendingDown, BarChart3, ChevronRight, ChevronDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { ReportMenu } from '@/components/ReportMenu';

const centrosCustoDespesa = [
  'Plantio', 'Ração', 'Pessoal', 'Compra de Gado', 'Ordenha', 'Embriões',
  'Trator', 'Construção', 'Combustível', 'Manutenção', 'Veterinário',
  'Medicamentos', 'Sêmen', 'Girolando', 'Equipamento', 'Genoma',
  'Propaganda', 'ABCZ', 'Internet', 'Holandês', 'Pivot', 'Outros',
];

const centrosCustoReceita = [
  'Venda de Gado', 'Venda de Leite', 'Venda de Sêmen', 'Venda de Embriões',
  'Venda de Silo', 'Venda de Esterco', 'Venda de Carne', 'Outros',
];

const centrosCustoInvestimento = [
  'Compra de Gado', 'Construção', 'Equipamento', 'Pivot', 'Trator',
  'Genoma', 'Embriões', 'Sêmen', 'Outros',
];

const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function DRESection({ label, items, total, lancamentos, fmt, colorClass, negate }: {
  label: string;
  items: { centro: string; valor: number }[];
  total: number;
  lancamentos: any[];
  fmt: (v: number) => string;
  colorClass: string;
  negate?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [openCentros, setOpenCentros] = useState<Record<string, boolean>>({});

  const toggleCentro = (centro: string) =>
    setOpenCentros(prev => ({ ...prev, [centro]: !prev[centro] }));

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex justify-between items-center w-full py-2 px-3 rounded-md hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <span className={`font-bold text-base ${colorClass}`}>{label}</span>
        </div>
        <span className={`font-bold ${colorClass}`}>{negate ? `(${fmt(total)})` : fmt(total)}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-6 space-y-0.5">
        {items.map(item => {
          const centroLancamentos = lancamentos.filter(l => l.centro_custo === item.centro);
          const isOpen = openCentros[item.centro] || false;
          return (
            <Collapsible key={item.centro} open={isOpen} onOpenChange={() => toggleCentro(item.centro)}>
              <CollapsibleTrigger className="flex justify-between items-center w-full py-1.5 px-3 rounded hover:bg-muted/50 transition-colors text-sm">
                <div className="flex items-center gap-2">
                  {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  <span>{item.centro}</span>
                  <span className="text-muted-foreground text-xs">
                    ({total > 0 ? ((item.valor / total) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
                <span className="font-medium">{fmt(item.valor)}</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-8">
                {centroLancamentos.map(l => (
                  <div key={l.id} className="flex justify-between items-center py-1 px-3 text-xs text-muted-foreground border-l-2 border-muted ml-1">
                    <div className="flex gap-3">
                      <span className="text-foreground/60">{new Date(l.data_lancamento + 'T12:00').toLocaleDateString('pt-BR')}</span>
                      <span>{l.descricao}</span>
                    </div>
                    <span className="font-medium text-foreground/80">{fmt(Number(l.valor))}</span>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function Financeiro() {
  const [open, setOpen] = useState(false);
  const [ano, setAno] = useState(new Date().getFullYear());
  const qc = useQueryClient();

  const [form, setForm] = useState({
    data_lancamento: new Date().toISOString().slice(0, 10),
    descricao: '', valor: '', tipo: 'despesa' as string,
    centro_custo: '', competencia: '',
  });

  const { data: lancamentos = [] } = useQuery({
    queryKey: ['lancamentos', ano],
    queryFn: async () => {
      const { data } = await supabase.from('lancamentos').select('*')
        .gte('competencia', `${ano}-01`).lte('competencia', `${ano}-12`)
        .order('data_lancamento', { ascending: false });
      return data || [];
    },
  });

  const totalReceitas = lancamentos.filter(l => l.tipo === 'receita').reduce((s, l) => s + Number(l.valor), 0);
  const totalDespesas = lancamentos.filter(l => l.tipo === 'despesa' || l.tipo === 'investimento').reduce((s, l) => s + Number(l.valor), 0);
  const totalInvestimentos = lancamentos.filter(l => l.tipo === 'investimento').reduce((s, l) => s + Number(l.valor), 0);
  const saldo = totalReceitas - totalDespesas;
  const totalGeral = lancamentos.reduce((s, l) => s + Number(l.valor), 0);

  const chartData = meses.map((m, i) => {
    const comp = `${ano}-${String(i + 1).padStart(2, '0')}`;
    const rec = lancamentos.filter(l => l.tipo === 'receita' && l.competencia === comp).reduce((s, l) => s + Number(l.valor), 0);
    const desp = lancamentos.filter(l => l.tipo === 'despesa' && l.competencia === comp).reduce((s, l) => s + Number(l.valor), 0);
    return { mes: m, Receitas: rec, Despesas: desp, Saldo: rec - desp };
  });

  const dreDespesas = centrosCustoDespesa.map(cc => ({
    centro: cc,
    valor: lancamentos.filter(l => l.tipo === 'despesa' && l.centro_custo === cc).reduce((s, l) => s + Number(l.valor), 0),
  })).filter(d => d.valor > 0).sort((a, b) => b.valor - a.valor);

  const dreReceitas = centrosCustoReceita.map(cc => ({
    centro: cc,
    valor: lancamentos.filter(l => l.tipo === 'receita' && l.centro_custo === cc).reduce((s, l) => s + Number(l.valor), 0),
  })).filter(d => d.valor > 0).sort((a, b) => b.valor - a.valor);

  const save = useMutation({
    mutationFn: async () => {
      const comp = form.data_lancamento.slice(0, 7);
      const { error } = await supabase.from('lancamentos').insert({
        ...form, valor: Number(form.valor), competencia: form.competencia || comp,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lancamentos'] });
      toast.success('Lançamento salvo!');
      setOpen(false);
      setForm({ data_lancamento: new Date().toISOString().slice(0, 10), descricao: '', valor: '', tipo: 'despesa', centro_custo: '', competencia: '' });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('lancamentos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lancamentos'] }); toast.success('Excluído!'); },
  });

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Financeiro</h1>
          <p className="text-muted-foreground">Receitas, despesas e DRE</p>
        </div>
        <div className="flex gap-2 items-center">
          <ReportMenu config={{
            title: `Relatório Financeiro — ${ano}`,
            columns: [
              { header: 'Data', key: 'data_lancamento' },
              { header: 'Competência', key: 'competencia' },
              { header: 'Descrição', key: 'descricao' },
              { header: 'Centro de Custo', key: 'centro_custo' },
              { header: 'Tipo', key: 'tipo' },
              { header: 'Valor (R$)', key: 'valor' },
            ],
            data: lancamentos.map(l => ({ ...l, valor: Number(l.valor).toFixed(2) })),
            kpis: [
              { label: 'Receitas', value: fmt(totalReceitas) },
              { label: 'Despesas', value: fmt(totalDespesas) },
              { label: 'Saldo', value: fmt(saldo) },
              { label: 'Lançamentos', value: lancamentos.length },
            ],
            orientation: 'landscape',
          }} />
          <Select value={String(ano)} onValueChange={v => setAno(Number(v))}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="bg-secondary text-secondary-foreground"><Plus className="h-4 w-4 mr-1" />Novo Lançamento</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Lançamento</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Tipo</Label>
                    <Select value={cap(form.tipo)} onValueChange={v => setForm(f => ({ ...f, tipo: v, centro_custo: '' }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="despesa">Despesa</SelectItem>
                        <SelectItem value="receita">Receita</SelectItem>
                        <SelectItem value="investimento">Investimento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label>Centro de Custo</Label>
                    <Select value={form.centro_custo} onValueChange={v => setForm(f => ({ ...f, centro_custo: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {(form.tipo === 'despesa' ? centrosCustoDespesa : form.tipo === 'investimento' ? centrosCustoInvestimento : centrosCustoReceita).map(cc => (
                          <SelectItem key={cc} value={cc}>{cc}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1"><Label>Descrição</Label>
                  <Input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Valor (R$)</Label>
                    <Input type="number" step="0.01" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} />
                  </div>
                  <div className="space-y-1"><Label>Data</Label>
                    <Input type="date" value={form.data_lancamento} onChange={e => setForm(f => ({ ...f, data_lancamento: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1"><Label>Competência (AAAA-MM)</Label>
                  <Input value={form.competencia} onChange={e => setForm(f => ({ ...f, competencia: e.target.value }))} placeholder="Ex: 2025-03" />
                </div>
                <Button onClick={() => save.mutate()} disabled={!form.descricao || !form.valor || !form.centro_custo} className="w-full bg-secondary text-secondary-foreground">
                  Salvar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard title="Receitas" value={fmt(totalReceitas)} icon={<TrendingUp className="h-5 w-5" />} />
        <KPICard title="Despesas" value={fmt(totalDespesas)} icon={<TrendingDown className="h-5 w-5" />} />
        <KPICard title="Saldo" value={fmt(saldo)} icon={<DollarSign className="h-5 w-5" />} />
        <KPICard title="Lançamentos" value={String(lancamentos.length)} icon={<BarChart3 className="h-5 w-5" />} />
      </div>

      <Tabs defaultValue="lancamentos">
        <TabsList>
          <TabsTrigger value="lancamentos">Lançamentos</TabsTrigger>
          <TabsTrigger value="fluxo">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="dre">DRE</TabsTrigger>
        </TabsList>

        <TabsContent value="fluxo">
          <Card>
            <CardHeader><CardTitle>Fluxo de Caixa Mensal — {ano}</CardTitle></CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                  <Bar dataKey="Receitas" fill="hsl(142, 71%, 45%)" />
                  <Bar dataKey="Despesas" fill="hsl(0, 84%, 60%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dre">
          <Card>
            <CardHeader>
              <CardTitle>Demonstração do Resultado — {ano}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {/* RECEITAS */}
              <DRESection
                label="Receitas"
                items={dreReceitas}
                total={totalReceitas}
                lancamentos={lancamentos.filter(l => l.tipo === 'receita')}
                fmt={fmt}
                colorClass="text-green-600"
              />

              {/* DESPESAS */}
              <DRESection
                label="Despesas"
                items={dreDespesas}
                total={totalDespesas}
                lancamentos={lancamentos.filter(l => l.tipo === 'despesa')}
                fmt={fmt}
                colorClass="text-destructive"
                negate
              />

              {/* RESULTADO */}
              <div className="flex justify-between items-center pt-4 border-t-2 border-foreground/20 mt-4">
                <span className="text-lg font-bold">Resultado Líquido</span>
                <span className={`text-lg font-bold ${saldo >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                  {fmt(saldo)}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lancamentos">
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Competência</TableHead>
                    <TableHead>Data do Lançamento</TableHead>
                    <TableHead>Despesa/Produto</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Centro de Custos</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead className="text-right">% Geral</TableHead>
                    <TableHead className="text-right">% Mensal</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lancamentos.map(l => {
                    const mesComp = l.competencia || '';
                    const lancamentosMes = lancamentos.filter(x => x.competencia === mesComp);
                    const totalMes = lancamentosMes.reduce((s, x) => s + Number(x.valor), 0);
                    const pctGeral = totalGeral > 0 ? ((Number(l.valor) / totalGeral) * 100).toFixed(2) : '0,00';
                    const pctMensal = totalMes > 0 ? ((Number(l.valor) / totalMes) * 100).toFixed(2) : '0,00';
                    const tipoLabel = l.tipo === 'receita' ? 'Receita' : l.tipo === 'investimento' ? 'Investimento' : 'Despesa';
                    const tipoCor = l.tipo === 'receita' ? 'bg-green-100 text-green-800' : l.tipo === 'investimento' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800';
                    return (
                      <TableRow key={l.id}>
                        <TableCell className="text-muted-foreground">{mesComp ? `${mesComp.split('-')[1]}/${mesComp.split('-')[0]}` : '—'}</TableCell>
                        <TableCell>{new Date(l.data_lancamento + 'T12:00').toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="font-medium">{l.descricao}</TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">{Number(l.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell>{l.centro_custo}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${tipoCor}`}>{tipoLabel}</span>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground tabular-nums">{pctGeral.replace('.', ',')}%</TableCell>
                        <TableCell className="text-right text-muted-foreground tabular-nums">{pctMensal.replace('.', ',')}%</TableCell>
                        <TableCell><Button variant="ghost" size="icon" onClick={() => del.mutate(l.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
