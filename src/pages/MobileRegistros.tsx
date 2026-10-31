import { cap } from "@/lib/labels";
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Milk, Scale, AlertCircle } from 'lucide-react';

type FormType = 'leite' | 'pesagem' | null;

export default function MobileRegistros() {
  const [activeForm, setActiveForm] = useState<FormType>(null);
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: animais } = useQuery({
    queryKey: ['animais-select'],
    queryFn: async () => {
      const { data } = await supabase.from('animais').select('id, nome, brinco, lote_id').eq('status', 'ativo').order('nome');
      return data || [];
    },
  });

  const { data: lotes } = useQuery({
    queryKey: ['lotes'],
    queryFn: async () => {
      const { data } = await supabase.from('lotes').select('id, nome').order('nome');
      return data || [];
    },
  });

  const [leiteData, setLeiteData] = useState({ animal_id: '', litros: '', turno: 'manha', data: new Date().toISOString().split('T')[0], com_mastite: false, usa_ocitocina: false });
  const [pesagemData, setPesagemData] = useState({ animal_id: '', peso_kg: '', data: new Date().toISOString().split('T')[0], ocasiao: '' });

  // Última aplicação hormonal do animal selecionado
  const { data: ultimaAplicacao } = useQuery({
    queryKey: ['ultima-aplicacao-mobile', leiteData.animal_id],
    enabled: !!leiteData.animal_id && activeForm === 'leite',
    queryFn: async () => {
      const { data } = await supabase
        .from('aplicacoes_hormonais')
        .select('tipo, data_aplicacao')
        .eq('animal_id', leiteData.animal_id)
        .in('tipo', ['boostin', 'lactotropin'])
        .order('data_aplicacao', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const leiteMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('producao_leite_diaria').insert({
        animal_id: leiteData.animal_id,
        litros: Number(leiteData.litros),
        turno: leiteData.turno,
        data: leiteData.data,
        registrado_por: user?.id,
        com_mastite: leiteData.com_mastite,
        usa_ocitocina: leiteData.usa_ocitocina,
        lote_id: animais?.find(a => a.id === leiteData.animal_id)?.lote_id || null,
      });
      if (error) throw error;

      // Se marcou mastite, criar tarefa automaticamente
      if (leiteData.com_mastite && leiteData.animal_id) {
        const animal = animais?.find(a => a.id === leiteData.animal_id);
        const nomeAnimal = animal?.nome || animal?.brinco || 'Animal';
        await supabase.from('tarefas').insert({
          titulo: `Tratamento de mastite: ${nomeAnimal}`,
          descricao: `Animal ${nomeAnimal} identificado com mastite durante ordenha (${leiteData.turno === 'tarde' ? 'Tarde' : 'Manhã'}) em ${new Date(leiteData.data).toLocaleDateString('pt-BR')}.`,
          prioridade: 'alta',
          prazo: leiteData.data,
          modulo_relacionado: 'saude',
          status: 'pendente',
        });
      }
    },
    onSuccess: () => {
      toast.success('Produção registrada!');
      if (leiteData.com_mastite) toast.info('Tarefa de tratamento criada');
      setLeiteData({ animal_id: '', litros: '', turno: 'manha', data: new Date().toISOString().split('T')[0], com_mastite: false, usa_ocitocina: false });
      setActiveForm(null);
      qc.invalidateQueries({ queryKey: ['producao'] });
      qc.invalidateQueries({ queryKey: ['tarefas'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const pesagemMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('pesagens').insert({
        animal_id: pesagemData.animal_id,
        peso_kg: Number(pesagemData.peso_kg),
        data: pesagemData.data,
        ocasiao: pesagemData.ocasiao || null,
        registrado_por: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Pesagem registrada!');
      setPesagemData({ animal_id: '', peso_kg: '', data: new Date().toISOString().split('T')[0], ocasiao: '' });
      setActiveForm(null);
      qc.invalidateQueries({ queryKey: ['pesagens'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const animalLabel = (a: { nome: string | null; brinco: string | null }) =>
    `${a.nome || 'Sem nome'}${a.brinco ? ` (#${a.brinco})` : ''}`;

  if (activeForm === 'leite') {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-heading font-bold">Registrar Produção</h1>
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>Animal</Label>
              <Select value={leiteData.animal_id} onValueChange={(v) => setLeiteData({ ...leiteData, animal_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{animais?.map(a => <SelectItem key={a.id} value={a.id}>{animalLabel(a)}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {/* Callout Boostin/Lactotropin */}
            {leiteData.animal_id && ultimaAplicacao && ultimaAplicacao.length > 0 && (
              <div className="rounded-lg border border-accent bg-accent/10 p-3 space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <AlertCircle className="h-4 w-4 text-secondary" />
                  Aplicações hormonais
                </div>
                {ultimaAplicacao.map((ap, i) => (
                  <p key={i} className="text-xs text-muted-foreground">
                    <span className="capitalize font-medium">{cap(ap.tipo)}</span>: {new Date(ap.data_aplicacao + 'T12:00').toLocaleDateString('pt-BR')}
                    {' '}({Math.floor((Date.now() - new Date(ap.data_aplicacao + 'T12:00').getTime()) / 86400000)} dias atrás)
                  </p>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label>Peso do Leite (kg)</Label>
              <Input type="number" step="0.1" value={leiteData.litros} onChange={e => setLeiteData({ ...leiteData, litros: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Turno</Label>
              <Select value={cap(leiteData.turno)} onValueChange={(v) => setLeiteData({ ...leiteData, turno: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manha">Manhã</SelectItem>
                  <SelectItem value="tarde">Tarde</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={leiteData.data} onChange={e => setLeiteData({ ...leiteData, data: e.target.value })} />
            </div>
            {leiteData.animal_id && animais?.find(a => a.id === leiteData.animal_id)?.lote_id && (
              <p className="text-sm text-muted-foreground">
                Lote: {lotes?.find(l => l.id === animais?.find(a => a.id === leiteData.animal_id)?.lote_id)?.nome || 'Desconhecido'}
              </p>
            )}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Checkbox id="m-mastite" checked={leiteData.com_mastite} onCheckedChange={(v) => setLeiteData({ ...leiteData, com_mastite: !!v })} />
                <Label htmlFor="m-mastite" className="text-sm cursor-pointer">Com mastite</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="m-ocitocina" checked={leiteData.usa_ocitocina} onCheckedChange={(v) => setLeiteData({ ...leiteData, usa_ocitocina: !!v })} />
                <Label htmlFor="m-ocitocina" className="text-sm cursor-pointer">Usa ocitocina</Label>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => leiteMut.mutate()} disabled={!leiteData.animal_id || !leiteData.litros || leiteMut.isPending}
                className="flex-1 bg-secondary text-secondary-foreground">
                {leiteMut.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button variant="outline" onClick={() => setActiveForm(null)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeForm === 'pesagem') {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-heading font-bold">Registrar Pesagem</h1>
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>Animal</Label>
              <Select value={pesagemData.animal_id} onValueChange={(v) => setPesagemData({ ...pesagemData, animal_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{animais?.map(a => <SelectItem key={a.id} value={a.id}>{animalLabel(a)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Peso (kg)</Label>
              <Input type="number" step="0.1" value={pesagemData.peso_kg} onChange={e => setPesagemData({ ...pesagemData, peso_kg: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Ocasião</Label>
              <Input placeholder="Ex: Rotina, Desmama..." value={pesagemData.ocasiao} onChange={e => setPesagemData({ ...pesagemData, ocasiao: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={pesagemData.data} onChange={e => setPesagemData({ ...pesagemData, data: e.target.value })} />
            </div>
            <div className="flex gap-3">
              <Button onClick={() => pesagemMut.mutate()} disabled={!pesagemData.animal_id || !pesagemData.peso_kg || pesagemMut.isPending}
                className="flex-1 bg-secondary text-secondary-foreground">
                {pesagemMut.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button variant="outline" onClick={() => setActiveForm(null)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-heading font-bold">Registros</h1>
      <p className="text-muted-foreground">Selecione o tipo de registro</p>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Produção de Leite', icon: Milk, form: 'leite' as FormType },
          { label: 'Pesagem', icon: Scale, form: 'pesagem' as FormType },
        ].map((item) => (
          <Card key={item.label} className="active:scale-[0.98] transition-transform">
            <CardContent className="p-0">
              <button onClick={() => setActiveForm(item.form)} className="w-full flex flex-col items-center gap-3 p-6">
                <div className="p-3 rounded-xl bg-secondary/10">
                  <item.icon className="h-8 w-8 text-secondary" />
                </div>
                <span className="text-sm font-medium text-center">{item.label}</span>
              </button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
