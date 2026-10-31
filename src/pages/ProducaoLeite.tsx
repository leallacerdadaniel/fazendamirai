import { cap } from "@/lib/labels";
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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Plus, Milk, TrendingUp, Calendar, BarChart3, AlertCircle, Syringe, Pencil } from 'lucide-react';
import { KPICard } from '@/components/KPICard';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { ReportMenu } from '@/components/ReportMenu';

type Animal = { id: string; nome: string | null; brinco: string | null; status: string; tipo: string | null; lote_id: string | null };
type Lote = { id: string; nome: string };
type Producao = {
  id: string; data: string; litros: number; turno: string | null;
  animal_id: string | null; lote_id: string | null;
  com_mastite?: boolean; usa_ocitocina?: boolean;
};

export default function ProducaoLeite() {
  const { user, isGestorOrAdmin } = useAuth();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [ccsDialogOpen, setCcsDialogOpen] = useState(false);
  const [modo, setModo] = useState<'individual' | 'lote'>('individual');
  const [animalId, setAnimalId] = useState('');
  const [loteId, setLoteId] = useState('');
  const [turno, setTurno] = useState('manha');
  const [litros, setLitros] = useState('');
  const [dataReg, setDataReg] = useState(new Date().toISOString().split('T')[0]);
  const [mesFiltro, setMesFiltro] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [animalCurva, setAnimalCurva] = useState('');
  const [comMastite, setComMastite] = useState(false);
  const [usaOcitocina, setUsaOcitocina] = useState(false);
  const [editandoLote, setEditandoLote] = useState(false);
  const [loteOverride, setLoteOverride] = useState('');

  // CCS dialog state
  const [ccsAnimalId, setCcsAnimalId] = useState('');
  const [ccsValor, setCcsValor] = useState('');
  const [ccsData, setCcsData] = useState(new Date().toISOString().split('T')[0]);
  const [animalCcsHistorico, setAnimalCcsHistorico] = useState('');

  // Fetch vacas ativas (excluir secas)
  const { data: animais } = useQuery({
    queryKey: ['animais-lactacao'],
    queryFn: async () => {
      const { data: secas } = await supabase.from('secagens').select('animal_id');
      const secasIds = new Set((secas || []).map(s => s.animal_id));
      const { data } = await supabase
        .from('animais')
        .select('id, nome, brinco, status, tipo, lote_id')
        .eq('status', 'ativo')
        .in('sexo', ['Fêmea', 'femea', 'F']);
      return (data || []).filter(a => !secasIds.has(a.id)) as Animal[];
    },
  });

  const { data: lotes } = useQuery({
    queryKey: ['lotes'],
    queryFn: async () => {
      const { data } = await supabase.from('lotes').select('id, nome').order('nome');
      return (data || []) as Lote[];
    },
  });

  // Última aplicação hormonal do animal selecionado
  const { data: ultimaAplicacao } = useQuery({
    queryKey: ['ultima-aplicacao', animalId],
    enabled: !!animalId && modo === 'individual',
    queryFn: async () => {
      const { data } = await supabase
        .from('aplicacoes_hormonais')
        .select('tipo, data_aplicacao')
        .eq('animal_id', animalId)
        .in('tipo', ['boostin', 'lactotropin'])
        .order('data_aplicacao', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  // CCS histórico por animal
  const { data: ccsHistorico } = useQuery({
    queryKey: ['ccs-historico', animalCcsHistorico],
    enabled: !!animalCcsHistorico,
    queryFn: async () => {
      const { data } = await supabase
        .from('controle_leiteiro')
        .select('data_coleta, ccs')
        .eq('animal_id', animalCcsHistorico)
        .order('data_coleta', { ascending: true });
      return (data || []).filter(d => d.ccs != null).map(d => ({
        data: new Date(d.data_coleta + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }),
        ccs: Number(d.ccs),
      }));
    },
  });

  // Produção do mês selecionado
  const mesInicio = `${mesFiltro}-01`;
  const mesFim = (() => {
    const [y, m] = mesFiltro.split('-').map(Number);
    const last = new Date(y, m, 0).getDate();
    return `${mesFiltro}-${String(last).padStart(2, '0')}`;
  })();

  const { data: producoes } = useQuery({
    queryKey: ['producao-mes', mesFiltro],
    queryFn: async () => {
      const { data } = await supabase
        .from('producao_leite_diaria')
        .select('id, data, litros, turno, animal_id, lote_id, com_mastite, usa_ocitocina')
        .gte('data', mesInicio)
        .lte('data', mesFim)
        .order('data', { ascending: false });
      return (data || []) as Producao[];
    },
  });

  // KPIs
  const totalMes = useMemo(() => producoes?.reduce((a, r) => a + Number(r.litros), 0) || 0, [producoes]);
  const diasComRegistro = useMemo(() => new Set(producoes?.map(r => r.data)).size, [producoes]);
  const mediaDiaria = diasComRegistro > 0 ? totalMes / diasComRegistro : 0;
  const hoje = new Date().toISOString().split('T')[0];
  const totalHoje = useMemo(
    () => producoes?.filter(r => r.data === hoje).reduce((a, r) => a + Number(r.litros), 0) || 0,
    [producoes, hoje]
  );

  // Chart: total diário
  const chartDiario = useMemo(() => {
    if (!producoes) return [];
    const grouped: Record<string, { manha: number; tarde: number }> = {};
    producoes.forEach(r => {
      if (!grouped[r.data]) grouped[r.data] = { manha: 0, tarde: 0 };
      const key = r.turno === 'tarde' ? 'tarde' : 'manha';
      grouped[r.data][key] += Number(r.litros);
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([data, vals]) => ({
        data: new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        manha: vals.manha,
        tarde: vals.tarde,
        total: vals.manha + vals.tarde,
      }));
  }, [producoes]);

  // Curva de lactação individual
  const { data: curvaData } = useQuery({
    queryKey: ['curva-lactacao', animalCurva],
    enabled: !!animalCurva,
    queryFn: async () => {
      const { data } = await supabase
        .from('producao_leite_diaria')
        .select('data, litros, turno')
        .eq('animal_id', animalCurva)
        .order('data');
      if (!data) return [];
      const grouped: Record<string, number> = {};
      data.forEach(r => { grouped[r.data] = (grouped[r.data] || 0) + Number(r.litros); });
      return Object.entries(grouped).map(([data, kg]) => ({
        data: new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        kg,
      }));
    },
  });

  // Ranking por animal no mês
  const rankingAnimais = useMemo(() => {
    if (!producoes || !animais) return [];
    const grouped: Record<string, number> = {};
    producoes.forEach(r => {
      if (r.animal_id) grouped[r.animal_id] = (grouped[r.animal_id] || 0) + Number(r.litros);
    });
    return Object.entries(grouped)
      .map(([id, total]) => {
        const animal = animais.find(a => a.id === id);
        return { id, nome: animal?.nome || animal?.brinco || id.slice(0, 8), total };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 15);
  }, [producoes, animais]);

  // Auto-fill lote when animal is selected
  const selectedAnimalLote = useMemo(() => {
    if (modo !== 'individual' || !animalId) return null;
    const animal = animais?.find(a => a.id === animalId);
    return animal?.lote_id || null;
  }, [animalId, animais, modo]);

  const insertMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        data: dataReg,
        litros: Number(litros),
        turno,
        registrado_por: user?.id,
        com_mastite: comMastite,
        usa_ocitocina: usaOcitocina,
      };
      if (modo === 'individual') {
        payload.animal_id = animalId;
        const finalLoteId = editandoLote && loteOverride ? loteOverride : (selectedAnimalLote || loteId);
        payload.lote_id = finalLoteId;

        // Se o lote foi alterado ou atribuído, atualizar o animal
        if (editandoLote && loteOverride && loteOverride !== selectedAnimalLote) {
          await supabase.from('animais').update({ lote_id: loteOverride }).eq('id', animalId);
        } else if (!selectedAnimalLote && loteId) {
          // Animal sem lote, atribuir o selecionado
          await supabase.from('animais').update({ lote_id: loteId }).eq('id', animalId);
        }
      } else {
        payload.lote_id = loteId;
      }

      const { error } = await supabase.from('producao_leite_diaria').insert(payload);
      if (error) throw error;

      // Se marcou mastite, criar tarefa de tratamento automaticamente
      if (comMastite && modo === 'individual' && animalId) {
        const animal = animais?.find(a => a.id === animalId);
        const nomeAnimal = animal?.nome || animal?.brinco || 'Animal';
        await supabase.from('tarefas').insert({
          titulo: `Tratamento de mastite: ${nomeAnimal}`,
          descricao: `Animal ${nomeAnimal} foi identificado com mastite durante a ordenha (${turno === 'tarde' ? 'Tarde' : 'Manhã'}) em ${new Date(dataReg).toLocaleDateString('pt-BR')}. Realizar exame CMT e iniciar tratamento.`,
          prioridade: 'alta',
          prazo: dataReg,
          modulo_relacionado: 'saude',
          status: 'pendente',
        });
      }
    },
    onSuccess: () => {
      toast.success('Produção registrada com sucesso');
      if (editandoLote && loteOverride) toast.info('Lote do animal atualizado');
      if (comMastite) toast.info('Tarefa de tratamento de mastite criada automaticamente');
      qc.invalidateQueries({ queryKey: ['producao-mes'] });
      qc.invalidateQueries({ queryKey: ['producao-hoje'] });
      qc.invalidateQueries({ queryKey: ['producao-30d'] });
      qc.invalidateQueries({ queryKey: ['tarefas'] });
      qc.invalidateQueries({ queryKey: ['animais-lactacao'] });
      setDialogOpen(false);
      setLitros('');
      setAnimalId('');
      setLoteId('');
      setComMastite(false);
      setUsaOcitocina(false);
      setEditandoLote(false);
      setLoteOverride('');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao registrar'),
  });

  // CCS insert mutation
  const ccsMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('controle_leiteiro').insert({
        animal_id: ccsAnimalId,
        data_coleta: ccsData,
        ccs: Number(ccsValor),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('CCS registrada!');
      qc.invalidateQueries({ queryKey: ['ccs-historico'] });
      setCcsAnimalId('');
      setCcsValor('');
      setCcsDialogOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!litros || Number(litros) <= 0) return toast.error('Informe a quantidade em kg');
    if (modo === 'individual' && !animalId) return toast.error('Selecione um animal');
    if (modo === 'lote' && !loteId) return toast.error('Selecione um lote');
    insertMutation.mutate();
  };

  const nomesMeses: Record<string, string> = {
    '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
    '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
    '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro',
  };
  const [anoFiltro, mesFiltroNum] = mesFiltro.split('-');
  const mesLabel = `${nomesMeses[mesFiltroNum]} ${anoFiltro}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold">Produção de Leite</h1>
          <p className="text-muted-foreground">Registro e acompanhamento da produção diária</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <ReportMenu config={{
            title: `Produção de Leite — ${mesLabel}`,
            columns: [
              { header: 'Data', key: 'data' },
              { header: 'Animal', key: 'animal' },
              { header: 'Kg', key: 'litros' },
              { header: 'Turno', key: 'turno' },
              { header: 'Mastite', key: 'com_mastite' },
              { header: 'Ocitocina', key: 'usa_ocitocina' },
            ],
            data: (producoes || []).map(p => ({
              data: p.data,
              animal: animais?.find(a => a.id === p.animal_id)?.nome || animais?.find(a => a.id === p.animal_id)?.brinco || '—',
              litros: p.litros, turno: p.turno || '—',
              com_mastite: p.com_mastite ? 'Sim' : 'Não',
              usa_ocitocina: p.usa_ocitocina ? 'Sim' : 'Não',
            })),
            kpis: [
              { label: 'Total Mês (kg)', value: totalMes.toFixed(1) },
              { label: 'Média Diária (kg)', value: mediaDiaria.toFixed(1) },
              { label: 'Hoje (kg)', value: totalHoje.toFixed(1) },
            ],
          }} />
          <Input type="month" value={mesFiltro} onChange={e => setMesFiltro(e.target.value)} className="w-44" />

          {/* Botão CCS */}
          <Dialog open={ccsDialogOpen} onOpenChange={setCcsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Syringe className="h-4 w-4 mr-2" />Registrar CCS</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Registrar CCS (Contagem de Células Somáticas)</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Animal</Label>
                  <Select value={ccsAnimalId} onValueChange={setCcsAnimalId}>
                    <SelectTrigger><SelectValue placeholder="Selecione o animal" /></SelectTrigger>
                    <SelectContent>
                      {animais?.map(a => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.brinco ? `${a.brinco} - ` : ''}{a.nome || 'Sem nome'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>CCS (x1000)</Label><Input type="number" step="1" value={ccsValor} onChange={e => setCcsValor(e.target.value)} placeholder="Ex: 250" /></div>
                  <div><Label>Data da Coleta</Label><Input type="date" value={ccsData} onChange={e => setCcsData(e.target.value)} /></div>
                </div>
                <Button onClick={() => ccsMutation.mutate()} disabled={!ccsAnimalId || !ccsValor || ccsMutation.isPending} className="w-full">
                  {ccsMutation.isPending ? 'Salvando...' : 'Salvar CCS'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {isGestorOrAdmin && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Registrar Produção</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Registrar Produção de Leite</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="flex gap-2">
                    <Button variant={modo === 'individual' ? 'default' : 'outline'} size="sm" onClick={() => setModo('individual')} className="flex-1">Individual</Button>
                    <Button variant={modo === 'lote' ? 'default' : 'outline'} size="sm" onClick={() => setModo('lote')} className="flex-1">Por Lote</Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Data</Label><Input type="date" value={dataReg} onChange={e => setDataReg(e.target.value)} /></div>
                    <div>
                      <Label>Turno</Label>
                      <Select value={turno} onValueChange={setTurno}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manha">Manhã</SelectItem>
                          <SelectItem value="tarde">Tarde</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {modo === 'individual' && (
                    <div>
                      <Label>Animal</Label>
                      <Select value={animalId} onValueChange={setAnimalId}>
                        <SelectTrigger><SelectValue placeholder="Selecione o animal" /></SelectTrigger>
                        <SelectContent>
                          {animais?.map(a => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.brinco ? `${a.brinco} - ` : ''}{a.nome || 'Sem nome'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <Label>Lote</Label>
                      {modo === 'individual' && selectedAnimalLote && !editandoLote && (
                        <button
                          type="button"
                          onClick={() => { setEditandoLote(true); setLoteOverride(selectedAnimalLote); }}
                          className="text-xs text-primary flex items-center gap-1 hover:underline"
                        >
                          <Pencil className="h-3 w-3" /> Alterar lote
                        </button>
                      )}
                    </div>
                    {modo === 'individual' && animalId && !selectedAnimalLote && (
                      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-2 mb-2 text-xs text-destructive">
                        ⚠ Este animal não tem lote atribuído. Selecione um abaixo para corrigir.
                      </div>
                    )}
                    <Select
                      value={editandoLote ? loteOverride : (modo === 'individual' && selectedAnimalLote ? selectedAnimalLote : loteId)}
                      onValueChange={(v) => {
                        if (modo === 'individual') {
                          setLoteOverride(v);
                          if (!selectedAnimalLote) setEditandoLote(true);
                        } else {
                          setLoteId(v);
                        }
                      }}
                      disabled={modo === 'individual' && !!selectedAnimalLote && !editandoLote}
                    >
                      <SelectTrigger><SelectValue placeholder="Selecione o lote" /></SelectTrigger>
                      <SelectContent>
                        {lotes?.map(l => (
                          <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {modo === 'individual' && selectedAnimalLote && !editandoLote && (
                      <p className="text-xs text-muted-foreground mt-1">Lote atual do animal</p>
                    )}
                    {editandoLote && (
                      <p className="text-xs text-primary mt-1">O lote do animal será atualizado ao salvar</p>
                    )}
                  </div>


                  {/* Callout: última aplicação de Boostin/Lactotropin */}
                  {modo === 'individual' && animalId && ultimaAplicacao && ultimaAplicacao.length > 0 && (
                    <div className="rounded-lg border border-accent bg-accent/10 p-3 space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-accent-foreground">
                        <AlertCircle className="h-4 w-4 text-secondary" />
                        Últimas aplicações hormonais
                      </div>
                      {ultimaAplicacao.map((ap, i) => (
                        <p key={i} className="text-xs text-muted-foreground">
                          <span className="capitalize font-medium">{cap(ap.tipo)}</span>: {new Date(ap.data_aplicacao + 'T12:00').toLocaleDateString('pt-BR')}
                          {' '}({Math.floor((Date.now() - new Date(ap.data_aplicacao + 'T12:00').getTime()) / 86400000)} dias atrás)
                        </p>
                      ))}
                    </div>
                  )}

                  <div>
                    <Label>Peso do Leite (kg)</Label>
                    <Input type="number" step="0.1" placeholder="Ex: 12.5" value={litros} onChange={e => setLitros(e.target.value)} />
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Checkbox id="mastite" checked={comMastite} onCheckedChange={(v) => setComMastite(!!v)} />
                      <Label htmlFor="mastite" className="text-sm cursor-pointer">Com mastite</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="ocitocina" checked={usaOcitocina} onCheckedChange={(v) => setUsaOcitocina(!!v)} />
                      <Label htmlFor="ocitocina" className="text-sm cursor-pointer">Usa ocitocina</Label>
                    </div>
                  </div>

                  <Button onClick={handleSubmit} className="w-full" disabled={insertMutation.isPending}>
                    {insertMutation.isPending ? 'Salvando...' : 'Salvar Registro'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Produção Hoje" value={`${totalHoje.toFixed(1)} kg`} icon={<Milk className="h-5 w-5" />} color="default" />
        <KPICard title={`Total ${mesLabel}`} value={`${totalMes.toFixed(0)} kg`} icon={<Calendar className="h-5 w-5" />} color="success" />
        <KPICard title="Média Diária" value={`${mediaDiaria.toFixed(1)} kg`} icon={<TrendingUp className="h-5 w-5" />} color="warning" />
        <KPICard title="Dias com Registro" value={diasComRegistro} icon={<BarChart3 className="h-5 w-5" />} color="default" />
      </div>

      <Tabs defaultValue="registros" className="space-y-4">
        <TabsList>
          <TabsTrigger value="registros">Registros</TabsTrigger>
          <TabsTrigger value="grafico">Gráfico Diário</TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
          <TabsTrigger value="curva">Curva de Lactação</TabsTrigger>
          <TabsTrigger value="ccs">Histórico CCS</TabsTrigger>
        </TabsList>

        {/* Tab Registros */}
        <TabsContent value="registros">
          <Card>
            <CardHeader><CardTitle className="text-lg font-heading">Registros — {mesLabel}</CardTitle></CardHeader>
            <CardContent>
              {producoes && producoes.length > 0 ? (
                <div className="max-h-[500px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Turno</TableHead>
                        <TableHead>Animal / Lote</TableHead>
                        <TableHead className="text-right">Kg</TableHead>
                        <TableHead>Obs</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {producoes.map(r => {
                        const animal = r.animal_id ? animais?.find(a => a.id === r.animal_id) : null;
                        const lote = r.lote_id ? lotes?.find(l => l.id === r.lote_id) : null;
                        return (
                          <TableRow key={r.id}>
                            <TableCell>{new Date(r.data + 'T12:00:00').toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell className="capitalize">{r.turno === 'tarde' ? 'Tarde' : 'Manhã'}</TableCell>
                            <TableCell>
                              {animal ? `${animal.brinco || ''} ${animal.nome || ''}`.trim() : ''}
                              {lote ? ` (${lote.nome})` : ''}
                              {!animal && !lote ? '—' : ''}
                            </TableCell>
                            <TableCell className="text-right font-medium">{Number(r.litros).toFixed(1)}</TableCell>
                            <TableCell className="text-xs space-x-1">
                              {r.com_mastite && <span className="text-destructive">Mastite</span>}
                              {r.usa_ocitocina && <span className="text-warning">Ocitocina</span>}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhum registro neste mês</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Gráfico */}
        <TabsContent value="grafico">
          <Card>
            <CardHeader><CardTitle className="text-lg font-heading">Produção Diária — {mesLabel}</CardTitle></CardHeader>
            <CardContent>
              <div className="h-80">
                {chartDiario.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartDiario}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="data" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip formatter={(v: number) => [`${v.toFixed(1)} kg`, '']} />
                      <Bar dataKey="manha" name="Manhã" fill="hsl(213, 68%, 14%)" stackId="a" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="tarde" name="Tarde" fill="hsl(43, 52%, 54%)" stackId="a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">Sem dados</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Ranking */}
        <TabsContent value="ranking">
          <Card>
            <CardHeader><CardTitle className="text-lg font-heading">Ranking de Produção — {mesLabel}</CardTitle></CardHeader>
            <CardContent>
              {rankingAnimais.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Animal</TableHead>
                      <TableHead className="text-right">Total (kg)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rankingAnimais.map((r, i) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-bold">{i + 1}</TableCell>
                        <TableCell>{r.nome}</TableCell>
                        <TableCell className="text-right font-medium">{r.total.toFixed(1)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhum registro individual neste mês</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Curva de Lactação */}
        <TabsContent value="curva">
          <Card>
            <CardHeader><CardTitle className="text-lg font-heading">Curva de Lactação Individual</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="max-w-xs">
                <Label>Selecione o animal</Label>
                <Select value={animalCurva} onValueChange={setAnimalCurva}>
                  <SelectTrigger><SelectValue placeholder="Animal" /></SelectTrigger>
                  <SelectContent>
                    {animais?.map(a => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.brinco ? `${a.brinco} - ` : ''}{a.nome || 'Sem nome'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="h-80">
                {curvaData && curvaData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={curvaData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="data" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip formatter={(v: number) => [`${v.toFixed(1)} kg`, 'Produção']} />
                      <Line type="monotone" dataKey="kg" name="Kg" stroke="hsl(43, 52%, 54%)" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    {animalCurva ? 'Nenhum dado encontrado' : 'Selecione um animal para ver a curva'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab CCS */}
        <TabsContent value="ccs">
          <Card>
            <CardHeader><CardTitle className="text-lg font-heading">Histórico de CCS por Animal</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="max-w-xs">
                <Label>Selecione o animal</Label>
                <Select value={animalCcsHistorico} onValueChange={setAnimalCcsHistorico}>
                  <SelectTrigger><SelectValue placeholder="Animal" /></SelectTrigger>
                  <SelectContent>
                    {animais?.map(a => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.brinco ? `${a.brinco} - ` : ''}{a.nome || 'Sem nome'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="h-80">
                {ccsHistorico && ccsHistorico.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ccsHistorico}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="data" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip formatter={(v: number) => [`${v.toLocaleString()} x1000`, 'CCS']} />
                      <Line type="monotone" dataKey="ccs" name="CCS" stroke="hsl(0, 70%, 50%)" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    {animalCcsHistorico ? 'Nenhum registro de CCS encontrado' : 'Selecione um animal para ver o histórico'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
