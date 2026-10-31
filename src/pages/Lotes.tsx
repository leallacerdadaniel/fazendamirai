import { cap } from "@/lib/labels";
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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { KPICard } from '@/components/KPICard';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, Users, Layers, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ReportMenu } from '@/components/ReportMenu';

const CATEGORIAS_PREDEFINIDAS = [
  'geral', 'recria', 'prenhas', 'exposicao', 'desmama', 'engorda',
  'secas', 'receptoras', 'doadoras', 'touros', 'bezerras', 'novilhas',
];

const categoriaLabels: Record<string, string> = {
  geral: 'Geral', recria: 'Recria', prenhas: 'Prenhas', exposicao: 'Exposição',
  desmama: 'Desmama', engorda: 'Engorda', secas: 'Secas', receptoras: 'Receptoras',
  doadoras: 'Doadoras', touros: 'Touros', bezerras: 'Bezerras', novilhas: 'Novilhas',
};

const CORES = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#84CC16',
  '#14B8A6', '#D946EF',
];

export default function Lotes() {
  const { isGestorOrAdmin } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignLoteId, setAssignLoteId] = useState('');
  const [searchAnimal, setSearchAnimal] = useState('');

  const [form, setForm] = useState({
    nome: '', tipo: '', capacidade: '', piquete: '',
    categoria: 'geral', cor: '#3B82F6',
    latitude: '', longitude: '',
  });

  const { data: lotes = [] } = useQuery({
    queryKey: ['lotes-full'],
    queryFn: async () => {
      const { data } = await supabase.from('lotes').select('*').order('nome');
      return data || [];
    },
  });

  const { data: animais = [] } = useQuery({
    queryKey: ['animais-todos'],
    queryFn: async () => {
      const { data } = await supabase.from('animais').select('id, nome, brinco, lote_id, status').eq('status', 'ativo').order('nome');
      return data || [];
    },
  });

  // Contagem por lote
  const contagem = useMemo(() => {
    const map: Record<string, number> = {};
    animais.forEach(a => { if (a.lote_id) map[a.lote_id] = (map[a.lote_id] || 0) + 1; });
    return map;
  }, [animais]);

  const semLote = useMemo(() => animais.filter(a => !a.lote_id).length, [animais]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        nome: form.nome,
        tipo: form.tipo || null,
        capacidade: form.capacidade ? Number(form.capacidade) : null,
        piquete: form.piquete || null,
        categoria: form.categoria,
        cor: form.cor,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
      };
      if (editId) {
        const { error } = await supabase.from('lotes').update(payload).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('lotes').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lotes-full'] });
      qc.invalidateQueries({ queryKey: ['lotes'] });
      toast.success(editId ? 'Lote atualizado!' : 'Lote criado!');
      setOpen(false);
      setEditId(null);
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const delMutation = useMutation({
    mutationFn: async (id: string) => {
      // Desvincula tudo que aponta para o lote antes de excluir
      const steps = [
        supabase.from('animais').update({ lote_id: null }).eq('lote_id', id),
        supabase.from('producao_leite_diaria').update({ lote_id: null }).eq('lote_id', id),
        supabase.from('consumo_silo').update({ lote_id: null }).eq('lote_id', id),
        supabase.from('dietas_lote').delete().eq('lote_id', id),
      ];
      for (const s of steps) { const { error } = await s; if (error) throw error; }
      const { error } = await supabase.from('lotes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lotes-full'] });
      qc.invalidateQueries({ queryKey: ['animais-todos'] });
      toast.success('Lote excluído!');
    },
    onError: (e: any) => toast.error(`Não foi possível excluir: ${e.message}`),
  });

  const assignMutation = useMutation({
    mutationFn: async ({ animalId, loteId }: { animalId: string; loteId: string | null }) => {
      const { error } = await supabase.from('animais').update({ lote_id: loteId }).eq('id', animalId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['animais-todos'] });
      qc.invalidateQueries({ queryKey: ['lotes-full'] });
    },
  });

  const resetForm = () => setForm({ nome: '', tipo: '', capacidade: '', piquete: '', categoria: 'geral', cor: '#3B82F6', latitude: '', longitude: '' });

  const openEdit = (lote: any) => {
    setForm({
      nome: lote.nome || '',
      tipo: lote.tipo || '',
      capacidade: lote.capacidade?.toString() || '',
      piquete: lote.piquete || '',
      categoria: lote.categoria || 'geral',
      cor: lote.cor || '#3B82F6',
      latitude: lote.latitude?.toString() || '',
      longitude: lote.longitude?.toString() || '',
    });
    setEditId(lote.id);
    setOpen(true);
  };

  const animaisDoLote = useMemo(() => {
    if (!assignLoteId) return [];
    return animais.filter(a => a.lote_id === assignLoteId);
  }, [assignLoteId, animais]);

  const animaisDisponiveis = useMemo(() => {
    const term = searchAnimal.toLowerCase();
    return animais
      .filter(a => a.lote_id !== assignLoteId)
      .filter(a => !term || (a.nome || '').toLowerCase().includes(term) || (a.brinco || '').toLowerCase().includes(term));
  }, [animais, assignLoteId, searchAnimal]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Lotes</h1>
          <p className="text-muted-foreground">Organize seus animais em lotes por finalidade</p>
        </div>
        <div className="flex gap-2">
          <ReportMenu config={{
            title: 'Relatório de Lotes',
            columns: [
              { header: 'Nome', key: 'nome' },
              { header: 'Categoria', key: 'categoria' },
              { header: 'Piquete', key: 'piquete' },
              { header: 'Capacidade', key: 'capacidade' },
              { header: 'Animais', key: 'qtd' },
            ],
            data: (lotes || []).map(l => ({ ...l, qtd: contagem[l.id] || 0 })),
            kpis: [
              { label: 'Total Lotes', value: lotes?.length || 0 },
              { label: 'Sem Lote', value: semLote },
            ],
          }} />
          {isGestorOrAdmin && (
          <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setEditId(null); resetForm(); } }}>
            <DialogTrigger asChild>
              <Button className="bg-secondary text-secondary-foreground"><Plus className="h-4 w-4 mr-1" />Novo Lote</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editId ? 'Editar Lote' : 'Novo Lote'}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Nome</Label><Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Lote Prenhas 1" /></div>
                  <div className="space-y-1"><Label>Piquete</Label><Input value={form.piquete} onChange={e => setForm(f => ({ ...f, piquete: e.target.value }))} placeholder="Piquete A" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Categoria</Label>
                    <Select value={cap(form.categoria)} onValueChange={v => setForm(f => ({ ...f, categoria: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIAS_PREDEFINIDAS.map(c => <SelectItem key={c} value={c}>{categoriaLabels[c] || c}</SelectItem>)}
                        <SelectItem value="outro">Outro (personalizado)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label>Tipo / Descrição</Label><Input value={cap(form.tipo)} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} placeholder="Ex: Lactação, Engorda..." /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Capacidade</Label><Input type="number" value={form.capacidade} onChange={e => setForm(f => ({ ...f, capacidade: e.target.value }))} /></div>
                  <div className="space-y-1">
                    <Label>Cor no Mapa</Label>
                    <div className="flex gap-1 flex-wrap">
                      {CORES.map(c => (
                        <button key={c} onClick={() => setForm(f => ({ ...f, cor: c }))}
                          className={`w-6 h-6 rounded-full border-2 transition-all ${form.cor === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Latitude</Label><Input type="number" step="any" value={form.latitude} onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))} placeholder="-20.123" /></div>
                  <div className="space-y-1"><Label>Longitude</Label><Input type="number" step="any" value={form.longitude} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))} placeholder="-43.456" /></div>
                </div>
                <Button onClick={() => saveMutation.mutate()} disabled={!form.nome || saveMutation.isPending} className="w-full bg-secondary text-secondary-foreground">
                  {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="Lotes" value={String(lotes.length)} icon={<Layers className="h-5 w-5" />} />
        <KPICard title="Animais em Lotes" value={String(animais.length - semLote)} icon={<Users className="h-5 w-5" />} />
        <KPICard title="Sem Lote" value={String(semLote)} icon={<Users className="h-5 w-5" />} color={semLote > 0 ? 'warning' : 'default'} />
      </div>

      {/* Assign animals dialog */}
      <Dialog open={assignOpen} onOpenChange={v => { setAssignOpen(v); if (!v) setSearchAnimal(''); }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Gerenciar Animais — {lotes.find(l => l.id === assignLoteId)?.nome}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Animais no lote ({animaisDoLote.length})</Label>
              {animaisDoLote.length > 0 ? (
                <div className="border rounded-lg divide-y max-h-40 overflow-y-auto mt-1">
                  {animaisDoLote.map(a => (
                    <div key={a.id} className="flex items-center justify-between px-3 py-2">
                      <span className="text-sm">{a.brinco ? `${a.brinco} - ` : ''}{a.nome || 'Sem nome'}</span>
                      <Button variant="ghost" size="sm" className="text-destructive text-xs"
                        onClick={() => assignMutation.mutate({ animalId: a.id, loteId: null })}>
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground mt-1">Nenhum animal</p>}
            </div>
            <div>
              <Label className="text-sm font-medium">Adicionar animais</Label>
              <Input placeholder="Buscar por nome ou brinco..." value={searchAnimal} onChange={e => setSearchAnimal(e.target.value)} className="mt-1" />
              <div className="border rounded-lg divide-y max-h-48 overflow-y-auto mt-1">
                {animaisDisponiveis.slice(0, 30).map(a => (
                  <div key={a.id} className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm">
                      {a.brinco ? `${a.brinco} - ` : ''}{a.nome || 'Sem nome'}
                      {a.lote_id && <span className="text-xs text-muted-foreground ml-1">(em outro lote)</span>}
                    </span>
                    <Button variant="ghost" size="sm" className="text-xs"
                      onClick={() => assignMutation.mutate({ animalId: a.id, loteId: assignLoteId })}>
                      Adicionar
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lotes list */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {lotes.map((l: any) => (
          <Card key={l.id} className="overflow-hidden">
            <div className="h-2" style={{ backgroundColor: l.cor || '#3B82F6' }} />
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-heading font-bold text-lg">{l.nome}</h3>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {categoriaLabels[l.categoria] || l.categoria || 'Geral'}
                    </Badge>
                    {l.piquete && <Badge variant="secondary" className="text-xs">{l.piquete}</Badge>}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold">{contagem[l.id] || 0}</span>
                  <p className="text-xs text-muted-foreground">animais</p>
                </div>
              </div>
              {l.tipo && <p className="text-sm text-muted-foreground">{cap(l.tipo)}</p>}
              {l.capacidade && (
                <div className="text-xs text-muted-foreground">
                  Capacidade: {l.capacidade} | Ocupação: {Math.round(((contagem[l.id] || 0) / l.capacidade) * 100)}%
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => { setAssignLoteId(l.id); setAssignOpen(true); }}>
                  <Users className="h-3 w-3 mr-1" /> Animais
                </Button>
                {isGestorOrAdmin && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => openEdit(l)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => delMutation.mutate(l.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {lotes.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Layers className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-heading font-bold text-lg mb-2">Nenhum lote cadastrado</h3>
            <p className="text-muted-foreground text-sm">Crie lotes para organizar seus animais por finalidade</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
