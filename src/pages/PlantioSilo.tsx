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
import { KPICard } from '@/components/KPICard';
import { toast } from 'sonner';
import { Plus, Trash2, Wheat, Database, Package } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { PlantioOrcamento } from '@/components/PlantioOrcamento';

export default function PlantioSilo() {
  const [openPlantio, setOpenPlantio] = useState(false);
  const [openSilo, setOpenSilo] = useState(false);
  const [openConsumo, setOpenConsumo] = useState(false);
  const qc = useQueryClient();

  const [plantForm, setPlantForm] = useState({ cultura: '', variedade: '', area_ha: '', data: '', fase: 'plantio', fertilizante: '', custo_semente: '' });
  const [siloForm, setSiloForm] = useState({ identificacao: '', tonelagem_inicial: '', data_corte: '' });
  const [consForm, setConsForm] = useState({ silo_id: '', quantidade_ton: '', data: new Date().toISOString().slice(0, 10), lote_id: '' });

  const { data: plantios = [] } = useQuery({ queryKey: ['plantios'], queryFn: async () => { const { data } = await supabase.from('plantios').select('*').order('data', { ascending: false }); return data || []; } });
  const { data: silos = [] } = useQuery({ queryKey: ['silos'], queryFn: async () => { const { data } = await supabase.from('silos').select('*').order('identificacao'); return data || []; } });
  const { data: consumos = [] } = useQuery({ queryKey: ['consumos-silo'], queryFn: async () => { const { data } = await supabase.from('consumo_silo').select('*, silos(identificacao), lotes(nome)').order('data', { ascending: false }).limit(100); return data || []; } });
  const { data: lotes = [] } = useQuery({ queryKey: ['lotes'], queryFn: async () => { const { data } = await supabase.from('lotes').select('id, nome'); return data || []; } });

  const totalSiloAtual = silos.reduce((s, si) => s + Number(si.tonelagem_atual ?? 0), 0);

  const savePlantio = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('plantios').insert({ ...plantForm, area_ha: plantForm.area_ha ? Number(plantForm.area_ha) : null, custo_semente: plantForm.custo_semente ? Number(plantForm.custo_semente) : null, data: plantForm.data || null });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['plantios'] }); toast.success('Plantio cadastrado!'); setOpenPlantio(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const saveSilo = useMutation({
    mutationFn: async () => {
      const ton = siloForm.tonelagem_inicial ? Number(siloForm.tonelagem_inicial) : 0;
      const { error } = await supabase.from('silos').insert({ ...siloForm, tonelagem_inicial: ton, tonelagem_atual: ton, data_corte: siloForm.data_corte || null });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['silos'] }); toast.success('Silo cadastrado!'); setOpenSilo(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const saveConsumo = useMutation({
    mutationFn: async () => {
      const qtd = Number(consForm.quantidade_ton);
      const { error } = await supabase.from('consumo_silo').insert({ ...consForm, quantidade_ton: qtd, lote_id: consForm.lote_id || null });
      if (error) throw error;
      const silo = silos.find(s => s.id === consForm.silo_id);
      if (silo) {
        await supabase.from('silos').update({ tonelagem_atual: Math.max(0, Number(silo.tonelagem_atual ?? 0) - qtd) }).eq('id', consForm.silo_id);
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['silos', 'consumos-silo'] }); toast.success('Consumo registrado!'); setOpenConsumo(false); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div><h1 className="text-2xl font-heading font-bold">Plantio e Silo</h1><p className="text-muted-foreground">Culturas, silos e consumo de silagem</p></div>
        <div className="flex gap-2">
          <Dialog open={openPlantio} onOpenChange={setOpenPlantio}><DialogTrigger asChild><Button variant="outline"><Wheat className="h-4 w-4 mr-1" />Novo Plantio</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Cadastrar Plantio</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Cultura</Label><Input value={plantForm.cultura} onChange={e => setPlantForm(f => ({ ...f, cultura: e.target.value }))} placeholder="Milho, Sorgo..." /></div>
                  <div className="space-y-1"><Label>Variedade</Label><Input value={plantForm.variedade} onChange={e => setPlantForm(f => ({ ...f, variedade: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1"><Label>Área (ha)</Label><Input type="number" step="0.1" value={plantForm.area_ha} onChange={e => setPlantForm(f => ({ ...f, area_ha: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Data</Label><Input type="date" value={plantForm.data} onChange={e => setPlantForm(f => ({ ...f, data: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Fase</Label>
                    <Select value={cap(plantForm.fase)} onValueChange={v => setPlantForm(f => ({ ...f, fase: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="plantio">Plantio</SelectItem>
                        <SelectItem value="crescimento">Crescimento</SelectItem>
                        <SelectItem value="colheita">Colheita</SelectItem>
                        <SelectItem value="ensilagem">Ensilagem</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Fertilizante</Label><Input value={plantForm.fertilizante} onChange={e => setPlantForm(f => ({ ...f, fertilizante: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Custo Semente</Label><Input type="number" step="0.01" value={plantForm.custo_semente} onChange={e => setPlantForm(f => ({ ...f, custo_semente: e.target.value }))} /></div>
                </div>
                <Button onClick={() => savePlantio.mutate()} disabled={!plantForm.cultura} className="w-full bg-secondary text-secondary-foreground">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={openSilo} onOpenChange={setOpenSilo}><DialogTrigger asChild><Button variant="outline"><Database className="h-4 w-4 mr-1" />Novo Silo</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Cadastrar Silo</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1"><Label>Identificação</Label><Input value={siloForm.identificacao} onChange={e => setSiloForm(f => ({ ...f, identificacao: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Tonelagem Inicial</Label><Input type="number" step="0.1" value={siloForm.tonelagem_inicial} onChange={e => setSiloForm(f => ({ ...f, tonelagem_inicial: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Data Corte</Label><Input type="date" value={siloForm.data_corte} onChange={e => setSiloForm(f => ({ ...f, data_corte: e.target.value }))} /></div>
                </div>
                <Button onClick={() => saveSilo.mutate()} disabled={!siloForm.identificacao} className="w-full bg-secondary text-secondary-foreground">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={openConsumo} onOpenChange={setOpenConsumo}><DialogTrigger asChild><Button className="bg-secondary text-secondary-foreground"><Plus className="h-4 w-4 mr-1" />Registrar Consumo</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Registrar Consumo de Silo</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1"><Label>Silo</Label>
                  <Select value={consForm.silo_id} onValueChange={v => setConsForm(f => ({ ...f, silo_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{silos.map(s => <SelectItem key={s.id} value={s.id}>{s.identificacao} ({Number(s.tonelagem_atual ?? 0).toFixed(1)}t)</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Quantidade (ton)</Label><Input type="number" step="0.1" value={consForm.quantidade_ton} onChange={e => setConsForm(f => ({ ...f, quantidade_ton: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Data</Label><Input type="date" value={consForm.data} onChange={e => setConsForm(f => ({ ...f, data: e.target.value }))} /></div>
                </div>
                <div className="space-y-1"><Label>Lote (opcional)</Label>
                  <Select value={consForm.lote_id} onValueChange={v => setConsForm(f => ({ ...f, lote_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                    <SelectContent><SelectItem value="">Nenhum</SelectItem>{lotes.map(l => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button onClick={() => saveConsumo.mutate()} disabled={!consForm.silo_id || !consForm.quantidade_ton} className="w-full bg-secondary text-secondary-foreground">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard title="Plantios Ativos" value={String(plantios.length)} icon={<Wheat className="h-5 w-5" />} />
        <KPICard title="Silos" value={String(silos.length)} icon={<Database className="h-5 w-5" />} />
        <KPICard title="Silagem Disponível" value={`${totalSiloAtual.toFixed(1)}t`} icon={<Package className="h-5 w-5" />} />
      </div>

      {silos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {silos.map(s => {
            const pct = Number(s.tonelagem_inicial ?? 1) > 0 ? (Number(s.tonelagem_atual ?? 0) / Number(s.tonelagem_inicial)) * 100 : 0;
            return (
              <Card key={s.id}>
                <CardHeader className="pb-2"><CardTitle className="text-base">{s.identificacao}</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Number(s.tonelagem_atual ?? 0).toFixed(1)}t</div>
                  <p className="text-xs text-muted-foreground mb-2">de {Number(s.tonelagem_inicial ?? 0).toFixed(1)}t iniciais</p>
                  <Progress value={pct} className="h-2" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Tabs defaultValue="orcamento">
        <TabsList><TabsTrigger value="orcamento">Orçamento / Custo</TabsTrigger><TabsTrigger value="plantios">Plantios</TabsTrigger><TabsTrigger value="consumos">Consumos de Silo</TabsTrigger></TabsList>
        <TabsContent value="orcamento"><PlantioOrcamento /></TabsContent>
        <TabsContent value="plantios">
          <Card><CardContent className="pt-4">
            <Table>
              <TableHeader><TableRow><TableHead>Cultura</TableHead><TableHead>Variedade</TableHead><TableHead>Área</TableHead><TableHead>Data</TableHead><TableHead>Fase</TableHead><TableHead>Fertilizante</TableHead></TableRow></TableHeader>
              <TableBody>
                {plantios.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.cultura}</TableCell>
                    <TableCell>{p.variedade || '-'}</TableCell>
                    <TableCell>{p.area_ha ? `${p.area_ha} ha` : '-'}</TableCell>
                    <TableCell>{p.data ? new Date(p.data + 'T12:00').toLocaleDateString('pt-BR') : '-'}</TableCell>
                    <TableCell className="capitalize">{p.fase || '-'}</TableCell>
                    <TableCell>{p.fertilizante || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="consumos">
          <Card><CardContent className="pt-4">
            <Table>
              <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Silo</TableHead><TableHead>Quantidade</TableHead><TableHead>Lote</TableHead></TableRow></TableHeader>
              <TableBody>
                {consumos.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell>{new Date(c.data + 'T12:00').toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{c.silos?.identificacao || '-'}</TableCell>
                    <TableCell>{Number(c.quantidade_ton).toFixed(1)}t</TableCell>
                    <TableCell>{c.lotes?.nome || '-'}</TableCell>
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
