import { cap } from "@/lib/labels";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import {
  Bug, Milk, Syringe, ClipboardList, DollarSign,
  HeartPulse, Package, AlertTriangle, Clock, UserCircle, CheckCircle2,
} from 'lucide-react';
import { ReportMenu } from '@/components/ReportMenu';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Plus, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { farmModules } from '@/lib/modules';
import farmPhoto from '@/assets/fazenda/vista-geral.jpeg.asset.json';

const prioridadeColors: Record<string, string> = {
  alta: 'bg-destructive/10 text-destructive border-destructive/20',
  media: 'bg-warning/10 text-warning border-warning/20',
  baixa: 'bg-muted text-muted-foreground',
};

const moduloLabels: Record<string, string> = {
  saude: 'Saúde',
  reproducao: 'Reprodução',
  producao: 'Produção',
  geral: 'Geral',
  equipamento: 'Equipamento',
  estoque: 'Estoque',
};

export default function Dashboard() {
  const { profile } = useAuth();

  const { data: animaisCount } = useQuery({
    queryKey: ['animais-count'],
    queryFn: async () => {
      const { count } = await supabase.from('animais').select('*', { count: 'exact', head: true }).eq('status', 'ativo');
      return count || 0;
    },
  });

  const { data: tarefasPendentes } = useQuery({
    queryKey: ['tarefas-pendentes'],
    queryFn: async () => {
      const { count } = await supabase.from('tarefas').select('*', { count: 'exact', head: true }).in('status', ['pendente', 'em_andamento']);
      return count || 0;
    },
  });

  const { data: producaoHoje } = useQuery({
    queryKey: ['producao-hoje'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase.from('producao_leite_diaria').select('litros').eq('data', today);
      return data?.reduce((acc, r) => acc + Number(r.litros), 0) || 0;
    },
  });

  const { data: tarefasAtrasadas } = useQuery({
    queryKey: ['tarefas-atrasadas'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase
        .from('tarefas')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pendente', 'em_andamento'])
        .lt('prazo', today);
      return count || 0;
    },
  });

  const { data: proximasTarefas } = useQuery({
    queryKey: ['proximas-tarefas-dash'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('tarefas')
        .select('*')
        .in('status', ['pendente', 'em_andamento'])
        .order('prazo', { ascending: true, nullsFirst: false })
        .limit(10);
      return data || [];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ['profiles-dash'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('id, nome, email').eq('ativo', true);
      return data || [];
    },
  });

  const getColaboradorNome = (id: string | null) => {
    if (!id) return 'Sem responsável';
    const p = profiles?.find(p => p.id === id);
    return p?.nome || p?.email || 'Usuário';
  };

  const isAtrasada = (prazo: string | null, status: string | null) => {
    if (!prazo || status === 'concluida' || status === 'nao_realizada') return false;
    return new Date(prazo) < new Date();
  };

  const formatPrazo = (prazo: string | null) => {
    if (!prazo) return 'Sem prazo';
    const d = new Date(prazo + 'T12:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return `${Math.abs(diff)}d atrasada`;
    if (diff === 0) return 'Hoje';
    if (diff === 1) return 'Amanhã';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="space-y-8 md:space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 className="text-3xl font-heading font-bold md:text-4xl">Olá{profile?.nome ? `, ${profile.nome.split(' ')[0]}` : ''}<span className="text-secondary">.</span></h1>
          <p className="mt-2 text-sm text-muted-foreground">Sua fazenda, de ponta a ponta.</p>
        </div>
        <ReportMenu config={{
          title: 'Relatório Geral — Dashboard',
          subtitle: `Gerado em ${new Date().toLocaleDateString('pt-BR')}`,
          columns: [
            { header: 'Indicador', key: 'indicador', width: 30 },
            { header: 'Valor', key: 'valor', width: 20 },
          ],
          data: [
            { indicador: 'Produção Hoje (kg)', valor: producaoHoje?.toFixed(1) || '0' },
            { indicador: 'Animais Ativos', valor: animaisCount || 0 },
            { indicador: 'Tarefas Pendentes', valor: tarefasPendentes || 0 },
            { indicador: 'Tarefas Atrasadas', valor: tarefasAtrasadas || 0 },
          ],
          kpis: [
            { label: 'Produção Hoje', value: `${producaoHoje?.toFixed(1) || '0'} kg` },
            { label: 'Animais Ativos', value: animaisCount || 0 },
            { label: 'Tarefas Pendentes', value: tarefasPendentes || 0 },
            { label: 'Tarefas Atrasadas', value: tarefasAtrasadas || 0 },
          ],
        }} />
      </div>

      <section aria-label="Indicadores de hoje" className="overview-metrics grid grid-cols-2 rounded-lg border bg-card lg:grid-cols-4">
        {[
          { label: 'Produção hoje', value: producaoHoje?.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) || '0', unit: 'L', icon: Milk },
          { label: 'Animais ativos', value: animaisCount ?? 0, unit: '', icon: Bug },
          { label: 'Tarefas pendentes', value: tarefasPendentes ?? 0, unit: '', icon: ClipboardList },
          { label: 'Tarefas atrasadas', value: tarefasAtrasadas ?? 0, unit: '', icon: AlertTriangle },
        ].map(metric => <div key={metric.label} className="min-w-0 p-4 md:p-6"><div className="flex items-center gap-2 text-muted-foreground"><metric.icon className="h-4 w-4 shrink-0" /><p className="text-xs font-medium">{metric.label}</p></div><p className="mt-4 text-3xl font-bold tabular-nums md:text-4xl">{metric.value}<span className="ml-1.5 text-sm font-medium text-muted-foreground">{metric.unit}</span></p></div>)}
      </section>

      <section aria-label="Módulos" className="space-y-4">
        <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Módulos</h2><Button asChild variant="link" className="h-9 px-0 text-xs"><Link to="/modulos">Ver todos <ArrowRight /></Link></Button></div>
        <div className="module-nav flex gap-3 overflow-x-auto pb-2">
          {farmModules.map(module => <Button asChild key={module.id} variant="outline" className="group h-auto w-[148px] shrink-0 justify-start bg-card p-4 hover:border-secondary hover:bg-card md:w-[154px]"><Link to={`/modulos/${module.id}`} className="flex flex-col !items-start gap-4"><span className="flex w-full items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/15 text-primary"><module.icon className="!h-5 !w-5" /></span><ArrowUpRight className="text-muted-foreground" /></span><span className="text-sm font-semibold">{module.title}</span></Link></Button>)}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-10">
        {/* Próximas Tarefas */}
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold">Próximas tarefas <span className="ml-1 text-sm font-normal text-muted-foreground">/ {tarefasPendentes ?? 0}</span></h2>
            <Button asChild variant="link" className="h-9 px-0 text-xs"><Link to="/tarefas">Ver todas <ArrowRight /></Link></Button>
          </div>
          <div>
            {proximasTarefas && proximasTarefas.length > 0 ? (
              <div className="divide-y border-y">
                {proximasTarefas.map(t => (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between gap-3 py-4 ${isAtrasada(t.prazo, t.status) ? 'text-destructive' : ''}`}
                  >
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link to="/tarefas" className="text-sm font-semibold text-foreground hover:underline">{t.titulo}</Link>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${prioridadeColors[t.prioridade || 'media']}`}>
                          {cap(t.prioridade)}
                        </Badge>
                        {t.modulo_relacionado && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {moduloLabels[t.modulo_relacionado] || t.modulo_relacionado}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <UserCircle className="h-3 w-3" />
                          {getColaboradorNome(t.colaborador_id)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <span className={`text-xs font-medium ${isAtrasada(t.prazo, t.status) ? 'text-destructive' : 'text-muted-foreground'}`}>
                        <Clock className="h-3 w-3 inline mr-1" />
                        {formatPrazo(t.prazo)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-48 flex-col items-center justify-center gap-3 border-y text-muted-foreground">
                <div className="text-center">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-3 text-success" />
                  <p className="text-sm font-medium text-foreground">Tudo em dia por aqui</p>
                  <p className="mt-1 text-xs">Nenhuma tarefa pendente</p>
                </div>
                <Button asChild variant="outline" size="sm"><Link to="/tarefas"><Plus />Tarefas</Link></Button>
              </div>
            )}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild variant="default"><Link to="/producao-leite"><Milk />Registrar leite</Link></Button>
            <Button asChild variant="outline"><Link to="/animais/novo"><Plus />Cadastrar animal</Link></Button>
          </div>
        </section>

        {/* Ações Rápidas */}
        <aside className="space-y-6">
          <Link to="/mapa" className="group relative block aspect-[16/9] overflow-hidden rounded-lg bg-primary">
            <img src={farmPhoto.url} alt="Vista aérea da Fazenda Miraí" className="farm-photo h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <span className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-md bg-card/95 px-4 py-3 text-foreground"><span className="flex items-center gap-2 text-sm font-semibold"><Map className="h-4 w-4 text-primary" />Fazenda Miraí</span><ArrowUpRight className="h-4 w-4" /></span>
          </Link>
          <section>
          <h2 className="mb-3 text-lg font-bold">Acessos rápidos</h2>
          <div className="grid grid-cols-2 gap-x-4">
            {[
              { label: 'Registrar Leite', icon: Milk, path: '/producao-leite' },
              { label: 'Cadastrar Animal', icon: Bug, path: '/animais/novo' },
              { label: 'Nova Vacinação', icon: Syringe, path: '/vacinacao' },
              { label: 'Novo Tratamento', icon: HeartPulse, path: '/tratamentos' },
              { label: 'Lançamento', icon: DollarSign, path: '/financeiro' },
              { label: 'Ver Estoque', icon: Package, path: '/estoque' },
            ].map((action) => (
              <Button asChild variant="ghost"
                key={action.path}
                className="h-auto justify-start whitespace-normal rounded-none border-b px-0 py-4 text-left hover:bg-transparent hover:text-primary"
              >
                <Link to={action.path}><action.icon className="h-5 w-5 shrink-0 text-muted-foreground" /><span className="text-xs font-medium">{action.label}</span></Link>
              </Button>
            ))}
          </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
