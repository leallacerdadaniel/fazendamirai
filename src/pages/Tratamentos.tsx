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
import { KPICard } from '@/components/KPICard';
import { toast } from 'sonner';
import { Plus, Trash2, HeartPulse, Pill, AlertTriangle } from 'lucide-react';
import { ReportMenu } from '@/components/ReportMenu';

export default function Tratamentos() {
  const [openTrat, setOpenTrat] = useState(false);
  const [openMed, setOpenMed] = useState(false);
  const [openMastite, setOpenMastite] = useState(false);
  const qc = useQueryClient();

  const [tratForm, setTratForm] = useState({ animal_id: '', data_inicio: new Date().toISOString().slice(0, 10), diagnostico: '', data_fim: '', desfecho: '' });
  const [medForm, setMedForm] = useState({ nome: '', principio_ativo: '', carencia_dias: '', quantidade: '', custo: '', lote: '', validade: '' });
  const [mastForm, setMastForm] = useState({ animal_id: '', data_inicio: new Date().toISOString().slice(0, 10), quarto: '', resultado_cmt: '', tratamento: '', descarte_dias: '' });

  const { data: tratamentos = [] } = useQuery({ queryKey: ['tratamentos'], queryFn: async () => { const { data } = await supabase.from('tratamentos').select('*, animais(nome, brinco)').order('data_inicio', { ascending: false }).limit(200); return data || []; } });
  const { data: medicamentos = [] } = useQuery({ queryKey: ['medicamentos'], queryFn: async () => { const { data } = await supabase.from('medicamentos').select('*').order('nome'); return data || []; } });
  const { data: mastites = [] } = useQuery({ queryKey: ['mastites'], queryFn: async () => { const { data } = await supabase.from('mastites').select('*, animais(nome, brinco)').order('data_inicio', { ascending: false }); return data || []; } });
  const { data: animais = [] } = useQuery({ queryKey: ['animais-ativos'], queryFn: async () => { const { data } = await supabase.from('animais').select('id, nome, brinco').eq('status', 'ativo').order('nome'); return data || []; } });

  const saveTrat = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('tratamentos').insert({ ...tratForm, data_fim: tratForm.data_fim || null, desfecho: tratForm.desfecho || null });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tratamentos'] }); toast.success('Tratamento registrado!'); setOpenTrat(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const saveMed = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('medicamentos').insert({ ...medForm, carencia_dias: medForm.carencia_dias ? Number(medForm.carencia_dias) : null, quantidade: medForm.quantidade ? Number(medForm.quantidade) : null, custo: medForm.custo ? Number(medForm.custo) : null, validade: medForm.validade || null });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['medicamentos'] }); toast.success('Medicamento cadastrado!'); setOpenMed(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const saveMastite = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('mastites').insert({ ...mastForm, descarte_dias: mastForm.descarte_dias ? Number(mastForm.descarte_dias) : null });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mastites'] }); toast.success('Mastite registrada!'); setOpenMastite(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const delTrat = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('tratamentos').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tratamentos'] }); toast.success('Excluído!'); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div><h1 className="text-2xl font-heading font-bold">Tratamentos e Saúde</h1><p className="text-muted-foreground">Tratamentos, medicamentos e mastite</p></div>
        <div className="flex gap-2 flex-wrap">
          <ReportMenu config={{
            title: 'Relatório de Tratamentos e Saúde',
            columns: [
              { header: 'Animal', key: 'animal' },
              { header: 'Diagnóstico', key: 'diagnostico' },
              { header: 'Início', key: 'data_inicio' },
              { header: 'Fim', key: 'data_fim' },
              { header: 'Desfecho', key: 'desfecho' },
            ],
            data: tratamentos.map((t: any) => ({
              animal: t.animais ? `${t.animais.brinco || ''} ${t.animais.nome || ''}`.trim() : '—',
              diagnostico: t.diagnostico || '—',
              data_inicio: t.data_inicio, data_fim: t.data_fim || '—',
              desfecho: t.desfecho || '—',
            })),
            kpis: [
              { label: 'Tratamentos', value: tratamentos.length },
              { label: 'Medicamentos', value: medicamentos.length },
              { label: 'Mastites', value: mastites.length },
            ],
          }} />
          <Dialog open={openMed} onOpenChange={setOpenMed}><DialogTrigger asChild><Button variant="outline"><Pill className="h-4 w-4 mr-1" />Novo Medicamento</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Cadastrar Medicamento</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1"><Label>Nome</Label><Input value={medForm.nome} onChange={e => setMedForm(f => ({ ...f, nome: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Princípio Ativo</Label><Input value={medForm.principio_ativo} onChange={e => setMedForm(f => ({ ...f, principio_ativo: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Carência (dias)</Label><Input type="number" value={medForm.carencia_dias} onChange={e => setMedForm(f => ({ ...f, carencia_dias: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1"><Label>Qtd</Label><Input type="number" value={medForm.quantidade} onChange={e => setMedForm(f => ({ ...f, quantidade: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Custo (R$)</Label><Input type="number" step="0.01" value={medForm.custo} onChange={e => setMedForm(f => ({ ...f, custo: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Validade</Label><Input type="date" value={medForm.validade} onChange={e => setMedForm(f => ({ ...f, validade: e.target.value }))} /></div>
                </div>
                <Button onClick={() => saveMed.mutate()} disabled={!medForm.nome} className="w-full bg-secondary text-secondary-foreground">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={openMastite} onOpenChange={setOpenMastite}><DialogTrigger asChild><Button variant="outline"><AlertTriangle className="h-4 w-4 mr-1" />Registrar Mastite</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Registrar Mastite</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1"><Label>Animal</Label>
                  <Select value={mastForm.animal_id} onValueChange={v => setMastForm(f => ({ ...f, animal_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{animais.map(a => <SelectItem key={a.id} value={a.id}>{a.nome || a.brinco || 'Sem nome'}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Data Início</Label><Input type="date" value={mastForm.data_inicio} onChange={e => setMastForm(f => ({ ...f, data_inicio: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Quarto</Label>
                    <Select value={mastForm.quarto} onValueChange={v => setMastForm(f => ({ ...f, quarto: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AD">Anterior Direito</SelectItem>
                        <SelectItem value="AE">Anterior Esquerdo</SelectItem>
                        <SelectItem value="PD">Posterior Direito</SelectItem>
                        <SelectItem value="PE">Posterior Esquerdo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>CMT</Label><Input value={mastForm.resultado_cmt} onChange={e => setMastForm(f => ({ ...f, resultado_cmt: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Descarte (dias)</Label><Input type="number" value={mastForm.descarte_dias} onChange={e => setMastForm(f => ({ ...f, descarte_dias: e.target.value }))} /></div>
                </div>
                <div className="space-y-1"><Label>Tratamento</Label><Input value={mastForm.tratamento} onChange={e => setMastForm(f => ({ ...f, tratamento: e.target.value }))} /></div>
                <Button onClick={() => saveMastite.mutate()} disabled={!mastForm.animal_id} className="w-full bg-secondary text-secondary-foreground">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={openTrat} onOpenChange={setOpenTrat}><DialogTrigger asChild><Button className="bg-secondary text-secondary-foreground"><Plus className="h-4 w-4 mr-1" />Novo Tratamento</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Novo Tratamento</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1"><Label>Animal</Label>
                  <Select value={tratForm.animal_id} onValueChange={v => setTratForm(f => ({ ...f, animal_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{animais.map(a => <SelectItem key={a.id} value={a.id}>{a.nome || a.brinco || 'Sem nome'}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Diagnóstico</Label><Input value={tratForm.diagnostico} onChange={e => setTratForm(f => ({ ...f, diagnostico: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Data Início</Label><Input type="date" value={tratForm.data_inicio} onChange={e => setTratForm(f => ({ ...f, data_inicio: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Data Fim</Label><Input type="date" value={tratForm.data_fim} onChange={e => setTratForm(f => ({ ...f, data_fim: e.target.value }))} /></div>
                </div>
                <div className="space-y-1"><Label>Desfecho</Label><Input value={tratForm.desfecho} onChange={e => setTratForm(f => ({ ...f, desfecho: e.target.value }))} /></div>
                <Button onClick={() => saveTrat.mutate()} disabled={!tratForm.animal_id} className="w-full bg-secondary text-secondary-foreground">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard title="Tratamentos" value={String(tratamentos.length)} icon={<HeartPulse className="h-5 w-5" />} />
        <KPICard title="Medicamentos" value={String(medicamentos.length)} icon={<Pill className="h-5 w-5" />} />
        <KPICard title="Mastites" value={String(mastites.length)} icon={<AlertTriangle className="h-5 w-5" />} />
      </div>

      <Tabs defaultValue="tratamentos">
        <TabsList><TabsTrigger value="tratamentos">Tratamentos</TabsTrigger><TabsTrigger value="medicamentos">Medicamentos</TabsTrigger><TabsTrigger value="mastites">Mastites</TabsTrigger></TabsList>
        <TabsContent value="tratamentos">
          <Card><CardContent className="pt-4">
            <Table>
              <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Animal</TableHead><TableHead>Diagnóstico</TableHead><TableHead>Fim</TableHead><TableHead>Desfecho</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {tratamentos.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell>{new Date(t.data_inicio + 'T12:00').toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{t.animais?.nome || t.animais?.brinco || '-'}</TableCell>
                    <TableCell>{t.diagnostico || '-'}</TableCell>
                    <TableCell>{t.data_fim ? new Date(t.data_fim + 'T12:00').toLocaleDateString('pt-BR') : 'Em andamento'}</TableCell>
                    <TableCell>{t.desfecho || '-'}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" onClick={() => delTrat.mutate(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="medicamentos">
          <Card><CardContent className="pt-4">
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Princípio Ativo</TableHead><TableHead>Carência</TableHead><TableHead>Qtd</TableHead><TableHead>Custo</TableHead><TableHead>Validade</TableHead></TableRow></TableHeader>
              <TableBody>
                {medicamentos.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.nome}</TableCell>
                    <TableCell>{m.principio_ativo || '-'}</TableCell>
                    <TableCell>{m.carencia_dias ? `${m.carencia_dias}d` : '-'}</TableCell>
                    <TableCell>{m.quantidade ?? '-'}</TableCell>
                    <TableCell>{m.custo ? `R$ ${Number(m.custo).toFixed(2)}` : '-'}</TableCell>
                    <TableCell>{m.validade ? new Date(m.validade + 'T12:00').toLocaleDateString('pt-BR') : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="mastites">
          <Card><CardContent className="pt-4">
            <Table>
              <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Animal</TableHead><TableHead>Quarto</TableHead><TableHead>CMT</TableHead><TableHead>Tratamento</TableHead><TableHead>Descarte</TableHead></TableRow></TableHeader>
              <TableBody>
                {mastites.map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell>{new Date(m.data_inicio + 'T12:00').toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{m.animais?.nome || m.animais?.brinco || '-'}</TableCell>
                    <TableCell>{m.quarto || '-'}</TableCell>
                    <TableCell>{m.resultado_cmt || '-'}</TableCell>
                    <TableCell>{m.tratamento || '-'}</TableCell>
                    <TableCell>{m.descarte_dias ? `${m.descarte_dias}d` : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
