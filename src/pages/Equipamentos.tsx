import { cap } from "@/lib/labels";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KPICard } from '@/components/KPICard';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Wrench, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { ReportMenu } from '@/components/ReportMenu';

const tipos = ['Trator', 'Implemento', 'Ordenhadeira', 'Resfriador', 'Picadeira', 'Irrigação', 'Veículo', 'Outro'];

export default function Equipamentos() {
  const [openEquip, setOpenEquip] = useState(false);
  const [openManut, setOpenManut] = useState(false);
  const [expandedEquip, setExpandedEquip] = useState<string | null>(null);
  const qc = useQueryClient();

  const [equipForm, setEquipForm] = useState({ nome: '', tipo: '', marca: '', modelo: '', ano: '', numero_serie: '', custo: '', data_compra: '' });
  const [manutForm, setManutForm] = useState({ equipamento_id: '', data: new Date().toISOString().slice(0, 10), tipo: '', descricao: '', custo: '', responsavel: '', proxima_manutencao: '' });

  const { data: equipamentos = [] } = useQuery({ queryKey: ['equipamentos'], queryFn: async () => { const { data } = await supabase.from('equipamentos').select('*').order('nome'); return data || []; } });
  const { data: manutencoes = [] } = useQuery({ queryKey: ['manutencoes'], queryFn: async () => { const { data } = await supabase.from('manutencoes').select('*, equipamentos(nome)').order('data', { ascending: false }).limit(500); return data || []; } });

  const proxManut = manutencoes.filter((m: any) => m.proxima_manutencao && new Date(m.proxima_manutencao) <= new Date(Date.now() + 30 * 86400000));

  // Group maintenances by equipment
  const manutPorEquip = (equipId: string) => manutencoes.filter((m: any) => m.equipamento_id === equipId);

  // Get last maintenance of each type for an equipment
  const ultimasManutPorTipo = (equipId: string) => {
    const manuts = manutPorEquip(equipId);
    const byType: Record<string, any> = {};
    for (const m of manuts) {
      const tipo = (m as any).tipo || 'Geral';
      if (!byType[tipo]) byType[tipo] = m;
    }
    return Object.entries(byType);
  };

  const saveEquip = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('equipamentos').insert({ ...equipForm, ano: equipForm.ano ? Number(equipForm.ano) : null, custo: equipForm.custo ? Number(equipForm.custo) : null, data_compra: equipForm.data_compra || null });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['equipamentos'] }); toast.success('Equipamento cadastrado!'); setOpenEquip(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const saveManut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('manutencoes').insert({ ...manutForm, custo: manutForm.custo ? Number(manutForm.custo) : null, proxima_manutencao: manutForm.proxima_manutencao || null });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['manutencoes'] }); toast.success('Manutenção registrada!'); setOpenManut(false); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-heading font-bold">Equipamentos</h1><p className="text-muted-foreground">Cadastro e manutenções</p></div>
        <div className="flex gap-2">
          <ReportMenu config={{
            title: 'Relatório de Equipamentos',
            columns: [
              { header: 'Nome', key: 'nome' },
              { header: 'Tipo', key: 'tipo' },
              { header: 'Marca', key: 'marca' },
              { header: 'Modelo', key: 'modelo' },
              { header: 'Ano', key: 'ano' },
              { header: 'Custo (R$)', key: 'custo' },
            ],
            data: equipamentos,
            kpis: [
              { label: 'Total Equipamentos', value: equipamentos.length },
              { label: 'Manutenções', value: manutencoes.length },
            ],
          }} />
          <Dialog open={openEquip} onOpenChange={setOpenEquip}><DialogTrigger asChild><Button variant="outline"><Plus className="h-4 w-4 mr-1" />Novo Equipamento</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Cadastrar Equipamento</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1"><Label>Nome</Label><Input value={equipForm.nome} onChange={e => setEquipForm(f => ({ ...f, nome: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Tipo</Label>
                    <Select value={cap(equipForm.tipo)} onValueChange={v => setEquipForm(f => ({ ...f, tipo: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{tipos.map(t => <SelectItem key={t} value={t}>{cap(t)}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label>Marca</Label><Input value={equipForm.marca} onChange={e => setEquipForm(f => ({ ...f, marca: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1"><Label>Modelo</Label><Input value={equipForm.modelo} onChange={e => setEquipForm(f => ({ ...f, modelo: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Ano</Label><Input type="number" value={equipForm.ano} onChange={e => setEquipForm(f => ({ ...f, ano: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Nº Série</Label><Input value={equipForm.numero_serie} onChange={e => setEquipForm(f => ({ ...f, numero_serie: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Custo (R$)</Label><Input type="number" step="0.01" value={equipForm.custo} onChange={e => setEquipForm(f => ({ ...f, custo: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Data Compra</Label><Input type="date" value={equipForm.data_compra} onChange={e => setEquipForm(f => ({ ...f, data_compra: e.target.value }))} /></div>
                </div>
                <Button onClick={() => saveEquip.mutate()} disabled={!equipForm.nome} className="w-full bg-secondary text-secondary-foreground">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={openManut} onOpenChange={setOpenManut}><DialogTrigger asChild><Button className="bg-secondary text-secondary-foreground"><Wrench className="h-4 w-4 mr-1" />Nova Manutenção</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Registrar Manutenção</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1"><Label>Equipamento</Label>
                  <Select value={manutForm.equipamento_id} onValueChange={v => setManutForm(f => ({ ...f, equipamento_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{equipamentos.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Tipo</Label><Input value={cap(manutForm.tipo)} onChange={e => setManutForm(f => ({ ...f, tipo: e.target.value }))} placeholder="Troca de óleo, Pneu, etc" /></div>
                  <div className="space-y-1"><Label>Data</Label><Input type="date" value={manutForm.data} onChange={e => setManutForm(f => ({ ...f, data: e.target.value }))} /></div>
                </div>
                <div className="space-y-1"><Label>Descrição</Label><Input value={manutForm.descricao} onChange={e => setManutForm(f => ({ ...f, descricao: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Custo (R$)</Label><Input type="number" step="0.01" value={manutForm.custo} onChange={e => setManutForm(f => ({ ...f, custo: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Responsável</Label><Input value={manutForm.responsavel} onChange={e => setManutForm(f => ({ ...f, responsavel: e.target.value }))} /></div>
                </div>
                <div className="space-y-1"><Label>Próxima Manutenção</Label><Input type="date" value={manutForm.proxima_manutencao} onChange={e => setManutForm(f => ({ ...f, proxima_manutencao: e.target.value }))} /></div>
                <Button onClick={() => saveManut.mutate()} disabled={!manutForm.equipamento_id} className="w-full bg-secondary text-secondary-foreground">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard title="Equipamentos" value={String(equipamentos.length)} icon={<Wrench className="h-5 w-5" />} />
        <KPICard title="Manutenções" value={String(manutencoes.length)} icon={<Wrench className="h-5 w-5" />} />
        <KPICard title="Alertas (30 dias)" value={String(proxManut.length)} icon={<AlertTriangle className="h-5 w-5" />} />
      </div>

      <Tabs defaultValue="equipamentos">
        <TabsList><TabsTrigger value="equipamentos">Equipamentos</TabsTrigger><TabsTrigger value="manutencoes">Histórico Geral</TabsTrigger></TabsList>
        <TabsContent value="equipamentos">
          <div className="space-y-3">
            {equipamentos.map(e => {
              const isExpanded = expandedEquip === e.id;
              const manuts = manutPorEquip(e.id);
              const ultimasPorTipo = ultimasManutPorTipo(e.id);
              const custoTotal = manuts.reduce((s: number, m: any) => s + (Number(m.custo) || 0), 0);
              return (
                <Card key={e.id} className="overflow-hidden">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedEquip(isExpanded ? null : e.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary"><Wrench className="h-5 w-5" /></div>
                      <div>
                        <p className="font-bold">{e.nome}</p>
                        <p className="text-sm text-muted-foreground">{[e.tipo, e.marca, e.modelo, e.ano].filter(Boolean).join(' · ')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm">
                        <p className="text-muted-foreground">{manuts.length} manutenções</p>
                        {custoTotal > 0 && <p className="font-medium">R$ {custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>}
                      </div>
                      {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <CardContent className="pt-0 border-t">
                      {/* Summary by type */}
                      {ultimasPorTipo.length > 0 ? (
                        <>
                          <p className="text-sm font-medium mt-3 mb-2">Última manutenção por tipo:</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
                            {ultimasPorTipo.map(([tipo, m]) => (
                              <div key={tipo} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm">
                                <div>
                                  <Badge variant="outline" className="text-xs">{tipo}</Badge>
                                  <p className="text-xs text-muted-foreground mt-1">{m.descricao || '—'}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">{format(new Date(m.data + 'T12:00'), 'dd/MM/yy')}</p>
                                  {m.custo && <p className="text-xs text-muted-foreground">R$ {Number(m.custo).toFixed(2)}</p>}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Full history table */}
                          <p className="text-sm font-medium mb-2">Histórico completo:</p>
                          <div className="max-h-60 overflow-y-auto">
                            <Table>
                              <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Tipo</TableHead><TableHead>Descrição</TableHead><TableHead>Custo</TableHead><TableHead>Responsável</TableHead><TableHead>Próxima</TableHead></TableRow></TableHeader>
                              <TableBody>
                                {manuts.map((m: any) => (
                                  <TableRow key={m.id}>
                                    <TableCell className="text-sm">{format(new Date(m.data + 'T12:00'), 'dd/MM/yy')}</TableCell>
                                    <TableCell className="text-sm">{m.tipo || '—'}</TableCell>
                                    <TableCell className="text-sm">{m.descricao || '—'}</TableCell>
                                    <TableCell className="text-sm">{m.custo ? `R$ ${Number(m.custo).toFixed(2)}` : '—'}</TableCell>
                                    <TableCell className="text-sm">{m.responsavel || '—'}</TableCell>
                                    <TableCell className="text-sm">{m.proxima_manutencao ? format(new Date(m.proxima_manutencao + 'T12:00'), 'dd/MM/yy') : '—'}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground py-4">Nenhuma manutenção registrada para este equipamento.</p>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </TabsContent>
        <TabsContent value="manutencoes">
          <Card><CardContent className="pt-4">
            <Table>
              <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Equipamento</TableHead><TableHead>Tipo</TableHead><TableHead>Descrição</TableHead><TableHead>Custo</TableHead><TableHead>Próxima</TableHead></TableRow></TableHeader>
              <TableBody>
                {manutencoes.map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell>{format(new Date(m.data + 'T12:00'), 'dd/MM/yy')}</TableCell>
                    <TableCell>{m.equipamentos?.nome || '—'}</TableCell>
                    <TableCell>{m.tipo || '—'}</TableCell>
                    <TableCell>{m.descricao || '—'}</TableCell>
                    <TableCell>{m.custo ? `R$ ${Number(m.custo).toFixed(2)}` : '—'}</TableCell>
                    <TableCell>{m.proxima_manutencao ? format(new Date(m.proxima_manutencao + 'T12:00'), 'dd/MM/yy') : '—'}</TableCell>
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
