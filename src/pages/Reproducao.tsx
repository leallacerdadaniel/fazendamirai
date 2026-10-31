import { cap } from "@/lib/labels";
import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Plus, Baby, HeartPulse, Droplets, CalendarCheck } from 'lucide-react';
import { KPICard } from '@/components/KPICard';
import { ReproducaoKPIs } from '@/components/ReproducaoKPIs';
import { criarTarefasCobertura, criarTarefasDiagnosticoPositivo, criarTarefasParto } from '@/lib/reproducaoTasks';
import { ReportMenu } from '@/components/ReportMenu';

type Animal = { id: string; nome: string | null; brinco: string | null };

const METODOS = [
  { value: 'IA', label: 'Inseminação Artificial (IA)' },
  { value: 'TE', label: 'Transferência de Embrião (TE)' },
  { value: 'COB', label: 'Cobertura Natural (COB)' },
  { value: 'IATF', label: 'IATF' },
];

const RESULTADOS = [
  { value: 'aguardando', label: 'Aguardando' },
  { value: 'positivo', label: 'Positivo' },
  { value: 'negativo', label: 'Negativo' },
  { value: 'perda', label: 'Perda gestacional' },
];

const FACILIDADES = ['Normal', 'Assistido', 'Difícil', 'Cesariana'];

function animalLabel(a: Animal) {
  return `${a.brinco ? a.brinco + ' - ' : ''}${a.nome || 'Sem nome'}`;
}

export default function Reproducao() {
  const { user, isGestorOrAdmin } = useAuth();
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const activeTab = tab || 'coberturas';
  const qc = useQueryClient();

  // Dialogs
  const [coberturaOpen, setCoberturaOpen] = useState(false);
  const [diagOpen, setDiagOpen] = useState(false);
  const [secagemOpen, setSecagemOpen] = useState(false);
  const [partoOpen, setPartoOpen] = useState(false);

  // Cobertura form
  const [cob, setCob] = useState({
    animal_id: '', metodo: 'IA', data: new Date().toISOString().split('T')[0],
    touro_nome: '', touro_rgd: '', semen_partida: '', embriao_info: '',
    tecnico: '', protocolo: '', resultado: 'aguardando',
    receptora_id: '',
  });

  // Diagnóstico form
  const [diag, setDiag] = useState({
    animal_id: '', data: new Date().toISOString().split('T')[0],
    resultado: 'positivo', metodo: 'Ultrassom', dias_gestacao: '',
  });

  // Secagem form
  const [sec, setSec] = useState({
    animal_id: '', data_secagem: new Date().toISOString().split('T')[0],
    data_ultima_ordenha: '', tratamento: '',
  });

  // Parto form
  const [parto, setParto] = useState({
    vaca_id: '', data: new Date().toISOString().split('T')[0],
    facilidade: 'Normal', peso_bezerro_kg: '', colostro: true,
    criar_bezerro: true, bezerro_nome: '', bezerro_brinco: '', bezerro_sexo: 'Fêmea',
    observacao: '',
    complicacoes: [] as { tipo: string; tratamento: string }[],
  });

  // Fetch animais (fêmeas ativas)
  const { data: femeas } = useQuery({
    queryKey: ['femeas-ativas'],
    queryFn: async () => {
      const { data } = await supabase.from('animais').select('id, nome, brinco')
        .eq('status', 'ativo').in('sexo', ['Fêmea', 'femea', 'F']);
      return (data || []) as Animal[];
    },
  });

  // All animais for receptora selection
  const { data: todosAnimais } = useQuery({
    queryKey: ['todos-animais-repro'],
    queryFn: async () => {
      const { data } = await supabase.from('animais').select('id, nome, brinco').eq('status', 'ativo');
      return (data || []) as Animal[];
    },
  });

  // Coberturas
  const { data: coberturas } = useQuery({
    queryKey: ['reproducoes'],
    queryFn: async () => {
      const { data } = await supabase.from('reproducoes').select('*').order('data', { ascending: false }).limit(100);
      return data || [];
    },
  });

  // Diagnósticos
  const { data: diagnosticos } = useQuery({
    queryKey: ['diagnosticos'],
    queryFn: async () => {
      const { data } = await supabase.from('diagnosticos_gestacao').select('*').order('data', { ascending: false }).limit(100);
      return data || [];
    },
  });

  // Secagens
  const { data: secagens } = useQuery({
    queryKey: ['secagens'],
    queryFn: async () => {
      const { data } = await supabase.from('secagens').select('*').order('data_secagem', { ascending: false }).limit(100);
      return data || [];
    },
  });

  // Partos
  const { data: partos } = useQuery({
    queryKey: ['partos'],
    queryFn: async () => {
      const { data } = await supabase.from('partos').select('*').order('data', { ascending: false }).limit(100);
      return data || [];
    },
  });

  const { data: complicacoes } = useQuery({
    queryKey: ['complicacoes-parto'],
    queryFn: async () => {
      const { data } = await supabase.from('complicacoes_parto').select('*').order('data_inicio', { ascending: false });
      return data || [];
    },
  });

  const totalCoberturas = coberturas?.length || 0;
  const prenhes = diagnosticos?.filter(d => d.resultado === 'positivo').length || 0;
  const totalPartos = partos?.length || 0;
  const totalSecas = secagens?.length || 0;

  const findAnimal = (id: string) => todosAnimais?.find(a => a.id === id);

  // Mutations
  const insertCobertura = useMutation({
    mutationFn: async () => {
      const payload: any = {
        animal_id: cob.animal_id, metodo: cob.metodo, data: cob.data,
        touro_nome: cob.touro_nome || null, touro_rgd: cob.touro_rgd || null,
        semen_partida: cob.semen_partida || null, embriao_info: cob.embriao_info || null,
        tecnico: cob.tecnico || null, protocolo: cob.protocolo || null,
        resultado: cob.resultado,
      };
      if (cob.metodo === 'TE' && cob.receptora_id) payload.receptora_id = cob.receptora_id;
      const { error } = await supabase.from('reproducoes').insert(payload);
      if (error) throw error;

      // Auto-generate tasks for pregnancy confirmation
      const animal = findAnimal(cob.animal_id);
      const label = animal ? animalLabel(animal) : 'Animal';
      await criarTarefasCobertura(cob.animal_id, label, cob.data);
    },
    onSuccess: () => {
      toast.success('Cobertura registrada! Tarefa de confirmação de prenhez criada.');
      qc.invalidateQueries({ queryKey: ['reproducoes'] });
      qc.invalidateQueries({ queryKey: ['tarefas'] });
      setCoberturaOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const insertDiag = useMutation({
    mutationFn: async () => {
      const diasGest = Number(diag.dias_gestacao) || null;
      let previsaoParto: string | null = null;
      if (diag.resultado === 'positivo' && diasGest) {
        const diasRestantes = 283 - diasGest;
        const prev = new Date(diag.data);
        prev.setDate(prev.getDate() + diasRestantes);
        previsaoParto = prev.toISOString().split('T')[0];
      }
      const { error } = await supabase.from('diagnosticos_gestacao').insert({
        animal_id: diag.animal_id, data: diag.data,
        resultado: diag.resultado, metodo: diag.metodo,
        dias_gestacao: diasGest, previsao_parto: previsaoParto,
      });
      if (error) throw error;

      // Auto-generate tasks for sexing and drying if positive
      if (diag.resultado === 'positivo') {
        const animal = findAnimal(diag.animal_id);
        const label = animal ? animalLabel(animal) : 'Animal';
        await criarTarefasDiagnosticoPositivo(diag.animal_id, label, diag.data, diasGest, previsaoParto);
      }
    },
    onSuccess: () => {
      const msg = diag.resultado === 'positivo'
        ? 'Prenhez confirmada! Tarefas de sexagem e secagem criadas.'
        : 'Diagnóstico registrado';
      toast.success(msg);
      qc.invalidateQueries({ queryKey: ['diagnosticos'] });
      qc.invalidateQueries({ queryKey: ['tarefas'] });
      setDiagOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const insertSecagem = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('secagens').insert({
        animal_id: sec.animal_id, data_secagem: sec.data_secagem,
        data_ultima_ordenha: sec.data_ultima_ordenha || null,
        tratamento: sec.tratamento || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Secagem registrada');
      qc.invalidateQueries({ queryKey: ['secagens'] });
      setSecagemOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const insertParto = useMutation({
    mutationFn: async () => {
      let bezerroId: string | null = null;
      const vacaAnimal = findAnimal(parto.vaca_id);

      if (parto.criar_bezerro) {
        const { data: bezerro, error: bErr } = await supabase.from('animais').insert({
          nome: parto.bezerro_nome || null,
          brinco: parto.bezerro_brinco || null,
          sexo: parto.bezerro_sexo,
          nascimento: parto.data,
          tipo: 'Bezerro(a)',
          status: 'ativo',
          mae_nome: vacaAnimal?.nome || null,
          mae_rgd: null,
        }).select('id').single();
        if (bErr) throw bErr;
        bezerroId = bezerro.id;
      }

      const { data: partoData, error } = await supabase.from('partos').insert({
        vaca_id: parto.vaca_id, data: parto.data,
        facilidade: parto.facilidade,
        peso_bezerro_kg: Number(parto.peso_bezerro_kg) || null,
        colostro: parto.colostro,
        bezerro_id: bezerroId,
        observacao: parto.observacao || null,
      }).select('id').single();
      if (error) throw error;

      // Insert complicações if any
      if (parto.complicacoes.length > 0 && partoData) {
        const comps = parto.complicacoes.filter(c => c.tipo).map(c => ({
          parto_id: partoData.id,
          animal_id: parto.vaca_id,
          tipo: c.tipo,
          data_inicio: parto.data,
          tratamento: c.tratamento || null,
        }));
        if (comps.length) {
          const { error: cErr } = await supabase.from('complicacoes_parto').insert(comps);
          if (cErr) throw cErr;
        }
      }

      // Auto-generate retention monitoring + new protocol tasks
      const label = vacaAnimal ? animalLabel(vacaAnimal) : 'Animal';
      await criarTarefasParto(parto.vaca_id, label, parto.data);
    },
    onSuccess: () => {
      toast.success('Parto registrado! Tarefas de acompanhamento de retenção e novo protocolo criadas.');
      qc.invalidateQueries({ queryKey: ['partos'] });
      qc.invalidateQueries({ queryKey: ['animais'] });
      qc.invalidateQueries({ queryKey: ['tarefas'] });
      setPartoOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const Field = ({ label, value, onChange, type = 'text', ...rest }: any) => (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input type={type} value={value} onChange={e => onChange(e.target.value)} className="h-8 text-sm" {...rest} />
    </div>
  );

  const resultadoBadge = (r: string | null) => {
    const map: Record<string, string> = {
      aguardando: 'bg-muted text-muted-foreground',
      positivo: 'bg-green-100 text-green-800',
      negativo: 'bg-red-100 text-red-800',
      perda: 'bg-orange-100 text-orange-800',
    };
    return <Badge className={map[r || 'aguardando'] || ''}>{r || 'aguardando'}</Badge>;
  };

  const buildReproReport = () => {
    // Collect unique animal IDs from coberturas
    const animalIds = new Set<string>();
    coberturas?.forEach(c => animalIds.add(c.animal_id));
    partos?.forEach(p => animalIds.add(p.vaca_id));

    return Array.from(animalIds).map(animalId => {
      const animal = findAnimal(animalId);
      const label = animal ? animalLabel(animal) : animalId.slice(0, 8);

      // Services (coberturas for this animal)
      const servicos = coberturas?.filter(c => c.animal_id === animalId) || [];
      const totalServicos = servicos.length;

      // Positive diagnostics for this animal
      const diagPositivos = diagnosticos?.filter(d => d.animal_id === animalId && d.resultado === 'positivo') || [];
      const totalPositivos = diagPositivos.length;

      // Conception rate
      const taxaConcepcao = totalServicos > 0 ? (totalPositivos / totalServicos) * 100 : 0;

      // Partos for this animal
      const partosAnimal = (partos?.filter(p => p.vaca_id === animalId) || [])
        .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
      const totalPartosAnimal = partosAnimal.length;

      // Calving interval (IEP) - average days between consecutive calvings
      let iepTotal = 0;
      let iepCount = 0;
      for (let i = 1; i < partosAnimal.length; i++) {
        const diff = Math.round((new Date(partosAnimal[i].data).getTime() - new Date(partosAnimal[i - 1].data).getTime()) / 86400000);
        if (diff > 0) { iepTotal += diff; iepCount++; }
      }
      const iepMedio = iepCount > 0 ? Math.round(iepTotal / iepCount) : 0;

      // Services per conception
      const servConcepcao = totalPositivos > 0 ? totalServicos / totalPositivos : 0;

      // Last service
      const ultimoServ = servicos.length ? servicos.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0] : null;

      return {
        id: animalId,
        animal: label,
        servicos: totalServicos,
        _servicos: totalServicos,
        positivos: totalPositivos,
        _positivos: totalPositivos,
        taxa_concepcao: totalServicos > 0 ? `${taxaConcepcao.toFixed(1)}%` : '—',
        _taxa: taxaConcepcao,
        partos: totalPartosAnimal,
        iep_medio: iepMedio > 0 ? String(iepMedio) : '—',
        _iep: iepMedio,
        serv_concepcao: totalPositivos > 0 ? servConcepcao.toFixed(1) : '—',
        ultimo_servico: ultimoServ ? new Date(ultimoServ.data + 'T12:00:00').toLocaleDateString('pt-BR') : '—',
      };
    }).sort((a, b) => b._servicos - a._servicos);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Reprodução</h1>
          <p className="text-muted-foreground">Coberturas, diagnósticos, secagens e partos</p>
        </div>
        <ReportMenu config={{
          title: 'Relatório de Reprodução',
          columns: [
            { header: 'Animal', key: 'animal' },
            { header: 'Método', key: 'metodo' },
            { header: 'Data', key: 'data' },
            { header: 'Doadora', key: 'doadora' },
            { header: 'Touro', key: 'touro_nome' },
            { header: 'Resultado', key: 'resultado' },
          ],
          data: (coberturas || []).map(c => ({
            animal: findAnimal(c.animal_id)?.nome || findAnimal(c.animal_id)?.brinco || c.animal_id.slice(0, 8),
            metodo: c.metodo, data: c.data,
            doadora: (c as any).doadora || '—',
            touro_nome: c.touro_nome || '—',
            resultado: c.resultado || 'aguardando',
          })),
          kpis: [
            { label: 'Coberturas', value: totalCoberturas },
            { label: 'Prenhas', value: prenhes },
            { label: 'Partos', value: totalPartos },
            { label: 'Secagens', value: totalSecas },
          ],
        }} />
      </div>

      <ReproducaoKPIs />

      <Tabs value={activeTab} onValueChange={(v) => navigate(`/reproducao/${v}`)} className="space-y-4">

        {/* =================== COBERTURAS =================== */}
        <TabsContent value="coberturas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-heading">Coberturas / Inseminações</CardTitle>
              {isGestorOrAdmin && (
                <Dialog open={coberturaOpen} onOpenChange={setCoberturaOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Nova Cobertura</Button></DialogTrigger>
                  <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Registrar Cobertura</DialogTitle></DialogHeader>
                    <div className="space-y-3 pt-2">
                      <div>
                        <Label className="text-xs">Animal (Fêmea)</Label>
                        <Select value={cob.animal_id} onValueChange={v => setCob(p => ({ ...p, animal_id: v }))}>
                          <SelectTrigger className="h-8"><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>{femeas?.map(a => <SelectItem key={a.id} value={a.id}>{animalLabel(a)}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Método</Label>
                          <Select value={cap(cob.metodo)} onValueChange={v => setCob(p => ({ ...p, metodo: v }))}>
                            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>{METODOS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <Field label="Data" value={cob.data} onChange={(v: string) => setCob(p => ({ ...p, data: v }))} type="date" />
                      </div>
                      <Separator />
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Touro (Nome)" value={cob.touro_nome} onChange={(v: string) => setCob(p => ({ ...p, touro_nome: v }))} />
                        <Field label="Touro (RGD)" value={cob.touro_rgd} onChange={(v: string) => setCob(p => ({ ...p, touro_rgd: v }))} />
                      </div>
                      {(cob.metodo === 'IA' || cob.metodo === 'IATF') && (
                        <Field label="Partida do Sêmen" value={cob.semen_partida} onChange={(v: string) => setCob(p => ({ ...p, semen_partida: v }))} />
                      )}
                      {cob.metodo === 'TE' && (
                        <>
                          <Field label="Info do Embrião" value={cob.embriao_info} onChange={(v: string) => setCob(p => ({ ...p, embriao_info: v }))} />
                          <div>
                            <Label className="text-xs">Receptora</Label>
                            <Select value={cob.receptora_id} onValueChange={v => setCob(p => ({ ...p, receptora_id: v }))}>
                              <SelectTrigger className="h-8"><SelectValue placeholder="Selecione" /></SelectTrigger>
                              <SelectContent>{femeas?.map(a => <SelectItem key={a.id} value={a.id}>{animalLabel(a)}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                      {cob.metodo === 'IATF' && (
                        <Field label="Protocolo" value={cob.protocolo} onChange={(v: string) => setCob(p => ({ ...p, protocolo: v }))} />
                      )}
                      <Field label="Técnico" value={cob.tecnico} onChange={(v: string) => setCob(p => ({ ...p, tecnico: v }))} />
                      <div>
                        <Label className="text-xs">Resultado</Label>
                        <Select value={cob.resultado} onValueChange={v => setCob(p => ({ ...p, resultado: v }))}>
                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>{RESULTADOS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <Button onClick={() => {
                        if (!cob.animal_id) return toast.error('Selecione o animal');
                        insertCobertura.mutate();
                      }} className="w-full" disabled={insertCobertura.isPending}>
                        {insertCobertura.isPending ? 'Salvando...' : 'Salvar Cobertura'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {coberturas && coberturas.length > 0 ? (
                <div className="max-h-[500px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Animal</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Doadora (mãe)</TableHead>
                        <TableHead>Touro</TableHead>
                        <TableHead>Técnico</TableHead>
                        <TableHead>Resultado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coberturas.map(c => {
                        const animal = findAnimal(c.animal_id);
                        return (
                          <TableRow key={c.id}>
                            <TableCell>{new Date(c.data + 'T12:00:00').toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell>{animal ? animalLabel(animal) : c.animal_id.slice(0, 8)}</TableCell>
                            <TableCell><Badge variant="outline">{cap(c.metodo)}</Badge></TableCell>
                            <TableCell>{(c as any).doadora || '—'}</TableCell>
                            <TableCell>{c.touro_nome || '—'}</TableCell>
                            <TableCell>{c.tecnico || '—'}</TableCell>
                            <TableCell>{resultadoBadge(c.resultado)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhuma cobertura registrada</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* =================== DIAGNÓSTICOS =================== */}
        <TabsContent value="diagnosticos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-heading">Diagnósticos de Gestação</CardTitle>
              {isGestorOrAdmin && (
                <Dialog open={diagOpen} onOpenChange={setDiagOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Novo Diagnóstico</Button></DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Diagnóstico de Gestação</DialogTitle></DialogHeader>
                    <div className="space-y-3 pt-2">
                      <div>
                        <Label className="text-xs">Animal</Label>
                        <Select value={diag.animal_id} onValueChange={v => setDiag(p => ({ ...p, animal_id: v }))}>
                          <SelectTrigger className="h-8"><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>{femeas?.map(a => <SelectItem key={a.id} value={a.id}>{animalLabel(a)}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Data" value={diag.data} onChange={(v: string) => setDiag(p => ({ ...p, data: v }))} type="date" />
                        <div>
                          <Label className="text-xs">Método</Label>
                          <Select value={cap(diag.metodo)} onValueChange={v => setDiag(p => ({ ...p, metodo: v }))}>
                            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Ultrassom">Ultrassom</SelectItem>
                              <SelectItem value="Palpação">Palpação</SelectItem>
                              <SelectItem value="Exame de sangue">Exame de sangue</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Resultado</Label>
                          <Select value={diag.resultado} onValueChange={v => setDiag(p => ({ ...p, resultado: v }))}>
                            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="positivo">Positivo (Prenhe)</SelectItem>
                              <SelectItem value="negativo">Negativo (Vazia)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Field label="Dias de Gestação" value={diag.dias_gestacao} onChange={(v: string) => setDiag(p => ({ ...p, dias_gestacao: v }))} type="number" />
                      </div>
                      {diag.resultado === 'positivo' && diag.dias_gestacao && (
                        <div className="bg-muted p-3 rounded-lg text-sm">
                          <span className="text-muted-foreground">Previsão de parto: </span>
                          <strong>
                            {(() => {
                              const prev = new Date(diag.data);
                              prev.setDate(prev.getDate() + (283 - Number(diag.dias_gestacao)));
                              return prev.toLocaleDateString('pt-BR');
                            })()}
                          </strong>
                        </div>
                      )}
                      <Button onClick={() => {
                        if (!diag.animal_id) return toast.error('Selecione o animal');
                        insertDiag.mutate();
                      }} className="w-full" disabled={insertDiag.isPending}>
                        {insertDiag.isPending ? 'Salvando...' : 'Salvar Diagnóstico'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {diagnosticos && diagnosticos.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Animal</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Resultado</TableHead>
                      <TableHead>Dias Gest.</TableHead>
                      <TableHead>Prev. Parto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {diagnosticos.map(d => {
                      const animal = findAnimal(d.animal_id);
                      return (
                        <TableRow key={d.id}>
                          <TableCell>{new Date(d.data + 'T12:00:00').toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell>{animal ? animalLabel(animal) : d.animal_id.slice(0, 8)}</TableCell>
                          <TableCell>{d.metodo || '—'}</TableCell>
                          <TableCell>{resultadoBadge(d.resultado)}</TableCell>
                          <TableCell>{d.dias_gestacao || '—'}</TableCell>
                          <TableCell>{d.previsao_parto ? new Date(d.previsao_parto + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhum diagnóstico registrado</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* =================== SECAGENS =================== */}
        <TabsContent value="secagens">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-heading">Secagens</CardTitle>
              {isGestorOrAdmin && (
                <Dialog open={secagemOpen} onOpenChange={setSecagemOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Nova Secagem</Button></DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Registrar Secagem</DialogTitle></DialogHeader>
                    <div className="space-y-3 pt-2">
                      <div>
                        <Label className="text-xs">Animal</Label>
                        <Select value={sec.animal_id} onValueChange={v => setSec(p => ({ ...p, animal_id: v }))}>
                          <SelectTrigger className="h-8"><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>{femeas?.map(a => <SelectItem key={a.id} value={a.id}>{animalLabel(a)}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Data da Secagem" value={sec.data_secagem} onChange={(v: string) => setSec(p => ({ ...p, data_secagem: v }))} type="date" />
                        <Field label="Última Ordenha" value={sec.data_ultima_ordenha} onChange={(v: string) => setSec(p => ({ ...p, data_ultima_ordenha: v }))} type="date" />
                      </div>
                      <Field label="Tratamento aplicado" value={sec.tratamento} onChange={(v: string) => setSec(p => ({ ...p, tratamento: v }))} />
                      <Button onClick={() => {
                        if (!sec.animal_id) return toast.error('Selecione o animal');
                        insertSecagem.mutate();
                      }} className="w-full" disabled={insertSecagem.isPending}>
                        {insertSecagem.isPending ? 'Salvando...' : 'Salvar Secagem'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {secagens && secagens.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data Secagem</TableHead>
                      <TableHead>Animal</TableHead>
                      <TableHead>Última Ordenha</TableHead>
                      <TableHead>Tratamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {secagens.map(s => {
                      const animal = findAnimal(s.animal_id);
                      return (
                        <TableRow key={s.id}>
                          <TableCell>{new Date(s.data_secagem + 'T12:00:00').toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell>{animal ? animalLabel(animal) : s.animal_id.slice(0, 8)}</TableCell>
                          <TableCell>{s.data_ultima_ordenha ? new Date(s.data_ultima_ordenha + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</TableCell>
                          <TableCell>{s.tratamento || '—'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhuma secagem registrada</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* =================== PARTOS =================== */}
        <TabsContent value="partos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-heading">Partos</CardTitle>
              {isGestorOrAdmin && (
                <Dialog open={partoOpen} onOpenChange={setPartoOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Novo Parto</Button></DialogTrigger>
                  <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Registrar Parto</DialogTitle></DialogHeader>
                    <div className="space-y-3 pt-2">
                      <div>
                        <Label className="text-xs">Vaca</Label>
                        <Select value={parto.vaca_id} onValueChange={v => setParto(p => ({ ...p, vaca_id: v }))}>
                          <SelectTrigger className="h-8"><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>{femeas?.map(a => <SelectItem key={a.id} value={a.id}>{animalLabel(a)}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Data do Parto" value={parto.data} onChange={(v: string) => setParto(p => ({ ...p, data: v }))} type="date" />
                        <div>
                          <Label className="text-xs">Facilidade</Label>
                          <Select value={parto.facilidade} onValueChange={v => setParto(p => ({ ...p, facilidade: v }))}>
                            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>{FACILIDADES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Peso Bezerro (kg)" value={parto.peso_bezerro_kg} onChange={(v: string) => setParto(p => ({ ...p, peso_bezerro_kg: v }))} type="number" />
                        <div className="flex items-end pb-1 gap-2">
                          <Checkbox checked={parto.colostro} onCheckedChange={v => setParto(p => ({ ...p, colostro: !!v }))} />
                          <Label className="text-xs">Tomou colostro</Label>
                        </div>
                      </div>

                      <Separator />
                      <div className="flex items-center gap-2">
                        <Checkbox checked={parto.criar_bezerro} onCheckedChange={v => setParto(p => ({ ...p, criar_bezerro: !!v }))} />
                        <Label className="text-sm font-medium">Cadastrar bezerro(a) automaticamente</Label>
                      </div>
                      {parto.criar_bezerro && (
                        <div className="space-y-3 pl-2 border-l-2 border-secondary ml-1">
                          <Field label="Nome do Bezerro(a)" value={parto.bezerro_nome} onChange={(v: string) => setParto(p => ({ ...p, bezerro_nome: v }))} />
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Brinco" value={parto.bezerro_brinco} onChange={(v: string) => setParto(p => ({ ...p, bezerro_brinco: v }))} />
                            <div>
                              <Label className="text-xs">Sexo</Label>
                              <Select value={parto.bezerro_sexo} onValueChange={v => setParto(p => ({ ...p, bezerro_sexo: v }))}>
                                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Fêmea">Fêmea</SelectItem>
                                  <SelectItem value="Macho">Macho</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      )}

                      <Separator />
                      <div>
                        <Label className="text-xs">Observação</Label>
                        <Textarea value={parto.observacao} onChange={e => setParto(p => ({ ...p, observacao: e.target.value }))} className="h-16 text-sm" placeholder="Observações sobre o parto..." />
                      </div>

                      <Separator />
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-medium">Complicações Pós-Parto</Label>
                          <Button type="button" variant="outline" size="sm" onClick={() => setParto(p => ({ ...p, complicacoes: [...p.complicacoes, { tipo: '', tratamento: '' }] }))}>
                            <Plus className="h-3 w-3 mr-1" />Adicionar
                          </Button>
                        </div>
                        {parto.complicacoes.map((comp, idx) => (
                          <div key={idx} className="space-y-2 p-2 border rounded-md mb-2 bg-muted/30">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs">Complicação {idx + 1}</Label>
                              <Button type="button" variant="ghost" size="sm" className="h-6 text-xs text-destructive" onClick={() => setParto(p => ({ ...p, complicacoes: p.complicacoes.filter((_, i) => i !== idx) }))}>Remover</Button>
                            </div>
                            <Select value={cap(comp.tipo)} onValueChange={v => setParto(p => ({ ...p, complicacoes: p.complicacoes.map((c, i) => i === idx ? { ...c, tipo: v } : c) }))}>
                              <SelectTrigger className="h-8"><SelectValue placeholder="Tipo de complicação" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Retenção de placenta">Retenção de placenta</SelectItem>
                                <SelectItem value="Metrite">Metrite</SelectItem>
                                <SelectItem value="Hipocalcemia">Hipocalcemia</SelectItem>
                                <SelectItem value="Cetose">Cetose</SelectItem>
                                <SelectItem value="Deslocamento de abomaso">Deslocamento de abomaso</SelectItem>
                                <SelectItem value="Prolapso uterino">Prolapso uterino</SelectItem>
                                <SelectItem value="Outro">Outro</SelectItem>
                              </SelectContent>
                            </Select>
                            <Field label="Tratamento" value={comp.tratamento} onChange={(v: string) => setParto(p => ({ ...p, complicacoes: p.complicacoes.map((c, i) => i === idx ? { ...c, tratamento: v } : c) }))} />
                          </div>
                        ))}
                      </div>

                      <Button onClick={() => {
                        if (!parto.vaca_id) return toast.error('Selecione a vaca');
                        insertParto.mutate();
                      }} className="w-full" disabled={insertParto.isPending}>
                        {insertParto.isPending ? 'Salvando...' : 'Salvar Parto'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {partos && partos.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Vaca</TableHead>
                      <TableHead>Facilidade</TableHead>
                      <TableHead>Peso (kg)</TableHead>
                      <TableHead>Colostro</TableHead>
                      <TableHead>Bezerro</TableHead>
                      <TableHead>Obs / Complicações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partos.map(p => {
                      const vaca = findAnimal(p.vaca_id);
                      const bezerro = p.bezerro_id ? findAnimal(p.bezerro_id) : null;
                      const comps = complicacoes?.filter((c: any) => c.parto_id === p.id) || [];
                      return (
                        <TableRow key={p.id}>
                          <TableCell>{new Date(p.data + 'T12:00:00').toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell>{vaca ? animalLabel(vaca) : p.vaca_id.slice(0, 8)}</TableCell>
                          <TableCell>{p.facilidade || '—'}</TableCell>
                          <TableCell>{p.peso_bezerro_kg || '—'}</TableCell>
                          <TableCell>{p.colostro ? '✓' : '✗'}</TableCell>
                          <TableCell>{bezerro ? animalLabel(bezerro) : (p.bezerro_id ? p.bezerro_id.slice(0, 8) : '—')}</TableCell>
                          <TableCell>
                            {(p as any).observacao && <span className="text-xs text-muted-foreground block">{(p as any).observacao}</span>}
                            {comps.map((c: any) => (
                              <Badge key={c.id} variant="destructive" className="text-xs mr-1 mb-0.5">{cap(c.tipo)}</Badge>
                            ))}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhum parto registrado</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* =================== RELATÓRIO POR ANIMAL =================== */}
        <TabsContent value="relatorio">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-heading">Relatório Reprodutivo por Animal</CardTitle>
              <ReportMenu config={(() => {
                const report = buildReproReport();
                return {
                  title: 'Relatório Reprodutivo por Animal',
                  subtitle: `Gerado com ${report.length} animais`,
                  columns: [
                    { header: 'Animal', key: 'animal', width: 22 },
                    { header: 'Serviços (IA/TE/COB)', key: 'servicos', width: 14 },
                    { header: 'Positivos', key: 'positivos', width: 10 },
                    { header: 'Taxa Concepção', key: 'taxa_concepcao', width: 14 },
                    { header: 'Partos', key: 'partos', width: 8 },
                    { header: 'IEP Médio (dias)', key: 'iep_medio', width: 14 },
                    { header: 'Serv/Concepção', key: 'serv_concepcao', width: 14 },
                    { header: 'Último Serviço', key: 'ultimo_servico', width: 14 },
                  ],
                  data: report,
                  kpis: [
                    { label: 'Animais', value: report.length },
                    { label: 'Taxa Concepção Geral', value: (() => { const tot = report.reduce((s, r) => s + r._servicos, 0); const pos = report.reduce((s, r) => s + r._positivos, 0); return tot > 0 ? `${((pos / tot) * 100).toFixed(1)}%` : '—'; })() },
                    { label: 'IEP Médio Geral (dias)', value: (() => { const ieps = report.filter(r => r._iep > 0).map(r => r._iep); return ieps.length ? Math.round(ieps.reduce((a, b) => a + b, 0) / ieps.length) : '—'; })() },
                    { label: 'Serv/Concepção Geral', value: (() => { const tot = report.reduce((s, r) => s + r._servicos, 0); const pos = report.reduce((s, r) => s + r._positivos, 0); return pos > 0 ? (tot / pos).toFixed(1) : '—'; })() },
                  ],
                  orientation: 'landscape' as const,
                };
              })()} />
            </CardHeader>
            <CardContent>
              {(() => {
                const report = buildReproReport();
                if (!report.length) return <p className="text-center text-muted-foreground py-8">Nenhum dado reprodutivo encontrado</p>;
                return (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Animal</TableHead>
                          <TableHead className="text-center">Serviços</TableHead>
                          <TableHead className="text-center">Positivos</TableHead>
                          <TableHead className="text-center">Taxa Concepção</TableHead>
                          <TableHead className="text-center">Partos</TableHead>
                          <TableHead className="text-center">IEP Médio (dias)</TableHead>
                          <TableHead className="text-center">Serv/Concepção</TableHead>
                          <TableHead>Último Serviço</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.map(r => (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">{r.animal}</TableCell>
                            <TableCell className="text-center">{r.servicos}</TableCell>
                            <TableCell className="text-center">{r.positivos}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={r._taxa >= 50 ? 'default' : r._taxa > 0 ? 'secondary' : 'outline'} className="text-xs">{r.taxa_concepcao}</Badge>
                            </TableCell>
                            <TableCell className="text-center">{r.partos}</TableCell>
                            <TableCell className="text-center">{r.iep_medio}</TableCell>
                            <TableCell className="text-center">{r.serv_concepcao}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{r.ultimo_servico}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
