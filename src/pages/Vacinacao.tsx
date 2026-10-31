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
import { Plus, Trash2, Syringe, Package, Users } from 'lucide-react';
import { ReportMenu } from '@/components/ReportMenu';

export default function Vacinacao() {
  const [openVacina, setOpenVacina] = useState(false);
  const [openRegistro, setOpenRegistro] = useState(false);
  const [openCampanha, setOpenCampanha] = useState(false);
  const qc = useQueryClient();

  const [vacinaForm, setVacinaForm] = useState({ nome: '', fabricante: '', lote: '', doses: '', custo: '', validade: '', temp_armazenamento: '' });
  const [regForm, setRegForm] = useState({ animal_id: '', vacina_id: '', data: new Date().toISOString().slice(0, 10), lote: '', proxima_dose: '' });
  const [campForm, setCampForm] = useState({ nome: '', data: '', vacina_id: '', responsavel: '', observacao: '' });

  const { data: vacinas = [] } = useQuery({ queryKey: ['vacinas'], queryFn: async () => { const { data } = await supabase.from('vacinas').select('*').order('nome'); return data || []; } });
  const { data: vacinacoes = [] } = useQuery({ queryKey: ['vacinacoes'], queryFn: async () => { const { data } = await supabase.from('vacinacoes').select('*, animais(nome, brinco), vacinas(nome)').order('data', { ascending: false }).limit(200); return data || []; } });
  const { data: campanhas = [] } = useQuery({ queryKey: ['campanhas'], queryFn: async () => { const { data } = await supabase.from('campanhas_vacinacao').select('*, vacinas(nome)').order('data', { ascending: false }); return data || []; } });
  const { data: animais = [] } = useQuery({ queryKey: ['animais-ativos'], queryFn: async () => { const { data } = await supabase.from('animais').select('id, nome, brinco').eq('status', 'ativo').order('nome'); return data || []; } });

  const saveVacina = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('vacinas').insert({ ...vacinaForm, doses: vacinaForm.doses ? Number(vacinaForm.doses) : null, custo: vacinaForm.custo ? Number(vacinaForm.custo) : null });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vacinas'] }); toast.success('Vacina cadastrada!'); setOpenVacina(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const saveRegistro = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('vacinacoes').insert({ ...regForm, proxima_dose: regForm.proxima_dose || null, vacina_id: regForm.vacina_id || null });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vacinacoes'] }); toast.success('Vacinação registrada!'); setOpenRegistro(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const saveCampanha = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('campanhas_vacinacao').insert({ ...campForm, vacina_id: campForm.vacina_id || null, data: campForm.data || null });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campanhas'] }); toast.success('Campanha criada!'); setOpenCampanha(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const delVacinacao = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('vacinacoes').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vacinacoes'] }); toast.success('Excluído!'); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-heading font-bold">Vacinação</h1><p className="text-muted-foreground">Estoque de vacinas, campanhas e registros</p></div>
        <div className="flex gap-2">
          <ReportMenu config={{
            title: 'Relatório de Vacinação',
            columns: [
              { header: 'Animal', key: 'animal' },
              { header: 'Vacina', key: 'vacina' },
              { header: 'Data', key: 'data' },
              { header: 'Lote', key: 'lote' },
              { header: 'Próxima Dose', key: 'proxima_dose' },
            ],
            data: vacinacoes.map((v: any) => ({
              animal: v.animais ? `${v.animais.brinco || ''} ${v.animais.nome || ''}`.trim() : '—',
              vacina: v.vacinas?.nome || '—',
              data: v.data, lote: v.lote || '—',
              proxima_dose: v.proxima_dose || '—',
            })),
            kpis: [
              { label: 'Total Vacinas', value: vacinas.length },
              { label: 'Registros', value: vacinacoes.length },
              { label: 'Campanhas', value: campanhas.length },
            ],
          }} />
          <Dialog open={openVacina} onOpenChange={setOpenVacina}><DialogTrigger asChild><Button variant="outline"><Package className="h-4 w-4 mr-1" />Nova Vacina</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Cadastrar Vacina</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1"><Label>Nome</Label><Input value={vacinaForm.nome} onChange={e => setVacinaForm(f => ({ ...f, nome: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Fabricante</Label><Input value={vacinaForm.fabricante} onChange={e => setVacinaForm(f => ({ ...f, fabricante: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Lote</Label><Input value={vacinaForm.lote} onChange={e => setVacinaForm(f => ({ ...f, lote: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1"><Label>Doses</Label><Input type="number" value={vacinaForm.doses} onChange={e => setVacinaForm(f => ({ ...f, doses: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Custo (R$)</Label><Input type="number" step="0.01" value={vacinaForm.custo} onChange={e => setVacinaForm(f => ({ ...f, custo: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Validade</Label><Input type="date" value={vacinaForm.validade} onChange={e => setVacinaForm(f => ({ ...f, validade: e.target.value }))} /></div>
                </div>
                <Button onClick={() => saveVacina.mutate()} disabled={!vacinaForm.nome} className="w-full bg-secondary text-secondary-foreground">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={openCampanha} onOpenChange={setOpenCampanha}><DialogTrigger asChild><Button variant="outline"><Users className="h-4 w-4 mr-1" />Nova Campanha</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Nova Campanha</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1"><Label>Nome</Label><Input value={campForm.nome} onChange={e => setCampForm(f => ({ ...f, nome: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Vacina</Label>
                    <Select value={campForm.vacina_id} onValueChange={v => setCampForm(f => ({ ...f, vacina_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{vacinas.map(v => <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label>Data</Label><Input type="date" value={campForm.data} onChange={e => setCampForm(f => ({ ...f, data: e.target.value }))} /></div>
                </div>
                <div className="space-y-1"><Label>Responsável</Label><Input value={campForm.responsavel} onChange={e => setCampForm(f => ({ ...f, responsavel: e.target.value }))} /></div>
                <Button onClick={() => saveCampanha.mutate()} disabled={!campForm.nome} className="w-full bg-secondary text-secondary-foreground">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={openRegistro} onOpenChange={setOpenRegistro}><DialogTrigger asChild><Button className="bg-secondary text-secondary-foreground"><Plus className="h-4 w-4 mr-1" />Registrar Vacinação</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Registrar Vacinação</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1"><Label>Animal</Label>
                  <Select value={regForm.animal_id} onValueChange={v => setRegForm(f => ({ ...f, animal_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{animais.map(a => <SelectItem key={a.id} value={a.id}>{a.nome || a.brinco || 'Sem nome'}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Vacina</Label>
                    <Select value={regForm.vacina_id} onValueChange={v => setRegForm(f => ({ ...f, vacina_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{vacinas.map(v => <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label>Data</Label><Input type="date" value={regForm.data} onChange={e => setRegForm(f => ({ ...f, data: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Lote</Label><Input value={regForm.lote} onChange={e => setRegForm(f => ({ ...f, lote: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Próxima Dose</Label><Input type="date" value={regForm.proxima_dose} onChange={e => setRegForm(f => ({ ...f, proxima_dose: e.target.value }))} /></div>
                </div>
                <Button onClick={() => saveRegistro.mutate()} disabled={!regForm.animal_id} className="w-full bg-secondary text-secondary-foreground">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard title="Vacinas em Estoque" value={String(vacinas.length)} icon={<Package className="h-5 w-5" />} />
        <KPICard title="Vacinações Registradas" value={String(vacinacoes.length)} icon={<Syringe className="h-5 w-5" />} />
        <KPICard title="Campanhas" value={String(campanhas.length)} icon={<Users className="h-5 w-5" />} />
      </div>

      <Tabs defaultValue="registros">
        <TabsList>
          <TabsTrigger value="registros">Registros</TabsTrigger>
          <TabsTrigger value="estoque">Estoque de Vacinas</TabsTrigger>
          <TabsTrigger value="campanhas">Campanhas</TabsTrigger>
        </TabsList>
        <TabsContent value="registros">
          <Card><CardContent className="pt-4">
            <Table>
              <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Animal</TableHead><TableHead>Vacina</TableHead><TableHead>Lote</TableHead><TableHead>Próxima Dose</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {vacinacoes.map((v: any) => (
                  <TableRow key={v.id}>
                    <TableCell>{new Date(v.data + 'T12:00').toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{v.animais?.nome || v.animais?.brinco || '-'}</TableCell>
                    <TableCell>{v.vacinas?.nome || '-'}</TableCell>
                    <TableCell>{v.lote || '-'}</TableCell>
                    <TableCell>{v.proxima_dose ? new Date(v.proxima_dose + 'T12:00').toLocaleDateString('pt-BR') : '-'}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" onClick={() => delVacinacao.mutate(v.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="estoque">
          <Card><CardContent className="pt-4">
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Fabricante</TableHead><TableHead>Lote</TableHead><TableHead>Doses</TableHead><TableHead>Custo</TableHead><TableHead>Validade</TableHead></TableRow></TableHeader>
              <TableBody>
                {vacinas.map(v => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.nome}</TableCell>
                    <TableCell>{v.fabricante || '-'}</TableCell>
                    <TableCell>{v.lote || '-'}</TableCell>
                    <TableCell>{v.doses || '-'}</TableCell>
                    <TableCell>{v.custo ? `R$ ${Number(v.custo).toFixed(2)}` : '-'}</TableCell>
                    <TableCell>{v.validade ? new Date(v.validade + 'T12:00').toLocaleDateString('pt-BR') : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="campanhas">
          <Card><CardContent className="pt-4">
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Vacina</TableHead><TableHead>Data</TableHead><TableHead>Responsável</TableHead></TableRow></TableHeader>
              <TableBody>
                {campanhas.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell>{c.vacinas?.nome || '-'}</TableCell>
                    <TableCell>{c.data ? new Date(c.data + 'T12:00').toLocaleDateString('pt-BR') : '-'}</TableCell>
                    <TableCell>{c.responsavel || '-'}</TableCell>
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
