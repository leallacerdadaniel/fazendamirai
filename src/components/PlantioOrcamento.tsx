import { cap } from "@/lib/labels";
import { useMemo, useState, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

const ETAPAS = ['pré plantio', 'plantio', 'condução', 'colheita', 'pós colheita', 'despesas financeiras'];
const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const num = (v: number, d = 1) => v.toLocaleString('pt-BR', { maximumFractionDigits: d });

export function PlantioOrcamento() {
  const qc = useQueryClient();
  const [sel, setSel] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ etapa: 'condução', categoria: 'insumo', especificacao: '', descricao: '', unidade: '', quantidade: '', valor_unitario: '' });

  const { data: plantios = [] } = useQuery({ queryKey: ['plantios-orc'], queryFn: async () => {
    const { data } = await supabase.from('plantios').select('*').not('safra', 'is', null).order('nome'); return data || [];
  } });
  const plantioId = sel || plantios[0]?.id;
  const plantio: any = plantios.find(p => p.id === plantioId);

  const { data: itens = [] } = useQuery({ queryKey: ['plantio-custos', plantioId], enabled: !!plantioId, queryFn: async () => {
    const { data } = await supabase.from('plantio_custos').select('*').eq('plantio_id', plantioId!).order('ordem'); return data || [];
  } });

  const calc = useMemo(() => {
    const area = Number(plantio?.area_ha ?? 0);
    const prod = Number(plantio?.produtividade_esperada_ton_ha ?? 0);
    const preco = Number(plantio?.preco_mercado_ton ?? 0);
    const perda = Number(plantio?.perda_pct ?? 0) / 100;
    const ms = Number(plantio?.materia_seca_pct ?? 0) / 100;
    const total = (i: any) => Number(i.quantidade ?? 0) * Number(i.valor_unitario ?? 0);
    const porEtapa = ETAPAS.map(e => ({ etapa: e, valor: itens.filter(i => i.etapa === e).reduce((s, i) => s + total(i), 0) }));
    const coe = porEtapa.reduce((s, e) => s + e.valor, 0);
    const cot = coe * (1 + perda);
    const ton = area * prod;
    const ctHa = area ? cot / area : 0;
    const rb = prod * preco;
    const rl = rb - ctHa;
    return { area, prod, preco, total, porEtapa, coe, cot, ton, ctHa, rb, rl, perda,
      custoTon: ton ? cot / ton : 0, equilibrio: preco ? ctHa / preco : 0, retorno: ctHa ? rl / ctHa : 0,
      lucro: rl * area, msTon: ton * ms };
  }, [plantio, itens]);

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('plantio_custos').insert({ ...form, plantio_id: plantioId!, quantidade: Number(form.quantidade) || 0, valor_unitario: Number(form.valor_unitario) || 0, ordem: itens.length + 1 });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['plantio-custos'] }); toast.success('Item adicionado'); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('plantio_custos').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plantio-custos'] }),
    onError: (e: any) => toast.error(e.message),
  });

  if (!plantios.length) return <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum orçamento de plantio cadastrado.</CardContent></Card>;

  const kpis = [
    ['Custo total (COT)', brl(calc.cot)], ['Custo / ha', brl(calc.ctHa)], ['Custo / tonelada', brl(calc.custoTon)],
    ['Produção esperada', `${num(calc.ton, 0)} t`], ['Receita líquida / ha', brl(calc.rl)], ['Lucro líquido', brl(calc.lucro)],
    ['Ponto de equilíbrio', `${num(calc.equilibrio)} t/ha`], ['Taxa de retorno', `${num(calc.retorno * 100)}%`], ['Matéria seca', `${num(calc.msTon)} t`],
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 justify-between">
        <div className="space-y-1 min-w-64">
          <Label>Lavoura</Label>
          <Select value={plantioId} onValueChange={setSel}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{plantios.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.nome} · {p.safra}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="outline"><Plus className="h-4 w-4 mr-1" />Adicionar item</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Novo item de custo</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Etapa</Label>
                  <Select value={form.etapa} onValueChange={v => setForm(f => ({ ...f, etapa: v }))}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ETAPAS.map(e => <SelectItem key={e} value={e} className="capitalize">{e}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1"><Label>Tipo</Label>
                  <Select value={cap(form.categoria)} onValueChange={v => setForm(f => ({ ...f, categoria: v }))}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="operacao">Operação</SelectItem><SelectItem value="insumo">Insumo</SelectItem><SelectItem value="despesa">Despesa</SelectItem></SelectContent></Select></div>
              </div>
              <div className="space-y-1"><Label>Especificação</Label><Input value={form.especificacao} onChange={e => setForm(f => ({ ...f, especificacao: e.target.value }))} placeholder="Herbicida, Adubo..." /></div>
              <div className="space-y-1"><Label>Produto / Fornecedor</Label><Input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1"><Label>Unid.</Label><Input value={form.unidade} onChange={e => setForm(f => ({ ...f, unidade: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Qtd. total</Label><Input type="number" value={form.quantidade} onChange={e => setForm(f => ({ ...f, quantidade: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Valor unit.</Label><Input type="number" step="0.01" value={form.valor_unitario} onChange={e => setForm(f => ({ ...f, valor_unitario: e.target.value }))} /></div>
              </div>
              <Button onClick={() => add.mutate()} disabled={!form.especificacao} className="w-full bg-secondary text-secondary-foreground">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {plantio && (
        <p className="text-sm text-muted-foreground">
          {plantio.sistema} · {num(calc.area)} ha · {plantio.variedade} · produtividade {num(calc.prod, 0)} t/ha · preço {brl(calc.preco)}/t · perda {num(calc.perda * 100, 0)}%
          {plantio.responsavel_tecnico && <> · Resp. técnico: {plantio.responsavel_tecnico}</>}
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {kpis.map(([t, v]) => <Card key={t}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{t}</p><p className="text-lg font-bold">{v}</p></CardContent></Card>)}
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Custos por etapa</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {calc.porEtapa.map(e => (
            <div key={e.etapa} className="flex items-center gap-3 text-sm">
              <span className="w-40 capitalize">{e.etapa}</span>
              <div className="flex-1 h-2 rounded bg-muted overflow-hidden"><div className="h-full bg-secondary" style={{ width: `${calc.coe ? (e.valor / calc.coe) * 100 : 0}%` }} /></div>
              <span className="w-28 text-right">{brl(e.valor)}</span>
              <span className="w-14 text-right text-muted-foreground">{num(calc.coe ? (e.valor / calc.coe) * 100 : 0)}%</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card><CardContent className="pt-4 overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Especificação</TableHead><TableHead>Produto</TableHead><TableHead>Unid.</TableHead>
            <TableHead className="text-right">Qtd. total</TableHead><TableHead className="text-right">Qtd./ha</TableHead>
            <TableHead className="text-right">Valor unit.</TableHead><TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">R$/ha</TableHead><TableHead className="text-right">DPP</TableHead><TableHead />
          </TableRow></TableHeader>
          <TableBody>
            {ETAPAS.map(et => {
              const rows = itens.filter(i => i.etapa === et);
              if (!rows.length) return null;
              return (
                <Fragment key={et}>
                  <TableRow className="bg-muted/50"><TableCell colSpan={10} className="font-semibold capitalize">{et}</TableCell></TableRow>
                  {rows.map((i: any) => (
                    <TableRow key={i.id}>
                      <TableCell>{i.especificacao} <Badge variant="outline" className="ml-1 text-[10px]">{i.categoria === 'insumo' ? 'insumo' : i.categoria === 'despesa' ? 'despesa' : 'operação'}</Badge></TableCell>
                      <TableCell>{i.descricao || '-'}</TableCell>
                      <TableCell>{i.unidade || '-'}</TableCell>
                      <TableCell className="text-right">{num(Number(i.quantidade ?? 0), 2)}</TableCell>
                      <TableCell className="text-right">{calc.area ? num(Number(i.quantidade ?? 0) / calc.area, 2) : '-'}</TableCell>
                      <TableCell className="text-right">{brl(Number(i.valor_unitario ?? 0))}</TableCell>
                      <TableCell className="text-right font-medium">{brl(calc.total(i))}</TableCell>
                      <TableCell className="text-right">{calc.area ? brl(calc.total(i) / calc.area) : '-'}</TableCell>
                      <TableCell className="text-right">{i.dpp ?? '-'}</TableCell>
                      <TableCell><Button size="icon" variant="ghost" onClick={() => del.mutate(i.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                </Fragment>
              );
            })}
            <TableRow className="font-semibold"><TableCell colSpan={6}>Custo operacional efetivo (COE)</TableCell><TableCell className="text-right">{brl(calc.coe)}</TableCell><TableCell className="text-right">{calc.area ? brl(calc.coe / calc.area) : '-'}</TableCell><TableCell colSpan={2} /></TableRow>
            <TableRow><TableCell colSpan={6}>Perda / deterioração ({num(calc.perda * 100, 0)}%)</TableCell><TableCell className="text-right">{brl(calc.cot - calc.coe)}</TableCell><TableCell colSpan={3} /></TableRow>
            <TableRow className="font-bold"><TableCell colSpan={6}>Custo operacional total (COT)</TableCell><TableCell className="text-right">{brl(calc.cot)}</TableCell><TableCell className="text-right">{brl(calc.ctHa)}</TableCell><TableCell colSpan={2} /></TableRow>
          </TableBody>
        </Table>
        <p className="text-xs text-muted-foreground mt-2">DPP = dias em relação ao plantio (negativo = antes do plantio).</p>
      </CardContent></Card>
    </div>
  );
}
