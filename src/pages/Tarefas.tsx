import { cap } from "@/lib/labels";
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Clock, AlertTriangle, CheckCircle2, Trash2, UserCircle, BarChart3, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { ReportMenu } from '@/components/ReportMenu';

const prioridadeColors: Record<string, string> = {
  alta: 'bg-destructive/10 text-destructive border-destructive/20',
  media: 'bg-warning/10 text-warning border-warning/20',
  baixa: 'bg-muted text-muted-foreground',
};

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  nao_realizada: 'Não realizada',
};

const moduloLabels: Record<string, string> = {
  saude: 'Saúde',
  reproducao: 'Reprodução',
  producao: 'Produção',
  geral: 'Geral',
  equipamento: 'Equipamento',
  estoque: 'Estoque',
};

export default function Tarefas() {
  const { isGestorOrAdmin, user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState('media');
  const [prazo, setPrazo] = useState('');
  const [colaboradorId, setColaboradorId] = useState('');
  const [moduloRelacionado, setModuloRelacionado] = useState('geral');
  const [filtroStatus, setFiltroStatus] = useState('pendente');

  const { data: profiles } = useQuery({
    queryKey: ['profiles-list'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('id, nome, email').eq('ativo', true).order('nome');
      return data || [];
    },
  });

  const { data: tarefas, isLoading } = useQuery({
    queryKey: ['tarefas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tarefas')
        .select('*')
        .order('prazo', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('tarefas').insert({
        titulo,
        descricao: descricao || null,
        prioridade,
        prazo: prazo || null,
        colaborador_id: colaboradorId || null,
        modulo_relacionado: moduloRelacionado || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas'] });
      toast.success('Tarefa criada!');
      setOpen(false);
      setTitulo('');
      setDescricao('');
      setPrazo('');
      setColaboradorId('');
      setModuloRelacionado('geral');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('tarefas').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas'] });
      toast.success('Status atualizado!');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tarefas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas'] });
      toast.success('Tarefa excluída!');
    },
  });

  const isAtrasada = (prazo: string | null, status: string | null) => {
    if (!prazo || status === 'concluida' || status === 'nao_realizada') return false;
    return new Date(prazo) < new Date();
  };

  const filteredTarefas = tarefas?.filter(t => {
    if (filtroStatus === 'todas') return true;
    if (filtroStatus === 'atrasadas') return isAtrasada(t.prazo, t.status);
    return t.status === filtroStatus;
  });

  const getColaboradorNome = (id: string | null) => {
    if (!id) return 'Sem responsável';
    const p = profiles?.find(p => p.id === id);
    return p?.nome || p?.email || 'Usuário';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Tarefas</h1>
          <p className="text-muted-foreground">Gestão de atividades da fazenda</p>
        </div>
        <div className="flex gap-2">
          <ReportMenu config={{
            title: 'Relatório de Tarefas',
            columns: [
              { header: 'Título', key: 'titulo', width: 30 },
              { header: 'Status', key: 'status' },
              { header: 'Prioridade', key: 'prioridade' },
              { header: 'Prazo', key: 'prazo' },
              { header: 'Módulo', key: 'modulo_relacionado' },
            ],
            data: (tarefas || []).map(t => ({
              ...t,
              status: statusLabels[t.status || ''] || t.status,
              modulo_relacionado: moduloLabels[t.modulo_relacionado || ''] || t.modulo_relacionado,
            })),
            kpis: [
              { label: 'Total', value: tarefas?.length || 0 },
              { label: 'Pendentes', value: tarefas?.filter(t => t.status === 'pendente').length || 0 },
              { label: 'Em andamento', value: tarefas?.filter(t => t.status === 'em_andamento').length || 0 },
              { label: 'Concluídas', value: tarefas?.filter(t => t.status === 'concluida').length || 0 },
            ],
          }} />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
            <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <Plus className="h-4 w-4 mr-2" /> Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Tarefa</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="O que precisa ser feito?" />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Detalhes da tarefa" />
              </div>
              <div className="space-y-2">
                <Label>Atribuir para</Label>
                <Select value={colaboradorId || 'none'} onValueChange={v => setColaboradorId(v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem responsável</SelectItem>
                    {profiles?.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nome || p.email || 'Usuário'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select value={prioridade} onValueChange={setPrioridade}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="baixa">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Módulo</Label>
                  <Select value={moduloRelacionado} onValueChange={setModuloRelacionado}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="geral">Geral</SelectItem>
                      <SelectItem value="saude">Saúde</SelectItem>
                      <SelectItem value="reproducao">Reprodução</SelectItem>
                      <SelectItem value="producao">Produção</SelectItem>
                      <SelectItem value="equipamento">Equipamento</SelectItem>
                      <SelectItem value="estoque">Estoque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prazo</Label>
                  <Input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
                </div>
              </div>
              <Button onClick={() => createMutation.mutate()} disabled={!titulo || createMutation.isPending} className="w-full bg-secondary text-secondary-foreground">
                {createMutation.isPending ? 'Criando...' : 'Criar Tarefa'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Filtros */}
      <Tabs value={filtroStatus} onValueChange={setFiltroStatus}>
        <TabsList>
          <TabsTrigger value="pendente">Pendentes</TabsTrigger>
          <TabsTrigger value="em_andamento">Em Andamento</TabsTrigger>
          <TabsTrigger value="concluida">Concluídas</TabsTrigger>
          <TabsTrigger value="atrasadas">Atrasadas</TabsTrigger>
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="equipe">👥 Equipe</TabsTrigger>
          <TabsTrigger value="produtividade">📊 Produtividade</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtroStatus === 'produtividade' ? (
        <ProdutividadeView tarefas={tarefas || []} profiles={profiles || []} isAtrasada={isAtrasada} />
      ) : filtroStatus === 'equipe' ? (
        <EquipeView
          tarefas={tarefas || []}
          profiles={profiles || []}
          isAtrasada={isAtrasada}
          updateStatus={updateStatus}
          deleteMutation={deleteMutation}
          isGestorOrAdmin={isGestorOrAdmin}
        />
      ) : (
        <div className="space-y-3">
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Carregando...</p>
          ) : filteredTarefas && filteredTarefas.length > 0 ? (
            filteredTarefas.map((t) => (
              <Card key={t.id} className={isAtrasada(t.prazo, t.status) ? 'border-destructive/50' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium">{t.titulo}</h3>
                        <Badge variant="outline" className={prioridadeColors[t.prioridade || 'media']}>{cap(t.prioridade)}</Badge>
                        {t.modulo_relacionado && (
                          <Badge variant="secondary" className="text-xs">
                            {moduloLabels[t.modulo_relacionado] || t.modulo_relacionado}
                          </Badge>
                        )}
                        {isAtrasada(t.prazo, t.status) && <Badge variant="destructive" className="text-xs">Atrasada</Badge>}
                      </div>
                      {t.descricao && <p className="text-sm text-muted-foreground">{t.descricao}</p>}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {t.prazo && <span>Prazo: {new Date(t.prazo + 'T12:00').toLocaleDateString('pt-BR')}</span>}
                        <span className="flex items-center gap-1">
                          <UserCircle className="h-3 w-3" />
                          {getColaboradorNome(t.colaborador_id)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={t.status || 'pendente'} onValueChange={(v) => updateStatus.mutate({ id: t.id, status: v })}>
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="em_andamento">Em andamento</SelectItem>
                          <SelectItem value="concluida">Concluída</SelectItem>
                          <SelectItem value="nao_realizada">Não realizada</SelectItem>
                        </SelectContent>
                      </Select>
                      {isGestorOrAdmin && (
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(t.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-8">Nenhuma tarefa nesta categoria</p>
          )}
        </div>
      )}
    </div>
  );
}

function EquipeView({ tarefas, profiles, isAtrasada, updateStatus, deleteMutation, isGestorOrAdmin }: {
  tarefas: any[];
  profiles: { id: string; nome: string; email: string | null }[];
  isAtrasada: (prazo: string | null, status: string | null) => boolean;
  updateStatus: any;
  deleteMutation: any;
  isGestorOrAdmin: boolean;
}) {
  const ativas = tarefas.filter(t => t.status === 'pendente' || t.status === 'em_andamento');

  const porPessoa: Record<string, { nome: string; tarefas: any[] }> = {};

  // Group by collaborator
  ativas.forEach(t => {
    const key = t.colaborador_id || 'sem_responsavel';
    if (!porPessoa[key]) {
      const p = profiles.find(p => p.id === t.colaborador_id);
      porPessoa[key] = {
        nome: p?.nome || p?.email || 'Sem responsável',
        tarefas: [],
      };
    }
    porPessoa[key].tarefas.push(t);
  });

  // Sort: people with more tasks first, "sem_responsavel" last
  const sorted = Object.entries(porPessoa).sort((a, b) => {
    if (a[0] === 'sem_responsavel') return 1;
    if (b[0] === 'sem_responsavel') return -1;
    return b[1].tarefas.length - a[1].tarefas.length;
  });

  return (
    <div className="space-y-6">
      {sorted.map(([key, grupo]) => {
        const atrasadas = grupo.tarefas.filter(t => isAtrasada(t.prazo, t.status)).length;
        const emAndamento = grupo.tarefas.filter(t => t.status === 'em_andamento').length;

        return (
          <Card key={key}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-full bg-secondary/20 flex items-center justify-center">
                    <UserCircle className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{grupo.nome}</h3>
                    <p className="text-xs text-muted-foreground">
                      {grupo.tarefas.length} tarefa(s) ativa(s)
                      {emAndamento > 0 && ` · ${emAndamento} em andamento`}
                      {atrasadas > 0 && ` · ${atrasadas} atrasada(s)`}
                    </p>
                  </div>
                </div>
                {atrasadas > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {atrasadas} atrasada(s)
                  </Badge>
                )}
              </div>

              <div className="space-y-2 pl-11">
                {grupo.tarefas
                  .sort((a: any, b: any) => {
                    if (!a.prazo) return 1;
                    if (!b.prazo) return -1;
                    return new Date(a.prazo).getTime() - new Date(b.prazo).getTime();
                  })
                  .map((t: any) => (
                    <div
                      key={t.id}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-sm ${isAtrasada(t.prazo, t.status) ? 'border-destructive/40 bg-destructive/5' : 'hover:bg-muted/50'}`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="truncate">{t.titulo}</span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${
                          t.prioridade === 'alta' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                          t.prioridade === 'baixa' ? 'bg-muted text-muted-foreground' :
                          'bg-warning/10 text-warning border-warning/20'
                        }`}>
                          {cap(t.prioridade)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {t.prazo && (
                          <span className={`text-xs ${isAtrasada(t.prazo, t.status) ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                            {new Date(t.prazo + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </span>
                        )}
                        <Select value={t.status || 'pendente'} onValueChange={(v) => updateStatus.mutate({ id: t.id, status: v })}>
                          <SelectTrigger className="w-32 h-7 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="em_andamento">Em andamento</SelectItem>
                            <SelectItem value="concluida">Concluída</SelectItem>
                            <SelectItem value="nao_realizada">Não realizada</SelectItem>
                          </SelectContent>
                        </Select>
                        {isGestorOrAdmin && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(t.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {sorted.length === 0 && (
        <p className="text-muted-foreground text-center py-8">Nenhuma tarefa ativa no momento</p>
      )}
    </div>
  );
}

function ProdutividadeView({ tarefas, profiles, isAtrasada }: {
  tarefas: any[];
  profiles: { id: string; nome: string; email: string | null }[];
  isAtrasada: (prazo: string | null, status: string | null) => boolean;
}) {
  const [mesSelecionado, setMesSelecionado] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const stats = useMemo(() => {
    const [ano, mes] = mesSelecionado.split('-').map(Number);
    const inicioMes = new Date(ano, mes - 1, 1);
    const fimMes = new Date(ano, mes, 0, 23, 59, 59);

    // All collaborator IDs from profiles
    const collabIds = new Set<string>();
    profiles.forEach(p => collabIds.add(p.id));
    tarefas.forEach(t => { if (t.colaborador_id) collabIds.add(t.colaborador_id); });

    return Array.from(collabIds).map(collabId => {
      const profile = profiles.find(p => p.id === collabId);
      const nome = profile?.nome || profile?.email || 'Usuário';

      // Tasks assigned to this collaborator
      const tarefasCollab = tarefas.filter(t => t.colaborador_id === collabId);

      // Completed this month (updated_at in this month and status concluida)
      const concluidasMes = tarefasCollab.filter(t => {
        if (t.status !== 'concluida') return false;
        const updated = new Date(t.updated_at);
        return updated >= inicioMes && updated <= fimMes;
      }).length;

      // Overdue (had prazo in this month or before, and not completed)
      const atrasadasMes = tarefasCollab.filter(t => {
        if (!t.prazo) return false;
        const prazoDate = new Date(t.prazo);
        return prazoDate <= fimMes && isAtrasada(t.prazo, t.status);
      }).length;

      // In progress
      const emAndamento = tarefasCollab.filter(t => t.status === 'em_andamento').length;

      // Pending
      const pendentes = tarefasCollab.filter(t => t.status === 'pendente').length;

      // Total assigned this month (created this month)
      const criadasMes = tarefasCollab.filter(t => {
        const created = new Date(t.created_at);
        return created >= inicioMes && created <= fimMes;
      }).length;

      const totalRelevante = concluidasMes + atrasadasMes;
      const taxaCumprimento = totalRelevante > 0 ? Math.round((concluidasMes / totalRelevante) * 100) : 0;

      return {
        id: collabId,
        nome,
        concluidasMes,
        atrasadasMes,
        emAndamento,
        pendentes,
        criadasMes,
        taxaCumprimento,
        totalAtivas: tarefasCollab.filter(t => t.status !== 'concluida' && t.status !== 'nao_realizada').length,
      };
    }).filter(s => s.concluidasMes > 0 || s.atrasadasMes > 0 || s.totalAtivas > 0)
      .sort((a, b) => b.concluidasMes - a.concluidasMes);
  }, [tarefas, profiles, mesSelecionado, isAtrasada]);

  const meses = useMemo(() => {
    const result = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      result.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
    return result;
  }, []);

  const totais = useMemo(() => {
    const concluidas = stats.reduce((s, c) => s + c.concluidasMes, 0);
    const atrasadas = stats.reduce((s, c) => s + c.atrasadasMes, 0);
    const total = concluidas + atrasadas;
    return { concluidas, atrasadas, taxa: total > 0 ? Math.round((concluidas / total) * 100) : 0 };
  }, [stats]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-heading font-semibold">Produtividade Mensal</h2>
        </div>
        <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            {meses.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{totais.concluidas}</p>
            <p className="text-xs text-muted-foreground">Concluídas no mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{totais.atrasadas}</p>
            <p className="text-xs text-muted-foreground">Atrasadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-2xl font-bold">{totais.taxa}%</p>
            </div>
            <p className="text-xs text-muted-foreground">Taxa de cumprimento</p>
          </CardContent>
        </Card>
      </div>

      {/* Per-collaborator breakdown */}
      <div className="space-y-3">
        {stats.map(s => (
          <Card key={s.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-full bg-secondary/20 flex items-center justify-center">
                    <UserCircle className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{s.nome}</h3>
                    <p className="text-xs text-muted-foreground">
                      {s.criadasMes} atribuída(s) no mês · {s.totalAtivas} ativa(s) agora
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold">{s.taxaCumprimento}%</span>
                  <p className="text-xs text-muted-foreground">cumprimento</p>
                </div>
              </div>

              <Progress value={s.taxaCumprimento} className="h-2 mb-3" />

              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded-lg bg-green-50 dark:bg-green-500/10">
                  <p className="text-sm font-bold text-green-600">{s.concluidasMes}</p>
                  <p className="text-[10px] text-muted-foreground">Concluídas</p>
                </div>
                <div className="p-2 rounded-lg bg-destructive/5">
                  <p className="text-sm font-bold text-destructive">{s.atrasadasMes}</p>
                  <p className="text-[10px] text-muted-foreground">Atrasadas</p>
                </div>
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10">
                  <p className="text-sm font-bold text-blue-600">{s.emAndamento}</p>
                  <p className="text-[10px] text-muted-foreground">Em andamento</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <p className="text-sm font-bold">{s.pendentes}</p>
                  <p className="text-[10px] text-muted-foreground">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {stats.length === 0 && (
          <p className="text-muted-foreground text-center py-8">Nenhum dado de produtividade para este mês</p>
        )}
      </div>
    </div>
  );
}
