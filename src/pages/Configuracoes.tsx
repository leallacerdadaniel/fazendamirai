import { cap } from "@/lib/labels";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

export default function Configuracoes() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: '', piquete: '', tipo: '', capacidade: '' });

  const { data: lotes, isLoading } = useQuery({
    queryKey: ['lotes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('lotes').select('*').order('nome');
      if (error) throw error;
      return data;
    },
  });

  const { data: loteCounts } = useQuery({
    queryKey: ['lotes-count'],
    queryFn: async () => {
      const { data } = await supabase.from('animais').select('lote_id').eq('status', 'ativo').not('lote_id', 'is', null);
      const counts: Record<string, number> = {};
      data?.forEach(a => { if (a.lote_id) counts[a.lote_id] = (counts[a.lote_id] || 0) + 1; });
      return counts;
    },
  });

  const addLote = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('lotes').insert({
        nome: form.nome,
        piquete: form.piquete || null,
        tipo: form.tipo || null,
        capacidade: form.capacidade ? Number(form.capacidade) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lotes'] });
      toast.success('Lote criado!');
      setOpen(false);
      setForm({ nome: '', piquete: '', tipo: '', capacidade: '' });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteLote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('lotes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lotes'] }); toast.success('Lote removido!'); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Configurações</h1>
        <p className="text-muted-foreground">Gerenciar lotes, piquetes e configurações gerais</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Lotes / Piquetes</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                <Plus className="h-4 w-4 mr-1" /> Novo Lote
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Lote</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Nome</Label><Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
                <div className="space-y-2"><Label>Piquete</Label><Input value={form.piquete} onChange={e => setForm({ ...form, piquete: e.target.value })} /></div>
                <div className="space-y-2"><Label>Tipo</Label><Input value={cap(form.tipo)} onChange={e => setForm({ ...form, tipo: e.target.value })} placeholder="Ex: Lactação, Seco, Recria" /></div>
                <div className="space-y-2"><Label>Capacidade</Label><Input type="number" value={form.capacidade} onChange={e => setForm({ ...form, capacidade: e.target.value })} /></div>
                <Button onClick={() => addLote.mutate()} disabled={!form.nome || addLote.isPending} className="w-full bg-secondary text-secondary-foreground">
                  {addLote.isPending ? 'Salvando...' : 'Criar Lote'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Piquete</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Capacidade</TableHead>
                <TableHead>Animais</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : lotes?.map(l => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.nome}</TableCell>
                  <TableCell>{l.piquete || '—'}</TableCell>
                  <TableCell>{l.tipo || '—'}</TableCell>
                  <TableCell>{l.capacidade || '—'}</TableCell>
                  <TableCell>{loteCounts?.[l.id] || 0}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => deleteLote.mutate(l.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
