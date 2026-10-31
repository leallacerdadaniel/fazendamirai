import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Plus, FileText, DollarSign, TrendingUp, Droplets } from 'lucide-react';
import { KPICard } from '@/components/KPICard';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { ReportMenu } from '@/components/ReportMenu';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export default function Cooperativa() {
  const { isGestorOrAdmin } = useAuth();
  const qc = useQueryClient();
  const [anoFiltro, setAnoFiltro] = useState(new Date().getFullYear());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [valeDialogOpen, setValeDialogOpen] = useState(false);

  // Nota form state
  const [nota, setNota] = useState({
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    quantidade_litros: '',
    valor_unitario: '',
    bonif_temperatura: '0',
    bonif_qualidade: '0',
    bonif_fidelidade: '0',
    bonif_geral: '0',
    adicional_mercado: '0',
    inss_rat_senar: '0',
    frete: '0',
    adiantamento: '0',
    comprabst: '0',
    outros_valor: '0',
    outros_desc: '',
    ccs: '',
    cbt: '',
    materia_gorda: '',
    proteina_pct: '',
    pct_aproveitamento: '',
  });

  // Vale form state
  const [vale, setVale] = useState({
    data: new Date().toISOString().split('T')[0],
    litros: '',
    gordura: '',
    proteina: '',
    ccs: '',
    cbt: '',
    observacao: '',
  });

  // Computed values for nota
  const litros = Number(nota.quantidade_litros) || 0;
  const unitario = Number(nota.valor_unitario) || 0;
  const bonifTotal = [nota.bonif_temperatura, nota.bonif_qualidade, nota.bonif_fidelidade, nota.bonif_geral, nota.adicional_mercado]
    .reduce((a, v) => a + (Number(v) || 0), 0);
  const valorBruto = litros * unitario + bonifTotal;
  const descontoTotal = [nota.inss_rat_senar, nota.frete, nota.adiantamento, nota.comprabst, nota.outros_valor]
    .reduce((a, v) => a + (Number(v) || 0), 0);
  const valorLiquido = valorBruto - descontoTotal;
  const liquidoPorLitro = litros > 0 ? valorLiquido / litros : 0;

  // Fetch notas do ano
  const { data: notas } = useQuery({
    queryKey: ['notas-cooperativa', anoFiltro],
    queryFn: async () => {
      const { data } = await supabase
        .from('nota_cooperativa')
        .select('*')
        .eq('ano', anoFiltro)
        .order('mes');
      return data || [];
    },
  });

  // Fetch vales
  const [mesFiltroVale, setMesFiltroVale] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const valeInicio = `${mesFiltroVale}-01`;
  const valeFim = (() => {
    const [y, m] = mesFiltroVale.split('-').map(Number);
    return `${mesFiltroVale}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`;
  })();

  const { data: vales } = useQuery({
    queryKey: ['vales-leite', mesFiltroVale],
    queryFn: async () => {
      const { data } = await supabase
        .from('vales_leite')
        .select('*')
        .gte('data', valeInicio)
        .lte('data', valeFim)
        .order('data', { ascending: false });
      return data || [];
    },
  });

  // KPIs
  const totalLitrosAno = useMemo(() => notas?.reduce((a, n) => a + (Number(n.quantidade_litros) || 0), 0) || 0, [notas]);
  const totalLiquidoAno = useMemo(() => notas?.reduce((a, n) => a + (Number(n.valor_liquido) || 0), 0) || 0, [notas]);
  const mediaLitro = totalLitrosAno > 0 ? totalLiquidoAno / totalLitrosAno : 0;
  const totalValesMes = useMemo(() => vales?.reduce((a, v) => a + Number(v.litros), 0) || 0, [vales]);

  // Chart evolução anual
  const chartAnual = useMemo(() => {
    return MESES.map((m, i) => {
      const n = notas?.find(x => x.mes === i + 1);
      return {
        mes: m.slice(0, 3),
        litros: Number(n?.quantidade_litros) || 0,
        liquido: Number(n?.valor_liquido) || 0,
      };
    });
  }, [notas]);

  // Insert nota
  const insertNota = useMutation({
    mutationFn: async () => {
      const payload = {
        mes: nota.mes,
        ano: nota.ano,
        quantidade_litros: Number(nota.quantidade_litros) || null,
        valor_unitario: Number(nota.valor_unitario) || null,
        bonif_temperatura: Number(nota.bonif_temperatura) || 0,
        bonif_qualidade: Number(nota.bonif_qualidade) || 0,
        bonif_fidelidade: Number(nota.bonif_fidelidade) || 0,
        bonif_geral: Number(nota.bonif_geral) || 0,
        adicional_mercado: Number(nota.adicional_mercado) || 0,
        inss_rat_senar: Number(nota.inss_rat_senar) || 0,
        frete: Number(nota.frete) || 0,
        adiantamento: Number(nota.adiantamento) || 0,
        comprabst: Number(nota.comprabst) || 0,
        outros_valor: Number(nota.outros_valor) || 0,
        outros_desc: nota.outros_desc || null,
        ccs: Number(nota.ccs) || null,
        cbt: Number(nota.cbt) || null,
        materia_gorda: Number(nota.materia_gorda) || null,
        proteina_pct: Number(nota.proteina_pct) || null,
        pct_aproveitamento: Number(nota.pct_aproveitamento) || null,
        valor_bruto: valorBruto,
        valor_liquido: valorLiquido,
      };
      const { error } = await supabase.from('nota_cooperativa').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Nota registrada com sucesso');
      qc.invalidateQueries({ queryKey: ['notas-cooperativa'] });
      setDialogOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Insert vale
  const insertVale = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('vales_leite').insert({
        data: vale.data,
        litros: Number(vale.litros),
        gordura: Number(vale.gordura) || null,
        proteina: Number(vale.proteina) || null,
        ccs: Number(vale.ccs) || null,
        cbt: Number(vale.cbt) || null,
        observacao: vale.observacao || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Vale registrado');
      qc.invalidateQueries({ queryKey: ['vales-leite'] });
      setValeDialogOpen(false);
      setVale({ data: new Date().toISOString().split('T')[0], litros: '', gordura: '', proteina: '', ccs: '', cbt: '', observacao: '' });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const Field = ({ label, field, type = 'number', step = '0.01', obj, setObj }: any) => (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        type={type}
        step={step}
        value={obj[field]}
        onChange={e => setObj((p: any) => ({ ...p, [field]: e.target.value }))}
        className="h-8 text-sm"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Cooperativa</h1>
          <p className="text-muted-foreground">Notas mensais e diário de coletas</p>
        </div>
        <div className="flex items-center gap-2">
          <ReportMenu config={{
            title: `Relatório Cooperativa — ${anoFiltro}`,
            columns: [
              { header: 'Mês', key: 'mes_nome' },
              { header: 'Litros', key: 'quantidade_litros' },
              { header: 'Valor Bruto', key: 'valor_bruto' },
              { header: 'Valor Líquido', key: 'valor_liquido' },
              { header: 'R$/L', key: 'valor_unitario' },
            ],
            data: (notas || []).map(n => ({
              mes_nome: MESES[(n.mes || 1) - 1],
              quantidade_litros: n.quantidade_litros,
              valor_bruto: Number(n.valor_bruto || 0).toFixed(2),
              valor_liquido: Number(n.valor_liquido || 0).toFixed(2),
              valor_unitario: Number(n.valor_unitario || 0).toFixed(4),
            })),
            kpis: [
              { label: 'Total Litros', value: totalLitrosAno.toLocaleString('pt-BR') },
              { label: 'Total Líquido', value: `R$ ${totalLiquidoAno.toFixed(2)}` },
              { label: 'Média R$/L', value: `R$ ${mediaLitro.toFixed(4)}` },
            ],
          }} />
          <Select value={String(anoFiltro)} onValueChange={v => setAnoFiltro(Number(v))}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Array.from({ length: 20 }, (_, i) => 2007 + i).map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title={`Litros ${anoFiltro}`} value={`${totalLitrosAno.toLocaleString('pt-BR')} L`} icon={<Droplets className="h-5 w-5" />} color="default" />
        <KPICard title={`Líquido ${anoFiltro}`} value={`R$ ${totalLiquidoAno.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={<DollarSign className="h-5 w-5" />} color="success" />
        <KPICard title="Média R$/Litro" value={`R$ ${mediaLitro.toFixed(4)}`} icon={<TrendingUp className="h-5 w-5" />} color="warning" />
        <KPICard title="Vales do Mês" value={`${totalValesMes.toLocaleString('pt-BR')} L`} icon={<FileText className="h-5 w-5" />} color="default" />
      </div>

      <Tabs defaultValue="notas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notas">Notas Mensais</TabsTrigger>
          <TabsTrigger value="vales">Vales / Coletas</TabsTrigger>
          <TabsTrigger value="evolucao">Evolução Anual</TabsTrigger>
        </TabsList>

        {/* Notas */}
        <TabsContent value="notas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-heading">Notas — {anoFiltro}</CardTitle>
              {isGestorOrAdmin && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="h-4 w-4 mr-2" />Nova Nota</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Nova Nota da Cooperativa</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                      {/* Período */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Mês</Label>
                          <Select value={String(nota.mes)} onValueChange={v => setNota(p => ({ ...p, mes: Number(v) }))}>
                            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {MESES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <Field label="Ano" field="ano" step="1" obj={nota} setObj={setNota} />
                      </div>

                      {/* Produção */}
                      <Separator />
                      <p className="text-sm font-semibold text-muted-foreground">Produção</p>
                      <div className="grid grid-cols-3 gap-3">
                        <Field label="Litros" field="quantidade_litros" obj={nota} setObj={setNota} />
                        <Field label="Valor Unitário (R$/L)" field="valor_unitario" step="0.0001" obj={nota} setObj={setNota} />
                        <Field label="% Aproveitamento" field="pct_aproveitamento" obj={nota} setObj={setNota} />
                      </div>

                      {/* Qualidade */}
                      <Separator />
                      <p className="text-sm font-semibold text-muted-foreground">Qualidade</p>
                      <div className="grid grid-cols-4 gap-3">
                        <Field label="CCS (x1000)" field="ccs" obj={nota} setObj={setNota} />
                        <Field label="CBT (x1000)" field="cbt" obj={nota} setObj={setNota} />
                        <Field label="Gordura %" field="materia_gorda" obj={nota} setObj={setNota} />
                        <Field label="Proteína %" field="proteina_pct" obj={nota} setObj={setNota} />
                      </div>

                      {/* Bonificações */}
                      <Separator />
                      <p className="text-sm font-semibold text-muted-foreground">Bonificações (R$)</p>
                      <div className="grid grid-cols-3 gap-3">
                        <Field label="Temperatura" field="bonif_temperatura" obj={nota} setObj={setNota} />
                        <Field label="Qualidade" field="bonif_qualidade" obj={nota} setObj={setNota} />
                        <Field label="Fidelidade" field="bonif_fidelidade" obj={nota} setObj={setNota} />
                        <Field label="Geral" field="bonif_geral" obj={nota} setObj={setNota} />
                        <Field label="Adic. Mercado" field="adicional_mercado" obj={nota} setObj={setNota} />
                      </div>

                      {/* Descontos */}
                      <Separator />
                      <p className="text-sm font-semibold text-muted-foreground">Descontos (R$)</p>
                      <div className="grid grid-cols-3 gap-3">
                        <Field label="INSS/RAT/SENAR" field="inss_rat_senar" obj={nota} setObj={setNota} />
                        <Field label="Frete" field="frete" obj={nota} setObj={setNota} />
                        <Field label="Adiantamento" field="adiantamento" obj={nota} setObj={setNota} />
                        <Field label="CompraBST" field="comprabst" obj={nota} setObj={setNota} />
                        <Field label="Outros (R$)" field="outros_valor" obj={nota} setObj={setNota} />
                        <div>
                          <Label className="text-xs">Desc. Outros</Label>
                          <Input className="h-8 text-sm" value={nota.outros_desc} onChange={e => setNota(p => ({ ...p, outros_desc: e.target.value }))} />
                        </div>
                      </div>

                      {/* Resumo */}
                      <Separator />
                      <div className="grid grid-cols-3 gap-3 bg-muted p-3 rounded-lg text-sm">
                        <div><span className="text-muted-foreground">Bruto:</span> <strong>R$ {valorBruto.toFixed(2)}</strong></div>
                        <div><span className="text-muted-foreground">Líquido:</span> <strong className="text-green-700">R$ {valorLiquido.toFixed(2)}</strong></div>
                        <div><span className="text-muted-foreground">R$/Litro:</span> <strong>R$ {liquidoPorLitro.toFixed(4)}</strong></div>
                      </div>

                      <Button onClick={() => insertNota.mutate()} className="w-full" disabled={insertNota.isPending}>
                        {insertNota.isPending ? 'Salvando...' : 'Salvar Nota'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {notas && notas.length > 0 ? (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mês</TableHead>
                        <TableHead className="text-right">Litros</TableHead>
                        <TableHead className="text-right">R$/L</TableHead>
                        <TableHead className="text-right">Bonificações</TableHead>
                        <TableHead className="text-right">Descontos</TableHead>
                        <TableHead className="text-right">Bruto</TableHead>
                        <TableHead className="text-right">Líquido</TableHead>
                        <TableHead className="text-right">CCS</TableHead>
                        <TableHead className="text-right">CBT</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notas.map(n => {
                        const bonif = (Number(n.bonif_temperatura) || 0) + (Number(n.bonif_qualidade) || 0) +
                          (Number(n.bonif_fidelidade) || 0) + (Number(n.bonif_geral) || 0) + (Number(n.adicional_mercado) || 0);
                        const desc = (Number(n.inss_rat_senar) || 0) + (Number(n.frete) || 0) +
                          (Number(n.adiantamento) || 0) + (Number(n.comprabst) || 0) + (Number(n.outros_valor) || 0);
                        return (
                          <TableRow key={n.id}>
                            <TableCell className="font-medium">{MESES[n.mes - 1]}</TableCell>
                            <TableCell className="text-right">{Number(n.quantidade_litros || 0).toLocaleString('pt-BR')}</TableCell>
                            <TableCell className="text-right">{Number(n.valor_unitario || 0).toFixed(4)}</TableCell>
                            <TableCell className="text-right text-green-700">+{bonif.toFixed(2)}</TableCell>
                            <TableCell className="text-right text-destructive">-{desc.toFixed(2)}</TableCell>
                            <TableCell className="text-right">{Number(n.valor_bruto || 0).toFixed(2)}</TableCell>
                            <TableCell className="text-right font-bold">{Number(n.valor_liquido || 0).toFixed(2)}</TableCell>
                            <TableCell className="text-right">{n.ccs || '—'}</TableCell>
                            <TableCell className="text-right">{n.cbt || '—'}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhuma nota registrada em {anoFiltro}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vales */}
        <TabsContent value="vales">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-heading">Vales de Leite</CardTitle>
              <div className="flex items-center gap-2">
                <Input type="month" value={mesFiltroVale} onChange={e => setMesFiltroVale(e.target.value)} className="w-44" />
                {isGestorOrAdmin && (
                  <Dialog open={valeDialogOpen} onOpenChange={setValeDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm"><Plus className="h-4 w-4 mr-2" />Novo Vale</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader><DialogTitle>Registrar Vale de Leite</DialogTitle></DialogHeader>
                      <div className="space-y-3 pt-2">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Data</Label>
                            <Input type="date" value={vale.data} onChange={e => setVale(p => ({ ...p, data: e.target.value }))} className="h-8" />
                          </div>
                          <Field label="Litros" field="litros" obj={vale} setObj={setVale} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Gordura %" field="gordura" obj={vale} setObj={setVale} />
                          <Field label="Proteína %" field="proteina" obj={vale} setObj={setVale} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="CCS (x1000)" field="ccs" obj={vale} setObj={setVale} />
                          <Field label="CBT (x1000)" field="cbt" obj={vale} setObj={setVale} />
                        </div>
                        <div>
                          <Label className="text-xs">Observação</Label>
                          <Input value={vale.observacao} onChange={e => setVale(p => ({ ...p, observacao: e.target.value }))} className="h-8" />
                        </div>
                        <Button onClick={() => {
                          if (!vale.litros || Number(vale.litros) <= 0) return toast.error('Informe os litros');
                          insertVale.mutate();
                        }} className="w-full" disabled={insertVale.isPending}>
                          {insertVale.isPending ? 'Salvando...' : 'Salvar Vale'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {vales && vales.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Litros</TableHead>
                      <TableHead className="text-right">Gordura %</TableHead>
                      <TableHead className="text-right">Proteína %</TableHead>
                      <TableHead className="text-right">CCS</TableHead>
                      <TableHead className="text-right">CBT</TableHead>
                      <TableHead>Obs.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vales.map(v => (
                      <TableRow key={v.id}>
                        <TableCell>{new Date(v.data + 'T12:00:00').toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="text-right font-medium">{Number(v.litros).toFixed(0)}</TableCell>
                        <TableCell className="text-right">{v.gordura || '—'}</TableCell>
                        <TableCell className="text-right">{v.proteina || '—'}</TableCell>
                        <TableCell className="text-right">{v.ccs || '—'}</TableCell>
                        <TableCell className="text-right">{v.cbt || '—'}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{v.observacao || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhum vale registrado neste mês</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Evolução */}
        <TabsContent value="evolucao">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-lg font-heading">Litros por Mês — {anoFiltro}</CardTitle></CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartAnual}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="mes" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="litros" name="Litros" fill="hsl(213, 68%, 14%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg font-heading">Valor Líquido por Mês — {anoFiltro}</CardTitle></CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartAnual}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="mes" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Line type="monotone" dataKey="liquido" name="Líquido (R$)" stroke="hsl(43, 52%, 54%)" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
