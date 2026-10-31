import { useState, useMemo } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { KPICard } from '@/components/KPICard';
import { toast } from 'sonner';
import { Plus, Trash2, Scale, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ReportMenu } from '@/components/ReportMenu';

type Animal = { id: string; nome: string | null; brinco: string | null; lote_id: string | null; sexo: string | null; tipo: string | null };
type Lote = { id: string; nome: string };

export default function Pesagens() {
  const [open, setOpen] = useState(false);
  const [animalEvolucao, setAnimalEvolucao] = useState('');
  const qc = useQueryClient();
  const { user } = useAuth();

  // Modo: individual ou lote
  const [modo, setModo] = useState<'individual' | 'lote'>('individual');
  const [form, setForm] = useState({ animal_id: '', data: new Date().toISOString().slice(0, 10), peso_kg: '', ocasiao: '' });

  // Lote batch state
  const [loteId, setLoteId] = useState('');
  const [batchData, setBatchData] = useState(new Date().toISOString().slice(0, 10));
  const [batchOcasiao, setBatchOcasiao] = useState('');
  const [batchPesos, setBatchPesos] = useState<Record<string, string>>({});
  const [batchSelected, setBatchSelected] = useState<Set<string>>(new Set());

  const { data: pesagens = [] } = useQuery({
    queryKey: ['pesagens'],
    queryFn: async () => {
      const { data } = await supabase.from('pesagens').select('*, animais(nome, brinco)').order('data', { ascending: false }).limit(200);
      return data || [];
    },
  });

  const { data: animais = [] } = useQuery({
    queryKey: ['animais-ativos-pesagem'],
    queryFn: async () => {
      const { data } = await supabase.from('animais').select('id, nome, brinco, lote_id, sexo, tipo').eq('status', 'ativo').order('nome');
      return (data || []) as Animal[];
    },
  });

  const { data: lotes = [] } = useQuery({
    queryKey: ['lotes'],
    queryFn: async () => {
      const { data } = await supabase.from('lotes').select('id, nome').order('nome');
      return (data || []) as Lote[];
    },
  });

  // Animais do lote selecionado
  const animaisDoLote = useMemo(() => {
    if (!loteId) return [];
    return animais.filter(a => a.lote_id === loteId);
  }, [loteId, animais]);

  // Evolução de peso por animal
  const { data: evolucaoData } = useQuery({
    queryKey: ['pesagens-evolucao', animalEvolucao],
    enabled: !!animalEvolucao,
    queryFn: async () => {
      const { data } = await supabase
        .from('pesagens')
        .select('data, peso_kg, ocasiao')
        .eq('animal_id', animalEvolucao)
        .order('data');
      return (data || []).map(p => ({
        data: new Date(p.data + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }),
        peso: Number(p.peso_kg),
        ocasiao: p.ocasiao || '',
      }));
    },
  });

  const ganhoInfo = useMemo(() => {
    if (!evolucaoData || evolucaoData.length < 2) return null;
    const first = evolucaoData[0];
    const last = evolucaoData[evolucaoData.length - 1];
    const ganho = last.peso - first.peso;
    return { ganho, primeiro: first.peso, ultimo: last.peso, registros: evolucaoData.length };
  }, [evolucaoData]);

  // Criar tarefa reprodutiva se peso >= 300kg e é fêmea jovem (novilha/bezerra)
  const checkReproductiveTask = async (animalId: string, pesoKg: number) => {
    if (pesoKg < 300) return;
    const animal = animais.find(a => a.id === animalId);
    if (!animal) return;
    const sexo = (animal.sexo || '').toLowerCase();
    const tipo = (animal.tipo || '').toLowerCase();
    if (!['fêmea', 'femea', 'f'].includes(sexo)) return;
    if (['vaca'].includes(tipo)) return; // Vacas já estão em reprodução

    const nomeAnimal = animal.nome || animal.brinco || 'Animal';
    await supabase.from('tarefas').insert({
      titulo: `Início reprodutivo: ${nomeAnimal} (${pesoKg.toFixed(0)}kg)`,
      descricao: `${nomeAnimal} atingiu ${pesoKg.toFixed(1)}kg na pesagem. Avaliar início de protocolo de reprodução (indução/IATF).`,
      prioridade: 'alta',
      prazo: new Date().toISOString().split('T')[0],
      modulo_relacionado: 'reproducao',
      status: 'pendente',
    });
  };

  // Salvar pesagem individual
  const save = useMutation({
    mutationFn: async () => {
      const pesoNum = Number(form.peso_kg);
      const { error } = await supabase.from('pesagens').insert({
        animal_id: form.animal_id,
        data: form.data,
        peso_kg: pesoNum,
        registrado_por: user?.id || null,
        ocasiao: form.ocasiao || null,
      });
      if (error) throw error;
      await checkReproductiveTask(form.animal_id, pesoNum);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pesagens'] });
      qc.invalidateQueries({ queryKey: ['pesagens-evolucao'] });
      qc.invalidateQueries({ queryKey: ['tarefas'] });
      toast.success('Pesagem registrada!');
      setOpen(false);
      setForm({ animal_id: '', data: new Date().toISOString().slice(0, 10), peso_kg: '', ocasiao: '' });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Salvar pesagem em lote
  const saveBatch = useMutation({
    mutationFn: async () => {
      const entries = Array.from(batchSelected)
        .filter(id => batchPesos[id] && Number(batchPesos[id]) > 0)
        .map(id => ({
          animal_id: id,
          data: batchData,
          peso_kg: Number(batchPesos[id]),
          registrado_por: user?.id || null,
          ocasiao: batchOcasiao || null,
        }));
      if (entries.length === 0) throw new Error('Nenhum animal com peso informado');
      const { error } = await supabase.from('pesagens').insert(entries);
      if (error) throw error;

      // Check reproductive tasks for all
      for (const entry of entries) {
        await checkReproductiveTask(entry.animal_id, entry.peso_kg);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pesagens'] });
      qc.invalidateQueries({ queryKey: ['tarefas'] });
      toast.success('Pesagens em lote registradas!');
      setOpen(false);
      setBatchPesos({});
      setBatchSelected(new Set());
      setBatchOcasiao('');
      setLoteId('');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('pesagens').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pesagens'] }); toast.success('Excluída!'); },
  });

  // Toggle all animals in batch
  const toggleAll = () => {
    if (batchSelected.size === animaisDoLote.length) {
      setBatchSelected(new Set());
    } else {
      setBatchSelected(new Set(animaisDoLote.map(a => a.id)));
    }
  };

  const animalLabel = (a: Animal) => `${a.brinco ? `${a.brinco} - ` : ''}${a.nome || 'Sem nome'}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-heading font-bold">Pesagens</h1><p className="text-muted-foreground">Controle de peso dos animais</p></div>
        <div className="flex gap-2">
          <ReportMenu config={{
            title: 'Relatório de Pesagens',
            columns: [
              { header: 'Animal', key: 'animal' },
              { header: 'Data', key: 'data' },
              { header: 'Peso (kg)', key: 'peso_kg' },
              { header: 'Ocasião', key: 'ocasiao' },
            ],
            data: pesagens.map((p: any) => ({
              animal: p.animais ? `${p.animais.brinco || ''} ${p.animais.nome || ''}`.trim() : '—',
              data: p.data, peso_kg: p.peso_kg, ocasiao: p.ocasiao || '—',
            })),
            kpis: [{ label: 'Total Pesagens', value: pesagens.length }],
          }} />
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setModo('individual'); setLoteId(''); setBatchPesos({}); setBatchSelected(new Set()); } }}>
            <DialogTrigger asChild><Button className="bg-secondary text-secondary-foreground"><Plus className="h-4 w-4 mr-1" />Nova Pesagem</Button></DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Registrar Pesagem</DialogTitle></DialogHeader>
            <div className="space-y-4">
              {/* Modo selector */}
              <div className="flex gap-2">
                <Button variant={modo === 'individual' ? 'default' : 'outline'} size="sm" onClick={() => setModo('individual')} className="flex-1">
                  <Scale className="h-4 w-4 mr-1" /> Individual
                </Button>
                <Button variant={modo === 'lote' ? 'default' : 'outline'} size="sm" onClick={() => setModo('lote')} className="flex-1">
                  <Users className="h-4 w-4 mr-1" /> Por Lote / Evento
                </Button>
              </div>

              {modo === 'individual' ? (
                <>
                  <div className="space-y-1">
                    <Label>Animal</Label>
                    <Select value={form.animal_id} onValueChange={v => setForm(f => ({ ...f, animal_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{animais.map(a => <SelectItem key={a.id} value={a.id}>{animalLabel(a)}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label>Peso (kg)</Label><Input type="number" step="0.1" value={form.peso_kg} onChange={e => setForm(f => ({ ...f, peso_kg: e.target.value }))} /></div>
                    <div className="space-y-1"><Label>Data</Label><Input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} /></div>
                  </div>
                  <div className="space-y-1"><Label>Ocasião</Label><Input value={form.ocasiao} onChange={e => setForm(f => ({ ...f, ocasiao: e.target.value }))} placeholder="Desmama, rotina, pré-venda..." /></div>
                  <Button onClick={() => save.mutate()} disabled={!form.animal_id || !form.peso_kg || save.isPending} className="w-full bg-secondary text-secondary-foreground">
                    {save.isPending ? 'Salvando...' : 'Salvar'}
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <Label>Lote</Label>
                    <Select value={loteId} onValueChange={v => { setLoteId(v); setBatchPesos({}); setBatchSelected(new Set()); }}>
                      <SelectTrigger><SelectValue placeholder="Selecione o lote" /></SelectTrigger>
                      <SelectContent>{lotes.map(l => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label>Data</Label><Input type="date" value={batchData} onChange={e => setBatchData(e.target.value)} /></div>
                    <div className="space-y-1"><Label>Ocasião / Evento</Label><Input value={batchOcasiao} onChange={e => setBatchOcasiao(e.target.value)} placeholder="Recepção, rotina, desmama..." /></div>
                  </div>

                  {loteId && animaisDoLote.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">{animaisDoLote.length} animais no lote</Label>
                        <Button variant="ghost" size="sm" onClick={toggleAll} className="text-xs">
                          {batchSelected.size === animaisDoLote.length ? 'Desmarcar todos' : 'Selecionar todos'}
                        </Button>
                      </div>
                      <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                        {animaisDoLote.map(a => (
                          <div key={a.id} className="flex items-center gap-3 px-3 py-2">
                            <Checkbox
                              checked={batchSelected.has(a.id)}
                              onCheckedChange={(v) => {
                                const next = new Set(batchSelected);
                                v ? next.add(a.id) : next.delete(a.id);
                                setBatchSelected(next);
                              }}
                            />
                            <span className="flex-1 text-sm truncate">{animalLabel(a)}</span>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="kg"
                              className="w-24 h-8 text-sm"
                              value={batchPesos[a.id] || ''}
                              onChange={e => {
                                setBatchPesos(p => ({ ...p, [a.id]: e.target.value }));
                                if (e.target.value && !batchSelected.has(a.id)) {
                                  setBatchSelected(s => new Set(s).add(a.id));
                                }
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {loteId && animaisDoLote.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum animal ativo neste lote</p>
                  )}

                  <Button
                    onClick={() => saveBatch.mutate()}
                    disabled={batchSelected.size === 0 || saveBatch.isPending}
                    className="w-full bg-secondary text-secondary-foreground"
                  >
                    {saveBatch.isPending ? 'Salvando...' : `Salvar ${batchSelected.size} pesagem(ns)`}
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <KPICard title="Pesagens Registradas" value={String(pesagens.length)} icon={<Scale className="h-5 w-5" />} />
        <KPICard title="Média de Peso" value={pesagens.length > 0 ? `${(pesagens.reduce((s, p) => s + Number(p.peso_kg), 0) / pesagens.length).toFixed(0)} kg` : '-'} icon={<Scale className="h-5 w-5" />} />
      </div>

      <Tabs defaultValue="registros" className="space-y-4">
        <TabsList>
          <TabsTrigger value="registros">Registros</TabsTrigger>
          <TabsTrigger value="evolucao">Evolução por Animal</TabsTrigger>
        </TabsList>

        <TabsContent value="registros">
          <Card><CardContent className="pt-4">
            <Table>
              <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Animal</TableHead><TableHead>Peso (kg)</TableHead><TableHead>Ocasião</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {pesagens.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell>{new Date(p.data + 'T12:00').toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{p.animais?.nome || p.animais?.brinco || '-'}</TableCell>
                    <TableCell className="font-medium">{Number(p.peso_kg).toFixed(1)}</TableCell>
                    <TableCell>{p.ocasiao || '-'}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" onClick={() => del.mutate(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="evolucao">
          <Card>
            <CardHeader><CardTitle className="text-lg font-heading">Evolução de Peso</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="max-w-xs">
                <Label>Selecione o animal</Label>
                <Select value={animalEvolucao} onValueChange={setAnimalEvolucao}>
                  <SelectTrigger><SelectValue placeholder="Animal" /></SelectTrigger>
                  <SelectContent>
                    {animais.map(a => (
                      <SelectItem key={a.id} value={a.id}>{animalLabel(a)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {ganhoInfo && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <KPICard title="Primeiro Registro" value={`${ganhoInfo.primeiro.toFixed(1)} kg`} icon={<Scale className="h-4 w-4" />} />
                  <KPICard title="Último Registro" value={`${ganhoInfo.ultimo.toFixed(1)} kg`} icon={<Scale className="h-4 w-4" />} />
                  <KPICard title="Ganho Total" value={`${ganhoInfo.ganho > 0 ? '+' : ''}${ganhoInfo.ganho.toFixed(1)} kg`} icon={<TrendingUp className="h-4 w-4" />} color={ganhoInfo.ganho >= 0 ? 'success' : 'destructive'} />
                  <KPICard title="Pesagens" value={String(ganhoInfo.registros)} icon={<Scale className="h-4 w-4" />} />
                </div>
              )}

              <div className="h-80">
                {evolucaoData && evolucaoData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={evolucaoData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="data" className="text-xs" />
                      <YAxis className="text-xs" domain={['auto', 'auto']} />
                      <Tooltip formatter={(v: number) => [`${v.toFixed(1)} kg`, 'Peso']} />
                      <Line type="monotone" dataKey="peso" name="Peso (kg)" stroke="hsl(43, 52%, 54%)" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    {animalEvolucao ? 'Nenhuma pesagem encontrada' : 'Selecione um animal para ver a evolução'}
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
