import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReproducaoKPIs } from '@/components/ReproducaoKPIs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Eye, Users } from 'lucide-react';

type Animal = { id: string; nome: string | null; brinco: string | null };

function animalLabel(a: Animal) {
  return `${a.brinco ? a.brinco + ' - ' : ''}${a.nome || 'Sem nome'}`;
}

export default function ProtocolosIATF() {
  const { isGestorOrAdmin } = useAuth();
  const qc = useQueryClient();

  const [protocoloOpen, setProtocoloOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [addAnimalOpen, setAddAnimalOpen] = useState(false);
  const [selectedAnimalId, setSelectedAnimalId] = useState('');

  const [form, setForm] = useState({
    nome: '', data_inicio: new Date().toISOString().split('T')[0],
    touro_nome: '', touro_rgd: '', observacao: '',
  });

  const { data: protocolos = [] } = useQuery({
    queryKey: ['protocolos-iatf'],
    queryFn: async () => {
      const { data } = await supabase.from('protocolos_iatf').select('*').order('data_inicio', { ascending: false });
      return data || [];
    },
  });

  const { data: protocoloAnimais = [] } = useQuery({
    queryKey: ['protocolo-animais'],
    queryFn: async () => {
      const { data } = await supabase.from('protocolo_animais').select('*');
      return data || [];
    },
  });

  const { data: femeas = [] } = useQuery({
    queryKey: ['femeas-ativas-proto'],
    queryFn: async () => {
      const { data } = await supabase.from('animais').select('id, nome, brinco')
        .eq('status', 'ativo').in('sexo', ['Fêmea', 'femea', 'F']);
      return (data || []) as Animal[];
    },
  });

  const { data: todosAnimais = [] } = useQuery({
    queryKey: ['todos-animais-proto'],
    queryFn: async () => {
      const { data } = await supabase.from('animais').select('id, nome, brinco').eq('status', 'ativo');
      return (data || []) as Animal[];
    },
  });

  const findAnimal = (id: string) => todosAnimais.find(a => a.id === id);

  const insertProtocolo = useMutation({
    mutationFn: async () => {
      if (!form.nome) throw new Error('Nome do protocolo é obrigatório');
      const { error } = await supabase.from('protocolos_iatf').insert({
        nome: form.nome,
        data_inicio: form.data_inicio || null,
        touro_nome: form.touro_nome || null,
        touro_rgd: form.touro_rgd || null,
        observacao: form.observacao || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Protocolo criado');
      qc.invalidateQueries({ queryKey: ['protocolos-iatf'] });
      setProtocoloOpen(false);
      setForm({ nome: '', data_inicio: new Date().toISOString().split('T')[0], touro_nome: '', touro_rgd: '', observacao: '' });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const addAnimal = useMutation({
    mutationFn: async () => {
      if (!detailId || !selectedAnimalId) throw new Error('Selecione um animal');
      const { error } = await supabase.from('protocolo_animais').insert({
        protocolo_id: detailId,
        animal_id: selectedAnimalId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Animal adicionado ao protocolo');
      qc.invalidateQueries({ queryKey: ['protocolo-animais'] });
      setAddAnimalOpen(false);
      setSelectedAnimalId('');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateResultado = useMutation({
    mutationFn: async ({ id, resultado }: { id: string; resultado: string }) => {
      const { error } = await supabase.from('protocolo_animais').update({ resultado }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Resultado atualizado');
      qc.invalidateQueries({ queryKey: ['protocolo-animais'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteProtocolo = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('protocolo_animais').delete().eq('protocolo_id', id);
      const { error } = await supabase.from('protocolos_iatf').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Protocolo removido');
      qc.invalidateQueries({ queryKey: ['protocolos-iatf'] });
      qc.invalidateQueries({ queryKey: ['protocolo-animais'] });
      setDetailId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const detailProtocolo = protocolos.find(p => p.id === detailId);
  const detailAnimais = protocoloAnimais.filter(pa => pa.protocolo_id === detailId);

  const resultadoBadge = (r: string | null) => {
    const map: Record<string, string> = {
      aguardando: 'bg-muted text-muted-foreground',
      positivo: 'bg-green-100 text-green-800',
      negativo: 'bg-red-100 text-red-800',
    };
    return <Badge className={map[r || 'aguardando'] || ''}>{r || 'aguardando'}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Protocolos IATF</h1>
        <p className="text-muted-foreground">Gerencie protocolos de IATF e os animais incluídos</p>
      </div>

      <ReproducaoKPIs />

      {/* Detail view */}
      {detailId && detailProtocolo ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-heading">{detailProtocolo.nome}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Início: {detailProtocolo.data_inicio ? new Date(detailProtocolo.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                {detailProtocolo.touro_nome && ` | Touro: ${detailProtocolo.touro_nome}`}
              </p>
              {detailProtocolo.observacao && <p className="text-sm text-muted-foreground mt-1">{detailProtocolo.observacao}</p>}
            </div>
            <div className="flex gap-2">
              {isGestorOrAdmin && (
                <Dialog open={addAnimalOpen} onOpenChange={setAddAnimalOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="h-4 w-4 mr-1" />Adicionar Animal</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Adicionar Animal ao Protocolo</DialogTitle></DialogHeader>
                    <div className="space-y-3 pt-2">
                      <div>
                        <Label className="text-xs">Animal (Fêmea)</Label>
                        <Select value={selectedAnimalId} onValueChange={setSelectedAnimalId}>
                          <SelectTrigger className="h-8"><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {femeas.filter(f => !detailAnimais.some(da => da.animal_id === f.id)).map(a => (
                              <SelectItem key={a.id} value={a.id}>{animalLabel(a)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={() => addAnimal.mutate()} className="w-full" disabled={addAnimal.isPending || !selectedAnimalId}>
                        {addAnimal.isPending ? 'Adicionando...' : 'Adicionar'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              <Button size="sm" variant="outline" onClick={() => setDetailId(null)}>Voltar</Button>
            </div>
          </CardHeader>
          <CardContent>
            {detailAnimais.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Animal</TableHead>
                    <TableHead>Resultado</TableHead>
                    {isGestorOrAdmin && <TableHead>Ação</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailAnimais.map(pa => {
                    const animal = findAnimal(pa.animal_id);
                    return (
                      <TableRow key={pa.id}>
                        <TableCell>{animal ? animalLabel(animal) : pa.animal_id.slice(0, 8)}</TableCell>
                        <TableCell>{resultadoBadge(pa.resultado)}</TableCell>
                        {isGestorOrAdmin && (
                          <TableCell>
                            <Select
                              value={pa.resultado || 'aguardando'}
                              onValueChange={v => updateResultado.mutate({ id: pa.id, resultado: v })}
                            >
                              <SelectTrigger className="h-7 w-[130px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="aguardando">Aguardando</SelectItem>
                                <SelectItem value="positivo">Positivo</SelectItem>
                                <SelectItem value="negativo">Negativo</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum animal adicionado a este protocolo</p>
            )}

            {isGestorOrAdmin && (
              <div className="mt-4 flex justify-end">
                <Button size="sm" variant="destructive" onClick={() => {
                  if (confirm('Remover este protocolo e todos os animais vinculados?')) deleteProtocolo.mutate(detailId);
                }}>
                  Excluir Protocolo
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* List view */
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-heading">Protocolos</CardTitle>
            {isGestorOrAdmin && (
              <Dialog open={protocoloOpen} onOpenChange={setProtocoloOpen}>
                <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Novo Protocolo</Button></DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader><DialogTitle>Criar Protocolo IATF</DialogTitle></DialogHeader>
                  <div className="space-y-3 pt-2">
                    <div>
                      <Label className="text-xs">Nome do Protocolo</Label>
                      <Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} className="h-8 text-sm" placeholder="Ex: Protocolo IATF Março/2026" />
                    </div>
                    <div>
                      <Label className="text-xs">Data de Início</Label>
                      <Input type="date" value={form.data_inicio} onChange={e => setForm(p => ({ ...p, data_inicio: e.target.value }))} className="h-8 text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Touro (Nome)</Label>
                        <Input value={form.touro_nome} onChange={e => setForm(p => ({ ...p, touro_nome: e.target.value }))} className="h-8 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs">Touro (RGD)</Label>
                        <Input value={form.touro_rgd} onChange={e => setForm(p => ({ ...p, touro_rgd: e.target.value }))} className="h-8 text-sm" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Observação</Label>
                      <Textarea value={form.observacao} onChange={e => setForm(p => ({ ...p, observacao: e.target.value }))} className="h-16 text-sm" />
                    </div>
                    <Button onClick={() => insertProtocolo.mutate()} className="w-full" disabled={insertProtocolo.isPending}>
                      {insertProtocolo.isPending ? 'Salvando...' : 'Criar Protocolo'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            {protocolos.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Data Início</TableHead>
                    <TableHead>Touro</TableHead>
                    <TableHead>Animais</TableHead>
                    <TableHead>Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {protocolos.map(p => {
                    const count = protocoloAnimais.filter(pa => pa.protocolo_id === p.id).length;
                    const positivos = protocoloAnimais.filter(pa => pa.protocolo_id === p.id && pa.resultado === 'positivo').length;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.nome}</TableCell>
                        <TableCell>{p.data_inicio ? new Date(p.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</TableCell>
                        <TableCell>{p.touro_nome || '—'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{count}</span>
                            {positivos > 0 && <Badge className="bg-green-100 text-green-800 text-xs">{positivos} +</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" onClick={() => setDetailId(p.id)}>
                            <Eye className="h-4 w-4 mr-1" />Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum protocolo IATF registrado</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
