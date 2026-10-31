import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Stethoscope, AlertTriangle, Syringe, CheckCircle2, Plus } from 'lucide-react';
import { KPICard } from '@/components/KPICard';

export default function Enfermaria() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state for new mastite case
  const [mAnimalId, setMAnimalId] = useState('');
  const [mQuarto, setMQuarto] = useState('');
  const [mCmt, setMCmt] = useState('');
  const [mTratamento, setMTratamento] = useState('');
  const [mDescarte, setMDescarte] = useState('');
  const [mDataInicio, setMDataInicio] = useState(new Date().toISOString().split('T')[0]);

  const { data: animais } = useQuery({
    queryKey: ['animais-ativos'],
    queryFn: async () => {
      const { data } = await supabase
        .from('animais')
        .select('id, nome, brinco, status, lote_id')
        .eq('status', 'ativo');
      return data || [];
    },
  });

  const { data: lotes } = useQuery({
    queryKey: ['lotes'],
    queryFn: async () => {
      const { data } = await supabase.from('lotes').select('id, nome');
      return data || [];
    },
  });

  const { data: producaoRecente } = useQuery({
    queryKey: ['producao-flags-recente'],
    queryFn: async () => {
      const { data } = await supabase
        .from('producao_leite_diaria')
        .select('animal_id, data, com_mastite, usa_ocitocina, turno')
        .order('data', { ascending: false })
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const flagsPorAnimal = useMemo(() => {
    if (!producaoRecente) return { mastite: [], ocitocina: [] };
    const vistos = new Set<string>();
    const mastite: { animal_id: string; data: string; turno: string | null }[] = [];
    const ocitocina: { animal_id: string; data: string; turno: string | null }[] = [];

    for (const r of producaoRecente) {
      if (!r.animal_id || vistos.has(r.animal_id)) continue;
      vistos.add(r.animal_id);
      if (r.com_mastite) mastite.push({ animal_id: r.animal_id, data: r.data, turno: r.turno });
      if (r.usa_ocitocina) ocitocina.push({ animal_id: r.animal_id, data: r.data, turno: r.turno });
    }
    return { mastite, ocitocina };
  }, [producaoRecente]);

  const { data: mastitesAtivas } = useQuery({
    queryKey: ['mastites-ativas'],
    queryFn: async () => {
      const { data } = await supabase
        .from('mastites')
        .select('*')
        .order('data_inicio', { ascending: false });
      return data || [];
    },
  });

  const resolverFlagMutation = useMutation({
    mutationFn: async ({ animalId, flag }: { animalId: string; flag: 'com_mastite' | 'usa_ocitocina' }) => {
      const { error } = await supabase
        .from('producao_leite_diaria')
        .insert({
          animal_id: animalId,
          data: new Date().toISOString().split('T')[0],
          litros: 0,
          turno: 'manha',
          [flag]: false,
          registrado_por: null,
        });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      const label = vars.flag === 'com_mastite' ? 'mastite' : 'ocitocina';
      toast.success(`Flag de ${label} removida do animal`);
      qc.invalidateQueries({ queryKey: ['producao-flags-recente'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Registrar caso de mastite detalhado
  const insertMastiteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('mastites').insert({
        animal_id: mAnimalId,
        data_inicio: mDataInicio,
        quarto: mQuarto || null,
        resultado_cmt: mCmt || null,
        tratamento: mTratamento || null,
        descarte_dias: mDescarte ? Number(mDescarte) : null,
      });
      if (error) throw error;

      // Criar tarefa automática de acompanhamento
      const animal = animais?.find(a => a.id === mAnimalId);
      const nomeAnimal = animal?.brinco ? `${animal.brinco} - ${animal.nome || ''}` : animal?.nome || 'Animal';
      await supabase.from('tarefas').insert({
        titulo: `Acompanhar mastite: ${nomeAnimal}`,
        descricao: `Caso de mastite registrado em ${new Date(mDataInicio).toLocaleDateString('pt-BR')}. Quarto: ${mQuarto || 'N/I'}. CMT: ${mCmt || 'N/I'}. Tratamento: ${mTratamento || 'N/I'}. ${mDescarte ? `Descarte de leite: ${mDescarte} dias.` : ''}`,
        prioridade: 'alta',
        prazo: mDataInicio,
        modulo_relacionado: 'saude',
        status: 'pendente',
      });
    },
    onSuccess: () => {
      toast.success('Caso de mastite registrado');
      toast.info('Tarefa de acompanhamento criada');
      qc.invalidateQueries({ queryKey: ['mastites-ativas'] });
      qc.invalidateQueries({ queryKey: ['tarefas'] });
      setDialogOpen(false);
      setMAnimalId('');
      setMQuarto('');
      setMCmt('');
      setMTratamento('');
      setMDescarte('');
      setMDataInicio(new Date().toISOString().split('T')[0]);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const getAnimalLabel = (id: string) => {
    const a = animais?.find(x => x.id === id);
    if (!a) return id.slice(0, 8);
    return a.brinco ? `${a.brinco} - ${a.nome || ''}` : a.nome || id.slice(0, 8);
  };

  const getLoteNome = (animalId: string) => {
    const a = animais?.find(x => x.id === animalId);
    if (!a?.lote_id) return '—';
    return lotes?.find(l => l.id === a.lote_id)?.nome || '—';
  };

  // Animais fêmeas para o select
  const femeas = useMemo(() => {
    return (animais || []).filter(a =>
      ['Fêmea', 'femea', 'F'].includes(a.status === 'ativo' ? (animais?.find(x => x.id === a.id) as any)?.sexo || '' : '')
      || true // fallback: show all active for now
    );
  }, [animais]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <Stethoscope className="h-6 w-6" /> Enfermaria
          </h1>
          <p className="text-muted-foreground">Animais com mastite, em uso de ocitocina e acompanhamento sanitário</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Registrar Mastite
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Registrar Caso de Mastite</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Animal</Label>
                <Select value={mAnimalId} onValueChange={setMAnimalId}>
                  <SelectTrigger><SelectValue placeholder="Selecione o animal" /></SelectTrigger>
                  <SelectContent>
                    {femeas.map(a => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.brinco ? `${a.brinco} - ` : ''}{a.nome || 'Sem nome'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Data Início</Label>
                  <Input type="date" value={mDataInicio} onChange={e => setMDataInicio(e.target.value)} />
                </div>
                <div>
                  <Label>Quarto Afetado</Label>
                  <Select value={mQuarto} onValueChange={setMQuarto}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AD">Anterior Direito (AD)</SelectItem>
                      <SelectItem value="AE">Anterior Esquerdo (AE)</SelectItem>
                      <SelectItem value="PD">Posterior Direito (PD)</SelectItem>
                      <SelectItem value="PE">Posterior Esquerdo (PE)</SelectItem>
                      <SelectItem value="AD+AE">AD + AE</SelectItem>
                      <SelectItem value="PD+PE">PD + PE</SelectItem>
                      <SelectItem value="Todos">Todos os quartos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Resultado CMT</Label>
                  <Select value={mCmt} onValueChange={setMCmt}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Negativo">Negativo (−)</SelectItem>
                      <SelectItem value="Traços">Traços (±)</SelectItem>
                      <SelectItem value="1+">Fracamente positivo (+)</SelectItem>
                      <SelectItem value="2+">Positivo (++)</SelectItem>
                      <SelectItem value="3+">Fortemente positivo (+++)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Descarte de leite (dias)</Label>
                  <Input type="number" placeholder="Ex: 7" value={mDescarte} onChange={e => setMDescarte(e.target.value)} />
                </div>
              </div>

              <div>
                <Label>Tratamento / Medicação</Label>
                <Textarea
                  placeholder="Descreva o tratamento aplicado, medicamentos, dosagem..."
                  value={mTratamento}
                  onChange={e => setMTratamento(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                onClick={() => insertMastiteMutation.mutate()}
                className="w-full"
                disabled={!mAnimalId || insertMastiteMutation.isPending}
              >
                {insertMastiteMutation.isPending ? 'Salvando...' : 'Registrar Caso de Mastite'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          title="Com Mastite"
          value={flagsPorAnimal.mastite.length}
          icon={<AlertTriangle className="h-5 w-5" />}
          color="destructive"
        />
        <KPICard
          title="Usando Ocitocina"
          value={flagsPorAnimal.ocitocina.length}
          icon={<Syringe className="h-5 w-5" />}
          color="warning"
        />
        <KPICard
          title="Casos Registrados"
          value={mastitesAtivas?.length || 0}
          icon={<Stethoscope className="h-5 w-5" />}
          color="default"
        />
      </div>

      <Tabs defaultValue="mastite" className="space-y-4">
        <TabsList>
          <TabsTrigger value="mastite">Com Mastite</TabsTrigger>
          <TabsTrigger value="ocitocina">Usando Ocitocina</TabsTrigger>
          <TabsTrigger value="historico">Histórico Mastites</TabsTrigger>
        </TabsList>

        <TabsContent value="mastite">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-heading">Animais com Mastite Ativa</CardTitle>
            </CardHeader>
            <CardContent>
              {flagsPorAnimal.mastite.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-success" />
                  Nenhum animal com mastite no momento
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Animal</TableHead>
                      <TableHead>Lote</TableHead>
                      <TableHead>Desde</TableHead>
                      <TableHead>Turno</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flagsPorAnimal.mastite.map(r => (
                      <TableRow key={r.animal_id}>
                        <TableCell className="font-medium">{getAnimalLabel(r.animal_id)}</TableCell>
                        <TableCell>{getLoteNome(r.animal_id)}</TableCell>
                        <TableCell>{new Date(r.data + 'T12:00').toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="capitalize">{r.turno === 'tarde' ? 'Tarde' : 'Manhã'}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resolverFlagMutation.mutate({ animalId: r.animal_id, flag: 'com_mastite' })}
                            disabled={resolverFlagMutation.isPending}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Resolver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ocitocina">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-heading">Animais Usando Ocitocina</CardTitle>
            </CardHeader>
            <CardContent>
              {flagsPorAnimal.ocitocina.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-success" />
                  Nenhum animal usando ocitocina no momento
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Animal</TableHead>
                      <TableHead>Lote</TableHead>
                      <TableHead>Desde</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flagsPorAnimal.ocitocina.map(r => (
                      <TableRow key={r.animal_id}>
                        <TableCell className="font-medium">{getAnimalLabel(r.animal_id)}</TableCell>
                        <TableCell>{getLoteNome(r.animal_id)}</TableCell>
                        <TableCell>{new Date(r.data + 'T12:00').toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resolverFlagMutation.mutate({ animalId: r.animal_id, flag: 'usa_ocitocina' })}
                            disabled={resolverFlagMutation.isPending}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Suspender
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-heading">Histórico de Mastites</CardTitle>
            </CardHeader>
            <CardContent>
              {(!mastitesAtivas || mastitesAtivas.length === 0) ? (
                <p className="text-center py-8 text-muted-foreground">Nenhum registro de mastite encontrado</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Animal</TableHead>
                      <TableHead>Quarto</TableHead>
                      <TableHead>Início</TableHead>
                      <TableHead>CMT</TableHead>
                      <TableHead>Tratamento</TableHead>
                      <TableHead>Descarte (dias)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mastitesAtivas.map(m => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{getAnimalLabel(m.animal_id)}</TableCell>
                        <TableCell>{m.quarto || '—'}</TableCell>
                        <TableCell>{new Date(m.data_inicio + 'T12:00').toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>
                          {m.resultado_cmt ? <Badge variant="outline">{m.resultado_cmt}</Badge> : '—'}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{m.tratamento || '—'}</TableCell>
                        <TableCell>{m.descarte_dias ?? '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
